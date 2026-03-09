import { useEffect, useMemo, useRef, useState } from "react";
import { CloudUploadIcon, UploadIcon } from "./AppIcons";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export default function UniversalImageUpload({ file, onFileSelected, busy }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function validateAndSend(nextFile) {
    if (!nextFile) return;
    if (!ACCEPTED.includes(nextFile.type)) {
      setError("Upload JPG, PNG, or WEBP image.");
      return;
    }
    if (nextFile.size > MAX_BYTES) {
      setError("Max upload size is 10MB.");
      return;
    }
    setError("");
    onFileSelected(nextFile);
  }

  return (
    <div
      className={`editor-upload-surface text-center ${dragging ? "editor-upload-surface-active" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        validateAndSend(event.dataTransfer.files?.[0]);
      }}
    >
      <div className="flex h-full flex-col items-center justify-center py-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/90 text-slate-700 shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
          <CloudUploadIcon className="h-5 w-5 text-slate-500" />
        </span>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Universal image upload</p>
        <p className="mt-2 text-base font-semibold text-slate-900">Drag and drop JPG, PNG, or WEBP here</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          Works for portraits, product photos, animals, objects, social media images, studio shots, and random uploaded pictures.
        </p>

        {file && previewUrl ? (
          <div className="mt-5 w-full max-w-sm rounded-[1.35rem] border border-white/70 bg-white/90 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <img
              src={previewUrl}
              alt="Uploaded source image preview"
              loading="lazy"
              className="mx-auto h-40 w-full rounded-[1.1rem] border border-slate-200 bg-white object-contain p-2 shadow-sm"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
              <p className="shrink-0 text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        ) : null}

        <button type="button" className="btn-muted mt-5 inline-flex items-center gap-2" onClick={() => inputRef.current?.click()} disabled={busy}>
          <UploadIcon className="h-4 w-4" />
          {file ? "Choose another image" : "Choose image"}
        </button>
        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">Final export is transparent PNG</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={(event) => {
          setDragging(false);
          validateAndSend(event.target.files?.[0]);
        }}
      />
      {error ? <p className="mt-3 rounded-[1rem] bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
