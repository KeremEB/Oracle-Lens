import { useEffect, useState } from 'react';

/** Fetches a no-argument, account-independent icon (RP, BE, ...) once on mount. */
export function useStaticIconUrl(fetcher: () => Promise<string | null>): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetcher().then((result) => {
      if (!cancelled) setUrl(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return url;
}
