import type { RankedSummary } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { RankedQueueBlock } from './RankedQueueBlock';

export function RankedSummarySection({ ranked }: { ranked: RankedSummary }) {
  return (
    <div className="grid grid-cols-2 gap-x-10">
      <RankedQueueBlock title={t('queue.soloDuo')} status={ranked.soloDuo} />
      <RankedQueueBlock title={t('queue.flex')} status={ranked.flex} />
    </div>
  );
}
