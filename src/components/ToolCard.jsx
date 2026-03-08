import {
  ArrowsHorizontalIcon,
  FileIcon,
  FileImageIcon,
  ImageIcon,
  MergeIcon,
  MinimizeIcon,
  SplitIcon
} from "./AppIcons";

function resolveToolIcon(tool) {
  const id = String(tool?.id || "").toLowerCase();
  const title = String(tool?.title || "").toLowerCase();
  const text = `${id} ${title}`;

  if (text.includes("merge")) return <MergeIcon className="h-6 w-6" />;
  if (text.includes("split")) return <SplitIcon className="h-6 w-6" />;
  if (text.includes("compress") || text.includes("kb")) return <MinimizeIcon className="h-6 w-6" />;
  if (text.includes("pdf") && text.includes("image")) return <FileImageIcon className="h-6 w-6" />;
  if (text.includes("pdf")) return <FileIcon className="h-6 w-6" />;
  if (text.includes("jpg") || text.includes("png") || text.includes("image") || text.includes("photo") || text.includes("signature")) {
    return <ImageIcon className="h-6 w-6" />;
  }
  return <ArrowsHorizontalIcon className="h-6 w-6" />;
}

export default function ToolCard({ tool }) {
  const href = tool.href || "#";
  const hasActions = Array.isArray(tool.actions) && tool.actions.length > 0;

  const cardBody = (
    <>
      <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
        {resolveToolIcon(tool)}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 transition-colors duration-150 group-hover:text-slate-950">
        {tool.title}
      </h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{tool.description}</p>
      {hasActions ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {tool.actions.map((action) => (
            <a
              key={`${tool.id}-${action.label}`}
              href={action.href || "#"}
              className="btn-primary"
            >
              {action.label}
            </a>
          ))}
        </div>
      ) : null}
    </>
  );

  if (hasActions) {
    return (
      <div className="tool-card group block">
        {cardBody}
      </div>
    );
  }

  return (
    <a
      href={href}
      className="tool-card group block"
    >
      {cardBody}
    </a>
  );
}
