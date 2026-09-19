'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import {
  Home,
  Wallet,
  TrendingUp,
  Receipt,
  Menu,
  Plus,
  Lock,
} from 'lucide-react';
import { PinLockModal } from '../common/PinLockModal';
import { OnboardingModal } from '../common/OnboardingModal';
import { QuickActionModal } from '../common/QuickActionModal';
import { AppSkeletonLoader } from '../common/AppSkeletonLoader';
import { applyThemeToDOM } from '@/lib/store/useAppStore';

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  const {
    isHydrated,
    themeMode,
    setThemeMode,
    activeTab,
    activeIpoSubTab,
    activeAccountFilter,
    setActiveTab,
    quickActionOpen,
    selectedAccountDetailId,
    selectedIPODetailId,
    selectedAppDetailId,
    setQuickActionOpen,
    pin,
    lockApp,
    init,
    fetchLiveIPOs,
    recordUserActivity,
  } = useAppStore();

  const mainRef = React.useRef<HTMLElement>(null);

  // Scroll to top whenever entering a new page or sub-tab
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab, activeIpoSubTab, activeAccountFilter]);

  useEffect(() => {
    init();
    fetchLiveIPOs(true);

    // Auto re-check and verify whenever app comes into focus
    const handleFocus = () => {
      fetchLiveIPOs(false);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [init, fetchLiveIPOs]);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'ipos', label: 'IPOs', icon: TrendingUp },
    { id: 'transactions', label: 'Activity', icon: Receipt },
    { id: 'more', label: 'More', icon: Menu },
  ] as const;

  return (
    <div className="min-h-screen h-[100dvh] w-full bg-[#f8fafc] dark:bg-[#020617] md:bg-[#f1f5f9] md:dark:bg-[#020617] flex flex-col items-center justify-start md:py-6 md:px-4 text-[#0f172a] dark:text-[#f8fafc] overflow-x-hidden transition-colors duration-200">
      {/* Phone Frame Wrapper on Desktop, 100% Full Screen Edge-to-Edge on Mobile */}
      <div className="w-full md:max-w-[430px] h-full min-h-screen md:min-h-[880px] md:max-h-[92vh] bg-[#f8fafc] dark:bg-[#0b1120] flex flex-col relative md:rounded-[40px] md:border-[8px] md:border-[#0f172a] md:dark:border-slate-800 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] overflow-hidden transition-colors duration-200">
        {/* Compact Top Status Bar Strip (Adapts to System Dark / Light Theme) */}
        <div className="w-full bg-slate-200/80 dark:bg-[#020617] h-[max(env(safe-area-inset-top),6px)] md:h-1.5 shrink-0 z-50 border-b border-slate-300/40 dark:border-slate-800/80 transition-colors duration-200" />

        {/* Modals & Overlays */}
        <PinLockModal />
        <QuickActionModal />

        {/* Top Status Bar & App Header (Enlarged & Prominent) */}
        <header className="sticky top-0 z-20 bg-white dark:bg-[#0f172a] px-4 py-3.5 border-b border-[#e2e8f0] dark:border-slate-800 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-colors duration-200">
          <div className="flex items-center space-x-3">
            <img
              src="/app-logo.png"
              alt="IPO Money Handler Logo"
              className="w-10 h-10 min-w-[40px] max-w-[40px] object-contain shrink-0 rounded-2xl drop-shadow-sm"
            />
            <div>
              <span className="text-[13px] md:text-sm font-black tracking-tight text-[#0f172a] dark:text-slate-100 uppercase leading-tight block">
                IPO & Money Handler
              </span>
              <div className="flex items-center space-x-1.5 text-[11px] text-[#64748b] dark:text-slate-400 font-medium mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <span>Private & Offline Ledger</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {pin && (
              <button
                onClick={lockApp}
                className="w-9 h-9 rounded-xl bg-[#f8fafc] dark:bg-slate-800 hover:bg-[#f1f5f9] dark:hover:bg-slate-700 border border-[#e2e8f0] dark:border-slate-700 text-[#64748b] dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title="Lock Application"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setQuickActionOpen(true)}
              className="w-9 h-9 rounded-xl bg-[#059669] hover:bg-[#047857] text-white flex items-center justify-center shadow-md shadow-[#059669]/30 active:scale-95 transition-all cursor-pointer"
              title="Quick Add & Actions"
              aria-label="Add"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </header>

        {/* Main View Area with full height & scroll padding */}
        <main ref={mainRef} className="flex-1 px-4 pt-4 pb-[calc(max(env(safe-area-inset-bottom),14px)+4.5rem)] overflow-y-auto bg-[#f8fafc] dark:bg-[#0b1120] z-0 transition-colors duration-200">
          {!isHydrated ? <AppSkeletonLoader /> : children}
        </main>

        {/* Mobile Fixed Bottom Navigation Bar (Edge-to-Edge Safe-Area Aware) */}
        <nav className="fixed md:absolute bottom-0 left-0 right-0 w-full md:max-w-[430px] mx-auto z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-lg border-t border-[#e2e8f0] dark:border-slate-800 pt-2 pb-[max(env(safe-area-inset-bottom),12px)] px-3 flex justify-around items-center shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.4)] md:rounded-b-[32px] pointer-events-auto transition-colors duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer touch-manipulation select-none active:scale-95 ${
                  isActive
                    ? 'text-[#059669] dark:text-emerald-400 font-bold scale-105'
                    : 'text-[#94a3b8] dark:text-slate-400 hover:text-[#475569] dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-1 font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
