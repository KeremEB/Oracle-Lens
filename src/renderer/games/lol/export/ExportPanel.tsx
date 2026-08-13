import { useState } from 'react';
import type {
  AccountSummary,
  ChampionMasteryEntry,
  OwnedEmote,
  OwnedProfileIcon,
  OwnedSkin,
  OwnedWardSkin,
  RankedSummary,
  SkinChromaGroup,
} from '../../../../shared/types/lol';
import { t } from '../../../core/i18n';
import { ExportSummaryCard } from './ExportSummaryCard';
import { ExportFullReport } from './ExportFullReport';
import { computeCollectionCounts, type ReportData } from './reportData';
import { useReportExport } from './useReportExport';

const modeButtonClass = (active: boolean): string =>
  active
    ? 'bg-neutral-100 text-neutral-900 px-3 py-1.5 text-sm font-medium rounded'
    : 'text-neutral-400 hover:text-neutral-200 px-3 py-1.5 text-sm font-medium rounded';

const actionButtonClass =
  'rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50';

export function ExportPanel({
  summary,
  ranked,
  champions,
  skins,
  chromas,
  wardSkins,
  emotes,
  profileIcons,
}: {
  summary: AccountSummary;
  ranked: RankedSummary;
  champions: ChampionMasteryEntry[];
  skins: OwnedSkin[];
  chromas: SkinChromaGroup[];
  wardSkins: OwnedWardSkin[];
  emotes: OwnedEmote[];
  profileIcons: OwnedProfileIcon[];
}) {
  const data: ReportData = { champions, skins, chromas, wardSkins, emotes, profileIcons };
  const counts = computeCollectionCounts(data);
  // Fixed for the lifetime of this panel instance so PNG/PDF exports of the
  // same session always print the same "generated on" date.
  const [generatedAt] = useState(() => new Date());

  const { mode, setMode, stage, summaryRef, fullReportRef, exportAs, isBusy } =
    useReportExport(summary.summonerName);

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex items-center gap-3">
        <div className="flex rounded border border-neutral-700 bg-neutral-900 p-0.5">
          <button
            type="button"
            onClick={() => setMode('summary')}
            className={modeButtonClass(mode === 'summary')}
          >
            {t('export.modeSummary')}
          </button>
          <button
            type="button"
            onClick={() => setMode('full')}
            className={modeButtonClass(mode === 'full')}
          >
            {t('export.modeFull')}
          </button>
        </div>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => exportAs('png')}
          className={actionButtonClass}
        >
          {t('export.exportPng')}
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => exportAs('pdf')}
          className={actionButtonClass}
        >
          {t('export.exportPdf')}
        </button>
      </div>

      {stage.kind !== 'idle' && (
        <p className="text-xs text-neutral-400">
          {stage.kind === 'preparing' && t('export.preparing')}
          {stage.kind === 'capturing' &&
            `${t('export.capturing')} ${stage.label} (${stage.done}/${stage.total})`}
          {stage.kind === 'building' && t('export.building')}
          {stage.kind === 'saving' && t('export.saving')}
          {stage.kind === 'done' && t('export.done')}
          {stage.kind === 'error' && `${t('export.error')}: ${stage.message}`}
        </p>
      )}

      {/*
        Off-screen render targets for html2canvas. Kept mounted continuously
        (not just during export) so by the time the user clicks a button, the
        per-card async image fetches (rarity gems, mastery crests, profile
        icon, level border) have usually already settled in the background —
        capture just has to confirm it rather than wait from a cold start.
        `position: fixed` off the visible viewport, not display:none/
        visibility:hidden — html2canvas needs the element actually laid out
        and painted to capture it. No scrollbars, buttons, or filters ever
        appear here: hideFilters suppresses the interactive controls, and
        this subtree is never placed inside a scrolling container.
      */}
      <div
        aria-hidden
        style={{ position: 'fixed', top: 0, left: -99999, pointerEvents: 'none' }}
      >
        <div ref={summaryRef}>
          <ExportSummaryCard
            summary={summary}
            ranked={ranked}
            counts={counts}
            generatedAt={generatedAt}
          />
        </div>
        <div ref={fullReportRef}>
          <ExportFullReport summary={summary} ranked={ranked} data={data} generatedAt={generatedAt} />
        </div>
      </div>
    </div>
  );
}
