import { createHttp1Request, type Credentials } from 'league-connect';

// Shape of items from GET /lol-inventory/v1/inventory* — undocumented LCU
// endpoints. Only ownership is here; no name or image. Emotes and profile
// icons both use this generic inventory ledger, so name/image come from
// Community Dragon's static game data instead (core/cdn/lol.ts).
export interface LcuInventoryItem {
  itemId: number;
  owned: boolean;
}

export async function getEmoteInventory(credentials: Credentials): Promise<LcuInventoryItem[]> {
  const response = await createHttp1Request(
    { url: '/lol-inventory/v1/inventory/emotes', method: 'GET' },
    credentials,
  );

  if (!response.ok) {
    throw new Error(`emote inventory request failed with status ${response.status}`);
  }

  return response.json<LcuInventoryItem[]>();
}

export async function getProfileIconInventory(
  credentials: Credentials,
): Promise<LcuInventoryItem[]> {
  const query = encodeURIComponent(JSON.stringify(['SUMMONER_ICON']));
  const response = await createHttp1Request(
    { url: `/lol-inventory/v1/inventory?inventoryTypes=${query}`, method: 'GET' },
    credentials,
  );

  if (!response.ok) {
    throw new Error(`profile icon inventory request failed with status ${response.status}`);
  }

  return response.json<LcuInventoryItem[]>();
}
