import { useMemo } from 'react';
import { LOOT_CATEGORY_ORDER, type LootItem } from '../../../shared/types/lol';
import { matchesSearch } from '../../core/searchMatch';
import { compareTr, type SortOrder } from '../../core/sortOrder';
import { lootCategoryLabel } from './lootCategory';
import { LootGrid } from './LootGrid';

export function LootSection({
  items,
  searchQuery,
  sortOrder,
}: {
  items: LootItem[];
  searchQuery: string;
  sortOrder: SortOrder;
}) {
  const grouped = useMemo(() => {
    const dir = sortOrder === 'za' ? -1 : 1;
    const visible = items.filter((item) => matchesSearch(item.name, searchQuery));
    return LOOT_CATEGORY_ORDER.map((category) => ({
      category,
      items: visible
        .filter((item) => item.category === category)
        .sort((a, b) => dir * compareTr(a.name, b.name)),
    })).filter((group) => group.items.length > 0);
  }, [items, searchQuery, sortOrder]);

  return (
    <div className="flex w-full flex-col gap-4">
      {grouped.map(({ category, items: categoryItems }) => (
        <LootGrid key={category} title={lootCategoryLabel(category)} items={categoryItems} />
      ))}
    </div>
  );
}
