'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useBackHandler } from '@/lib/hooks/useBackHandler';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string;
  defaultExpanded?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = 'max-h-[85vh]',
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isDraggingRef = useRef(false);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const currentDragY = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle open/close state transitions smoothly
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
      // Trigger entrance animation on next frame
      const frame = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(frame);
    } else if (shouldRender) {
      // Trigger exit animation smoothly
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  const handleSmoothClose = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 280ms cubic-bezier(0.2, 0.9, 0.25, 1)';
      sheetRef.current.style.transform = 'translate3d(0, 100%, 0)';
    }
    if (backdropRef.current) {
      backdropRef.current.style.transition = 'opacity 280ms cubic-bezier(0.2, 0.9, 0.25, 1)';
      backdropRef.current.style.opacity = '0';
    }
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      setShouldRender(false);
    }, 280);
    return true;
  }, [onClose]);

  // Intercept back button when BottomSheet is open
  useBackHandler(isOpen && shouldRender, handleSmoothClose);

  // High-performance direct-DOM touch handlers (Zero React re-renders during dragging)
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartY.current = clientY;
    touchStartTime.current = Date.now();
    currentDragY.current = 0;
    isDraggingRef.current = true;

    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }
    if (backdropRef.current) {
      backdropRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = clientY - touchStartY.current;
    
    // Allow dragging downwards or slight resistance upwards
    const clampedDelta = delta < 0 ? delta * 0.2 : delta;
    currentDragY.current = delta;

    if (sheetRef.current) {
      sheetRef.current.style.transform = `translate3d(0, ${Math.max(0, clampedDelta)}px, 0)`;
    }
    if (backdropRef.current && delta > 0) {
      const opacity = Math.max(0.1, 1 - delta / 350);
      backdropRef.current.style.opacity = String(opacity);
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const delta = currentDragY.current;
    const elapsed = Math.max(1, Date.now() - touchStartTime.current);
    const velocity = delta / elapsed; // px per ms
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const threshold = screenHeight * 0.16;

    // Fast downward flick or dragged down past threshold -> Close
    if ((velocity > 0.28 && delta > 25) || delta >= threshold) {
      handleSmoothClose();
      return;
    }

    // Otherwise smoothly snap back to open position
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 260ms cubic-bezier(0.2, 0.9, 0.25, 1)';
      sheetRef.current.style.transform = 'translate3d(0, 0, 0)';
    }
    if (backdropRef.current) {
      backdropRef.current.style.transition = 'opacity 260ms cubic-bezier(0.2, 0.9, 0.25, 1)';
      backdropRef.current.style.opacity = '1';
    }
    currentDragY.current = 0;
  };

  if (!shouldRender || !mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center pointer-events-auto select-none">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 300ms cubic-bezier(0.2, 0.9, 0.25, 1)',
        }}
        className="absolute inset-0 bg-black/60 will-change-[opacity]"
        onClick={handleSmoothClose}
      />

      {/* Sheet Container with Fluid Touch Drag and Slide In/Out */}
      <div
        ref={sheetRef}
        style={{
          transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100%, 0)',
          transition: 'transform 300ms cubic-bezier(0.2, 0.9, 0.25, 1)',
        }}
        className={`relative w-full md:max-w-[430px] bg-white dark:bg-[#0b1120] border-t border-slate-200/80 dark:border-white/10 rounded-t-[36px] shadow-[0_-12px_45px_rgba(0,0,0,0.3)] flex flex-col z-10 overflow-hidden mb-0 select-none will-change-transform ${maxHeight}`}
      >
        {/* Drag Handle Area */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          className="flex flex-col items-center justify-center pt-3 pb-1.5 px-4 cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
        >
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 rounded-full transition-colors" />
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="px-5 py-2 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white/95 dark:bg-[#0b1120]/95 sticky top-0 z-10 shrink-0 select-none"
          >
            <div>
              {title && <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{title}</h2>}
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[280px] mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSmoothClose();
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-90"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div
          ref={scrollRef}
          className="p-5 pb-24 overflow-y-auto flex-1 overscroll-contain text-slate-900 dark:text-white"
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
