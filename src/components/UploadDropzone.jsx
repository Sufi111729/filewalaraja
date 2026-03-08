import { useEffect, useMemo, useRef, useState } from "react";
import { CloudUploadIcon, UploadIcon } from "./AppIcons";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png"];

export default function UploadDropzone({ onFileSelected, file }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  const validateAndSend = (file) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("Only JPG/JPEG/PNG input is allowed.");
      return;
    }
    setError("");
    onFileSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    validateAndSend(file);
  };

  const handleBrowse = (e) => {
    const file = e.target.files?.[0];
    validateAndSend(file);
  };

  const fileSizeKb = file ? (file.size / 1024).toFixed(1) : null;
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div
      className="panel upload-zone min-h-[300px] text-center"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="flex h-full flex-col items-center justify-center py-6">
        <CloudUploadIcon className="mx-auto h-10 w-10 text-slate-400" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Image Input</p>
        <p className="mt-2 text-sm font-medium text-slate-700">Drag and drop JPG/JPEG/PNG here</p>

        {file ? (
          <div className="mt-4">
            <img
              src={previewUrl}
              alt="Uploaded source image preview"
              loading="lazy"
              className="mx-auto h-40 w-auto rounded-lg border border-slate-200 object-contain"
            />
            <p className="mt-2 text-sm font-medium text-slate-800">{file.name}</p>
            <p className="text-xs text-slate-500">{fileSizeKb} KB</p>
          </div>
        ) : null}

        <button type="button" className="btn-muted mt-4 inline-flex items-center gap-2" onClick={() => inputRef.current?.click()}>
          <UploadIcon className="h-4 w-4" />
          {file ? "Change File" : "Choose File"}
        </button>
        <p className="mt-2 text-xs text-slate-500">Final output will be generated as JPG only.</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={handleBrowse}
      />
      {error ? <p className="mt-2 rounded bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
