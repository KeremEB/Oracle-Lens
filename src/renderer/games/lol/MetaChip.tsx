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
      className="flex items-center gap-2.5 rounded-full border px-3.5 py-2"
      style={{ backgroundColor: 'var(--game-surface-sunken)', borderColor: 'var(--game-border-faint)' }}
    >
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center"
        style={{ color: 'var(--game-accent-muted)' }}
      >
        {icon}
      </span>
      <div className="leading-tight">
        <div
          className="text-[9px] font-semibold uppercase tracking-wide opacity-70"
          style={{ color: 'var(--game-accent-muted)' }}
        >
          {label}
        </div>
        <div className="text-sm font-semibold tabular-nums" style={{ color: 'var(--game-accent-soft)' }}>
          {value}
        </div>
      </div>
    </div>
  );
}
