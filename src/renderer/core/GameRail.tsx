import type { GameId } from '../../shared/types/core';
import { lolTheme } from '../theme/games/lol/tokens';

const RAIL_WIDTH = 60;

// The rail's own background/border follow the active theme (`--game-*`,
// set by whichever of `.theme-lol` / `.theme-brand` wraps the app root —
// see App.tsx) so it reads as one piece with the header and sidebar rather
// than a separate strip. Each button's own identity color is the exception:
// like a badge, it always wears that specific game's colors (from
// theme/games/lol/tokens.ts) so the rail reads as a row of game icons even
// when the surrounding chrome is on brand colors — active glows, inactive
// stays faded. Only one entry exists today; TFT/VALORANT add more entries
// here later without touching anything else, per the "add a folder, not
// edit the core" architecture.
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
      className="flex shrink-0 flex-col items-center gap-2 border-r py-3 transition-colors duration-300"
      style={{
        width: RAIL_WIDTH,
        borderColor: 'var(--game-accent-dark)',
        backgroundColor: 'var(--game-surface-card)',
      }}
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
