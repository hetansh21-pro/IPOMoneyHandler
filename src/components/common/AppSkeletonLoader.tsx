'use client';

import React from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import {
  TrendingUp,
  Wallet,
  Receipt,
  Layers,
  Settings2,
  ShieldCheck,
} from 'lucide-react';

interface AppSkeletonLoaderProps {
  tab?: 'home' | 'accounts' | 'ipos' | 'transactions' | 'holdings' | 'more';
}

export function AppSkeletonLoader({ tab }: AppSkeletonLoaderProps) {
  const storeTab = useAppStore((state) => state.activeTab);
  const currentTab = tab || storeTab || 'home';

  if (currentTab === 'home') {
    return <HomeSkeleton />;
  }

  return <BrandPageLoader tab={currentTab} />;
}

/**
 * 1. Home Dashboard Skeleton (Kept for clean home layout rendering)
 */
function HomeSkeleton() {
  return (
    <div className="space-y-4 pb-28 animate-pulse w-full">
      {/* Greeting Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-slate-200/80 dark:bg-slate-800 rounded-md" />
          <div className="h-6 w-48 bg-slate-200/90 dark:bg-slate-700/80 rounded-lg" />
        </div>
        <div className="h-6 w-20 bg-emerald-100/60 dark:bg-emerald-950/60 rounded-full" />
      </div>

      {/* Main Hero Card Skeleton */}
      <div className="relative rounded-3xl ios-glass-card p-5 shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-emerald-200/70 dark:bg-emerald-900/60 rounded-md" />
            <div className="h-9 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-2.5 w-20 bg-slate-200/70 dark:bg-slate-800 rounded-md ml-auto" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md ml-auto" />
          </div>
        </div>

        {/* 3 Sub Balances Skeleton */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="h-14 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100/40 dark:border-emerald-900/40 p-2.5 space-y-1.5">
            <div className="h-2.5 w-14 bg-emerald-200/60 dark:bg-emerald-900/80 rounded" />
            <div className="h-4 w-16 bg-emerald-200/80 dark:bg-emerald-800/80 rounded" />
          </div>
          <div className="h-14 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100/40 dark:border-amber-900/40 p-2.5 space-y-1.5">
            <div className="h-2.5 w-14 bg-amber-200/60 dark:bg-amber-900/80 rounded" />
            <div className="h-4 w-16 bg-amber-200/80 dark:bg-amber-800/80 rounded" />
          </div>
          <div className="h-14 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100/40 dark:border-indigo-900/40 p-2.5 space-y-1.5">
            <div className="h-2.5 w-14 bg-indigo-200/60 dark:bg-indigo-900/80 rounded" />
            <div className="h-4 w-16 bg-indigo-200/80 dark:bg-indigo-800/80 rounded" />
          </div>
        </div>
      </div>

      {/* Quick Action Grid Skeleton */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/60 dark:border-slate-800 space-y-2"
          >
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-2.5 w-10 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* Distribution Card Skeleton */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/60 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="h-10 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-800" />
          <div className="h-10 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-800" />
        </div>
      </div>

      {/* Accounts List Skeleton */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>

        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/60 dark:border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-2.5 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded ml-auto" />
                <div className="h-2.5 w-12 bg-slate-100 dark:bg-slate-800 rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Branded Modern Page Loader for all other sections
 */
function BrandPageLoader({ tab }: { tab: string }) {
  const configs = {
    ipos: {
      icon: TrendingUp,
      title: 'Loading IPO Markets',
      desc: 'Retrieving live SME & Mainboard offerings, GMPs and timelines...',
      gradient: 'from-emerald-500 to-teal-600',
      ringBorder: 'border-t-emerald-500 dark:border-t-emerald-400',
      glow: 'rgba(16, 185, 129, 0.25)',
      badge: 'LIVE IPOS & APPLICATIONS',
    },
    accounts: {
      icon: Wallet,
      title: 'Loading Accounts',
      desc: 'Decrypting bank ledgers, demat accounts & balance records...',
      gradient: 'from-blue-500 to-indigo-600',
      ringBorder: 'border-t-blue-500 dark:border-t-blue-400',
      glow: 'rgba(59, 130, 246, 0.25)',
      badge: 'FINANCIAL ACCOUNTS',
    },
    transactions: {
      icon: Receipt,
      title: 'Loading Activity History',
      desc: 'Organizing cash flows, blocked funds & timeline entries...',
      gradient: 'from-indigo-500 to-purple-600',
      ringBorder: 'border-t-indigo-500 dark:border-t-indigo-400',
      glow: 'rgba(99, 102, 241, 0.25)',
      badge: 'TRANSACTIONS & FLOWS',
    },
    holdings: {
      icon: Layers,
      title: 'Loading Demat Holdings',
      desc: 'Syncing stock portfolio holdings and real-time live valuations...',
      gradient: 'from-teal-500 to-emerald-600',
      ringBorder: 'border-t-teal-500 dark:border-t-teal-400',
      glow: 'rgba(20, 184, 166, 0.25)',
      badge: 'PORTFOLIO HOLDINGS',
    },
    more: {
      icon: Settings2,
      title: 'Loading Preferences',
      desc: 'Preparing backup utilities, security lock & tools...',
      gradient: 'from-slate-600 to-slate-800 dark:from-slate-400 dark:to-slate-600',
      ringBorder: 'border-t-slate-500 dark:border-t-slate-400',
      glow: 'rgba(100, 116, 139, 0.25)',
      badge: 'APP SETTINGS & TOOLS',
    },
  };

  const current = configs[tab as keyof typeof configs] || configs.ipos;
  const Icon = current.icon;

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 select-none">
      <div className="relative flex flex-col items-center text-center max-w-xs w-full p-6 rounded-3xl ios-glass-card shadow-xl transition-all">
        
        {/* Animated Icon with Glowing Orbit */}
        <div className="relative mb-5 flex items-center justify-center">
          <div
            className="absolute -inset-4 rounded-full blur-xl animate-pulse"
            style={{ backgroundColor: current.glow }}
          />
          
          {/* Outer Spin Ring */}
          <div
            className={`w-18 h-18 rounded-full border-[2.5px] border-slate-200/60 dark:border-slate-800 ${current.ringBorder} animate-spin`}
          />
          
          {/* Inner Icon Box */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br ${current.gradient} text-white`}
            >
              <Icon className="w-6 h-6 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Section Badge */}
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
          {current.badge}
        </span>

        {/* Title */}
        <h3 className="text-base font-black tracking-tight text-slate-800 dark:text-slate-100">
          {current.title}
        </h3>

        {/* Description */}
        <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
          {current.desc}
        </p>

        {/* Shimmering Progress Indicator */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-5 relative">
          <div
            className={`h-full bg-gradient-to-r ${current.gradient} rounded-full w-2/3 animate-pulse`}
          />
        </div>

        {/* Security & Private Storage Tag */}
        <div className="mt-5 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Private & Offline Ledger</span>
        </div>
      </div>
    </div>
  );
}

