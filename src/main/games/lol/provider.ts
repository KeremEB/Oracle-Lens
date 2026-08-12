import { authenticate, ClientNotFoundError, LeagueClient, type Credentials } from 'league-connect';
import type {
  ConnectionListener,
  ConnectionStatus,
  GameCapability,
  GameProvider,
} from '../../../shared/types/core';
import type {
  AccountSummary,
  ChampionMasteryEntry,
  OwnedEmote,
  OwnedProfileIcon,
  OwnedSkin,
  OwnedWardSkin,
  RankedSummary,
  SkinChromaGroup,
  SkinRarity,
} from '../../../shared/types/lol';
import { getCurrentSummoner } from './endpoints/summoner';
import { getHonorProfile } from './endpoints/honor';
import { getRegionLocale } from './endpoints/region';
import { getCurrentRankedStats } from './endpoints/ranked';
import { getChampionMasteryList } from './endpoints/championMastery';
import { getOwnedChampionsMinimal } from './endpoints/champions';
import { getSkinsMinimal } from './endpoints/skins';
import { buildRpPriceIndex, getSkinStoreCatalog } from './endpoints/store';
import { getWardSkins } from './endpoints/wardSkins';
import { getEmoteInventory, getProfileIconInventory } from './endpoints/inventory';
import { mapAccountSummary } from './mappers/accountSummary';
import { mapRankedSummary } from './mappers/rankedSummary';
import { mapOwnedChampions } from './mappers/championMastery';
import { mapOwnedSkins } from './mappers/skins';
import { mapOwnedChromas } from './mappers/chromas';
import { mapOwnedWardSkins } from './mappers/wardSkins';
import { mapOwnedEmotes } from './mappers/emotes';
import { mapOwnedProfileIcons } from './mappers/profileIcons';
import {
  getLevelBorderDataUrl,
  getMasteryCrestDataUrl,
  getProfileIconImageDataUrl,
  getRarityGemDataUrl,
} from '../../core/cdn/lol';

const POLL_INTERVAL_MS = 2500;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * League of Legends provider. Talks to the League Client (LCU) via its
 * lockfile, per the "Local client only" rule — no credentials are ever read
 * or stored beyond the request, `league-connect` only reads the lockfile
 * Riot already writes to disk.
 *
 * Export/history are not implemented yet; only the declared capabilities
 * reflect what the UI can actually render today.
 */
export class LeagueOfLegendsProvider implements GameProvider {
  readonly id = 'lol' as const;
  readonly displayName = 'League of Legends';
  readonly capabilities: readonly GameCapability[] = [
    'summary',
    'ranked',
    'champions',
    'skins',
    'chromas',
    'collectibles',
    'valueScore',
  ];

  private status: ConnectionStatus = { state: 'unavailable' };
  private readonly listeners = new Set<ConnectionListener>();
  private client: LeagueClient | undefined;
  private credentials: Credentials | undefined;

  getStatus(): ConnectionStatus {
    return this.status;
  }

  onStatusChange(listener: ConnectionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async detect(): Promise<boolean> {
    try {
      await authenticate({ awaitConnection: false });
      return true;
    } catch (err) {
      if (err instanceof ClientNotFoundError) {
        return false;
      }
      // Environment-level problem (wrong OS, client running elevated, ...).
      this.setStatus({ state: 'error', error: errorMessage(err) });
      return false;
    }
  }

  async connect(): Promise<void> {
    if (this.status.state === 'connecting' || this.status.state === 'connected') {
      return;
    }

    this.setStatus({ state: 'connecting' });

    try {
      const credentials = await authenticate({ awaitConnection: false });
      const client = new LeagueClient(credentials, { pollInterval: POLL_INTERVAL_MS });

      client.on('disconnect', () => {
        client.stop();
        this.client = undefined;
        this.credentials = undefined;
        this.setStatus({ state: 'unavailable' });
      });

      client.start();
      this.client = client;
      this.credentials = credentials;
      this.setStatus({ state: 'connected' });
    } catch (err) {
      this.setStatus({ state: 'error', error: errorMessage(err) });
    }
  }

  async disconnect(): Promise<void> {
    this.client?.stop();
    this.client = undefined;
    this.credentials = undefined;
    this.setStatus({ state: 'unavailable' });
  }

  async getAccountSummary(): Promise<AccountSummary> {
    if (!this.credentials) {
      throw new Error('League Client is not connected');
    }
    const credentials = this.credentials;

    const [summoner, honor, region] = await Promise.all([
      getCurrentSummoner(credentials),
      getHonorProfile(credentials),
      getRegionLocale(credentials).catch((err) => {
        console.warn(
          '[lol] region-locale request failed, falling back to Unknown:',
          errorMessage(err),
        );
        return undefined;
      }),
    ]);

    return mapAccountSummary({ summoner, honor, region });
  }

  async getRankedSummary(): Promise<RankedSummary> {
    if (!this.credentials) {
      throw new Error('League Client is not connected');
    }

    const raw = await getCurrentRankedStats(this.credentials);
    return mapRankedSummary(raw);
  }

  async getChampionMasteries(): Promise<ChampionMasteryEntry[]> {
    if (!this.credentials) {
      throw new Error('League Client is not connected');
    }
    const credentials = this.credentials;

    const [owned, mastery] = await Promise.all([
      getOwnedChampionsMinimal(credentials),
      getChampionMasteryList(credentials),
    ]);
    return mapOwnedChampions(owned, mastery);
  }

  async getMasteryCrestUrl(level: number): Promise<string | null> {
    return getMasteryCrestDataUrl(level);
  }

  async getOwnedSkins(): Promise<OwnedSkin[]> {
    if (!this.credentials) {
      throw new Error('League Client is not connected');
    }
    const credentials = this.credentials;

    const summoner = await getCurrentSummoner(credentials);
    const [raw, catalog] = await Promise.all([
      getSkinsMinimal(credentials, summoner.summonerId),
      // A missing catalog costs exact RP prices, not the whole skin list —
      // degrade to estimates rather than failing the screen.
      getSkinStoreCatalog(credentials).catch((err) => {
        console.warn('[lol] store catalog request failed, RP prices unavailable:', errorMessage(err));
        return [];
      }),
    ]);

    return mapOwnedSkins(raw, buildRpPriceIndex(catalog));
  }

  async getRarityGemUrl(rarity: SkinRarity): Promise<string | null> {
    return getRarityGemDataUrl(rarity);
  }

  async getOwnedChromas(): Promise<SkinChromaGroup[]> {
    if (!this.credentials) {
      throw new Error('League Client is not connected');
    }
    const credentials = this.credentials;

    const summoner = await getCurrentSummoner(credentials);
    const skinsMinimal = await getSkinsMinimal(credentials, summoner.summonerId);
    return mapOwnedChromas(credentials, summoner.summonerId, skinsMinimal);
  }

  async getOwnedWardSkins(): Promise<OwnedWardSkin[]> {
    if (!this.credentials) {
      throw new Error('League Client is not connected');
    }
    const credentials = this.credentials;

    const summoner = await getCurrentSummoner(credentials);
    const raw = await getWardSkins(credentials, summoner.summonerId);
    return mapOwnedWardSkins(raw);
  }

  async getOwnedEmotes(): Promise<OwnedEmote[]> {
    if (!this.credentials) {
      throw new Error('League Client is not connected');
    }

    const raw = await getEmoteInventory(this.credentials);
    return mapOwnedEmotes(raw);
  }

  async getOwnedProfileIcons(): Promise<OwnedProfileIcon[]> {
    if (!this.credentials) {
      throw new Error('League Client is not connected');
    }

    const raw = await getProfileIconInventory(this.credentials);
    return mapOwnedProfileIcons(raw);
  }

  async getProfileIconUrl(iconId: number): Promise<string | null> {
    return getProfileIconImageDataUrl(iconId);
  }

  async getLevelBorderUrl(accountLevel: number): Promise<string | null> {
    return getLevelBorderDataUrl(accountLevel);
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    for (const listener of this.listeners) {
      listener(status);
    }
  }
}
