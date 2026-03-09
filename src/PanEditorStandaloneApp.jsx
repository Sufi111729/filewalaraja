import { useMemo, useState } from "react";
import TopNav from "./components/TopNav";
import AppFooter from "./components/AppFooter";
import UniversalImageUpload from "./components/UniversalImageUpload";
import UniversalMaskEditor from "./components/UniversalMaskEditor";
import { removeBackgroundPro } from "./features/bgRemove/bgRemove";
import {
  alphaDataToMask,
  buildTransparentCanvas,
  canvasToBlob,
  clamp,
  copyMask,
  downloadBlobFile,
  loadImageFileToCanvas
} from "./lib/universalBgEditor";

function masksEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function ToolButton({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`universal-tool-btn ${active ? "universal-tool-btn-active" : ""}`}
    >
      {children}
    </button>
  );
}

export default function PanEditorStandaloneApp() {
  const [file, setFile] = useState(null);
  const [sourceCanvas, setSourceCanvas] = useState(null);
  const [autoMask, setAutoMask] = useState(null);
  const [mask, setMask] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeTool, setActiveTool] = useState("remove");
  const [previewMode, setPreviewMode] = useState("after");
  const [showOverlay, setShowOverlay] = useState(true);
  const [brushSize, setBrushSize] = useState(28);
  const [brushHardness, setBrushHardness] = useState(70);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canEdit = !!sourceCanvas && !!mask;
  const currentHistoryMask = historyIndex >= 0 ? history[historyIndex] : null;
  const softness = useMemo(() => 1 - clamp(brushHardness / 100, 0, 1), [brushHardness]);

  async function handleFileSelected(nextFile) {
    setBusy(true);
    setError("");
    setSuccess("");
    setStageText("Preparing image editor...");
    setProgress(8);
    try {
      const canvas = await loadImageFileToCanvas(nextFile, { maxEdge: 1600 });
      setFile(nextFile);
      setSourceCanvas(canvas);
      setAutoMask(null);
      setMask(null);
      setHistory([]);
      setHistoryIndex(-1);
      setPreviewMode("before");
      setActiveTool("remove");
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setStageText("Image ready. Click Remove Background.");
      setProgress(100);
    } catch (loadError) {
      setError(loadError.message || "Failed to load image.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveBackground() {
    if (!sourceCanvas) {
      setError("Upload an image first.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      setSuccess("");
      setStageText("Detecting foreground subject...");
      setProgress(12);

      const result = await removeBackgroundPro(sourceCanvas, {
        subjectBias: 64,
        smoothEdges: 6,
        featherEdges: 4,
        maskShift: 0,
        onProgress: (value) => setProgress(12 + Math.round(value * 0.82))
      });

      const nextMask = alphaDataToMask(result.alphaData);
      const initialHistory = [copyMask(nextMask)];
      setAutoMask(copyMask(nextMask));
      setMask(nextMask);
      setHistory(initialHistory);
      setHistoryIndex(0);
      setPreviewMode("after");
      setStageText("Auto removal complete. Refine the mask if needed.");
      setSuccess("Background removed. You can now erase extra background or restore missed subject details.");
      setProgress(100);
    } catch (processingError) {
      setError(processingError.message || "Background removal failed.");
    } finally {
      setBusy(false);
    }
  }

  function commitMask(nextMask) {
    if (!currentHistoryMask || masksEqual(currentHistoryMask, nextMask)) return;
    const trimmed = history.slice(0, historyIndex + 1);
    const nextHistory = [...trimmed, copyMask(nextMask)].slice(-20);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  }

  function handleUndo() {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    setMask(copyMask(history[nextIndex]));
  }

  function handleRedo() {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    setMask(copyMask(history[nextIndex]));
  }

  function handleResetMask() {
    if (!autoMask) return;
    const resetMask = copyMask(autoMask);
    setMask(resetMask);
    const nextHistory = [...history.slice(0, historyIndex + 1), copyMask(resetMask)].slice(-20);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  }

  async function handleDownload() {
    if (!sourceCanvas || !mask) return;
    const transparentCanvas = buildTransparentCanvas(sourceCanvas, mask);
    const blob = await canvasToBlob(transparentCanvas, "image/png");
    const base = (file?.name || "image").replace(/\.[^.]+$/, "");
    downloadBlobFile(blob, `${base}-background-removed.png`);
  }

  return (
    <>
      <TopNav />
      <main className="app-main">
        <section className="universal-hero">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Universal Background Removal Editor</p>
            <h1 className="mt-4 text-slate-950">Remove Background From Any Image With Manual Mask Refinement</h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
              Upload portraits, full body photos, product images, objects, animals, studio shots, social media photos, or any random picture. Run automatic AI background removal, then refine the mask manually with remove and restore brushes before downloading a transparent PNG.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <UniversalImageUpload file={file} onFileSelected={handleFileSelected} busy={busy} />

            <div className="panel">
              <h2 className="text-sm font-semibold text-slate-700">Editor Actions</h2>
              <div className="mt-3 grid gap-2">
                <button type="button" className="btn-primary" onClick={handleRemoveBackground} disabled={!sourceCanvas || busy}>
                  Remove Background
                </button>
                <button type="button" className="btn-success" onClick={handleDownload} disabled={!canEdit || busy}>
                  Download Transparent PNG
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Supported input: JPG, PNG, WEBP. Output: transparent PNG.
              </p>
            </div>

            <div className="panel">
              <h2 className="text-sm font-semibold text-slate-700">Refinement Tools</h2>
              <div className="mt-3 grid gap-2">
                <ToolButton active={activeTool === "remove"} disabled={!canEdit || busy} onClick={() => setActiveTool("remove")}>
                  Remove Brush
                </ToolButton>
                <ToolButton active={activeTool === "restore"} disabled={!canEdit || busy} onClick={() => setActiveTool("restore")}>
                  Restore Brush
                </ToolButton>
                <ToolButton active={activeTool === "pan"} disabled={!sourceCanvas || busy} onClick={() => setActiveTool("pan")}>
                  Pan Canvas
                </ToolButton>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-700">Brush Size: {brushSize}px</label>
                  <input className="mt-1 w-full accent-blue-600" type="range" min={6} max={120} step={1} value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} disabled={!canEdit || busy} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Hardness: {brushHardness}%</label>
                  <input className="mt-1 w-full accent-blue-600" type="range" min={0} max={100} step={1} value={brushHardness} onChange={(event) => setBrushHardness(Number(event.target.value))} disabled={!canEdit || busy} />
                </div>
              </div>
            </div>

            <div className="panel">
              <h2 className="text-sm font-semibold text-slate-700">Canvas Controls</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button type="button" className="btn-muted" onClick={() => setZoom((value) => clamp(Number((value * 0.85).toFixed(2)), 0.5, 4))} disabled={!sourceCanvas || busy}>
                  Zoom Out
                </button>
                <button type="button" className="btn-muted" onClick={() => setZoom((value) => clamp(Number((value * 1.15).toFixed(2)), 0.5, 4))} disabled={!sourceCanvas || busy}>
                  Zoom In
                </button>
                <button type="button" className="btn-muted" onClick={handleUndo} disabled={historyIndex <= 0 || busy}>
                  Undo
                </button>
                <button type="button" className="btn-muted" onClick={handleRedo} disabled={historyIndex >= history.length - 1 || busy}>
                  Redo
                </button>
                <button type="button" className="btn-muted" onClick={handleResetMask} disabled={!autoMask || busy}>
                  Reset Mask
                </button>
                <button type="button" className="btn-muted" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} disabled={!sourceCanvas || busy}>
                  Reset View
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <ToolButton active={previewMode === "before"} disabled={!sourceCanvas || busy} onClick={() => setPreviewMode("before")}>
                  Before Preview
                </ToolButton>
                <ToolButton active={previewMode === "after"} disabled={!canEdit || busy} onClick={() => setPreviewMode("after")}>
                  After Preview
                </ToolButton>
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={showOverlay} onChange={(event) => setShowOverlay(event.target.checked)} disabled={!canEdit || busy || previewMode === "before"} />
                Mask overlay preview
              </label>
              <p className="mt-2 text-xs text-slate-500">Use the checkerboard to see transparent areas while refining the alpha mask.</p>
            </div>
          </aside>

          <section className="panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Editable Canvas</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Paint to remove leftover background or restore missed subject details. The original image stays untouched while you edit a separate transparency mask.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {sourceCanvas ? `${sourceCanvas.width} x ${sourceCanvas.height}` : "No image loaded"}
              </div>
            </div>

            {busy ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{stageText || "Processing..."}</p>
                    <p className="text-xs text-slate-500">{progress}% complete</p>
                  </div>
                </div>
                <div className="mt-3 h-3 w-full rounded-full bg-slate-200">
                  <div className="h-3 rounded-full bg-slate-900 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : null}

            {sourceCanvas ? (
              <div className="mt-4">
                <UniversalMaskEditor
                  sourceCanvas={sourceCanvas}
                  mask={mask || new Uint8ClampedArray(sourceCanvas.width * sourceCanvas.height).fill(255)}
                  activeTool={activeTool}
                  brushSize={brushSize}
                  softness={softness}
                  zoom={zoom}
                  pan={pan}
                  previewMode={previewMode}
                  showOverlay={showOverlay}
                  onMaskDraft={setMask}
                  onMaskCommit={(nextMask) => {
                    if (nextMask) commitMask(nextMask);
                  }}
                  onPanChange={setPan}
                />
              </div>
            ) : (
              <div className="universal-empty-state mt-4">
                <h3 className="text-lg font-semibold text-slate-900">Upload any image to start</h3>
                <p className="mt-2 max-w-lg text-sm text-slate-600">
                  This editor is built for portraits, products, animals, objects, full-scene images, social posts, and everyday photos. Upload an image, click Remove Background, then refine the mask manually.
                </p>
              </div>
            )}

            {success ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}
            {error ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          </section>
        </section>

        <section className="panel mt-8">
          <div className="max-w-4xl">
            <h2 className="text-slate-900">How it works</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-slate-900">1. Upload any image</h3>
                <p className="mt-2 text-sm text-slate-600">Use portraits, product photos, pets, social media images, or any everyday picture in JPG, PNG, or WEBP format.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-slate-900">2. Auto detect subject</h3>
                <p className="mt-2 text-sm text-slate-600">Click Remove Background to run automatic foreground detection and generate a first-pass transparent cutout.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-slate-900">3. Refine manually</h3>
                <p className="mt-2 text-sm text-slate-600">Use remove and restore brushes, zoom, pan, undo, redo, reset mask, and overlay preview to finalize the cutout before download.</p>
              </div>
            </div>

            <h2 className="mt-8 text-slate-900">Features</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-slate-900">Universal auto removal</h3>
                <p className="mt-2 text-sm text-slate-600">Designed for human portraits, full body images, products, animals, studio images, and mixed scenes instead of document-only uploads.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-slate-900">Manual mask editing</h3>
                <p className="mt-2 text-sm text-slate-600">Correct the automatic result with remove and restore brushes while preserving the untouched original image under the editable alpha mask.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-slate-900">Real-time editor canvas</h3>
                <p className="mt-2 text-sm text-slate-600">Work on a responsive canvas with checkerboard transparency, zoom, pan, before/after preview, and mask overlay preview.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-slate-900">Transparent PNG export</h3>
                <p className="mt-2 text-sm text-slate-600">Download the final result as transparent PNG after refinement, ready for design, ecommerce, or social media reuse.</p>
              </div>
            </div>

            <h2 className="mt-8 text-slate-900">FAQ</h2>
            <div className="mt-4 space-y-3">
              <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer font-semibold text-slate-900">Can I use this background remover for products, portraits, and animals?</summary>
                <p className="mt-2 text-sm text-slate-600">Yes. This editor is designed as a universal background remover for people, objects, products, pets, studio shots, and casual uploaded photos.</p>
              </details>
              <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer font-semibold text-slate-900">What if the automatic cutout misses part of the subject?</summary>
                <p className="mt-2 text-sm text-slate-600">Use the Restore Brush to bring back missing areas, or switch to the Remove Brush to erase leftover background manually.</p>
              </details>
              <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer font-semibold text-slate-900">Does the editor keep my original image untouched?</summary>
                <p className="mt-2 text-sm text-slate-600">Yes. The editor stores the original image separately and only edits an alpha mask, so the final PNG is built from the original pixels plus your edited transparency map.</p>
              </details>
            </div>
          </div>
        </section>
      </main>
      <AppFooter />
    </>
  );
}
