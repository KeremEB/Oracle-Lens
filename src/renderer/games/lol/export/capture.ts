import html2canvas from 'html2canvas';

/** Physical-pixel multiplier for captures — 2x for a retina-sharp result. */
export const CAPTURE_SCALE = 2;

const IMAGE_TIMEOUT_MS = 8000;
const FONT_TIMEOUT_MS = 4000;
const STABILIZE_MAX_ROUNDS = 6;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete) return Promise.resolve();
  return new Promise((resolve) => {
    const done = (): void => resolve();
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
    setTimeout(done, IMAGE_TIMEOUT_MS);
  });
}

/**
 * Waits for every <img> inside `container` to finish loading, or fail/time
 * out — a broken CDN fetch shouldn't hang the export forever (the app
 * already renders a placeholder box instead of an <img> when a fetch fails,
 * so this only ever waits on images that are genuinely expected to arrive).
 *
 * The underlying data URLs are usually already cached by the time export
 * runs, but React only attaches them to the DOM after an async IPC round
 * trip (rarity gems, mastery crests, profile icon, level border) — reading
 * the <img> list once, immediately, can miss tags that haven't been
 * rendered yet. Poll a few animation frames until the count stops growing
 * before waiting on load/error.
 */
async function waitForImagesToSettle(container: HTMLElement): Promise<void> {
  let previousCount = -1;
  for (let round = 0; round < STABILIZE_MAX_ROUNDS; round++) {
    const count = container.querySelectorAll('img').length;
    if (count === previousCount) break;
    previousCount = count;
    await nextFrame();
  }

  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(images.map(waitForImage));
}

async function waitForFonts(): Promise<void> {
  if (!('fonts' in document)) return;
  await Promise.race([
    document.fonts.ready.then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, FONT_TIMEOUT_MS)),
  ]);
}

async function captureElement(el: HTMLElement): Promise<HTMLCanvasElement> {
  // Matches the element's own rendered background rather than a hardcoded
  // guess, so a capture never shows a stray white/transparent edge.
  const backgroundColor = getComputedStyle(el).backgroundColor || '#171717';
  return html2canvas(el, { scale: CAPTURE_SCALE, backgroundColor, logging: false });
}

export interface CapturedSection {
  key: string;
  label: string;
  canvas: HTMLCanvasElement;
}

/**
 * Captures every top-level `[data-export-section]` child of `container` as
 * its own canvas, in document order — one canvas per report page, so a
 * multi-page export never cuts a card in half at a page boundary. Works for
 * the single-section summary card too (it carries one `data-export-section`
 * on its own root), so callers don't need a separate code path.
 */
export async function captureReportSections(
  container: HTMLElement,
  onProgress?: (done: number, total: number, label: string) => void,
): Promise<CapturedSection[]> {
  await waitForFonts();
  await waitForImagesToSettle(container);

  const sectionEls = Array.from(container.querySelectorAll<HTMLElement>('[data-export-section]'));
  if (sectionEls.length === 0) {
    throw new Error('No exportable content found (missing data-export-section)');
  }

  const results: CapturedSection[] = [];
  for (let i = 0; i < sectionEls.length; i++) {
    const el = sectionEls[i];
    const key = el.dataset.exportSection ?? String(i);
    const label = el.dataset.exportLabel ?? key;
    onProgress?.(i, sectionEls.length, label);
    results.push({ key, label, canvas: await captureElement(el) });
  }
  onProgress?.(sectionEls.length, sectionEls.length, '');

  return results;
}
