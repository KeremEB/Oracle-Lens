import { createHttp1Request, type Credentials } from 'league-connect';

// Shape of GET /lol-champions/v1/owned-champions-minimal. Undocumented LCU
// endpoint, implicitly scoped to the current summoner (no id param needed).
// Unlike /lol-champion-mastery/v1/local-player/champion-mastery, this
// returns every OWNED champion, whether or not it's ever been played.
export interface LcuOwnedChampion {
  id: number;
  name: string;
  ownership: { owned: boolean };
  squarePortraitPath: string;
}

export async function getOwnedChampionsMinimal(
  credentials: Credentials,
): Promise<LcuOwnedChampion[]> {
  const response = await createHttp1Request(
    { url: '/lol-champions/v1/owned-champions-minimal', method: 'GET' },
    credentials,
  );

  if (!response.ok) {
    throw new Error(`owned-champions-minimal request failed with status ${response.status}`);
  }

  return response.json<LcuOwnedChampion[]>();
}
