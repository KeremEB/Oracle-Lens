import type { AccountSummary, RankedSummary } from '../../../../shared/types/lol';
import { t } from '../../../core/i18n';
import { ProfileIconBadge } from '../ProfileIconBadge';
import { RankedQueueBlock } from '../RankedQueueBlock';
import { StatTile } from './StatTile';
import type { CollectionCounts } from './reportData';

const CARD_WIDTH = 900;

function formatGeneratedDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// The shareable single-image mode: account identity, both ranked queues, and
// collection totals. Deliberately excludes item-level detail — that's what
// the full report is for.
export function ExportSummaryCard({
  summary,
  ranked,
  counts,
  generatedAt,
}: {
  summary: AccountSummary;
  ranked: RankedSummary;
  counts: CollectionCounts;
  generatedAt: Date;
}) {
  return (
    <div
      data-export-section="summary"
      data-export-label={t('export.modeSummary')}
      style={{ width: CARD_WIDTH }}
      className="flex flex-col gap-6 bg-neutral-900 p-8 text-neutral-100"
    >
      <div className="flex items-center justify-between border-b border-neutral-700 pb-4">
        <span className="text-xl font-semibold tracking-wide">Oracle Lens</span>
        <span className="text-xs text-neutral-500">
          {t('export.generatedOn')} {formatGeneratedDate(generatedAt)}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <ProfileIconBadge
          profileIconId={summary.profileIconId}
          accountLevel={summary.accountLevel}
          summonerName={summary.summonerName}
          size={64}
        />

        <div>
          <div className="text-2xl font-semibold">{summary.summonerName}</div>
          <div className="text-sm text-neutral-400">
            {t('accountSummary.accountLevel')} {summary.accountLevel} · {summary.region}
          </div>
          <div className="text-sm text-neutral-400">
            {t('accountSummary.honorLevel')} {summary.honorLevel}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-10 gap-y-4 border-t border-neutral-800 pt-4">
        <RankedQueueBlock title={t('queue.soloDuo')} status={ranked.soloDuo} />
        <RankedQueueBlock title={t('queue.flex')} status={ranked.flex} />
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-neutral-800 pt-4">
        <StatTile label={t('champions.title')} value={counts.champions} />
        <StatTile label={t('skins.title')} value={counts.skins} />
        <StatTile label={t('chromas.title')} value={counts.chromas} />
        <StatTile label={t('wardSkins.title')} value={counts.wardSkins} />
        <StatTile label={t('emotes.title')} value={counts.emotes} />
        <StatTile label={t('profileIcons.title')} value={counts.profileIcons} />
      </div>
    </div>
  );
}
