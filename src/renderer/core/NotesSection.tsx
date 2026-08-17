import { useEffect, useRef, useState } from 'react';
import { t } from './i18n';

// How long to wait after the user stops typing before autosaving — also
// saved immediately on blur (see handleBlur), so this delay only matters
// while the user keeps typing without leaving the field.
const AUTOSAVE_DELAY_MS = 1000;

// General-purpose, account-independent notepad — not tied to any client or
// game data (see the module doc comment in LolWorkspace.tsx). Content is
// plain text, persisted in the Electron userData directory via
// src/main/core/store/notes.ts; never sent anywhere else.
export function NotesSection() {
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef<number | null>(null);
  const latestContentRef = useRef('');

  const persist = (text: string): void => {
    window.oracleLens.core.saveNotes(text).catch((err: unknown) => console.warn('[notes] failed to save notes:', err));
  };

  useEffect(() => {
    let cancelled = false;
    window.oracleLens.core
      .getNotes()
      .then((text) => {
        if (cancelled) return;
        setContent(text);
        latestContentRef.current = text;
        setLoaded(true);
      })
      .catch((err: unknown) => console.warn('[notes] failed to load notes:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  // Flush any pending autosave on unmount (e.g. switching tabs) so a save
  // scheduled just before navigating away isn't lost.
  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        persist(latestContentRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (value: string): void => {
    setContent(value);
    latestContentRef.current = value;
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      persist(latestContentRef.current);
    }, AUTOSAVE_DELAY_MS);
  };

  const handleBlur = (): void => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    persist(latestContentRef.current);
  };

  const handleClear = (): void => {
    if (!window.confirm(t('notes.clearConfirm'))) return;
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setContent('');
    latestContentRef.current = '';
    persist('');
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-sm" style={{ color: 'var(--game-accent-muted)' }}>
        {t('notes.warning')}
      </p>

      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        disabled={!loaded}
        spellCheck={false}
        placeholder={t('notes.placeholder')}
        className="min-h-[60vh] w-full resize-y rounded-sm border border-[var(--game-accent-dark)] bg-[var(--game-surface-elevated)] p-3 text-sm text-[var(--game-accent-soft)] outline-none placeholder:text-[var(--game-accent-muted)] focus:border-[var(--game-accent)] disabled:opacity-60"
      />

      <div>
        <button
          type="button"
          onClick={handleClear}
          className="rounded border border-[var(--game-accent-dark)] bg-[var(--game-surface-elevated)] px-3 py-1.5 text-sm text-[var(--game-accent-soft)] transition-[border-color,box-shadow] duration-150 hover:border-[var(--game-accent)] hover:shadow-[0_0_8px_1px_var(--game-glow)]"
        >
          {t('notes.clear')}
        </button>
      </div>
    </div>
  );
}
