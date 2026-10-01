'use client';

import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { Users, Plus } from 'lucide-react';

const RELATION_ICONS: Record<string, string> = {
  Self: '👤',
  Father: '👨',
  Mother: '👩',
  Brother: '👦',
  Sister: '👧',
  Spouse: '💍',
  Son: '🧒',
  Daughter: '👧',
  Other: '👤',
};

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function FamilyProfileSwitcher() {
  const {
    familyMembers,
    activeMemberId,
    setActiveMemberId,
    setIsFamilyModalOpen,
  } = useAppStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const handleSelectMember = (id: string | 'all') => {
    if (activeMemberId === id) return;
    setActiveMemberId(id);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
  };

  const updateIndicator = () => {
    const currentTabEl = tabRefs.current[activeMemberId];
    const containerEl = containerRef.current;
    if (currentTabEl && containerEl) {
      const tabRect = currentTabEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();

      setIndicatorStyle({
        left: currentTabEl.offsetLeft,
        width: currentTabEl.offsetWidth,
        opacity: 1,
      });

      // Smoothly scroll active tab into view if partially hidden
      const scrollLeft = currentTabEl.offsetLeft - containerRect.width / 2 + tabRect.width / 2;
      containerEl.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  useIsomorphicLayoutEffect(() => {
    updateIndicator();
    const timer = setTimeout(updateIndicator, 40);
    return () => clearTimeout(timer);
  }, [activeMemberId, familyMembers]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeMemberId, familyMembers]);

  return (
    <div className="w-full select-none relative pt-0">
      {/* Scrollable Tab Container */}
      <div
        ref={containerRef}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar scrollbar-none scroll-smooth relative [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1"
      >
        {/* Sliding Single Green Dot Indicator */}
        <div
          className="absolute bottom-0 left-0 w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 pointer-events-none will-change-transform z-10 shadow-[0_1px_4px_rgba(5,150,105,0.4)] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.2,0.9,0.2,1)]"
          style={{
            transform: `translate3d(${indicatorStyle.left + indicatorStyle.width / 2 - 3}px, 0, 0)`,
            opacity: indicatorStyle.opacity,
          }}
        />

        {/* All Combined Family Tab */}
        <button
          ref={(el) => {
            tabRefs.current['all'] = el;
          }}
          type="button"
          onClick={() => handleSelectMember('all')}
          className={`flex items-center space-x-1 px-2.5 py-1 text-[13px] transition-colors duration-200 cursor-pointer touch-manipulation select-none shrink-0 font-semibold active:scale-95 ${
            activeMemberId === 'all'
              ? 'text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-slate-400 dark:text-slate-500 font-bold hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Users className={`w-3.5 h-3.5 shrink-0 mr-1 ${activeMemberId === 'all' ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.5]' : 'stroke-2'}`} />
          <span>All</span>
        </button>

        {/* Individual Family Member Tabs (Without Emojis) */}
        {familyMembers.map((member) => {
          const isActive = activeMemberId === member.id;
          const displayName = member.name.replace(/\s*\(Primary\)/i, '');

          return (
            <button
              key={member.id}
              ref={(el) => {
                tabRefs.current[member.id] = el;
              }}
              type="button"
              onClick={() => handleSelectMember(member.id)}
              className={`flex items-center px-2.5 py-1 text-[13px] transition-colors duration-200 cursor-pointer touch-manipulation select-none shrink-0 font-semibold active:scale-95 ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-black'
                  : 'text-slate-400 dark:text-slate-500 font-bold hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <span className="truncate max-w-[100px]">{displayName}</span>
            </button>
          );
        })}

        {/* Minimal Add/Manage Member Trigger */}
        <button
          type="button"
          onClick={() => setIsFamilyModalOpen(true)}
          className="flex items-center justify-center p-1 text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer shrink-0 touch-manipulation active:scale-95 ml-1"
          title="Manage Family Members"
          aria-label="Manage Family"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
}
