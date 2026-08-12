import type { ReactNode } from 'react';
import type { AccountSummary, RankedSummary, Wallet } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { ProfileIconBadge } from './ProfileIconBadge';
import { RankBadge } from './RankBadge';

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

// Horizontal, three-block header: identity | both ranked queues | account
// meta. Ranked and wallet arrive from separate fetches and can lag behind
// the summary by a tick — each block simply doesn't render until its own
// data is in, rather than reserving space for it. Meta fields that the LCU
// didn't provide (country, creation season) are omitted outright, never
// shown as an empty box.
export function AccountHeader({
  summary,
  ranked,
  wallet,
  actions,
}: {
  summary: AccountSummary;
  ranked: RankedSummary | null;
  wallet: Wallet | null;
  actions?: ReactNode;
}) {
  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-8 gap-y-3 border-b border-neutral-800 bg-neutral-900 px-6 py-3">
      <div className="flex items-center gap-3">
        <ProfileIconBadge
          profileIconId={summary.profileIconId}
          accountLevel={summary.accountLevel}
          summonerName={summary.summonerName}
          size={48}
        />
        <div>
          <div className="text-base font-semibold leading-tight">{summary.summonerName}</div>
          <div className="text-sm text-neutral-400">
            {t('accountSummary.accountLevel')} {summary.accountLevel}
          </div>
        </div>
      </div>

      {ranked && (
        <div className="flex items-center gap-6 border-l border-neutral-800 pl-8">
          <RankBadge title={t('queue.soloDuo')} status={ranked.soloDuo} />
          <RankBadge title={t('queue.flex')} status={ranked.flex} />
        </div>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-neutral-400">
        {wallet && (
          <>
            <span>
              {formatNumber(wallet.riotPoints)} {t('accountSummary.riotPoints')}
            </span>
            <span>
              {formatNumber(wallet.blueEssence)} {t('accountSummary.blueEssence')}
            </span>
          </>
        )}
        <span>{summary.region}</span>
        <span>
          {t('accountSummary.honorLevel')} {summary.honorLevel}
        </span>
        {summary.country && <span>{summary.country}</span>}
        {summary.createdSeasonId != null && (
          <span>
            {t('accountSummary.season')} {summary.createdSeasonId}
          </span>
        )}
      </div>

      {actions}
    </header>
  );
}
