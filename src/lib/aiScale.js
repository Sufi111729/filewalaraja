import { analyzeQuality, enhancePhotoCanvas, getAutoEnhancePreset } from "../features/photoEnhance/photoEnhance";

const KB = 1024;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function formatBytes(value) {
  if (!Number.isFinite(value)) return "0 KB";
  if (value < KB) return `${value} B`;
  if (value < KB * KB) return `${(value / KB).toFixed(1)} KB`;
  return `${(value / (KB * KB)).toFixed(2)} MB`;
}

export function fileToObjectUrl(file) {
  return URL.createObjectURL(file);
}

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image."));
    };
    image.src = url;
  });
}

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to export image."))),
      mimeType,
      quality
    );
  });
}

function drawImageToCanvas(image) {
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  return canvas;
}

function highQualityResize(sourceCanvas, targetWidth, targetHeight) {
  let currentCanvas = sourceCanvas;
  let currentWidth = sourceCanvas.width;
  let currentHeight = sourceCanvas.height;

  while (currentWidth < targetWidth || currentHeight < targetHeight) {
    const nextWidth = Math.min(targetWidth, Math.max(currentWidth + 1, Math.round(currentWidth * 1.5)));
    const nextHeight = Math.min(targetHeight, Math.max(currentHeight + 1, Math.round(currentHeight * 1.5)));
    const tempCanvas = createCanvas(nextWidth, nextHeight);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = "high";
    tempCtx.drawImage(currentCanvas, 0, 0, currentWidth, currentHeight, 0, 0, nextWidth, nextHeight);
    currentCanvas = tempCanvas;
    currentWidth = nextWidth;
    currentHeight = nextHeight;
    if (currentWidth === targetWidth && currentHeight === targetHeight) return currentCanvas;
  }

  while (currentWidth * 0.5 > targetWidth && currentHeight * 0.5 > targetHeight) {
    const nextWidth = Math.max(targetWidth, Math.round(currentWidth * 0.5));
    const nextHeight = Math.max(targetHeight, Math.round(currentHeight * 0.5));
    const tempCanvas = createCanvas(nextWidth, nextHeight);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = "high";
    tempCtx.drawImage(currentCanvas, 0, 0, currentWidth, currentHeight, 0, 0, nextWidth, nextHeight);
    currentCanvas = tempCanvas;
    currentWidth = nextWidth;
    currentHeight = nextHeight;
  }

  const finalCanvas = createCanvas(targetWidth, targetHeight);
  const finalCtx = finalCanvas.getContext("2d");
  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = "high";
  finalCtx.drawImage(currentCanvas, 0, 0, currentWidth, currentHeight, 0, 0, targetWidth, targetHeight);
  return finalCanvas;
}

function applyFaceFriendlyFinish(canvas, intensity = 0.35) {
  const finished = createCanvas(canvas.width, canvas.height);
  const ctx = finished.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const contrast = 1 + intensity * 0.08;
  const saturate = 1 + intensity * 0.04;
  ctx.filter = `contrast(${contrast}) saturate(${saturate})`;
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";
  return finished;
}

async function findBlobNearTarget(canvas, mimeType, targetBytes) {
  let low = 0.45;
  let high = 0.95;
  let bestBlob = await canvasToBlob(canvas, mimeType, high);
  let bestDelta = Math.abs(bestBlob.size - targetBytes);

  for (let i = 0; i < 10; i += 1) {
    const quality = (low + high) / 2;
    const blob = await canvasToBlob(canvas, mimeType, quality);
    const delta = Math.abs(blob.size - targetBytes);

    if (delta < bestDelta) {
      bestBlob = blob;
      bestDelta = delta;
    }

    if (blob.size > targetBytes) {
      high = quality;
    } else {
      low = quality;
    }
  }

  return bestBlob;
}

function mimeToExtension(mimeType) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

export async function processAiScale({
  file,
  mode,
  preset,
  customWidth,
  customHeight,
  targetKb,
  outputMimeType
}) {
  const image = await loadImageFromFile(file);
  const sourceCanvas = drawImageToCanvas(image);
  const aspectRatio = image.width / image.height;

  let targetWidth = image.width;
  let targetHeight = image.height;

  if (mode === "upscale") {
    if (preset === "2x") {
      targetWidth = image.width * 2;
      targetHeight = image.height * 2;
    } else if (preset === "4x") {
      targetWidth = image.width * 4;
      targetHeight = image.height * 4;
    } else {
      targetWidth = Math.max(image.width, Number(customWidth) || image.width);
      targetHeight = Math.max(image.height, Number(customHeight) || Math.round(targetWidth / aspectRatio));
    }
  } else if (preset === "50") {
    targetWidth = Math.max(1, Math.round(image.width * 0.5));
    targetHeight = Math.max(1, Math.round(image.height * 0.5));
  } else if (preset === "25") {
    targetWidth = Math.max(1, Math.round(image.width * 0.25));
    targetHeight = Math.max(1, Math.round(image.height * 0.25));
  } else {
    targetWidth = Math.min(image.width, Number(customWidth) || image.width);
    targetHeight = Math.min(image.height, Number(customHeight) || Math.round(targetWidth / aspectRatio));
  }

  let resultCanvas = highQualityResize(sourceCanvas, targetWidth, targetHeight);

  if (mode === "upscale") {
    const qualityReport = analyzeQuality(resultCanvas);
    const presetValues = getAutoEnhancePreset(qualityReport);
    resultCanvas = await enhancePhotoCanvas(resultCanvas, {
      ...presetValues,
      sharpness: clamp(presetValues.sharpness + 8, 0, 100),
      clarity: clamp(presetValues.clarity + 10, 0, 100),
      denoise: clamp(presetValues.denoise + 4, 0, 100)
    });
    resultCanvas = applyFaceFriendlyFinish(resultCanvas);
  }

  let blob = await canvasToBlob(resultCanvas, outputMimeType, outputMimeType === "image/png" ? undefined : 0.92);

  if (mode === "downscale" && targetKb) {
    const targetBytes = Math.max(5 * KB, Number(targetKb) * KB);
    blob = await findBlobNearTarget(resultCanvas, outputMimeType, targetBytes);

    if (blob.size > targetBytes * 1.08) {
      let shrinkingCanvas = resultCanvas;
      for (let i = 0; i < 6 && blob.size > targetBytes * 1.08; i += 1) {
        shrinkingCanvas = highQualityResize(shrinkingCanvas, shrinkingCanvas.width * 0.92, shrinkingCanvas.height * 0.92);
        blob = await findBlobNearTarget(shrinkingCanvas, outputMimeType, targetBytes);
        resultCanvas = shrinkingCanvas;
      }
    }
  }

  return {
    blob,
    width: resultCanvas.width,
    height: resultCanvas.height,
    outputMimeType,
    outputExtension: mimeToExtension(outputMimeType)
  };
}

export function downloadProcessedBlob(blob, filenameBase, extension) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filenameBase}.${extension}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
