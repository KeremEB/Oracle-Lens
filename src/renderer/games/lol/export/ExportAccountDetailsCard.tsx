import type { AccountSummary, RankedSummary } from '../../../../shared/types/lol';
import { t } from '../../../core/i18n';
import { AccountSummaryCard } from '../AccountSummaryCard';
import { RankedSummarySection } from '../RankedSummarySection';
import { StatTile } from './StatTile';
import type { CollectionCounts } from './reportData';

const CARD_WIDTH = 900;

// Identity, both ranked queues, and collection totals — branding/date now
// live in ExportTitleBand above this, so this card is just the content.
export function ExportAccountDetailsCard({
  summary,
  ranked,
  counts,
}: {
  summary: AccountSummary;
  ranked: RankedSummary;
  counts: CollectionCounts;
}) {
  return (
    <div style={{ width: CARD_WIDTH }} className="flex flex-col gap-6 bg-neutral-900 p-8 text-neutral-100">
      <AccountSummaryCard summary={summary} />

      <div className="border-t border-neutral-800 pt-4">
        <RankedSummarySection ranked={ranked} />
      </div>

      <div className="grid grid-cols-4 gap-3 border-t border-neutral-800 pt-4">
        <StatTile label={t('champions.title')} value={counts.champions} />
        <StatTile label={t('skins.title')} value={counts.skins} />
        <StatTile label={t('chromas.title')} value={counts.chromas} />
        <StatTile label={t('wardSkins.title')} value={counts.wardSkins} />
        <StatTile label={t('emotes.title')} value={counts.emotes} />
        <StatTile label={t('profileIcons.title')} value={counts.profileIcons} />
        <StatTile label={t('loot.title')} value={counts.loot} />
      </div>
    </div>
  );
}
