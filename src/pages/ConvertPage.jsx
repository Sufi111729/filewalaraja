import { lazy, Suspense, useMemo } from "react";
import TopNav from "../components/TopNav";
import AppFooter from "../components/AppFooter";

const ConverterCard = lazy(() => import("../components/ConverterCard"));

const TOOLS = [
  {
    id: "jpg-to-png",
    title: "JPG to PNG",
    description: "Convert JPG images to PNG format with preserved dimensions.",
    path: "/jpg-to-png",
    key: "jpg-to-png",
    accept: ".jpg,.jpeg,image/jpeg",
    type: "image",
    targetMime: "image/png",
    targetExt: "png"
  },
  {
    id: "png-to-jpg",
    title: "PNG to JPG",
    description: "Convert PNG images to JPG format with white background support.",
    path: "/png-to-jpg",
    key: "png-to-jpg",
    accept: ".png,image/png",
    type: "image",
    targetMime: "image/jpeg",
    targetExt: "jpg"
  },
  {
    id: "jpg-to-pdf",
    title: "JPG to PDF",
    description: "Convert one or multiple JPG files into a single PDF file.",
    path: "/jpg-to-pdf",
    key: "jpg-to-pdf",
    accept: ".jpg,.jpeg,image/jpeg",
    type: "to-pdf",
    targetMime: "application/pdf",
    targetExt: "pdf"
  },
  {
    id: "png-to-pdf",
    title: "PNG to PDF",
    description: "Convert one or multiple PNG files into a single PDF file.",
    path: "/png-to-pdf",
    key: "png-to-pdf",
    accept: ".png,image/png",
    type: "to-pdf",
    targetMime: "application/pdf",
    targetExt: "pdf"
  },
  {
    id: "img-to-pdf",
    title: "IMG to PDF",
    description: "Convert JPG, PNG, WEBP and other image formats into a single PDF.",
    path: "/image-to-pdf",
    key: "img-to-pdf",
    accept: "image/*,.jpg,.jpeg,.png,.webp,.bmp,.gif",
    type: "to-pdf",
    targetMime: "application/pdf",
    targetExt: "pdf"
  },
  {
    id: "merge-pdf",
    title: "Merge PDF Files Online",
    description: "Merge multiple PDF files into one PDF in chosen upload order.",
    path: "/merge-pdf",
    key: "merge-pdf",
    accept: ".pdf,application/pdf",
    type: "external",
    externalHref: "/merge-pdf",
    targetMime: "application/pdf",
    targetExt: "pdf"
  },
  {
    id: "split-pdf",
    title: "Split PDF Pages Online",
    description: "Split a PDF into separate pages or selected ranges with ZIP download support.",
    path: "/split-pdf",
    key: "split-pdf",
    accept: ".pdf,application/pdf",
    type: "external",
    externalHref: "/split-pdf",
    targetMime: "application/pdf",
    targetExt: "pdf"
  }
];

function resolveSelectedTool() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const toolParam = params.get("tool");
  if (toolParam) return toolParam;

  const pathname = window.location.pathname;
  const found = TOOLS.find((t) => t.path === pathname);
  return found ? found.key : null;
}

export default function ConvertPage() {
  const selectedKey = useMemo(() => resolveSelectedTool(), []);
  const selected = useMemo(() => TOOLS.find((t) => t.key === selectedKey) || null, [selectedKey]);
  const imageFormatTools = useMemo(() => TOOLS.filter((tool) => tool.type === "image"), []);
  const pdfTools = useMemo(() => TOOLS.filter((tool) => tool.type === "to-pdf" || tool.type === "external"), []);

  return (
    <>
      <TopNav />
      <main className="app-main">
        <section className="hero-shell">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-slate-900">
              {selected ? `${selected.title} Converter Online` : "File Converter Online for India Forms"}
            </h1>
            <p className="mt-3 text-base text-slate-600 md:text-lg">
              Convert files online: JPG to PNG, PNG to JPG, JPG to PDF, PNG to PDF, IMG to PDF, and Merge PDF. Optimized for Sarkari forms, exam forms, and job portal uploads.
            </p>
            {selected ? (
              <p className="sr-only">
                {selected.title} free tool for document converter workflows including image to pdf converter, jpg to pdf free, png to pdf free, and related file converter online tasks.
              </p>
            ) : null}
          </div>
        </section>

        {!selected ? (
          <section className="space-y-6">
            <div>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Image Format Converters</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {imageFormatTools.map((tool) => (
                  <a
                    key={tool.id}
                    href={tool.externalHref || tool.path}
                    className="tool-card"
                  >
                    <h3 className="text-lg font-semibold text-slate-900">{tool.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{tool.description}</p>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">PDF Converters</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {pdfTools.map((tool) => (
                  <a
                    key={tool.id}
                    href={tool.externalHref || tool.path}
                    className="tool-card"
                  >
                    <h3 className="text-lg font-semibold text-slate-900">{tool.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{tool.description}</p>
                  </a>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <a href="/convert" className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Back to all converters
            </a>
            {selected.type === "external" ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-slate-900">{selected.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{selected.description}</p>
                <a href={selected.externalHref} className="btn-primary mt-4 inline-flex">
                  Open Tool
                </a>
              </div>
            ) : (
              <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading converter...</div>}>
                <ConverterCard
                  title={selected.title}
                  description={selected.description}
                  accept={selected.accept}
                  type={selected.type}
                  targetMime={selected.targetMime}
                  targetExt={selected.targetExt}
                />
              </Suspense>
            )}
          </section>
        )}

        <section className="panel mt-6">
          <h2 className="text-xl font-semibold text-slate-900">High-Intent File Converter Searches for India Form Users</h2>
          <p className="mt-2 text-sm text-slate-600">
            Core search terms: <strong>file converter online</strong>, <strong>jpg to pdf for form upload</strong>, <strong>image format change tool</strong>, <strong>sarkari form document converter</strong>, and <strong>exam form document converter</strong>.
          </p>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Related Size Tools</h3>
          <p className="mt-2 text-sm text-slate-600">
            Need both format conversion and file size control? Use <a className="font-medium text-red-600 hover:underline" href="/image-to-50kb">image to 50kb</a>,{" "}
            <a className="font-medium text-red-600 hover:underline" href="/image-to-20kb">image to 20kb</a>,{" "}
            <a className="font-medium text-red-600 hover:underline" href="/compress-image-100kb">image to 100kb</a>,{" "}
            <a className="font-medium text-red-600 hover:underline" href="/pan-photo-50kb">PAN photo 50kb</a>, and{" "}
            <a className="font-medium text-red-600 hover:underline" href="/signature-20kb">signature 20kb</a>.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            More tools: <a className="font-medium text-red-600 hover:underline" href="/merge-pdf">merge pdf</a>,{" "}
            <a className="font-medium text-red-600 hover:underline" href="/split-pdf">split pdf</a>,{" "}
            <a className="font-medium text-red-600 hover:underline" href="/image-to-pdf">image to pdf</a>,{" "}
            <a className="font-medium text-red-600 hover:underline" href="/jpg-to-pdf">jpg to pdf</a>,{" "}
            <a className="font-medium text-red-600 hover:underline" href="/png-to-pdf">png to pdf</a>,{" "}
            <a className="font-medium text-red-600 hover:underline" href="/pdf-to-image">pdf to image</a>.
          </p>
        </section>
      </main>
      <AppFooter />
    </>
  );
}

