import { useEffect, useState } from 'react';
import type { RankedQueueStatus } from '../../../shared/types/lol';
import { t } from '../../core/i18n';

const EMBLEM_SIZE = 40;

function winRateColorClass(winRate: number): string {
  if (winRate > 50) return 'text-green-400';
  if (winRate < 50) return 'text-red-400';
  return 'text-yellow-400';
}

function EmptyEmblem() {
  return (
    <div
      className="shrink-0 rounded-full bg-neutral-800"
      style={{ height: EMBLEM_SIZE, width: EMBLEM_SIZE }}
    />
  );
}

function RankEmblem({ tier }: { tier: string }) {
  const [emblemUrl, setEmblemUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    window.oracleLens.lol.getRankedEmblemUrl(tier).then((url) => {
      if (!cancelled) setEmblemUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [tier]);

  if (!emblemUrl) return <EmptyEmblem />;
  return (
    <img
      src={emblemUrl}
      alt={tier}
      className="shrink-0 object-contain"
      style={{ height: EMBLEM_SIZE, width: EMBLEM_SIZE }}
    />
  );
}

export function RankBadge({ title, status }: { title: string; status: RankedQueueStatus }) {
  return (
    <div className="flex items-center gap-2.5">
      {status.kind === 'ranked' ? <RankEmblem tier={status.tier} /> : <EmptyEmblem />}

      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-neutral-500">{title}</div>

        {status.kind === 'unranked' && (
          <div className="text-sm text-neutral-400">{t('ranked.unranked')}</div>
        )}

        {status.kind === 'provisional' && (
          <div className="text-sm text-neutral-400">
            {t('ranked.provisional')}: {status.gamesPlayed}
          </div>
        )}

        {status.kind === 'ranked' && (
          <>
            <div className="truncate text-sm font-medium">
              {status.tier} {status.division} · {status.leaguePoints} {t('ranked.leaguePoints')}
            </div>
            <div className="text-xs text-neutral-400">
              {status.wins}W {status.losses}L ·{' '}
              <span className={winRateColorClass(status.winRate)}>{status.winRate}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
