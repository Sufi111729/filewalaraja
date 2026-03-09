import { useMemo, useState } from "react";
import TopNav from "./components/TopNav";
import AppFooter from "./components/AppFooter";
import UniversalImageUpload from "./components/UniversalImageUpload";
import UniversalMaskEditor from "./components/UniversalMaskEditor";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BackgroundRemoveIcon,
  DownloadIcon,
  RefreshIcon,
  WandIcon
} from "./components/AppIcons";
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

function CompareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M12 5v14" />
    </svg>
  );
}

function PanIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3v8m0 0-2.5-2.5M12 11l2.5-2.5M12 21v-7m0 0-2.5 2.5M12 14l2.5 2.5M3 12h8m0 0-2.5-2.5M11 12 8.5 14.5M21 12h-7m0 0 2.5-2.5M14 12l2.5 2.5" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M9 8 5 12l4 4" />
      <path d="M5 12h8a5 5 0 1 1 0 10h-1" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m15 8 4 4-4 4" />
      <path d="M19 12h-8a5 5 0 1 0 0 10h1" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="M8 11h6M20 20l-4.2-4.2" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="M11 8v6M8 11h6M20 20l-4.2-4.2" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

function HeaderButton({ active = false, children, ...props }) {
  return (
    <button type="button" className={`editor-header-btn ${active ? "editor-header-btn-active" : ""}`} {...props}>
      {children}
    </button>
  );
}

function ToolTile({ active, disabled, icon, title, description, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`editor-tool-tile ${active ? "editor-tool-tile-active" : ""} ${disabled ? "editor-tool-tile-disabled" : ""}`}
    >
      <span className="editor-tool-tile-icon">{icon}</span>
      <span className="block text-left">
        <span className="block text-sm font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
    </button>
  );
}

function PropertyCard({ eyebrow, title, description, className = "", children }) {
  return (
    <section className={`editor-property-card ${className}`}>
      <div>
        <p className="editor-section-eyebrow">{eyebrow}</p>
        <h3 className="mt-2 text-base font-semibold text-slate-950">{title}</h3>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

function SliderField({ label, value, suffix, min, max, step = 1, onChange, disabled }) {
  return (
    <label className="block">
      <div className="editor-slider-meta">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="editor-slider-value">{value}{suffix}</span>
      </div>
      <input
        className="editor-range mt-3"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled}
      />
    </label>
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
  const zoomPercent = Math.round(zoom * 100);
  const activeToolLabel = activeTool === "remove" ? "Remove Brush" : activeTool === "restore" ? "Restore Brush" : "Pan Canvas";

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
      setStageText("Image ready. Run auto remove to generate the first cutout.");
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
      setSuccess("Background removed. Refine with remove or restore brushes, then export the transparent PNG.");
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
    setSuccess("Mask reset to the latest automatic cutout.");
  }

  function handleResetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function handleApplyChanges() {
    if (!canEdit || busy) return;
    setPreviewMode("after");
    setSuccess("Refinements applied to the live cutout preview. Export the transparent PNG when ready.");
    setError("");
  }

  async function handleDownload() {
    if (!sourceCanvas || !mask) return;
    const transparentCanvas = buildTransparentCanvas(sourceCanvas, mask);
    const blob = await canvasToBlob(transparentCanvas, "image/png");
    const base = (file?.name || "image").replace(/\.[^.]+$/, "");
    downloadBlobFile(blob, `${base}-background-removed.png`);
  }

  const canvasMeta = sourceCanvas ? `${sourceCanvas.width} x ${sourceCanvas.height}` : "No image loaded";
  const overlayLabel = previewMode === "before" ? "Before preview" : showOverlay ? "Mask overlay on" : "Mask overlay off";

  return (
    <>
      <TopNav />
      <main className="app-main">
        <section className="universal-hero">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Universal Background Removal Editor</p>
            <h1 className="mt-4 text-slate-950">Premium background remover with auto cutout and manual refinement</h1>
            <p className="mt-4 max-w-3xl text-base text-slate-600 md:text-lg">
              Start with automatic background removal, then refine the transparency mask using remove and restore brushes in a cleaner editing workspace.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="editor-shell">
            <div className="editor-topbar">
              <div className="editor-topbar-copy">
                <p className="editor-section-eyebrow">Background removal studio</p>
                <h2 className="mt-2 text-[1.9rem] font-semibold tracking-[-0.04em] text-slate-950">Universal background remover with manual refinement</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Auto remove first, then polish edges with precise brush tools, comparison views, and export-ready transparency.
                </p>
                <div className="editor-topbar-meta mt-4">
                  <span className="editor-mini-stat"><span>Status</span><strong>{sourceCanvas ? "Workspace ready" : "Waiting for upload"}</strong></span>
                  <span className="editor-mini-stat"><span>Tool</span><strong>{activeToolLabel}</strong></span>
                  <span className="editor-mini-stat"><span>Zoom</span><strong>{zoomPercent}%</strong></span>
                </div>
              </div>
              <div className="editor-topbar-actions">
                <div className="editor-toolbar-group">
                  <HeaderButton onClick={handleUndo} disabled={historyIndex <= 0 || busy}>
                    <UndoIcon />
                    Undo
                  </HeaderButton>
                  <HeaderButton onClick={handleRedo} disabled={historyIndex >= history.length - 1 || busy}>
                    <RedoIcon />
                    Redo
                  </HeaderButton>
                </div>
                <div className="editor-toolbar-group">
                  <HeaderButton onClick={() => setZoom((value) => clamp(Number((value * 0.85).toFixed(2)), 0.5, 4))} disabled={!sourceCanvas || busy}>
                    <ZoomOutIcon />
                    Zoom out
                  </HeaderButton>
                  <HeaderButton onClick={() => setZoom((value) => clamp(Number((value * 1.15).toFixed(2)), 0.5, 4))} disabled={!sourceCanvas || busy}>
                    <ZoomInIcon />
                    Zoom in
                  </HeaderButton>
                </div>
                <div className="editor-toolbar-group">
                  <HeaderButton active={previewMode === "before"} onClick={() => setPreviewMode("before")} disabled={!sourceCanvas || busy}>
                    <EyeIcon />
                    Before
                  </HeaderButton>
                  <HeaderButton active={previewMode === "after"} onClick={() => setPreviewMode("after")} disabled={!canEdit || busy}>
                    <CompareIcon />
                    After
                  </HeaderButton>
                </div>
                <button type="button" className="btn-primary" onClick={handleDownload} disabled={!canEdit || busy}>
                  <DownloadIcon className="h-4 w-4" />
                  Export PNG
                </button>
              </div>
            </div>

            <div className="editor-workspace-grid">
              <aside className="editor-sidebar">
                <PropertyCard eyebrow="Source" title="Start with your image" description="Bring in one image, run auto cutout, then refine the result in the live workspace.">
                  <UniversalImageUpload file={file} onFileSelected={handleFileSelected} busy={busy} />
                </PropertyCard>

                <PropertyCard eyebrow="Studio tools" title="Core workflow" description="The first pass is automatic. Precision cleanup happens with the brush set below.">
                  <div className="space-y-4">
                    <button type="button" className="btn-primary w-full" onClick={handleRemoveBackground} disabled={!sourceCanvas || busy}>
                      <WandIcon className="h-4 w-4" />
                      Auto Remove Background
                    </button>

                    <div className="editor-control-stack">
                      <div className="editor-panel-label">Refinement tools</div>
                      <div className="mt-3 space-y-3">
                        <ToolTile
                          active={activeTool === "remove"}
                          disabled={!canEdit || busy}
                          icon={<BackgroundRemoveIcon className="h-4 w-4" />}
                          title="Remove Brush"
                          description="Erase leftover background and halo edges."
                          onClick={() => setActiveTool("remove")}
                        />
                        <ToolTile
                          active={activeTool === "restore"}
                          disabled={!canEdit || busy}
                          icon={<ArrowUpIcon className="h-4 w-4" />}
                          title="Restore Brush"
                          description="Paint back hair, fingers, fabric, and fine subject detail."
                          onClick={() => setActiveTool("restore")}
                        />
                        <ToolTile
                          active={activeTool === "pan"}
                          disabled={!sourceCanvas || busy}
                          icon={<PanIcon />}
                          title="Pan Canvas"
                          description="Move around the frame while zoomed in for close work."
                          onClick={() => setActiveTool("pan")}
                        />
                      </div>
                    </div>
                  </div>
                </PropertyCard>

                <PropertyCard eyebrow="Brush controls" title="Refinement feel" description="Balanced sliders for soft hair edges, harder product outlines, and accurate cleanup.">
                  <div className="space-y-5">
                    <SliderField label="Brush size" value={brushSize} suffix="px" min={6} max={120} onChange={setBrushSize} disabled={!canEdit || busy} />
                    <SliderField label="Hardness" value={brushHardness} suffix="%" min={0} max={100} onChange={setBrushHardness} disabled={!canEdit || busy} />
                  </div>
                  <div className="editor-brush-pill-row mt-4">
                    <span className="editor-brush-pill">Softness {Math.round(softness * 100)}%</span>
                    <span className="editor-brush-pill">{showOverlay ? "Overlay visible" : "Overlay hidden"}</span>
                  </div>
                </PropertyCard>

                <PropertyCard eyebrow="Session actions" title="Reset or apply" description="Use these when you want to restart from the AI mask or lock in the current review state.">
                  <div className="grid gap-3">
                    <button type="button" className="btn-muted w-full" onClick={handleResetMask} disabled={!autoMask || busy}>
                      <ArrowDownIcon className="h-4 w-4" />
                      Reset Mask
                    </button>
                    <button type="button" className="btn-primary w-full" onClick={handleApplyChanges} disabled={!canEdit || busy}>
                      <WandIcon className="h-4 w-4" />
                      Apply Changes
                    </button>
                  </div>
                </PropertyCard>
              </aside>

              <section className="editor-canvas-panel">
                <div className="editor-canvas-header">
                  <div>
                    <p className="editor-section-eyebrow">Canvas</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">Refinement workspace</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      The checkerboard reveals transparency while your original image stays intact under the editable alpha mask.
                    </p>
                  </div>
                  <div className="editor-status-cluster">
                    <span className="editor-status-pill">{canvasMeta}</span>
                    <span className="editor-status-pill">{overlayLabel}</span>
                  </div>
                </div>

                <div className="editor-stage-toolbar">
                  <div className="editor-canvas-hud">
                    <span>{activeToolLabel}</span>
                    <span>{zoomPercent}% zoom</span>
                    <span>{historyIndex + 1 > 0 ? `${historyIndex + 1}/${history.length} edits` : "No edits yet"}</span>
                  </div>
                  <div className="editor-toolbar-group">
                    <HeaderButton active={previewMode === "before"} onClick={() => setPreviewMode("before")} disabled={!sourceCanvas || busy}>Before</HeaderButton>
                    <HeaderButton active={previewMode === "after"} onClick={() => setPreviewMode("after")} disabled={!canEdit || busy}>After</HeaderButton>
                    <HeaderButton active={showOverlay} onClick={() => setShowOverlay((value) => !value)} disabled={!canEdit || busy || previewMode === "before"}>
                      Overlay
                    </HeaderButton>
                  </div>
                </div>

                <div className="editor-stage">
                  {busy ? (
                    <div className="editor-processing-overlay">
                      <div className="editor-processing-card">
                        <span className="editor-processing-spinner" />
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{stageText || "Processing..."}</p>
                          <p className="mt-1 text-sm text-slate-500">{progress}% complete</p>
                        </div>
                      </div>
                      <div className="editor-progress-track">
                        <div className="editor-progress-bar" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  ) : null}

                  {sourceCanvas ? (
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
                  ) : (
                    <div className="universal-empty-state">
                      <h3 className="text-lg font-semibold text-slate-900">Upload any image to start refining</h3>
                      <p className="mt-2 max-w-lg text-sm text-slate-600">
                        Auto remove the background, then use remove and restore brushes for edge cleanup, hair detail, and object accuracy.
                      </p>
                    </div>
                  )}
                </div>

                {success ? <p className="editor-feedback editor-feedback-success mt-4">{success}</p> : null}
                {error ? <p className="editor-feedback editor-feedback-error mt-4">{error}</p> : null}
              </section>

              <aside className="editor-properties-panel">
                <PropertyCard eyebrow="View" title="Preview and navigation" description="Keep the current state obvious while moving around the canvas.">
                  <div className="editor-segmented-wrap">
                    <button type="button" className={`editor-segment ${previewMode === "before" ? "editor-segment-active" : ""}`} onClick={() => setPreviewMode("before")} disabled={!sourceCanvas || busy}>
                      Before
                    </button>
                    <button type="button" className={`editor-segment ${previewMode === "after" ? "editor-segment-active" : ""}`} onClick={() => setPreviewMode("after")} disabled={!canEdit || busy}>
                      After
                    </button>
                  </div>
                  <label className="editor-toggle-row mt-4">
                    <span>
                      <strong>Mask overlay</strong>
                      <small>Highlight semi-removed regions while refining.</small>
                    </span>
                    <input type="checkbox" className="h-4 w-4 accent-slate-900" checked={showOverlay} onChange={(event) => setShowOverlay(event.target.checked)} disabled={!canEdit || busy || previewMode === "before"} />
                  </label>
                </PropertyCard>

                <PropertyCard eyebrow="Workspace" title="Canvas controls" description="Tight controls for inspection without leaving the editor focus.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button type="button" className="btn-muted" onClick={() => setZoom((value) => clamp(Number((value * 0.85).toFixed(2)), 0.5, 4))} disabled={!sourceCanvas || busy}>
                      Zoom Out
                    </button>
                    <button type="button" className="btn-muted" onClick={() => setZoom((value) => clamp(Number((value * 1.15).toFixed(2)), 0.5, 4))} disabled={!sourceCanvas || busy}>
                      Zoom In
                    </button>
                    <button type="button" className="btn-muted" onClick={handleResetView} disabled={!sourceCanvas || busy}>
                      Reset View
                    </button>
                    <button type="button" className="btn-muted" onClick={() => setPan({ x: 0, y: 0 })} disabled={!sourceCanvas || busy}>
                      Center Canvas
                    </button>
                  </div>
                </PropertyCard>

                <PropertyCard eyebrow="Session" title="Current status" description="A compact summary of the active editor state.">
                  <div className="space-y-3">
                    <div className="editor-summary-row">
                      <span>Image</span>
                      <strong>{file ? file.name : "None loaded"}</strong>
                    </div>
                    <div className="editor-summary-row">
                      <span>Tool</span>
                      <strong>{activeToolLabel}</strong>
                    </div>
                    <div className="editor-summary-row">
                      <span>Zoom</span>
                      <strong>{zoomPercent}%</strong>
                    </div>
                    <div className="editor-summary-row">
                      <span>History</span>
                      <strong>{historyIndex + 1 > 0 ? `${historyIndex + 1} / ${history.length}` : "No edits yet"}</strong>
                    </div>
                  </div>
                </PropertyCard>

                <PropertyCard eyebrow="Export" title="Transparent PNG output" description="The final export preserves transparency with the current refined mask.">
                  <button type="button" className="btn-primary w-full" onClick={handleDownload} disabled={!canEdit || busy}>
                    <DownloadIcon className="h-4 w-4" />
                    Download Transparent PNG
                  </button>
                  <button
                    type="button"
                    className="btn-muted mt-3 w-full"
                    onClick={() => {
                      setSuccess("");
                      setError("");
                      setFile(null);
                      setSourceCanvas(null);
                      setAutoMask(null);
                      setMask(null);
                      setHistory([]);
                      setHistoryIndex(-1);
                      handleResetView();
                    }}
                    disabled={busy}
                  >
                    <RefreshIcon className="h-4 w-4" />
                    Start Over
                  </button>
                </PropertyCard>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <AppFooter />
    </>
  );
}
