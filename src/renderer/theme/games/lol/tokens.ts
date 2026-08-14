// LoL game theme tokens — mirrors the CSS custom properties defined in
// theme.css. Kept in sync manually; this file exists so non-CSS consumers
// (e.g. GameRail's per-game identity badge, which renders before any
// `.theme-lol` container is on screen) have a single source of truth
// instead of a second copy of the hex values.
export const lolTheme = {
  accent: '#B8A177',
  accentDark: '#4A4128',
  accentSoft: '#D9CCA8',
  surface: '#0A0F1A',
  surfaceCard: '#0B121E',
  fontDisplay: "'Cinzel', serif",
} as const;
