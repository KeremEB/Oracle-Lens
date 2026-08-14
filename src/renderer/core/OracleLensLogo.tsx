// The application's own mark — not game art, so it's fine to commit (see
// CLAUDE.md's Assets section). A simple lens/eye motif rendered as inline
// SVG rather than a bundled image file, colored via currentColor so it
// always matches whichever theme (brand or a game's) is wrapping it.
export function OracleLensLogo({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Oracle Lens"
    >
      <path
        d="M4 32C11 18 21 11 32 11C43 11 53 18 60 32C53 46 43 53 32 53C21 53 11 46 4 32Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="12" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="4" fill="currentColor" />
    </svg>
  );
}
