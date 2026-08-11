import type { AccountSummary } from '../../../shared/types/lol';
import { t } from '../../core/i18n';

export function AccountSummaryCard({ summary }: { summary: AccountSummary }) {
  return (
    <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-left">
      <dt className="text-neutral-400">{t('accountSummary.summonerName')}</dt>
      <dd>{summary.summonerName}</dd>

      <dt className="text-neutral-400">{t('accountSummary.accountLevel')}</dt>
      <dd>{summary.accountLevel}</dd>

      <dt className="text-neutral-400">{t('accountSummary.region')}</dt>
      <dd>{summary.region}</dd>

      <dt className="text-neutral-400">{t('accountSummary.profileIconId')}</dt>
      <dd>{summary.profileIconId}</dd>

      <dt className="text-neutral-400">{t('accountSummary.honorLevel')}</dt>
      <dd>{summary.honorLevel}</dd>

      <dt className="text-neutral-400">{t('accountSummary.honorCheckpoint')}</dt>
      <dd>{summary.honorCheckpoint}</dd>
    </dl>
  );
}
