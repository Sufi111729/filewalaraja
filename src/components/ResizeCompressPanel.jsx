import { useEffect, useMemo, useRef, useState } from "react";
import { bgWhitePro, enhancePhoto } from "../api/aiClient";
import { useAiHealth } from "../store/aiHealthStore";
import { buildResizedCanvas, getPresetTargetPx, resizeAndCompressImage } from "../lib/imageUtils";
import { removeBackgroundPro } from "../features/bgRemove/bgRemove";

function canvasToBlob(canvas, type = "image/jpeg", quality = 0.94) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to prepare image for processing."));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

function blobToFile(blob, filename) {
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}

function formatKb(bytes) {
  return Number((bytes / 1024).toFixed(2));
}

function createResultFromBlob({ blob, previewUrl, width, height, quality, withinLimit, outputFormat, extra = {} }) {
  return {
    blob,
    previewUrl,
    width,
    height,
    kb: formatKb(blob.size),
    quality,
    withinLimit,
    outputFormat,
    mimeType: blob.type,
    ...extra
  };
}

function ToolSection({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function ResizeCompressPanel({ file, cropPixels, preset, onProcessed, activeTool = "resize" }) {
  const { loading: healthLoading, status, features, error: healthError, checkHealth } = useAiHealth();
  const aiUp = status === "UP";
  const target = getPresetTargetPx(preset);

  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [remoteProgress, setRemoteProgress] = useState(0);
  const [remoteStage, setRemoteStage] = useState("");

  const [bgCleaning, setBgCleaning] = useState(true);
  const [enhanceEnabled, setEnhanceEnabled] = useState(true);
  const [strength, setStrength] = useState(62);
  const [edgeSmoothness, setEdgeSmoothness] = useState(5);
  const [shadowRemoval, setShadowRemoval] = useState(60);
  const [sharpness, setSharpness] = useState(55);
  const [denoise, setDenoise] = useState(28);
  const [brightness, setBrightness] = useState(50);
  const [contrast, setContrast] = useState(54);
  const [clarity, setClarity] = useState(24);
  const [outputQuality, setOutputQuality] = useState(92);

  const [removeBgEnabled, setRemoveBgEnabled] = useState(true);
  const [smoothEdges, setSmoothEdges] = useState(6);
  const [featherEdges, setFeatherEdges] = useState(4);
  const [maskShift, setMaskShift] = useState(0);
  const [subjectBias, setSubjectBias] = useState(62);

  const [previewUrl, setPreviewUrl] = useState("");
  const [beforeUrl, setBeforeUrl] = useState("");
  const [previewMode, setPreviewMode] = useState("result");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const abortRef = useRef(null);

  const isRemoveBgTool = activeTool === "remove-bg";
  const isUpscaleTool = activeTool === "ai-upscale";

  const previewTabs = useMemo(() => {
    const tabs = [];
    if (beforeUrl) tabs.push({ id: "original", label: "Original Image", url: beforeUrl });
    if (previewUrl) tabs.push({ id: "result", label: "Removed Background", url: previewUrl });
    return tabs;
  }, [beforeUrl, previewUrl]);

  useEffect(() => {
    return () => {
      if (beforeUrl) URL.revokeObjectURL(beforeUrl);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [beforeUrl, previewUrl]);

  const handleResetEnhance = () => {
    setSharpness(55);
    setDenoise(28);
    setBrightness(50);
    setContrast(54);
    setClarity(24);
    setOutputQuality(92);
  };

  const handleAutoEnhance = async () => {
    if (!file || !cropPixels) {
      setError("Upload image and adjust crop first.");
      return;
    }
    try {
      setBusy(true);
      setError("");
      setProgress(5);
      const { canvas } = await buildResizedCanvas({ file, cropPixels, preset, onProgress: () => {} });
      setProgress(35);
      const { analyzeQuality, getAutoEnhancePreset } = await import("../features/photoEnhance/photoEnhance");
      const report = analyzeQuality(canvas);
      const auto = getAutoEnhancePreset(report);
      setSharpness(auto.sharpness);
      setDenoise(auto.denoise);
      setBrightness(auto.brightness);
      setContrast(auto.contrast);
      setClarity(auto.clarity);
      setEnhanceEnabled(true);
      setProgress(100);
    } catch (e) {
      setError(e.message || "Auto enhance failed.");
    } finally {
      setBusy(false);
    }
  };

  const cancelRemoteProcessing = () => {
    if (abortRef.current) abortRef.current.abort();
  };

  const runRemoteAiPipeline = async () => {
    const base = await buildResizedCanvas({ file, cropPixels, preset, onProgress: () => {} });
    const baseBlob = await canvasToBlob(base.canvas, "image/jpeg", 0.94);
    setBeforeUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(baseBlob);
    });

    let currentFile = blobToFile(baseBlob, "editor-base.jpg");
    const abortController = new AbortController();
    abortRef.current = abortController;

    if (enhanceEnabled && features.enhance && isUpscaleTool) {
      setRemoteStage("Running AI upscale...");
      setRemoteProgress(0);
      const enhancedBlob = await enhancePhoto(currentFile, false, 2, {
        signal: abortController.signal,
        timeoutMs: 120000,
        onUploadProgress: setRemoteProgress
      });
      currentFile = blobToFile(enhancedBlob, "editor-upscaled.jpg");
    }

    if (bgCleaning && features.bgWhitePro && !isRemoveBgTool) {
      setRemoteStage("Cleaning background...");
      setRemoteProgress(0);
      const whiteBlob = await bgWhitePro(currentFile, "u2net", edgeSmoothness, {
        signal: abortController.signal,
        timeoutMs: 120000,
        onUploadProgress: setRemoteProgress
      });
      currentFile = blobToFile(whiteBlob, "editor-bg-white.jpg");
    }

    abortRef.current = null;
    return {
      file: currentFile,
      crop: { x: 0, y: 0, width: base.canvas.width, height: base.canvas.height }
    };
  };

  const processStandardEditor = async () => {
    let sourceFile = file;
    let sourceCrop = cropPixels;
    const wantRemote = aiUp && isUpscaleTool && enhanceEnabled && features.enhance;

    if (wantRemote) {
      try {
        const remote = await runRemoteAiPipeline();
        sourceFile = remote.file;
        sourceCrop = remote.crop;
      } catch (e) {
        setWarning(e?.name === "AbortError" ? "AI upscale cancelled. Using original image." : "AI upscale unavailable right now. Using original image.");
        await checkHealth();
      }
    } else {
      const base = await buildResizedCanvas({ file, cropPixels, preset, onProgress: () => {} });
      const baseBlob = await canvasToBlob(base.canvas, "image/jpeg", 0.94);
      setBeforeUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(baseBlob);
      });
    }

    const result = await resizeAndCompressImage({
      file: sourceFile,
      cropPixels: sourceCrop,
      preset,
      onProgress: setProgress,
      backgroundOptions: { enabled: false },
      enhancementOptions: { enabled: false },
      compressionOptions: { outputQuality: outputQuality / 100 }
    });

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return result.previewUrl || "";
    });
    setPreviewMode("result");
    onProcessed({ ...result, outputFormat: "jpg", mimeType: "image/jpeg" });
  };

  const processBackgroundRemoval = async () => {
    const base = await buildResizedCanvas({ file, cropPixels, preset, onProgress: () => setProgress(16) });
    const baseBlob = await canvasToBlob(base.canvas, "image/jpeg", 0.94);
    setBeforeUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(baseBlob);
    });

    setRemoteStage("Detecting subject and removing background...");
    const removed = await removeBackgroundPro(base.canvas, {
      subjectBias,
      smoothEdges,
      featherEdges,
      maskShift,
      onProgress: (value) => setProgress(18 + Math.round(value * 0.45))
    });

    setRemoteStage("Preparing transparent PNG...");
    setProgress(86);
    const blob = await canvasToBlob(removed.transparentCanvas, "image/png");
    const nextPreviewUrl = URL.createObjectURL(blob);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return nextPreviewUrl;
    });
    setPreviewMode("result");
    setProgress(100);

    onProcessed(
      createResultFromBlob({
        blob,
        previewUrl: nextPreviewUrl,
        width: removed.transparentCanvas.width,
        height: removed.transparentCanvas.height,
        quality: "PNG",
        withinLimit: true,
        outputFormat: "png",
        extra: {
          mode: "remove-background"
        }
      })
    );
  };

  const handleProcess = async () => {
    if (!file) {
      setError("Upload an image first.");
      return;
    }
    if (!cropPixels) {
      setError("Adjust crop first.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      setWarning("");
      setProgress(1);
      setRemoteStage("");
      setRemoteProgress(0);

      if (isRemoveBgTool && removeBgEnabled) {
        await processBackgroundRemoval();
      } else {
        await processStandardEditor();
      }
    } catch (e) {
      setError(e.message || "Processing failed.");
    } finally {
      setBusy(false);
      setRemoteStage("");
      setRemoteProgress(0);
      abortRef.current = null;
    }
  };

  return (
    <div className="panel">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">
            {isRemoveBgTool ? "Remove Background" : isUpscaleTool ? "AI Upscale" : "Resize + Compress"}
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Target canvas: {target.width}x{target.height}px, max {preset.maxKb}KB source workflow
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {isRemoveBgTool ? "Transparent PNG Ready" : "Editor Output"}
        </div>
      </div>

      {healthLoading ? (
        <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          Checking AI services...
        </div>
      ) : null}

      {!healthLoading && !aiUp && isUpscaleTool ? (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          AI upscale service unavailable.
          {healthError ? <p className="mt-1 text-[11px]">{healthError}</p> : null}
        </div>
      ) : null}

      {!isRemoveBgTool ? (
        <div className="grid gap-4">
          {isUpscaleTool ? (
            <ToolSection title="AI Upscale" subtitle="Increase resolution, restore detail, and reduce blur.">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-blue-600"
                  checked={enhanceEnabled}
                  onChange={(e) => setEnhanceEnabled(e.target.checked)}
                  disabled={busy}
                />
                Enable AI upscale
              </label>
              <div className="mt-3 flex gap-2">
                <button type="button" className="btn-muted text-xs" onClick={handleAutoEnhance} disabled={busy}>
                  Auto Tune
                </button>
                <button type="button" className="btn-muted text-xs" onClick={handleResetEnhance} disabled={busy}>
                  Reset
                </button>
              </div>
            </ToolSection>
          ) : null}

          <ToolSection title="Export Quality" subtitle="Keep final JPEG output balanced for form uploads and cleaner detail.">
            <label className="text-xs font-medium text-slate-700">
              JPEG Output Quality: {(outputQuality / 100).toFixed(2)}
            </label>
            <input
              className="mt-1 w-full accent-blue-600"
              type="range"
              min={85}
              max={95}
              step={1}
              value={outputQuality}
              onChange={(e) => setOutputQuality(Number(e.target.value))}
              disabled={busy}
            />
          </ToolSection>
        </div>
      ) : (
        <div className="grid gap-4">
          <ToolSection title="AI Background Removal" subtitle="Detect the main subject, preserve fine details, and cut the background cleanly.">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600"
                checked={removeBgEnabled}
                onChange={(e) => setRemoveBgEnabled(e.target.checked)}
                disabled={busy}
              />
              Remove background with AI
            </label>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-700">Subject protection: {subjectBias}</label>
                <input className="mt-1 w-full accent-blue-600" type="range" min={30} max={90} step={1} value={subjectBias} onChange={(e) => setSubjectBias(Number(e.target.value))} disabled={busy} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-700">Output format</p>
                <div className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                  Transparent PNG
                </div>
              </div>
            </div>
          </ToolSection>

          <ToolSection title="Edge Refinement" subtitle="Smooth jagged edges, feather the mask, and expand or contract the cutout.">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Smooth edges: {smoothEdges}</label>
                <input className="mt-1 w-full accent-blue-600" type="range" min={0} max={16} step={1} value={smoothEdges} onChange={(e) => setSmoothEdges(Number(e.target.value))} disabled={busy} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Feather edges: {featherEdges}</label>
                <input className="mt-1 w-full accent-blue-600" type="range" min={0} max={18} step={1} value={featherEdges} onChange={(e) => setFeatherEdges(Number(e.target.value))} disabled={busy} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Expand / contract mask: {maskShift}</label>
                <input className="mt-1 w-full accent-blue-600" type="range" min={-12} max={12} step={1} value={maskShift} onChange={(e) => setMaskShift(Number(e.target.value))} disabled={busy} />
              </div>
            </div>
          </ToolSection>
        </div>
      )}

      <button type="button" onClick={handleProcess} disabled={busy} className="btn-success mt-4">
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-white" />
            {isRemoveBgTool ? "Removing background..." : "Processing..."}
          </span>
        ) : isRemoveBgTool ? (
          "Remove Background"
        ) : isUpscaleTool ? (
          "Generate AI Upscale"
        ) : (
          "Generate Final JPG"
        )}
      </button>

      {busy && remoteStage ? (
        <div className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-700">
          <p>{remoteStage}</p>
          {remoteProgress ? <p>Upload: {remoteProgress}%</p> : null}
          {isUpscaleTool ? (
            <button type="button" className="btn-muted mt-2 text-xs" onClick={cancelRemoteProcessing}>
              Cancel AI Request
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 h-3 w-full rounded-full bg-slate-200">
        <div className="h-3 rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
      </div>

      {previewTabs.length ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-700">Preview</p>
            <div className="inline-flex flex-wrap overflow-hidden rounded border border-slate-300 text-xs">
              {previewTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`px-2 py-1 ${previewMode === tab.id ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
                  onClick={() => setPreviewMode(tab.id)}
                  disabled={busy}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <img src={previewTabs.find((item) => item.id === previewMode)?.url || previewTabs[0].url} alt="Editor preview after AI processing" loading="lazy" className="max-h-48 w-full rounded object-contain" />
        </div>
      ) : null}

      {warning ? <p className="mt-2 rounded bg-amber-50 p-2 text-sm text-amber-700">{warning}</p> : null}
      {error ? <p className="mt-2 rounded bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
