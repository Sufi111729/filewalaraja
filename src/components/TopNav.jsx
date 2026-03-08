import { useEffect, useRef, useState } from "react";
import {
  ArrowsHorizontalIcon,
  ChevronDownIcon,
  CloseIcon,
  FileIcon,
  FileImageIcon,
  ImageIcon,
  MenuIcon,
  MergeIcon,
  MinimizeIcon,
  SplitIcon
} from "./AppIcons";

const NAV = {
  pdf: {
    label: "PDF Tools",
    items: [
      { label: "Merge PDF", href: "/merge-pdf" },
      { label: "Split PDF", href: "/split-pdf" },
      { label: "PDF to Image", href: "/pdf-to-image" },
      { label: "Compress PDF 300KB", href: "/compress-pdf-to-300kb" }
    ]
  },
  image: {
    label: "Image Tools",
    items: [
      { label: "Image to 20KB", href: "/image-to-20kb" },
      { label: "Image to 50KB", href: "/image-to-50kb" },
      { label: "Image to 100KB", href: "/compress-image-100kb" },
      { label: "PAN Photo 50KB", href: "/pan-photo-50kb" },
      { label: "Signature 20KB", href: "/signature-20kb" },
      { label: "Crop & Resize", href: "/pan-editor.html?preset=photo" }
    ]
  },
  convert: {
    label: "Converters",
    items: [
      { label: "JPG to PNG", href: "/jpg-to-png" },
      { label: "PNG to JPG", href: "/png-to-jpg" },
      { label: "JPG to PDF", href: "/jpg-to-pdf" },
      { label: "PNG to PDF", href: "/png-to-pdf" },
      { label: "Image to PDF", href: "/image-to-pdf" }
    ]
  },
  compress: {
    label: "Compress Tools",
    items: [
      { label: "Image KB Resizer", href: "/kb-editor.html" },
      { label: "Image to 20KB", href: "/image-to-20kb" },
      { label: "Image to 50KB", href: "/image-to-50kb" },
      { label: "Image to 100KB", href: "/compress-image-100kb" },
      { label: "Compress PDF 300KB", href: "/compress-pdf-to-300kb" }
    ]
  }
};

function IconWrap({ children }) {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition-colors group-hover:border-slate-300 group-hover:text-slate-800" aria-hidden="true">
      {children}
    </span>
  );
}

function navItemIcon(label) {
  const text = String(label || "");
  if (text.includes("Merge")) return <IconWrap><MergeIcon className="h-3.5 w-3.5" /></IconWrap>;
  if (text.includes("Split")) return <IconWrap><SplitIcon className="h-3.5 w-3.5" /></IconWrap>;
  if (text.includes("Compress")) return <IconWrap><MinimizeIcon className="h-3.5 w-3.5" /></IconWrap>;
  if (text.includes("Image")) return <IconWrap><ImageIcon className="h-3.5 w-3.5" /></IconWrap>;
  if (text.includes("PDF")) return <IconWrap><FileIcon className="h-3.5 w-3.5" /></IconWrap>;
  return (
    <IconWrap>
      <FileImageIcon className="h-3.5 w-3.5" />
    </IconWrap>
  );
}

function sectionIcon(key) {
  if (key === "pdf") return <FileIcon className="h-4 w-4" />;
  if (key === "image") return <ImageIcon className="h-4 w-4" />;
  if (key === "convert") return <ArrowsHorizontalIcon className="h-4 w-4" />;
  if (key === "compress") return <MinimizeIcon className="h-4 w-4" />;
  return <FileIcon className="h-4 w-4" />;
}

function DesktopMenu({ openKey, setOpenKey, closeAll }) {
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
      {Object.entries(NAV).map(([key, section]) => {
        const isOpen = openKey === key;
        return (
          <div key={key} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-controls={`${key}-menu`}
              onClick={() => setOpenKey((prev) => (prev === key ? null : key))}
              className={`group inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-semibold uppercase tracking-wide transition-colors ${
                isOpen ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {sectionIcon(key)}
                <span className="relative">
                {section.label}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-slate-900 transition-all ${isOpen ? "w-full" : "w-0 group-hover:w-full"}`} />
              </span>
              </span>
              <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            <ul
              id={`${key}-menu`}
              role="menu"
              className={`absolute left-1/2 top-full z-50 mt-2 min-w-[290px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl transition-all duration-150 ${
                isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
              }`}
            >
              <li className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {section.label}
              </li>
              {section.items.map((item) => (
                <li key={item.label} role="none">
                  <a
                    role="menuitem"
                    href={item.href}
                    onClick={closeAll}
                    className="flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 transition-all hover:bg-slate-100 hover:text-slate-900"
                  >
                    {navItemIcon(item.label)}
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function MobileMenu({ open, closeAll }) {
  const [openAccordions, setOpenAccordions] = useState({
    pdf: false,
    image: false,
    convert: false,
    compress: false
  });

  useEffect(() => {
    if (!open) {
      setOpenAccordions({ pdf: false, image: false, convert: false, compress: false });
    }
  }, [open]);

  return (
    <div className={`fixed inset-0 top-16 z-40 bg-slate-900/20 backdrop-blur-sm transition-all duration-200 md:hidden ${open ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"}`}>
      <div className="mx-auto h-full max-w-[460px] px-3 pb-4 pt-3">
        <div className="h-full overflow-y-auto rounded-2xl border border-slate-200/90 bg-slate-50 p-3 shadow-2xl">
          <a href="/" onClick={closeAll} className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-[17px] font-semibold text-slate-900 shadow-sm">
            Home
          </a>
          <div className="mt-2 space-y-2">
            {Object.entries(NAV).map(([key, section]) => (
              <div key={key} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  aria-expanded={openAccordions[key]}
                  aria-controls={`mobile-${key}`}
                  onClick={() => setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-[17px] font-semibold text-slate-800"
                >
                  <span className="inline-flex items-center gap-2.5">
                    {sectionIcon(key)}
                    {section.label}
                  </span>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${openAccordions[key] ? "rotate-180" : ""}`} />
                </button>
                <div id={`mobile-${key}`} className={`overflow-hidden transition-all duration-200 ${openAccordions[key] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="space-y-1 border-t border-slate-100 p-2">
                    {section.items.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={closeAll}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      >
                        {navItemIcon(item.label)}
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="sticky bottom-0 mt-3 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-3">
            <a href="/?tab=all#pan-tool-suite" onClick={closeAll} className="btn-primary w-full">
              Browse All Tools
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TopNav() {
  const navRef = useRef(null);
  const lastScrollRef = useRef(0);
  const [openKey, setOpenKey] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);

  const closeAll = () => {
    setOpenKey(null);
    setMobileOpen(false);
  };

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") closeAll();
    }
    function onScroll() {
      const currentY = window.scrollY;
      setScrolled(currentY > 6);

      if (currentY < 12) {
        setNavVisible(true);
        lastScrollRef.current = currentY;
        return;
      }

      if (currentY > lastScrollRef.current) setNavVisible(false);
      if (currentY < lastScrollRef.current) setNavVisible(true);
      lastScrollRef.current = currentY;
    }
    function onOutside(event) {
      if (!navRef.current) return;
      if (!navRef.current.contains(event.target)) setOpenKey(null);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    onScroll();
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    if (mobileOpen) setNavVisible(true);
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      style={{ transform: navVisible ? "translateY(0)" : "translateY(-110%)" }}
      className={`sticky top-0 z-50 border-b transition-all duration-200 ${scrolled ? "border-slate-200/90 bg-white/92 shadow-sm backdrop-blur" : "border-slate-200/70 bg-white/84 backdrop-blur"}`}
    >
      <div ref={navRef} className="mx-auto max-w-[1180px] px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <a href="/" className="inline-flex items-center gap-2">
            <img src="/file-wala-tool-logo.svg" alt="File Wala Tool logo" className="h-8 w-auto" loading="eager" />
          </a>

          <DesktopMenu openKey={openKey} setOpenKey={setOpenKey} closeAll={closeAll} />

          <div className="flex items-center gap-2">
            <a href="/?tab=all#pan-tool-suite" className="btn-muted hidden h-10 px-3 text-xs md:inline-flex">
              All Tools
            </a>
            <button
              type="button"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 md:hidden"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      <MobileMenu open={mobileOpen} closeAll={closeAll} />
    </header>
  );
}
