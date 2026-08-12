import { useEffect, useState } from 'react';
import type { ConnectionState } from '../../shared/types/core';

interface LolResource<T> {
  data: T | null;
  error: string | null;
}

// Shared fetch-on-connect pattern: (re)fetches whenever the connection
// becomes 'connected', clears out on any other state. `fetcher` is expected
// to be referentially stable (a bridge method reference) — it is
// intentionally excluded from the effect's dependencies.
export function useLolResource<T>(
  connectionState: ConnectionState,
  fetcher: () => Promise<T>,
): LolResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connectionState !== 'connected') {
      setData(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setError(null);

    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState]);

  return { data, error };
}
