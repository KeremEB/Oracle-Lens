import { useEffect, useState } from 'react';
import type { OwnedSkin } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { getRarityGemDataUrl } from './rarityGemCache';
import { rarityLabel } from './rarity';

// Scales WITH grid density now (not fixed) — see the matching comment in
// ChampionCard.tsx.
const GEM_SIZE_RATIO = 0.25;

export function SkinCard({ skin, minCardWidth }: { skin: OwnedSkin; minCardWidth: number }) {
  const [gemUrl, setGemUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (skin.rarity === 'standard' || skin.rarity === 'rare') {
      setGemUrl(null);
      return;
    }
    getRarityGemDataUrl(skin.rarity).then((url) => {
      if (!cancelled) setGemUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [skin.rarity]);

  const gemSize = minCardWidth * GEM_SIZE_RATIO;
  const gemOverflow = gemSize / 2 - 2;

  return (
    <div className="flex flex-col items-center gap-1 rounded border border-neutral-800 bg-neutral-900/50 p-2 text-center">
      <div className="relative aspect-[8/5] w-full">
        {skin.tileDataUrl ? (
          <img src={skin.tileDataUrl} alt={skin.name} className="h-full w-full rounded object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded bg-neutral-800 text-xs text-neutral-500">
            {skin.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Straddles the tile's bottom edge, centered — half over the art,
            half below it. Only rendered for rarities that have gem art. */}
        {gemUrl && (
          <img
            src={gemUrl}
            alt={rarityLabel(skin.rarity)}
            title={rarityLabel(skin.rarity)}
            className="absolute left-1/2 z-10"
            style={{
              bottom: -gemSize / 2,
              height: gemSize,
              width: gemSize,
              transform: 'translateX(-50%)',
            }}
          />
        )}
      </div>

      <span className="w-full truncate text-xs" style={gemUrl ? { marginTop: gemOverflow } : undefined}>
        {skin.name}
      </span>

      {skin.isLegacy && (
        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">
          {t('skins.legacyBadge')}
        </span>
      )}
    </div>
  );
}
