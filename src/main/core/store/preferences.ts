import { app } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Preferences } from '../../../shared/types/core';

function preferencesPath(): string {
  return path.join(app.getPath('userData'), 'preferences.json');
}

let cache: Preferences | undefined;

async function load(): Promise<Preferences> {
  if (cache) return cache;

  try {
    const raw = await fs.readFile(preferencesPath(), 'utf-8');
    cache = JSON.parse(raw) as Preferences;
  } catch {
    cache = {};
  }

  return cache;
}

export async function getPreferences(): Promise<Preferences> {
  return load();
}

export async function setPreference<K extends keyof Preferences>(
  key: K,
  value: Preferences[K],
): Promise<void> {
  const prefs = await load();
  prefs[key] = value;
  cache = prefs;

  const filePath = preferencesPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(prefs, null, 2));
}
