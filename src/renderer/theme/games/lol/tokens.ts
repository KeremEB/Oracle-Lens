// LoL game theme tokens — mirrors the CSS custom properties defined in
// theme.css. Kept in sync manually; this file exists so non-CSS consumers
// (e.g. GameRail's per-game identity badge, which renders before any
// `.theme-lol` container is on screen) have a single source of truth
// instead of a second copy of the hex values.
export const lolTheme = {
  accent: '#C8AA6E',
  accentDark: '#785A28',
  accentSoft: '#F0E6D2',
  surface: '#0A1428',
  surfaceCard: '#091428',
  fontDisplay: "'Cinzel', serif",
} as const;
