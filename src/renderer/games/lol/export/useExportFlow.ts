import { useEffect, useState, type RefObject } from 'react';
import type { AccountSummary, RankedSummary } from '../../../../shared/types/lol';
import type { LolTabId } from '../LolTabId';
import { captureReportSections } from './capture';
import { buildPngZip } from './buildPngZip';
import { buildTextReportPdf } from './buildTextReportPdf';
import { buildExportFileName } from './fileName';
import { prewarmCardImageCaches } from './prewarmImages';
import { ALL_EXPORT_SECTIONS, EXPORTABLE_TABS, exportSectionFileToken, type ExportSectionId } from './exportSections';
import type { ReportData } from './reportData';

export type ExportStage =
  | { kind: 'idle' }
  | { kind: 'loadingImages'; done: number; total: number; label: string }
  | { kind: 'capturing'; done: number; total: number; label: string }
  | { kind: 'building' }
  | { kind: 'saving' }
  | { kind: 'done'; filePath: string; degraded: boolean }
  | { kind: 'error'; message: string };

const DONE_MESSAGE_MS = 4000;
// Longer than the plain "Saved." case — the degraded note is more text and
// worth actually giving the user time to read.
const DEGRADED_DONE_MESSAGE_MS = 8000;

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
    const ms = stage.degraded ? DEGRADED_DONE_MESSAGE_MS : DONE_MESSAGE_MS;
    const timer = setTimeout(() => setStage({ kind: 'idle' }), ms);
    return () => clearTimeout(timer);
  }, [stage]);

  const savePng = async (bytes: Uint8Array, tabToken: string, degraded: boolean): Promise<void> => {
    setStage({ kind: 'saving' });
    const result = await window.oracleLens.core.saveExportFile({
      suggestedName: buildExportFileName(summary.summonerName, tabToken, generatedAt, 'png'),
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
      data: bytes,
    });
    setStage(result.canceled ? { kind: 'idle' } : { kind: 'done', filePath: result.filePath ?? '', degraded });
  };

  const exportAllPng = (): void => {
    const container = captureRootRef.current;
    if (!container) return;

    void (async () => {
      try {
        await prewarmCardImageCaches(data.champions, data.skins);
        const sections = await captureReportSections(
          container,
          (done, total, label) => setStage({ kind: 'capturing', done, total, label }),
          ALL_EXPORT_SECTIONS,
          (done, total, label) => setStage({ kind: 'loadingImages', done, total, label }),
        );

        setStage({ kind: 'building' });
        const zipBytes = await buildPngZip(sections, summary.summonerName, generatedAt);
        const anyDegraded = sections.some((section) => section.degraded);

        setStage({ kind: 'saving' });
        const result = await window.oracleLens.core.saveExportFile({
          suggestedName: buildExportFileName(summary.summonerName, 'All', generatedAt, 'zip'),
          filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
          data: zipBytes,
        });
        setStage(
          result.canceled
            ? { kind: 'idle' }
            : { kind: 'done', filePath: result.filePath ?? '', degraded: anyDegraded },
        );
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
        await prewarmCardImageCaches(data.champions, data.skins);
        const sections = await captureReportSections(
          container,
          (done, total, label) => setStage({ kind: 'capturing', done, total, label }),
          [tabId],
          (done, total, label) => setStage({ kind: 'loadingImages', done, total, label }),
        );
        if (sections.length === 0) return;

        setStage({ kind: 'building' });
        await savePng(sections[0].pngBytes, exportSectionFileToken(tabId as ExportSectionId), sections[0].degraded);
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
        // Text PDF never touches canvas/capture, so degradation doesn't apply here.
        setStage(
          result.canceled ? { kind: 'idle' } : { kind: 'done', filePath: result.filePath ?? '', degraded: false },
        );
      } catch (err) {
        setStage({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    })();
  };

  const isBusy = stage.kind !== 'idle' && stage.kind !== 'done' && stage.kind !== 'error';

  return { stage, isBusy, exportAllPng, exportTabPng, exportTextPdf };
}
