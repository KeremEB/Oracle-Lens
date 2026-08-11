import type { OwnedWardSkin } from '../../../../shared/types/lol';
import type { LcuWardSkin } from '../endpoints/wardSkins';
import { getWardSkinImageDataUrl } from '../../../core/cdn/lol';

export async function mapOwnedWardSkins(raw: LcuWardSkin[]): Promise<OwnedWardSkin[]> {
  const owned = raw.filter((ward) => ward.ownership.owned);

  return Promise.all(
    owned.map(
      async (ward): Promise<OwnedWardSkin> => ({
        wardId: ward.id,
        name: ward.name,
        imageDataUrl: await getWardSkinImageDataUrl(ward.id, ward.wardImagePath),
      }),
    ),
  );
}
