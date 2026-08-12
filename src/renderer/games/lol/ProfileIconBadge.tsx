import { useEffect, useState } from 'react';

// The level border art (Community Dragon's theme-N-border.png, 512x512)
// isn't a tight ring — measured across several themes, the transparent hole
// where the icon shows through is only ~36.5% of the canvas (~187px),
// centered horizontally but ~18px above the canvas's vertical center (extra
// ornament hangs below). So the border always has to render at ~1/0.365x
// the icon's own size for the hole to actually match the icon, and the icon
// needs a small upward nudge to land in that off-center hole — expressed as
// fractions here so the badge can be reused at any size (a big card, a
// compact header) and stay correctly proportioned.
const HOLE_FRACTION = 187 / 512;
const HOLE_VERTICAL_OFFSET_FRACTION = 18 / 512;

export function ProfileIconBadge({
  profileIconId,
  accountLevel,
  summonerName,
  size = 64,
}: {
  profileIconId: number;
  accountLevel: number;
  summonerName: string;
  /** Rendered icon diameter in px — the border frame is derived from this. */
  size?: number;
}) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [borderUrl, setBorderUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    window.oracleLens.lol.getProfileIconUrl(profileIconId).then((url) => {
      if (!cancelled) setIconUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [profileIconId]);

  useEffect(() => {
    let cancelled = false;
    window.oracleLens.lol.getLevelBorderUrl(accountLevel).then((url) => {
      if (!cancelled) setBorderUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [accountLevel]);

  const borderSize = Math.round(size / HOLE_FRACTION);
  const verticalNudge = Math.round(borderSize * HOLE_VERTICAL_OFFSET_FRACTION);

  return (
    // Fixed footprint regardless of whether the icon/border load, so a
    // missing border never shifts or breaks the surrounding layout.
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ height: borderSize, width: borderSize }}
    >
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={summonerName}
          className="rounded-full object-cover"
          style={{ height: size, width: size, marginTop: -verticalNudge }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-500"
          style={{ height: size, width: size, marginTop: -verticalNudge }}
        >
          {summonerName.slice(0, 2).toUpperCase()}
        </div>
      )}

      {borderUrl && (
        <img
          src={borderUrl}
          alt=""
          className="pointer-events-none absolute inset-0 object-contain"
          style={{ height: borderSize, width: borderSize }}
        />
      )}
    </div>
  );
}
