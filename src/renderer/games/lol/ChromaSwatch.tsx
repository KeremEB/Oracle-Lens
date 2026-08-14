import type { OwnedChroma } from '../../../shared/types/lol';

export function ChromaSwatch({ chroma }: { chroma: OwnedChroma }) {
  const paletteBackground =
    chroma.colors.length > 1
      ? `linear-gradient(135deg, ${chroma.colors.join(', ')})`
      : (chroma.colors[0] ?? '#333333');

  return (
    <div className="flex flex-col items-center gap-1 rounded-sm border border-[var(--game-accent-dark)] bg-[var(--game-surface-card)] p-2 text-center transition-colors hover:border-[var(--game-accent)]">
      <div className="relative h-16 w-16">
        {chroma.imageDataUrl ? (
          <img
            src={chroma.imageDataUrl}
            alt={chroma.name}
            className="h-16 w-16 rounded-sm object-cover"
          />
        ) : (
          <div
            className="h-16 w-16 rounded-full border border-[var(--game-accent-dark)]"
            style={{ background: paletteBackground }}
          />
        )}

        {/* Actual color palette, always shown, even when the image loads fine. */}
        <div
          className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border border-[var(--game-surface-card)]"
          style={{ background: paletteBackground }}
        />
      </div>

      <span className="max-w-[110px] truncate text-xs">{chroma.name}</span>
    </div>
  );
}
