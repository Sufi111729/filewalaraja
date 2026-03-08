export const toolCategories = [
  { id: "all", label: "All" },
  { id: "pan-tool", label: "PAN Tool" },
  { id: "workflows", label: "Workflows" },
  { id: "optimize", label: "Optimize" },
  { id: "convert", label: "Convert" },
  { id: "edit", label: "Edit" },
  { id: "security", label: "Security" },
  { id: "intelligence", label: "Intelligence" }
];

export const tools = [
  {
    id: "pan-card-editor",
    title: "PAN Card Resizer",
    description: "Crop, resize and export PAN photo/signature in required format.",
    categoryId: "pan-tool",
    href: "/pan-editor.html",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M6 3h8l4 4v14H6z", strokeWidth: 1.8, fill: "none" },
        { d: "M14 3v4h4", strokeWidth: 1.8, fill: "none" },
        { d: "M9 13h6M9 17h6", strokeWidth: 1.8, fill: "none" }
      ]
    }
  },
  {
    id: "kb-editor",
    title: "KB Resizer",
    description: "Set target KB and compress image with preview and quality control.",
    categoryId: "pan-tool",
    href: "/kb-editor.html",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M7 4h10v4H7z", strokeWidth: 1.8, fill: "none" },
        { d: "M8 18h8", strokeWidth: 1.8, fill: "none" },
        { d: "M12 8v8", strokeWidth: 1.8, fill: "none" },
        { d: "M9.5 13.5L12 16l2.5-2.5", strokeWidth: 1.8, fill: "none" }
      ]
    }
  },
  {
    id: "id-document",
    title: "ID Document",
    description: "Validate scanned PDF for ID/Address/DOB proof under upload limits.",
    categoryId: "pan-tool",
    href: "/pdf-to-image",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M7 3h7l4 4v14H7z", strokeWidth: 1.8, fill: "none" },
        { d: "M14 3v4h4", strokeWidth: 1.8, fill: "none" },
        { d: "M9 13h6M9 17h4", strokeWidth: 1.8, fill: "none" }
      ]
    }
  },
  {
    id: "compress-pdf-to-300kb",
    title: "Compress PDF to 300KB",
    description: "Reduce PDF size to 300KB exactly for SSC, PAN, and government form uploads.",
    categoryId: "optimize",
    href: "/compress-pdf-to-300kb",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M7 3h7l4 4v14H7z", strokeWidth: 1.8, fill: "none" },
        { d: "M14 3v4h4", strokeWidth: 1.8, fill: "none" },
        { d: "M9 14h6", strokeWidth: 1.8, fill: "none" },
        { d: "M12 10v8", strokeWidth: 1.8, fill: "none" }
      ]
    }
  },
  {
    id: "image-to-50kb",
    title: "Image to 50KB",
    description: "Dedicated 50 kb image converter landing page for exact upload requirements.",
    categoryId: "optimize",
    href: "/image-to-50kb",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M4 6h16v12H4z", strokeWidth: 1.8, fill: "none" },
        { d: "M8 10h.01", strokeWidth: 2.5, fill: "none" },
        { d: "M6 16l4-4 3 3 3-3 2 2", strokeWidth: 1.8, fill: "none" },
        { d: "M9 4h6", strokeWidth: 1.8, fill: "none" }
      ]
    }
  },
  {
    id: "image-to-20kb",
    title: "Image to 20KB",
    description: "Compress image to 20KB online for signatures and smaller form uploads.",
    categoryId: "optimize",
    href: "/image-to-20kb",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M4 6h16v12H4z", strokeWidth: 1.8, fill: "none" },
        { d: "M12 9v6", strokeWidth: 1.8, fill: "none" },
        { d: "M9 12h6", strokeWidth: 1.8, fill: "none" }
      ]
    }
  },
  {
    id: "image-to-100kb",
    title: "Image to 100KB",
    description: "Compress and resize images to around 100KB for upload workflows.",
    categoryId: "optimize",
    href: "/compress-image-100kb",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M4 6h16v12H4z", strokeWidth: 1.8, fill: "none" },
        { d: "M8 12h8", strokeWidth: 1.8, fill: "none" },
        { d: "M12 8v8", strokeWidth: 1.8, fill: "none" }
      ]
    }
  },
  {
    id: "pan-photo-50kb",
    title: "PAN Photo 50KB",
    description: "Resize and optimize PAN photo for 50KB size limits used by Indian portals.",
    categoryId: "workflows",
    href: "/pan-photo-50kb",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M4 6h16v12H4z", strokeWidth: 1.8, fill: "none" },
        { d: "M9 11a3 3 0 106 0 3 3 0 10-6 0", strokeWidth: 1.8, fill: "none" },
        { d: "M8 17h8", strokeWidth: 1.8, fill: "none" }
      ]
    }
  },
  {
    id: "signature-20kb",
    title: "Signature 20KB",
    description: "Create signature image at 20KB with better readability for online forms.",
    categoryId: "workflows",
    href: "/signature-20kb",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M4 17c2 0 3-4 5-4s2 4 4 4 2-4 4-4 2 4 3 4", strokeWidth: 1.8, fill: "none" },
        { d: "M4 7h16", strokeWidth: 1.8, fill: "none" }
      ]
    }
  },
  {
    id: "jpg-to-png",
    title: "JPG to PNG",
    description: "Convert JPG images into PNG format with clean output quality.",
    categoryId: "convert",
    href: "/jpg-to-png",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M5 6h7v7H5z", strokeWidth: 1.8, fill: "none" },
        { d: "M12 12h7v7h-7z", strokeWidth: 1.8, fill: "none" },
        { d: "M10 14l4-4", strokeWidth: 1.8, fill: "none" }
      ]
    }
  },
  {
    id: "png-to-jpg",
    title: "PNG to JPG",
    description: "Convert PNG images into JPG with white background support.",
    categoryId: "convert",
    href: "/png-to-jpg",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M5 12h7v7H5z", strokeWidth: 1.8, fill: "none" },
        { d: "M12 5h7v7h-7z", strokeWidth: 1.8, fill: "none" },
        { d: "M10 10l4 4", strokeWidth: 1.8, fill: "none" }
      ]
    }
  },
  {
    id: "jpg-to-pdf",
    title: "JPG to PDF",
    description: "Convert one or multiple JPG files into a single PDF.",
    categoryId: "convert",
    href: "/jpg-to-pdf",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M7 3h7l4 4v14H7z", strokeWidth: 1.8, fill: "none" },
        { d: "M14 3v4h4", strokeWidth: 1.8, fill: "none" },
        { d: "M9 13h6M9 17h6", strokeWidth: 1.8, fill: "none" }
      ]
    }
  },
  {
    id: "png-to-pdf",
    title: "PNG to PDF",
    description: "Convert one or multiple PNG files into a single PDF.",
    categoryId: "convert",
    href: "/png-to-pdf",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M7 3h7l4 4v14H7z", strokeWidth: 1.8, fill: "none" },
        { d: "M14 3v4h4", strokeWidth: 1.8, fill: "none" },
        { d: "M9 13h6M9 17h6", strokeWidth: 1.8, fill: "none" }
      ]
    }
  },
  {
    id: "img-to-pdf",
    title: "IMG to PDF",
    description: "Convert JPG, PNG, WEBP and more image files into a single PDF.",
    categoryId: "convert",
    href: "/image-to-pdf",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M4 6h16v12H4z", strokeWidth: 1.8, fill: "none" },
        { d: "M8 10h.01", strokeWidth: 2.5, fill: "none" },
        { d: "M6 16l4-4 3 3 3-3 2 2", strokeWidth: 1.8, fill: "none" },
        { d: "M9 4h6", strokeWidth: 1.8, fill: "none" }
      ]
    }
  },
  {
    id: "merge-pdf",
    title: "Merge PDF Files Online",
    description: "Upload, reorder, and merge multiple PDF files into one document instantly.",
    categoryId: "convert",
    href: "/merge-pdf",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M6 3h6l3 3v13H6z", strokeWidth: 1.8, fill: "none" },
        { d: "M15 8h3v13H9v-2", strokeWidth: 1.8, fill: "none" },
        { d: "M12 6h3", strokeWidth: 1.8, fill: "none" },
        { d: "M10 13h4M10 16h5", strokeWidth: 1.8, fill: "none" }
      ]
    }
  },
  {
    id: "split-pdf",
    title: "Split PDF Pages Online",
    description: "Split PDF into individual pages or selected ranges and download files or ZIP.",
    categoryId: "convert",
    href: "/split-pdf",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M6 3h6l3 3v13H6z", strokeWidth: 1.8, fill: "none" },
        { d: "M15 8h3v13H9v-2", strokeWidth: 1.8, fill: "none" },
        { d: "M10 12h4", strokeWidth: 1.8, fill: "none" },
        { d: "M12 10v4", strokeWidth: 1.8, fill: "none" }
      ]
    }
  }
];
