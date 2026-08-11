import type { ChampionMasteryEntry } from '../../../../shared/types/lol';
import type { LcuOwnedChampion } from '../endpoints/champions';
import type { LcuChampionMasteryEntry } from '../endpoints/championMastery';
import { getChampionPortraitDataUrl, isSpecialChampionId } from '../../../core/cdn/lol';

// Champion list comes from ownership (every owned champion, played or not) —
// mastery data is looked up per champion and merged on top. A champion with
// no mastery entry simply hasn't been played yet: level 0, 0 points.
export async function mapOwnedChampions(
  ownedChampions: LcuOwnedChampion[],
  masteryEntries: LcuChampionMasteryEntry[],
): Promise<ChampionMasteryEntry[]> {
  const masteryById = new Map(masteryEntries.map((entry) => [entry.championId, entry]));

  return Promise.all(
    ownedChampions
      .filter((champion) => champion.ownership.owned)
      .map(async (champion): Promise<ChampionMasteryEntry> => {
        const mastery = masteryById.get(champion.id);
        const iconDataUrl = await getChampionPortraitDataUrl(
          champion.id,
          champion.squarePortraitPath,
        );

        return {
          championId: champion.id,
          championName: champion.name,
          masteryLevel: mastery?.championLevel ?? 0,
          masteryPoints: mastery?.championPoints ?? 0,
          iconDataUrl,
          isSpecialMode: isSpecialChampionId(champion.id),
        };
      }),
  );
}
