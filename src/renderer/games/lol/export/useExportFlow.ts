import { useEffect, useState, type RefObject } from 'react';
import type { AccountSummary, RankedSummary } from '../../../../shared/types/lol';
import type { LolTabId } from '../LolTabId';
import { captureReportSections } from './capture';
import { canvasToPngBytes } from './buildFile';
import { buildPngZip } from './buildPngZip';
import { buildTextReportPdf } from './buildTextReportPdf';
import { buildExportFileName } from './fileName';
import { ALL_EXPORT_SECTIONS, EXPORTABLE_TABS, exportSectionFileToken, type ExportSectionId } from './exportSections';
import type { ReportData } from './reportData';

export type ExportStage =
  | { kind: 'idle' }
  | { kind: 'preparing' }
  | { kind: 'capturing'; done: number; total: number; label: string }
  | { kind: 'building' }
  | { kind: 'saving' }
  | { kind: 'done'; filePath: string }
  | { kind: 'error'; message: string };

const DONE_MESSAGE_MS = 4000;

/**
 * Drives all three export actions. `captureRootRef` points at the always-
 * mounted, off-screen ExportCaptureTree (see ExportPanel) that the two PNG
 * modes pull canvases from; the text PDF mode never touches the DOM at all.
 * `generatedAt` is passed in (not computed here) so it matches exactly what
 * the capture tree's title bands already show — both come from the same
 * stable value in ExportPanel.
 */
export function useExportFlow(
  captureRootRef: RefObject<HTMLDivElement | null>,
  summary: AccountSummary,
  ranked: RankedSummary,
  data: ReportData,
  generatedAt: Date,
): {
  stage: ExportStage;
  isBusy: boolean;
  exportAllPng: () => void;
  exportTabPng: (tabId: LolTabId) => void;
  exportTextPdf: () => void;
} {
  const [stage, setStage] = useState<ExportStage>({ kind: 'idle' });

  useEffect(() => {
    if (stage.kind !== 'done') return;
    const timer = setTimeout(() => setStage({ kind: 'idle' }), DONE_MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  const savePng = async (bytes: Uint8Array, tabToken: string): Promise<void> => {
    setStage({ kind: 'saving' });
    const result = await window.oracleLens.core.saveExportFile({
      suggestedName: buildExportFileName(summary.summonerName, tabToken, generatedAt, 'png'),
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
      data: bytes,
    });
    setStage(result.canceled ? { kind: 'idle' } : { kind: 'done', filePath: result.filePath ?? '' });
  };

  const exportAllPng = (): void => {
    const container = captureRootRef.current;
    if (!container) return;

    void (async () => {
      try {
        setStage({ kind: 'preparing' });
        const sections = await captureReportSections(
          container,
          (done, total, label) => setStage({ kind: 'capturing', done, total, label }),
          ALL_EXPORT_SECTIONS,
        );

        setStage({ kind: 'building' });
        const zipBytes = await buildPngZip(sections, summary.summonerName, generatedAt);

        setStage({ kind: 'saving' });
        const result = await window.oracleLens.core.saveExportFile({
          suggestedName: buildExportFileName(summary.summonerName, 'All', generatedAt, 'zip'),
          filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
          data: zipBytes,
        });
        setStage(result.canceled ? { kind: 'idle' } : { kind: 'done', filePath: result.filePath ?? '' });
      } catch (err) {
        setStage({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    })();
  };

  const exportTabPng = (tabId: LolTabId): void => {
    const container = captureRootRef.current;
    if (!container || !EXPORTABLE_TABS.includes(tabId)) return;

    void (async () => {
      try {
        setStage({ kind: 'preparing' });
        const sections = await captureReportSections(
          container,
          (done, total, label) => setStage({ kind: 'capturing', done, total, label }),
          [tabId],
        );
        if (sections.length === 0) return;

        setStage({ kind: 'building' });
        const bytes = await canvasToPngBytes(sections[0].canvas);
        await savePng(bytes, exportSectionFileToken(tabId as ExportSectionId));
      } catch (err) {
        setStage({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    })();
  };

  const exportTextPdf = (): void => {
    void (async () => {
      try {
        // No DOM capture involved — jump straight to building real text/
        // table content, nothing to wait on images for.
        setStage({ kind: 'building' });
        const bytes = buildTextReportPdf(summary, ranked, data, generatedAt);

        setStage({ kind: 'saving' });
        const result = await window.oracleLens.core.saveExportFile({
          suggestedName: buildExportFileName(summary.summonerName, 'Report', generatedAt, 'pdf'),
          filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
          data: bytes,
        });
        setStage(result.canceled ? { kind: 'idle' } : { kind: 'done', filePath: result.filePath ?? '' });
      } catch (err) {
        setStage({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    })();
  };

  const isBusy = stage.kind !== 'idle' && stage.kind !== 'done' && stage.kind !== 'error';

  return { stage, isBusy, exportAllPng, exportTabPng, exportTextPdf };
}
