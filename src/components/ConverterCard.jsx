import { useEffect, useMemo, useRef, useState } from "react";
import { convertImageFile, getOutputName } from "../utils/imageConvert";
import { CloudUploadIcon, DownloadIcon, RefreshIcon, UploadIcon } from "./AppIcons";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getImageSizeFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const size = { width: img.width, height: img.height };
      URL.revokeObjectURL(url);
      resolve(size);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read output image size."));
    };
    img.src = url;
  });
}

export default function ConverterCard({
  title,
  description,
  accept,
  type,
  targetMime,
  targetExt
}) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [outputs, setOutputs] = useState([]);
  const [step, setStep] = useState(1);

  const previews = useMemo(
    () =>
      files.map((f) => ({
        name: f.name,
        sizeKb: (f.size / 1024).toFixed(1),
        url: URL.createObjectURL(f)
      })),
    [files]
  );
  const outputPreviews = useMemo(
    () =>
      outputs.map((o) => ({
        ...o,
        previewUrl: type === "to-pdf" || type === "merge-pdf" ? "" : URL.createObjectURL(o.blob)
      })),
    [outputs, type]
  );

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);
  useEffect(() => {
    return () => {
      outputPreviews.forEach((o) => {
        if (o.previewUrl) URL.revokeObjectURL(o.previewUrl);
      });
    };
  }, [outputPreviews]);

  const onChooseFiles = (list) => {
    const next = Array.from(list || []);
    setFiles(next);
    setOutputs([]);
    setError("");
    setWarning("");
    setProgress(0);
    setStep(1);
  };

  const onDrop = (e) => {
    e.preventDefault();
    onChooseFiles(e.dataTransfer.files);
  };

  const onConvert = async () => {
    if (!files.length) {
      setError("Please upload files first.");
      return;
    }

    setBusy(true);
    setError("");
    setWarning("");
    setOutputs([]);
    setProgress(5);
    setPdfGenerating(false);

    try {
      if (type === "to-pdf") {
        setPdfGenerating(true);
        const { convertImagesToSinglePdf } = await import("../features/pdf/exportPdf");
        setPdfGenerating(false);
        const { blob: pdfBlob, skippedFiles } = await convertImagesToSinglePdf(files, setProgress);
        setOutputs([
          {
            name: files.length > 1 ? "converted-images.pdf" : getOutputName(files[0].name, "pdf"),
            blob: pdfBlob,
            sizeKb: (pdfBlob.size / 1024).toFixed(1)
          }
        ]);
        if (skippedFiles.length) {
          setWarning(`Skipped unsupported files: ${skippedFiles.join(", ")}`);
        }
      } else if (type === "merge-pdf") {
        setPdfGenerating(true);
        const { mergePdfFiles } = await import("../features/pdf/mergePdf");
        setPdfGenerating(false);
        const { blob: pdfBlob, skippedFiles } = await mergePdfFiles(files, setProgress);
        setOutputs([
          {
            name: "merged.pdf",
            blob: pdfBlob,
            sizeKb: (pdfBlob.size / 1024).toFixed(1)
          }
        ]);
        if (skippedFiles.length) {
          setWarning(`Skipped invalid files: ${skippedFiles.join(", ")}`);
        }
      } else {
        const converted = [];
        for (let i = 0; i < files.length; i += 1) {
          const blob = await convertImageFile(files[i], targetMime, 0.98);
          const size = await getImageSizeFromBlob(blob);
          converted.push({
            name: getOutputName(files[i].name, targetExt),
            blob,
            sizeKb: (blob.size / 1024).toFixed(1),
            width: size.width,
            height: size.height
          });
          setProgress(Math.round(((i + 1) / files.length) * 100));
        }
        setOutputs(converted);
      }
      setProgress(100);
      setStep(3);
    } catch (err) {
      setError(err.message || "Conversion failed.");
    } finally {
      setPdfGenerating(false);
      setBusy(false);
    }
  };

  return (
    <div className="panel rounded-2xl">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <div className={`rounded-lg border px-3 py-2 ${step === 1 ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-600"}`}>
          <p className="text-xs uppercase tracking-wide">Step 1</p>
          <p className="font-semibold">Upload</p>
        </div>
        <div className={`rounded-lg border px-3 py-2 ${step === 2 ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-600"}`}>
          <p className="text-xs uppercase tracking-wide">Step 2</p>
          <p className="font-semibold">Generate</p>
        </div>
        <div className={`rounded-lg border px-3 py-2 ${step === 3 ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-600"}`}>
          <p className="text-xs uppercase tracking-wide">Step 3</p>
          <p className="font-semibold">Preview + Download</p>
        </div>
      </div>

      {step === 1 ? (
        <>
          <div
            className="upload-zone mt-4 p-6 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <CloudUploadIcon className="mx-auto h-10 w-10 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">Drag & drop files here</p>
            <button type="button" className="btn-muted mt-3 inline-flex items-center gap-2" onClick={() => inputRef.current?.click()}>
              <UploadIcon className="h-4 w-4" />
              Choose Files
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={accept}
              multiple
              onChange={(e) => onChooseFiles(e.target.files)}
            />
          </div>
          <div className="mt-4">
            <button type="button" className="btn-primary inline-flex items-center gap-2" disabled={!files.length} onClick={() => setStep(2)}>
              <RefreshIcon className="h-4 w-4" />
              Next: Generate
            </button>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {files.map((f) => (
              <div key={f.name} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="truncate text-xs font-medium text-slate-700">{f.name}</p>
                <p className="text-[11px] text-slate-500">{(f.size / 1024).toFixed(1)} KB</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={onConvert} disabled={busy || !files.length}>
              <RefreshIcon className="h-4 w-4" />
              {busy ? (type === "to-pdf" || type === "merge-pdf" ? "Generating PDF..." : "Generating...") : "Generate Final"}
            </button>
            {busy ? (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                {pdfGenerating ? "Loading PDF engine..." : `${progress}%`}
              </div>
            ) : null}
          </div>

          <div className="mt-3">
            <button type="button" className="btn-muted" onClick={() => setStep(1)} disabled={busy}>
              Back: Upload
            </button>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <div className="mt-4 space-y-2">
          {outputPreviews.map((o) => (
            <div key={o.name} className="rounded-lg border border-slate-200 p-3">
              {o.previewUrl ? (
                <div className="preview-frame mt-0 border-slate-200 bg-slate-50">
                  <img
                    src={o.previewUrl}
                    alt={o.name}
                    loading="lazy"
                    className="preview-image"
                  />
                </div>
              ) : (
                <div className="preview-frame mt-0 border-slate-200 bg-slate-50">
                  <div className="text-center text-sm text-slate-600">
                    <p className="font-semibold text-slate-700">PDF File Ready</p>
                    <p className="mt-1 text-xs">Download karke open karein.</p>
                  </div>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{o.name}</p>
                  {o.width && o.height ? <p className="text-xs text-slate-500">{o.width}x{o.height}px</p> : null}
                  <p className="text-xs text-slate-500">{o.sizeKb} KB</p>
                </div>
                <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={() => downloadBlob(o.blob, o.name)}>
                  <DownloadIcon className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          ))}
          <div className="mt-3">
            <button type="button" className="btn-muted" onClick={() => setStep(2)}>
              Back: Generate
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-3 rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p> : null}
      {warning ? <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-700">{warning}</p> : null}
    </div>
  );
}
