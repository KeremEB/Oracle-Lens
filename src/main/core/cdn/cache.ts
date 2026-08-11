import { app } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';

// Generic, game-agnostic disk cache for CDN assets. Callers pass a stable
// cacheKey (namespaced per game, e.g. "lol/champion-icon/Aatrox.png") and the
// remote URL to fetch on a cache miss. Returns the asset as a data: URI so
// callers (mappers) can embed it directly in a domain type — no separate
// asset-serving channel needed.

const inFlight = new Map<string, Promise<string>>();

function cachePathFor(cacheKey: string): string {
  return path.join(app.getPath('userData'), 'cdn-cache', cacheKey);
}

function toDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

export async function getCachedAssetDataUrl(
  cacheKey: string,
  remoteUrl: string,
  mimeType: string,
): Promise<string> {
  const localPath = cachePathFor(cacheKey);

  try {
    const cached = await fs.readFile(localPath);
    return toDataUrl(cached, mimeType);
  } catch {
    // Not cached yet — fall through to download.
  }

  const existing = inFlight.get(cacheKey);
  if (existing) {
    return existing;
  }

  const task = (async () => {
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      throw new Error(`Failed to download asset (${response.status}): ${remoteUrl}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, buffer);
    return toDataUrl(buffer, mimeType);
  })();

  inFlight.set(cacheKey, task);
  try {
    return await task;
  } finally {
    inFlight.delete(cacheKey);
  }
}
