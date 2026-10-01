import { useRef, useCallback } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  maxDuration?: number;
  angleRatio?: number;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 28,
  maxDuration = 550,
  angleRatio = 1.15,
}: SwipeGestureOptions) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const target = e.target as HTMLElement;

    // Ignore text inputs, textareas, sliders, and explicit no-swipe elements
    if (
      target.closest(
        'input, textarea, select, [role="dialog"], [data-no-swipe="true"]'
      )
    ) {
      return;
    }

    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      if (e.changedTouches.length !== 1) return;

      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
      const duration = Date.now() - touchStartRef.current.time;
      touchStartRef.current = null;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Must be a clear horizontal swipe within time limit
      if (duration <= maxDuration && absX >= threshold && absX > absY * angleRatio) {
        if (deltaX < 0 && onSwipeLeft) {
          try {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(10);
            }
          } catch {}
          onSwipeLeft();
        } else if (deltaX > 0 && onSwipeRight) {
          try {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(10);
            }
          } catch {}
          onSwipeRight();
        }
      }
    },
    [onSwipeLeft, onSwipeRight, threshold, maxDuration, angleRatio]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}
