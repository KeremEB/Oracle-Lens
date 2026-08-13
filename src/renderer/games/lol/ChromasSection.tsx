import { useMemo } from 'react';
import type { SkinChromaGroup } from '../../../shared/types/lol';
import { matchesSearch } from '../../core/searchMatch';
import { ChromaGrid } from './ChromaGrid';

export function ChromasSection({
  groups,
  searchQuery,
}: {
  groups: SkinChromaGroup[];
  searchQuery: string;
}) {
  const visibleGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          chromas: group.chromas.filter((chroma) => matchesSearch(chroma.name, searchQuery)),
        }))
        .filter((group) => group.chromas.length > 0),
    [groups, searchQuery],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      {visibleGroups.map((group) => (
        <ChromaGrid key={group.skinId} title={group.skinName} chromas={group.chromas} />
      ))}
    </div>
  );
}
