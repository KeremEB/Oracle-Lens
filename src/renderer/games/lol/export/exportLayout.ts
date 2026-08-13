// Export grids are wide, not tall: a fixed card size (so cards never shrink
// to unreadable) with the COLUMN COUNT as the free variable, targeting a
// roughly constant number of rows regardless of how many items there are.
// More items -> more columns -> a wider image, rather than a taller one.
//
// Card width and the row/column targets were tuned against Ward Skins'
// export, which reads correctly at ~12 items / 6 columns — the small
// collections that never exceed MIN_COLUMNS. Large collections (Champions,
// Skins, Profile Icons, Emotes) originally ran all the way out to
// MAX_COLUMNS at a narrow 140px card, which produced an extremely wide,
// short strip that reads as small/cramped at normal viewing zoom even
// though each card was technically the same pixel size — the fix is a
// wider card plus a taller row/column ceiling, landing large collections on
// a grid shape closer to what the small ones already look like, not just a
// bigger version of the same wide strip.
export const EXPORT_CARD_WIDTH = 180;
const GAP = 12; // matches the live grids' `gap-3`
const SECTION_PADDING = 24; // matches the section wrapper's `p-6` on each side

const TARGET_ROWS = 8;
const MIN_COLUMNS = 6;
const MAX_COLUMNS = 16; // safety valve for pathological collection sizes, rarely hit

export function exportColumnsFor(itemCount: number): number {
  if (itemCount <= 0) return MIN_COLUMNS;
  const raw = Math.ceil(itemCount / TARGET_ROWS);
  return Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, raw));
}

/** Outer container width (CSS px, pre-capture-scale) for a grid holding `itemCount` fixed-size cards. */
export function exportGridWidth(itemCount: number): number {
  const columns = exportColumnsFor(itemCount);
  return columns * EXPORT_CARD_WIDTH + (columns - 1) * GAP + SECTION_PADDING * 2;
}
