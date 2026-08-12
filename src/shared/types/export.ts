// Shapes for the renderer -> main "save this exported file" round trip.
// The renderer does all the rendering/capture work (html2canvas/jsPDF are
// DOM-bound); main only owns the native save dialog and the actual disk
// write, per the contextBridge boundary.

export interface SaveExportFilter {
  name: string;
  extensions: string[];
}

export interface SaveExportRequest {
  /** Pre-filled name in the save dialog, e.g. "OracleLens_Name-TAG_2026-08-12.png". */
  suggestedName: string;
  filters: SaveExportFilter[];
  data: Uint8Array;
}

export interface SaveExportResult {
  canceled: boolean;
  /** Present only when canceled is false. */
  filePath?: string;
}
