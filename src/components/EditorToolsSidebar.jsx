import {
  BackgroundRemoveIcon,
  CropIcon,
  MinimizeIcon,
  RotateIcon,
  SlidersIcon,
  StickerIcon,
  TypeIcon,
  WandIcon
} from "./AppIcons";

const TOOLS = [
  { id: "crop", label: "Crop", icon: CropIcon, enabled: true },
  { id: "resize", label: "Resize", icon: MinimizeIcon, enabled: true },
  { id: "rotate", label: "Rotate", icon: RotateIcon, enabled: false },
  { id: "filters", label: "Filters", icon: SlidersIcon, enabled: false },
  { id: "text", label: "Text", icon: TypeIcon, enabled: false },
  { id: "stickers", label: "Stickers", icon: StickerIcon, enabled: false },
  { id: "ai-upscale", label: "AI Upscale", icon: WandIcon, enabled: true },
  { id: "remove-bg", label: "Remove Background", icon: BackgroundRemoveIcon, enabled: true }
];

export default function EditorToolsSidebar({ activeTool, onChange }) {
  return (
    <aside className="panel">
      <h2 className="text-sm font-semibold text-slate-700">Editor Tools</h2>
      <div className="mt-3 grid gap-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const active = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => tool.enabled && onChange(tool.id)}
              disabled={!tool.enabled}
              className={`editor-tool-btn ${active ? "editor-tool-btn-active" : ""} ${!tool.enabled ? "editor-tool-btn-disabled" : ""}`}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white">
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1 text-left">
                <span className="block text-sm font-semibold">{tool.label}</span>
                <span className="block text-xs text-slate-500">
                  {tool.enabled ? "Open in editor" : "Coming soon"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
