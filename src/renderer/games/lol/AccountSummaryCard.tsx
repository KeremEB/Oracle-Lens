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
      {/*
        Fixed footprint regardless of whether the icon/border load, so a
        missing border never shifts or breaks the layout.

        The border art (Community Dragon's theme-N-border.png, 512x512) isn't
        a tight ring — measured across several themes, the transparent hole
        where the icon shows through is only ~36.5% of the canvas (~187px),
        centered horizontally but ~18px above the canvas's vertical center
        (extra ornament hangs below). So the border has to render at ~2.7x
        the icon's own size for the hole to actually match the icon, and the
        icon needs a small upward nudge to land in that off-center hole
        instead of the geometric middle of the frame.
      */}
      <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={summary.summonerName}
            className="-mt-1.5 h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="-mt-1.5 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-500">
            {summary.summonerName.slice(0, 2).toUpperCase()}
          </div>
        )}

        {borderUrl && (
          <img
            src={borderUrl}
            alt=""
            className="pointer-events-none absolute inset-0 h-44 w-44 object-contain"
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

        <dt className="text-neutral-400">{t('accountSummary.honorLevel')}</dt>
        <dd>{summary.honorLevel}</dd>
      </dl>
    </div>
  );
}
