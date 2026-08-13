import { useEffect, useState, type ReactNode } from 'react';
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
        className="rounded-full bg-neutral-600"
        style={{ height: HONOR_BADGE_SIZE, width: HONOR_BADGE_SIZE }}
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

// Full-width, above the game rail and sidebar — see App.tsx. Two rows, never
// horizontal scroll or overflow:
//  - top: identity | both ranked queues | meta chips, immediately after the
//    ranked blocks (not pushed to the far edge — only the Refresh button
//    gets `ml-auto`, so it's the one fixed point that never moves,
//    regardless of window width or how many chips are showing). `flex-wrap`
//    so the chips group (and, if the window is narrow enough, the chips
//    themselves) drops to its own line instead of ever overflowing.
//  - bottom: export controls, left-aligned under the profile icon.
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
  actions,
}: {
  summary: AccountSummary;
  ranked: RankedSummary | null;
  wallet: Wallet | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  actions?: ReactNode;
}) {
  const rpIconUrl = useStaticIconUrl(() => window.oracleLens.lol.getRiotPointsIconUrl());
  const beIconUrl = useStaticIconUrl(() => window.oracleLens.lol.getBlueEssenceIconUrl());
  const flag = summary.country ? countryFlagEmoji(summary.country) : null;

  return (
    <header className="flex w-full shrink-0 flex-col gap-2 border-b border-neutral-800 bg-neutral-900 px-6 py-2.5">
      <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex shrink-0 items-center gap-3">
          <ProfileIconBadge
            profileIconId={summary.profileIconId}
            accountLevel={summary.accountLevel}
            summonerName={summary.summonerName}
            size={45}
          />
          <div>
            <div className="text-base font-semibold leading-tight">{summary.summonerName}</div>
            <div className="text-sm text-neutral-400">
              {t('accountSummary.accountLevel')} {summary.accountLevel}
            </div>
          </div>
        </div>

        {ranked && (
          <div className="flex shrink-0 items-center gap-4 border-l border-neutral-800 pl-4">
            <RankBadge title={t('queue.soloDuo')} status={ranked.soloDuo} />
            <RankBadge title={t('queue.flex')} status={ranked.flex} />
          </div>
        )}

        {/* No ml-auto here on purpose — these stay right next to the ranked
            blocks instead of drifting to the far edge as the window widens. */}
        <div className="flex flex-wrap items-center gap-1.5">
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

        {/* The one element that always anchors to the far right, regardless
            of how much (or little) else is in this row — a fixed, visible,
            predictable spot rather than wherever the chip-wrapping happens
            to leave room. */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title={t('accountSummary.refresh')}
          aria-label={t('accountSummary.refresh')}
          className="ml-auto flex shrink-0 items-center gap-2 rounded-md border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className={isRefreshing ? 'animate-spin' : ''}>
            <RefreshIcon size={15} />
          </span>
          {t('accountSummary.refresh')}
        </button>
      </div>

      {actions && <div className="flex items-center">{actions}</div>}
    </header>
  );
}
