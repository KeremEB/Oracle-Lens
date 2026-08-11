import { useMemo } from 'react';
import type { ChampionMasteryEntry } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { ChampionGrid } from './ChampionGrid';

export function ChampionsSection({ champions }: { champions: ChampionMasteryEntry[] }) {
  const { standard, other } = useMemo(
    () => ({
      standard: champions.filter((c) => !c.isSpecialMode),
      other: champions.filter((c) => c.isSpecialMode),
    }),
    [champions],
  );

  return (
    <div className="flex w-full flex-col gap-8">
      <ChampionGrid title={t('champions.title')} champions={standard} />
      {other.length > 0 && <ChampionGrid title={t('champions.otherTitle')} champions={other} />}
    </div>
  );
}
