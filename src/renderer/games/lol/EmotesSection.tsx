import { useMemo, useRef } from 'react';
import type { OwnedEmote } from '../../../shared/types/lol';
import { matchesSearch } from '../../core/searchMatch';
import { useGridDensity } from '../../core/GridDensityContext';
import { useCtrlScrollDensity } from '../../core/useCtrlScrollDensity';
import { MediaCard } from './MediaCard';

export function EmotesSection({
  emotes,
  searchQuery,
}: {
  emotes: OwnedEmote[];
  searchQuery: string;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { minCardWidth, adjustDensity } = useGridDensity();
  useCtrlScrollDensity(gridRef, adjustDensity);

  const visible = useMemo(
    () => emotes.filter((emote) => matchesSearch(emote.name, searchQuery)),
    [emotes, searchQuery],
  );

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
