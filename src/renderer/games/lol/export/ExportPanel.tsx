import { useRef, useState } from 'react';
import type { AccountSummary, RankedSummary } from '../../../../shared/types/lol';
import type { LolTabId } from '../LolTabId';
import { t } from '../../../core/i18n';
import { useExportFlow } from './useExportFlow';
import { ExportCaptureTree } from './ExportCaptureTree';
import { EXPORTABLE_TABS, exportSectionLabel } from './exportSections';
import type { ReportData } from './reportData';

const actionButtonClass =
  'rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50';

export function ExportPanel({
  summary,
  ranked,
  data,
  activeTab,
}: {
  summary: AccountSummary;
  ranked: RankedSummary;
  data: ReportData;
  activeTab: LolTabId;
}) {
  const captureRootRef = useRef<HTMLDivElement>(null);
  // Fixed for the lifetime of this panel instance so the capture tree's
  // title bands and every filename produced in one sitting show the same
  // date, and never drift from each other on re-render.
  const [generatedAt] = useState(() => new Date());

  const { stage, isBusy, exportAllPng, exportTabPng, exportTextPdf } = useExportFlow(
    captureRootRef,
    summary,
    ranked,
    data,
    generatedAt,
  );

  const canExportActiveTab = (EXPORTABLE_TABS as readonly LolTabId[]).includes(activeTab);

  return (
    <div className="flex items-center gap-2">
      <button type="button" disabled={isBusy} onClick={exportAllPng} className={actionButtonClass}>
        {t('export.exportAllZip')}
      </button>

      {canExportActiveTab && (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => exportTabPng(activeTab)}
          className={actionButtonClass}
        >
          {t('export.exportTab')} {exportSectionLabel(activeTab)}
        </button>
      )}

      <button type="button" disabled={isBusy} onClick={exportTextPdf} className={actionButtonClass}>
        {t('export.exportTextReport')}
      </button>

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
        Off-screen, continuously mounted — see ExportCaptureTree's own doc
        comment for why this stays rendered outside of an export rather than
        only appearing while one is running.
      */}
      <div aria-hidden style={{ position: 'fixed', top: 0, left: -99999, pointerEvents: 'none' }}>
        <div ref={captureRootRef}>
          <ExportCaptureTree summary={summary} ranked={ranked} data={data} generatedAt={generatedAt} />
        </div>
      </div>
    </div>
  );
}
