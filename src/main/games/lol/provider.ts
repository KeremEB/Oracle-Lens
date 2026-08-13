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
  Wallet,
} from '../../../shared/types/lol';
import { getCurrentSummoner } from './endpoints/summoner';
import { getHonorProfile } from './endpoints/honor';
import { getRegionLocale } from './endpoints/region';
import { getCurrentRankedStats } from './endpoints/ranked';
import { getChampionMasteryList } from './endpoints/championMastery';
import { getOwnedChampionsMinimal } from './endpoints/champions';
import { getSkinsMinimal } from './endpoints/skins';
import { getWardSkins } from './endpoints/wardSkins';
import { getEmoteInventory, getProfileIconInventory } from './endpoints/inventory';
import { getWallet as getWalletRaw } from './endpoints/wallet';
import { getRsoUserInfo } from './endpoints/rsoAuth';
import { getAllSeasons } from './endpoints/seasons';
import { mapAccountSummary } from './mappers/accountSummary';
import { mapRankedSummary } from './mappers/rankedSummary';
import { mapOwnedChampions } from './mappers/championMastery';
import { mapOwnedSkins } from './mappers/skins';
import { mapOwnedChromas } from './mappers/chromas';
import { mapOwnedWardSkins } from './mappers/wardSkins';
import { mapOwnedEmotes } from './mappers/emotes';
import { mapOwnedProfileIcons } from './mappers/profileIcons';
import { mapWallet } from './mappers/wallet';
import {
  getBlueEssenceIconDataUrl,
  getLevelBorderDataUrl,
  getMasteryCrestDataUrl,
  getProfileIconImageDataUrl,
  getRankedEmblemDataUrl,
  getRarityGemDataUrl,
  getRiotPointsIconDataUrl,
} from '../../core/cdn/lol';

const POLL_INTERVAL_MS = 2500;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// Network-level failures mean the client is gone (closed, crashed, or the
// lockfile briefly pointed at a port that's already dead — Riot doesn't
// always delete the lockfile the instant the process exits, so a
// reconnect attempt can win a race against a stale file and get
// credentials for a port nothing is listening on anymore). Anything else
// (a malformed response, a 4xx/5xx from a real endpoint) is a real error
// about a request, not a sign the connection itself is dead.
function isConnectionLostError(err: unknown): boolean {
  return /ECONNREFUSED|ECONNRESET|EHOSTUNREACH|EPIPE|ENOTFOUND/i.test(errorMessage(err));
}

/**
 * League of Legends provider. Talks to the League Client (LCU) via its
 * lockfile, per the "Local client only" rule — no credentials are ever read
 * or stored beyond the request, `league-connect` only reads the lockfile
 * Riot already writes to disk.
 *
 * Value score/search/... are not implemented yet; only the declared
 * capabilities reflect what the UI can actually render today.
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

  /**
   * Every method that talks to the LCU goes through here instead of
   * checking `this.credentials` and calling out directly. Two jobs:
   *  1. The "not connected" check, previously duplicated in every method.
   *  2. If the call itself fails because the connection is gone
   *     (ECONNREFUSED and friends — see isConnectionLostError), reset to
   *     'unavailable' immediately rather than leaving stale credentials
   *     around for the *next* call to fail against too. This is what
   *     actually recovers a mid-session client close: league-connect's own
   *     background poll (LeagueClient, in connect() below) should catch it
   *     within one pollInterval regardless, but a reconnect can also win a
   *     race against a lockfile Riot hasn't deleted yet and end up
   *     "connected" to a port nothing is listening on — the first real
   *     request is what exposes that, so it has to be the thing that fixes
   *     it rather than just failing silently upward.
   */
  private async withCredentials<T>(fn: (credentials: Credentials) => Promise<T>): Promise<T> {
    if (!this.credentials) {
      throw new Error('League Client is not connected');
    }

    try {
      return await fn(this.credentials);
    } catch (err) {
      if (isConnectionLostError(err)) {
        this.client?.stop();
        this.client = undefined;
        this.credentials = undefined;
        this.setStatus({ state: 'unavailable' });
      }
      throw err;
    }
  }

  async getAccountSummary(): Promise<AccountSummary> {
    return this.withCredentials(async (credentials) => {
      const [summoner, honor, region, rsoUserInfo, seasons] = await Promise.all([
        getCurrentSummoner(credentials),
        getHonorProfile(credentials),
        getRegionLocale(credentials).catch((err) => {
          console.warn(
            '[lol] region-locale request failed, falling back to Unknown:',
            errorMessage(err),
          );
          return undefined;
        }),
        // Both are supplementary (country + creation season) — if either
        // fails, the rest of the summary must still come through; the mapper
        // just omits those two fields per the "hide missing data" rule.
        getRsoUserInfo(credentials).catch((err) => {
          console.warn('[lol] rso userinfo request failed:', errorMessage(err));
          return undefined;
        }),
        getAllSeasons(credentials).catch((err) => {
          console.warn('[lol] allSeasons request failed:', errorMessage(err));
          return undefined;
        }),
      ]);

      return mapAccountSummary({ summoner, honor, region, rsoUserInfo, seasons });
    });
  }

  async getRankedSummary(): Promise<RankedSummary> {
    return this.withCredentials(async (credentials) => {
      const raw = await getCurrentRankedStats(credentials);
      return mapRankedSummary(raw);
    });
  }

  async getChampionMasteries(): Promise<ChampionMasteryEntry[]> {
    return this.withCredentials(async (credentials) => {
      const [owned, mastery] = await Promise.all([
        getOwnedChampionsMinimal(credentials),
        getChampionMasteryList(credentials),
      ]);
      return mapOwnedChampions(owned, mastery);
    });
  }

  async getMasteryCrestUrl(level: number): Promise<string | null> {
    return getMasteryCrestDataUrl(level);
  }

  async getOwnedSkins(): Promise<OwnedSkin[]> {
    return this.withCredentials(async (credentials) => {
      const summoner = await getCurrentSummoner(credentials);
      const raw = await getSkinsMinimal(credentials, summoner.summonerId);
      return mapOwnedSkins(raw);
    });
  }

  async getRarityGemUrl(rarity: SkinRarity): Promise<string | null> {
    return getRarityGemDataUrl(rarity);
  }

  async getOwnedChromas(): Promise<SkinChromaGroup[]> {
    return this.withCredentials(async (credentials) => {
      const summoner = await getCurrentSummoner(credentials);
      const skinsMinimal = await getSkinsMinimal(credentials, summoner.summonerId);
      return mapOwnedChromas(credentials, summoner.summonerId, skinsMinimal);
    });
  }

  async getOwnedWardSkins(): Promise<OwnedWardSkin[]> {
    return this.withCredentials(async (credentials) => {
      const summoner = await getCurrentSummoner(credentials);
      const raw = await getWardSkins(credentials, summoner.summonerId);
      return mapOwnedWardSkins(raw);
    });
  }

  async getOwnedEmotes(): Promise<OwnedEmote[]> {
    return this.withCredentials(async (credentials) => {
      const raw = await getEmoteInventory(credentials);
      return mapOwnedEmotes(raw);
    });
  }

  async getOwnedProfileIcons(): Promise<OwnedProfileIcon[]> {
    return this.withCredentials(async (credentials) => {
      const raw = await getProfileIconInventory(credentials);
      return mapOwnedProfileIcons(raw);
    });
  }

  async getProfileIconUrl(iconId: number): Promise<string | null> {
    return getProfileIconImageDataUrl(iconId);
  }

  async getLevelBorderUrl(accountLevel: number): Promise<string | null> {
    return getLevelBorderDataUrl(accountLevel);
  }

  async getWallet(): Promise<Wallet> {
    return this.withCredentials(async (credentials) => {
      const raw = await getWalletRaw(credentials);
      return mapWallet(raw);
    });
  }

  async getRankedEmblemUrl(tier: string): Promise<string | null> {
    return getRankedEmblemDataUrl(tier);
  }

  async getRiotPointsIconUrl(): Promise<string | null> {
    return getRiotPointsIconDataUrl();
  }

  async getBlueEssenceIconUrl(): Promise<string | null> {
    return getBlueEssenceIconDataUrl();
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    for (const listener of this.listeners) {
      listener(status);
    }
  }
}
