import type { ReactNode } from 'react';

// icon + caption-label + value, one visual language shared by every meta
// field in the header (RP, BE, honor, server, country, season) so the row
// reads as one coherent group of chips rather than a line of loose text.
export function MetaChip({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{ backgroundColor: 'var(--game-surface-elevated)' }}
    >
      <span
        className="flex shrink-0 items-center justify-center"
        style={{ color: 'var(--game-accent-muted)' }}
      >
        {icon}
      </span>
      <div className="leading-tight">
        <div
          className="text-[9px] font-semibold uppercase tracking-wide"
          style={{ color: 'var(--game-accent-muted)' }}
        >
          {label}
        </div>
        <div className="text-xs font-semibold tabular-nums" style={{ color: 'var(--game-accent-soft)' }}>
          {value}
        </div>
      </div>
    </div>
  );
}
