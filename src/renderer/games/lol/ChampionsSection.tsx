import { useMemo } from 'react';
import type { ChampionMasteryEntry } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { ChampionGrid } from './ChampionGrid';

export function ChampionsSection({ champions }: { champions: ChampionMasteryEntry[] }) {
  const { standard, classic } = useMemo(
    () => ({
      standard: champions.filter((c) => !c.isClassicVariant),
      classic: champions.filter((c) => c.isClassicVariant),
    }),
    [champions],
  );

  return (
    <div className="flex w-full flex-col gap-8">
      <ChampionGrid title={t('champions.title')} champions={standard} />
      {classic.length > 0 && <ChampionGrid title={t('champions.classicTitle')} champions={classic} />}
    </div>
  );
}
