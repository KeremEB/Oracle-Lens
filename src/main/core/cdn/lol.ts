import { getCachedAssetDataUrl } from './cache';
import type { SkinRarity } from '../../../shared/types/lol';

// Data Dragon is Riot's official static-data CDN (unlike the LCU, this part
// is documented and stable): https://developer.riotgames.com/docs/lol
const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com';

let versionPromise: Promise<string> | undefined;

async function getLatestVersion(): Promise<string> {
  if (!versionPromise) {
    versionPromise = fetch(`${DDRAGON_BASE}/api/versions.json`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`versions.json request failed with status ${res.status}`);
        }
        return res.json() as Promise<string[]>;
      })
      .then((versions) => versions[0]);
  }
  return versionPromise;
}

interface DdragonChampion {
  id: string; // e.g. "Aatrox" — also the icon file stem
  name: string;
  // "Jade_"-prefixed entries (key = 600000 + base championId, e.g. Jade_Wukong
  // = 60062 for base Wukong = 62) are the "LoL Classic" alternate-mode variant
  // of a champion, sharing the same display name as the base entry — confirmed
  // against a live account that owns mastery on both Wukong and Jade_Wukong.
  isClassicVariant: boolean;
}

let championsByIdPromise: Promise<Map<number, DdragonChampion>> | undefined;

async function getChampionsById(): Promise<Map<number, DdragonChampion>> {
  if (!championsByIdPromise) {
    championsByIdPromise = (async () => {
      const version = await getLatestVersion();
      const response = await fetch(`${DDRAGON_BASE}/cdn/${version}/data/en_US/champion.json`);
      if (!response.ok) {
        throw new Error(`champion.json request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as {
        data: Record<string, { key: string; id: string; name: string }>;
      };

      const map = new Map<number, DdragonChampion>();
      for (const champion of Object.values(payload.data)) {
        map.set(Number(champion.key), {
          id: champion.id,
          name: champion.name,
          isClassicVariant: champion.id.startsWith('Jade_'),
        });
      }
      return map;
    })();
  }
  return championsByIdPromise;
}

export interface ChampionMeta {
  name: string;
  isClassicVariant: boolean;
}

export async function getChampionMeta(championId: number): Promise<ChampionMeta | undefined> {
  const champions = await getChampionsById();
  const champion = champions.get(championId);
  if (!champion) return undefined;
  return { name: champion.name, isClassicVariant: champion.isClassicVariant };
}

export async function getChampionIconDataUrl(championId: number): Promise<string | null> {
  const champions = await getChampionsById();
  const champion = champions.get(championId);
  if (!champion) {
    return null;
  }

  try {
    const version = await getLatestVersion();
    const remoteUrl = `${DDRAGON_BASE}/cdn/${version}/img/champion/${champion.id}.png`;
    return await getCachedAssetDataUrl(`lol/champion-icon/${champion.id}.png`, remoteUrl, 'image/png');
  } catch (err) {
    console.warn(
      `[cdn] failed to fetch champion icon for ${champion.id}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// Mastery crest badges, from Community Dragon (undocumented, but this exact
// path was verified manually — see legendarychampionmastery/ directory).
// Only levels 0 and 4-10 have distinct art; 1-3 fall back to the level-0
// ("no crest yet") image since Riot doesn't ship separate crests for them.
const MASTERY_CREST_BASE =
  'https://raw.communitydragon.org/latest/game/assets/ux/mastery/legendarychampionmastery';

export async function getMasteryCrestDataUrl(level: number): Promise<string | null> {
  const clamped = Math.min(Math.max(Math.round(level), 0), 10);
  const crestLevel = clamped >= 4 ? clamped : 0;
  const remoteUrl = `${MASTERY_CREST_BASE}/masterycrest_level${crestLevel}.png`;

  try {
    return await getCachedAssetDataUrl(`lol/mastery-crest/${crestLevel}.png`, remoteUrl, 'image/png');
  } catch (err) {
    console.warn(
      `[cdn] failed to fetch mastery crest for level ${crestLevel}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// Community Dragon's own path convention for anything sourced from the
// client's "/lol-game-data/assets/..." paths — verified manually against a
// real splash image:
// https://github.com/communitydragon/docs/blob/master/assets.md
function resolveGameDataAssetUrl(gameDataPath: string): string {
  const relative = gameDataPath.replace(/^\/lol-game-data\/assets\//i, '').toLowerCase();
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/${relative}`;
}

// Riot's internal "k"-prefixed rarity enum, from Community Dragon's static
// skins.json — the LCU's own skin endpoints don't populate rarity/legacy at
// all (verified against a live account with known Epic/Legendary skins).
// "Hextech" is deliberately absent: it's a skin theme (skinLine), not a
// rarity — Hextech-themed skins showed up as 'mythic' or no rarity at all.
const RARITY_MAP: Record<string, SkinRarity> = {
  kNoRarity: 'standard',
  kRare: 'rare',
  kEpic: 'epic',
  kMythic: 'mythic',
  kLegendary: 'legendary',
  kUltimate: 'ultimate',
  kTranscendent: 'transcendent',
  kExalted: 'exalted',
};

interface SkinMeta {
  rarity: SkinRarity;
  isLegacy: boolean;
  tilePath: string;
  splashPath: string;
}

let skinsByIdPromise: Promise<Map<number, SkinMeta>> | undefined;

async function getSkinsById(): Promise<Map<number, SkinMeta>> {
  if (!skinsByIdPromise) {
    skinsByIdPromise = (async () => {
      const response = await fetch(
        'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/skins.json',
      );
      if (!response.ok) {
        throw new Error(`skins.json request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as Record<
        string,
        { id: number; rarity: string; isLegacy: boolean; tilePath: string; splashPath: string }
      >;

      const map = new Map<number, SkinMeta>();
      for (const skin of Object.values(payload)) {
        map.set(skin.id, {
          rarity: RARITY_MAP[skin.rarity] ?? 'standard',
          isLegacy: skin.isLegacy,
          tilePath: skin.tilePath,
          splashPath: skin.splashPath,
        });
      }
      return map;
    })();
  }
  return skinsByIdPromise;
}

export async function getSkinMeta(skinId: number): Promise<SkinMeta | undefined> {
  const skins = await getSkinsById();
  return skins.get(skinId);
}

export async function getSkinTileDataUrl(skinId: number): Promise<string | null> {
  const meta = await getSkinMeta(skinId);
  if (!meta?.tilePath) return null;

  try {
    const remoteUrl = resolveGameDataAssetUrl(meta.tilePath);
    return await getCachedAssetDataUrl(`lol/skin-tile/${skinId}.jpg`, remoteUrl, 'image/jpeg');
  } catch (err) {
    console.warn(`[cdn] failed to fetch skin tile for ${skinId}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// Builder for the full splash image — not called by the current grid UI
// (splash art is large; the grid uses tiles), but exposed for a future
// detail view per the "splash/tile URL builder" requirement.
export async function getSkinSplashDataUrl(skinId: number): Promise<string | null> {
  const meta = await getSkinMeta(skinId);
  if (!meta?.splashPath) return null;

  try {
    const remoteUrl = resolveGameDataAssetUrl(meta.splashPath);
    return await getCachedAssetDataUrl(`lol/skin-splash/${skinId}.jpg`, remoteUrl, 'image/jpeg');
  } catch (err) {
    console.warn(`[cdn] failed to fetch skin splash for ${skinId}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

const RARITY_GEM_BASE =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/rarity-gem-icons';

// Only epic/mythic/legendary/ultimate/transcendent/exalted have a distinct
// gem icon — standard and rare skins show no gem in the real client either
// (verified: no rare.png or standard.png exists in the directory).
export async function getRarityGemDataUrl(rarity: SkinRarity): Promise<string | null> {
  if (rarity === 'standard' || rarity === 'rare') return null;

  try {
    const remoteUrl = `${RARITY_GEM_BASE}/${rarity}.png`;
    return await getCachedAssetDataUrl(`lol/rarity-gem/${rarity}.png`, remoteUrl, 'image/png');
  } catch (err) {
    console.warn(`[cdn] failed to fetch rarity gem for ${rarity}:`, err instanceof Error ? err.message : err);
    return null;
  }
}
