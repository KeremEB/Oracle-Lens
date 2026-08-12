import { dialog, type BrowserWindow } from 'electron';
import { promises as fs } from 'node:fs';
import type { SaveExportRequest, SaveExportResult } from '../../../shared/types/export';

export async function saveExportFile(
  win: BrowserWindow | null,
  request: SaveExportRequest,
): Promise<SaveExportResult> {
  const options = { defaultPath: request.suggestedName, filters: request.filters };
  const { canceled, filePath } = win
    ? await dialog.showSaveDialog(win, options)
    : await dialog.showSaveDialog(options);

  if (canceled || !filePath) {
    return { canceled: true };
  }

  await fs.writeFile(filePath, request.data);
  return { canceled: false, filePath };
}
