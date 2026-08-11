import type { OwnedWardSkin } from '../../../shared/types/lol';
import { MediaCard } from './MediaCard';

export function WardSkinsSection({ wards }: { wards: OwnedWardSkin[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
      {wards.map((ward) => (
        <MediaCard key={ward.wardId} name={ward.name} imageDataUrl={ward.imageDataUrl} />
      ))}
    </div>
  );
}
