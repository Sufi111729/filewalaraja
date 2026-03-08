function yieldToUI() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PAGE_MARGIN = 18;
const A4_TOLERANCE = 1.5;

function isAlreadyA4(width, height) {
  const directA4 = Math.abs(width - A4_WIDTH) <= A4_TOLERANCE && Math.abs(height - A4_HEIGHT) <= A4_TOLERANCE;
  const rotatedA4 = Math.abs(width - A4_HEIGHT) <= A4_TOLERANCE && Math.abs(height - A4_WIDTH) <= A4_TOLERANCE;
  return directA4 || rotatedA4;
}

let pdfLibPromise;
async function loadPdfLib() {
  if (!pdfLibPromise) {
    pdfLibPromise = import("https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm");
  }
  return pdfLibPromise;
}

export async function mergePdfFiles(files, onProgress) {
  const { PDFDocument } = await loadPdfLib();
  const mergedPdf = await PDFDocument.create();
  const skippedFiles = [];
  const selectedFiles = Array.from(files || []);

  for (let i = 0; i < selectedFiles.length; i += 1) {
    const file = selectedFiles[i];
    const maybePdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!maybePdf) {
      skippedFiles.push(file.name);
      if (onProgress) onProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      await yieldToUI();
      continue;
    }

    try {
      const fileBytes = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(fileBytes, { ignoreEncryption: false });
      const sourcePages = sourcePdf.getPages();

      for (let p = 0; p < sourcePages.length; p += 1) {
        const sourcePage = sourcePages[p];
        const { width: srcWidth, height: srcHeight } = sourcePage.getSize();
        if (isAlreadyA4(srcWidth, srcHeight)) {
          const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [p]);
          mergedPdf.addPage(copiedPage);
          continue;
        }

        const embeddedPage = await mergedPdf.embedPage(sourcePage);

        const availableWidth = A4_WIDTH - PAGE_MARGIN * 2;
        const availableHeight = A4_HEIGHT - PAGE_MARGIN * 2;
        const scale = Math.min(availableWidth / srcWidth, availableHeight / srcHeight);
        const drawWidth = srcWidth * scale;
        const drawHeight = srcHeight * scale;

        const page = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
        page.drawPage(embeddedPage, {
          x: (A4_WIDTH - drawWidth) / 2,
          y: (A4_HEIGHT - drawHeight) / 2,
          width: drawWidth,
          height: drawHeight
        });
      }
    } catch {
      skippedFiles.push(file.name);
    }

    if (onProgress) onProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
    await yieldToUI();
  }

  if (!mergedPdf.getPageCount()) {
    throw new Error("No valid PDF could be merged.");
  }

  const mergedBytes = await mergedPdf.save();
  return {
    blob: new Blob([mergedBytes], { type: "application/pdf" }),
    skippedFiles
  };
}
