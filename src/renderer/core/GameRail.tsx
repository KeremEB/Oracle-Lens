import type { GameId } from '../../shared/types/core';

const RAIL_WIDTH = 60;

// Brand chrome, not game content — this stays a fixed neutral strip
// regardless of the active game's theme (per CLAUDE.md's "brand chrome is
// constant" rule). Only one entry exists today; TFT/VALORANT add more
// entries here later without touching anything else, per the "add a folder,
// not edit the core" multi-game architecture.
const GAMES: ReadonlyArray<{ id: GameId; label: string }> = [{ id: 'lol', label: 'LoL' }];

export function GameRail({
  activeGame,
  onSelect,
}: {
  activeGame: GameId;
  onSelect: (game: GameId) => void;
}) {
  return (
    <div
      className="flex shrink-0 flex-col items-center gap-2 border-r border-neutral-800 bg-neutral-950 py-3"
      style={{ width: RAIL_WIDTH }}
    >
      {GAMES.map((game) => (
        <button
          key={game.id}
          type="button"
          onClick={() => onSelect(game.id)}
          title={game.label}
          className={
            game.id === activeGame
              ? 'flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-700 text-xs font-semibold text-neutral-100'
              : 'flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'
          }
        >
          {game.label}
        </button>
      ))}
    </div>
  );
}
