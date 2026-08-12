import { useEffect, useMemo, useState } from 'react';
import type { AccountSummary, OwnedSkin } from '../../../shared/types/lol';
import type { RpPricingTable } from '../../../shared/types/pricing';
import { t } from '../../core/i18n';
import { availabilityLabel } from './availability';
import { computeRpValue, UNPRICED_AVAILABILITIES } from './valueScore';
import {
  convertAcrossRegions,
  convertRp,
  formatCurrency,
  resolveRegion,
} from './rpConversion';

function formatRp(rp: number): string {
  return rp.toLocaleString('en-US');
}

export function ValueScoreCard({
  skins,
  summary,
}: {
  skins: OwnedSkin[];
  summary: AccountSummary;
}) {
  const [pricing, setPricing] = useState<RpPricingTable | null>(null);

  useEffect(() => {
    let cancelled = false;
    window.oracleLens.core
      .getRpPricing()
      .then((table) => {
        if (!cancelled) setPricing(table);
      })
      .catch(() => {
        // Money conversion is an extra on top of the RP figure — losing it
        // shouldn't blank the card.
        if (!cancelled) setPricing(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const breakdown = useMemo(() => computeRpValue(skins), [skins]);

  const money = useMemo(() => {
    if (!pricing || breakdown.exactRp <= 0) return null;

    const { key, pricing: regionPricing, isFallback } = resolveRegion(summary.region, pricing);
    return {
      isFallback,
      local: convertRp(breakdown.exactRp, key, regionPricing),
      others: convertAcrossRegions(breakdown.exactRp, pricing, key),
    };
  }, [pricing, breakdown.exactRp, summary.region]);

  const neverSold = UNPRICED_AVAILABILITIES.map((availability) => ({
    availability,
    count: breakdown.countsByAvailability[availability],
  })).filter((entry) => entry.count > 0);

  return (
    <div className="flex w-full flex-col items-center gap-1 text-center">
      <span className="text-xs uppercase tracking-wide text-neutral-500">
        {t('valueScore.label')}
      </span>
      <span className="text-2xl font-semibold">
        {formatRp(breakdown.exactRp)} {t('valueScore.rp')}
      </span>

      {money && (
        <span className="text-lg font-medium text-neutral-300">
          ≈ {formatCurrency(money.local.cost, money.local.pricing)}
          <span className="ml-1 text-xs text-neutral-500">
            {money.isFallback
              ? `(${money.local.pricing.label} — ${t('valueScore.regionFallback')})`
              : `(${money.local.pricing.label})`}
          </span>
        </span>
      )}

      <dl className="mt-2 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-left text-xs text-neutral-400">
        <dt>{t('valueScore.exact')}</dt>
        <dd>
          {formatRp(breakdown.exactRp)} {t('valueScore.rp')} · {breakdown.exactCount}{' '}
          {t('valueScore.skinsSuffix')}
        </dd>

        {breakdown.estimatedCount > 0 && (
          <>
            <dt>{t('valueScore.estimated')}</dt>
            <dd>
              ~{formatRp(breakdown.estimatedRp)} {t('valueScore.rp')} · {breakdown.estimatedCount}{' '}
              {t('valueScore.skinsSuffix')}
            </dd>
          </>
        )}

        {breakdown.unpricedCount > 0 && (
          <>
            <dt>{t('valueScore.unpriced')}</dt>
            <dd>
              {breakdown.unpricedCount} {t('valueScore.skinsSuffix')}
            </dd>
          </>
        )}

        {breakdown.specialModeCount > 0 && (
          <>
            <dt>{t('valueScore.specialMode')}</dt>
            <dd>
              {breakdown.specialModeCount} {t('valueScore.skinsSuffix')}
            </dd>
          </>
        )}

        {neverSold.length > 0 && (
          <>
            <dt>{t('valueScore.neverSold')}</dt>
            <dd>
              {neverSold
                .map((entry) => `${entry.count} ${availabilityLabel(entry.availability)}`)
                .join(' · ')}
            </dd>
          </>
        )}

        {money && (
          <>
            <dt>{t('valueScore.packages')}</dt>
            <dd>
              {money.local.lines
                .map((line) => `${line.quantity} × ${formatRp(line.package.amount)}`)
                .join(' + ')}{' '}
              = {formatRp(money.local.rpPurchased)} {t('valueScore.rp')}
            </dd>
          </>
        )}
      </dl>

      {money && money.others.length > 0 && (
        <div className="mt-3 w-full max-w-md">
          <span className="text-[11px] uppercase tracking-wide text-neutral-500">
            {t('valueScore.otherRegions')}
          </span>
          <table className="mt-1 w-full text-xs text-neutral-400">
            <tbody>
              {money.others.map((entry) => (
                <tr key={entry.regionKey} className="border-t border-neutral-800">
                  <td className="py-0.5 text-left">{entry.pricing.label}</td>
                  <td className="py-0.5 text-right tabular-nums">
                    {formatCurrency(entry.cost, entry.pricing)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <span className="mt-2 max-w-md text-[11px] text-neutral-500">
        {t('valueScore.disclaimer')}
      </span>
      {money && (
        <span className="max-w-md text-[11px] text-neutral-500">
          {t('valueScore.priceDisclaimer')}
        </span>
      )}
    </div>
  );
}
