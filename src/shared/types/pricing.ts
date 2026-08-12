// RP package pricing types. The table itself lives in main
// (core/pricing/rpPackages.ts); these types are here because the renderer
// consumes the table over IPC and both processes must agree on its shape.

export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'TRY'
  | 'AED'
  | 'KRW'
  | 'JPY'
  | 'AUD'
  | 'BRL';

export interface RpPackage {
  amount: number;
  price: number;
}

export interface RegionPricing {
  /** Display name for the UI. */
  label: string;
  currency: CurrencyCode;
  /** Currency symbol or short code for display. */
  symbol: string;
  /** Whether the symbol goes before the number. */
  symbolFirst: boolean;
  /** Decimal places to render. Zero-decimal currencies use 0. */
  decimals: number;
  packages: RpPackage[];
}

/** What the renderer receives: the whole table plus the fallback key. */
export interface RpPricingTable {
  regions: Record<string, RegionPricing>;
  fallbackRegion: string;
}
