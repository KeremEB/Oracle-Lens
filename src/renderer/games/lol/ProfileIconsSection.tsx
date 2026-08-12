import { useMemo } from 'react';
import type { OwnedProfileIcon } from '../../../shared/types/lol';
import { matchesSearch } from '../../core/searchMatch';

export function ProfileIconsSection({
  icons,
  searchQuery,
}: {
  icons: OwnedProfileIcon[];
  searchQuery: string;
}) {
  // Profile icons have no name in the underlying data (LCU/Community Dragon
  // both only give an id + image path) — search matches the id number itself.
  const visible = useMemo(
    () => icons.filter((icon) => matchesSearch(String(icon.iconId), searchQuery)),
    [icons, searchQuery],
  );

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-3">
      {visible.map((icon) => (
        <div
          key={icon.iconId}
          className="flex items-center justify-center rounded border border-neutral-800 bg-neutral-900/50 p-1"
        >
          {icon.imageDataUrl ? (
            <img
              src={icon.imageDataUrl}
              alt={`Profile icon ${icon.iconId}`}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-500">
              ?
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
