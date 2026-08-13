import { useMemo, useRef } from 'react';
import type { OwnedWardSkin } from '../../../shared/types/lol';
import { matchesSearch } from '../../core/searchMatch';
import { useGridDensity } from '../../core/GridDensityContext';
import { useCtrlScrollDensity } from '../../core/useCtrlScrollDensity';
import { MediaCard } from './MediaCard';

export function WardSkinsSection({
  wards,
  searchQuery,
}: {
  wards: OwnedWardSkin[];
  searchQuery: string;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { minCardWidth, adjustDensity } = useGridDensity();
  useCtrlScrollDensity(gridRef, adjustDensity);

  const visible = useMemo(
    () => wards.filter((ward) => matchesSearch(ward.name, searchQuery)),
    [wards, searchQuery],
  );

  return (
    <div
      ref={gridRef}
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))` }}
    >
      {visible.map((ward) => (
        <MediaCard key={ward.wardId} name={ward.name} imageDataUrl={ward.imageDataUrl} />
      ))}
    </div>
  );
}
