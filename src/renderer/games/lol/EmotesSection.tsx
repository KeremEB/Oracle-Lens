import { useMemo } from 'react';
import type { OwnedEmote } from '../../../shared/types/lol';
import { matchesSearch } from '../../core/searchMatch';
import { MediaCard } from './MediaCard';

export function EmotesSection({
  emotes,
  searchQuery,
}: {
  emotes: OwnedEmote[];
  searchQuery: string;
}) {
  const visible = useMemo(
    () => emotes.filter((emote) => matchesSearch(emote.name, searchQuery)),
    [emotes, searchQuery],
  );

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
      {visible.map((emote) => (
        <MediaCard key={emote.emoteId} name={emote.name} imageDataUrl={emote.imageDataUrl} />
      ))}
    </div>
  );
}
