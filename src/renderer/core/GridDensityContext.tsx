import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Layout-only concern: how wide a grid card is, so more/fewer fit per row.
// Deliberately separate from any filtering/search logic (see useLolResource /
// searchMatch) — this never changes which items are shown, only how big.
export const GRID_DENSITY_STEPS = [90, 110, 140, 170, 200] as const;
const DEFAULT_DENSITY_INDEX = 2;

interface GridDensityContextValue {
  minCardWidth: number;
  adjustDensity: (direction: 1 | -1) => void;
}

const GridDensityContext = createContext<GridDensityContextValue | undefined>(undefined);

export function GridDensityProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState<number>(DEFAULT_DENSITY_INDEX);

  useEffect(() => {
    let cancelled = false;
    window.oracleLens.core.getPreferences().then((prefs) => {
      if (cancelled || typeof prefs.gridDensityIndex !== 'number') return;
      const clamped = Math.min(Math.max(prefs.gridDensityIndex, 0), GRID_DENSITY_STEPS.length - 1);
      setIndex(clamped);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const adjustDensity = (direction: 1 | -1): void => {
    setIndex((prev) => {
      const next = Math.min(Math.max(prev + direction, 0), GRID_DENSITY_STEPS.length - 1);
      if (next !== prev) {
        void window.oracleLens.core.setPreference('gridDensityIndex', next);
      }
      return next;
    });
  };

  return (
    <GridDensityContext.Provider value={{ minCardWidth: GRID_DENSITY_STEPS[index], adjustDensity }}>
      {children}
    </GridDensityContext.Provider>
  );
}

// A density provider that never reads or persists the user's on-screen
// preference — used by the export report, which must render at the same
// fixed size regardless of whatever density the live grid happens to be set
// to right now.
export function FixedGridDensityProvider({
  minCardWidth,
  children,
}: {
  minCardWidth: number;
  children: ReactNode;
}) {
  return (
    <GridDensityContext.Provider value={{ minCardWidth, adjustDensity: () => {} }}>
      {children}
    </GridDensityContext.Provider>
  );
}

export function useGridDensity(): GridDensityContextValue {
  const ctx = useContext(GridDensityContext);
  if (!ctx) {
    throw new Error('useGridDensity must be used within a GridDensityProvider');
  }
  return ctx;
}
