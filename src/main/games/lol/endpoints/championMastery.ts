import { createHttp1Request, type Credentials } from 'league-connect';

// Shape of GET /lol-champion-mastery/v1/local-player/champions. Undocumented
// but very stable, widely used LCU endpoint. Only returns champions the
// player has mastery data for (i.e. has actually played) — an owned but
// never-played champion won't appear here at all.
export interface LcuChampionMasteryEntry {
  championId: number;
  championLevel: number;
  championPoints: number;
}

export async function getChampionMasteryList(
  credentials: Credentials,
): Promise<LcuChampionMasteryEntry[]> {
  const response = await createHttp1Request(
    { url: '/lol-champion-mastery/v1/local-player/champion-mastery', method: 'GET' },
    credentials,
  );

  if (!response.ok) {
    throw new Error(`champion-mastery request failed with status ${response.status}`);
  }

  return response.json<LcuChampionMasteryEntry[]>();
}
