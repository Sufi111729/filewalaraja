function IconBase({ className = "h-5 w-5", children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function ChevronDownIcon({ className = "h-4 w-4" }) {
  return (
    <IconBase className={className}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

export function MenuIcon({ className = "h-5 w-5" }) {
  return (
    <IconBase className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </IconBase>
  );
}

export function CloseIcon({ className = "h-5 w-5" }) {
  return (
    <IconBase className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </IconBase>
  );
}

export function FileIcon({ className = "h-5 w-5" }) {
  return (
    <IconBase className={className}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
    </IconBase>
  );
}

export function FileImageIcon({ className = "h-5 w-5" }) {
  return (
    <IconBase className={className}>
      <rect x="3.5" y="5.5" width="17" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.2" />
      <path d="m6 16 3.5-3.5 2.5 2.5 2-2 4 4" />
    </IconBase>
  );
}

export function ImageIcon({ className = "h-5 w-5" }) {
  return (
    <IconBase className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <circle cx="9" cy="10" r="1.2" />
      <path d="m6 16 3.5-3.5 2.5 2.5 2-2 4 4" />
    </IconBase>
  );
}

export function ArrowsHorizontalIcon({ className = "h-5 w-5" }) {
  return (
    <IconBase className={className}>
      <path d="M4 8h16M15 5l3 3-3 3M20 16H4M9 13l-3 3 3 3" />
    </IconBase>
  );
}

export function MinimizeIcon({ className = "h-5 w-5" }) {
  return (
    <IconBase className={className}>
      <path d="M8 4H4v4M20 8V4h-4M16 20h4v-4M4 16v4h4" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </IconBase>
  );
}

export function MergeIcon({ className = "h-5 w-5" }) {
  return (
    <IconBase className={className}>
      <path d="M7 5v4a3 3 0 0 0 3 3h7" />
      <path d="m14 9 3 3-3 3" />
      <path d="M7 19v-4a3 3 0 0 1 3-3h7" />
    </IconBase>
  );
}

export function SplitIcon({ className = "h-5 w-5" }) {
  return (
    <IconBase className={className}>
      <circle cx="7" cy="7" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path d="M9 9l6 6M15 9l-2.5 2.5M9 15l2.5-2.5" />
    </IconBase>
  );
}

export function CloudUploadIcon({ className = "h-10 w-10" }) {
  return (
    <IconBase className={className}>
      <path d="M8 19h8a4 4 0 1 0-.6-8 6 6 0 0 0-11.5-1.5A4 4 0 0 0 8 19Z" />
      <path d="m12 10-3 3M12 10l3 3M12 10v8" />
    </IconBase>
  );
}

export function UploadIcon({ className = "h-4 w-4" }) {
  return (
    <IconBase className={className}>
      <path d="M12 17V7M8.5 10.5 12 7l3.5 3.5" />
      <path d="M5 19h14" />
    </IconBase>
  );
}

export function DownloadIcon({ className = "h-4 w-4" }) {
  return (
    <IconBase className={className}>
      <path d="M12 7v10M8.5 13.5 12 17l3.5-3.5" />
      <path d="M5 19h14" />
    </IconBase>
  );
}

export function RefreshIcon({ className = "h-4 w-4" }) {
  return (
    <IconBase className={className}>
      <path d="M20 11a8 8 0 0 0-14-5M4 13a8 8 0 0 0 14 5" />
      <path d="M6 6h4V2M18 18h-4v4" />
    </IconBase>
  );
}

export function ArrowUpIcon({ className = "h-4 w-4" }) {
  return (
    <IconBase className={className}>
      <path d="m7 11 5-5 5 5M12 6v12" />
    </IconBase>
  );
}

export function ArrowDownIcon({ className = "h-4 w-4" }) {
  return (
    <IconBase className={className}>
      <path d="m7 13 5 5 5-5M12 18V6" />
    </IconBase>
  );
}

export function TrashIcon({ className = "h-4 w-4" }) {
  return (
    <IconBase className={className}>
      <path d="M4 7h16M9 7V5h6v2M8 7l.7 12h6.6L16 7" />
    </IconBase>
  );
}

