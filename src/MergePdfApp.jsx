import { useMemo, useRef, useState } from "react";
import TopNav from "./components/TopNav";
import AppFooter from "./components/AppFooter";
import { getPdfPageCount, loadPdfLib, renderPdfPagePreview } from "./lib/pdfBrowserTools";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CloudUploadIcon,
  DownloadIcon,
  MergeIcon,
  TrashIcon,
  UploadIcon
} from "./components/AppIcons";

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function bytesToMb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
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

function normalizePdfFiles(list) {
  return Array.from(list || []).filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
}

export default function MergePdfApp() {
  const inputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [mergedBlob, setMergedBlob] = useState(null);
  const [dragId, setDragId] = useState("");

  const canMerge = useMemo(() => items.length > 1 && !busy, [items.length, busy]);

  const ingestFiles = async (fileList) => {
    const files = normalizePdfFiles(fileList);
    if (!files.length) {
      setError("Please upload valid PDF files.");
      return;
    }

    setError("");
    setBusy(true);
    setMergedBlob(null);

    const prepared = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      try {
        const pageCount = await getPdfPageCount(file);
        const previewUrl = await renderPdfPagePreview(file, 1, 0.26);
        prepared.push({
          id: `${file.name}-${file.size}-${Date.now()}-${i}`,
          file,
          pageCount,
          previewUrl
        });
      } catch {
        // Ignore malformed PDFs.
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    if (!prepared.length) {
      setError("Could not read uploaded PDFs.");
      setBusy(false);
      return;
    }

    setItems((prev) => [...prev, ...prepared]);
    setProgress(0);
    setBusy(false);
  };

  const moveItem = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    const [current] = next.splice(index, 1);
    next.splice(nextIndex, 0, current);
    setItems(next);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setMergedBlob(null);
  };

  const onDropZoneDrop = (e) => {
    e.preventDefault();
    ingestFiles(e.dataTransfer.files);
  };

  const onCardDrop = (targetId) => {
    if (!dragId || dragId === targetId) return;
    const fromIndex = items.findIndex((item) => item.id === dragId);
    const toIndex = items.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const next = [...items];
    const [current] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, current);
    setItems(next);
    setDragId("");
  };

  const mergePdfs = async () => {
    if (items.length < 2) {
      setError("Upload at least 2 PDFs to merge.");
      return;
    }

    setError("");
    setBusy(true);
    setProgress(0);

    try {
      const { PDFDocument } = await loadPdfLib();
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < items.length; i += 1) {
        const bytes = await items[i].file.arrayBuffer();
        const source = await PDFDocument.load(bytes, { ignoreEncryption: false });
        const sourcePages = source.getPages();

        for (let p = 0; p < sourcePages.length; p += 1) {
          const sourcePage = sourcePages[p];
          const { width: srcWidth, height: srcHeight } = sourcePage.getSize();
          if (isAlreadyA4(srcWidth, srcHeight)) {
            const [copiedPage] = await mergedPdf.copyPages(source, [p]);
            mergedPdf.addPage(copiedPage);
            continue;
          }

          const embeddedPage = await mergedPdf.embedPage(sourcePage);

          const availableWidth = A4_WIDTH - PAGE_MARGIN * 2;
          const availableHeight = A4_HEIGHT - PAGE_MARGIN * 2;
          const scale = Math.min(availableWidth / srcWidth, availableHeight / srcHeight);
          const drawWidth = srcWidth * scale;
          const drawHeight = srcHeight * scale;
          const x = (A4_WIDTH - drawWidth) / 2;
          const y = (A4_HEIGHT - drawHeight) / 2;

          const a4Page = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
          a4Page.drawPage(embeddedPage, {
            x,
            y,
            width: drawWidth,
            height: drawHeight
          });
        }

        setProgress(Math.round(((i + 1) / items.length) * 100));
      }

      const mergedBytes = await mergedPdf.save();
      setMergedBlob(new Blob([mergedBytes], { type: "application/pdf" }));
    } catch (e) {
      setError(e?.message || "Failed to merge PDFs.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TopNav />
      <main className="app-main">
        <section className="hero-shell">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-slate-900">Merge PDF Files Online</h1>
            <p className="mt-3 text-base text-slate-600 md:text-lg">
              Upload, reorder, and combine PDF files in-browser. No server upload required.
            </p>
          </div>
        </section>

        <section className="panel rounded-2xl">
          <div
            className="upload-zone p-8 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDropZoneDrop}
          >
            <CloudUploadIcon className="mx-auto h-10 w-10 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">Drag and drop PDF files here</p>
            <p className="mt-1 text-xs text-slate-500">Upload multiple PDFs and reorder before merge</p>
            <button type="button" className="btn-primary mt-4 inline-flex items-center gap-2" onClick={() => inputRef.current?.click()}>
              <UploadIcon className="h-4 w-4" />
              Choose PDF Files
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,application/pdf"
              multiple
              onChange={(e) => ingestFiles(e.target.files)}
            />
          </div>

          {items.length ? (
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item, index) => (
                <article
                  key={item.id}
                  draggable
                  onDragStart={() => setDragId(item.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onCardDrop(item.id)}
                  className="tool-card cursor-move p-3 md:p-4"
                >
                  <img src={item.previewUrl} alt={`${item.file.name} preview`} loading="lazy" className="h-40 w-full rounded-lg border border-slate-200 object-contain" />
                  <p className="mt-2 truncate text-sm font-semibold text-slate-800">{item.file.name}</p>
                  <p className="text-xs text-slate-500">{item.pageCount} pages • {bytesToMb(item.file.size)} MB</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" className="btn-muted inline-flex items-center gap-1.5" onClick={() => moveItem(index, -1)} disabled={busy || index === 0}>
                      <ArrowUpIcon className="h-3.5 w-3.5" />
                      Up
                    </button>
                    <button type="button" className="btn-muted inline-flex items-center gap-1.5" onClick={() => moveItem(index, 1)} disabled={busy || index === items.length - 1}>
                      <ArrowDownIcon className="h-3.5 w-3.5" />
                      Down
                    </button>
                    <button type="button" className="btn-danger ml-auto inline-flex items-center gap-1.5" onClick={() => removeItem(item.id)} disabled={busy}>
                      <TrashIcon className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={mergePdfs} disabled={!canMerge}>
              <MergeIcon className="h-4 w-4" />
              {busy ? "Merging..." : "Merge PDFs"}
            </button>
            {mergedBlob ? (
              <button type="button" className="btn-success inline-flex items-center gap-2" onClick={() => downloadBlob(mergedBlob, "merged.pdf")}>
                <DownloadIcon className="h-4 w-4" />
                Download Merged PDF
              </button>
            ) : null}
            {busy ? <p className="text-xs text-slate-600">Progress: {progress}%</p> : null}
          </div>
          {busy ? (
            <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-100">
              <div className="h-full bg-red-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          ) : null}
          {error ? <p className="mt-3 rounded bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
        </section>

        <section className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-900">How to Merge PDF Files</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
            <li>Upload multiple PDF files using drag and drop.</li>
            <li>Reorder files with drag-drop or Up/Down buttons.</li>
            <li>Click Merge PDFs and wait for progress to complete.</li>
            <li>Download the merged PDF instantly.</li>
          </ol>
          <h2 className="text-xl font-semibold text-slate-900">Why Use Our PDF Merger</h2>
          <h3 className="text-base font-semibold text-slate-800">Fast browser processing</h3>
          <p className="text-sm text-slate-700">This free Merge PDF tool combines files in your browser without server uploads.</p>
          <h3 className="text-base font-semibold text-slate-800">Easy reorder support</h3>
          <p className="text-sm text-slate-700">Arrange document order before merge to get final output exactly as needed.</p>
          <h2 className="text-xl font-semibold text-slate-900">Related Tools</h2>
          <p className="text-sm text-slate-700">
            <a href="/split-pdf" className="font-medium text-red-600 hover:underline">Split PDF</a>{" "}•{" "}
            <a href="/pdf-to-image" className="font-medium text-red-600 hover:underline">PDF to Image</a>{" "}•{" "}
            <a href="/compress-pdf-to-300kb" className="font-medium text-red-600 hover:underline">Compress PDF 300KB</a>{" "}•{" "}
            <a href="/image-to-pdf" className="font-medium text-red-600 hover:underline">Image to PDF</a>
          </p>
        </section>
      </main>
      <AppFooter />
    </>
  );
}

