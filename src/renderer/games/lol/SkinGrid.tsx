import { useRef } from 'react';
import type { OwnedSkin } from '../../../shared/types/lol';
import { useGridDensity } from '../../core/GridDensityContext';
import { useCtrlScrollDensity } from '../../core/useCtrlScrollDensity';
import { SkinCard } from './SkinCard';

export function SkinGrid({ title, skins }: { title?: string; skins: OwnedSkin[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { minCardWidth, adjustDensity } = useGridDensity();
  useCtrlScrollDensity(gridRef, adjustDensity);

  return (
    <div className="w-full">
      {title && (
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-300">
          {title}
        </h2>
      )}
      <div
        ref={gridRef}
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))` }}
      >
        {skins.map((skin) => (
          <SkinCard key={skin.skinId} skin={skin} minCardWidth={minCardWidth} />
        ))}
      </div>
    </div>
  );
}
