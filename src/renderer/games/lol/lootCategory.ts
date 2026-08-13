import type { LootCategory } from '../../../shared/types/lol';
import { t } from '../../core/i18n';

export function lootCategoryLabel(category: LootCategory): string {
  switch (category) {
    case 'championShards':
      return t('loot.category.championShards');
    case 'skinShards':
      return t('loot.category.skinShards');
    case 'wardsAndEmotes':
      return t('loot.category.wardsAndEmotes');
    case 'chestsKeysOrbs':
      return t('loot.category.chestsKeysOrbs');
    case 'materials':
      return t('loot.category.materials');
    case 'other':
      return t('loot.category.other');
  }
}
