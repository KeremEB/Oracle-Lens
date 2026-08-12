import { useEffect, type RefObject } from 'react';

// Ctrl+scroll over a grid adjusts card density instead of the browser's
// native page/pinch zoom — preventDefault on the wheel event suppresses
// both, so scrolling the page while holding Ctrl is also blocked, as intended.
export function useCtrlScrollDensity(
  ref: RefObject<HTMLElement | null>,
  onAdjust: (direction: 1 | -1) => void,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleWheel = (event: WheelEvent): void => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      onAdjust(event.deltaY > 0 ? -1 : 1);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [ref, onAdjust]);
}
