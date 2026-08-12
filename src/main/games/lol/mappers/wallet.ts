import type { Wallet } from '../../../../shared/types/lol';
import type { LcuWallet } from '../endpoints/wallet';

export function mapWallet(raw: LcuWallet): Wallet {
  return {
    riotPoints: raw.RP,
    blueEssence: raw.lol_blue_essence,
  };
}
