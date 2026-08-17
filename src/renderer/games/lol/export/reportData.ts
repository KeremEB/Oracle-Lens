import type {
  ChampionMasteryEntry,
  LootItem,
  OwnedEmote,
  OwnedProfileIcon,
  OwnedSkin,
  OwnedWardSkin,
  SkinChromaGroup,
} from '../../../../shared/types/lol';

export interface CollectionCounts {
  /** Standard (non-special-mode) champions only — special-mode ones are counted under `classic`. */
  champions: number;
  /** Standard (non-special-mode) skins only — special-mode ones are counted under `classic`. */
  skins: number;
  chromas: number;
  wardSkins: number;
  emotes: number;
  profileIcons: number;
  /** Special-mode/event champions and skins together — see ClassicSection.tsx. */
  classic: number;
  loot: number;
}

export interface ReportData {
  champions: ChampionMasteryEntry[];
  skins: OwnedSkin[];
  chromas: SkinChromaGroup[];
  wardSkins: OwnedWardSkin[];
  emotes: OwnedEmote[];
  profileIcons: OwnedProfileIcon[];
  loot: LootItem[];
}

export function computeCollectionCounts(data: ReportData): CollectionCounts {
  return {
    champions: data.champions.filter((c) => !c.isSpecialMode).length,
    skins: data.skins.filter((s) => !s.isSpecialMode).length,
    // Chromas arrive grouped under their skin — the count that matters here
    // is individual chromas owned, not how many skins have any.
    chromas: data.chromas.reduce((sum, group) => sum + group.chromas.length, 0),
    wardSkins: data.wardSkins.length,
    emotes: data.emotes.length,
    profileIcons: data.profileIcons.length,
    classic:
      data.champions.filter((c) => c.isSpecialMode).length +
      data.skins.filter((s) => s.isSpecialMode).length,
    loot: data.loot.length,
  };
}
