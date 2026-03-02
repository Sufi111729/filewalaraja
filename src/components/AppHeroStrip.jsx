export default function AppHeroStrip({ mode = "pan" }) {
  const isPan = mode === "pan";
  const isHome = mode === "home";

  const title = isPan
    ? "PAN Card Photo and Signature Editor"
    : isHome
      ? "File Wala Tool"
      : "File Converter Online for India Forms";
  const subtitle = isPan
    ? "Upload, crop, resize and export PAN-ready JPEG in a few clicks."
    : isHome
      ? "File Wala Tool (Filewala) for Sarkari forms, exam forms, and job portals: photo/signature resize, 20KB/50KB compression, and file conversion."
      : "Upload full image, set target KB, and export optimized JPEG with live preview.";

  return (
    <section className="mb-5 border-b border-slate-200 bg-white px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-4xl">{title}</h1>
        <p className="mt-3 text-base text-slate-600 md:text-lg">{subtitle}</p>
      </div>
    </section>
  );
}


