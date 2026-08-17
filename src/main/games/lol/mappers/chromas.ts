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

  // Defensive dedup by skinId AND skinName: some accounts see the same skin
  // group come back from more than one per-champion query (observed live;
  // the LCU doesn't document why — possibly a skin cross-linked to more
  // than one champion ID). The id-based check alone wasn't enough — some
  // duplicates observed live carry two DIFFERENT skin ids for what is
  // visibly the same skin (older pre-Chroma-system recolor skins, e.g.
  // Coven Morgana / Dragonslayer Pantheon, appear to be exposed as more
  // than one skin entry by this endpoint) — so name is checked too, on the
  // assumption two genuinely different skins never share an exact display
  // name. A real chroma group should never legitimately appear twice, so
  // collapse rather than try to prove which query "owns" it.
  const seenIds = new Set<number>();
  const seenNames = new Set<string>();
  const deduped: SkinChromaGroup[] = [];
  for (const group of perChampion.flat()) {
    const nameKey = group.skinName.trim().toLowerCase();
    if (seenIds.has(group.skinId) || seenNames.has(nameKey)) continue;
    seenIds.add(group.skinId);
    seenNames.add(nameKey);
    deduped.push(group);
  }
  return deduped;
}
