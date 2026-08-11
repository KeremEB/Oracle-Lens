import type { RankedQueueStatus } from '../../../shared/types/lol';
import { t } from '../../core/i18n';

export function RankedQueueBlock({ title, status }: { title: string; status: RankedQueueStatus }) {
  return (
    <div className="text-left">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-300">{title}</h2>

      {status.kind === 'unranked' && (
        <p className="mt-1 text-neutral-400">{t('ranked.unranked')}</p>
      )}

      {status.kind === 'provisional' && (
        <p className="mt-1 text-neutral-400">
          {t('ranked.provisional')}: {status.gamesPlayed}
        </p>
      )}

      {status.kind === 'ranked' && (
        <dl className="mt-1 grid grid-cols-[auto_auto] gap-x-6 gap-y-1">
          <dt className="text-neutral-400">{t('ranked.rank')}</dt>
          <dd>
            {status.tier} {status.division}
          </dd>

          <dt className="text-neutral-400">{t('ranked.leaguePoints')}</dt>
          <dd>{status.leaguePoints}</dd>

          <dt className="text-neutral-400">{t('ranked.wins')}</dt>
          <dd>{status.wins}</dd>

          <dt className="text-neutral-400">{t('ranked.losses')}</dt>
          <dd>{status.losses}</dd>

          <dt className="text-neutral-400">{t('ranked.winRate')}</dt>
          <dd>{status.winRate}%</dd>
        </dl>
      )}
    </div>
  );
}
