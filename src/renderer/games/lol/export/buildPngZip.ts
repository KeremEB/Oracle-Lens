import JSZip from 'jszip';
import type { CapturedSection } from './capture';
import { canvasToPngBytes } from './buildFile';
import { buildExportFileName } from './fileName';
import { exportSectionFileToken, type ExportSectionId } from './exportSections';

/**
 * One PNG file per captured section, bundled into a single ZIP — never one
 * long stitched image. `section.key` is the `data-export-section` id set in
 * ExportCaptureTree, which is always a real ExportSectionId (the DOM
 * attribute just widens it to `string`).
 */
export async function buildPngZip(
  sections: CapturedSection[],
  summonerName: string,
  generatedAt: Date,
): Promise<Uint8Array> {
  const zip = new JSZip();

  for (const section of sections) {
    const bytes = await canvasToPngBytes(section.canvas);
    const fileName = buildExportFileName(
      summonerName,
      exportSectionFileToken(section.key as ExportSectionId),
      generatedAt,
      'png',
    );
    zip.file(fileName, bytes);
  }

  return zip.generateAsync({ type: 'uint8array' });
}
