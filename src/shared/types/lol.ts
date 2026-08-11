// League of Legends domain types, mapped from LCU payloads at the provider boundary.

export interface AccountSummary {
  summonerName: string;
  accountLevel: number;
  region: string;
  profileIconId: number;
  honorLevel: number;
  honorCheckpoint: number;
}
