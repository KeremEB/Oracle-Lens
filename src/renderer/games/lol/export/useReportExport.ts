import { useEffect, useRef, useState } from 'react';
import { captureReportSections } from './capture';
import { buildPdf, buildPng } from './buildFile';
import { buildExportFileName } from './fileName';

export type ExportMode = 'summary' | 'full';
export type ExportFormat = 'png' | 'pdf';

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
 * Drives the whole export flow: capture the currently-selected mode's
 * off-screen render (see ExportPanel's hidden containers), assemble PNG or
 * PDF bytes, then hand off to main for the native save dialog + disk write.
 * `stage` is a small state machine so the UI can show real progress instead
 * of a spinner-shaped lie.
 */
export function useReportExport(summonerName: string): {
  mode: ExportMode;
  setMode: (mode: ExportMode) => void;
  stage: ExportStage;
  summaryRef: React.RefObject<HTMLDivElement | null>;
  fullReportRef: React.RefObject<HTMLDivElement | null>;
  exportAs: (format: ExportFormat) => void;
  isBusy: boolean;
} {
  const [mode, setMode] = useState<ExportMode>('summary');
  const [stage, setStage] = useState<ExportStage>({ kind: 'idle' });
  const summaryRef = useRef<HTMLDivElement>(null);
  const fullReportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stage.kind !== 'done') return;
    const timer = setTimeout(() => setStage({ kind: 'idle' }), DONE_MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  const exportAs = (format: ExportFormat): void => {
    const container = mode === 'summary' ? summaryRef.current : fullReportRef.current;
    if (!container) return;

    void (async () => {
      try {
        setStage({ kind: 'preparing' });
        const sections = await captureReportSections(container, (done, total, label) =>
          setStage({ kind: 'capturing', done, total, label }),
        );

        setStage({ kind: 'building' });
        const bytes = format === 'png' ? await buildPng(sections) : buildPdf(sections);

        setStage({ kind: 'saving' });
        const result = await window.oracleLens.core.saveExportFile({
          suggestedName: buildExportFileName(summonerName, format),
          filters:
            format === 'png'
              ? [{ name: 'PNG Image', extensions: ['png'] }]
              : [{ name: 'PDF Document', extensions: ['pdf'] }],
          data: bytes,
        });

        setStage(result.canceled ? { kind: 'idle' } : { kind: 'done', filePath: result.filePath ?? '' });
      } catch (err) {
        setStage({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    })();
  };

  const isBusy = stage.kind !== 'idle' && stage.kind !== 'done' && stage.kind !== 'error';

  return { mode, setMode, stage, summaryRef, fullReportRef, exportAs, isBusy };
}
