// Oracle Lens brand chrome tokens — mirrors the CSS custom properties
// defined in theme/brand.css (.theme-brand). Kept in sync manually, same
// pattern as theme/games/lol/tokens.ts: exists for non-CSS consumers like
// the disconnected-screen wordmark, which needs a hex value directly.
export const brandTheme = {
  copper: '#C08552',
  copperDark: '#453224',
  copperSoft: '#D9B78F',
  signalRed: '#B0413E',
  surface: '#101115',
  glowGreen: '#3ED598',
} as const;
