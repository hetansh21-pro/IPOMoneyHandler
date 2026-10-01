'use client';

import { useEffect, useRef, useId } from 'react';
import { registerGlobalBackHandler } from '@/lib/navigation/backNavigation';

/**
 * Declarative hook to register a back action handler when active.
 * Uses a ref for the handler to prevent unnecessary re-registrations or re-renders.
 */
export function useBackHandler(active: boolean, handler: () => boolean | void) {
  const autoId = useId();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!active) return;

    return registerGlobalBackHandler(autoId, () => {
      const res = handlerRef.current();
      return res !== false;
    });
  }, [active, autoId]);
}
