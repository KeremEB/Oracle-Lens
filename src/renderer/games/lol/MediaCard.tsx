// Shared by ward skins and emotes — both are "image + name" grid items.
export function MediaCard({ name, imageDataUrl }: { name: string; imageDataUrl: string | null }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded border border-neutral-800 bg-neutral-900/50 p-2 text-center">
      {imageDataUrl ? (
        <img src={imageDataUrl} alt={name} className="h-16 w-16 object-contain" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded bg-neutral-800 text-xs text-neutral-500">
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <span className="max-w-[100px] truncate text-xs">{name}</span>
    </div>
  );
}
