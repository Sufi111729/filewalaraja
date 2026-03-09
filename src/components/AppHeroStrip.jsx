export default function AppHeroStrip({ mode = "pan" }) {
  const isPan = mode === "pan";
  const isHome = mode === "home";
  const isKb = mode === "kb";

  const title = isPan
    ? "AI Background Remover and Image Editor"
    : isKb
      ? "Reduce Image Size Online by KB"
    : isHome
      ? "File Wala Tool"
      : "File Converter Online for India Forms";
  const subtitle = isPan
    ? "Upload, crop, resize, AI upscale, remove background, and export a transparent PNG from one editor."
    : isKb
      ? "Upload image, choose target KB, and export optimized output with preview."
    : isHome
      ? "File Wala Tool (Filewala) for Sarkari forms, exam forms, and job portals: photo/signature resize, 20KB/50KB compression, and file conversion."
      : "Upload full image, set target KB, and export optimized JPEG with live preview.";

  return (
    <section className="hero-shell">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-slate-900">{title}</h1>
        <p className="mt-3 text-base text-slate-600 md:text-lg">{subtitle}</p>
        <p className="sr-only">
          File converter online platform for image to pdf converter, jpg to pdf free, png to pdf, compress image to 20kb, compress image to 50kb, and pdf compressor 300kb.
        </p>
      </div>
    </section>
  );
}


