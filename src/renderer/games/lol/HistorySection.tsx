import type { AccountSnapshotMeta } from '../../../shared/types/core';
import { t } from '../../core/i18n';

function formatCapturedAt(epochMs: number): string {
  return new Date(epochMs).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HistorySection({
  snapshots,
  activeSnapshotId,
  onView,
  onDelete,
  onClearAll,
}: {
  snapshots: AccountSnapshotMeta[];
  activeSnapshotId: string | null;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}) {
  if (snapshots.length === 0) {
    return <p className="text-neutral-400">{t('history.empty')}</p>;
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-300">
          {t('history.title')}
        </h2>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-red-400 hover:text-red-300"
        >
          {t('history.clearAll')}
        </button>
      </div>

      <ul className="flex flex-col gap-1.5">
        {snapshots.map((snapshot) => (
          <li
            key={snapshot.id}
            className={
              snapshot.id === activeSnapshotId
                ? 'flex items-center justify-between rounded border border-neutral-600 bg-neutral-800 px-3 py-2'
                : 'flex items-center justify-between rounded border border-neutral-800 bg-neutral-900/50 px-3 py-2'
            }
          >
            <button
              type="button"
              onClick={() => onView(snapshot.id)}
              className="flex min-w-0 flex-1 flex-col items-start text-left"
            >
              <span className="truncate text-sm font-medium text-neutral-100">
                {snapshot.label}
              </span>
              <span className="text-xs text-neutral-500">
                {snapshot.subtitle} · {formatCapturedAt(snapshot.capturedAt)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onDelete(snapshot.id)}
              title={t('history.delete')}
              aria-label={t('history.delete')}
              className="ml-3 shrink-0 rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-800 hover:text-red-400"
            >
              {t('history.delete')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
