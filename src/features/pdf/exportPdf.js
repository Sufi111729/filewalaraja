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

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read blob."));
    reader.readAsDataURL(blob);
  });
}

async function loadJsPdf() {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
}

async function loadHtml2Canvas() {
  const mod = await import("html2canvas");
  return mod.default || mod;
}

export async function convertJpegBlobToPdfBlob(jpegBlob, width, height) {
  const jsPDF = await loadJsPdf();
  const dataUrl = await blobToDataUrl(jpegBlob);
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));

  const pdf = new jsPDF({
    orientation: safeWidth >= safeHeight ? "landscape" : "portrait",
    unit: "px",
    format: [safeWidth, safeHeight],
    compress: true
  });
  pdf.addImage(dataUrl, "JPEG", 0, 0, safeWidth, safeHeight, undefined, "FAST");
  return pdf.output("blob");
}

export async function convertImagesToSinglePdf(files, onProgress) {
  const jsPDF = await loadJsPdf();
  await yieldToUI();

  const loadedImages = [];
  const skippedFiles = [];
  for (let i = 0; i < files.length; i += 1) {
    try {
      const img = await loadImage(files[i]);
      loadedImages.push({ img, name: files[i].name });
    } catch {
      skippedFiles.push(files[i].name);
    }
    if (onProgress) onProgress(Math.round(((i + 1) / files.length) * 40));
    await yieldToUI();
  }

  if (!loadedImages.length) {
    throw new Error("No valid image could be read for PDF conversion.");
  }

  const first = loadedImages[0].img;
  const orientation = first.width >= first.height ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [Math.max(first.width, 1), Math.max(first.height, 1)],
    compress: true
  });

  for (let i = 0; i < loadedImages.length; i += 1) {
    const { img } = loadedImages[i];
    if (i > 0) {
      pdf.addPage([Math.max(img.width, 1), Math.max(img.height, 1)], img.width >= img.height ? "landscape" : "portrait");
    }

    const ratio = Math.min(
      pdf.internal.pageSize.getWidth() / img.width,
      pdf.internal.pageSize.getHeight() / img.height
    );
    const renderW = img.width * ratio;
    const renderH = img.height * ratio;
    const x = (pdf.internal.pageSize.getWidth() - renderW) / 2;
    const y = (pdf.internal.pageSize.getHeight() - renderH) / 2;

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = img.width;
    pageCanvas.height = img.height;
    const pageCtx = pageCanvas.getContext("2d");
    pageCtx.drawImage(img, 0, 0);
    const pageDataUrl = pageCanvas.toDataURL("image/jpeg", 0.98);

    pdf.addImage(pageDataUrl, "JPEG", x, y, renderW, renderH, undefined, "FAST");
    if (onProgress) onProgress(40 + Math.round(((i + 1) / loadedImages.length) * 60));
    await yieldToUI();
  }

  return {
    blob: pdf.output("blob"),
    skippedFiles
  };
}

export async function exportElementToPdfBlob(element, options = {}) {
  if (!element) throw new Error("Target element is required.");
  const html2canvas = await loadHtml2Canvas();
  const jsPDF = await loadJsPdf();
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: window.devicePixelRatio > 1 ? 2 : 1,
    ...options
  });

  const width = Math.max(1, Math.round(canvas.width));
  const height = Math.max(1, Math.round(canvas.height));
  const pdf = new jsPDF({
    orientation: width >= height ? "landscape" : "portrait",
    unit: "px",
    format: [width, height],
    compress: true
  });
  const dataUrl = canvas.toDataURL("image/jpeg", 0.98);
  pdf.addImage(dataUrl, "JPEG", 0, 0, width, height, undefined, "FAST");
  return pdf.output("blob");
}
