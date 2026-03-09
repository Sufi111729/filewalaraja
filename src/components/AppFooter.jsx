export default function AppFooter() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <a href="/" className="inline-flex items-center">
            <img
              src="/file-wala-tool-logo.svg"
              alt="File Wala Tool brand logo"
              className="h-8 w-auto"
              loading="lazy"
            />
          </a>
          <p className="text-xs text-slate-500">Fast tools for image and PDF workflows.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <a href="/pan-editor.html" className="transition-colors hover:text-slate-900">Background Remover</a>
          <a href="/ai-image-scaler" className="transition-colors hover:text-slate-900">AI Image Scaler</a>
          <a href="/merge-pdf" className="transition-colors hover:text-slate-900">Merge PDF</a>
          <a href="/split-pdf" className="transition-colors hover:text-slate-900">Split PDF</a>
          <a href="/image-to-pdf" className="transition-colors hover:text-slate-900">Image to PDF</a>
          <a href="/pdf-to-image" className="transition-colors hover:text-slate-900">PDF to Image</a>
          <a href="https://mdsufidev.vercel.app" target="_blank" rel="noreferrer" className="transition-colors hover:text-red-700">Muhammad Sufiyan</a>
          <span className="text-slate-400">© {new Date().getFullYear()} File Wala Tool. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
