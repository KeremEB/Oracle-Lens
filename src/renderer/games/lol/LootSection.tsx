import { useMemo } from 'react';
import { LOOT_CATEGORY_ORDER, type LootItem } from '../../../shared/types/lol';
import { matchesSearch } from '../../core/searchMatch';
import { lootCategoryLabel } from './lootCategory';
import { LootGrid } from './LootGrid';

export function LootSection({ items, searchQuery }: { items: LootItem[]; searchQuery: string }) {
  const grouped = useMemo(() => {
    const visible = items.filter((item) => matchesSearch(item.name, searchQuery));
    return LOOT_CATEGORY_ORDER.map((category) => ({
      category,
      items: visible.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0);
  }, [items, searchQuery]);

  return (
    <div className="flex w-full flex-col gap-8">
      {grouped.map(({ category, items: categoryItems }) => (
        <LootGrid key={category} title={lootCategoryLabel(category)} items={categoryItems} />
      ))}
    </div>
  );
}
