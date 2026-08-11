import { getCachedAssetDataUrl } from './cache';

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
