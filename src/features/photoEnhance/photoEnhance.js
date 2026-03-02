function yieldControl() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function cloneCanvas(source) {
  const c = document.createElement("canvas");
  c.width = source.width;
  c.height = source.height;
  const ctx = c.getContext("2d");
  ctx.drawImage(source, 0, 0);
  return c;
}

function getImageData(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function putImageData(canvas, imageData) {
  const ctx = canvas.getContext("2d");
  ctx.putImageData(imageData, 0, 0);
}

function buildLumaArray(data, w, h) {
  const l = new Float32Array(w * h);
  for (let i = 0, p = 0; i < l.length; i += 1, p += 4) {
    l[i] = data[p] * 0.2126 + data[p + 1] * 0.7152 + data[p + 2] * 0.0722;
  }
  return l;
}

function computeStats(values) {
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) sum += values[i];
  const mean = sum / Math.max(1, values.length);
  let varAcc = 0;
  for (let i = 0; i < values.length; i += 1) {
    const d = values[i] - mean;
    varAcc += d * d;
  }
  const variance = varAcc / Math.max(1, values.length);
  return { mean, variance, std: Math.sqrt(variance) };
}

function boxBlurGray(src, w, h, radius) {
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
      const removeX = clamp(x - radius, 0, w - 1);
      const addX = clamp(x + radius + 1, 0, w - 1);
      acc += src[y * w + addX] - src[y * w + removeX];
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
      const removeY = clamp(y - radius, 0, h - 1);
      const addY = clamp(y + radius + 1, 0, h - 1);
      acc += tmp[addY * w + x] - tmp[removeY * w + x];
    }
  }

  return out;
}

function varianceOfLaplacian(luma, w, h) {
  const vals = [];
  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      const c = y * w + x;
      const lap = (4 * luma[c]) - luma[c - 1] - luma[c + 1] - luma[c - w] - luma[c + w];
      vals.push(lap);
    }
  }
  return computeStats(vals).variance;
}

function estimateNoise(luma, w, h) {
  const blurred = boxBlurGray(luma, w, h, 1);
  const residual = new Float32Array(luma.length);
  for (let i = 0; i < luma.length; i += 1) residual[i] = Math.abs(luma[i] - blurred[i]);
  return computeStats(residual).mean;
}

export function analyzeQuality(canvas) {
  const imageData = getImageData(canvas);
  const luma = buildLumaArray(imageData.data, canvas.width, canvas.height);
  const brightness = computeStats(luma).mean;
  const contrast = computeStats(luma).std;
  const blurScore = varianceOfLaplacian(luma, canvas.width, canvas.height);
  const noiseScore = estimateNoise(luma, canvas.width, canvas.height);
  return { blurScore, brightness, contrast, noiseScore };
}

export function getAutoEnhancePreset(report) {
  const sharpness = clamp(
    35 + (report.blurScore < 120 ? 30 : 0) + (report.blurScore < 60 ? 20 : 0),
    0,
    100
  );
  const brightness = clamp(
    50 + (report.brightness < 95 ? 18 : 0) + (report.brightness < 75 ? 10 : 0),
    0,
    100
  );
  const contrast = clamp(
    50 + (report.contrast < 42 ? 16 : 0),
    0,
    100
  );
  const denoise = clamp(
    20 + (report.noiseScore > 8 ? 18 : 0) + (report.noiseScore > 12 ? 18 : 0),
    0,
    100
  );
  const clarity = clamp(
    20 + (report.contrast < 40 ? 15 : 0),
    0,
    100
  );
  return { sharpness, brightness, contrast, denoise, clarity };
}

function applyBrightnessContrast(data, brightness, contrast) {
  const bShift = (brightness - 50) * 1.6;
  const cFactor = 1 + ((contrast - 50) / 100) * 0.85;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp((data[i] - 128) * cFactor + 128 + bShift, 0, 255);
    data[i + 1] = clamp((data[i + 1] - 128) * cFactor + 128 + bShift, 0, 255);
    data[i + 2] = clamp((data[i + 2] - 128) * cFactor + 128 + bShift, 0, 255);
  }
}

function fastEdgeAwareDenoise(data, w, h, amount) {
  const strength = clamp(amount / 100, 0, 1);
  if (strength <= 0.01) return;

  const src = new Uint8ClampedArray(data);
  const radius = strength > 0.6 ? 2 : 1;
  const edgeGate = 18 + (1 - strength) * 20;
  const blend = 0.14 + strength * 0.22;

  for (let y = radius; y < h - radius; y += 1) {
    for (let x = radius; x < w - radius; x += 1) {
      const p = (y * w + x) * 4;
      for (let c = 0; c < 3; c += 1) {
        let sum = 0;
        let weight = 0;
        const center = src[p + c];
        for (let dy = -radius; dy <= radius; dy += 1) {
          for (let dx = -radius; dx <= radius; dx += 1) {
            const np = ((y + dy) * w + (x + dx)) * 4 + c;
            const v = src[np];
            const d = Math.abs(v - center);
            if (d <= edgeGate) {
              const wgt = 1 / (1 + d);
              sum += v * wgt;
              weight += wgt;
            }
          }
        }
        const smooth = sum / Math.max(1e-6, weight);
        data[p + c] = clamp(center * (1 - blend) + smooth * blend, 0, 255);
      }
    }
  }
}

function unsharpMask(data, w, h, amount) {
  const k = clamp(amount / 100, 0, 1);
  if (k <= 0.01) return;

  const src = new Uint8ClampedArray(data);
  const lumaSrc = buildLumaArray(src, w, h);
  const blurred = boxBlurGray(lumaSrc, w, h, 1 + Math.round(k * 2));
  const sharpen = 0.35 + k * 1.05;

  for (let i = 0, p = 0; i < lumaSrc.length; i += 1, p += 4) {
    const diff = (lumaSrc[i] - blurred[i]) * sharpen;
    data[p] = clamp(data[p] + diff, 0, 255);
    data[p + 1] = clamp(data[p + 1] + diff, 0, 255);
    data[p + 2] = clamp(data[p + 2] + diff, 0, 255);
  }
}

function applyClarity(data, w, h, amount) {
  const k = clamp(amount / 100, 0, 1);
  if (k <= 0.01) return;

  const src = new Uint8ClampedArray(data);
  const lumaSrc = buildLumaArray(src, w, h);
  const local = boxBlurGray(lumaSrc, w, h, 3);
  const boost = 0.18 + k * 0.36;

  for (let i = 0, p = 0; i < lumaSrc.length; i += 1, p += 4) {
    const hp = (lumaSrc[i] - local[i]) * boost;
    data[p] = clamp(data[p] + hp, 0, 255);
    data[p + 1] = clamp(data[p + 1] + hp, 0, 255);
    data[p + 2] = clamp(data[p + 2] + hp, 0, 255);
  }
}

export async function enhancePhotoCanvas(sourceCanvas, options = {}) {
  const enhanced = cloneCanvas(sourceCanvas);
  const imageData = getImageData(enhanced);
  const data = imageData.data;
  const w = enhanced.width;
  const h = enhanced.height;

  const brightness = options.brightness ?? 50;
  const contrast = options.contrast ?? 50;
  const sharpness = options.sharpness ?? 50;
  const denoise = options.denoise ?? 20;
  const clarity = options.clarity ?? 20;
  const onProgress = typeof options.onProgress === "function" ? options.onProgress : null;

  applyBrightnessContrast(data, brightness, contrast);
  if (onProgress) onProgress(30);
  await yieldControl();

  fastEdgeAwareDenoise(data, w, h, denoise);
  if (onProgress) onProgress(55);
  await yieldControl();

  unsharpMask(data, w, h, sharpness);
  if (onProgress) onProgress(75);
  await yieldControl();

  applyClarity(data, w, h, clarity);
  if (onProgress) onProgress(92);

  putImageData(enhanced, imageData);
  if (onProgress) onProgress(100);
  return enhanced;
}
