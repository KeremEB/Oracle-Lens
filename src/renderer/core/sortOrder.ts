// Per-tab sort selection. 'default' only applies to tabs with a meaningful
// non-alphabetical native order (champions: mastery points, skins: rarity);
// tabs without one only ever use 'az' / 'za'.
export type SortOrder = 'default' | 'az' | 'za';

// Turkish-aware alphabetical comparator — ş/ı/ğ/ç/ö/ü collate correctly,
// unlike a plain ASCII localeCompare.
export function compareTr(a: string, b: string): number {
  return a.localeCompare(b, 'tr');
}
