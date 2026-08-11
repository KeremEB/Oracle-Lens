import { createHttp1Request, type Credentials } from 'league-connect';

// Shape of GET /lol-summoner/v1/current-summoner. Undocumented LCU endpoint —
// gameName/tagLine only exist on clients past the Riot ID rollout, hence optional.
export interface LcuCurrentSummoner {
  summonerId: number;
  displayName: string;
  gameName?: string;
  tagLine?: string;
  summonerLevel: number;
  profileIconId: number;
}

export async function getCurrentSummoner(credentials: Credentials): Promise<LcuCurrentSummoner> {
  const response = await createHttp1Request(
    { url: '/lol-summoner/v1/current-summoner', method: 'GET' },
    credentials,
  );

  if (!response.ok) {
    throw new Error(`current-summoner request failed with status ${response.status}`);
  }

  return response.json<LcuCurrentSummoner>();
}
