import type { LolTabId } from '../LolTabId';
import { t } from '../../../core/i18n';

export type ExportSectionId = LolTabId | 'accountDetails';

/** Real, exportable content tabs — excludes 'history', which is navigation metadata, not account data. */
export const EXPORTABLE_TABS: readonly LolTabId[] = [
  'champions',
  'skins',
  'chromas',
  'wardSkins',
  'emotes',
  'profileIcons',
  'classic',
  'loot',
];

/** Every section produced by the "export everything" flow: account details first, then each real tab. */
export const ALL_EXPORT_SECTIONS: readonly ExportSectionId[] = ['accountDetails', ...EXPORTABLE_TABS];

export function exportSectionLabel(id: ExportSectionId): string {
  switch (id) {
    case 'accountDetails':
      return t('export.accountDetails');
    case 'champions':
      return t('champions.title');
    case 'skins':
      return t('skins.title');
    case 'chromas':
      return t('chromas.title');
    case 'wardSkins':
      return t('wardSkins.title');
    case 'emotes':
      return t('emotes.title');
    case 'profileIcons':
      return t('profileIcons.title');
    case 'classic':
      return t('classic.title');
    case 'loot':
      return t('loot.title');
    case 'history':
      return t('history.title');
  }
}

// Filename-safe segment (PascalCase, no spaces/punctuation) — kept distinct
// from the display label, which can contain spaces/ampersands.
export function exportSectionFileToken(id: ExportSectionId): string {
  switch (id) {
    case 'accountDetails':
      return 'AccountDetails';
    case 'champions':
      return 'Champions';
    case 'skins':
      return 'Skins';
    case 'chromas':
      return 'Chromas';
    case 'wardSkins':
      return 'WardSkins';
    case 'emotes':
      return 'Emotes';
    case 'profileIcons':
      return 'ProfileIcons';
    case 'classic':
      return 'Classic';
    case 'loot':
      return 'Loot';
    case 'history':
      return 'History';
  }
}
