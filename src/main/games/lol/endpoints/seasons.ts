import { createHttp1Request, type Credentials } from 'league-connect';

// Shape of POST /lol-seasons/v1/allSeasons/product/LOL. Undocumented LCU
// endpoint, verified live — note it's POST, not GET (GET 405s; POST with an
// empty JSON body succeeds and returns all 23 seasons back to Season 1 in
// 2011, with real start/end timestamps). metadata.publicName/locKey/year
// come back empty/0 in practice — not usable for display, hence not
// declared here; only the fields this app actually reads are typed.
export interface LcuSeason {
  seasonId: number;
  seasonStart: number;
  seasonEnd: number;
}

export async function getAllSeasons(credentials: Credentials): Promise<LcuSeason[]> {
  const response = await createHttp1Request(
    { url: '/lol-seasons/v1/allSeasons/product/LOL', method: 'POST', body: {} },
    credentials,
  );

  if (!response.ok) {
    throw new Error(`allSeasons request failed with status ${response.status}`);
  }

  return response.json<LcuSeason[]>();
}
