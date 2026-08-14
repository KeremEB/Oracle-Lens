// TEMPORARY verification harness: drives the REAL captureReportSections()
// from export/capture.ts against sections with more than html2canvas's
// 100-entry default cache limit of DISTINCT image srcs — the exact condition
// that made real exports come out blank. Delete this file and __diag.html
// when done.
import { captureReportSections } from './games/lol/export/capture';

/** Builds N genuinely distinct images (unique pixels => unique data URLs). */
function makeDistinctDataUrls(count: number): string[] {
  const urls: string[] = [];
  for (let i = 0; i < count; i++) {
    const c = document.createElement('canvas');
    c.width = 24;
    c.height = 24;
    const ctx = c.getContext('2d')!;
    // Fully opaque, clearly non-background colour, unique per index.
    ctx.fillStyle = `rgb(${(i * 7) % 200 + 55}, ${(i * 13) % 200 + 55}, ${(i * 29) % 200 + 55})`;
    ctx.fillRect(0, 0, 24, 24);
    ctx.fillStyle = '#fff';
    ctx.fillRect(i % 20, (i * 3) % 20, 4, 4);
    urls.push(c.toDataURL('image/png'));
  }
  return urls;
}

function buildSection(id: string, imageCount: number): HTMLElement {
  const section = document.createElement('div');
  section.dataset.exportSection = id;
  section.dataset.exportLabel = id;
  section.style.background = '#171717';
  section.style.padding = '12px';
  section.style.display = 'grid';
  section.style.gridTemplateColumns = 'repeat(20, 40px)';
  section.style.gap = '6px';
  section.style.width = 'max-content';

  for (const url of makeDistinctDataUrls(imageCount)) {
    const img = document.createElement('img');
    img.src = url;
    img.width = 40;
    img.height = 40;
    section.appendChild(img);
  }
  return section;
}

function countBlank(canvas: HTMLCanvasElement, section: HTMLElement): { blank: number; total: number } {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const sectionRect = section.getBoundingClientRect();
  const imgs = Array.from(section.querySelectorAll('img'));
  // capture.ts renders at CAPTURE_SCALE (2x); map DOM px -> canvas px.
  const scaleX = canvas.width / sectionRect.width;
  const scaleY = canvas.height / sectionRect.height;

  let blank = 0;
  for (const img of imgs) {
    const r = img.getBoundingClientRect();
    const x = Math.round((r.left - sectionRect.left) * scaleX);
    const y = Math.round((r.top - sectionRect.top) * scaleY);
    const w = Math.max(1, Math.round(r.width * scaleX));
    const h = Math.max(1, Math.round(r.height * scaleY));
    if (x < 0 || y < 0 || x + w > canvas.width || y + h > canvas.height) continue;

    const px = ctx.getImageData(x, y, w, h).data;
    let differing = 0;
    for (let i = 0; i < px.length; i += 16) {
      // Background is #171717 = (23,23,23).
      if (Math.abs(px[i] - 23) + Math.abs(px[i + 1] - 23) + Math.abs(px[i + 2] - 23) > 30) differing++;
    }
    if (differing < (px.length / 16) * 0.02) blank++;
  }
  return { blank, total: imgs.length };
}

async function run(): Promise<void> {
  const root = document.getElementById('diag-root')!;
  const container = document.createElement('div');
  root.appendChild(container);

  const cases = [
    { id: 'under-limit-31', count: 31 },
    { id: 'over-limit-141', count: 141 },
    { id: 'over-limit-216', count: 216 },
    { id: 'way-over-limit-246', count: 246 },
  ];

  for (const c of cases) container.appendChild(buildSection(c.id, c.count));

  console.log('===== CAPTURE FIX VERIFICATION (real capture.ts code path) =====');

  const sections = await captureReportSections(container);

  for (const captured of sections) {
    const el = container.querySelector<HTMLElement>(
      `[data-export-section="${captured.key}"]`,
    )!;
    const { blank, total } = countBlank(captured.canvas, el);
    const uniqueSrcs = new Set(Array.from(el.querySelectorAll('img')).map((i) => i.src)).size;
    console.log(
      `${captured.key}: unique srcs=${uniqueSrcs} | BLANK ${blank}/${total} | canvas ${captured.canvas.width}x${captured.canvas.height}`,
    );
  }

  console.log('===== END =====');
}

void run();
