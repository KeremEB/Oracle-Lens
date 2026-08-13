// Small generic UI glyphs for meta chips that have no corresponding Riot
// asset we could verify a path for (honor, server, season) — hand-drawn
// original shapes, not Riot IP, not fetched from any CDN.

function IconBase({
  size,
  children,
}: {
  size: number;
  children: React.ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function HonorIcon({ size = 16 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
    </IconBase>
  );
}

export function ServerIcon({ size = 16 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <circle cx="7" cy="7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="7" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function SeasonIcon({ size = 16 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18M8 3v4M16 3v4" />
    </IconBase>
  );
}

export function RefreshIcon({ size = 16 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M20 11a8 8 0 0 0-14.5-4.5M4 13a8 8 0 0 0 14.5 4.5" />
      <path d="M4 4v5h5M20 20v-5h-5" />
    </IconBase>
  );
}
