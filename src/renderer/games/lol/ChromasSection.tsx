import { useMemo, useRef } from 'react';
import type { SkinChromaGroup } from '../../../shared/types/lol';
import { matchesSearch } from '../../core/searchMatch';
import { useGridDensity } from '../../core/GridDensityContext';
import { useCtrlScrollDensity } from '../../core/useCtrlScrollDensity';
import { compareTr, type SortOrder } from '../../core/sortOrder';
import { ChromaSwatch, type FlatChroma } from './ChromaSwatch';

// One flat grid across every owned chroma, rather than one grid per skin
// group — most groups only own 1-2 chromas, so a per-group grid (each with
// its own header) wasted most of its row on near-empty whitespace and made
// this tab (and its export) far taller than any other collection. A single
// grid packs densely no matter how skewed the per-skin chroma counts are;
// each card just carries its own skin name as a caption now that there's no
// group header to supply it (see ChromaSwatch.tsx).
export function ChromasSection({
  groups,
  searchQuery,
  sortOrder,
}: {
  groups: SkinChromaGroup[];
  searchQuery: string;
  sortOrder: SortOrder;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { minCardWidth, adjustDensity } = useGridDensity();
  useCtrlScrollDensity(gridRef, adjustDensity);

  const visible = useMemo(() => {
    const dir = sortOrder === 'za' ? -1 : 1;
    const flat: FlatChroma[] = groups.flatMap((group) =>
      group.chromas.map((chroma) => ({ ...chroma, skinName: group.skinName })),
    );
    return flat
      .filter(
        (chroma) => matchesSearch(chroma.name, searchQuery) || matchesSearch(chroma.skinName, searchQuery),
      )
      .sort((a, b) => dir * compareTr(a.skinName, b.skinName) || dir * compareTr(a.name, b.name));
  }, [groups, searchQuery, sortOrder]);

  return (
    <div
      ref={gridRef}
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))` }}
    >
      {visible.map((chroma) => (
        <ChromaSwatch key={chroma.chromaId} chroma={chroma} />
      ))}
    </div>
  );
}
