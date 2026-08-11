import type { OwnedEmote } from '../../../../shared/types/lol';
import type { LcuInventoryItem } from '../endpoints/inventory';
import { getEmoteImageDataUrl, getEmoteName } from '../../../core/cdn/lol';

export async function mapOwnedEmotes(raw: LcuInventoryItem[]): Promise<OwnedEmote[]> {
  const owned = raw.filter((item) => item.owned);

  const mapped = await Promise.all(
    owned.map(async (item): Promise<OwnedEmote | null> => {
      const [name, imageDataUrl] = await Promise.all([
        getEmoteName(item.itemId),
        getEmoteImageDataUrl(item.itemId),
      ]);
      // A handful of low itemIds are reserved/unnamed placeholder slots, not
      // real emotes — skip anything Community Dragon has no name for.
      if (!name) return null;
      return { emoteId: item.itemId, name, imageDataUrl };
    }),
  );

  return mapped.filter((emote): emote is OwnedEmote => emote !== null);
}
