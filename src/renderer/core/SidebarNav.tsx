import { Fragment } from 'react';

export interface SidebarNavItem {
  id: string;
  label: string;
  /** Omitted (not 0) when there's nothing meaningful to count yet — a bare
   * count of 0 reads as "checked, found nothing"; omitting it reads as
   * "not applicable here", which matters for things like History that
   * aren't wired up to real data yet. */
  count?: number;
  /** Renders a thin divider above this item — used to break the list into logical groups. */
  dividerBefore?: boolean;
}

const SIDEBAR_WIDTH = 224; // ~220px per spec
const SIDEBAR_MIN_WIDTH = 160;

// Generic vertical nav shell — the game-specific tab list (Champions, Skins,
// ...) is assembled by the caller, this component only owns the shrink/
// active-state/badge mechanics so it can be reused by a future game's
// sidebar without change.
export function SidebarNav({
  items,
  activeId,
  onSelect,
}: {
  items: SidebarNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      className="flex shrink flex-col gap-2 overflow-y-auto border-r p-3 transition-colors duration-300"
      style={{
        width: SIDEBAR_WIDTH,
        minWidth: SIDEBAR_MIN_WIDTH,
        borderColor: 'var(--game-accent-dark)',
        backgroundColor: 'var(--game-surface-card)',
      }}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <Fragment key={item.id}>
            {item.dividerBefore && (
              <div className="my-2 border-t" style={{ borderColor: 'var(--game-border-faint)' }} />
            )}
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={
                isActive
                  ? 'flex items-center justify-between rounded px-4 py-2.5 text-left text-sm font-medium transition-[background-color,box-shadow,color] duration-150 shadow-[0_0_6px_0_var(--game-glow)]/25 hover:shadow-[0_0_10px_1px_var(--game-glow)]/70'
                  : 'flex items-center justify-between rounded px-4 py-2.5 text-left text-sm font-medium transition-[background-color,box-shadow,color] duration-150 hover:shadow-[0_0_10px_1px_var(--game-glow)]/55'
              }
              style={{
                color: isActive ? 'var(--game-accent-soft)' : 'var(--game-accent-muted)',
                backgroundColor: isActive ? 'var(--game-surface-elevated)' : 'transparent',
              }}
            >
              <span className="truncate">{item.label}</span>
              {typeof item.count === 'number' && (
                <span
                  className="ml-2 min-w-[2rem] shrink-0 rounded-full px-1.5 py-0.5 text-center text-[11px] tabular-nums"
                  style={{ backgroundColor: 'var(--game-surface-elevated)', color: 'var(--game-accent-soft)' }}
                >
                  {item.count.toLocaleString('en-US')}
                </span>
              )}
            </button>
          </Fragment>
        );
      })}
    </nav>
  );
}
