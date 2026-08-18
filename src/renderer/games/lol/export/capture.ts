// html2canvas-pro, not html2canvas: Tailwind v4's default palette is defined
// in oklch(), and stock html2canvas's CSS color parser throws
// ("unsupported color function oklch") on any computed color that comes back
// in a modern color-function syntax. html2canvas-pro is a maintained fork
// whose whole reason to exist is oklch/oklab/lch/lab/color() support — same
// API, so this is the only line that needed to change.
import html2canvas from 'html2canvas-pro';
import { canvasToPngBytes } from './buildFile';

/** Physical-pixel multiplier for captures — 2x for a retina-sharp result. */
export const CAPTURE_SCALE = 2;

// Chromium's canvas 2D backend silently fails to encode (canvas.toBlob()
// resolves with `null` instead of throwing — see buildFile.ts's
// canvasToPngBytes, and "Canvas failed to encode as PNG" in the wild) once a
// canvas exceeds its real size limits: commonly cited as ~16384px on a side
// and a ~268,435,456px² (16384²) total area, though the actual enforced
// limit is GPU/driver-dependent and can be lower on some hardware — this bit
// large accounts (500+ skins, 300+ champions) even though the computed
// canvas stayed under the textbook Chromium ceiling. The thresholds below
// are deliberately conservative — well under that ceiling — so there's real
// margin for hardware that caps lower. See captureElementSafely.
const SAFE_MAX_DIMENSION_PX = 8192;
const SAFE_MAX_AREA_PX = 100_000_000;

// Tier-2 fallback (see captureElementSafely): shrink the section's own CSS
// width in bounded steps, letting its grid wrap into more rows instead —
// same "give up width, not legibility" trade the user asked for. Floor
// stays well above MIN_COLUMNS-territory (~4 cards wide) so a section never
// gets absurdly narrow.
const MIN_SHRINK_WIDTH_PX = 800;
const WIDTH_SHRINK_FACTOR = 0.75;
const MAX_SHRINK_ITERATIONS = 5;

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

export interface ImageReadiness {
  /** Ground truth for "html2canvas has real pixels to paint" — re-verified after waiting, not assumed from decode()/load succeeding. */
  ready: boolean;
  timedOut: boolean;
}

/**
 * Resolves once `img` has real pixel data to paint, or has definitively
 * failed/timed out — never rejects, so one broken image never aborts an
 * export.
 *
 * Readiness is `complete && naturalWidth > 0`, checked fresh after waiting
 * rather than trusted from decode()/load having fired: an image restored
 * from the browser's own image cache frequently does NOT dispatch a new
 * 'load' event at all (no network activity occurs, so nothing triggers it),
 * and — separately — `decode()` resolving does not always mean
 * `naturalWidth` is synchronously queryable in the same tick on every
 * engine. If a fresh check right after decode()/load still comes back not
 * ready and we haven't timed out, one more paint frame is given before
 * giving up — cheap, bounded, and covers that specific timing gap without
 * re-running the full 8s wait.
 */
function waitForImage(img: HTMLImageElement): Promise<ImageReadiness> {
  const check = (): boolean => img.complete && img.naturalWidth > 0;
  if (check()) return Promise.resolve({ ready: true, timedOut: false });

  let timedOut = false;
  const timeout = new Promise<void>((resolve) => {
    setTimeout(() => {
      timedOut = true;
      resolve();
    }, IMAGE_TIMEOUT_MS);
  });

  const settle: Promise<void> =
    typeof img.decode === 'function'
      ? img.decode().catch(() => undefined)
      : new Promise((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        });

  return Promise.race([settle, timeout]).then(async () => {
    if (check()) return { ready: true, timedOut };
    if (timedOut) return { ready: false, timedOut: true };
    await nextFrame();
    return { ready: check(), timedOut: false };
  });
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
 *
 * NOTE: this is here to guarantee a capture never runs against a half-built
 * DOM (e.g. an export fired moments after the data lands). It is NOT what
 * caused the long-standing "half the cards export blank" bug — that was
 * html2canvas's own image cache evicting entries, see MAX_IMAGE_CACHE_SIZE
 * above. Measurement on a real account found the DOM already at 572/572
 * images loaded while 398 cards still captured blank, so don't reach for
 * more waiting here if blank cards ever reappear.
 */
async function waitForImagesToSettle(
  container: HTMLElement,
  sectionLabel: string,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const results = new Map<HTMLImageElement, ImageReadiness>();
  const deadline = Date.now() + MAX_SETTLE_WAIT_MS;
  let stableRounds = 0;
  let previousTotal = -1;

  while (Date.now() < deadline) {
    const current = Array.from(container.querySelectorAll('img'));
    // Re-check anything not yet confirmed ready — including images that
    // came back not-ready-but-not-timed-out on a previous round, since
    // that's specifically the "needs one more frame" case waitForImage
    // already gives one retry for; letting the outer loop's own next round
    // effectively give it another doesn't cost anything for images that
    // ARE already ready (the check() fast path is synchronous).
    const toCheck = current.filter((img) => results.get(img)?.ready !== true);

    if (toCheck.length > 0) {
      await Promise.all(
        toCheck.map((img) =>
          waitForImage(img).then((result) => {
            results.set(img, result);
            const readyCount = [...results.values()].filter((r) => r.ready).length;
            onProgress?.(readyCount, current.length);
          }),
        ),
      );
    }

    const stillPending = current.some((img) => {
      const result = results.get(img);
      return !result?.ready && !result?.timedOut;
    });

    if (current.length === previousTotal && !stillPending) {
      stableRounds++;
      if (stableRounds >= STABLE_ROUNDS_REQUIRED) break;
    } else {
      stableRounds = 0;
    }
    previousTotal = current.length;

    await nextFrame();
  }

  const failed = [...results.entries()].filter(([, result]) => !result.ready);
  const readyCount = results.size - failed.length;
  console.info(`[export] ${sectionLabel}: ${readyCount}/${results.size} images ready for capture`);
  if (failed.length > 0) {
    console.warn(
      `[export] ${sectionLabel}: ${failed.length} image(s) not ready — will be captured as-is (blank/placeholder area), export continues:`,
      failed.map(([img, result]) => ({
        src: img.src.length > 100 ? `${img.src.slice(0, 100)}…` : img.src,
        timedOut: result.timedOut,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
      })),
    );
  }
}

async function waitForFonts(): Promise<void> {
  if (!('fonts' in document)) return;
  await Promise.race([
    document.fonts.ready.then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, FONT_TIMEOUT_MS)),
  ]);
}

// html2canvas-pro keeps its OWN image cache, separate from the DOM, and
// evicts LRU-style once it exceeds `maxCacheSize` — which defaults to just
// 100. Any section with more than 100 distinct image srcs therefore has its
// earliest images evicted before the draw pass reaches them, and those cards
// paint blank even though every <img> in the DOM is fully loaded.
//
// This was measured, not guessed: on a real account, Emotes had 141 unique
// srcs and exactly 41 blank cards (141 - 100), Profile Icons 216 unique and
// exactly 116 blank (216 - 100), while Ward Skins (31 unique, under the
// limit) had zero — which is why that one tab always looked correct. Raising
// the ceiling took all four affected sections to zero blanks with no
// measurable capture-time cost.
//
// 10000 is the highest value html2canvas-pro accepts without warning (it
// warns only above 1e4) and is far beyond any realistic collection size.
// The entries are references to images already held in memory as data URLs
// by the DOM itself, so this doesn't meaningfully add to peak memory.
const MAX_IMAGE_CACHE_SIZE = 10000;

async function captureElement(el: HTMLElement, scale: number): Promise<HTMLCanvasElement> {
  // Matches the element's own rendered background rather than a hardcoded
  // guess, so a capture never shows a stray white/transparent edge.
  const backgroundColor = getComputedStyle(el).backgroundColor || '#171717';
  return html2canvas(el, {
    scale,
    backgroundColor,
    logging: false,
    maxCacheSize: MAX_IMAGE_CACHE_SIZE,
  });
}

interface CaptureDimensions {
  cssWidth: number;
  cssHeight: number;
  physicalWidth: number;
  physicalHeight: number;
  area: number;
}

function measure(el: HTMLElement, scale: number): CaptureDimensions {
  const rect = el.getBoundingClientRect();
  const physicalWidth = rect.width * scale;
  const physicalHeight = rect.height * scale;
  return {
    cssWidth: rect.width,
    cssHeight: rect.height,
    physicalWidth,
    physicalHeight,
    area: physicalWidth * physicalHeight,
  };
}

function isSafeToEncode(dims: CaptureDimensions): boolean {
  return (
    dims.physicalWidth <= SAFE_MAX_DIMENSION_PX &&
    dims.physicalHeight <= SAFE_MAX_DIMENSION_PX &&
    dims.area <= SAFE_MAX_AREA_PX
  );
}

/**
 * Captures `el` and encodes it straight to PNG bytes, automatically
 * degrading quality rather than letting "Canvas failed to encode as PNG"
 * reach the user — large accounts (500+ skins, 300+ champions) can produce
 * canvases past Chromium's real-world size limits (see SAFE_MAX_DIMENSION_PX
 * / SAFE_MAX_AREA_PX above). Three escalating tiers, cheapest first:
 *
 *   1. Measure at the normal 2x capture scale. If that's already safe,
 *      nothing changes.
 *   2. Drop to 1x scale and re-measure.
 *   3. Still unsafe at 1x (the section's CSS size itself is too large, not
 *      just the scale) — shrink the section's own width in bounded steps,
 *      which forces its grid to wrap into more rows instead of running
 *      wider (same "give up width, not card size" trade as everywhere
 *      else in export). Mutates `el.style.width` directly, which is safe
 *      here because these are off-screen, capture-only elements (see
 *      ExportCaptureTree's doc comment) — always restored in `finally`.
 *
 * If encoding still somehow fails after all three tiers (the real
 * GPU/driver limit turned out lower than our own conservative thresholds),
 * one last retry at half the scale is attempted before finally giving up —
 * by that point failure should be practically impossible for any real
 * account.
 *
 * `degraded` tells the caller whether any of this actually fired, so the UI
 * can surface a "reduced quality" note instead of a silently smaller image.
 */
async function captureElementSafely(
  el: HTMLElement,
  sectionLabel: string,
): Promise<{ bytes: Uint8Array; degraded: boolean }> {
  const originalWidth = el.style.width;

  try {
    let scale = CAPTURE_SCALE;
    let degraded = false;
    let dims = measure(el, scale);

    if (!isSafeToEncode(dims)) {
      scale = 1;
      degraded = true;
      dims = measure(el, scale);
    }

    let iterations = 0;
    while (!isSafeToEncode(dims) && iterations < MAX_SHRINK_ITERATIONS) {
      const nextWidth = Math.max(MIN_SHRINK_WIDTH_PX, dims.cssWidth * WIDTH_SHRINK_FACTOR);
      if (nextWidth >= dims.cssWidth) break; // floor already reached, no point looping further
      el.style.width = `${nextWidth}px`;
      await nextFrame();
      degraded = true;
      dims = measure(el, scale);
      iterations++;
    }

    if (!isSafeToEncode(dims)) {
      console.warn(
        `[export] ${sectionLabel}: still over the safe canvas size after every automatic downgrade (${Math.round(dims.physicalWidth)}x${Math.round(dims.physicalHeight)}) — attempting capture anyway`,
      );
    }

    console.info(
      `[export] ${sectionLabel}: capturing at scale ${scale} -> ${Math.round(dims.physicalWidth)}x${Math.round(dims.physicalHeight)} = ${Math.round(dims.area).toLocaleString('en-US')}px²${degraded ? ' (auto-reduced)' : ''}`,
    );

    try {
      const canvas = await captureElement(el, scale);
      const bytes = await canvasToPngBytes(canvas);
      return { bytes, degraded };
    } catch (err) {
      console.warn(
        `[export] ${sectionLabel}: capture/encode failed at scale ${scale} despite passing size checks, retrying at half scale:`,
        err,
      );
      const fallbackScale = Math.max(0.5, scale / 2);
      const canvas = await captureElement(el, fallbackScale);
      const bytes = await canvasToPngBytes(canvas);
      return { bytes, degraded: true };
    }
  } finally {
    // Always restore, success or failure — this element stays mounted for
    // the app's whole session (see ExportCaptureTree), so a later export
    // must start from the real intended width, not whatever a previous
    // export shrank it to.
    el.style.width = originalWidth;
  }
}

export interface CapturedSection {
  key: string;
  label: string;
  pngBytes: Uint8Array;
  /** Whether this section's quality was automatically reduced to stay under Chromium's canvas size limits — see captureElementSafely. */
  degraded: boolean;
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

    await waitForImagesToSettle(el, label, (done, total) => onImageProgress?.(done, total, label));

    onSectionProgress?.(i, sectionEls.length, label);
    const { bytes, degraded } = await captureElementSafely(el, label);
    results.push({ key, label, pngBytes: bytes, degraded });
  }
  onSectionProgress?.(sectionEls.length, sectionEls.length, '');

  return results;
}
