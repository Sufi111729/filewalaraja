import { useEffect, useRef, useState } from "react";
import DocumentUploadPanel from "./components/DocumentUploadPanel";
import KbSliderEditor from "./components/KbSliderEditor";
import TopNav from "./components/TopNav";
import AppFooter from "./components/AppFooter";
import { downloadBlob } from "./lib/imageUtils";

const PDFJS_WORKER_CDN = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

async function loadPdfModule() {
  const localCandidates = ["pdfjs-dist/build/pdf.mjs", "pdfjs-dist/legacy/build/pdf.mjs"];

  for (const modPath of localCandidates) {
    try {
      const pdfjs = await import(/* @vite-ignore */ modPath);
      if (pdfjs?.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
      }
      return pdfjs;
    } catch {
      // try next path
    }
  }

  try {
    const pdfjs = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs");
    if (pdfjs?.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
    }
    return pdfjs;
  } catch {
    throw new Error("PDF engine load failed. Check internet connection and try again.");
  }
}

async function buildCanvasFromPdf(file) {
  const start = performance.now();
  const pdfjs = await loadPdfModule();
  const data = new Uint8Array(await file.arrayBuffer());

  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  const baseViewport = page.getViewport({ scale: 1 });
  const longestEdge = Math.max(baseViewport.width, baseViewport.height);
  const scale = Math.min(2, 2200 / Math.max(1, longestEdge));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport }).promise;

  return {
    canvas,
    width: canvas.width,
    height: canvas.height,
    ms: Math.round(performance.now() - start)
  };
}

export default function DocumentStandaloneApp() {
  const [file, setFile] = useState(null);
  const [baseMeta, setBaseMeta] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [finalResult, setFinalResult] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [resultStale, setResultStale] = useState(false);

  const canvasRef = useRef(null);

  const handleUploadReady = (payload) => {
    if (!payload?.file) {
      setFile(null);
      setBaseMeta(null);
      setFinalResult((prev) => {
        if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return null;
      });
      canvasRef.current = null;
      setError("");
      setStep(1);
      return;
    }

    setFile(payload.file);
    setBaseMeta(null);
    setFinalResult((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
    canvasRef.current = null;
    setError("");
    setStep(1);
  };

  const goToKbStep = async () => {
    if (!file) {
      setError("Upload PDF first.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      const built = await buildCanvasFromPdf(file);
      canvasRef.current = built.canvas;
      setBaseMeta({ width: built.width, height: built.height, ms: built.ms });
      setStep(2);
    } catch (e) {
      setError(e.message || "Failed to process PDF.");
    } finally {
      setBusy(false);
    }
  };

  const handleKbResult = (blob, meta) => {
    setFinalResult((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return {
        blob,
        previewUrl: URL.createObjectURL(blob),
        width: meta.width || baseMeta?.width || 0,
        height: meta.height || baseMeta?.height || 0,
        targetKB: meta.targetKB,
        kb: meta.finalKB,
        quality: meta.quality,
        ms: meta.ms,
        hit: meta.hit
      };
    });
    setResultStale(false);
    setStep(3);
  };

  const handleKbDirty = () => {
    if (!finalResult) return;
    setResultStale(true);
    setFinalResult((prev) => {
      if (!prev) return prev;
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  };

  const handleDownloadPdf = async () => {
    if (!finalResult) return;
    try {
      setPdfBusy(true);
      const { convertJpegBlobToPdfBlob } = await import("./features/pdf/exportPdf");
      const pdfBlob = await convertJpegBlobToPdfBlob(finalResult.blob, finalResult.width, finalResult.height);
      downloadBlob(pdfBlob, `scanned-doc-${Date.now()}.pdf`);
    } finally {
      setPdfBusy(false);
    }
  };

  useEffect(() => {
    return () => {
      if (finalResult?.previewUrl) {
        URL.revokeObjectURL(finalResult.previewUrl);
      }
    };
  }, [finalResult]);

  return (
    <>
      <TopNav />
      <main className="app-main">
        <section className="mb-5 border-b border-slate-200 bg-white px-4 py-8 md:px-6 md:py-10">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-4xl">
              Scanned Documents Converter
            </h1>
            <p className="mt-3 text-base text-slate-600 md:text-lg">
              PDF upload up to 5MB. Convert output to any target between 50KB and 1000KB with high quality.
            </p>
          </div>
        </section>

        <div className="mb-5 grid gap-3 text-sm sm:grid-cols-3">
          <div
            className={`rounded-lg border bg-white px-3 py-3 ${
              step === 1 ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-600"
            }`}
          >
            <p className="text-xs uppercase tracking-wide">Step 1</p>
            <p className="mt-1 font-semibold">Upload PDF</p>
          </div>
          <div
            className={`rounded-lg border bg-white px-3 py-3 ${
              step === 2 ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-600"
            }`}
          >
            <p className="text-xs uppercase tracking-wide">Step 2</p>
            <p className="mt-1 font-semibold">KB Edit + Generate</p>
          </div>
          <div
            className={`rounded-lg border bg-white px-3 py-3 ${
              step === 3 ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-600"
            }`}
          >
            <p className="text-xs uppercase tracking-wide">Step 3</p>
            <p className="mt-1 font-semibold">Preview & Download</p>
          </div>
        </div>

        {step === 1 ? (
          <section className="space-y-3">
            <DocumentUploadPanel onReady={handleUploadReady} />
            {error ? <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p> : null}
            <div className="flex gap-2">
              <button type="button" className="btn-primary" disabled={!file || busy} onClick={goToKbStep}>
                {busy ? "Preparing..." : "Next: KB Edit"}
              </button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-3">
            {baseMeta ? (
              <p className="text-xs text-slate-600">
                PDF page prepared: {baseMeta.width}x{baseMeta.height}px in {baseMeta.ms}ms
              </p>
            ) : null}
            <p className="text-xs text-slate-500">Target KB set karke Generate Final dabayein. Success par preview auto open hoga.</p>
            <KbSliderEditor
              canvasRef={canvasRef}
              onResult={handleKbResult}
              onDirty={handleKbDirty}
              minKB={50}
              maxKB={1000}
              defaultKB={300}
              minQBest={0.65}
              minQSafer={0.55}
              maxQ={0.98}
              maxIter={9}
            />
            <div className="flex gap-2">
              <button type="button" className="btn-muted" onClick={() => setStep(1)}>
                Back
              </button>
            </div>
            {resultStale ? (
              <p className="rounded bg-amber-50 p-2 text-xs text-amber-700">
                KB settings badle gaye hain. Latest preview ke liye dubara Generate Final dabayein.
              </p>
            ) : null}
          </section>
        ) : null}

        {step === 3 ? (
          <section className="panel">
            <h2 className="text-sm font-semibold text-slate-700">Preview + Download</h2>
            {finalResult ? (
              <>
                <div className="preview-frame">
                  <img
                    src={finalResult.previewUrl}
                    alt="Converted scanned document preview"
                    loading="lazy"
                    className="preview-image"
                  />
                </div>
                <div className="mt-3 grid gap-1 text-xs text-slate-700 sm:grid-cols-2">
                  <p>Preview Px: {finalResult.width}x{finalResult.height}</p>
                  <p>Target: {finalResult.targetKB} KB</p>
                  <p>Result: {finalResult.kb} KB</p>
                  <p>Quality: {finalResult.quality}</p>
                  <p>Time: {finalResult.ms} ms</p>
                  <p>Status hit: {String(finalResult.hit)}</p>
                </div>
                <button
                  type="button"
                  className="btn-primary mt-3"
                  onClick={handleDownloadPdf}
                  disabled={pdfBusy}
                >
                  {pdfBusy ? "Generating PDF..." : "Download PDF"}
                </button>
              </>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No output available.</p>
            )}
            <div className="mt-3">
              <button type="button" className="btn-muted" onClick={() => setStep(2)}>
                Back: KB Edit
              </button>
            </div>
          </section>
        ) : null}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-900">PDF to Image Converter for Form Uploads</h2>
          <p className="mt-2 text-sm text-slate-700">
            This free PDF to image converter extracts your scanned PDF page and optimizes output size for upload portals.
          </p>
          <h3 className="mt-3 text-base font-semibold text-slate-800">Related Tools</h3>
          <p className="mt-2 text-sm text-slate-700">
            <a className="font-medium text-red-600 hover:underline" href="/merge-pdf">Merge PDF</a>{" "}•{" "}
            <a className="font-medium text-red-600 hover:underline" href="/split-pdf">Split PDF</a>{" "}•{" "}
            <a className="font-medium text-red-600 hover:underline" href="/image-to-pdf">Image to PDF</a>{" "}•{" "}
            <a className="font-medium text-red-600 hover:underline" href="/compress-pdf-to-300kb">Compress PDF 300KB</a>
          </p>
        </section>
      </main>
      <AppFooter />
    </>
  );
}

