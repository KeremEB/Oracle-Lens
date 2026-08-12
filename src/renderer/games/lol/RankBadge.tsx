import { useEffect, useState } from 'react';
import type { RankedQueueStatus } from '../../../shared/types/lol';
import { t } from '../../core/i18n';

// The source art (Community Dragon's ranked-emblem/emblem-{tier}.png) isn't
// a tight icon — it's wide splash-style art (1280x720, one tier came back
// 2560x1440) with the actual crest occupying only ~15-25% of the width and
// ~16-33% of the height, roughly centered (measured across iron/gold/
// diamond/master/challenger: horizontal center is ~50% on every tier,
// vertical center clusters at ~47-49%). object-contain on the raw asset
// renders a barely-visible speck at any reasonable chip size. Cropping via
// a CSS background zoomed to the center ~36% of the image (280% background-
// size) reliably contains even the largest tier's emblem across all of
// them without per-tier tuning, since the crop is percentage-based and
// therefore resolution-independent.
const EMBLEM_SIZE = 80;
const EMBLEM_ZOOM = '280% 280%';

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
    <div
      role="img"
      aria-label={tier}
      className="shrink-0"
      style={{
        height: EMBLEM_SIZE,
        width: EMBLEM_SIZE,
        backgroundImage: `url(${emblemUrl})`,
        backgroundSize: EMBLEM_ZOOM,
        backgroundPosition: 'center 47%',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}

// Emblem is deliberately the visual center of gravity here: 80px next to
// text that tops out around 14px, so the tier reads at a glance.
export function RankBadge({ title, status }: { title: string; status: RankedQueueStatus }) {
  return (
    <div className="flex items-center gap-3">
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
