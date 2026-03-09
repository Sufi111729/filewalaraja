import { useEffect, useMemo, useState } from "react";
import TopNav from "../components/TopNav";
import AppFooter from "../components/AppFooter";
import { ArrowDownIcon, ArrowUpIcon, DownloadIcon, UploadIcon } from "../components/AppIcons";
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
import { downloadProcessedBlob, fileToObjectUrl, formatBytes, processAiScale } from "../lib/aiScale";

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
    secondaryBenefit: "Lower scaling mode reduces oversized assets for better page speed, lighter uploads, and healthier Core Web Vitals.",
    ctaLabel: "Upload and resize"
  },
  upscale: {
    lockedMode: "upscale",
    heroTitle: "AI Image Upscaler Online for Sharper High-Resolution Results",
    heroDescription:
      "Upscale image online with AI-guided detail recovery for portraits, products, social posts, and low-resolution photos. Increase resolution, reduce blur, and download a cleaner JPG, PNG, or WEBP result.",
    benefitIntro: "Built for users who need a dedicated AI image upscaler instead of a mixed resizing page.",
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
    secondaryBenefit: "Dedicated upscaling keeps the workflow focused on visual quality while still preserving fast previews and lightweight UI behavior.",
    ctaLabel: "Upload and upscale"
  },
  downscale: {
    lockedMode: "downscale",
    heroTitle: "AI Image Downscaler Online to Reduce Size Without Losing Quality",
    heroDescription:
      "Downscale image online to reduce resolution or file size while keeping text readable, edges clean, and colors balanced. Ideal for web uploads, marketplace images, and faster-loading assets.",
    benefitIntro: "Built for users who need a dedicated image size reducer and lower scaling workflow with better control over output size.",
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
    secondaryBenefit: "Lower scaling mode reduces oversized assets for better page speed, lighter uploads, and healthier Core Web Vitals.",
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

function CompareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M12 5v14" />
    </svg>
  );
}

function DimensionIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M8 4H4v4M20 8V4h-4M16 20h4v-4M4 16v4h4" />
      <path d="M8 8h8v8H8z" />
    </svg>
  );
}

function UndoLikeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M9 8 5 12l4 4" />
      <path d="M5 12h8a5 5 0 1 1 0 10h-1" />
    </svg>
  );
}

function EditorHeaderButton({ active = false, children, ...props }) {
  return (
    <button type="button" className={`editor-header-btn ${active ? "editor-header-btn-active" : ""}`} {...props}>
      {children}
    </button>
  );
}

function EditorToolButton({ active, icon, title, description, metric, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`editor-mode-card ${active ? "editor-mode-card-active" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <span className="editor-tool-tile-icon">{icon}</span>
        {metric ? <span className="editor-mode-metric">{metric}</span> : null}
      </div>
      <span className="mt-4 block text-left">
        <span className="block text-sm font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-500">{description}</span>
      </span>
    </button>
  );
}

function PropertyCard({ eyebrow, title, description, className = "", children }) {
  return (
    <section className={`editor-property-card ${className}`}>
      <div>
        <p className="editor-section-eyebrow">{eyebrow}</p>
        <h3 className="mt-2 text-base font-semibold text-slate-950">{title}</h3>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

function SegmentedButton({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`editor-segment ${active ? "editor-segment-active" : ""}`}>
      {children}
    </button>
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
      <input type="file" accept={ACCEPT} className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} disabled={busy} />
      <div className="space-y-5">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/95 text-slate-900 shadow-sm">
          <UploadIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="editor-section-eyebrow">Upload source</p>
          <h2 className="mt-2 text-[1.65rem] font-semibold tracking-[-0.03em] text-slate-950">Drop a JPG, PNG, or WEBP file</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Bring in the original image, choose the scaling workflow, and compare the result before exporting.
          </p>
        </div>
        {file && previewUrl ? (
          <div className="mx-auto max-w-sm rounded-[1.5rem] border border-slate-200/90 bg-white/95 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <img src={previewUrl} alt={`Before scaling preview for ${file.name}`} loading="lazy" className="h-52 w-full rounded-[1.1rem] object-contain" />
            <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
              <span className="truncate font-medium text-slate-900">{file.name}</span>
              <span>{formatBytes(file.size)}</span>
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <span className="btn-primary inline-flex">{file ? "Replace image" : "Choose image"}</span>
          <span className="editor-secondary-inline">Local processing preview</span>
        </div>
      </div>
    </label>
  );
}

function PreviewCard({ title, imageUrl, alt, meta, emptyCopy, emphasis = false }) {
  return (
    <article className={`editor-preview-card ${emphasis ? "editor-preview-card-emphasis" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="editor-section-eyebrow">{title}</p>
          <h3 className="mt-2 text-base font-semibold text-slate-950">{title === "Before" ? "Source image" : "Processed output"}</h3>
        </div>
        {meta ? <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{meta}</span> : null}
      </div>
      <div className="editor-preview-stage mt-4">
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
  const [compareView, setCompareView] = useState("split");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    setSuccess("");
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
      setCompareView("after");
      setSuccess(
        activeMode === "upscale"
          ? "Enhancement ready. Review the sharpened output and export when it looks right."
          : "Downscaled result ready. Review the lighter output and export when it looks right."
      );
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

  function handleResetWorkspace() {
    setFile(null);
    setResult(null);
    setError("");
    setSuccess("");
    setCustomWidth("");
    setCustomHeight("");
    setTargetKb("150");
    setOutputMimeType("image/webp");
    setPreset(activeMode === "downscale" ? "50" : "2x");
    setCompareView("split");
  }

  const schemaJson = useMemo(() => JSON.stringify(buildAiImageScalerSchema(variant)), [variant]);
  const sourceLabel = file ? file.name : "No image selected";
  const outputSummary = result ? `${result.width} x ${result.height}` : "Processing not run yet";
  const qualityNote = activeMode === "upscale"
    ? "AI enhancement rebuilds detail after enlargement for a cleaner premium finish."
    : "Smart lower scaling preserves edge clarity while reducing dimensions or target KB.";
  const presetSummary = activeMode === "upscale"
    ? preset === "custom" ? "Custom upscale" : `Preset ${preset}`
    : preset === "custom" ? "Custom reduction" : `Preset ${preset}%`;

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
                {TRUST_POINTS.map((benefit) => (
                  <span key={benefit} className="ai-trust-pill">
                    {benefit}
                  </span>
                ))}
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {BENEFITS.map((benefit) => (
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
                <p className="text-sm font-semibold text-slate-900">Conversion-focused workflow</p>
                <p className="mt-1 text-xs text-slate-600">{variantConfig.modeSummary}</p>
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
          <div className="editor-shell">
            <div className="editor-topbar">
              <div className="editor-topbar-copy">
                <p className="editor-section-eyebrow">Smart image scaling editor</p>
                <h2 id="tool-interface-heading" className="mt-2 text-[1.9rem] font-semibold tracking-[-0.04em] text-slate-950">
                  {variantConfig.toolTitle}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{variantConfig.toolDescription}</p>
                <div className="editor-topbar-meta mt-4">
                  <span className="editor-mini-stat"><span>Mode</span><strong>{activeMode === "upscale" ? "Enhance Resolution" : "Reduce Size Smartly"}</strong></span>
                  <span className="editor-mini-stat"><span>Preset</span><strong>{presetSummary}</strong></span>
                  <span className="editor-mini-stat"><span>Output</span><strong>{result ? outputSummary : "Awaiting render"}</strong></span>
                </div>
              </div>
              <div className="editor-topbar-actions">
                <div className="editor-toolbar-group">
                  <EditorHeaderButton onClick={handleResetWorkspace}>
                    <UndoLikeIcon />
                    Reset
                  </EditorHeaderButton>
                </div>
                <div className="editor-toolbar-group">
                  <EditorHeaderButton active={compareView === "before"} onClick={() => setCompareView("before")}>Before</EditorHeaderButton>
                  <EditorHeaderButton active={compareView === "split"} onClick={() => setCompareView("split")}>
                    <CompareIcon />
                    Compare
                  </EditorHeaderButton>
                  <EditorHeaderButton active={compareView === "after"} onClick={() => setCompareView("after")}>After</EditorHeaderButton>
                </div>
                <button type="button" onClick={handleDownload} disabled={!result} className="btn-primary">
                  <DownloadIcon className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>

            <div className="editor-workspace-grid">
              <aside className="editor-sidebar">
                <PropertyCard
                  eyebrow="Workflow"
                  title="Choose the scaling path"
                  description="Use a focused upscale or downscale flow with cleaner hierarchy and predictable output controls."
                >
                  {variant === "both" ? (
                    <div className="space-y-3">
                      <EditorToolButton
                        active={activeMode === "upscale"}
                        title="Enhance Resolution"
                        description="Rebuild detail for portraits, products, and low-resolution assets."
                        metric="2x / 4x"
                        icon={<ArrowUpIcon className="h-4 w-4" />}
                        onClick={() => {
                          setMode("upscale");
                          setPreset("2x");
                        }}
                      />
                      <EditorToolButton
                        active={activeMode === "downscale"}
                        title="Reduce Size Smartly"
                        description="Lower dimensions or file weight while preserving clean edges."
                        metric="50 / 25"
                        icon={<ArrowDownIcon className="h-4 w-4" />}
                        onClick={() => {
                          setMode("downscale");
                          setPreset("50");
                        }}
                      />
                    </div>
                  ) : (
                    <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">{activeMode === "upscale" ? "Enhance Resolution" : "Reduce Size Smartly"}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{qualityNote}</p>
                    </div>
                  )}
                </PropertyCard>

                <PropertyCard eyebrow="Actions" title="Run processing" description="Apply the selected scaling flow, then export when the preview looks right.">
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={handleProcess} disabled={!file || busy} className="btn-primary">
                      {busy ? "Processing..." : activeMode === "upscale" ? "Apply upscale" : "Apply downscale"}
                    </button>
                    <button type="button" onClick={handleResetWorkspace} className="btn-muted">Clear</button>
                  </div>
                  <div className="editor-brush-pill-row mt-4">
                    <span className="editor-brush-pill">{activeMode === "upscale" ? "High-detail preview" : "Optimized lighter output"}</span>
                    <span className="editor-brush-pill">{outputMimeType.replace("image/", "").toUpperCase()}</span>
                  </div>
                </PropertyCard>
              </aside>

              <section className="editor-canvas-panel">
                <div className="editor-canvas-header">
                  <div>
                    <p className="editor-section-eyebrow">Preview studio</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">Review before and after</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Keep the image as the visual focus while switching between source, output, and comparison states.
                    </p>
                  </div>
                  <div className="editor-status-pill">
                    <DimensionIcon />
                    <span>{result ? outputSummary : sourceLabel}</span>
                  </div>
                </div>

                <div className="editor-stage-toolbar">
                  <div className="editor-canvas-hud">
                    <span>{activeMode === "upscale" ? "Enhance Resolution" : "Reduce Size Smartly"}</span>
                    <span>{compareView === "split" ? "Dual preview" : compareView === "before" ? "Source preview" : "Processed preview"}</span>
                    <span>{result ? formatBytes(result.blob.size) : "No output yet"}</span>
                  </div>
                </div>

                <div className="editor-stage">
                  {busy ? (
                    <div className="editor-processing-overlay">
                      <div className="editor-processing-card">
                        <span className="editor-processing-spinner" />
                        <div>
                          <p className="text-sm font-semibold text-slate-950">Preparing {activeMode === "upscale" ? "enhanced" : "optimized"} preview</p>
                          <p className="mt-1 text-sm text-slate-500">Generating a high-quality result and updating the comparison canvas.</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {compareView === "before" ? (
                    <PreviewCard
                      title="Before"
                      imageUrl={beforePreviewUrl}
                      alt={file ? `Original image before ${activeMode} for ${file.name}` : "Empty image upload state"}
                      meta={file ? `${formatBytes(file.size)}` : ""}
                      emptyCopy="Upload an image to inspect the source preview before running the scaler."
                      emphasis
                    />
                  ) : null}

                  {compareView === "after" ? (
                    <PreviewCard
                      title="After"
                      imageUrl={result?.previewUrl}
                      alt={file ? `After ${activeMode} preview for ${file.name}` : "Empty processed image state"}
                      meta={result ? `${result.width} x ${result.height} | ${formatBytes(result.blob.size)}` : ""}
                      emptyCopy="Run the scaler to render the processed result and export-ready preview."
                      emphasis
                    />
                  ) : null}

                  {compareView === "split" ? (
                    <div className="grid gap-4 xl:grid-cols-2">
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
                        emphasis
                      />
                    </div>
                  ) : null}
                </div>

                {success ? <p className="editor-feedback editor-feedback-success mt-4">{success}</p> : null}
                {error ? <p className="editor-feedback editor-feedback-error mt-4">{error}</p> : null}
              </section>

              <aside className="editor-properties-panel">
                <PropertyCard
                  eyebrow="Scale"
                  title={activeMode === "upscale" ? "Enhancement presets" : "Reduction presets"}
                  description={activeMode === "upscale" ? "Select a premium default or use exact custom dimensions." : "Choose fixed ratios or switch to exact dimensions and target output weight."}
                >
                  <div className="editor-segmented-wrap editor-segmented-grid">
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
                      <SegmentedButton key={item.value} active={preset === item.value} onClick={() => setPreset(item.value)}>
                        {item.label}
                      </SegmentedButton>
                    ))}
                  </div>
                </PropertyCard>

                <PropertyCard eyebrow="Dimensions" title="Custom output size" description="Set exact pixel dimensions when the default scale cards are not enough.">
                  <div className="editor-inspector-grid">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Width</span>
                      <input type="number" min="1" placeholder={activeMode === "upscale" ? "e.g. 2400" : "e.g. 1200"} value={customWidth} onChange={(event) => setCustomWidth(event.target.value)} className="ai-field mt-2" />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Height</span>
                      <input type="number" min="1" placeholder={activeMode === "upscale" ? "e.g. 1600" : "e.g. 800"} value={customHeight} onChange={(event) => setCustomHeight(event.target.value)} className="ai-field mt-2" />
                    </label>
                  </div>
                </PropertyCard>

                <PropertyCard eyebrow="Output" title="Export settings" description="Keep the controls compact and production-ready.">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Format</span>
                    <select value={outputMimeType} onChange={(event) => setOutputMimeType(event.target.value)} className="ai-field mt-2">
                      <option value="image/webp">WEBP</option>
                      <option value="image/jpeg">JPG</option>
                      <option value="image/png">PNG</option>
                    </select>
                  </label>

                  {activeMode === "downscale" ? (
                    <label className="mt-4 block">
                      <span className="text-sm font-medium text-slate-700">Target KB size</span>
                      <input type="number" min="5" placeholder="e.g. 150" value={targetKb} onChange={(event) => setTargetKb(event.target.value)} className="ai-field mt-2" />
                    </label>
                  ) : null}

                  <div className="editor-note-card mt-4">
                    <p className="text-sm font-semibold text-slate-900">Processing note</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{qualityNote}</p>
                  </div>
                </PropertyCard>

                <PropertyCard eyebrow="Preview notes" title="Result summary">
                  <div className="space-y-3">
                    <div className="editor-summary-row">
                      <span>Input</span>
                      <strong>{file ? formatBytes(file.size) : "No file"}</strong>
                    </div>
                    <div className="editor-summary-row">
                      <span>Output</span>
                      <strong>{result ? formatBytes(result.blob.size) : "Not generated"}</strong>
                    </div>
                    <div className="editor-summary-row">
                      <span>Dimensions</span>
                      <strong>{result ? outputSummary : "Waiting"}</strong>
                    </div>
                  </div>
                </PropertyCard>
              </aside>
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
