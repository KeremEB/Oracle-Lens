import { createHttp1Request, type Credentials } from 'league-connect';

// Shape of GET /lol-collections/v1/inventories/{summonerId}/ward-skins.
// Undocumented LCU endpoint. wardImagePath is served from the same
// "/lol-game-data/assets/..." namespace as skin splash/tile art — resolvable
// through Community Dragon's public mirror (verified live), no LCU auth needed.
export interface LcuWardSkin {
  id: number;
  name: string;
  ownership: { owned: boolean };
  wardImagePath: string;
}

export async function getWardSkins(
  credentials: Credentials,
  summonerId: number,
): Promise<LcuWardSkin[]> {
  const response = await createHttp1Request(
    { url: `/lol-collections/v1/inventories/${summonerId}/ward-skins`, method: 'GET' },
    credentials,
  );

  if (!response.ok) {
    throw new Error(`ward-skins request failed with status ${response.status}`);
  }

  return response.json<LcuWardSkin[]>();
}
