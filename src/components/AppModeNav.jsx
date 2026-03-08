import { useState } from "react";
import { ChevronDownIcon } from "./AppIcons";

export default function AppModeNav({ mode = "pan" }) {
  const isPan = mode === "pan";
  const isKb = mode === "kb";
  const [showCompressTools, setShowCompressTools] = useState(false);

  return (
    <header className="sticky top-0 z-40 mb-5 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <a href="/" className="flex items-center gap-2">
          <img
            src="/file-wala-tool-logo.svg"
            alt="File Wala Tool logo"
            className="h-10 w-auto"
            loading="eager"
          />
        </a>

        <nav className="flex-1 px-2">
          <div className="flex items-center justify-center gap-2">
            <a
              href="/"
              className={`px-3 py-2 text-sm font-semibold transition ${
                isPan ? "text-blue-700" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              PAN Resizer
            </a>
            <button
              type="button"
              className="hidden items-center gap-1 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900 lg:inline-flex"
            >
              Photo Tools
              <ChevronDownIcon />
            </button>
            <button
              type="button"
              onClick={() => setShowCompressTools((s) => !s)}
              className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold transition ${
                showCompressTools || isKb ? "text-red-700" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Compress
              <ChevronDownIcon />
            </button>
          </div>
        </nav>

        <div>
          <a
            href="https://mdsufi.netlify.app"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900"
          >
            Portfolio
          </a>
        </div>
      </div>

      {showCompressTools ? (
        <div className="px-4 py-2">
          <div className="flex items-center justify-center gap-2">
            <a
              href="/kb-editor.html"
              className={`px-3 py-2 text-sm font-semibold transition ${
                isKb ? "text-red-700" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              IMG KB Compress
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}


