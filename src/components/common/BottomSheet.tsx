'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string;
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
  const [isClosing, setIsClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const currentDragY = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset states when opening
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setDragY(0);
      setIsDragging(false);
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);

  const handleSmoothClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setDragY(0);
    }, 190);
  }, [onClose]);

  // Touch / Pointer Handlers for Swipe Down to Dismiss
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartY.current = clientY;
    touchStartTime.current = Date.now();
    currentDragY.current = 0;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = clientY - touchStartY.current;

    // Only allow downward drag (with slight rubberband if dragged upward)
    if (delta > 0) {
      currentDragY.current = delta;
      setDragY(delta);
    } else {
      currentDragY.current = delta * 0.2;
      setDragY(delta * 0.2);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const delta = currentDragY.current;
    const elapsed = Math.max(1, Date.now() - touchStartTime.current);
    const velocity = delta / elapsed; // px per ms

    // Close if dragged down more than 80px or swiped fast downward
    if (delta > 80 || velocity > 0.4) {
      handleSmoothClose();
    } else {
      // Snap back to open position with smooth spring
      setDragY(0);
      currentDragY.current = 0;
    }
  };

  if (!isOpen || !mounted) return null;

  // Calculate dynamic backdrop opacity based on drag distance
  const backdropOpacity = Math.max(0.1, Math.min(1, 1 - dragY / 300));

  const content = (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center pointer-events-auto">
      {/* Backdrop with dynamic fade on drag & close */}
      <div
        className={`absolute inset-0 bg-slate-950/60 transition-opacity duration-200 ${
          isClosing ? 'animate-fade-out' : 'animate-fade-in'
        }`}
        style={{ opacity: isDragging ? backdropOpacity : undefined }}
        onClick={handleSmoothClose}
      />

      {/* Sheet Container with Fluid Touch Drag */}
      <div
        ref={sheetRef}
        style={{
          transform: isClosing
            ? 'translate3d(0, 100%, 0)'
            : isDragging
            ? `translate3d(0, ${Math.max(0, dragY)}px, 0)`
            : 'translate3d(0, 0, 0)',
          transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`relative w-full md:max-w-[430px] bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.25)] flex flex-col ${maxHeight} z-10 overflow-hidden mb-0 select-none will-change-transform gpu-accelerated`}
      >
        {/* Drag Handle Area (Grab Area) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          className="flex flex-col items-center justify-center pt-3.5 pb-2 px-4 cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 rounded-full transition-colors" />
        </div>

        {/* Header (Also supports swipe down to close) */}
        {(title || subtitle) && (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0f172a] sticky top-0 z-10 shrink-0 select-none"
          >
            <div>
              {title && <h2 className="text-base font-extrabold text-[#0f172a] dark:text-slate-100">{title}</h2>}
              {subtitle && <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={handleSmoothClose}
              className="p-2 rounded-full text-[#94a3b8] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-90"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div ref={scrollRef} className="p-5 pb-24 overflow-y-auto flex-1 overscroll-contain text-[#0f172a] dark:text-slate-100">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
