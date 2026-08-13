import { useMemo, useRef } from 'react';
import type { OwnedProfileIcon } from '../../../shared/types/lol';
import { matchesSearch } from '../../core/searchMatch';
import { useGridDensity } from '../../core/GridDensityContext';
import { useCtrlScrollDensity } from '../../core/useCtrlScrollDensity';

export function ProfileIconsSection({
  icons,
  searchQuery,
}: {
  icons: OwnedProfileIcon[];
  searchQuery: string;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { minCardWidth, adjustDensity } = useGridDensity();
  useCtrlScrollDensity(gridRef, adjustDensity);

  // Profile icons have no name in the underlying data (LCU/Community Dragon
  // both only give an id + image path) — search matches the id number itself.
  const visible = useMemo(
    () => icons.filter((icon) => matchesSearch(String(icon.iconId), searchQuery)),
    [icons, searchQuery],
  );

  return (
    <div
      ref={gridRef}
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))` }}
    >
      {visible.map((icon) => (
        <div
          key={icon.iconId}
          className="flex items-center justify-center rounded border border-neutral-800 bg-neutral-900/50 p-1"
        >
          <div className="aspect-square w-full">
            {icon.imageDataUrl ? (
              <img
                src={icon.imageDataUrl}
                alt={`Profile icon ${icon.iconId}`}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-500">
                ?
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
