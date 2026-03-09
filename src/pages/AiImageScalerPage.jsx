import { useEffect, useMemo, useState } from "react";
import TopNav from "../components/TopNav";
import AppFooter from "../components/AppFooter";
import {
  altTextStrategy,
  buildAiImageScalerSchema,
  faqItems,
  h1Suggestions,
  internalLinkSuggestions,
  keywordCluster,
  landingCopy,
  metaDescriptionOptions,
  seoTitleOptions,
  slugSuggestions
} from "../content/aiImageScalerSeo";
import {
  downloadProcessedBlob,
  fileToObjectUrl,
  formatBytes,
  processAiScale
} from "../lib/aiScale";

const ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

const BENEFITS = [
  "Upscale low-resolution images with cleaner edges and more natural-looking detail.",
  "Downscale large photos intelligently for web, marketplaces, forms, and faster pages.",
  "Control output with 2x, 4x, custom resolution, or target KB exports."
];

const FEATURE_ROWS = [
  {
    label: "Best use case",
    upscale: "Restore small photos, portraits, product shots, thumbnails",
    downscale: "Shrink oversized assets for websites, uploads, and email"
  },
  {
    label: "Primary output goal",
    upscale: "More pixels, better clarity, less visible blur",
    downscale: "Smaller dimensions or file size with readable detail"
  },
  {
    label: "Ideal controls",
    upscale: "2x, 4x, custom width and height",
    downscale: "50%, 25%, custom size, target KB"
  },
  {
    label: "Quality focus",
    upscale: "Texture recovery, edge clarity, face-friendly finishing",
    downscale: "Readable text, preserved edges, balanced compression"
  }
];

const RELATED_TOOLS = [
  { label: "Image to 20KB", href: "/image-to-20kb", note: "Reduce tiny upload images for forms and signatures." },
  { label: "Image to 50KB", href: "/image-to-50kb", note: "Handle common government and portal upload limits." },
  { label: "Compress Image to 100KB", href: "/compress-image-100kb", note: "Prepare web images with a larger quality budget." },
  { label: "JPG to PNG", href: "/jpg-to-png", note: "Switch formats after resizing when you need transparent-safe PNG output." }
];

const TRUST_POINTS = [
  "Runs in the browser for a fast first result",
  "Preview before download",
  "Built for JPG, PNG, and WEBP workflows"
];

const QUICK_LINKS = [
  { label: "Reduce image size online", href: "/compress-image-100kb" },
  { label: "Image to 50KB", href: "/image-to-50kb" },
  { label: "Image to 20KB", href: "/image-to-20kb" }
];

const VARIANT_CONFIG = {
  both: {
    lockedMode: "",
    heroTitle: landingCopy.heroTitle,
    heroDescription: landingCopy.heroDescription,
    benefitIntro: landingCopy.benefitIntro,
    benefits: BENEFITS,
    quickLinks: QUICK_LINKS,
    toolTitle: "AI upper scaling and AI lower scaling tool",
    toolDescription: "Use presets for fast results or switch to custom resolution when you need exact pixel control.",
    modeSummary: "Choose between dedicated upscaling and downscaling workflows on one page.",
    secondaryBenefit:
      "Lower scaling mode reduces oversized assets for better page speed, lighter uploads, and healthier Core Web Vitals.",
    ctaLabel: "Upload and resize"
  },
  upscale: {
    lockedMode: "upscale",
    heroTitle: "AI Image Upscaler Online for Sharper High-Resolution Results",
    heroDescription:
      "Upscale image online with AI-guided detail recovery for portraits, products, social posts, and low-resolution photos. Increase resolution, reduce blur, and download a cleaner JPG, PNG, or WEBP result.",
    benefitIntro:
      "Built for users who need a dedicated AI image upscaler instead of a mixed resizing page.",
    benefits: [
      "Upscale low-resolution images with cleaner edges and more natural-looking detail.",
      "Improve clarity in portraits, product photos, thumbnails, and social media assets.",
      "Use 2x, 4x, or custom dimensions for exact high-resolution output."
    ],
    quickLinks: [
      { label: "AI Image Downscaler", href: "/ai-image-downscaler" },
      { label: "Image to 50KB", href: "/image-to-50kb" },
      { label: "Compress Image to 100KB", href: "/compress-image-100kb" }
    ],
    toolTitle: "AI image upscaler tool",
    toolDescription: "Choose 2x, 4x, or a custom resolution to enlarge images without the flat look of a basic resize.",
    modeSummary: "Dedicated upscale workflow for sharper enlargement and cleaner detail recovery.",
    secondaryBenefit:
      "Dedicated upscaling keeps the workflow focused on visual quality while still preserving fast previews and lightweight UI behavior.",
    ctaLabel: "Upload and upscale"
  },
  downscale: {
    lockedMode: "downscale",
    heroTitle: "AI Image Downscaler Online to Reduce Size Without Losing Quality",
    heroDescription:
      "Downscale image online to reduce resolution or file size while keeping text readable, edges clean, and colors balanced. Ideal for web uploads, marketplace images, and faster-loading assets.",
    benefitIntro:
      "Built for users who need a dedicated image size reducer and lower scaling workflow with better control over output size.",
    benefits: [
      "Downscale large photos intelligently for web, marketplaces, forms, and faster pages.",
      "Reduce image dimensions or target KB size while preserving readability and edges.",
      "Use 50%, 25%, custom resolution, or target KB exports for upload-ready files."
    ],
    quickLinks: [
      { label: "AI Image Upscaler", href: "/ai-image-upscaler" },
      { label: "Image to 20KB", href: "/image-to-20kb" },
      { label: "Image to 50KB", href: "/image-to-50kb" }
    ],
    toolTitle: "AI image downscaler tool",
    toolDescription: "Choose 50%, 25%, a custom resolution, or a target KB workflow for smaller files with cleaner detail retention.",
    modeSummary: "Dedicated downscale workflow for lighter uploads and faster delivery.",
    secondaryBenefit:
      "Lower scaling mode reduces oversized assets for better page speed, lighter uploads, and healthier Core Web Vitals.",
    ctaLabel: "Upload and downscale"
  }
};

function resolveVariant() {
  if (typeof window === "undefined") return "both";
  const path = window.location.pathname.toLowerCase();
  if (path.includes("ai-image-upscaler")) return "upscale";
  if (path.includes("ai-image-downscaler")) return "downscale";
  return "both";
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    </svg>
  );
}

function ShrinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5" />
      <path d="M3 3l6 6M21 3l-6 6M3 21l6-6M21 21l-6-6" />
    </svg>
  );
}

function UploadArea({ file, onChange, busy }) {
  const [dragging, setDragging] = useState(false);
  const previewUrl = useMemo(() => (file ? fileToObjectUrl(file) : ""), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFile(nextFile) {
    if (!nextFile) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(nextFile.type)) return;
    onChange(nextFile);
  }

  return (
    <label
      className={`ai-scaler-upload ${dragging ? "ai-scaler-upload-active" : ""} ${busy ? "opacity-80" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFile(event.dataTransfer.files?.[0]);
      }}
    >
      <input
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
        disabled={busy}
      />
      <div className="space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm ring-1 ring-slate-200">
          <SparkIcon />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Upload image</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Drop a JPG, PNG, or WEBP file here</h2>
          <p className="mt-3 text-sm text-slate-600">
            Drag and drop or tap to browse. The preview loads lazily and the processing runs in the browser for a fast first interaction.
          </p>
        </div>
        {file && previewUrl ? (
          <div className="mx-auto max-w-sm rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm">
            <img
              src={previewUrl}
              alt={`Before scaling preview for ${file.name}`}
              loading="lazy"
              className="h-52 w-full rounded-[1.1rem] object-contain"
            />
            <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
              <span className="truncate font-medium text-slate-900">{file.name}</span>
              <span>{formatBytes(file.size)}</span>
            </div>
          </div>
        ) : null}
        <span className="btn-primary inline-flex">{file ? "Replace image" : "Choose image"}</span>
      </div>
    </label>
  );
}

function ModeCard({ active, title, description, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ai-mode-card ${active ? "ai-mode-card-active" : ""}`}
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-900 ring-1 ring-slate-200">
        {icon}
      </span>
      <span className="block text-left">
        <span className="block text-base font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-sm text-slate-600">{description}</span>
      </span>
    </button>
  );
}

function PreviewCard({ title, imageUrl, alt, meta, emptyCopy }) {
  return (
    <article className="ai-preview-card">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        {meta ? <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{meta}</span> : null}
      </div>
      <div className="mt-4 flex min-h-[260px] items-center justify-center rounded-[1.4rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#eef4ff)] p-4">
        {imageUrl ? (
          <img src={imageUrl} alt={alt} loading="lazy" className="max-h-[320px] w-full rounded-[1.1rem] object-contain" />
        ) : (
          <p className="max-w-sm text-center text-sm text-slate-500">{emptyCopy}</p>
        )}
      </div>
    </article>
  );
}

export default function AiImageScalerPage() {
  const variant = useMemo(() => resolveVariant(), []);
  const variantConfig = VARIANT_CONFIG[variant] || VARIANT_CONFIG.both;
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState(variantConfig.lockedMode || "upscale");
  const [preset, setPreset] = useState(variantConfig.lockedMode === "downscale" ? "50" : "2x");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [targetKb, setTargetKb] = useState("150");
  const [outputMimeType, setOutputMimeType] = useState("image/webp");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const activeMode = variantConfig.lockedMode || mode;

  const beforePreviewUrl = useMemo(() => (file ? fileToObjectUrl(file) : ""), [file]);

  useEffect(() => {
    return () => {
      if (beforePreviewUrl) URL.revokeObjectURL(beforePreviewUrl);
    };
  }, [beforePreviewUrl]);

  useEffect(() => {
    if (!result?.previewUrl) return undefined;
    return () => URL.revokeObjectURL(result.previewUrl);
  }, [result]);

  useEffect(() => {
    if (variantConfig.lockedMode === "upscale") {
      setMode("upscale");
      setPreset((current) => (["2x", "4x", "custom"].includes(current) ? current : "2x"));
      return;
    }
    if (variantConfig.lockedMode === "downscale") {
      setMode("downscale");
      setPreset((current) => (["50", "25", "custom"].includes(current) ? current : "50"));
    }
  }, [variantConfig.lockedMode]);

  async function handleProcess() {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    try {
      const processed = await processAiScale({
        file,
        mode: activeMode,
        preset,
        customWidth,
        customHeight,
        targetKb: activeMode === "downscale" ? targetKb : "",
        outputMimeType
      });

      setResult({
        ...processed,
        previewUrl: URL.createObjectURL(processed.blob)
      });
    } catch (processingError) {
      setError(processingError.message || "Unable to process this image.");
    } finally {
      setBusy(false);
    }
  }

  function handleDownload() {
    if (!result || !file) return;
    const base = file.name.replace(/\.[^.]+$/, "") || "scaled-image";
    downloadProcessedBlob(result.blob, `${base}-${activeMode}`, result.outputExtension);
  }

  const schemaJson = useMemo(() => JSON.stringify(buildAiImageScalerSchema(variant)), [variant]);

  return (
    <>
      <TopNav />
      <main className="app-main">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaJson }} />

        <section className="ai-hero">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{landingCopy.eyebrow}</p>
              <h1 className="mt-4 max-w-3xl text-slate-950">{variantConfig.heroTitle}</h1>
              <p className="mt-5 max-w-2xl text-base text-slate-600 md:text-lg">{variantConfig.heroDescription}</p>
              <p className="mt-4 max-w-2xl text-sm text-slate-500">{variantConfig.benefitIntro}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {TRUST_POINTS.map((item) => (
                  <span key={item} className="ai-trust-pill">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {variantConfig.benefits.map((benefit) => (
                  <div key={benefit} className="rounded-[1.5rem] border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur">
                    <p className="text-sm text-slate-700">{benefit}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3 text-sm text-slate-600">
                <a href="#tool-interface" className="btn-primary">{variantConfig.ctaLabel}</a>
                <a href="#faq" className="btn-muted">Read FAQs</a>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick links</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variantConfig.quickLinks.map((item) => (
                    <a key={item.href} href={item.href} className="ai-chip">
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/88 p-4 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur">
              <UploadArea file={file} onChange={setFile} busy={busy} />
              <div className="mt-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Conversion-focused workflow</p>
                    <p className="mt-1 text-xs text-slate-600">{variantConfig.modeSummary}</p>
                  </div>
                  <a href="#tool-interface" className="btn-primary">
                    Open controls
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="retention-links-heading">
          <div className="panel">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="retention-links-heading">Need a different image optimization workflow?</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Users who need adjacent image workflows can continue into these related tools without leaving the image optimization path.
                </p>
              </div>
              <a href="/?tab=all#pan-tool-suite" className="btn-muted">See all image tools</a>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {variantConfig.quickLinks.map((item) => (
                <a key={item.href} href={item.href} className="tool-card">
                  <h3 className="text-slate-950">{item.label}</h3>
                  <p className="mt-2 text-sm text-slate-600">Open a more specific image optimization path for exact size targets or lighter delivery.</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="benefits-heading">
          <div className="panel">
            <h2 id="benefits-heading">Why this smart image resizer works better for SEO and UX</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3>Quality-first scaling</h3>
                <p className="mt-2 text-sm text-slate-600">AI-guided enhancement helps recover crisp edges and texture during enlargement instead of stretching pixels blindly.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3>Cleaner web delivery</h3>
                <p className="mt-2 text-sm text-slate-600">{variantConfig.secondaryBenefit}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3>Conversion-focused workflow</h3>
                <p className="mt-2 text-sm text-slate-600">One page lets users upload, preview, compare, and download quickly, which removes friction and increases completion rate.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="tool-interface" className="mt-8" aria-labelledby="tool-interface-heading">
          <div className="panel ai-tool-panel">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="tool-interface-heading">{variantConfig.toolTitle}</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  {variantConfig.toolDescription}
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Primary conversion goal: maximize uploads and completed downloads
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Supports JPG, PNG, WEBP
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4">
                {variant === "both" ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <ModeCard
                      active={activeMode === "upscale"}
                      title="AI Upper Scaling"
                      description="Upscale low resolution images with sharper detail and cleaner texture."
                      icon={<SparkIcon />}
                      onClick={() => {
                        setMode("upscale");
                        setPreset("2x");
                      }}
                    />
                    <ModeCard
                      active={activeMode === "downscale"}
                      title="AI Lower Scaling"
                      description="Reduce image dimensions or KB without flattening readability."
                      icon={<ShrinkIcon />}
                      onClick={() => {
                        setMode("downscale");
                        setPreset("50");
                      }}
                    />
                  </div>
                ) : null}

                <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Preset</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(activeMode === "upscale"
                          ? [
                              { value: "2x", label: "2x" },
                              { value: "4x", label: "4x" },
                              { value: "custom", label: "Custom" }
                            ]
                          : [
                              { value: "50", label: "50%" },
                              { value: "25", label: "25%" },
                              { value: "custom", label: "Custom" }
                            ]).map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setPreset(item.value)}
                            className={`ai-chip ${preset === item.value ? "ai-chip-active" : ""}`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Output format
                      </label>
                      <select
                        value={outputMimeType}
                        onChange={(event) => setOutputMimeType(event.target.value)}
                        className="ai-field mt-2"
                      >
                        <option value="image/webp">WEBP</option>
                        <option value="image/jpeg">JPG</option>
                        <option value="image/png">PNG</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Custom width</span>
                      <input
                        type="number"
                        min="1"
                        placeholder={activeMode === "upscale" ? "e.g. 2400" : "e.g. 1200"}
                        value={customWidth}
                        onChange={(event) => setCustomWidth(event.target.value)}
                        className="ai-field mt-2"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Custom height</span>
                      <input
                        type="number"
                        min="1"
                        placeholder={activeMode === "upscale" ? "e.g. 1600" : "e.g. 800"}
                        value={customHeight}
                        onChange={(event) => setCustomHeight(event.target.value)}
                        className="ai-field mt-2"
                      />
                    </label>
                  </div>

                  {activeMode === "downscale" ? (
                    <div className="mt-4">
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">Target KB size</span>
                        <input
                          type="number"
                          min="5"
                          placeholder="e.g. 150"
                          value={targetKb}
                          onChange={(event) => setTargetKb(event.target.value)}
                          className="ai-field mt-2"
                        />
                      </label>
                      <p className="mt-2 text-xs text-slate-500">Use this when you want smaller downloads or upload-friendly images without guessing compression settings.</p>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-slate-500">Upper scaling applies a detail-preserving enhancement pass to help reduce blur and visible pixelation after enlargement.</p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" onClick={handleProcess} disabled={!file || busy} className="btn-primary">
                      {busy ? "Processing..." : activeMode === "upscale" ? "Upscale image" : "Downscale image"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setResult(null);
                        setError("");
                      }}
                      className="btn-muted"
                    >
                      Reset
                    </button>
                    {result ? (
                      <button type="button" onClick={handleDownload} className="btn-success">
                        Download result
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Upper scaling</p>
                      <p className="mt-1 text-sm text-slate-700">Best for blurry thumbnails, portraits, and product photos.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Lower scaling</p>
                      <p className="mt-1 text-sm text-slate-700">Best for web delivery, uploads, and lighter page assets.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Output</p>
                      <p className="mt-1 text-sm text-slate-700">Download in WEBP, JPG, or PNG after previewing the result.</p>
                    </div>
                  </div>

                  {error ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <PreviewCard
                  title="Before"
                  imageUrl={beforePreviewUrl}
                  alt={file ? `Original image before ${activeMode} for ${file.name}` : "Empty image upload state"}
                  meta={file ? `${formatBytes(file.size)}` : ""}
                  emptyCopy="Upload an image to preview the source file here before running the scaler."
                />
                <PreviewCard
                  title="After"
                  imageUrl={result?.previewUrl}
                  alt={file ? `After ${activeMode} preview for ${file.name}` : "Empty processed image state"}
                  meta={result ? `${result.width} x ${result.height} | ${formatBytes(result.blob.size)}` : ""}
                  emptyCopy="Your processed preview will appear here with updated dimensions and file size."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="how-it-works-heading">
          <div className="panel">
            <h2 id="how-it-works-heading">How it works</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {landingCopy.howItWorks.map((step, index) => (
                <div key={step} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">{index + 1}</div>
                  <p className="mt-4 text-sm text-slate-600">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="feature-comparison-heading">
          <div className="panel overflow-hidden">
            <h2 id="feature-comparison-heading">Feature comparison</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-slate-200">
                <thead>
                  <tr className="bg-slate-900 text-left text-sm text-white">
                    <th className="px-4 py-4 font-semibold">Feature</th>
                    <th className="px-4 py-4 font-semibold">AI Upper Scaling</th>
                    <th className="px-4 py-4 font-semibold">AI Lower Scaling</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_ROWS.map((row) => (
                    <tr key={row.label} className="bg-white even:bg-slate-50">
                      <td className="border-t border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900">{row.label}</td>
                      <td className="border-t border-slate-200 px-4 py-4 text-sm text-slate-600">{row.upscale}</td>
                      <td className="border-t border-slate-200 px-4 py-4 text-sm text-slate-600">{row.downscale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="faq" className="mt-8" aria-labelledby="faq-heading">
          <div className="panel">
            <h2 id="faq-heading">FAQ</h2>
            <div className="mt-5 space-y-3">
              {faqItems.map((item) => (
                <details key={item.question} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <summary className="cursor-pointer list-none text-base font-semibold text-slate-950">{item.question}</summary>
                  <p className="mt-3 text-sm text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="related-tools-heading">
          <div className="panel">
            <h2 id="related-tools-heading">Related tools section</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {RELATED_TOOLS.map((tool) => (
                <a key={tool.href} href={tool.href} className="tool-card">
                  <h3 className="text-slate-950">{tool.label}</h3>
                  <p className="mt-2 text-sm text-slate-600">{tool.note}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="seo-content-heading">
          <div className="panel">
            <h2 id="seo-content-heading">SEO content and on-page optimization notes</h2>
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div>
                <h3>SEO title options</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {seoTitleOptions.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <h3 className="mt-5">Meta description options</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {metaDescriptionOptions.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <h3 className="mt-5">H1 suggestions</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {h1Suggestions.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <h3 className="mt-5">SEO-friendly slug suggestions</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {slugSuggestions.map((item) => <span key={item} className="ai-chip">{item}</span>)}
                </div>
              </div>

              <div>
                <h3>Keyword cluster</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {keywordCluster.map((item) => <span key={item} className="ai-chip">{item}</span>)}
                </div>

                <h3 className="mt-5">Alt text strategy</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {altTextStrategy.map((item) => <li key={item}>{item}</li>)}
                </ul>

                <h3 className="mt-5">Internal linking suggestions</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {internalLinkSuggestions.map((item) => (
                    <a key={item.href} href={item.href} className="ai-chip">
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="cta-heading">
          <div className="ai-cta">
            <div>
              <h2 id="cta-heading" className="text-slate-950">{landingCopy.ctaTitle}</h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-600">{landingCopy.ctaDescription}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Upload, preview, and download in one flow
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="#tool-interface" className="btn-primary">{variantConfig.ctaLabel}</a>
              <a href="/?tab=all#pan-tool-suite" className="btn-muted">Browse all tools</a>
            </div>
          </div>
        </section>
      </main>
      <AppFooter />
    </>
  );
}
