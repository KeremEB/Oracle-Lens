import { useMemo } from 'react';
import type { OwnedWardSkin } from '../../../shared/types/lol';
import { matchesSearch } from '../../core/searchMatch';
import { MediaCard } from './MediaCard';

export function WardSkinsSection({
  wards,
  searchQuery,
}: {
  wards: OwnedWardSkin[];
  searchQuery: string;
}) {
  const visible = useMemo(
    () => wards.filter((ward) => matchesSearch(ward.name, searchQuery)),
    [wards, searchQuery],
  );

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
      {visible.map((ward) => (
        <MediaCard key={ward.wardId} name={ward.name} imageDataUrl={ward.imageDataUrl} />
      ))}
    </div>
  );
}
