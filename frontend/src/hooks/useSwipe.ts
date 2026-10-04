import { useEffect, useRef, type RefObject } from 'react';

interface SwipeOptions {
  onNext: () => void;
  onPrev: () => void;
  enabled: boolean;
  containerRef: RefObject<HTMLElement | null>;
}

export function useSwipe({ onNext, onPrev, enabled, containerRef }: SwipeOptions) {
  const stateRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    horizontal: boolean | null;
  } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const onStart = (e: TouchEvent) => {
      stateRef.current = null;
      if (e.touches.length !== 1) return;
      if (e.target instanceof Element && e.target.closest('button, a, input, label, textarea, select, [role="button"], [data-no-swipe]')) return;
      const touch = e.touches[0];
      stateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        horizontal: null,
      };
    };

    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        stateRef.current = null;
        return;
      }
      const s = stateRef.current;
      if (!s) return;
      const touch = e.touches[0];
      const dx = touch.clientX - s.startX;
      const dy = touch.clientY - s.startY;
      if (s.horizontal === null) {
        s.horizontal = Math.abs(dx) > Math.abs(dy);
      }
    };

    const onEnd = (e: TouchEvent) => {
      const s = stateRef.current;
      stateRef.current = null;
      if (!s || e.touches.length !== 0 || !e.changedTouches[0]) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - s.startX;
      const dt = Math.max(1, Date.now() - s.startTime);
      const velocity = Math.abs(dx) / dt;
      if (s.horizontal && (Math.abs(dx) > 50 || velocity > 0.3)) {
        if (dx < 0) onNext();
        else onPrev();
      }
    };
    const onCancel = () => { stateRef.current = null; };

    container.addEventListener('touchstart', onStart, { passive: true });
    container.addEventListener('touchmove', onMove, { passive: true });
    container.addEventListener('touchend', onEnd, { passive: true });
    container.addEventListener('touchcancel', onCancel, { passive: true });

    return () => {
      stateRef.current = null;
      container.removeEventListener('touchstart', onStart);
      container.removeEventListener('touchmove', onMove);
      container.removeEventListener('touchend', onEnd);
      container.removeEventListener('touchcancel', onCancel);
    };
  }, [enabled, containerRef, onNext, onPrev]);
}
