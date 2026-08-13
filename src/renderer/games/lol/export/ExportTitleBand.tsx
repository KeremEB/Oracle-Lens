import { t } from '../../../core/i18n';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Sits at the top of every exported image (see ExportCaptureTree) — each
// file is a standalone artifact once it leaves the ZIP, so it carries its
// own identity rather than relying on a filename to say whose data it is.
export function ExportTitleBand({
  summonerName,
  region,
  sectionLabel,
  itemCount,
  generatedAt,
}: {
  summonerName: string;
  region: string;
  sectionLabel: string;
  /** Omitted for Account Details, which isn't a collection of items. */
  itemCount?: number;
  generatedAt: Date;
}) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-700 bg-neutral-900 px-6 py-4 text-neutral-100">
      <div>
        <div className="text-lg font-semibold tracking-wide">Oracle Lens</div>
        <div className="text-sm text-neutral-400">
          {summonerName} · {region}
        </div>
      </div>

      <div className="text-right">
        <div className="text-base font-semibold">{sectionLabel}</div>
        <div className="text-xs text-neutral-500">
          {typeof itemCount === 'number' &&
            `${itemCount.toLocaleString('en-US')} ${itemCount === 1 ? t('export.item') : t('export.items')} · `}
          {t('export.generatedOn')} {formatDate(generatedAt)}
        </div>
      </div>
    </div>
  );
}
