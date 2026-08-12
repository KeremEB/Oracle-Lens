import { useMemo } from 'react';
import type { SkinChromaGroup } from '../../../shared/types/lol';
import { matchesSearch } from '../../core/searchMatch';
import { ChromaSwatch } from './ChromaSwatch';

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
        <div key={group.skinId} className="w-full">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {group.skinName}
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-3">
            {group.chromas.map((chroma) => (
              <ChromaSwatch key={chroma.chromaId} chroma={chroma} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
