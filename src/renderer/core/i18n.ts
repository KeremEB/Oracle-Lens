import en from '../../../locales/en.json';

type LocaleKey = keyof typeof en;

// English-only for now, per CLAUDE.md. Swap for a real i18n library only if/when
// a second language is actually needed.
export function t(key: LocaleKey): string {
  return en[key];
}
