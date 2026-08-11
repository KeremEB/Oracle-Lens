import type { GameProvider } from '../../../shared/types/core';
import type { ProviderRegistry } from './registry';

const POLL_INTERVAL_MS = 2500;

/**
 * Drives the "user never presses connect" behaviour: polls each registered
 * provider for an available client and connects automatically. Reconnection
 * after a mid-session disconnect is handled the same way — a provider that
 * drops back to a non-connected state is simply picked up again on the next
 * poll tick.
 */
export class ConnectionManager {
  private readonly timers = new Map<GameProvider, ReturnType<typeof setInterval>>();

  constructor(private readonly registry: ProviderRegistry) {}

  start(): void {
    for (const provider of this.registry.getAll()) {
      this.watch(provider);
    }
  }

  stop(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();

    for (const provider of this.registry.getAll()) {
      void provider.disconnect();
    }
  }

  private watch(provider: GameProvider): void {
    const log = (status: ReturnType<GameProvider['getStatus']>): void => {
      console.log(`[connection] ${provider.id} -> ${status.state}${status.error ? `: ${status.error}` : ''}`);
    };

    log(provider.getStatus());
    provider.onStatusChange(log);

    const tick = async (): Promise<void> => {
      const state = provider.getStatus().state;
      if (state === 'connected' || state === 'connecting') {
        return;
      }

      const available = await provider.detect();
      if (available) {
        await provider.connect();
      }
    };

    void tick();
    this.timers.set(provider, setInterval(() => void tick(), POLL_INTERVAL_MS));
  }
}
