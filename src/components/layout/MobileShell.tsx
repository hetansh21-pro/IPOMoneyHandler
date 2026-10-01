'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import {
  Home,
  Wallet,
  TrendingUp,
  Receipt,
  Layers,
  Settings,
  Plus,
  Lock,
  Sun,
  Moon,
  Smartphone,
  Menu,
  History,
  Users,
  ChevronDown,
} from 'lucide-react';
import { PinLockModal } from '../common/PinLockModal';
import { QuickActionModal } from '../common/QuickActionModal';
import { AutoSyncToast } from '../common/AutoSyncToast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ScannedSmsReviewModal } from '../common/ScannedSmsReviewModal';
import { FamilyManagementModal } from '../common/FamilyManagementModal';
import { FamilyProfileSwitcher } from '../common/FamilyProfileSwitcher';
import { HeaderDropdownMenu } from '../common/HeaderDropdownMenu';
import { AppSkeletonLoader } from '../common/AppSkeletonLoader';
import { executeRegisteredBackHandlers } from '@/lib/navigation/backNavigation';

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
    setActiveIpoSubTab,
    setActiveAccountFilter,
    selectedAccountDetailId,
    selectedIPODetailId,
    selectedAppDetailId,
    setSelectedAccountDetailId,
    setSelectedIPODetailId,
    setSelectedAppDetailId,
    setQuickActionOpen,
    pin,
    lockApp,
    init,
    fetchLiveIPOs,
    refreshHoldingsPrices,
    recordUserActivity,
    liveIPOs,
    checkAndFetchNewSmsOnOpen,
    addPendingScannedSms,
    accounts,
    familyMembers,
    activeMemberId,
    setIsFamilyModalOpen,
  } = useAppStore();

  const activeMember = familyMembers.find((m) => m.id === activeMemberId);

  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Global browser & runtime error suppression to prevent Next.js [object Event] toast
  useEffect(() => {
    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation?.();
      console.warn('Suppressed unhandled promise rejection in MobileShell:', e.reason);
    };

    const handleWindowError = (e: ErrorEvent) => {
      if (
        !e.error ||
        e.message === '[object Event]' ||
        (e.target && (e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        e.stopImmediatePropagation?.();
      }
      console.warn('Suppressed window error in MobileShell:', e.message);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
    window.addEventListener('error', handleWindowError, true);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
      window.removeEventListener('error', handleWindowError, true);
    };
  }, []);

  // Handle Back Action: Registered Modal/BottomSheet Handlers -> Detail views -> Subtabs -> Home tab -> Exit confirm
  const handleBackAction = useCallback((): boolean => {
    // 1. Highest Priority: Execute active registered handlers (BottomSheets, Modals, Dialogs, Dropdowns)
    if (executeRegisteredBackHandlers()) {
      return true;
    }
    if (isHeaderMenuOpen) {
      setIsHeaderMenuOpen(false);
      return true;
    }
    if (selectedAccountDetailId) {
      setSelectedAccountDetailId(null);
      return true;
    }
    if (selectedIPODetailId) {
      setSelectedIPODetailId(null);
      return true;
    }
    if (selectedAppDetailId) {
      setSelectedAppDetailId(null);
      return true;
    }
    if (activeAccountFilter !== 'ALL') {
      setActiveAccountFilter('ALL');
      return true;
    }
    if (activeTab === 'ipos' && activeIpoSubTab !== 'LIVE') {
      setActiveIpoSubTab('LIVE');
      return true;
    }
    if (activeTab !== 'home') {
      setActiveTab('home');
      return true;
    }
    return false;
  }, [
    selectedAccountDetailId,
    selectedIPODetailId,
    selectedAppDetailId,
    activeAccountFilter,
    activeTab,
    activeIpoSubTab,
    isHeaderMenuOpen,
    setSelectedAccountDetailId,
    setSelectedIPODetailId,
    setSelectedAppDetailId,
    setActiveAccountFilter,
    setActiveIpoSubTab,
    setActiveTab,
    setIsHeaderMenuOpen,
  ]);

  // Back Navigation: Android Capacitor Hardware Button + Browser Popstate
  useEffect(() => {
    let backListenerHandle: { remove: () => void } | null = null;

    const onBackTriggered = () => {
      if (isExitConfirmOpen) {
        setIsExitConfirmOpen(false);
        return true;
      }
      const handled = handleBackAction();
      if (handled) {
        return true;
      }
      setIsExitConfirmOpen(true);
      return true;
    };

    const setupCapacitorBack = async () => {
      try {
        const { App } = await import('@capacitor/app');
        backListenerHandle = await App.addListener('backButton', () => {
          onBackTriggered();
        });
      } catch {
        // App plugin not active on web
      }
    };

    setupCapacitorBack();

    const handlePopState = () => {
      const handled = onBackTriggered();
      if (handled) {
        window.history.pushState({ app: 'active' }, '');
      }
    };

    if (typeof window !== 'undefined') {
      window.history.replaceState({ app: 'root' }, '');
      window.history.pushState({ app: 'active' }, '');
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      if (backListenerHandle) {
        backListenerHandle.remove();
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handlePopState);
      }
    };
  }, [handleBackAction, isExitConfirmOpen]);

  const handleConfirmExit = async () => {
    setIsExitConfirmOpen(false);
    try {
      const { App } = await import('@capacitor/app');
      await App.exitApp();
    } catch {
      // Browser fallback
    }
  };

  useEffect(() => {
    init();
    fetchLiveIPOs(true);
    refreshHoldingsPrices().catch(() => {});
    checkAndFetchNewSmsOnOpen().catch(() => {});

    // Start Live SMS & Notification background listener
    let stopGlobalSmsSync: (() => void) | null = null;
    if (typeof window !== "undefined") {
      import("@/lib/native/smsPlugin").then(async ({ startGlobalBackgroundSmsSync }) => {
        const sync = await startGlobalBackgroundSmsSync(async (data) => {
          if (!data || !data.body) return;
          const { parseBankSms } = await import("@/lib/finance/smsParser");
          const latestAccounts = useAppStore.getState().accounts;
          const parsed = parseBankSms(
            data.body,
            data.address || "",
            new Date(data.date || Date.now()).toISOString(),
            latestAccounts,
            {
              source: (data.source as 'sms' | 'notification') || (data.packageName ? 'notification' : 'sms'),
              packageName: data.packageName,
            }
          );
          if (parsed) {
            addPendingScannedSms(parsed);
          }
        });
        if (sync.active) {
          stopGlobalSmsSync = sync.stop;
        }
      });
    }

    // Request native permissions & configure status bar on mobile
    if (typeof window !== 'undefined') {
      import('@capacitor/core').then(async ({ Capacitor }) => {
        if (Capacitor.isNativePlatform()) {
          try {
            const { StatusBar, Style } = await import('@capacitor/status-bar');
            const isDark = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
            await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
            await StatusBar.setOverlaysWebView({ overlay: true });
          } catch {}
        }
      });
    }

    const priceInterval = setInterval(() => {
      refreshHoldingsPrices().catch(() => {});
    }, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveIPOs(false);
        refreshHoldingsPrices().catch(() => {});
        checkAndFetchNewSmsOnOpen().catch(() => {});
      }
    };

    const handleUserInteraction = () => {
      recordUserActivity();
    };

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });

    return () => {
      if (stopGlobalSmsSync) {
        stopGlobalSmsSync();
      }
      clearInterval(priceInterval);
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [init, fetchLiveIPOs, refreshHoldingsPrices, recordUserActivity]);

  const openIposCount = liveIPOs.filter((i) => i.status === 'OPEN').length;

  const navItems = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'accounts' as const, label: 'Accounts', icon: Wallet },
    { id: 'holdings' as const, label: 'Holdings', icon: Layers },
    { id: 'ipos' as const, label: 'IPOs', icon: TrendingUp, badge: openIposCount > 0 ? openIposCount : undefined },
    { id: 'transactions' as const, label: 'History', icon: History },
  ];

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen h-[100dvh] w-full bg-white dark:bg-[#070b14] md:bg-[#e2e8f0] md:dark:bg-[#030712] flex flex-col items-center justify-start md:py-6 md:px-4 text-[#0f172a] dark:text-[#f8fafc] overflow-x-hidden transition-colors duration-200"
    >
      {/* Phone Frame Wrapper on Desktop, 100% Full Screen Edge-to-Edge on Mobile */}
      <div
        suppressHydrationWarning
        className="w-full md:max-w-[430px] h-full min-h-screen md:min-h-[880px] md:max-h-[92vh] bg-white dark:bg-[#070b14] flex flex-col relative md:rounded-[44px] md:border-[10px] md:border-[#0f172a] md:dark:border-slate-800 md:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.3)] overflow-hidden transition-colors duration-200"
      >
        {/* Modals & Overlays */}
        <AutoSyncToast />
        <PinLockModal />
        <QuickActionModal />
        <ScannedSmsReviewModal />
        <FamilyManagementModal />
        <HeaderDropdownMenu
          isOpen={isHeaderMenuOpen}
          onClose={() => setIsHeaderMenuOpen(false)}
        />
        <ConfirmDialog
          isOpen={isExitConfirmOpen}
          onClose={() => setIsExitConfirmOpen(false)}
          onConfirm={handleConfirmExit}
          title="Quit Application?"
          description="Are you sure you want to exit IPO & Money Handler? All your private financial data is securely saved."
          confirmText="Quit App"
          cancelText="Stay"
          variant="danger"
        />

        {/* Top App Header with Clean 3-Line Menu, Seamless Background & Underline Profile Switcher */}
        <header
          suppressHydrationWarning
          className="sticky top-0 z-30 bg-white dark:bg-[#070b14] px-4 pt-[max(env(safe-area-inset-top,0px),24px)] pb-0 transition-colors duration-200"
        >
          <div className="flex items-center justify-between py-1">
            <div
              onClick={() => setActiveTab('home')}
              className="flex items-center space-x-3 cursor-pointer active:scale-95 transition-transform select-none"
            >
              <div className="p-1 rounded-2xl bg-black/[0.04] dark:bg-white/10 flex items-center justify-center shrink-0">
                <img
                  src="/app-logo.png"
                  alt="IPO Money Handler Logo"
                  className="w-10 h-10 object-contain shrink-0 rounded-xl"
                />
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none block">
                  IPO Money Handler
                </span>
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-600 dark:text-slate-200 font-semibold mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>100% Offline Vault</span>
                </div>
              </div>
            </div>

            {/* Right-Side Top Corner: Three-Line Menu Button */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsHeaderMenuOpen((prev) => !prev);
                }}
                className="w-10 h-10 rounded-2xl bg-black/[0.04] dark:bg-white/10 hover:bg-black/[0.08] dark:hover:bg-white/15 text-slate-900 dark:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 touch-manipulation"
                title="Menu & Settings"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5 stroke-[2.4]" />
              </button>
            </div>
          </div>

          {/* Top Profile Switcher with Single Green Dot Indicator */}
          <FamilyProfileSwitcher />
        </header>

        {/* Main View Area with full height & scroll padding */}
        <main
          ref={mainRef}
          suppressHydrationWarning
          className="flex-1 px-4 pt-2 pb-[calc(max(env(safe-area-inset-bottom),16px)+6.5rem)] overflow-y-auto z-0 transition-colors duration-200"
        >
          {!isHydrated ? (
            <AppSkeletonLoader />
          ) : (
            <div className="w-full">
              {children}
            </div>
          )}
        </main>

        {/* Floating Futuristic iOS Glass Navigation Dock */}
        <div className="fixed md:absolute bottom-3 inset-x-3 md:bottom-4 md:inset-x-4 z-40 pointer-events-none flex justify-center">
          <nav
            suppressHydrationWarning
            className="w-full max-w-[420px] bg-white/75 dark:bg-[#0c1427]/75 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-[30px] p-1.5 flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.65)] pointer-events-auto select-none transition-all duration-300 ring-1 ring-black/5 dark:ring-white/5"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setActiveTab(item.id);
                  }}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl cursor-pointer touch-manipulation select-none active:scale-95 transition-all duration-200 relative ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold'
                  }`}
                >
                  <div
                    className={`relative w-10 h-10 rounded-2xl transition-all duration-300 flex items-center justify-center ${
                      isActive
                        ? 'bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-xs scale-105'
                        : 'hover:bg-white/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />

                    {item.badge !== undefined && (
                      <span className="absolute -top-1 -right-1 min-w-[17px] h-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] tracking-tight mt-0.5 truncate font-medium">
                    {item.label}
                  </span>

                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5 animate-in fade-in zoom-in-50 duration-200" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
