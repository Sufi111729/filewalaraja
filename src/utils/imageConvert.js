function yieldToUI() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, mimeType, quality = 0.95) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Conversion failed"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

export async function convertImageFile(file, targetMime, quality = 0.95) {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (targetMime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, img.width, img.height);
  await yieldToUI();

  return canvasToBlob(canvas, targetMime, quality);
}

export function getOutputName(inputName, ext) {
  const dot = inputName.lastIndexOf(".");
  const base = dot > 0 ? inputName.slice(0, dot) : inputName;
  return `${base}.${ext}`;
}
