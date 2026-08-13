import { useEffect, useState } from 'react';
import type { LootItem } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { getRarityGemDataUrl } from './rarityGemCache';
import { rarityLabel } from './rarity';

// Same cache, same component-level pattern, same size ratio as SkinCard —
// deliberately not reimplemented, so a skin shard's gem always matches what
// the owned skin would show once redeemed.
const GEM_SIZE_RATIO = 0.25;

export function LootCard({ item, minCardWidth }: { item: LootItem; minCardWidth: number }) {
  const [gemUrl, setGemUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!item.rarity || item.rarity === 'standard' || item.rarity === 'rare') {
      setGemUrl(null);
      return;
    }
    getRarityGemDataUrl(item.rarity).then((url) => {
      if (!cancelled) setGemUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [item.rarity]);

  const gemSize = minCardWidth * GEM_SIZE_RATIO;
  const gemOverflow = gemSize / 2 - 2;

  return (
    <div className="flex flex-col items-center gap-1 rounded border border-neutral-800 bg-neutral-900/50 p-2 text-center">
      <div className="relative aspect-square w-full">
        {item.imageDataUrl ? (
          <img
            src={item.imageDataUrl}
            alt={item.name}
            className="h-full w-full rounded object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded bg-neutral-800 text-xs text-neutral-500">
            {item.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        {item.count > 1 && (
          <span className="absolute bottom-1 right-1 rounded bg-neutral-950/80 px-1 text-[10px] font-semibold text-neutral-100">
            ×{item.count.toLocaleString('en-US')}
          </span>
        )}

        {/* Straddles the art's bottom edge, centered — same placement as SkinCard's gem. */}
        {gemUrl && (
          <img
            src={gemUrl}
            alt={rarityLabel(item.rarity!)}
            title={rarityLabel(item.rarity!)}
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
        {item.name}
      </span>

      {item.disenchantValue && (
        <span className="w-full truncate text-[10px] text-neutral-500">
          {t('loot.disenchantValue')}: {item.disenchantValue.amount.toLocaleString('en-US')}{' '}
          {item.disenchantValue.label}
        </span>
      )}

      {item.unlockCost && (
        <span className="w-full truncate text-[10px] text-neutral-500">
          {t('loot.unlockCost')}: {item.unlockCost.amount.toLocaleString('en-US')}{' '}
          {item.unlockCost.label}
        </span>
      )}
    </div>
  );
}
