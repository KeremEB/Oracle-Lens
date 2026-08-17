import { app } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';

// Plain free-text notepad, entirely separate from account/client data — see
// the "Notes" tab in LolWorkspace. Stored as plain text (not JSON) since
// there's no structure to it beyond the text itself.
function notesPath(): string {
  return path.join(app.getPath('userData'), 'notes.txt');
}

export async function getNotes(): Promise<string> {
  try {
    return await fs.readFile(notesPath(), 'utf-8');
  } catch {
    return '';
  }
}

export async function saveNotes(content: string): Promise<void> {
  const filePath = notesPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}
