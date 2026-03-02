export default function AppFooter() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_0.9fr]">
          <div>
            <a href="/" className="inline-flex items-center">
              <img
                src="/logo-file-wala-raja.svg"
                alt="File Wala Tool"
                className="h-10 w-auto"
                loading="lazy"
              />
            </a>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
              Professional toolkit for PAN card image editing, KB compression, and ID document checks.
            </p>
          </div>

          <div className="md:justify-self-end">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Quick Links</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-600">
              <li>
                <a href="/file-wala-tool" className="transition-colors hover:text-slate-900">
                  File Wala Tool
                </a>
              </li>
              <li>
                <a href="/filewala" className="transition-colors hover:text-slate-900">
                  File Wala
                </a>
              </li>
              <li>
                <a href="/?tab=pan-tool#pan-tool-suite" className="transition-colors hover:text-slate-900">
                  PAN Tool
                </a>
              </li>
              <li>
                <a href="/?tab=all#pan-tool-suite" className="transition-colors hover:text-slate-900">
                  All Tools
                </a>
              </li>
              <li>
                <a href="/document-validator.html" className="transition-colors hover:text-slate-900">
                  ID Document
                </a>
              </li>
              <li>
                <a href="/compress-pdf-to-300kb" className="transition-colors hover:text-slate-900">
                  Compress PDF to 300KB
                </a>
              </li>
              <li>
                <a href="/image-to-50kb" className="transition-colors hover:text-slate-900">
                  Image to 50KB
                </a>
              </li>
              <li>
                <a href="/image-to-20kb" className="transition-colors hover:text-slate-900">
                  Image to 20KB
                </a>
              </li>
              <li>
                <a href="/pan-photo-50kb" className="transition-colors hover:text-slate-900">
                  PAN Photo 50KB
                </a>
              </li>
              <li>
                <a href="/signature-20kb" className="transition-colors hover:text-slate-900">
                  Signature 20KB
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Creator</h3>
            <p className="mt-3 text-sm text-slate-600">Muhammad Sufiyan</p>
            <a
              href="https://mdsufidev.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm font-medium text-red-600 transition-colors hover:text-red-700"
            >
              mdsufidev.vercel.app
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
          (c) {new Date().getFullYear()} File Wala Tool. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
