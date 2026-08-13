import type {
  AccountSummary,
  ChampionMasteryEntry,
  LootItem,
  OwnedEmote,
  OwnedProfileIcon,
  OwnedSkin,
  OwnedWardSkin,
  RankedQueueStatus,
  RankedSummary,
  SkinChromaGroup,
} from '../../../../shared/types/lol';
import { t } from '../../../core/i18n';
import { rarityLabel } from '../rarity';
import { lootCategoryLabel } from '../lootCategory';

export interface PdfTable {
  /** Empty for a plain key/value table (no header row). */
  head: string[];
  body: string[][];
}

export function accountSummaryTable(summary: AccountSummary): PdfTable {
  const rows: string[][] = [
    [t('accountSummary.summonerName'), summary.summonerName],
    [t('accountSummary.accountLevel'), String(summary.accountLevel)],
    [t('accountSummary.region'), summary.region],
    [t('accountSummary.honorLevel'), String(summary.honorLevel)],
  ];
  if (summary.country) rows.push([t('accountSummary.country'), summary.country]);
  if (summary.createdSeasonId != null) {
    rows.push([t('accountSummary.season'), String(summary.createdSeasonId)]);
  }
  return { head: [], body: rows };
}

function rankedQueueRow(title: string, status: RankedQueueStatus): string[] {
  switch (status.kind) {
    case 'unranked':
      return [title, t('ranked.unranked'), '', '', '', ''];
    case 'provisional':
      return [title, `${t('ranked.provisional')} ${status.gamesPlayed}`, '', '', '', ''];
    case 'ranked':
      return [
        title,
        `${status.tier} ${status.division}`,
        String(status.leaguePoints),
        String(status.wins),
        String(status.losses),
        `${status.winRate}%`,
      ];
  }
}

export function rankedTable(ranked: RankedSummary): PdfTable {
  return {
    head: [
      t('export.colQueue'),
      t('ranked.rank'),
      t('ranked.leaguePoints'),
      t('ranked.wins'),
      t('ranked.losses'),
      t('ranked.winRate'),
    ],
    body: [rankedQueueRow(t('queue.soloDuo'), ranked.soloDuo), rankedQueueRow(t('queue.flex'), ranked.flex)],
  };
}

export function championsTable(champions: ChampionMasteryEntry[]): PdfTable {
  const sorted = [...champions].sort((a, b) => b.masteryPoints - a.masteryPoints);
  return {
    head: [t('export.colChampion'), t('export.colMasteryLevel'), t('export.colMasteryPoints')],
    body: sorted.map((c) => [
      c.championName,
      c.masteryLevel === 0 ? t('champions.unplayed') : String(c.masteryLevel),
      c.masteryPoints.toLocaleString('en-US'),
    ]),
  };
}

export function skinsTable(skins: OwnedSkin[]): PdfTable {
  return {
    head: [t('export.colSkin'), t('export.colChampion'), t('export.colRarity'), t('skins.legacyBadge')],
    body: skins.map((s) => [
      s.name,
      s.championName,
      rarityLabel(s.rarity),
      s.isLegacy ? t('skins.legacyBadge') : '',
    ]),
  };
}

export function chromasTable(groups: SkinChromaGroup[]): PdfTable {
  const rows: string[][] = [];
  for (const group of groups) {
    for (const chroma of group.chromas) {
      rows.push([group.skinName, chroma.name]);
    }
  }
  return { head: [t('export.colSkin'), t('export.colChroma')], body: rows };
}

export function wardSkinsTable(wards: OwnedWardSkin[]): PdfTable {
  return { head: [t('export.colWardSkin')], body: wards.map((w) => [w.name]) };
}

export function emotesTable(emotes: OwnedEmote[]): PdfTable {
  return { head: [t('export.colEmote')], body: emotes.map((e) => [e.name]) };
}

export function profileIconsTable(icons: OwnedProfileIcon[]): PdfTable {
  return { head: [t('export.colIconId')], body: icons.map((i) => [String(i.iconId)]) };
}

export function lootTable(items: LootItem[]): PdfTable {
  return {
    head: [
      t('export.colItem'),
      t('export.colCategory'),
      t('export.colCount'),
      t('loot.disenchantValue'),
      t('loot.unlockCost'),
    ],
    body: items.map((item) => [
      item.name,
      lootCategoryLabel(item.category),
      String(item.count),
      item.disenchantValue
        ? `${item.disenchantValue.amount.toLocaleString('en-US')} ${item.disenchantValue.label}`
        : '',
      item.unlockCost ? `${item.unlockCost.amount.toLocaleString('en-US')} ${item.unlockCost.label}` : '',
    ]),
  };
}
