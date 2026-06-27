"use client";

import { useRef, useState } from "react";

type FileUploadProps = {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
};

function isPdfFile(file: File): boolean {
  const byType = file.type === "application/pdf";
  const byName = file.name.toLowerCase().endsWith(".pdf");
  return byType || byName;
}

export default function FileUpload({
  selectedFile,
  onFileSelect,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState("");

  const processFile = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!isPdfFile(file)) {
      setError("Only PDF files are accepted.");
      onFileSelect(null);
      return;
    }

    setError("");
    onFileSelect(file);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsDragActive(true);
          }
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragActive(false);

          if (disabled) {
            return;
          }

          const file = event.dataTransfer.files?.[0] ?? null;
          processFile(file);
        }}
        className={`group relative w-full overflow-hidden rounded-3xl border-2 border-dashed px-5 py-10 text-left transition-all duration-300 ${
          isDragActive
            ? "border-sky-500 bg-sky-50/95 shadow-[0_10px_30px_-18px_rgba(14,165,233,0.7)]"
            : "border-sky-200 bg-gradient-to-b from-white to-sky-50/50 hover:border-sky-300 hover:shadow-[0_12px_34px_-18px_rgba(14,165,233,0.52)]"
        } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
      >
        <span className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_40%),radial-gradient(circle_at_15%_100%,rgba(16,185,129,0.12),transparent_45%)]" />
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          disabled={disabled}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            processFile(file);
          }}
        />

        <div className="relative mx-auto max-w-lg space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700/90">Secure Upload</p>
          <p className="text-lg font-semibold text-slate-800 sm:text-xl">
            Drag and drop your medical report
          </p>
          <p className="text-sm text-slate-600">PDF files only, up to 20MB</p>
          <p className="text-sm font-semibold text-sky-700 group-hover:text-sky-800">
            {selectedFile ? selectedFile.name : "or click to browse"}
          </p>
        </div>
      </button>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
