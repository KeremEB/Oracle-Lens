import { useRef } from 'react';
import type { OwnedChroma } from '../../../shared/types/lol';
import { useGridDensity } from '../../core/GridDensityContext';
import { useCtrlScrollDensity } from '../../core/useCtrlScrollDensity';
import { ChromaSwatch } from './ChromaSwatch';

// One instance per skin group (ChromasSection renders several at once) — each
// reads the same shared density from context and adjusts the same shared
// state on ctrl+scroll, so they all stay in sync with each other and with
// every other tab's grid.
export function ChromaGrid({ title, chromas }: { title: string; chromas: OwnedChroma[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { minCardWidth, adjustDensity } = useGridDensity();
  useCtrlScrollDensity(gridRef, adjustDensity);

  return (
    <div className="w-full">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">{title}</h3>

      <div
        ref={gridRef}
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))` }}
      >
        {chromas.map((chroma) => (
          <ChromaSwatch key={chroma.chromaId} chroma={chroma} />
        ))}
      </div>
    </div>
  );
}
