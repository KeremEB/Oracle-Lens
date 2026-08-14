import type { GameId } from '../../shared/types/core';
import { lolTheme } from '../theme/games/lol/tokens';

const RAIL_WIDTH = 60;

// Brand chrome, not game content — the rail itself stays a fixed neutral
// strip regardless of the active game's theme (per CLAUDE.md's "brand
// chrome is constant" rule). The one exception is each button's own
// identity color: like a badge, it always wears that game's colors so the
// rail reads as a row of game icons rather than one more brand-chrome
// control — active glows, inactive stays faded. Only one entry exists
// today; TFT/VALORANT add more entries here later without touching
// anything else, per the "add a folder, not edit the core" architecture.
const GAMES: ReadonlyArray<{ id: GameId; label: string; bg: string; fg: string; font: string }> = [
  { id: 'lol', label: 'LoL', bg: lolTheme.surface, fg: lolTheme.accent, font: lolTheme.fontDisplay },
];

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
      {GAMES.map((game) => {
        const isActive = game.id === activeGame;
        return (
          <button
            key={game.id}
            type="button"
            onClick={() => onSelect(game.id)}
            title={game.label}
            className={
              isActive
                ? 'flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold opacity-100 transition-opacity'
                : 'flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold opacity-45 transition-opacity hover:opacity-75'
            }
            style={{
              backgroundColor: game.bg,
              color: game.fg,
              fontFamily: game.font,
              boxShadow: isActive ? `0 0 8px 1px ${game.fg}` : 'none',
            }}
          >
            {game.label}
          </button>
        );
      })}
    </div>
  );
}
