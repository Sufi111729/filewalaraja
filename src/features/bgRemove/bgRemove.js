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

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function maskToCanvas(mask, w, h) {
  const c = createCanvas(w, h);
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
  const c = createCanvas(width, height);
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
  const maxEdge = 640;
  const scale = Math.min(1, maxEdge / Math.max(canvas.width, canvas.height));
  const w = Math.max(96, Math.round(canvas.width * scale));
  const h = Math.max(96, Math.round(canvas.height * scale));
  const subjectBias = clamp(Number.isFinite(options.subjectBias) ? options.subjectBias : 62, 0, 100);

  const small = createCanvas(w, h);
  const sctx = small.getContext("2d", { willReadFrequently: true });
  sctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, w, h);
  const data = sctx.getImageData(0, 0, w, h).data;

  const bg = estimateBgReferenceFromCorners(data, w, h);
  const labDistThreshold = clamp(10 + bg.mad * 2.8 + (100 - subjectBias) * 0.35, 10, 75);
  const satThreshold = clamp(0.16 + (100 - subjectBias) * 0.002, 0.12, 0.42);
  const lumaThreshold = clamp(226 - subjectBias * 0.7, 112, 236);

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
        push(y * w + x);
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

  return { hardMask, w, h };
}

async function refineMask(mask, w, h, options) {
  const smoothEdges = clamp(Number.isFinite(options.smoothEdges) ? options.smoothEdges : 6, 0, 16);
  const featherEdges = clamp(Number.isFinite(options.featherEdges) ? options.featherEdges : 4, 0, 18);
  const maskShift = clamp(Number.isFinite(options.maskShift) ? options.maskShift : 0, -12, 12);

  let refined = mask;
  const morphRadius = Math.max(1, Math.round(smoothEdges / 5));
  refined = erode(dilate(refined, w, h, morphRadius), w, h, morphRadius);

  if (maskShift > 0) {
    refined = erode(refined, w, h, Math.round(maskShift));
  } else if (maskShift < 0) {
    refined = dilate(refined, w, h, Math.round(Math.abs(maskShift)));
  }

  const soft = boxBlur(refined, w, h, Math.max(1, featherEdges));
  await yieldControl();
  return { hardMask: refined, softMask: soft };
}

function applyAlphaToCanvas(sourceCanvas, alphaData) {
  const out = createCanvas(sourceCanvas.width, sourceCanvas.height);
  const ctx = out.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(sourceCanvas, 0, 0);
  const imageData = ctx.getImageData(0, 0, out.width, out.height);
  const px = imageData.data;
  for (let i = 0; i < out.width * out.height; i += 1) {
    px[i * 4 + 3] = alphaData[i * 4 + 3];
  }
  ctx.putImageData(imageData, 0, 0);
  return out;
}

function drawSoftShadow(ctx, width, height, alphaData, options) {
  const shadowOpacity = clamp(Number.isFinite(options.shadowOpacity) ? options.shadowOpacity : 28, 0, 100) / 100;
  if (!options.addShadow || shadowOpacity <= 0) return;

  const maskCanvas = createCanvas(width, height);
  const maskCtx = maskCanvas.getContext("2d");
  const maskImage = maskCtx.createImageData(width, height);
  for (let i = 0; i < width * height; i += 1) {
    const alpha = alphaData[i * 4 + 3];
    maskImage.data[i * 4] = 0;
    maskImage.data[i * 4 + 1] = 0;
    maskImage.data[i * 4 + 2] = 0;
    maskImage.data[i * 4 + 3] = alpha;
  }
  maskCtx.putImageData(maskImage, 0, 0);

  ctx.save();
  ctx.globalAlpha = shadowOpacity;
  ctx.filter = "blur(12px)";
  ctx.drawImage(maskCanvas, 0, 10);
  ctx.restore();
}

function buildGradient(ctx, width, height, colors) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, colors?.from || "#eff6ff");
  gradient.addColorStop(1, colors?.to || "#fde68a");
  return gradient;
}

function createBlurredBackground(sourceCanvas) {
  const bg = createCanvas(sourceCanvas.width, sourceCanvas.height);
  const ctx = bg.getContext("2d");
  ctx.filter = "blur(18px) saturate(1.06)";
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.filter = "none";
  return bg;
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Custom background could not be loaded."));
    };
    img.src = url;
  });
}

export async function removeBackgroundPro(sourceCanvas, options = {}) {
  const { hardMask, w, h } = await floodFillMaskFromCorners(sourceCanvas, options);
  if (options.onProgress) options.onProgress(45);
  const refined = await refineMask(hardMask, w, h, options);
  if (options.onProgress) options.onProgress(72);

  const softAlpha = upscaleAlpha(maskToCanvas(refined.softMask, w, h), sourceCanvas.width, sourceCanvas.height);
  const transparentCanvas = applyAlphaToCanvas(sourceCanvas, softAlpha);
  if (options.onProgress) options.onProgress(100);

  return {
    transparentCanvas,
    alphaData: softAlpha
  };
}

export async function compositeRemovedBackground({
  sourceCanvas,
  transparentCanvas,
  alphaData,
  backgroundType = "transparent",
  backgroundColor = "#ffffff",
  gradientFrom = "#eff6ff",
  gradientTo = "#fde68a",
  customBackgroundFile,
  addShadow = false,
  shadowOpacity = 28
}) {
  if (backgroundType === "transparent") {
    return transparentCanvas;
  }

  const out = createCanvas(sourceCanvas.width, sourceCanvas.height);
  const ctx = out.getContext("2d");

  if (backgroundType === "blur") {
    const blurred = createBlurredBackground(sourceCanvas);
    ctx.drawImage(blurred, 0, 0);
  } else if (backgroundType === "color") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, out.width, out.height);
  } else if (backgroundType === "gradient") {
    ctx.fillStyle = buildGradient(ctx, out.width, out.height, { from: gradientFrom, to: gradientTo });
    ctx.fillRect(0, 0, out.width, out.height);
  } else if (backgroundType === "custom" && customBackgroundFile) {
    const image = await loadImageFromFile(customBackgroundFile);
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, out.width, out.height);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
  }

  drawSoftShadow(ctx, out.width, out.height, alphaData, { addShadow, shadowOpacity });
  ctx.drawImage(transparentCanvas, 0, 0);
  return out;
}
