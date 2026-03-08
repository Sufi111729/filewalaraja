import { useEffect, useMemo, useState } from "react";
import { PRESETS, downloadBlob, getPresetTargetPx } from "../lib/imageUtils";

export default function PreviewDownload({ result, presetId }) {
  const [validateState, setValidateState] = useState({
    called: false,
    loading: false,
    data: null,
    warning: ""
  });

  useEffect(() => {
    setValidateState({ called: false, loading: false, data: null, warning: "" });
  }, [result]);

  const filename = useMemo(() => `pan-${presetId}-${Date.now()}.jpg`, [presetId]);

  if (!result) {
    return null;
  }

  const handleValidate = async () => {
    if (validateState.called) return;
    setValidateState((s) => ({ ...s, called: true, loading: true, warning: "" }));
    const start = performance.now();

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const preset = PRESETS[presetId];
      if (!preset) throw new Error("Unknown preset.");
      const target = getPresetTargetPx(preset);

      const errors = [];
      const warnings = [];

      if (result.width !== target.width || result.height !== target.height) {
        errors.push({
          code: "DIMENSION_MISMATCH",
          message: `Expected ${target.width}x${target.height}px but got ${result.width}x${result.height}px`
        });
      }

      if (result.kb > preset.maxKb) {
        errors.push({
          code: "SIZE_LIMIT_EXCEEDED",
          message: `Expected <= ${preset.maxKb}KB but got ${result.kb}KB`
        });
      }

      if (!result.withinLimit) {
        warnings.push({
          code: "QUALITY_FLOOR_HIT",
          message: "Target size met with limited quality controls."
        });
      }

      const data = {
        ok: errors.length === 0,
        source: "client",
        presetId,
        checkedAt: new Date().toISOString(),
        checks: {
          expectedWidth: target.width,
          expectedHeight: target.height,
          actualWidth: result.width,
          actualHeight: result.height,
          maxKb: preset.maxKb,
          actualKb: result.kb,
          jpegQuality: result.quality
        },
        errors,
        warnings
      };
      const elapsed = Math.round(performance.now() - start);

      console.log("frontend_validate_ms", elapsed);
      console.log("frontend_validate_ok", !!data.ok);
      console.log("frontend_error_codes", (data.errors || []).map((e) => e.code));

      setValidateState((s) => ({ ...s, loading: false, data }));
    } catch (e) {
      const elapsed = Math.round(performance.now() - start);
      console.log("frontend_validate_ms", elapsed);
      console.log("frontend_validate_ok", false);
      console.log("frontend_error_codes", ["VALIDATION_FAILED"]);

      setValidateState((s) => ({
        ...s,
        loading: false,
        warning: e instanceof Error ? e.message : "Validation failed."
      }));
    }
  };

  return (
    <div className="panel">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Preview + Download</h2>
      <div className="preview-frame mt-0">
        <img
          src={result.previewUrl}
          alt="Final processed PAN image preview"
          loading="lazy"
          className="preview-image"
        />
      </div>
      <div className="mt-3 grid gap-1 text-xs text-slate-700">
        <p>Preview Px: {result.width}x{result.height}</p>
        <p>Final Size: {result.kb} KB</p>
        <p>JPEG Quality Used: {result.quality}</p>
      </div>
      {!result.withinLimit ? (
        <p className="mt-2 text-xs text-amber-600">
          50KB target hard hai. System ne max possible clarity maintain karte hue size ko control kiya hai.
        </p>
      ) : null}

      <div className="mt-3 grid gap-2">
        <button
          type="button"
          className="btn-primary"
          onClick={() => downloadBlob(result.blob, filename)}
        >
          Download JPG
        </button>

        <button
          type="button"
          className="btn-muted"
          disabled={validateState.called || validateState.loading}
          onClick={handleValidate}
        >
          {validateState.loading ? "Validating..." : "Validate Final (Client-side)"}
        </button>
      </div>

      {validateState.warning ? (
        <p className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-700">{validateState.warning}</p>
      ) : null}

      {validateState.data ? (
        <pre className="mt-2 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
          {JSON.stringify(validateState.data, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
