import { useEffect, useRef, useState } from "react";
import { bgWhitePro, enhancePhoto } from "../api/aiClient";
import { useAiHealth } from "../store/aiHealthStore";
import { buildResizedCanvas, getPresetTargetPx, resizeAndCompressImage } from "../lib/imageUtils";

function canvasToJpegBlob(canvas, quality = 0.94) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to prepare image for AI processing."));
        return;
      }
      resolve(blob);
    }, "image/jpeg", quality);
  });
}

function blobToFile(blob, filename) {
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}

export default function ResizeCompressPanel({ file, cropPixels, preset, onProcessed }) {
  const { loading: healthLoading, status, features, error: healthError, checkHealth } = useAiHealth();
  const aiUp = status === "UP";

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

  const [previewUrl, setPreviewUrl] = useState("");
  const [beforeUrl, setBeforeUrl] = useState("");
  const [previewMode, setPreviewMode] = useState("after");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const abortRef = useRef(null);
  const target = getPresetTargetPx(preset);

  useEffect(() => {
    return () => {
      if (beforeUrl) URL.revokeObjectURL(beforeUrl);
    };
  }, [beforeUrl]);

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
    const baseBlob = await canvasToJpegBlob(base.canvas, 0.94);
    setBeforeUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(baseBlob);
    });

    let currentFile = blobToFile(baseBlob, "pan-base.jpg");
    const abortController = new AbortController();
    abortRef.current = abortController;

    if (enhanceEnabled && features.enhance) {
      setRemoteStage("Enhancing photo...");
      setRemoteProgress(0);
      const enhancedBlob = await enhancePhoto(currentFile, false, 2, {
        signal: abortController.signal,
        timeoutMs: 120000,
        onUploadProgress: setRemoteProgress
      });
      currentFile = blobToFile(enhancedBlob, "pan-enhanced.jpg");
    }

    if (bgCleaning && features.bgWhitePro) {
      setRemoteStage("Whitening background...");
      setRemoteProgress(0);
      const whiteBlob = await bgWhitePro(currentFile, "u2net", edgeSmoothness, {
        signal: abortController.signal,
        timeoutMs: 120000,
        onUploadProgress: setRemoteProgress
      });
      currentFile = blobToFile(whiteBlob, "pan-bg-white.jpg");
    }

    abortRef.current = null;
    return {
      file: currentFile,
      crop: { x: 0, y: 0, width: base.canvas.width, height: base.canvas.height }
    };
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

      let sourceFile = file;
      let sourceCrop = cropPixels;

      const wantRemote = aiUp && ((enhanceEnabled && features.enhance) || (bgCleaning && features.bgWhitePro));

      if (wantRemote) {
        try {
          const remote = await runRemoteAiPipeline();
          sourceFile = remote.file;
          sourceCrop = remote.crop;
        } catch (e) {
          if (e?.name === "AbortError") {
            setWarning("AI processing cancelled. Using original image.");
          } else {
            setWarning("AI processing unavailable right now. Using original image.");
          }
          await checkHealth();
          sourceFile = file;
          sourceCrop = cropPixels;
        }
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

      setPreviewUrl(result.previewUrl || "");
      onProcessed(result);
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
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Resize + Compress</h2>
      <p className="text-xs text-slate-600">
        Target: {target.width}x{target.height}px, Max {preset.maxKb}KB
      </p>

      {healthLoading ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          Checking Pro AI service...
        </div>
      ) : null}

      {!healthLoading && !aiUp ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Pro AI features unavailable.
          {healthError ? <p className="mt-1 text-[11px]">{healthError}</p> : null}
        </div>
      ) : null}

      {!healthLoading && aiUp ? (
        <>
          {features.enhance ? (
            <>
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-blue-600"
                  checked={enhanceEnabled}
                  onChange={(e) => setEnhanceEnabled(e.target.checked)}
                  disabled={busy}
                />
                Clear Photo / Enhance (Pro AI)
              </label>
              {enhanceEnabled ? (
                <div className="mt-3 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex gap-2">
                    <button type="button" className="btn-muted text-xs" onClick={handleAutoEnhance} disabled={busy}>
                      Auto Enhance
                    </button>
                    <button type="button" className="btn-muted text-xs" onClick={handleResetEnhance} disabled={busy}>
                      Reset
                    </button>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Sharpness: {sharpness}</label>
                    <input className="mt-1 w-full accent-blue-600" type="range" min={0} max={100} step={1} value={sharpness} onChange={(e) => setSharpness(Number(e.target.value))} disabled={busy} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Denoise: {denoise}</label>
                    <input className="mt-1 w-full accent-blue-600" type="range" min={0} max={100} step={1} value={denoise} onChange={(e) => setDenoise(Number(e.target.value))} disabled={busy} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Brightness: {brightness}</label>
                    <input className="mt-1 w-full accent-blue-600" type="range" min={0} max={100} step={1} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} disabled={busy} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Contrast: {contrast}</label>
                    <input className="mt-1 w-full accent-blue-600" type="range" min={0} max={100} step={1} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} disabled={busy} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Clarity: {clarity}</label>
                    <input className="mt-1 w-full accent-blue-600" type="range" min={0} max={100} step={1} value={clarity} onChange={(e) => setClarity(Number(e.target.value))} disabled={busy} />
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {features.bgWhitePro ? (
            <>
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-blue-600"
                  checked={bgCleaning}
                  onChange={(e) => setBgCleaning(e.target.checked)}
                  disabled={busy}
                />
                Make Background Pure White (Pro AI)
              </label>

              {bgCleaning ? (
                <div className="mt-3 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Strength: {strength}</label>
                    <input className="mt-1 w-full accent-blue-600" type="range" min={0} max={100} step={1} value={strength} onChange={(e) => setStrength(Number(e.target.value))} disabled={busy} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Edge Smoothness: {edgeSmoothness}px</label>
                    <input className="mt-1 w-full accent-blue-600" type="range" min={0} max={12} step={1} value={edgeSmoothness} onChange={(e) => setEdgeSmoothness(Number(e.target.value))} disabled={busy} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Shadow Removal: {shadowRemoval}</label>
                    <input className="mt-1 w-full accent-blue-600" type="range" min={0} max={100} step={1} value={shadowRemoval} onChange={(e) => setShadowRemoval(Number(e.target.value))} disabled={busy} />
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      <div className="mt-3">
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
      </div>

      <button type="button" onClick={handleProcess} disabled={busy} className="btn-success mt-3">
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-white" />
            Processing...
          </span>
        ) : (
          "Generate Final JPG"
        )}
      </button>

      {busy && remoteStage ? (
        <div className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-700">
          <p>{remoteStage}</p>
          <p>Upload: {remoteProgress}%</p>
          <button type="button" className="btn-muted mt-2 text-xs" onClick={cancelRemoteProcessing}>
            Cancel AI Request
          </button>
        </div>
      ) : null}

      <div className="mt-3 h-3 w-full rounded-full bg-slate-200">
        <div className="h-3 rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
      </div>

      {previewUrl && beforeUrl ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-700">Before / After</p>
            <div className="inline-flex overflow-hidden rounded border border-slate-300 text-xs">
              <button type="button" className={`px-2 py-1 ${previewMode === "before" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`} onClick={() => setPreviewMode("before")} disabled={busy}>
                Before
              </button>
              <button type="button" className={`px-2 py-1 ${previewMode === "after" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`} onClick={() => setPreviewMode("after")} disabled={busy}>
                After
              </button>
            </div>
          </div>
          <img src={previewMode === "before" ? beforeUrl : previewUrl} alt={previewMode === "before" ? "Before preview" : "After preview"} className="max-h-40 w-full rounded object-contain" />
        </div>
      ) : null}

      {warning ? <p className="mt-2 rounded bg-amber-50 p-2 text-sm text-amber-700">{warning}</p> : null}
      {error ? <p className="mt-2 rounded bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
