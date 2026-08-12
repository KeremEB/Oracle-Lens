import { createHttp1Request, type Credentials } from 'league-connect';

/**
 * Shape of GET /lol-store/v1/catalog?inventoryType=["CHAMPION_SKIN"] —
 * undocumented LCU endpoint, verified live against a real client.
 *
 * It returns every skin the store knows about (~6300), not just owned ones, so
 * callers join by `itemId`. `prices` is empty for content the store no longer
 * sells; skins that were never in the store at all are missing from the
 * response entirely. Both cases are normal, not errors.
 *
 * Only the fields we actually consume are typed. Two response details worth
 * knowing: `currency` is "RP" or "IP" (every IP entry observed was a leftover
 * costing 0), and an active discount does NOT modify `prices` — it arrives in
 * a separate `sale` object, deliberately ignored here so an account's total
 * doesn't swing with whatever happens to be on sale that week.
 */
export interface LcuStoreItem {
  itemId: number;
  prices: { cost: number; currency: string; discount: number }[];
}

export async function getSkinStoreCatalog(credentials: Credentials): Promise<LcuStoreItem[]> {
  const inventoryType = encodeURIComponent(JSON.stringify(['CHAMPION_SKIN']));
  const response = await createHttp1Request(
    { url: `/lol-store/v1/catalog?inventoryType=${inventoryType}`, method: 'GET' },
    credentials,
  );

  if (!response.ok) {
    throw new Error(`store catalog request failed with status ${response.status}`);
  }

  return response.json<LcuStoreItem[]>();
}

/** Skin id -> exact RP cost. Skins the store doesn't price are absent. */
export function buildRpPriceIndex(items: LcuStoreItem[]): Map<number, number> {
  const prices = new Map<number, number>();

  for (const item of items) {
    // A 0-cost entry is a placeholder the store never charges against (every
    // IP-currency row observed was one, plus a couple of RP rows) — treating
    // it as a real price would silently zero out a skin.
    const rp = item.prices.find((price) => price.currency === 'RP' && price.cost > 0);
    if (rp) {
      prices.set(item.itemId, rp.cost);
    }
  }

  return prices;
}
