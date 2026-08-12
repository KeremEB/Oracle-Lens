import type { ReactNode } from 'react';
import type { AccountSummary, RankedSummary, Wallet } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { ProfileIconBadge } from './ProfileIconBadge';
import { RankBadge } from './RankBadge';
import { MetaChip } from './MetaChip';
import { HonorIcon, ServerIcon, SeasonIcon } from './metaIcons';
import { useStaticIconUrl } from './useStaticIconUrl';
import { countryFlagEmoji } from './countryFlag';

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function CurrencyIcon({ url, alt }: { url: string | null; alt: string }) {
  if (!url) return <span className="h-4 w-4" />;
  return <img src={url} alt={alt} className="h-4 w-4 object-contain" />;
}

// Full-width, above the game rail and sidebar — see App.tsx — so the meta
// row on the right always has real horizontal room instead of wrapping
// under the sidebar's width. Three blocks: identity | both ranked queues |
// account meta chips. Ranked and wallet arrive from separate fetches and
// can lag behind the summary by a tick — each block simply doesn't render
// until its own data is in. Meta fields the LCU didn't provide (country,
// creation season) are omitted outright, never shown as an empty chip.
export function AccountHeader({
  summary,
  ranked,
  wallet,
  actions,
}: {
  summary: AccountSummary;
  ranked: RankedSummary | null;
  wallet: Wallet | null;
  actions?: ReactNode;
}) {
  const rpIconUrl = useStaticIconUrl(() => window.oracleLens.lol.getRiotPointsIconUrl());
  const beIconUrl = useStaticIconUrl(() => window.oracleLens.lol.getBlueEssenceIconUrl());
  const flag = summary.country ? countryFlagEmoji(summary.country) : null;

  return (
    <header className="flex w-full shrink-0 flex-wrap items-center gap-x-8 gap-y-3 border-b border-neutral-800 bg-neutral-900 px-6 py-3">
      <div className="flex items-center gap-3">
        <ProfileIconBadge
          profileIconId={summary.profileIconId}
          accountLevel={summary.accountLevel}
          summonerName={summary.summonerName}
          size={48}
        />
        <div>
          <div className="text-base font-semibold leading-tight">{summary.summonerName}</div>
          <div className="text-sm text-neutral-400">
            {t('accountSummary.accountLevel')} {summary.accountLevel}
          </div>
        </div>
      </div>

      {ranked && (
        <div className="flex items-center gap-8 border-l border-neutral-800 pl-8">
          <RankBadge title={t('queue.soloDuo')} status={ranked.soloDuo} />
          <RankBadge title={t('queue.flex')} status={ranked.flex} />
        </div>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2">
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
          icon={<HonorIcon size={16} />}
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

      {actions}
    </header>
  );
}
