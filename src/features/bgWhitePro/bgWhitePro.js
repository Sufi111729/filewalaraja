function yieldControl() {
  if (typeof requestIdleCallback === "function") {
    return new Promise((resolve) => requestIdleCallback(() => resolve(), { timeout: 20 }));
  }
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function srgbToLinear(v) {
  const x = v / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function xyzPivot(t) {
  return t > 0.008856 ? t ** (1 / 3) : 7.787 * t + (16 / 116);
}

function rgbToLab(r, g, b) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const x = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375;
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175;
  const z = lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041;

  const fx = xyzPivot(x / 0.95047);
  const fy = xyzPivot(y / 1.0);
  const fz = xyzPivot(z / 1.08883);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

function labDistance(p1, p2) {
  const dl = p1.l - p2.l;
  const da = p1.a - p2.a;
  const db = p1.b - p2.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

function saturation(r, g, b) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  if (mx <= 0) return 0;
  return (mx - mn) / mx;
}

function luma(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function median(values) {
  if (!values.length) return 0;
  const a = [...values].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 === 0 ? (a[mid - 1] + a[mid]) / 2 : a[mid];
}

function trimmedMean(values, trimRatio = 0.15) {
  if (!values.length) return 0;
  const a = [...values].sort((x, y) => x - y);
  const cut = Math.floor(a.length * trimRatio);
  const s = a.slice(cut, a.length - cut || a.length);
  let sum = 0;
  for (let i = 0; i < s.length; i += 1) sum += s[i];
  return sum / Math.max(1, s.length);
}

function boxBlur(src, w, h, radius) {
  if (radius <= 0) return src;
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const kernel = radius * 2 + 1;

  for (let y = 0; y < h; y += 1) {
    let acc = 0;
    for (let k = -radius; k <= radius; k += 1) {
      const x = clamp(k, 0, w - 1);
      acc += src[y * w + x];
    }
    for (let x = 0; x < w; x += 1) {
      tmp[y * w + x] = acc / kernel;
      const rx = clamp(x - radius, 0, w - 1);
      const ax = clamp(x + radius + 1, 0, w - 1);
      acc += src[y * w + ax] - src[y * w + rx];
    }
  }

  for (let x = 0; x < w; x += 1) {
    let acc = 0;
    for (let k = -radius; k <= radius; k += 1) {
      const y = clamp(k, 0, h - 1);
      acc += tmp[y * w + x];
    }
    for (let y = 0; y < h; y += 1) {
      out[y * w + x] = acc / kernel;
      const ry = clamp(y - radius, 0, h - 1);
      const ay = clamp(y + radius + 1, 0, h - 1);
      acc += tmp[ay * w + x] - tmp[ry * w + x];
    }
  }

  return out;
}

function dilate(mask, w, h, radius) {
  if (radius <= 0) return mask;
  const out = new Float32Array(mask.length);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let maxV = 0;
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          maxV = Math.max(maxV, mask[ny * w + nx]);
        }
      }
      out[y * w + x] = maxV;
    }
  }
  return out;
}

function erode(mask, w, h, radius) {
  if (radius <= 0) return mask;
  const out = new Float32Array(mask.length);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let minV = 255;
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          minV = Math.min(minV, mask[ny * w + nx]);
        }
      }
      out[y * w + x] = minV;
    }
  }
  return out;
}

function maskToCanvas(mask, w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < mask.length; i += 1) {
    const p = i * 4;
    const v = clamp(Math.round(mask[i]), 0, 255);
    img.data[p] = 255;
    img.data[p + 1] = 255;
    img.data[p + 2] = 255;
    img.data[p + 3] = v;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function upscaleAlpha(maskCanvas, width, height) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(maskCanvas, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height).data;
}

function buildCornerSeeds(width, height, patch) {
  return [
    [0, 0, patch, patch],
    [width - patch, 0, patch, patch],
    [0, height - patch, patch, patch],
    [width - patch, height - patch, patch, patch]
  ];
}

function estimateBgReferenceFromCorners(data, w, h) {
  const patch = Math.max(8, Math.floor(Math.min(w, h) * 0.13));
  const seeds = buildCornerSeeds(w, h, patch);
  const ls = [];
  const as = [];
  const bs = [];
  const dists = [];
  const labs = [];
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;
  const step = Math.max(1, Math.floor(patch / 20));

  for (let s = 0; s < seeds.length; s += 1) {
    const [sx, sy, sw, sh] = seeds[s];
    for (let y = sy; y < sy + sh; y += step) {
      for (let x = sx; x < sx + sw; x += step) {
        const p = (y * w + x) * 4;
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const lab = rgbToLab(r, g, b);
        labs.push(lab);
        rSum += r;
        gSum += g;
        bSum += b;
        count += 1;
      }
    }
  }

  const lMed = median(labs.map((v) => v.l));
  const aMed = median(labs.map((v) => v.a));
  const bMed = median(labs.map((v) => v.b));
  const center = { l: lMed, a: aMed, b: bMed };

  for (let i = 0; i < labs.length; i += 1) {
    dists.push(labDistance(labs[i], center));
    ls.push(labs[i].l);
    as.push(labs[i].a);
    bs.push(labs[i].b);
  }

  return {
    lab: {
      l: trimmedMean(ls),
      a: trimmedMean(as),
      b: trimmedMean(bs)
    },
    rgb: {
      r: rSum / Math.max(1, count),
      g: gSum / Math.max(1, count),
      b: bSum / Math.max(1, count)
    },
    mad: Math.max(0.5, median(dists.map((d) => Math.abs(d - median(dists)))))
  };
}

async function floodFillMaskFromCorners(canvas, options) {
  const strength = clamp(Number.isFinite(options.strength) ? options.strength : 60, 0, 100);
  const maxEdge = options.maxEdge || 640;
  const scale = Math.min(1, maxEdge / Math.max(canvas.width, canvas.height));
  const w = Math.max(96, Math.round(canvas.width * scale));
  const h = Math.max(96, Math.round(canvas.height * scale));

  const small = document.createElement("canvas");
  small.width = w;
  small.height = h;
  const sctx = small.getContext("2d", { willReadFrequently: true });
  sctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, w, h);
  const img = sctx.getImageData(0, 0, w, h);
  const data = img.data;

  const bg = estimateBgReferenceFromCorners(data, w, h);
  const labDistThreshold = clamp(8 + bg.mad * 2.8 + strength * 0.45, 10, 75);
  const satThreshold = clamp(0.14 + strength * 0.002, 0.12, 0.36);
  const lumaThreshold = clamp(220 - strength * 0.72, 118, 232);

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const patch = Math.max(4, Math.floor(Math.min(w, h) * 0.04));
  const cornerSeeds = [
    [0, 0],
    [w - patch, 0],
    [0, h - patch],
    [w - patch, h - patch]
  ];

  const isBackgroundPixel = (idx) => {
    const p = idx * 4;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const sat = saturation(r, g, b);
    const lum = luma(r, g, b);
    const dist = labDistance(rgbToLab(r, g, b), bg.lab);
    return dist <= labDistThreshold && (sat <= satThreshold || lum >= lumaThreshold);
  };

  const push = (idx) => {
    if (visited[idx]) return;
    if (!isBackgroundPixel(idx)) return;
    visited[idx] = 1;
    queue[tail] = idx;
    tail += 1;
  };

  for (let s = 0; s < cornerSeeds.length; s += 1) {
    const [sx, sy] = cornerSeeds[s];
    for (let y = sy; y < sy + patch; y += 1) {
      for (let x = sx; x < sx + patch; x += 1) {
        const idx = y * w + x;
        push(idx);
      }
    }
  }

  while (head < tail) {
    const idx = queue[head];
    head += 1;
    const x = idx % w;
    const y = Math.floor(idx / w);
    if (x > 0) push(idx - 1);
    if (x < w - 1) push(idx + 1);
    if (y > 0) push(idx - w);
    if (y < h - 1) push(idx + w);

    if (head % 4096 === 0) await yieldControl();
  }

  const hardMask = new Float32Array(w * h);
  for (let i = 0; i < hardMask.length; i += 1) {
    hardMask[i] = visited[i] ? 255 : 0;
  }

  return {
    hardMask,
    w,
    h,
    bgRef: bg,
    thresholds: {
      labDistThreshold,
      satThreshold,
      lumaThreshold
    }
  };
}

async function cleanAndFeatherMask(hardMask, w, h, edgeSmoothness, strength) {
  const morphRadius = Math.max(1, Math.round(1 + (strength / 100) * 1.6));
  const closed = erode(dilate(hardMask, w, h, morphRadius), w, h, morphRadius);
  const feather = clamp(Math.round(edgeSmoothness), 0, 14);
  const soft = boxBlur(closed, w, h, Math.max(1, feather));
  await yieldControl();
  return { hardMask: closed, softMask: soft };
}

function rgbDistance(r, g, b, ref) {
  const dr = r - ref.r;
  const dg = g - ref.g;
  const db = b - ref.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

async function applyShadowLift(px, hardBg, softBg, n, bgRef, thresholds, strength) {
  const lift = 0.12 + (strength / 100) * 0.8;
  const distGate = clamp(thresholds.labDistThreshold * 2.0, 30, 95);
  const satGate = clamp(thresholds.satThreshold + 0.08, 0.14, 0.44);
  const darkGate = clamp(thresholds.lumaThreshold - 10, 105, 235);

  for (let i = 0; i < n; i += 1) {
    const p = i * 4;
    const r = px[p];
    const g = px[p + 1];
    const b = px[p + 2];
    const soft = softBg[i];
    const hard = hardBg[i];
    const dist = rgbDistance(r, g, b, bgRef.rgb);
    const sat = saturation(r, g, b);
    const lum = luma(r, g, b);

    const nearBg = dist <= distGate && sat <= satGate;
    const darkBg = lum <= darkGate;
    if (hard < 0.02 && !nearBg) continue;

    const conf = Math.max(soft, nearBg ? 0.35 : 0);
    if (conf <= 0.02) continue;

    const darkness = clamp((darkGate - lum) / Math.max(1, darkGate), 0, 1);
    const k = conf * lift * (darkBg ? 0.85 + darkness * 0.8 : 0.6);
    px[p] = clamp(r + (255 - r) * k, 0, 255);
    px[p + 1] = clamp(g + (255 - g) * k, 0, 255);
    px[p + 2] = clamp(b + (255 - b) * k, 0, 255);

    if (i % 45000 === 0) await yieldControl();
  }
}

export async function makeBackgroundPureWhitePro(sourceCanvas, options = {}) {
  const strength = clamp(Number.isFinite(options.strength) ? options.strength : 60, 0, 100);
  const edgeSmoothness = clamp(Number.isFinite(options.edgeSmoothness) ? options.edgeSmoothness : 5, 0, 14);
  const shadowRemoval = clamp(Number.isFinite(options.shadowRemoval) ? options.shadowRemoval : 60, 0, 100);

  const filled = await floodFillMaskFromCorners(sourceCanvas, { ...options, strength });
  if (options.onProgress) options.onProgress(40);

  const refined = await cleanAndFeatherMask(filled.hardMask, filled.w, filled.h, edgeSmoothness, strength);
  if (options.onProgress) options.onProgress(65);

  const hardAlpha = upscaleAlpha(maskToCanvas(refined.hardMask, filled.w, filled.h), sourceCanvas.width, sourceCanvas.height);
  const softAlpha = upscaleAlpha(maskToCanvas(refined.softMask, filled.w, filled.h), sourceCanvas.width, sourceCanvas.height);

  const out = document.createElement("canvas");
  out.width = sourceCanvas.width;
  out.height = sourceCanvas.height;
  const ctx = out.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(sourceCanvas, 0, 0);
  const imageData = ctx.getImageData(0, 0, out.width, out.height);
  const px = imageData.data;

  const n = out.width * out.height;
  const bgHard = new Float32Array(n);
  const bgSoft = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    bgHard[i] = hardAlpha[i * 4 + 3] / 255;
    bgSoft[i] = softAlpha[i * 4 + 3] / 255;
  }

  if (shadowRemoval > 0) {
    await applyShadowLift(px, bgHard, bgSoft, n, filled.bgRef, filled.thresholds, shadowRemoval);
  }
  if (options.onProgress) options.onProgress(85);

  // Composite pure white background only for flood-filled background region.
  for (let i = 0; i < n; i += 1) {
    const p = i * 4;
    const soft = bgSoft[i];
    if (soft <= 0) continue;
    px[p] = clamp(px[p] * (1 - soft) + 255 * soft, 0, 255);
    px[p + 1] = clamp(px[p + 1] * (1 - soft) + 255 * soft, 0, 255);
    px[p + 2] = clamp(px[p + 2] * (1 - soft) + 255 * soft, 0, 255);
    if (i % 50000 === 0) await yieldControl();
  }

  ctx.putImageData(imageData, 0, 0);
  if (options.onProgress) options.onProgress(100);
  return out;
}
