const PDFJS_WORKER_CDN = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

let pdfJsPromise;
let pdfLibPromise;
let jsZipPromise;

export async function loadPdfJs() {
  if (pdfJsPromise) return pdfJsPromise;

  pdfJsPromise = (async () => {
    const localCandidates = ["pdfjs-dist/build/pdf.mjs", "pdfjs-dist/legacy/build/pdf.mjs"];
    for (const modPath of localCandidates) {
      try {
        const pdfjs = await import(/* @vite-ignore */ modPath);
        if (pdfjs?.GlobalWorkerOptions) {
          pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
        }
        return pdfjs;
      } catch {
        // Try next module path.
      }
    }

    const pdfjs = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs");
    if (pdfjs?.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
    }
    return pdfjs;
  })();

  return pdfJsPromise;
}

export async function loadPdfLib() {
  if (!pdfLibPromise) {
    pdfLibPromise = import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm");
  }
  return pdfLibPromise;
}

export async function loadJsZip() {
  if (!jsZipPromise) {
    jsZipPromise = import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm");
  }
  return jsZipPromise;
}

export async function getPdfPageCount(file) {
  const { PDFDocument } = await loadPdfLib();
  const bytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: false });
  return pdfDoc.getPageCount();
}

export async function renderPdfPagePreview(file, pageNumber = 1, scale = 0.25) {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.82);
}

