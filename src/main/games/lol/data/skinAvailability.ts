import type { SkinAvailability, SkinRarity } from '../../../../shared/types/lol';

/**
 * Curated skin id -> availability overrides.
 *
 * The LCU exposes no "how was this obtained" field, and its store catalog only
 * answers "is it for sale right now", which cannot distinguish a vaulted legacy
 * skin from a ranked reward that was never sold. So the cases that matter are
 * listed by hand here. Every id below was verified against Community Dragon's
 * skins.json rather than recalled — a wrong id would silently mislabel some
 * unrelated skin.
 *
 * This list is deliberately small: it covers only what we are certain about.
 * Everything else falls through to the defaults in resolveSkinAvailability.
 */

// Retired promotional/event exclusives with no remaining path to obtain them.
const UNAVAILABLE: readonly number[] = [
  4001, // PAX Twisted Fate
  15005, // PAX Sivir
  24004, // PAX Jax
  10001, // Silver Kayle
  10005, // Judgment Kayle
  12001, // Black Alistar
  13001, // Young Ryze
  33001, // King Rammus
  53001, // Rusty Blitzcrank
];

// Ranked-season and honor rewards. Never sold for RP in any region.
// The Victorious line is enumerated rather than name-matched because Community
// Dragon's names are localised by the caller's locale.
const REWARD: readonly number[] = [
  4045, // Victorious Twisted Fate
  11106, // Victorious Master Yi
  15008, // Victorious Sivir
  23027, // Victorious Tryndamere
  25006, // Victorious Morgana
  34046, // Victorious Anivia
  37056, // Victorious Sona
  40004, // Victorious Janna
  53036, // Victorious Blitzcrank
  57007, // Victorious Maokai
  59004, // Victorious Jarvan IV
  60002, // Victorious Elise
  61008, // Victorious Orianna
  96055, // Victorious Kog'Maw
  104014, // Victorious Graves
  107049, // Victorious Rengar
  113036, // Victorious Sejuani
  114098, // Victorious Fiora
  119068, // Victorious Draven
  201051, // Victorious Braum
  236025, // Victorious Lucian
  266009, // Victorious Aatrox
  19001, // Grey Warwick — honor reward
  29003, // Medieval Twitch — honor reward
];

// Regional or partner campaign giveaways (referrals, social media, events).
const PROMOTIONAL: readonly number[] = [
  18001, // Riot Girl Tristana
  12005, // Unchained Alistar
  42001, // UFO Corki
  10007, // Riot Kayle
  75004, // Riot K-9 Nasus
];

const CURATED = new Map<number, SkinAvailability>([
  ...UNAVAILABLE.map((id): [number, SkinAvailability] => [id, 'unavailable']),
  ...REWARD.map((id): [number, SkinAvailability] => [id, 'reward']),
  ...PROMOTIONAL.map((id): [number, SkinAvailability] => [id, 'promotional']),
]);

export function resolveSkinAvailability(
  skinId: number,
  rarity: SkinRarity,
  isLegacy: boolean,
): SkinAvailability {
  const curated = CURATED.get(skinId);
  if (curated) return curated;

  // Mythic rarity is the Mythic Essence shop's stock (Prestige, Hextech, Neo
  // PAX, ...). Confirmed against the live store catalog: of 166 mythic skins
  // only 3 carry an RP price at all, and two of those are 0 RP.
  if (rarity === 'mythic') return 'craftable';

  return isLegacy ? 'legacy' : 'purchasable';
}
