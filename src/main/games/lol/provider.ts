import { authenticate, ClientNotFoundError, LeagueClient, type Credentials } from 'league-connect';
import type {
  ConnectionListener,
  ConnectionStatus,
  GameCapability,
  GameProvider,
} from '../../../shared/types/core';
import type { AccountSummary, RankedSummary } from '../../../shared/types/lol';
import { getCurrentSummoner } from './endpoints/summoner';
import { getHonorProfile } from './endpoints/honor';
import { getRegionLocale } from './endpoints/region';
import { getCurrentRankedStats } from './endpoints/ranked';
import { mapAccountSummary } from './mappers/accountSummary';
import { mapRankedSummary } from './mappers/rankedSummary';

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
 * Champions/skins/... are not implemented yet; only the declared
 * capabilities reflect what the UI can actually render today.
 */
export class LeagueOfLegendsProvider implements GameProvider {
  readonly id = 'lol' as const;
  readonly displayName = 'League of Legends';
  readonly capabilities: readonly GameCapability[] = ['summary', 'ranked'];

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

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    for (const listener of this.listeners) {
      listener(status);
    }
  }
}
