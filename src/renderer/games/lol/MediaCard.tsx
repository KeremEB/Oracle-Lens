// Shared by ward skins and emotes — both are "image + name" grid items.
export function MediaCard({ name, imageDataUrl }: { name: string; imageDataUrl: string | null }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-sm border border-[var(--game-accent-dark)] bg-[var(--game-surface-card)] p-2 text-center transition-colors hover:border-[var(--game-accent)]">
      {imageDataUrl ? (
        <img src={imageDataUrl} alt={name} className="h-16 w-16 object-contain" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-[var(--game-surface-elevated)] text-xs text-[var(--game-accent-muted)]">
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <span className="max-w-[100px] truncate text-xs">{name}</span>
    </div>
  );
}
