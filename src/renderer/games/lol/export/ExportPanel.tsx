import { useRef, useState, type ReactNode } from 'react';
import type { AccountSummary, RankedSummary } from '../../../../shared/types/lol';
import type { LolTabId } from '../LolTabId';
import { t } from '../../../core/i18n';
import { useExportFlow, type ExportStage } from './useExportFlow';
import { ExportCaptureTree } from './ExportCaptureTree';
import { EXPORTABLE_TABS, exportSectionLabel } from './exportSections';
import { ArchiveIcon, DocumentTextIcon, ImageFileIcon } from './exportIcons';
import type { ReportData } from './reportData';

function stageMessage(stage: ExportStage): string {
  switch (stage.kind) {
    case 'idle':
      return '';
    case 'loadingImages':
      return `${t('export.loadingImages')} ${stage.label} (${stage.done}/${stage.total})`;
    case 'capturing':
      return `${t('export.capturing')} ${stage.label} (${stage.done}/${stage.total})`;
    case 'building':
      return t('export.building');
    case 'saving':
      return t('export.saving');
    case 'done':
      return stage.degraded ? `${t('export.done')} ${t('export.degradedNote')}` : t('export.done');
    case 'error':
      return `${t('export.error')}: ${stage.message}`;
  }
}

// Icon always shown; the text label collapses at the `sm` breakpoint so the
// three buttons plus the search box and any tab filters never force this row
// to wrap — see FiltersRow.tsx, which is the thing that actually can't wrap.
// `title` keeps the full description available as a tooltip regardless.
function ExportButton({
  icon,
  label,
  title,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex shrink-0 items-center gap-1.5 rounded border border-[var(--game-accent-dark)] bg-[var(--game-surface-elevated)] px-2.5 py-1.5 text-sm text-[var(--game-accent-soft)] transition-[border-color,box-shadow] duration-150 hover:border-[var(--game-accent)] hover:shadow-[0_0_8px_1px_var(--game-glow)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

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
  const activeTabLabel = canExportActiveTab ? exportSectionLabel(activeTab) : '';

  return (
    <div className="flex min-w-0 shrink-0 items-center gap-2">
      <ExportButton
        icon={<ArchiveIcon size={15} />}
        label={t('export.exportAllShort')}
        title={t('export.exportAllZip')}
        disabled={isBusy}
        onClick={exportAllPng}
      />

      {canExportActiveTab && (
        <ExportButton
          icon={<ImageFileIcon size={15} />}
          label={activeTabLabel}
          title={`${t('export.exportTab')} ${activeTabLabel}`}
          disabled={isBusy}
          onClick={() => exportTabPng(activeTab)}
        />
      )}

      <ExportButton
        icon={<DocumentTextIcon size={15} />}
        label={t('export.exportTextReportShort')}
        title={t('export.exportTextReport')}
        disabled={isBusy}
        onClick={exportTextPdf}
      />

      {/* title carries the full text for the 'done'+degraded case, which
          regularly overflows this box's width — every other message is
          short enough that truncation never actually triggers, so the
          tooltip is a no-op for them. */}
      {stage.kind !== 'idle' && (
        <p
          className="min-w-0 max-w-[16rem] shrink truncate text-xs"
          style={{ color: 'var(--game-accent-muted)' }}
          title={stageMessage(stage)}
        >
          {stageMessage(stage)}
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
