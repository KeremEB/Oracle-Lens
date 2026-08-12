import type { AccountSummary } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { ProfileIconBadge } from './ProfileIconBadge';

export function AccountSummaryCard({ summary }: { summary: AccountSummary }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <ProfileIconBadge
        profileIconId={summary.profileIconId}
        accountLevel={summary.accountLevel}
        summonerName={summary.summonerName}
        size={64}
      />

      <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-left">
        <dt className="text-neutral-400">{t('accountSummary.summonerName')}</dt>
        <dd>{summary.summonerName}</dd>

        <dt className="text-neutral-400">{t('accountSummary.accountLevel')}</dt>
        <dd>{summary.accountLevel}</dd>

        <dt className="text-neutral-400">{t('accountSummary.region')}</dt>
        <dd>{summary.region}</dd>

        <dt className="text-neutral-400">{t('accountSummary.honorLevel')}</dt>
        <dd>{summary.honorLevel}</dd>
      </dl>
    </div>
  );
}
