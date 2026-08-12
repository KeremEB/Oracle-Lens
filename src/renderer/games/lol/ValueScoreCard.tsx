import type { AccountSummary, OwnedSkin, RankedSummary } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { computeValueScore } from './valueScore';

export function ValueScoreCard({
  summary,
  ranked,
  skins,
}: {
  summary: AccountSummary;
  ranked: RankedSummary;
  skins: OwnedSkin[];
}) {
  const breakdown = computeValueScore(summary, ranked, skins);

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-xs uppercase tracking-wide text-neutral-500">
        {t('valueScore.label')}
      </span>
      <span className="text-2xl font-semibold">{breakdown.estimatedScore}</span>
      <span className="text-[11px] text-neutral-500">{t('valueScore.disclaimer')}</span>

      <dl className="mt-2 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-left text-xs text-neutral-400">
        <dt>{t('valueScore.skins')}</dt>
        <dd>
          {breakdown.skinCount} ({breakdown.skinPoints} pts)
        </dd>

        <dt>{t('valueScore.rank')}</dt>
        <dd>
          {breakdown.bestRankTier ?? t('ranked.unranked')} ({breakdown.rankPoints} pts)
        </dd>

        <dt>{t('valueScore.region')}</dt>
        <dd>
          {breakdown.region} (×{breakdown.regionMultiplier.toFixed(2)})
        </dd>
      </dl>
    </div>
  );
}
