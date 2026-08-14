import { useEffect, useState } from 'react';
import type { RankedQueueStatus } from '../../../shared/types/lol';
import { t } from '../../core/i18n';

// The source art (Community Dragon's ranked-emblem/emblem-{tier}.png) isn't
// a tight icon — it's wide 16:9 splash art (1280x720; one tier ships at
// 2560x1440) with the actual crest occupying only ~20% of the width and
// ~29% of the height, centered (measured across iron/gold/diamond/master/
// challenger: horizontal center ~50%, vertical ~47-49% on every tier).
//
// Cropped via a real <img> with object-fit: contain (so the browser itself
// guarantees the aspect ratio, not a hand-computed one) sized to the full
// box, then CSS-scaled up and clipped by an overflow:hidden parent. This is
// the same zoom-into-center idea as a background-image crop, but object-fit
// removes any doubt about whether the axes are scaling unevenly.
const EMBLEM_SIZE = 80;
const EMBLEM_ZOOM = 5;

function winRateColorClass(winRate: number): string {
  if (winRate > 50) return 'text-green-400';
  if (winRate < 50) return 'text-red-400';
  return 'text-yellow-400';
}

// A pale ring rather than a solid fill — this is the normal, expected look
// for an unranked or provisional queue, not a missing-data placeholder, so
// it shouldn't read as visually "broken" the way a flat gray disc does.
function EmptyEmblem() {
  return (
    <div
      className="shrink-0 rounded-full border-2"
      style={{
        height: EMBLEM_SIZE,
        width: EMBLEM_SIZE,
        borderColor: 'var(--game-accent-dark)',
        backgroundColor: 'var(--game-surface-elevated)',
      }}
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
      className="relative shrink-0 overflow-hidden"
      style={{ height: EMBLEM_SIZE, width: EMBLEM_SIZE }}
    >
      <img
        src={emblemUrl}
        alt={tier}
        className="absolute left-1/2 top-1/2 object-contain"
        style={{
          height: EMBLEM_SIZE,
          width: EMBLEM_SIZE,
          objectPosition: '50% 46%',
          transform: `translate(-50%, -35%) scale(${EMBLEM_ZOOM})`,
        }}
      />
    </div>
  );
}

// Emblem is deliberately the visual center of gravity here: 80px next to
// text that tops out around 14px, so the tier reads at a glance.
export function RankBadge({ title, status }: { title: string; status: RankedQueueStatus }) {
  return (
    <div className="flex items-center gap-3">
      {status.kind === 'ranked' ? <RankEmblem tier={status.tier} /> : <EmptyEmblem />}

      <div className="min-w-0">
        <div
          className="text-[11px] uppercase tracking-wide"
          style={{ color: 'var(--game-accent-muted)' }}
        >
          {title}
        </div>

        {status.kind === 'unranked' && (
          <div className="text-sm" style={{ color: 'var(--game-accent-muted)' }}>
            {t('ranked.unranked')}
          </div>
        )}

        {status.kind === 'provisional' && (
          <div className="text-sm" style={{ color: 'var(--game-accent-muted)' }}>
            {t('ranked.provisional')}: {status.gamesPlayed}
          </div>
        )}

        {status.kind === 'ranked' && (
          <>
            <div
              className="truncate text-sm font-medium"
              style={{ color: 'var(--game-accent-soft)' }}
            >
              {status.tier} {status.division} · {status.leaguePoints} {t('ranked.leaguePoints')}
            </div>
            <div className="text-xs" style={{ color: 'var(--game-accent-muted)' }}>
              {status.wins}W {status.losses}L ·{' '}
              <span className={winRateColorClass(status.winRate)}>{status.winRate}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
