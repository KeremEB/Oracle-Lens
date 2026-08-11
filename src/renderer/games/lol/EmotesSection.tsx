import type { OwnedEmote } from '../../../shared/types/lol';
import { MediaCard } from './MediaCard';

export function EmotesSection({ emotes }: { emotes: OwnedEmote[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
      {emotes.map((emote) => (
        <MediaCard key={emote.emoteId} name={emote.name} imageDataUrl={emote.imageDataUrl} />
      ))}
    </div>
  );
}
