import { app } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AccountSnapshot, AccountSnapshotMeta, GameId } from '../../../shared/types/core';

// Snapshots embed every already-resolved image (base64 data URLs) alongside
// the rest of a viewed account's data — measured live against a real,
// content-heavy account at ~66 MB for a single snapshot. This bound keeps
// worst-case disk usage in the few-hundred-MB range instead of growing
// unbounded over a long-lived install; revisit downward (or switch to
// storing image references instead of embedded data) if that's still too
// much for accounts with large collections.
const MAX_SNAPSHOTS = 10;

// One JSON file per snapshot (keyed by id) plus a small index file listing
// metadata only — mirrors core/cdn/cache.ts's content-addressed layout.
// Keeps the History list cheap to render (no need to load every snapshot's
// embedded images just to show a name/region/date) while still letting a
// single snapshot be read/deleted independently of the rest.
function snapshotsDir(): string {
  return path.join(app.getPath('userData'), 'snapshots');
}

function indexPath(): string {
  return path.join(snapshotsDir(), 'index.json');
}

function snapshotPath(id: string): string {
  return path.join(snapshotsDir(), `${id}.json`);
}

let indexCache: AccountSnapshotMeta[] | undefined;

async function loadIndex(): Promise<AccountSnapshotMeta[]> {
  if (indexCache) return indexCache;

  try {
    const raw = await fs.readFile(indexPath(), 'utf-8');
    indexCache = JSON.parse(raw) as AccountSnapshotMeta[];
  } catch {
    indexCache = [];
  }

  return indexCache;
}

async function writeIndex(index: AccountSnapshotMeta[]): Promise<void> {
  indexCache = index;
  await fs.mkdir(snapshotsDir(), { recursive: true });
  await fs.writeFile(indexPath(), JSON.stringify(index, null, 2));
}

function newSnapshotId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listSnapshots(gameId?: GameId): Promise<AccountSnapshotMeta[]> {
  const index = await loadIndex();
  const filtered = gameId ? index.filter((entry) => entry.gameId === gameId) : index;
  return [...filtered].sort((a, b) => b.capturedAt - a.capturedAt);
}

export async function getSnapshot<TData = unknown>(
  id: string,
): Promise<AccountSnapshot<TData> | null> {
  try {
    const raw = await fs.readFile(snapshotPath(id), 'utf-8');
    return JSON.parse(raw) as AccountSnapshot<TData>;
  } catch {
    return null;
  }
}

export async function saveSnapshot<TData>(
  meta: { gameId: GameId; accountKey: string; label: string; subtitle: string },
  data: TData,
): Promise<AccountSnapshotMeta> {
  const snapshot: AccountSnapshot<TData> = {
    ...meta,
    id: newSnapshotId(),
    capturedAt: Date.now(),
    data,
  };

  await fs.mkdir(snapshotsDir(), { recursive: true });
  await fs.writeFile(snapshotPath(snapshot.id), JSON.stringify(snapshot));

  const index = await loadIndex();
  const { data: _data, ...savedMeta } = snapshot;
  index.push(savedMeta);
  index.sort((a, b) => b.capturedAt - a.capturedAt);

  // Evict whatever falls past the cap, oldest first.
  const evicted = index.splice(MAX_SNAPSHOTS);
  await Promise.all(evicted.map((entry) => fs.rm(snapshotPath(entry.id), { force: true })));

  await writeIndex(index);
  return savedMeta;
}

export async function deleteSnapshot(id: string): Promise<void> {
  const index = await loadIndex();
  await writeIndex(index.filter((entry) => entry.id !== id));
  await fs.rm(snapshotPath(id), { force: true });
}

export async function clearSnapshots(gameId?: GameId): Promise<void> {
  const index = await loadIndex();
  const toRemove = gameId ? index.filter((entry) => entry.gameId === gameId) : index;
  await Promise.all(toRemove.map((entry) => fs.rm(snapshotPath(entry.id), { force: true })));

  const remaining = gameId ? index.filter((entry) => entry.gameId !== gameId) : [];
  await writeIndex(remaining);
}
