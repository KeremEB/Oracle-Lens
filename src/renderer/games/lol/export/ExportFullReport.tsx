import type { AccountSummary, RankedSummary } from '../../../../shared/types/lol';
import { t } from '../../../core/i18n';
import { FixedGridDensityProvider } from '../../../core/GridDensityContext';
import { AccountSummaryCard } from '../AccountSummaryCard';
import { RankedSummarySection } from '../RankedSummarySection';
import { ChampionsSection } from '../ChampionsSection';
import { SkinsSection } from '../SkinsSection';
import { ChromasSection } from '../ChromasSection';
import { WardSkinsSection } from '../WardSkinsSection';
import { EmotesSection } from '../EmotesSection';
import { ProfileIconsSection } from '../ProfileIconsSection';
import type { ReportData } from './reportData';

const REPORT_WIDTH = 1200;
// Legible on a printed page without being so small that a big collection
// balloons into an unreasonable number of pages.
const EXPORT_CARD_WIDTH = 140;

function formatGeneratedDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-300">
      {children}
    </h2>
  );
}

/**
 * Every tab's full, unfiltered content stacked vertically for capture.
 * Each top-level section carries `data-export-section`/`data-export-label`
 * so the capture step can find, caption, and page-break on them without any
 * ref plumbing — see export/capture.ts.
 */
export function ExportFullReport({
  summary,
  ranked,
  data,
  generatedAt,
}: {
  summary: AccountSummary;
  ranked: RankedSummary;
  data: ReportData;
  generatedAt: Date;
}) {
  return (
    <div
      style={{ width: REPORT_WIDTH }}
      className="flex flex-col gap-10 bg-neutral-900 p-8 text-neutral-100"
    >
      <div data-export-section="summary" data-export-label={t('accountSummary.summonerName')}>
        <div className="mb-6 flex items-center justify-between border-b border-neutral-700 pb-4">
          <span className="text-2xl font-semibold tracking-wide">Oracle Lens</span>
          <span className="text-xs text-neutral-500">
            {t('export.generatedOn')} {formatGeneratedDate(generatedAt)}
          </span>
        </div>
        <div className="flex flex-col gap-6">
          <AccountSummaryCard summary={summary} />
          <RankedSummarySection ranked={ranked} />
        </div>
      </div>

      <div data-export-section="champions" data-export-label={t('champions.title')}>
        <FixedGridDensityProvider minCardWidth={EXPORT_CARD_WIDTH}>
          <ChampionsSection champions={data.champions} searchQuery="" hideFilters />
        </FixedGridDensityProvider>
      </div>

      <div data-export-section="skins" data-export-label={t('skins.title')}>
        <FixedGridDensityProvider minCardWidth={EXPORT_CARD_WIDTH}>
          <SkinsSection skins={data.skins} searchQuery="" hideFilters />
        </FixedGridDensityProvider>
      </div>

      <div data-export-section="chromas" data-export-label={t('chromas.title')}>
        <SectionHeading>{t('chromas.title')}</SectionHeading>
        <ChromasSection groups={data.chromas} searchQuery="" />
      </div>

      <div data-export-section="wardSkins" data-export-label={t('wardSkins.title')}>
        <SectionHeading>{t('wardSkins.title')}</SectionHeading>
        <WardSkinsSection wards={data.wardSkins} searchQuery="" />
      </div>

      <div data-export-section="emotes" data-export-label={t('emotes.title')}>
        <SectionHeading>{t('emotes.title')}</SectionHeading>
        <EmotesSection emotes={data.emotes} searchQuery="" />
      </div>

      <div data-export-section="profileIcons" data-export-label={t('profileIcons.title')}>
        <SectionHeading>{t('profileIcons.title')}</SectionHeading>
        <ProfileIconsSection icons={data.profileIcons} searchQuery="" />
      </div>
    </div>
  );
}
