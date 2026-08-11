import { createHttp1Request, type Credentials } from 'league-connect';

// Shape of GET /lol-champions/v1/inventories/{summonerId}/skins-minimal.
// Undocumented LCU endpoint. Returns EVERY skin in the game (owned or not) —
// callers must filter by ownership.owned themselves. rarity/legacy are not
// populated here at all (verified against a live account); that metadata
// comes from Community Dragon's static skin data instead (core/cdn/lol.ts).
export interface LcuSkinMinimal {
  id: number;
  championId: number;
  name: string;
  isBase: boolean;
  ownership: { owned: boolean };
}

export async function getSkinsMinimal(
  credentials: Credentials,
  summonerId: number,
): Promise<LcuSkinMinimal[]> {
  const response = await createHttp1Request(
    { url: `/lol-champions/v1/inventories/${summonerId}/skins-minimal`, method: 'GET' },
    credentials,
  );

  if (!response.ok) {
    throw new Error(`skins-minimal request failed with status ${response.status}`);
  }

  return response.json<LcuSkinMinimal[]>();
}

// Shape of GET /lol-champions/v1/inventories/{summonerId}/champions/{championId}/skins
// — the FULL (non-minimal) skin list for one champion. Unlike skins-minimal,
// this includes each skin's chromas (with owned colors) — verified live.
export interface LcuChromaFull {
  id: number;
  name: string;
  colors: string[];
  chromaPath: string;
  ownership: { owned: boolean };
}

export interface LcuChampionSkinFull {
  id: number;
  name: string;
  isBase: boolean;
  chromas: LcuChromaFull[];
}

export async function getChampionSkinsFull(
  credentials: Credentials,
  summonerId: number,
  championId: number,
): Promise<LcuChampionSkinFull[]> {
  const response = await createHttp1Request(
    { url: `/lol-champions/v1/inventories/${summonerId}/champions/${championId}/skins`, method: 'GET' },
    credentials,
  );

  if (!response.ok) {
    throw new Error(`champion skins (full) request failed with status ${response.status}`);
  }

  return response.json<LcuChampionSkinFull[]>();
}
