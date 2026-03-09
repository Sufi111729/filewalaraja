export const seoTitleOptions = [
  "AI Image Scaler Online Free: Upscale or Downscale Without Losing Quality",
  "AI Image Upscaler & Downscaler Online | Smart Image Resizer",
  "Upscale Image Without Losing Quality | AI Photo Enhancer & Image Size Reducer"
];

export const metaDescriptionOptions = [
  "Use an AI image scaler online to upscale low-resolution photos or downscale large images while preserving sharpness, text readability, edges, and natural detail.",
  "Upscale image without losing quality or reduce image resolution intelligently. Free AI image upscaler, AI photo enhancer, and smart image size reducer in one tool.",
  "Resize JPG, PNG, and WEBP images with AI-guided scaling. Improve blurry images, reduce pixelation, or lower image size for web and upload use."
];

export const h1Suggestions = [
  "AI Image Scaler Online for Smart Upscaling and Downscaling",
  "AI Image Upscaler and Downscaler Without Losing Quality",
  "Smart AI Photo Resizer for Higher Detail or Smaller File Size"
];

export const keywordCluster = [
  "ai image upscaler",
  "image upscale online",
  "upscale image without losing quality",
  "ai photo enhancer",
  "image downscale online",
  "reduce image resolution without losing quality",
  "smart image resizer",
  "image size reducer online",
  "ai image enlarger",
  "preserve image quality while resizing"
];

export const slugSuggestions = [
  "ai-image-scaler",
  "ai-image-upscaler",
  "smart-image-resizer",
  "upscale-image-without-losing-quality"
];

export const internalLinkSuggestions = [
  { label: "Image to 20KB", href: "/image-to-20kb" },
  { label: "Image to 50KB", href: "/image-to-50kb" },
  { label: "Compress Image to 100KB", href: "/compress-image-100kb" },
  { label: "PAN Photo 50KB", href: "/pan-photo-50kb" },
  { label: "Signature 20KB", href: "/signature-20kb" },
  { label: "JPG to PNG", href: "/jpg-to-png" },
  { label: "PNG to JPG", href: "/png-to-jpg" }
];

export const altTextStrategy = [
  "Describe the image subject, scaling action, and visible outcome in natural language.",
  "Include format or context only when it helps users, such as product photo, portrait, screenshot, or document image.",
  "For before and after previews, distinguish state clearly: before upscale preview, after upscale preview, downscaled output preview.",
  "Avoid generic alt text like image, photo, or preview unless the graphic is decorative."
];

export const faqItems = [
  {
    question: "How does the AI image upscaler work?",
    answer:
      "The tool enlarges your image with multi-step scaling and detail enhancement so edges, textures, and facial features stay cleaner than a basic stretch resize."
  },
  {
    question: "Can I upscale image online without losing quality?",
    answer:
      "You can improve perceived quality significantly, especially for small photos and compressed images. Results depend on the original source, but the tool is tuned to reduce blur, pixelation, and dull edges."
  },
  {
    question: "What is the difference between AI upper scaling and AI lower scaling?",
    answer:
      "AI upper scaling increases resolution and restores clarity, while AI lower scaling reduces dimensions or file weight in a controlled way so text, edges, and color transitions stay readable."
  },
  {
    question: "Which image formats are supported?",
    answer:
      "You can upload JPG, PNG, and WEBP files. The tool also lets you export optimized output in JPG, PNG, or WEBP."
  },
  {
    question: "Can I reduce image size to a target KB?",
    answer:
      "Yes. Lower scaling mode includes a target file size option that balances dimensions and compression to move the export closer to your chosen KB limit."
  },
  {
    question: "Is this tool good for product photos, portraits, and screenshots?",
    answer:
      "Yes. It works well for ecommerce product images, portraits, social graphics, and screenshots where you want better detail when upscaling or cleaner readability when downscaling."
  }
];

export const landingCopy = {
  eyebrow: "AI-powered image resizing for quality-first workflows",
  heroTitle: "AI Image Scaler Online for Smart Upscaling and Downscaling",
  heroDescription:
    "Upscale blurry photos, sharpen low-resolution images, or reduce image resolution without losing quality. This AI image scaler helps you enlarge or shrink JPG, PNG, and WEBP files with cleaner details, readable text, and download-ready output.",
  benefitIntro:
    "Built for creators, sellers, form users, and teams who need a fast image upscale online tool and an image size reducer online in one page.",
  howItWorks: [
    "Upload a JPG, PNG, or WEBP image and choose AI Upper Scaling or AI Lower Scaling.",
    "Pick a preset like 2x, 4x, 50%, 25%, custom resolution, or a target KB workflow.",
    "Preview the before and after result, then download the optimized file in the format you need."
  ],
  ctaTitle: "Scale images with better detail and fewer artifacts",
  ctaDescription:
    "Use the smart resizer now to enlarge low-quality photos or make oversized images lighter for web, forms, listings, and faster page delivery."
};

export function buildAiImageScalerSchema() {
  const pageUrl = "https://filewalatool.com/ai-image-scaler";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: seoTitleOptions[0],
        description: metaDescriptionOptions[0],
        inLanguage: "en",
        isPartOf: {
          "@id": "https://filewalatool.com/#website"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${pageUrl}#software`,
        name: "AI Image Scaler",
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD"
        },
        description: metaDescriptionOptions[1],
        url: pageUrl,
        featureList: [
          "AI image upscaler",
          "AI lower scaling",
          "Custom resolution resize",
          "Target KB export",
          "JPG PNG WEBP support"
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer
          }
        }))
      }
    ]
  };
}
