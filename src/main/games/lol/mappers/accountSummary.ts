import type { AccountSummary } from '../../../../shared/types/lol';
import type { LcuCurrentSummoner } from '../endpoints/summoner';
import type { LcuHonorProfile } from '../endpoints/honor';
import type { LcuRegionLocale } from '../endpoints/region';
import type { RsoUserInfo } from '../endpoints/rsoAuth';
import type { LcuSeason } from '../endpoints/seasons';

interface RawAccountSummary {
  summoner: LcuCurrentSummoner;
  honor: LcuHonorProfile;
  region: LcuRegionLocale | undefined;
  rsoUserInfo: RsoUserInfo | undefined;
  seasons: LcuSeason[] | undefined;
}

// Finds which season's [start, end] window the account's creation date
// falls into. Both inputs are optional and either can independently be
// unavailable (RSO userinfo can fail even when the rest of the summary
// succeeds) — a missing creation date or season list means "don't show
// this field at all", not a fallback value, per the "hide missing data"
// rule.
function findCreatedSeasonId(
  createdAt: number | undefined,
  seasons: LcuSeason[] | undefined,
): number | undefined {
  if (!createdAt || !seasons?.length) return undefined;
  return seasons.find((s) => createdAt >= s.seasonStart && createdAt <= s.seasonEnd)?.seasonId;
}

export function mapAccountSummary({
  summoner,
  honor,
  region,
  rsoUserInfo,
  seasons,
}: RawAccountSummary): AccountSummary {
  return {
    summonerName:
      summoner.gameName && summoner.tagLine
        ? `${summoner.gameName}#${summoner.tagLine}`
        : summoner.displayName,
    accountLevel: summoner.summonerLevel,
    region: region?.region ?? 'Unknown',
    profileIconId: summoner.profileIconId,
    honorLevel: honor.honorLevel ?? 0,
    country: rsoUserInfo?.country?.toUpperCase(),
    createdSeasonId: findCreatedSeasonId(rsoUserInfo?.accountCreatedAt, seasons),
  };
}
