import { createHttp1Request, type Credentials } from 'league-connect';

// Shape of GET /lol-inventory/v1/wallet?currencyTypes=["RP","lol_blue_essence"].
// Undocumented LCU endpoint, verified live — a bare currencyTypes-less GET
// 400s, the query param is required. Keys are the literal currency codes
// the client itself uses, not our own naming.
export interface LcuWallet {
  RP: number;
  lol_blue_essence: number;
}

export async function getWallet(credentials: Credentials): Promise<LcuWallet> {
  const response = await createHttp1Request(
    { url: '/lol-inventory/v1/wallet?currencyTypes=["RP","lol_blue_essence"]', method: 'GET' },
    credentials,
  );

  if (!response.ok) {
    throw new Error(`wallet request failed with status ${response.status}`);
  }

  return response.json<LcuWallet>();
}
