import { useEffect, useMemo, useRef, useState } from "react";
import { CloudUploadIcon, UploadIcon } from "./AppIcons";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export default function UniversalImageUpload({ file, onFileSelected, busy }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
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
      className="panel upload-zone min-h-[300px] text-center"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        validateAndSend(event.dataTransfer.files?.[0]);
      }}
    >
      <div className="flex h-full flex-col items-center justify-center py-6">
        <CloudUploadIcon className="mx-auto h-10 w-10 text-slate-400" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Universal image upload</p>
        <p className="mt-2 text-sm font-medium text-slate-700">Drag and drop JPG, PNG, or WEBP here</p>
        <p className="mt-2 max-w-md text-xs text-slate-500">
          Works for portraits, product photos, animals, objects, social media images, studio shots, and random uploaded pictures.
        </p>

        {file && previewUrl ? (
          <div className="mt-4">
            <img
              src={previewUrl}
              alt="Uploaded source image preview"
              loading="lazy"
              className="mx-auto h-40 w-auto rounded-lg border border-slate-200 object-contain"
            />
            <p className="mt-2 text-sm font-medium text-slate-800">{file.name}</p>
            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : null}

        <button type="button" className="btn-muted mt-4 inline-flex items-center gap-2" onClick={() => inputRef.current?.click()} disabled={busy}>
          <UploadIcon className="h-4 w-4" />
          {file ? "Choose another image" : "Choose image"}
        </button>
        <p className="mt-2 text-xs text-slate-500">Final export is transparent PNG.</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={(event) => validateAndSend(event.target.files?.[0])}
      />
      {error ? <p className="mt-2 rounded bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
