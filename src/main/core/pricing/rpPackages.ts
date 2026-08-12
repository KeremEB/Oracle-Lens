/**
 * RP package prices by region.
 *
 * Source: in-client store prices. Riot updates these periodically —
 * this file is the single place to change them.
 *
 * `amount` is the RP granted. `price` is the local currency cost.
 * Packages must stay sorted by `amount` ascending.
 *
 * Note: bigger is NOT always cheaper per RP. TR's 28225 and 49550 bundles,
 * MENA's 4500, OCE's 4500/6500 and BR's 6500 all cost more per RP than a
 * smaller package. Anything converting a total to money has to compare real
 * cost rather than assume the largest bundle wins — see the solver in
 * renderer/games/lol/rpConversion.ts.
 */

import type { RegionPricing } from '../../../shared/types/pricing';

/** Keyed by the platform/region ID reported by the client. */
export const RP_PRICING: Record<string, RegionPricing> = {
  NA: {
    label: 'North America',
    currency: 'USD',
    symbol: '$',
    symbolFirst: true,
    decimals: 2,
    packages: [
      { amount: 575, price: 4.99 },
      { amount: 1380, price: 10.99 },
      { amount: 2800, price: 21.99 },
      { amount: 4500, price: 34.99 },
      { amount: 6500, price: 49.99 },
      { amount: 13500, price: 99.99 },
    ],
  },

  EUW: {
    label: 'Europe West',
    currency: 'EUR',
    symbol: '€',
    symbolFirst: true,
    decimals: 2,
    packages: [
      { amount: 575, price: 4.99 },
      { amount: 1380, price: 10.99 },
      { amount: 2800, price: 21.99 },
      { amount: 4500, price: 34.99 },
      { amount: 6500, price: 49.99 },
      { amount: 13500, price: 99.99 },
    ],
  },

  EUNE: {
    label: 'Europe Nordic & East',
    currency: 'EUR',
    symbol: '€',
    symbolFirst: true,
    decimals: 2,
    packages: [
      { amount: 575, price: 4.99 },
      { amount: 1380, price: 10.99 },
      { amount: 2800, price: 21.99 },
      { amount: 4500, price: 34.99 },
      { amount: 6500, price: 49.99 },
      { amount: 13500, price: 99.99 },
    ],
  },

  TR: {
    label: 'Türkiye',
    currency: 'TRY',
    symbol: '₺',
    symbolFirst: false,
    decimals: 0,
    packages: [
      { amount: 575, price: 155 },
      { amount: 1380, price: 340 },
      { amount: 2800, price: 675 },
      { amount: 4500, price: 1075 },
      { amount: 6500, price: 1550 },
      { amount: 13500, price: 3100 },
      { amount: 28225, price: 7550 },
      { amount: 49550, price: 13500 },
    ],
  },

  EUNE_UK: {
    label: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    symbolFirst: true,
    decimals: 2,
    packages: [
      { amount: 575, price: 4.49 },
      { amount: 1380, price: 9.99 },
      { amount: 2800, price: 19.99 },
      { amount: 4500, price: 31.99 },
      { amount: 6500, price: 44.99 },
      { amount: 13500, price: 89.99 },
    ],
  },

  MENA: {
    label: 'Middle East & North Africa',
    currency: 'AED',
    symbol: 'AED',
    symbolFirst: false,
    decimals: 2,
    packages: [
      { amount: 575, price: 20.0 },
      { amount: 1380, price: 40.0 },
      { amount: 2800, price: 80.0 },
      { amount: 4500, price: 130.0 },
      { amount: 6500, price: 185.0 },
      { amount: 13500, price: 370.0 },
    ],
  },

  KR: {
    label: 'Korea',
    currency: 'KRW',
    symbol: '₩',
    symbolFirst: true,
    decimals: 0,
    packages: [
      { amount: 575, price: 6500 },
      { amount: 1380, price: 14300 },
      { amount: 2800, price: 28600 },
      { amount: 4500, price: 45500 },
      { amount: 6500, price: 65000 },
      { amount: 13500, price: 130000 },
    ],
  },

  JP: {
    label: 'Japan',
    currency: 'JPY',
    symbol: '¥',
    symbolFirst: true,
    decimals: 0,
    packages: [
      { amount: 575, price: 700 },
      { amount: 1380, price: 1540 },
      { amount: 2800, price: 3080 },
      { amount: 4500, price: 4900 },
      { amount: 6500, price: 7000 },
      { amount: 13500, price: 14000 },
    ],
  },

  OCE: {
    label: 'Oceania',
    currency: 'AUD',
    symbol: 'A$',
    symbolFirst: true,
    decimals: 2,
    packages: [
      { amount: 575, price: 7.99 },
      { amount: 1380, price: 16.99 },
      { amount: 2800, price: 33.99 },
      { amount: 4500, price: 54.99 },
      { amount: 6500, price: 79.99 },
      { amount: 13500, price: 159.99 },
    ],
  },

  BR: {
    label: 'Brazil',
    currency: 'BRL',
    symbol: 'R$',
    symbolFirst: true,
    decimals: 2,
    packages: [
      { amount: 575, price: 26.9 },
      { amount: 1380, price: 59.9 },
      { amount: 2800, price: 119.9 },
      { amount: 4500, price: 189.9 },
      { amount: 6500, price: 274.9 },
      { amount: 13500, price: 549.9 },
    ],
  },
};

/** Used when the client reports a region we have no pricing table for. */
export const FALLBACK_REGION = 'NA';
