import type { OwnedSkin } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { availabilityLabel } from './availability';
import { computeRpValue, UNPRICED_AVAILABILITIES } from './valueScore';

function formatRp(rp: number): string {
  return rp.toLocaleString('en-US');
}

export function ValueScoreCard({ skins }: { skins: OwnedSkin[] }) {
  const breakdown = computeRpValue(skins);

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
      </dl>

      <span className="mt-1 max-w-md text-[11px] text-neutral-500">
        {t('valueScore.disclaimer')}
      </span>
    </div>
  );
}
