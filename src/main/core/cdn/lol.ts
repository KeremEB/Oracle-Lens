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

// Rotating special-mode/event content (e.g. the now-retired "LoL Classic"
// roster: Jade_Wukong = 60062 for base Wukong = 62) uses championId/skinId
// offset by a fixed amount above the normal range. Riot's static catalogs
// stop listing this content entirely once the event ends — verified live:
// the "LoL Classic" roster existed in Data Dragon 16.15.1 and was completely
// absent from 16.16.1 a single patch later, not just renamed. Detection is
// therefore by ID range, with a fallback to the base id's data, since a
// rotated-out id may not be resolvable in the catalog at all anymore.
const SPECIAL_CHAMPION_ID_OFFSET = 60000;
const SPECIAL_SKIN_ID_OFFSET = 60000000;

export function isSpecialChampionId(championId: number): boolean {
  return championId >= SPECIAL_CHAMPION_ID_OFFSET;
}

function isSpecialSkinId(skinId: number): boolean {
  return skinId >= SPECIAL_SKIN_ID_OFFSET;
}

interface DdragonChampion {
  id: string; // e.g. "Aatrox" — also the icon file stem
  name: string;
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
        map.set(Number(champion.key), { id: champion.id, name: champion.name });
      }
      return map;
    })();
  }
  return championsByIdPromise;
}

export interface ChampionMeta {
  name: string;
  isSpecialMode: boolean;
}

export async function getChampionMeta(championId: number): Promise<ChampionMeta | undefined> {
  const champions = await getChampionsById();

  const direct = champions.get(championId);
  if (direct) {
    return { name: direct.name, isSpecialMode: isSpecialChampionId(championId) };
  }

  if (isSpecialChampionId(championId)) {
    const base = champions.get(championId - SPECIAL_CHAMPION_ID_OFFSET);
    if (base) {
      return { name: base.name, isSpecialMode: true };
    }
  }

  return undefined;
}

export async function getChampionIconDataUrl(championId: number): Promise<string | null> {
  const champions = await getChampionsById();
  const champion =
    champions.get(championId) ??
    (isSpecialChampionId(championId)
      ? champions.get(championId - SPECIAL_CHAMPION_ID_OFFSET)
      : undefined);
  if (!champion) {
    return null;
  }

  try {
    const version = await getLatestVersion();
    const remoteUrl = `${DDRAGON_BASE}/cdn/${version}/img/champion/${champion.id}.png`;
    return await getCachedAssetDataUrl(`lol/champion-icon/${championId}.png`, remoteUrl, 'image/png');
  } catch (err) {
    console.warn(
      `[cdn] failed to fetch champion icon for ${champion.id}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// Champion portrait for the owned-champions list: the LCU's own ownership
// endpoint already gives a full, correct "/lol-game-data/assets/..." path
// per champion (squarePortraitPath) — always in sync with what the client
// actually has, so no Data Dragon lookup needed for this particular list.
export async function getChampionPortraitDataUrl(
  championId: number,
  squarePortraitPath: string,
): Promise<string | null> {
  if (!squarePortraitPath) return null;

  try {
    const remoteUrl = resolveGameDataAssetUrl(squarePortraitPath);
    return await getCachedAssetDataUrl(`lol/champion-portrait/${championId}.png`, remoteUrl, 'image/png');
  } catch (err) {
    console.warn(
      `[cdn] failed to fetch champion portrait for ${championId}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// Mastery crest badges — the client's own full-size emblem art, one per
// level 1-10. The level -> file mapping is not guessed: it's lifted from the
// client's own stylesheet, which does
//   mastery-crest-image[data-mastery-level="N"] { content: url(mastery-N.png) }
// for exactly N = 1..10.
//
// This replaces the older game/assets/ux/mastery/legendarychampionmastery/
// set, which is both lower-resolution (256px vs 800x900) and incomplete —
// it ships art only for levels 0 and 4-10, so 1-3 had to fall back to the
// blank level-0 image.
//
// There is no mastery-0.png: level 0 means "owned but never played", which
// has no mastery emblem at all, so that returns null rather than a
// placeholder.
const MASTERY_CREST_BASE =
  'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default';

export async function getMasteryCrestDataUrl(level: number): Promise<string | null> {
  const crestLevel = Math.min(Math.max(Math.round(level), 0), 10);
  if (crestLevel < 1) return null;

  const remoteUrl = `${MASTERY_CREST_BASE}/mastery-${crestLevel}.png`;

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

// Mastery banner — the ribbon that sits behind the crest in the client's
// own mastery badge. Not in any stylesheet; extracted by parsing the
// client's rcp-fe-lol-shared-components bundle's AST (not text-searched —
// the naive "grep for mastery-banner near mastery" pass came up empty
// because the two are wired together in JS, not CSS) to find
// `getMasteryBannerAsset`:
//   const LEVEL_TO_BANNER = {0:0,1:1,2:1,3:1,4:1,5:2,6:2,7:2,8:2,9:2,10:3}
//   const BANNER_ASSET = {0: mastery-banner-0.png, 1: mastery-banner-1.svg,
//                          2: mastery-banner-2.svg, 3: mastery-banner-3.svg}
// getMasteryBannerAsset(level) = BANNER_ASSET[LEVEL_TO_BANNER[min(level,10)]]
// Confirmed by resolving the bundle's own webpack module array (parsed with
// acorn, not string offsets) at exactly those four indices.
const MASTERY_BANNER_BASE =
  'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default';

const MASTERY_BANNER_FILES = [
  'mastery-banner-0.png',
  'mastery-banner-1.svg',
  'mastery-banner-2.svg',
  'mastery-banner-3.svg',
] as const;

function masteryBannerIndex(level: number): number {
  const clamped = Math.min(Math.max(Math.round(level), 0), 10);
  if (clamped === 0) return 0;
  if (clamped <= 4) return 1;
  if (clamped <= 9) return 2;
  return 3;
}

export async function getMasteryBannerDataUrl(level: number): Promise<string | null> {
  const bannerIndex = masteryBannerIndex(level);
  const file = MASTERY_BANNER_FILES[bannerIndex];
  const remoteUrl = `${MASTERY_BANNER_BASE}/${file}`;
  const mimeType = file.endsWith('.svg') ? 'image/svg+xml' : 'image/png';

  try {
    return await getCachedAssetDataUrl(`lol/mastery-banner/${file}`, remoteUrl, mimeType);
  } catch (err) {
    console.warn(
      `[cdn] failed to fetch mastery banner for level ${level}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// Honor level badges — verified live against a real directory listing of
// rcp-fe-lol-shared-components (badge-honor-1.svg .. badge-honor-5.svg
// exist; badge-honor-0.svg and badge-honor-6.svg both 404). Honor level 0
// ("restricted") has no badge art, same as mastery level 0.
const HONOR_BADGE_BASE =
  'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default';

export async function getHonorBadgeDataUrl(level: number): Promise<string | null> {
  const clamped = Math.round(level);
  if (clamped < 1 || clamped > 5) return null;

  const remoteUrl = `${HONOR_BADGE_BASE}/badge-honor-${clamped}.svg`;

  try {
    return await getCachedAssetDataUrl(
      `lol/honor-badge/${clamped}.svg`,
      remoteUrl,
      'image/svg+xml',
    );
  } catch (err) {
    console.warn(
      `[cdn] failed to fetch honor badge for level ${level}:`,
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

  const direct = skins.get(skinId);
  if (direct) return direct;

  // "LoL Classic"-style special-mode skin ids (60000000 + normal skin id)
  // aren't in Community Dragon's catalog at all — fall back to the normal
  // skin's tile/splash/rarity so the card shows something instead of blank.
  if (isSpecialSkinId(skinId)) {
    return skins.get(skinId - SPECIAL_SKIN_ID_OFFSET);
  }

  return undefined;
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

// Chroma images: the LCU's full per-champion skins endpoint already gives a
// full, correct "/lol-game-data/assets/..." path per chroma (chromaPath) —
// this was simply never read before. No separate lookup table needed.
export async function getChromaImageDataUrl(
  chromaId: number,
  chromaPath: string,
): Promise<string | null> {
  if (!chromaPath) return null;

  try {
    const remoteUrl = resolveGameDataAssetUrl(chromaPath);
    return await getCachedAssetDataUrl(`lol/chroma/${chromaId}.png`, remoteUrl, 'image/png');
  } catch (err) {
    console.warn(`[cdn] failed to fetch chroma image for ${chromaId}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// Ward skin images: the LCU already gives a full, correct
// "/lol-game-data/assets/..." path per ward (no separate lookup table
// needed), so this just resolves + caches whatever path it's given.
export async function getWardSkinImageDataUrl(
  wardId: number,
  wardImagePath: string,
): Promise<string | null> {
  if (!wardImagePath) return null;

  try {
    const remoteUrl = resolveGameDataAssetUrl(wardImagePath);
    return await getCachedAssetDataUrl(`lol/ward-skin/${wardId}.png`, remoteUrl, 'image/png');
  } catch (err) {
    console.warn(`[cdn] failed to fetch ward skin image for ${wardId}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

interface EmoteMeta {
  name: string;
  iconPath: string;
}

let emotesByIdPromise: Promise<Map<number, EmoteMeta>> | undefined;

async function getEmotesById(): Promise<Map<number, EmoteMeta>> {
  if (!emotesByIdPromise) {
    emotesByIdPromise = (async () => {
      const response = await fetch(
        'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/summoner-emotes.json',
      );
      if (!response.ok) {
        throw new Error(`summoner-emotes.json request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as Array<{
        id: number;
        name: string;
        inventoryIcon: string;
      }>;

      const map = new Map<number, EmoteMeta>();
      for (const emote of payload) {
        map.set(emote.id, { name: emote.name, iconPath: emote.inventoryIcon });
      }
      return map;
    })();
  }
  return emotesByIdPromise;
}

export async function getEmoteName(emoteId: number): Promise<string | undefined> {
  const emotes = await getEmotesById();
  return emotes.get(emoteId)?.name;
}

export async function getEmoteImageDataUrl(emoteId: number): Promise<string | null> {
  const emotes = await getEmotesById();
  const emote = emotes.get(emoteId);
  if (!emote?.iconPath) return null;

  try {
    const remoteUrl = resolveGameDataAssetUrl(emote.iconPath);
    return await getCachedAssetDataUrl(`lol/emote-icon/${emoteId}.png`, remoteUrl, 'image/png');
  } catch (err) {
    console.warn(`[cdn] failed to fetch emote icon for ${emoteId}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

let profileIconsByIdPromise: Promise<Map<number, string>> | undefined;

async function getProfileIconsById(): Promise<Map<number, string>> {
  if (!profileIconsByIdPromise) {
    profileIconsByIdPromise = (async () => {
      const response = await fetch(
        'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons.json',
      );
      if (!response.ok) {
        throw new Error(`profile-icons.json request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as Array<{ id: number; iconPath?: string }>;

      const map = new Map<number, string>();
      for (const icon of payload) {
        if (icon.iconPath) map.set(icon.id, icon.iconPath);
      }
      return map;
    })();
  }
  return profileIconsByIdPromise;
}

export async function getProfileIconImageDataUrl(iconId: number): Promise<string | null> {
  const icons = await getProfileIconsById();
  const iconPath = icons.get(iconId);
  if (!iconPath) return null;

  try {
    const remoteUrl = resolveGameDataAssetUrl(iconPath);
    return await getCachedAssetDataUrl(`lol/profile-icon/${iconId}.jpg`, remoteUrl, 'image/jpeg');
  } catch (err) {
    console.warn(`[cdn] failed to fetch profile icon for ${iconId}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

const RANKED_EMBLEM_BASE =
  'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem';

// Ranked tier emblems — verified live: iron/bronze/silver/gold/platinum/
// emerald/diamond/master/grandmaster/challenger all exist at this path.
// There is no "unranked" emblem in this directory (404) — callers render
// their own empty/gray placeholder for that state instead of calling this.
export async function getRankedEmblemDataUrl(tier: string): Promise<string | null> {
  const normalized = tier.toLowerCase();
  const remoteUrl = `${RANKED_EMBLEM_BASE}/emblem-${normalized}.png`;

  try {
    return await getCachedAssetDataUrl(`lol/ranked-emblem/${normalized}.png`, remoteUrl, 'image/png');
  } catch (err) {
    console.warn(
      `[cdn] failed to fetch ranked emblem for ${tier}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

const STATIC_ASSETS_BASE =
  'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images';

// Currency icons — verified live. Names don't follow one convention (RP's
// is "icon-rp", BE's is "be-icon"); Riot renamed IP to Blue Essence some
// years ago and this is apparently the newer asset, not the legacy "icon-ip"
// one that also still resolves.
export async function getRiotPointsIconDataUrl(): Promise<string | null> {
  try {
    return await getCachedAssetDataUrl(
      'lol/currency/rp.png',
      `${STATIC_ASSETS_BASE}/icon-rp.png`,
      'image/png',
    );
  } catch (err) {
    console.warn('[cdn] failed to fetch RP icon:', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function getBlueEssenceIconDataUrl(): Promise<string | null> {
  try {
    return await getCachedAssetDataUrl(
      'lol/currency/be.png',
      `${STATIC_ASSETS_BASE}/be-icon.png`,
      'image/png',
    );
  } catch (err) {
    console.warn('[cdn] failed to fetch BE icon:', err instanceof Error ? err.message : err);
    return null;
  }
}

// Level border frames. There are 21, unlocking at level 1, 30, 50, 75, then
// every 25 levels up to 500 — verified against two independent community
// sources (counts and thresholds both match exactly), and the
// "theme-N-border.png" filenames are confirmed to exist 1-21. The mapping
// from theme number to level threshold assumes ascending order (theme 1 =
// level 1 "Piltover" ... theme 21 = level 500 "Eternus"), which isn't
// independently confirmed but is the only sane reading of the file naming.
const LEVEL_BORDER_THRESHOLDS = [
  1, 30, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475,
  500,
];

const LEVEL_BORDER_BASE =
  'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/uikit/themed-borders';

function getLevelBorderTheme(accountLevel: number): number {
  let theme = 1;
  for (let i = 0; i < LEVEL_BORDER_THRESHOLDS.length; i++) {
    if (accountLevel >= LEVEL_BORDER_THRESHOLDS[i]) {
      theme = i + 1;
    } else {
      break;
    }
  }
  return theme;
}

export async function getLevelBorderDataUrl(accountLevel: number): Promise<string | null> {
  const theme = getLevelBorderTheme(accountLevel);
  const remoteUrl = `${LEVEL_BORDER_BASE}/theme-${theme}-border.png`;

  try {
    return await getCachedAssetDataUrl(`lol/level-border/${theme}.png`, remoteUrl, 'image/png');
  } catch (err) {
    console.warn(
      `[cdn] failed to fetch level border for theme ${theme}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// Loot tile art lives under two different path conventions — verified live
// against a real account's /lol-loot/v1/player-loot response. Most items
// (skins, ward skins, summoner icons, Mythic Essence) reuse the normal
// "/lol-game-data/assets/..." convention (resolveGameDataAssetUrl), but
// generic loot-system art (chest icons, currency icons) is served from the
// rcp-fe-lol-loot plugin instead, under "/fe/lol-loot/assets/...".
function resolveLootAssetUrl(lootAssetPath: string): string {
  if (/^\/fe\/lol-loot\//i.test(lootAssetPath)) {
    const relative = lootAssetPath.replace(/^\/fe\/lol-loot\//i, '').toLowerCase();
    return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-loot/global/default/${relative}`;
  }
  return resolveGameDataAssetUrl(lootAssetPath);
}

export async function getLootItemImageDataUrl(
  lootName: string,
  tilePath: string,
): Promise<string | null> {
  if (!tilePath) return null;

  const isJpg = tilePath.toLowerCase().endsWith('.jpg');

  try {
    const remoteUrl = resolveLootAssetUrl(tilePath);
    return await getCachedAssetDataUrl(
      `lol/loot/${lootName}.${isJpg ? 'jpg' : 'png'}`,
      remoteUrl,
      isJpg ? 'image/jpeg' : 'image/png',
    );
  } catch (err) {
    console.warn(`[cdn] failed to fetch loot image for ${lootName}:`, err instanceof Error ? err.message : err);
    return null;
  }
}
