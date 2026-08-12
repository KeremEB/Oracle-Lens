import { ALPHA3_TO_ALPHA2 } from './alpha3ToAlpha2';

const REGIONAL_INDICATOR_BASE = 0x1f1e6; // 🇦
const LETTER_A_CODE = 'A'.charCodeAt(0);

/** Emoji flag for an ISO 3166-1 alpha-3 code (e.g. "TUR" -> 🇹🇷), or null if unknown. */
export function countryFlagEmoji(alpha3: string): string | null {
  const alpha2 = ALPHA3_TO_ALPHA2[alpha3.toUpperCase()];
  if (!alpha2) return null;

  return [...alpha2.toUpperCase()]
    .map((letter) => String.fromCodePoint(REGIONAL_INDICATOR_BASE + letter.charCodeAt(0) - LETTER_A_CODE))
    .join('');
}
