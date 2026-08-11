import { authenticate, ClientNotFoundError, LeagueClient } from 'league-connect';
import type {
  ConnectionListener,
  ConnectionStatus,
  GameCapability,
  GameProvider,
} from '../../../shared/types/core';

const POLL_INTERVAL_MS = 2500;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Connection-only League of Legends provider. Talks to the League Client
 * (LCU) via its lockfile, per the "Local client only" rule — no credentials
 * are ever read or stored, `league-connect` only reads the lockfile Riot
 * already writes to disk.
 *
 * Data fetching (ranked, champions, skins, ...) is intentionally not
 * implemented yet; `capabilities` stays empty until that lands.
 */
export class LeagueOfLegendsProvider implements GameProvider {
  readonly id = 'lol' as const;
  readonly displayName = 'League of Legends';
  readonly capabilities: readonly GameCapability[] = [];

  private status: ConnectionStatus = { state: 'unavailable' };
  private readonly listeners = new Set<ConnectionListener>();
  private client: LeagueClient | undefined;

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
        this.setStatus({ state: 'unavailable' });
      });

      client.start();
      this.client = client;
      this.setStatus({ state: 'connected' });
    } catch (err) {
      this.setStatus({ state: 'error', error: errorMessage(err) });
    }
  }

  async disconnect(): Promise<void> {
    this.client?.stop();
    this.client = undefined;
    this.setStatus({ state: 'unavailable' });
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    for (const listener of this.listeners) {
      listener(status);
    }
  }
}
