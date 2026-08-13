import type { Credentials } from 'league-connect';
import type { SkinChromaGroup } from '../../../../shared/types/lol';
import type { LcuSkinMinimal } from '../endpoints/skins';
import { getChampionSkinsFull } from '../endpoints/skins';
import { getChromaImageDataUrl } from '../../../core/cdn/lol';
import { mapWithConcurrency } from '../../../core/concurrency';

const LCU_CONCURRENCY = 5;

export async function mapOwnedChromas(
  credentials: Credentials,
  summonerId: number,
  ownedSkinsMinimal: LcuSkinMinimal[],
): Promise<SkinChromaGroup[]> {
  const championIds = [
    ...new Set(
      ownedSkinsMinimal.filter((skin) => skin.ownership.owned).map((skin) => skin.championId),
    ),
  ];

  const perChampion = await mapWithConcurrency(
    championIds,
    LCU_CONCURRENCY,
    async (championId): Promise<SkinChromaGroup[]> => {
      const skinsFull = await getChampionSkinsFull(credentials, summonerId, championId);
      const groups: SkinChromaGroup[] = [];

      for (const skin of skinsFull) {
        const ownedChromas = skin.chromas.filter((chroma) => chroma.ownership.owned);
        if (ownedChromas.length === 0) continue;

        groups.push({
          skinId: skin.id,
          skinName: skin.name,
          chromas: await Promise.all(
            ownedChromas.map(async (chroma) => ({
              chromaId: chroma.id,
              name: chroma.name,
              colors: chroma.colors,
              imageDataUrl: await getChromaImageDataUrl(chroma.id, chroma.chromaPath),
            })),
          ),
        });
      }

      return groups;
    },
  );

  // Defensive dedup by skinId: some accounts see the same skin group come
  // back from more than one per-champion query (observed live; the LCU
  // doesn't document why — possibly a skin cross-linked to more than one
  // champion ID). A real chroma group should never legitimately appear
  // twice, so collapse rather than try to prove which query "owns" it.
  const seen = new Set<number>();
  const deduped: SkinChromaGroup[] = [];
  for (const group of perChampion.flat()) {
    if (seen.has(group.skinId)) continue;
    seen.add(group.skinId);
    deduped.push(group);
  }
  return deduped;
}
