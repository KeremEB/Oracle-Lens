// League of Legends domain types, mapped from LCU payloads at the provider boundary.

export interface AccountSummary {
  summonerName: string;
  accountLevel: number;
  region: string;
  profileIconId: number;
  honorLevel: number;
  honorCheckpoint: number;
}

// Unranked and provisional (placement games) are normal, distinct states —
// not errors and not a "ranked with zero stats" fallback.
export type RankedQueueStatus =
  | { kind: 'unranked' }
  | { kind: 'provisional'; gamesPlayed: number }
  | {
      kind: 'ranked';
      tier: string;
      division: string;
      leaguePoints: number;
      wins: number;
      losses: number;
      /** 0-100, rounded */
      winRate: number;
    };

export interface RankedSummary {
  soloDuo: RankedQueueStatus;
  flex: RankedQueueStatus;
}
