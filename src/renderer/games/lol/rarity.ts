import { SKIN_RARITY_ORDER, type SkinRarity } from '../../../shared/types/lol';
import { t } from '../../core/i18n';

export function rarityLabel(rarity: SkinRarity): string {
  switch (rarity) {
    case 'standard':
      return t('rarity.standard');
    case 'rare':
      return t('rarity.rare');
    case 'epic':
      return t('rarity.epic');
    case 'mythic':
      return t('rarity.mythic');
    case 'legendary':
      return t('rarity.legendary');
    case 'ultimate':
      return t('rarity.ultimate');
    case 'transcendent':
      return t('rarity.transcendent');
    case 'exalted':
      return t('rarity.exalted');
  }
}

/** Rarest first, matching the default ordering the provider already applies. */
export function allRarities(): readonly SkinRarity[] {
  return SKIN_RARITY_ORDER;
}
