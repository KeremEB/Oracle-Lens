import type { ChampionMasteryEntry } from '../../../../shared/types/lol';
import type { LcuChampionMasteryEntry } from '../endpoints/championMastery';
import { getChampionIconDataUrl, getChampionMeta } from '../../../core/cdn/lol';

export async function mapChampionMasteries(
  raw: LcuChampionMasteryEntry[],
): Promise<ChampionMasteryEntry[]> {
  return Promise.all(
    raw.map(async (entry) => {
      const [meta, iconDataUrl] = await Promise.all([
        getChampionMeta(entry.championId),
        getChampionIconDataUrl(entry.championId),
      ]);

      return {
        championId: entry.championId,
        championName: meta?.name ?? `Champion ${entry.championId}`,
        masteryLevel: entry.championLevel,
        masteryPoints: entry.championPoints,
        iconDataUrl,
        isClassicVariant: meta?.isClassicVariant ?? false,
      };
    }),
  );
}
