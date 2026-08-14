import logoUrl from '../../../build/oraclelens.png';
import { t } from './i18n';

// Colors taken straight from the app's own icon (build/oraclelens.png) — a
// deliberately separate palette from theme/brand.css's `--game-*` tokens,
// since this screen is a one-off first-impression treatment, not the general
// "no client connected" chrome reused elsewhere (see App.tsx).
const PALETTE = {
  bgCenter: '#1a0e0e',
  bgEdge: '#141010',
  copperBorder: '#a66a3a',
  copperBright: '#d9a05b',
  redStatus: '#c1272d',
  green: '#3e8e5a',
};

// The brand welcome/waiting screen, shown only while no League client is
// connected (see App.tsx — it swaps this out for `.theme-lol` chrome the
// moment a client is found). `connected` drives a brief green confirmation
// flash right before that swap happens.
export function WaitingScreen({ connected }: { connected: boolean }) {
  const accent = connected ? PALETTE.green : PALETTE.copperBright;
  const statusColor = connected ? PALETTE.green : PALETTE.redStatus;

  return (
    <div
      className="flex h-full w-full flex-1 items-center justify-center"
      style={{
        background: `radial-gradient(circle at 50% 45%, ${PALETTE.bgCenter} 0%, ${PALETTE.bgEdge} 70%)`,
      }}
    >
      <div className={`flex flex-col items-center gap-5 ${connected ? 'oracle-waiting-flash' : ''}`}>
        <div className="relative flex h-28 w-28 items-center justify-center">
          <div
            className="oracle-waiting-ring absolute inset-0 rounded-full border-2"
            style={{
              borderTopColor: accent,
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              borderLeftColor: `${accent}40`,
              transition: 'border-color 300ms ease',
            }}
          />
          <img
            src={logoUrl}
            alt={t('app.name')}
            className={`h-16 w-16 object-contain ${connected ? '' : 'oracle-waiting-logo'}`}
            style={{
              filter: `drop-shadow(0 0 16px ${accent}99)`,
              transition: 'filter 300ms ease',
            }}
          />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <h1
            className="pb-1 text-xl font-semibold tracking-[0.1em]"
            style={{ color: PALETTE.copperBright, borderBottom: `1px solid ${PALETTE.copperBorder}` }}
          >
            {t('app.name')}
          </h1>
          <p className="text-sm transition-colors duration-300" style={{ color: statusColor }}>
            {connected ? t('accountSummary.connected') : t('accountSummary.waiting')}
          </p>
        </div>
      </div>
    </div>
  );
}
