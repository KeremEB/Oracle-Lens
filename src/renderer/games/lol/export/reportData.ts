import type {
  ChampionMasteryEntry,
  OwnedEmote,
  OwnedProfileIcon,
  OwnedSkin,
  OwnedWardSkin,
  SkinChromaGroup,
} from '../../../../shared/types/lol';

export interface CollectionCounts {
  champions: number;
  skins: number;
  chromas: number;
  wardSkins: number;
  emotes: number;
  profileIcons: number;
}

export interface ReportData {
  champions: ChampionMasteryEntry[];
  skins: OwnedSkin[];
  chromas: SkinChromaGroup[];
  wardSkins: OwnedWardSkin[];
  emotes: OwnedEmote[];
  profileIcons: OwnedProfileIcon[];
}

export function computeCollectionCounts(data: ReportData): CollectionCounts {
  return {
    champions: data.champions.length,
    skins: data.skins.length,
    // Chromas arrive grouped under their skin — the count that matters here
    // is individual chromas owned, not how many skins have any.
    chromas: data.chromas.reduce((sum, group) => sum + group.chromas.length, 0),
    wardSkins: data.wardSkins.length,
    emotes: data.emotes.length,
    profileIcons: data.profileIcons.length,
  };
}
