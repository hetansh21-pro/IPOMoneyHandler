'use client';

import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';

export interface TabOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
  badge?: string;
}

interface SlidingSegmentedTabsProps<T extends string = string> {
  tabs: readonly TabOption<T>[] | TabOption<T>[];
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
  variant?: 'equal' | 'scrollable';
  size?: 'sm' | 'md' | 'lg';
  pillVariant?: 'card' | 'solid';
  activeColor?: 'emerald' | 'indigo' | 'purple';
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function SlidingSegmentedTabs<T extends string = string>({
  tabs,
  activeId,
  onChange,
  className = '',
  variant = 'equal',
  size = 'md',
  pillVariant = 'solid',
  activeColor = 'emerald',
}: SlidingSegmentedTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [scrollPillStyle, setScrollPillStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === activeId));

  // Update measurement for scrollable tabs
  const updateScrollPill = () => {
    if (variant !== 'scrollable') return;
    const currentTabEl = tabRefs.current[activeId];
    const containerEl = containerRef.current;
    if (currentTabEl && containerEl) {
      const tabRect = currentTabEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      setScrollPillStyle({
        left: currentTabEl.offsetLeft,
        width: currentTabEl.offsetWidth,
      });

      const scrollLeft = currentTabEl.offsetLeft - containerRect.width / 2 + tabRect.width / 2;
      containerEl.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  useIsomorphicLayoutEffect(() => {
    updateScrollPill();
    const timer = setTimeout(updateScrollPill, 50);
    return () => clearTimeout(timer);
  }, [activeId, tabs, variant]);

  useEffect(() => {
    window.addEventListener('resize', updateScrollPill);
    return () => window.removeEventListener('resize', updateScrollPill);
  }, [activeId, tabs, variant]);

  const activePillBg =
    pillVariant === 'card'
      ? 'bg-white dark:bg-slate-800 shadow-xs border border-slate-200/80 dark:border-slate-700/80'
      : activeColor === 'indigo'
      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-md shadow-indigo-600/25'
      : activeColor === 'purple'
      ? 'bg-gradient-to-r from-purple-600 to-purple-500 shadow-md shadow-purple-600/25'
      : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md shadow-emerald-600/30';

  const sizeClasses =
    size === 'sm'
      ? 'py-1 px-2.5 text-[11px]'
      : size === 'lg'
      ? 'py-2.5 px-4 text-sm'
      : 'py-1.5 px-3 text-xs';

  const widthPct = tabs.length > 0 ? 100 / tabs.length : 100;
  const leftPct = activeIndex * widthPct;

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 select-none ${
        variant === 'scrollable'
          ? 'overflow-x-auto scrollbar-none space-x-1'
          : 'w-full justify-between'
      } ${className}`}
    >
      {/* Smooth Sliding Pill Indicator */}
      {variant === 'equal' ? (
        <div
          className="absolute inset-y-0 left-0 p-0.5 pointer-events-none transition-transform duration-250 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform"
          style={{
            width: `${widthPct}%`,
            transform: `translate3d(${activeIndex * 100}%, 0, 0)`,
          }}
        >
          <div className={`w-full h-full rounded-lg ${activePillBg}`} />
        </div>
      ) : (
        <div
          className={`absolute top-0.5 bottom-0.5 rounded-lg transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform pointer-events-none ${activePillBg}`}
          style={{
            left: `${scrollPillStyle.left}px`,
            width: `${scrollPillStyle.width}px`,
            opacity: scrollPillStyle.width > 0 ? 1 : 0,
          }}
        />
      )}

      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeId === tab.id;

        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative z-10 flex items-center justify-center font-bold whitespace-nowrap rounded-lg transition-colors duration-200 cursor-pointer touch-manipulation active:scale-95 ${
              variant === 'equal' ? 'flex-1' : 'shrink-0'
            } ${sizeClasses} ${
              isActive
                ? pillVariant === 'solid'
                  ? 'text-white font-extrabold drop-shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {Icon && (
              <Icon
                className={`mr-1.5 transition-transform duration-200 ${
                  size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'
                } ${isActive ? 'scale-105 stroke-[2.5]' : ''}`}
              />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded-md text-[10px] font-extrabold transition-colors ${
                  isActive
                    ? pillVariant === 'solid'
                      ? 'bg-white/25 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span className="ml-1 text-[10px]">{tab.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
