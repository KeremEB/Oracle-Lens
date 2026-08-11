import type { GameId, GameProvider } from '../../../shared/types/core';

export class ProviderRegistry {
  private readonly providers = new Map<GameId, GameProvider>();

  register(provider: GameProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: GameId): GameProvider | undefined {
    return this.providers.get(id);
  }

  getAll(): GameProvider[] {
    return [...this.providers.values()];
  }
}
