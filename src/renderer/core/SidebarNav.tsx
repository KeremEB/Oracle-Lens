export interface SidebarNavItem {
  id: string;
  label: string;
  /** Omitted (not 0) when there's nothing meaningful to count yet — a bare
   * count of 0 reads as "checked, found nothing"; omitting it reads as
   * "not applicable here", which matters for things like History that
   * aren't wired up to real data yet. */
  count?: number;
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
      className="flex shrink flex-col gap-0.5 overflow-y-auto border-r border-neutral-800 bg-neutral-900 p-2"
      style={{ width: SIDEBAR_WIDTH, minWidth: SIDEBAR_MIN_WIDTH }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={
            item.id === activeId
              ? 'flex items-center justify-between rounded px-3 py-2 text-left text-sm font-medium text-neutral-100 bg-neutral-800'
              : 'flex items-center justify-between rounded px-3 py-2 text-left text-sm font-medium text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
          }
        >
          <span className="truncate">{item.label}</span>
          {typeof item.count === 'number' && (
            <span className="ml-2 shrink-0 rounded-full bg-neutral-700/70 px-1.5 py-0.5 text-[11px] tabular-nums text-neutral-300">
              {item.count.toLocaleString('en-US')}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
