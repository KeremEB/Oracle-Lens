import { useEffect, useState } from 'react';
import type { AccountSummary, RankedSummary, Wallet } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { ProfileIconBadge } from './ProfileIconBadge';
import { RankBadge } from './RankBadge';
import { MetaChip } from './MetaChip';
import { RefreshIcon, ServerIcon, SeasonIcon } from './metaIcons';
import { useStaticIconUrl } from './useStaticIconUrl';
import { countryFlagEmoji } from './countryFlag';
import { getHonorBadgeDataUrl } from './honorBadgeCache';

const HONOR_BADGE_SIZE = 18;

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function CurrencyIcon({ url, alt }: { url: string | null; alt: string }) {
  if (!url) return <span className="h-4 w-4" />;
  return <img src={url} alt={alt} className="h-4 w-4 object-contain" />;
}

// The client's own honor badge art (badge-honor-1.svg .. badge-honor-5.svg,
// verified against a live directory listing — see cdn/lol.ts). Levels 0 and
// 6+ have no badge art in the client either, so those fall back to a plain
// dot rather than pretending there's a real asset for them.
function HonorBadge({ level }: { level: number }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHonorBadgeDataUrl(level).then((result) => {
      if (!cancelled) setUrl(result);
    });
    return () => {
      cancelled = true;
    };
  }, [level]);

  if (!url) {
    return (
      <div
        className="rounded-full"
        style={{
          height: HONOR_BADGE_SIZE,
          width: HONOR_BADGE_SIZE,
          backgroundColor: 'var(--game-accent-dark)',
        }}
      />
    );
  }

  return (
    <img
      src={url}
      alt={`Honor ${level}`}
      className="object-contain"
      style={{ height: HONOR_BADGE_SIZE, width: HONOR_BADGE_SIZE }}
    />
  );
}

// Full-width, above the game rail and sidebar — see App.tsx. One single row:
// identity | both ranked queues | meta chips, then the Refresh button.
//
// Identity/ranked/chips live in their own `min-w-0 flex-1 overflow-x-auto`
// sub-row: `flex-nowrap` so nothing drops to a second line, and `flex-1` so
// that sub-row (not the header as a whole) absorbs any width shortfall by
// scrolling horizontally within itself. Refresh sits outside that sub-row
// as a plain shrink-0 sibling, so it's never part of the scrolling content
// and always stays fully visible at the right edge, regardless of window
// width or how many chips are showing — a narrow window scrolls the middle
// group, it never pushes Refresh off-screen or wraps anything to a second
// line.
//
// Ranked and wallet arrive from separate fetches and can lag behind the
// summary by a tick — each block simply doesn't render until its own data
// is in. Meta fields the LCU didn't provide (country, creation season) are
// omitted outright, never shown as an empty chip.
export function AccountHeader({
  summary,
  ranked,
  wallet,
  onRefresh,
  isRefreshing,
}: {
  summary: AccountSummary;
  ranked: RankedSummary | null;
  wallet: Wallet | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const rpIconUrl = useStaticIconUrl(() => window.oracleLens.lol.getRiotPointsIconUrl());
  const beIconUrl = useStaticIconUrl(() => window.oracleLens.lol.getBlueEssenceIconUrl());
  const flag = summary.country ? countryFlagEmoji(summary.country) : null;

  return (
    <header
      className="w-full shrink-0 border-b px-6 py-2.5 transition-colors duration-300"
      style={{ borderColor: 'var(--game-accent-dark)', backgroundColor: 'var(--game-surface-card)' }}
    >
      <div className="flex w-full flex-nowrap items-center gap-x-4">
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-x-4 overflow-x-auto">
          <div className="flex shrink-0 items-center gap-3">
            <ProfileIconBadge
              profileIconId={summary.profileIconId}
              accountLevel={summary.accountLevel}
              summonerName={summary.summonerName}
              size={54}
            />
            <div>
              <div
                className="text-base font-semibold leading-tight"
                style={{ color: 'var(--game-accent-soft)' }}
              >
                {summary.summonerName}
              </div>
              <div className="text-sm" style={{ color: 'var(--game-accent-muted)' }}>
                {t('accountSummary.levelShort')} {summary.accountLevel}
              </div>
            </div>
          </div>

          {ranked && (
            <div
              className="flex shrink-0 items-center gap-4 border-l pl-4"
              style={{ borderColor: 'var(--game-accent-dark)' }}
            >
              <RankBadge title={t('queue.soloDuo')} status={ranked.soloDuo} />
              <RankBadge title={t('queue.flex')} status={ranked.flex} />
            </div>
          )}

          <div className="flex shrink-0 flex-nowrap items-center gap-1.5">
            {wallet && (
              <>
                <MetaChip
                  icon={<CurrencyIcon url={rpIconUrl} alt="RP" />}
                  label={t('accountSummary.riotPoints')}
                  value={formatNumber(wallet.riotPoints)}
                />
                <MetaChip
                  icon={<CurrencyIcon url={beIconUrl} alt="BE" />}
                  label={t('accountSummary.blueEssence')}
                  value={formatNumber(wallet.blueEssence)}
                />
              </>
            )}
            <MetaChip
              icon={<HonorBadge level={summary.honorLevel} />}
              label={t('accountSummary.honor')}
              value={String(summary.honorLevel)}
            />
            <MetaChip
              icon={<ServerIcon size={16} />}
              label={t('accountSummary.server')}
              value={summary.region}
            />
            {summary.country && (
              <MetaChip
                icon={<span className="text-base leading-none">{flag ?? '🏳️'}</span>}
                label={t('accountSummary.country')}
                value={summary.country}
              />
            )}
            {summary.createdSeasonId != null && (
              <MetaChip
                icon={<SeasonIcon size={16} />}
                label={t('accountSummary.season')}
                value={String(summary.createdSeasonId)}
              />
            )}
          </div>
        </div>

        {/* Outside the scrolling sub-row above on purpose — the one element
            that always anchors fully visible at the right edge, regardless
            of how much (or little) else is in the row. */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title={t('accountSummary.refresh')}
          aria-label={t('accountSummary.refresh')}
          className="flex shrink-0 items-center gap-2 rounded-md border border-[var(--game-accent-dark)] px-3 py-1.5 text-sm font-medium text-[var(--game-accent-soft)] transition-colors hover:border-[var(--game-accent)] hover:shadow-[0_0_8px_0_var(--game-glow)] disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: 'var(--game-surface-elevated)' }}
        >
          <span className={isRefreshing ? 'animate-spin' : ''}>
            <RefreshIcon size={15} />
          </span>
          {t('accountSummary.refresh')}
        </button>
      </div>
    </header>
  );
}
