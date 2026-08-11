import { createHttp1Request, type Credentials } from 'league-connect';

// Shape of GET /lol-ranked/v1/current-ranked-stats. Undocumented LCU endpoint;
// only the fields this app actually reads are declared. An unranked queue
// still has an entry in queueMap, just with an empty tier/division — it's a
// normal state, not a missing one.
export interface LcuRankedQueueStats {
  queueType: string;
  tier: string;
  division: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  isProvisional: boolean;
}

export interface LcuRankedStats {
  queueMap: Record<string, LcuRankedQueueStats>;
}

export async function getCurrentRankedStats(credentials: Credentials): Promise<LcuRankedStats> {
  const response = await createHttp1Request(
    { url: '/lol-ranked/v1/current-ranked-stats', method: 'GET' },
    credentials,
  );

  if (!response.ok) {
    throw new Error(`current-ranked-stats request failed with status ${response.status}`);
  }

  return response.json<LcuRankedStats>();
}
