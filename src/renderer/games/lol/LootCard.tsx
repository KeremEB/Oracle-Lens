import type { LootItem } from '../../../shared/types/lol';
import { t } from '../../core/i18n';

export function LootCard({ item }: { item: LootItem }) {
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
      </div>

      <span className="w-full truncate text-xs">{item.name}</span>

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
