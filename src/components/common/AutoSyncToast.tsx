'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import {
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Unlock,
  X,
} from 'lucide-react';

export function AutoSyncToast() {
  const { lastAutoSyncedItem, dismissAutoSyncNotification, setActiveTab } = useAppStore();

  useEffect(() => {
    if (!lastAutoSyncedItem) return;

    const timer = setTimeout(() => {
      dismissAutoSyncNotification();
    }, 4500);

    return () => clearTimeout(timer);
  }, [lastAutoSyncedItem, dismissAutoSyncNotification]);

  if (!lastAutoSyncedItem) return null;

  const isDebit = lastAutoSyncedItem.type === 'DEBIT';
  const isCredit = lastAutoSyncedItem.type === 'CREDIT';
  const isBlocked = lastAutoSyncedItem.type === 'IPO_BLOCKED';
  const isReleased = lastAutoSyncedItem.type === 'IPO_RELEASED';

  const icon = isDebit ? (
    <div className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
      <ArrowDownRight className="w-4 h-4" />
    </div>
  ) : isCredit ? (
    <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
      <ArrowUpRight className="w-4 h-4" />
    </div>
  ) : isBlocked ? (
    <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
      <Lock className="w-4 h-4" />
    </div>
  ) : (
    <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
      <Unlock className="w-4 h-4" />
    </div>
  );

  return (
    <div className="fixed top-3 inset-x-3 z-50 max-w-md mx-auto animate-card-slide pointer-events-auto">
      <div
        onClick={() => {
          setActiveTab('transactions');
          dismissAutoSyncNotification();
        }}
        className="p-3.5 rounded-2xl ios-glass-card border-emerald-500/30 dark:border-emerald-500/40 shadow-xl flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all"
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {icon}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Zap className="w-3 h-3 fill-emerald-500" />
                Auto-Synced
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                {lastAutoSyncedItem.accountName}
              </span>
            </div>

            <h4 className="text-xs font-black text-slate-900 dark:text-slate-50 truncate mt-0.5">
              {isDebit && `₹${lastAutoSyncedItem.amount.toLocaleString('en-IN')} Debited`}
              {isCredit && `₹${lastAutoSyncedItem.amount.toLocaleString('en-IN')} Credited`}
              {isBlocked && `₹${lastAutoSyncedItem.amount.toLocaleString('en-IN')} IPO Blocked`}
              {isReleased && `₹${lastAutoSyncedItem.amount.toLocaleString('en-IN')} Mandate Released`}
            </h4>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {lastAutoSyncedItem.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismissAutoSyncNotification();
          }}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
