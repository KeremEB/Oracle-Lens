import { SKIN_AVAILABILITY_ORDER, type SkinAvailability } from '../../../shared/types/lol';
import { t } from '../../core/i18n';

export function availabilityLabel(availability: SkinAvailability): string {
  switch (availability) {
    case 'purchasable':
      return t('availability.purchasable');
    case 'legacy':
      return t('availability.legacy');
    case 'reward':
      return t('availability.reward');
    case 'craftable':
      return t('availability.craftable');
    case 'promotional':
      return t('availability.promotional');
    case 'unavailable':
      return t('availability.unavailable');
  }
}

export function allAvailabilities(): readonly SkinAvailability[] {
  return SKIN_AVAILABILITY_ORDER;
}

/**
 * Badge tint per tier. Purchasable is deliberately absent — it's the default
 * case and badging four fifths of the grid would just be noise.
 */
const BADGE_CLASSES: Record<SkinAvailability, string | null> = {
  purchasable: null,
  legacy: 'bg-neutral-800 text-neutral-400',
  reward: 'bg-amber-950 text-amber-300',
  craftable: 'bg-violet-950 text-violet-300',
  promotional: 'bg-sky-950 text-sky-300',
  unavailable: 'bg-red-950 text-red-300',
};

export function availabilityBadgeClass(availability: SkinAvailability): string | null {
  return BADGE_CLASSES[availability];
}
