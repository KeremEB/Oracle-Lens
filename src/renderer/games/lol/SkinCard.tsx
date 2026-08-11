import { useEffect, useState } from 'react';
import type { OwnedSkin } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { getRarityGemDataUrl } from './rarityGemCache';
import { rarityLabel } from './rarity';

export function SkinCard({ skin }: { skin: OwnedSkin }) {
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

  return (
    <div className="flex flex-col items-center gap-1 rounded border border-neutral-800 bg-neutral-900/50 p-2 text-center">
      <div className="relative h-20 w-32">
        {skin.tileDataUrl ? (
          <img
            src={skin.tileDataUrl}
            alt={skin.name}
            className="h-20 w-32 rounded object-cover"
          />
        ) : (
          <div className="flex h-20 w-32 items-center justify-center rounded bg-neutral-800 text-xs text-neutral-500">
            {skin.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        {gemUrl && (
          <img
            src={gemUrl}
            alt={rarityLabel(skin.rarity)}
            title={rarityLabel(skin.rarity)}
            className="absolute -bottom-1 -right-1 h-6 w-6"
          />
        )}
      </div>

      <span className="max-w-[128px] truncate text-xs">{skin.name}</span>

      {skin.isLegacy && (
        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">
          {t('skins.legacyBadge')}
        </span>
      )}
    </div>
  );
}
