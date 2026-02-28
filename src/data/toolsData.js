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
    title: "PAN Card Editor",
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
    title: "KB Editor",
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
    href: "/document-validator.html",
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
    id: "jpg-to-png",
    title: "JPG to PNG",
    description: "Convert JPG images into PNG format with clean output quality.",
    categoryId: "convert",
    href: "/convert.html?tool=jpg-to-png",
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
    href: "/convert.html?tool=png-to-jpg",
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
    href: "/convert.html?tool=jpg-to-pdf",
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
    href: "/convert.html?tool=png-to-pdf",
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
    href: "/convert.html?tool=img-to-pdf",
    icon: {
      viewBox: "0 0 24 24",
      paths: [
        { d: "M4 6h16v12H4z", strokeWidth: 1.8, fill: "none" },
        { d: "M8 10h.01", strokeWidth: 2.5, fill: "none" },
        { d: "M6 16l4-4 3 3 3-3 2 2", strokeWidth: 1.8, fill: "none" },
        { d: "M9 4h6", strokeWidth: 1.8, fill: "none" }
      ]
    }
  }
];
