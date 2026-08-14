import { useMemo, useRef } from 'react';
import type { OwnedEmote } from '../../../shared/types/lol';
import { matchesSearch } from '../../core/searchMatch';
import { useGridDensity } from '../../core/GridDensityContext';
import { useCtrlScrollDensity } from '../../core/useCtrlScrollDensity';
import { compareTr, type SortOrder } from '../../core/sortOrder';
import { MediaCard } from './MediaCard';

export function EmotesSection({
  emotes,
  searchQuery,
  sortOrder,
}: {
  emotes: OwnedEmote[];
  searchQuery: string;
  sortOrder: SortOrder;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { minCardWidth, adjustDensity } = useGridDensity();
  useCtrlScrollDensity(gridRef, adjustDensity);

  const visible = useMemo(() => {
    const dir = sortOrder === 'za' ? -1 : 1;
    return emotes
      .filter((emote) => matchesSearch(emote.name, searchQuery))
      .sort((a, b) => dir * compareTr(a.name, b.name));
  }, [emotes, searchQuery, sortOrder]);

  return (
    <div
      ref={gridRef}
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))` }}
    >
      {visible.map((emote) => (
        <MediaCard key={emote.emoteId} name={emote.name} imageDataUrl={emote.imageDataUrl} />
      ))}
    </div>
  );
}
