// html2canvas-pro, not html2canvas: Tailwind v4's default palette is defined
// in oklch(), and stock html2canvas's CSS color parser throws
// ("unsupported color function oklch") on any computed color that comes back
// in a modern color-function syntax. html2canvas-pro is a maintained fork
// whose whole reason to exist is oklch/oklab/lch/lab/color() support — same
// API, so this is the only line that needed to change.
import html2canvas from 'html2canvas-pro';

/** Physical-pixel multiplier for captures — 2x for a retina-sharp result. */
export const CAPTURE_SCALE = 2;

const IMAGE_TIMEOUT_MS = 8000;
const FONT_TIMEOUT_MS = 4000;
// A card's async-resolved art (mastery crest/banner, rarity gem — see
// prewarmImages.ts) can take several rounds to fully cascade into the DOM
// for a large collection, so "stop polling" is judged by the image count
// holding steady across consecutive rounds, not a fixed round budget. This
// deadline is just the outer safety net against a genuinely stuck render.
const STABLE_ROUNDS_REQUIRED = 3;
const MAX_SETTLE_WAIT_MS = 30000;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Resolves once `img` is decoded and ready to paint, or has definitively
 * failed/timed out — never rejects, so one broken image never aborts an
 * export. `decode()` is a stronger readiness signal than `.complete`/`load`
 * alone (it waits for the browser to actually finish decoding pixel data,
 * not just for the network/data-URL fetch to resolve).
 */
function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();

  const settle: Promise<void> =
    typeof img.decode === 'function'
      ? img.decode().catch(() => undefined)
      : new Promise((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        });

  return Promise.race([settle, new Promise<void>((resolve) => setTimeout(resolve, IMAGE_TIMEOUT_MS))]);
}

/**
 * Waits for every <img> inside `container` to finish loading, or fail/time
 * out — a broken CDN fetch shouldn't hang the export forever (the app
 * already renders a placeholder box instead of an <img> when a fetch fails,
 * so this only ever waits on images that are genuinely expected to arrive).
 *
 * Most of a section's images arrive already resolved in the domain data, so
 * their <img> tags exist from the first render. A few card types (mastery
 * crest/banner, rarity gem) resolve one async IPC round trip later, added to
 * the DOM by their own component's effect — reading the <img> list once,
 * immediately, would miss those. Keep re-scanning until the count holds
 * steady across several consecutive rounds (not just one), since a large
 * collection's cascade of per-card effects can take more than a couple of
 * animation frames to fully settle. `onProgress` fires as each individual
 * image resolves, so callers can show real "N/total" progress rather than a
 * spinner-shaped lie.
 */
async function waitForImagesToSettle(
  container: HTMLElement,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const settled = new Set<HTMLImageElement>();
  const deadline = Date.now() + MAX_SETTLE_WAIT_MS;
  let stableRounds = 0;
  let previousTotal = -1;

  while (Date.now() < deadline) {
    const current = Array.from(container.querySelectorAll('img'));
    const unsettled = current.filter((img) => !settled.has(img));

    if (unsettled.length > 0) {
      await Promise.all(
        unsettled.map((img) =>
          waitForImage(img).then(() => {
            settled.add(img);
            onProgress?.(settled.size, current.length);
          }),
        ),
      );
    }

    if (current.length === previousTotal && unsettled.length === 0) {
      stableRounds++;
      if (stableRounds >= STABLE_ROUNDS_REQUIRED) break;
    } else {
      stableRounds = 0;
    }
    previousTotal = current.length;

    await nextFrame();
  }
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
 * Captures top-level `[data-export-section]` children of `container` as
 * independent canvases, in document order — each is a wholly separate image
 * (no stitching/stacking), so a multi-section export never cuts a card in
 * half at a boundary.
 *
 * `sectionIds`, when given, captures only the matching sections instead of
 * every section in the tree — the single-tab quick export uses this so it
 * doesn't wait on the other seven hidden sections' artwork to finish
 * loading. Omit it to capture everything (the "export all tabs" flow).
 *
 * Each section fully settles its own images (reporting progress via
 * `onImageProgress`) before it's captured and before moving to the next
 * section — sequential rather than "wait for everything, then capture
 * everything", so a multi-section export never has all N sections' worth of
 * images loading at once, and progress numbers stay meaningful per section.
 */
export async function captureReportSections(
  container: HTMLElement,
  onSectionProgress?: (done: number, total: number, label: string) => void,
  sectionIds?: readonly string[],
  onImageProgress?: (done: number, total: number, label: string) => void,
): Promise<CapturedSection[]> {
  await waitForFonts();

  const allSectionEls = Array.from(container.querySelectorAll<HTMLElement>('[data-export-section]'));
  const sectionEls = sectionIds
    ? allSectionEls.filter((el) => sectionIds.includes(el.dataset.exportSection ?? ''))
    : allSectionEls;

  if (sectionEls.length === 0) {
    throw new Error('No exportable content found (missing data-export-section)');
  }

  const results: CapturedSection[] = [];
  for (let i = 0; i < sectionEls.length; i++) {
    const el = sectionEls[i];
    const key = el.dataset.exportSection ?? String(i);
    const label = el.dataset.exportLabel ?? key;

    await waitForImagesToSettle(el, (done, total) => onImageProgress?.(done, total, label));

    onSectionProgress?.(i, sectionEls.length, label);
    results.push({ key, label, canvas: await captureElement(el) });
  }
  onSectionProgress?.(sectionEls.length, sectionEls.length, '');

  return results;
}
