import { useMemo, useRef } from 'react';
import type { OwnedProfileIcon } from '../../../shared/types/lol';
import { matchesSearch } from '../../core/searchMatch';
import { useGridDensity } from '../../core/GridDensityContext';
import { useCtrlScrollDensity } from '../../core/useCtrlScrollDensity';
import type { SortOrder } from '../../core/sortOrder';

export function ProfileIconsSection({
  icons,
  searchQuery,
  sortOrder,
}: {
  icons: OwnedProfileIcon[];
  searchQuery: string;
  sortOrder: SortOrder;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { minCardWidth, adjustDensity } = useGridDensity();
  useCtrlScrollDensity(gridRef, adjustDensity);

  // Profile icons have no name in the underlying data (LCU/Community Dragon
  // both only give an id + image path) — search matches the id number itself,
  // and "alphabetical" sort orders by that same id numerically.
  const visible = useMemo(() => {
    const dir = sortOrder === 'za' ? -1 : 1;
    return icons
      .filter((icon) => matchesSearch(String(icon.iconId), searchQuery))
      .sort((a, b) => dir * (a.iconId - b.iconId));
  }, [icons, searchQuery, sortOrder]);

  return (
    <div
      ref={gridRef}
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))` }}
    >
      {visible.map((icon) => (
        <div
          key={icon.iconId}
          className="flex items-center justify-center rounded-sm border border-[var(--game-accent-dark)] bg-[var(--game-surface-card)] p-1 transition-colors hover:border-[var(--game-accent)]"
        >
          <div className="aspect-square w-full">
            {icon.imageDataUrl ? (
              <img
                src={icon.imageDataUrl}
                alt={`Profile icon ${icon.iconId}`}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--game-surface-elevated)] text-xs text-[var(--game-accent-muted)]">
                ?
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
