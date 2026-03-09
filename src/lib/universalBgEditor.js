export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function canvasToBlob(canvas, type = "image/png", quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to export image."));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

export function downloadBlobFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function copyMask(mask) {
  return new Uint8ClampedArray(mask);
}

export function alphaDataToMask(alphaData) {
  const mask = new Uint8ClampedArray(alphaData.length / 4);
  for (let i = 0; i < mask.length; i += 1) {
    mask[i] = alphaData[i * 4 + 3];
  }
  return mask;
}

export function maskToImageData(mask, width, height) {
  const imageData = new ImageData(width, height);
  for (let i = 0; i < mask.length; i += 1) {
    const p = i * 4;
    imageData.data[p] = 255;
    imageData.data[p + 1] = 255;
    imageData.data[p + 2] = 255;
    imageData.data[p + 3] = mask[i];
  }
  return imageData;
}

export function buildTransparentCanvas(sourceCanvas, mask) {
  const out = document.createElement("canvas");
  out.width = sourceCanvas.width;
  out.height = sourceCanvas.height;
  const ctx = out.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(sourceCanvas, 0, 0);
  const imageData = ctx.getImageData(0, 0, out.width, out.height);
  for (let i = 0; i < mask.length; i += 1) {
    imageData.data[i * 4 + 3] = mask[i];
  }
  ctx.putImageData(imageData, 0, 0);
  return out;
}

export async function loadImageFileToCanvas(file, options = {}) {
  const maxEdge = options.maxEdge || 1600;
  const image = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image."));
    };
    img.src = url;
  });

  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, width, height);
  return canvas;
}

export function getDisplayMetrics(canvasWidth, canvasHeight, imageWidth, imageHeight, zoom, pan) {
  const fitScale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
  const scale = fitScale * zoom;
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const offsetX = (canvasWidth - drawWidth) / 2 + pan.x;
  const offsetY = (canvasHeight - drawHeight) / 2 + pan.y;
  return { scale, drawWidth, drawHeight, offsetX, offsetY };
}

export function clientToImagePoint(clientX, clientY, rect, metrics, imageWidth, imageHeight) {
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const imageX = (localX - metrics.offsetX) / metrics.scale;
  const imageY = (localY - metrics.offsetY) / metrics.scale;

  if (imageX < 0 || imageY < 0 || imageX > imageWidth || imageY > imageHeight) {
    return null;
  }

  return { x: imageX, y: imageY };
}

export function paintMask(mask, width, height, centerX, centerY, options) {
  const radius = clamp(options.radius || 20, 1, 200);
  const softness = clamp(options.softness ?? 0.65, 0, 1);
  const mode = options.mode === "restore" ? "restore" : "remove";
  const minX = Math.max(0, Math.floor(centerX - radius - 1));
  const maxX = Math.min(width - 1, Math.ceil(centerX + radius + 1));
  const minY = Math.max(0, Math.floor(centerY - radius - 1));
  const maxY = Math.min(height - 1, Math.ceil(centerY + radius + 1));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > radius) continue;

      const innerRadius = radius * (1 - softness * 0.92);
      const falloff = distance <= innerRadius
        ? 1
        : 1 - (distance - innerRadius) / Math.max(1, radius - innerRadius);
      const strength = clamp(falloff, 0, 1);
      const index = y * width + x;
      const current = mask[index];
      mask[index] = mode === "remove"
        ? Math.round(current * (1 - strength))
        : Math.round(current + (255 - current) * strength);
    }
  }
}
