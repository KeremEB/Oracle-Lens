import type { AccountSummary } from '../../../../shared/types/lol';
import type { LcuCurrentSummoner } from '../endpoints/summoner';
import type { LcuHonorProfile } from '../endpoints/honor';
import type { LcuRegionLocale } from '../endpoints/region';

interface RawAccountSummary {
  summoner: LcuCurrentSummoner;
  honor: LcuHonorProfile;
  region: LcuRegionLocale | undefined;
}

export function mapAccountSummary({ summoner, honor, region }: RawAccountSummary): AccountSummary {
  return {
    summonerName:
      summoner.gameName && summoner.tagLine
        ? `${summoner.gameName}#${summoner.tagLine}`
        : summoner.displayName,
    accountLevel: summoner.summonerLevel,
    region: region?.region ?? 'Unknown',
    profileIconId: summoner.profileIconId,
    honorLevel: honor.honorLevel ?? 0,
    honorCheckpoint: honor.checkpoint ?? 0,
  };
}
