// Hand-drawn original shapes (not Riot IP), matching metaIcons.tsx's style —
// used on the export toolbar buttons, which shrink to icon-only on narrow
// windows (see FiltersRow.tsx).
import { IconBase } from '../metaIcons';

export function ArchiveIcon({ size = 16 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <rect x="3" y="7" width="18" height="13" rx="1.5" />
      <path d="M3 7h18" />
      <path d="M12 10v1.5M12 14v1.5" />
    </IconBase>
  );
}

export function ImageFileIcon({ size = 16 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <circle cx="8.5" cy="9.5" r="1.4" />
      <path d="M21 15.5l-5-5-4.5 4.5-2.5-2.5-5.5 5.5" />
    </IconBase>
  );
}

export function DocumentTextIcon({ size = 16 }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M6 3h8l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5" />
      <path d="M8 12.5h8M8 15.5h8M8 18.5h5" />
    </IconBase>
  );
}
