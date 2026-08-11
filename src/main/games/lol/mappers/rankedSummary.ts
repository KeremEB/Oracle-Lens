import type { RankedQueueStatus, RankedSummary } from '../../../../shared/types/lol';
import type { LcuRankedQueueStats, LcuRankedStats } from '../endpoints/ranked';

const SOLO_DUO_QUEUE_TYPE = 'RANKED_SOLO_5x5';
const FLEX_QUEUE_TYPE = 'RANKED_FLEX_SR';

function mapQueueStatus(raw: LcuRankedQueueStats | undefined): RankedQueueStatus {
  if (!raw) {
    return { kind: 'unranked' };
  }

  if (raw.isProvisional) {
    return { kind: 'provisional', gamesPlayed: raw.wins + raw.losses };
  }

  if (!raw.tier) {
    return { kind: 'unranked' };
  }

  const totalGames = raw.wins + raw.losses;
  const winRate = totalGames > 0 ? Math.round((raw.wins / totalGames) * 100) : 0;

  return {
    kind: 'ranked',
    tier: raw.tier,
    division: raw.division,
    leaguePoints: raw.leaguePoints,
    wins: raw.wins,
    losses: raw.losses,
    winRate,
  };
}

export function mapRankedSummary(raw: LcuRankedStats): RankedSummary {
  return {
    soloDuo: mapQueueStatus(raw.queueMap?.[SOLO_DUO_QUEUE_TYPE]),
    flex: mapQueueStatus(raw.queueMap?.[FLEX_QUEUE_TYPE]),
  };
}
