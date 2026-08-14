import { useMemo } from 'react';
import type { SkinChromaGroup } from '../../../shared/types/lol';
import { matchesSearch } from '../../core/searchMatch';
import { compareTr, type SortOrder } from '../../core/sortOrder';
import { ChromaGrid } from './ChromaGrid';

export function ChromasSection({
  groups,
  searchQuery,
  sortOrder,
}: {
  groups: SkinChromaGroup[];
  searchQuery: string;
  sortOrder: SortOrder;
}) {
  const visibleGroups = useMemo(() => {
    const dir = sortOrder === 'za' ? -1 : 1;
    const filtered = groups
      .map((group) => ({
        ...group,
        chromas: [...group.chromas]
          .filter((chroma) => matchesSearch(chroma.name, searchQuery))
          .sort((a, b) => dir * compareTr(a.name, b.name)),
      }))
      .filter((group) => group.chromas.length > 0);
    return filtered.sort((a, b) => dir * compareTr(a.skinName, b.skinName));
  }, [groups, searchQuery, sortOrder]);

  return (
    <div className="flex w-full flex-col gap-6">
      {visibleGroups.map((group) => (
        <ChromaGrid key={group.skinId} title={group.skinName} chromas={group.chromas} />
      ))}
    </div>
  );
}
