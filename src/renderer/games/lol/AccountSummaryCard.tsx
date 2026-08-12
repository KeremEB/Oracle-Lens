import { useEffect, useState } from 'react';
import type { AccountSummary } from '../../../shared/types/lol';
import { t } from '../../core/i18n';

export function AccountSummaryCard({ summary }: { summary: AccountSummary }) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [borderUrl, setBorderUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    window.oracleLens.lol.getProfileIconUrl(summary.profileIconId).then((url) => {
      if (!cancelled) setIconUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [summary.profileIconId]);

  useEffect(() => {
    let cancelled = false;
    window.oracleLens.lol.getLevelBorderUrl(summary.accountLevel).then((url) => {
      if (!cancelled) setBorderUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [summary.accountLevel]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Fixed footprint regardless of whether the icon/border load, so a
          missing border never shifts or breaks the layout. */}
      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={summary.summonerName}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-500">
            {summary.summonerName.slice(0, 2).toUpperCase()}
          </div>
        )}

        {borderUrl && (
          <img
            src={borderUrl}
            alt=""
            className="pointer-events-none absolute inset-0 h-24 w-24 object-contain"
          />
        )}
      </div>

      <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-left">
        <dt className="text-neutral-400">{t('accountSummary.summonerName')}</dt>
        <dd>{summary.summonerName}</dd>

        <dt className="text-neutral-400">{t('accountSummary.accountLevel')}</dt>
        <dd>{summary.accountLevel}</dd>

        <dt className="text-neutral-400">{t('accountSummary.region')}</dt>
        <dd>{summary.region}</dd>

        <dt className="text-neutral-400">{t('accountSummary.profileIconId')}</dt>
        <dd>{summary.profileIconId}</dd>

        <dt className="text-neutral-400">{t('accountSummary.honorLevel')}</dt>
        <dd>{summary.honorLevel}</dd>

        <dt className="text-neutral-400">{t('accountSummary.honorCheckpoint')}</dt>
        <dd>{summary.honorCheckpoint}</dd>
      </dl>
    </div>
  );
}
