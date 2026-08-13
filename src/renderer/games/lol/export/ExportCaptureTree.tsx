import type { ReactNode } from 'react';
import type { AccountSummary, RankedSummary } from '../../../../shared/types/lol';
import { FixedGridDensityProvider } from '../../../core/GridDensityContext';
import { ChampionsSection } from '../ChampionsSection';
import { SkinsSection } from '../SkinsSection';
import { ChromasSection } from '../ChromasSection';
import { WardSkinsSection } from '../WardSkinsSection';
import { EmotesSection } from '../EmotesSection';
import { ProfileIconsSection } from '../ProfileIconsSection';
import { LootSection } from '../LootSection';
import { ExportTitleBand } from './ExportTitleBand';
import { ExportAccountDetailsCard } from './ExportAccountDetailsCard';
import { exportSectionLabel, type ExportSectionId } from './exportSections';
import { exportGridWidth, EXPORT_CARD_WIDTH } from './exportLayout';
import { computeCollectionCounts, type ReportData } from './reportData';

// One collection tab's worth of export content: title band + a wide,
// fixed-card-size grid whose width is derived from the item count (see
// exportLayout.ts) rather than the live view's responsive density.
function ExportSectionFrame({
  id,
  summary,
  itemCount,
  generatedAt,
  children,
}: {
  id: Exclude<ExportSectionId, 'accountDetails'>;
  summary: AccountSummary;
  itemCount: number;
  generatedAt: Date;
  children: ReactNode;
}) {
  return (
    <div
      data-export-section={id}
      data-export-label={exportSectionLabel(id)}
      style={{ width: exportGridWidth(itemCount) }}
    >
      <ExportTitleBand
        summonerName={summary.summonerName}
        region={summary.region}
        sectionLabel={exportSectionLabel(id)}
        itemCount={itemCount}
        generatedAt={generatedAt}
      />
      <div className="bg-neutral-900 p-6">
        <FixedGridDensityProvider minCardWidth={EXPORT_CARD_WIDTH}>{children}</FixedGridDensityProvider>
      </div>
    </div>
  );
}

/**
 * Always-mounted, off-screen render of every exportable section — see
 * ExportPanel, which keeps this hidden behind `position: fixed; left:
 * -99999px` continuously (not just during export) so per-card async image
 * fetches have usually already settled by the time a capture runs. Each
 * top-level child carries `data-export-section`/`data-export-label`, which
 * capture.ts uses to find, caption, and independently capture exactly the
 * section(s) a given export needs — the whole tree for "export everything",
 * or a single one for the active-tab quick export.
 */
export function ExportCaptureTree({
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
  const counts = computeCollectionCounts(data);

  return (
    <div className="flex flex-col gap-10">
      {/*
        self-start: the root is a column flex container, whose default
        align-items:stretch would otherwise stretch this section to match
        the widest sibling (a large Champions/Skins grid can be thousands of
        px wide — see exportLayout.ts) even though this card's own content
        is a fixed 900px. Every other section already opts out of stretch by
        having its own explicit width; this is the one section that has
        none, since its content isn't a width-computed grid.
      */}
      <div
        data-export-section="accountDetails"
        data-export-label={exportSectionLabel('accountDetails')}
        className="self-start"
      >
        <ExportTitleBand
          summonerName={summary.summonerName}
          region={summary.region}
          sectionLabel={exportSectionLabel('accountDetails')}
          generatedAt={generatedAt}
        />
        <ExportAccountDetailsCard summary={summary} ranked={ranked} counts={counts} />
      </div>

      <ExportSectionFrame
        id="champions"
        summary={summary}
        itemCount={data.champions.length}
        generatedAt={generatedAt}
      >
        <ChampionsSection champions={data.champions} searchQuery="" levelFilter="all" />
      </ExportSectionFrame>

      <ExportSectionFrame id="skins" summary={summary} itemCount={data.skins.length} generatedAt={generatedAt}>
        <SkinsSection skins={data.skins} searchQuery="" rarityFilter="all" legacyFilter="all" />
      </ExportSectionFrame>

      <ExportSectionFrame id="chromas" summary={summary} itemCount={counts.chromas} generatedAt={generatedAt}>
        <ChromasSection groups={data.chromas} searchQuery="" />
      </ExportSectionFrame>

      <ExportSectionFrame
        id="wardSkins"
        summary={summary}
        itemCount={data.wardSkins.length}
        generatedAt={generatedAt}
      >
        <WardSkinsSection wards={data.wardSkins} searchQuery="" />
      </ExportSectionFrame>

      <ExportSectionFrame id="emotes" summary={summary} itemCount={data.emotes.length} generatedAt={generatedAt}>
        <EmotesSection emotes={data.emotes} searchQuery="" />
      </ExportSectionFrame>

      <ExportSectionFrame
        id="profileIcons"
        summary={summary}
        itemCount={data.profileIcons.length}
        generatedAt={generatedAt}
      >
        <ProfileIconsSection icons={data.profileIcons} searchQuery="" />
      </ExportSectionFrame>

      <ExportSectionFrame id="loot" summary={summary} itemCount={data.loot.length} generatedAt={generatedAt}>
        <LootSection items={data.loot} searchQuery="" />
      </ExportSectionFrame>
    </div>
  );
}
