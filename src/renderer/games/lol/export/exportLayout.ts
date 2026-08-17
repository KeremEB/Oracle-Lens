// Export grids are wide, not tall: a fixed card size (so cards never shrink
// to unreadable) with the COLUMN COUNT as the free variable, targeting a
// roughly constant number of rows regardless of how many items there are.
// More items -> more columns -> a wider image, rather than a taller one.
// Width is the priority here, vertical length secondary — every multi-row
// export section (Champions, Skins, Classic, Chromas, Ward Skins, Emotes,
// Profile Icons, each Loot category) shares this one column formula.
//
// Card width stays fixed — shrinking it to fit more columns would trade
// away legibility, which is the thing this whole scheme exists to protect.
// TARGET_ROWS=5/MIN_COLUMNS=8 land a mid-size collection (the kind that
// previously came out ~7 columns wide, still visibly tall) around 10-12
// columns instead; MAX_COLUMNS=24 gives the biggest collections (Champions,
// Skins) real room to spread out rather than hitting a low ceiling and
// piling back up into extra rows.
export const EXPORT_CARD_WIDTH = 180;
const GAP = 12; // matches the live grids' `gap-3`
const SECTION_PADDING = 24; // matches the section wrapper's `p-6` on each side

const TARGET_ROWS = 5;
const MIN_COLUMNS = 8;
const MAX_COLUMNS = 24;

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
