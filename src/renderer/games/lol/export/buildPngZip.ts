import JSZip from 'jszip';
import type { CapturedSection } from './capture';
import { buildExportFileName } from './fileName';
import { exportSectionFileToken, type ExportSectionId } from './exportSections';

/**
 * One PNG file per captured section, bundled into a single ZIP — never one
 * long stitched image. `section.key` is the `data-export-section` id set in
 * ExportCaptureTree, which is always a real ExportSectionId (the DOM
 * attribute just widens it to `string`). Encoding already happened in
 * capture.ts's captureElementSafely, so this just packs the bytes.
 */
export async function buildPngZip(
  sections: CapturedSection[],
  summonerName: string,
  generatedAt: Date,
): Promise<Uint8Array> {
  const zip = new JSZip();

  for (const section of sections) {
    const fileName = buildExportFileName(
      summonerName,
      exportSectionFileToken(section.key as ExportSectionId),
      generatedAt,
      'png',
    );
    zip.file(fileName, section.pngBytes);
  }

  return zip.generateAsync({ type: 'uint8array' });
}
