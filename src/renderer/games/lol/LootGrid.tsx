import { useRef } from 'react';
import type { LootItem } from '../../../shared/types/lol';
import { useGridDensity } from '../../core/GridDensityContext';
import { useCtrlScrollDensity } from '../../core/useCtrlScrollDensity';
import { LootCard } from './LootCard';

export function LootGrid({ title, items }: { title: string; items: LootItem[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { minCardWidth, adjustDensity } = useGridDensity();
  useCtrlScrollDensity(gridRef, adjustDensity);

  return (
    <div className="w-full">
      <h2
        className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--game-accent)]"
        style={{ fontFamily: 'var(--game-font-display)' }}
      >
        {title}
      </h2>

      <div
        ref={gridRef}
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))` }}
      >
        {items.map((item) => (
          <LootCard key={item.lootName} item={item} minCardWidth={minCardWidth} />
        ))}
      </div>
    </div>
  );
}
