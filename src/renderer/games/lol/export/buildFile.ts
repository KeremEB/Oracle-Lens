import { jsPDF } from 'jspdf';
import { CAPTURE_SCALE, type CapturedSection } from './capture';

function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas failed to encode as PNG'));
        return;
      }
      blob
        .arrayBuffer()
        .then((buffer) => resolve(new Uint8Array(buffer)))
        .catch(reject);
    }, 'image/png');
  });
}

/** Stacks section canvases vertically into one continuous canvas. */
function stackCanvases(sections: CapturedSection[]): HTMLCanvasElement {
  const width = Math.max(...sections.map((s) => s.canvas.width));
  const height = sections.reduce((sum, s) => sum + s.canvas.height, 0);

  const combined = document.createElement('canvas');
  combined.width = width;
  combined.height = height;
  const ctx = combined.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create a canvas context to assemble the PNG');
  }

  let y = 0;
  for (const section of sections) {
    ctx.drawImage(section.canvas, 0, y);
    y += section.canvas.height;
  }
  return combined;
}

/** One continuous PNG — all sections stacked top to bottom, single file. */
export async function buildPng(sections: CapturedSection[]): Promise<Uint8Array> {
  const combined = sections.length === 1 ? sections[0].canvas : stackCanvases(sections);
  return canvasToPngBytes(combined);
}

/**
 * One PDF page per section, each page sized to that section's own captured
 * dimensions (converted back from physical capture pixels to CSS px, since
 * jsPDF's 'px' unit is 1:1 with page points) — so every page is exactly as
 * tall as its content, never cropping or leaving dead space, and content
 * never splits across a page break.
 */
export function buildPdf(sections: CapturedSection[]): Uint8Array {
  const pageSize = (canvas: HTMLCanvasElement): [number, number] => [
    canvas.width / CAPTURE_SCALE,
    canvas.height / CAPTURE_SCALE,
  ];

  const [firstWidth, firstHeight] = pageSize(sections[0].canvas);
  const doc = new jsPDF({ unit: 'px', format: [firstWidth, firstHeight] });

  sections.forEach((section, index) => {
    const [width, height] = pageSize(section.canvas);
    if (index > 0) {
      doc.addPage([width, height]);
    }
    doc.addImage(section.canvas, 'PNG', 0, 0, width, height);
  });

  return new Uint8Array(doc.output('arraybuffer'));
}
