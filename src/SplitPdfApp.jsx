import { useRef, useState } from "react";
import TopNav from "./components/TopNav";
import AppFooter from "./components/AppFooter";
import { getPdfPageCount, loadJsZip, loadPdfLib, renderPdfPagePreview } from "./lib/pdfBrowserTools";
import { CloudUploadIcon, DownloadIcon, SplitIcon, UploadIcon } from "./components/AppIcons";

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

function parsePageRanges(value, maxPage) {
  const tokenList = String(value || "").split(",").map((token) => token.trim()).filter(Boolean);
  if (!tokenList.length) throw new Error("Enter page range like 1-5 or 2,4,7.");

  const pages = new Set();
  for (const token of tokenList) {
    if (token.includes("-")) {
      const [startRaw, endRaw] = token.split("-").map((v) => Number(v.trim()));
      if (!Number.isInteger(startRaw) || !Number.isInteger(endRaw) || startRaw < 1 || endRaw < startRaw || endRaw > maxPage) {
        throw new Error(`Invalid range: ${token}`);
      }
      for (let i = startRaw; i <= endRaw; i += 1) pages.add(i);
      continue;
    }
    const page = Number(token);
    if (!Number.isInteger(page) || page < 1 || page > maxPage) {
      throw new Error(`Invalid page: ${token}`);
    }
    pages.add(page);
  }

  return [...pages].sort((a, b) => a - b);
}

export default function SplitPdfApp() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [previewItems, setPreviewItems] = useState([]);
  const [mode, setMode] = useState("every");
  const [range, setRange] = useState("1-2");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFile = async (nextFile) => {
    if (!nextFile) return;
    const isPdf = nextFile.type === "application/pdf" || nextFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Only PDF file is supported.");
      return;
    }

    setBusy(true);
    setError("");
    setResults([]);
    setFile(nextFile);
    setPreviewItems([]);
    setProgress(0);

    try {
      const totalPages = await getPdfPageCount(nextFile);
      setPageCount(totalPages);
      setRange(`1-${Math.min(2, totalPages)}`);

      const previews = [];
      for (let i = 1; i <= totalPages; i += 1) {
        const previewUrl = await renderPdfPagePreview(nextFile, i, 0.22);
        previews.push({ pageNumber: i, previewUrl });
        setProgress(Math.round((i / totalPages) * 100));
      }
      setPreviewItems(previews);
    } catch (e) {
      setError(e?.message || "Failed to read PDF.");
      setFile(null);
      setPageCount(0);
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const onDropZoneDrop = (e) => {
    e.preventDefault();
    const next = e.dataTransfer.files?.[0];
    handleFile(next);
  };

  const splitPdf = async () => {
    if (!file || !pageCount) return;
    setBusy(true);
    setError("");
    setProgress(0);
    setResults([]);

    try {
      const { PDFDocument } = await loadPdfLib();
      const bytes = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(bytes, { ignoreEncryption: false });
      const pageNumbers = mode === "every"
        ? Array.from({ length: pageCount }, (_, idx) => idx + 1)
        : parsePageRanges(range, pageCount);

      const nextResults = [];
      for (let i = 0; i < pageNumbers.length; i += 1) {
        const pageNumber = pageNumbers[i];
        const singlePdf = await PDFDocument.create();
        const [copiedPage] = await singlePdf.copyPages(sourcePdf, [pageNumber - 1]);
        singlePdf.addPage(copiedPage);
        const outBytes = await singlePdf.save();
        nextResults.push({
          name: `${file.name.replace(/\.pdf$/i, "")}-page-${pageNumber}.pdf`,
          blob: new Blob([outBytes], { type: "application/pdf" }),
          pageNumber
        });
        setProgress(Math.round(((i + 1) / pageNumbers.length) * 100));
      }
      setResults(nextResults);
    } catch (e) {
      setError(e?.message || "Failed to split PDF.");
    } finally {
      setBusy(false);
    }
  };

  const downloadZip = async () => {
    if (!results.length) return;
    setBusy(true);
    setError("");
    setProgress(0);
    try {
      const mod = await loadJsZip();
      const JSZip = mod.default || mod.JSZip || mod;
      const zip = new JSZip();
      for (let i = 0; i < results.length; i += 1) {
        zip.file(results[i].name, results[i].blob);
        setProgress(Math.round(((i + 1) / results.length) * 60));
      }
      const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
        setProgress(60 + Math.round(metadata.percent * 0.4));
      });
      downloadBlob(zipBlob, `${file.name.replace(/\.pdf$/i, "")}-split.zip`);
    } catch (e) {
      setError(e?.message || "Failed to generate ZIP.");
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
            <h1 className="text-slate-900">Split PDF Pages Online</h1>
            <p className="mt-3 text-base text-slate-600 md:text-lg">
              Extract every page or selected ranges into separate PDFs, fully in browser.
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
            <p className="text-sm font-medium text-slate-700">Drag and drop one PDF file here</p>
            <button type="button" className="btn-primary mt-4 inline-flex items-center gap-2" onClick={() => inputRef.current?.click()}>
              <UploadIcon className="h-4 w-4" />
              Choose PDF File
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,application/pdf"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {file ? (
            <div className="mt-4 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
              <p className="font-semibold">{file.name}</p>
              <p className="text-xs text-slate-500">{pageCount} pages</p>
            </div>
          ) : null}

          {pageCount ? (
            <div className="mt-4 rounded-xl border border-slate-200 p-3">
              <h2 className="text-sm font-semibold text-slate-700">Split Options</h2>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" checked={mode === "every"} onChange={() => setMode("every")} />
                  Split every page
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" checked={mode === "range"} onChange={() => setMode("range")} />
                  Split by page range
                </label>
                <input
                  type="text"
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  disabled={mode !== "range"}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="1-5,8,10-12"
                />
              </div>
              <button type="button" className="btn-primary mt-3 inline-flex items-center gap-2" disabled={busy} onClick={splitPdf}>
                <SplitIcon className="h-4 w-4" />
                {busy ? "Splitting..." : "Split PDF"}
              </button>
            </div>
          ) : null}

          {previewItems.length ? (
            <div className="mt-4">
              <h2 className="text-sm font-semibold text-slate-700">Page Preview</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                {previewItems.map((item) => (
                  <div key={item.pageNumber} className="rounded-lg border border-slate-200 p-2">
                    <img src={item.previewUrl} alt={`Page ${item.pageNumber} preview`} loading="lazy" className="h-28 w-full object-contain" />
                    <p className="mt-1 text-center text-xs text-slate-600">Page {item.pageNumber}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {results.length ? (
            <div className="mt-5 rounded-xl border border-slate-200 p-3">
              <h2 className="text-sm font-semibold text-slate-700">Download Split Files</h2>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                {results.map((result) => (
                  <div key={result.name} className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                    <p className="truncate pr-3 text-xs text-slate-700">{result.name}</p>
                    <button type="button" className="btn-muted inline-flex items-center gap-1.5" onClick={() => downloadBlob(result.blob, result.name)}>
                      <DownloadIcon className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn-success mt-3 inline-flex items-center gap-2" disabled={busy} onClick={downloadZip}>
                <DownloadIcon className="h-4 w-4" />
                Download ZIP
              </button>
            </div>
          ) : null}

          {busy ? (
            <div className="mt-3">
              <p className="text-xs text-slate-600">Progress: {progress}%</p>
              <div className="mt-1 h-2 w-full overflow-hidden rounded bg-slate-100">
                <div className="h-full bg-red-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null}
          {error ? <p className="mt-3 rounded bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
        </section>

        <section className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-900">How to Split PDF Pages</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
            <li>Upload one PDF file from your device.</li>
            <li>Select split mode: every page or custom range.</li>
            <li>Click Split PDF and generate separate files.</li>
            <li>Download pages individually or as ZIP.</li>
          </ol>
          <h2 className="text-xl font-semibold text-slate-900">Why Use Our PDF Splitter</h2>
          <h3 className="text-base font-semibold text-slate-800">Range-based extraction</h3>
          <p className="text-sm text-slate-700">Extract specific pages quickly using values like 1-5,8,10-12.</p>
          <h3 className="text-base font-semibold text-slate-800">Secure browser workflow</h3>
          <p className="text-sm text-slate-700">Split PDF online without uploading files to backend servers.</p>
          <h2 className="text-xl font-semibold text-slate-900">Related Tools</h2>
          <p className="text-sm text-slate-700">
            <a href="/merge-pdf" className="font-medium text-red-600 hover:underline">Merge PDF</a>{" "}•{" "}
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

