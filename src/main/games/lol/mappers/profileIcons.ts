import type { OwnedProfileIcon } from '../../../../shared/types/lol';
import type { LcuInventoryItem } from '../endpoints/inventory';
import { getProfileIconImageDataUrl } from '../../../core/cdn/lol';

export async function mapOwnedProfileIcons(raw: LcuInventoryItem[]): Promise<OwnedProfileIcon[]> {
  // itemId 0 is the "no icon" reserved slot, not a real owned icon.
  const owned = raw.filter((item) => item.owned && item.itemId > 0);

  return Promise.all(
    owned.map(
      async (item): Promise<OwnedProfileIcon> => ({
        iconId: item.itemId,
        imageDataUrl: await getProfileIconImageDataUrl(item.itemId),
      }),
    ),
  );
}
