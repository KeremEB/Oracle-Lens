import type { LootCategory, LootCurrencyAmount, LootItem } from '../../../../shared/types/lol';
import type { LcuLootItem } from '../endpoints/loot';
import { getLootItemImageDataUrl } from '../../../core/cdn/lol';

// Verified live against Community Dragon's rcp-fe-lol-loot en_us trans.json
// (loot_name_currency_* keys) — the LCU never localizes these currency
// lootNames on the item itself (localizedName/itemDesc both come back blank
// for CURRENCY-type entries), so they're mapped by hand here instead of
// resolved from the payload like everything else.
const CURRENCY_LABELS: Record<string, string> = {
  CURRENCY_cosmetic: 'Orange Essence',
  CURRENCY_champion: 'Blue Essence',
  CURRENCY_mythic: 'Mythic Essence',
  CURRENCY_RP: 'RP',
};

function currencyLabel(lootName: string): string {
  return CURRENCY_LABELS[lootName] ?? lootName;
}

// The real client groups every loot item by `displayCategories` — verified
// against Community Dragon's rcp-fe-lol-loot trans strings (loot_category_*)
// and a live account's response: CHAMPION, SKIN, WARDSKIN, EMOTE, CHEST
// (labelled "Materials" — covers real chests, key(fragment)s, AND Mythic
// Essence together), SUMMONERICON, ETERNALS (Statstones), COMPANION (TFT
// Tacticians, served from the same endpoint but out of scope until the TFT
// module exists).
//
// The user's five requested buckets split the client's single "Materials"
// group in two, which `displayCategories` alone can't distinguish — done by
// lootName instead: CURRENCY_mythic (Mythic Essence) and the now-retired
// MATERIAL_rare (Gemstone) go to `materials`, everything else CHEST-grouped
// goes to `chestsKeysOrbs`. MATERIAL_key itself has no displayCategories at
// all in the static catalog (an apparent LCU data quirk), so it's matched by
// lootName prefix as a fallback alongside MATERIAL_key_fragment.
function classify(item: LcuLootItem): LootCategory | null {
  if (!item.lootName) return null; // an occasional fully-blank placeholder entry with nothing to render
  if (item.displayCategories === 'COMPANION') return null; // TFT loot — out of scope until the TFT module ships

  if (item.displayCategories === 'CHAMPION') return 'championShards';
  if (item.displayCategories === 'SKIN') return 'skinShards';
  if (item.displayCategories === 'WARDSKIN' || item.displayCategories === 'EMOTE') {
    return 'wardsAndEmotes';
  }
  if (item.lootName === 'CURRENCY_mythic' || item.lootName.startsWith('MATERIAL_rare')) {
    return 'materials';
  }
  if (item.displayCategories === 'CHEST' || item.lootName.startsWith('MATERIAL_key')) {
    return 'chestsKeysOrbs';
  }
  // Bare wallet currencies (RP, Blue Essence, Orange Essence) have no
  // displayCategories of their own in the real client either — they're shown
  // as a balance, not a loot card, and RP/BE are already in the account
  // header wallet — so they're dropped entirely rather than filed as "Other".
  if (item.type === 'CURRENCY') return null;

  return 'other';
}

function currencyAmount(value: number, lootName: string): LootCurrencyAmount | undefined {
  if (value <= 0 || !lootName) return undefined;
  return { amount: value, label: currencyLabel(lootName) };
}

export async function mapPlayerLoot(raw: LcuLootItem[]): Promise<LootItem[]> {
  const categorized = raw
    .map((item) => ({ item, category: classify(item) }))
    .filter(
      (entry): entry is { item: LcuLootItem; category: LootCategory } => entry.category !== null,
    );

  return Promise.all(
    categorized.map(
      async ({ item, category }): Promise<LootItem> => ({
        lootName: item.lootName,
        name: item.localizedName || item.itemDesc || item.lootName,
        category,
        count: item.count,
        imageDataUrl: await getLootItemImageDataUrl(item.lootName, item.tilePath),
        disenchantValue: currencyAmount(item.disenchantValue, item.disenchantLootName),
        unlockCost: currencyAmount(item.upgradeEssenceValue, item.upgradeEssenceName),
      }),
    ),
  );
}
