// Export grids are wide, not tall: a fixed card size (so cards never shrink
// to unreadable) with the COLUMN COUNT as the free variable, targeting a
// roughly constant number of rows regardless of how many items there are.
// More items -> more columns -> a wider image, rather than a taller one.
export const EXPORT_CARD_WIDTH = 140;
const GAP = 12; // matches the live grids' `gap-3`
const SECTION_PADDING = 24; // matches the section wrapper's `p-6` on each side

const TARGET_ROWS = 5;
const MIN_COLUMNS = 6;
const MAX_COLUMNS = 30; // safety valve for pathological collection sizes, rarely hit

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
