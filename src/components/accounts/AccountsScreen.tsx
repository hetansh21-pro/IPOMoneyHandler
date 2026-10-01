'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import {
  getAccountAvailableBalance,
  getAccountIPOBlockedAmount,
  getAccountAllocatedAmount,
  getDematInvestedValue,
} from '@/lib/finance/ledger';
import { formatINR, formatDate } from '@/lib/utils/formatters';
import { BottomSheet } from '../common/BottomSheet';
import { BankLogo } from '../common/SegmentedBar';
import { SlidingSegmentedTabs } from '../common/SlidingSegmentedTabs';
import {
  Plus,
  Building2,
  Wallet,
  Coins,
  LineChart,
  Edit2,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Layers,
  Camera,
} from 'lucide-react';
import { Account, AccountType, AllocationCategory, IPOApplication } from '@/lib/types/finance';
import { DematScreenshotScannerModal } from '../investments/DematScreenshotScannerModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useBackHandler } from '@/lib/hooks/useBackHandler';
import { useSwipeGesture } from '@/lib/hooks/useSwipeGesture';

const ACCOUNT_FILTERS: Array<'ALL' | 'BANK' | 'DEMAT' | 'CASH'> = ['ALL', 'BANK', 'DEMAT', 'CASH'];

function isBlockedOrAllottedApp(a: IPOApplication) {
  const isBlocked =
    a.blockedAmount > 0 ||
    ['APPLIED', 'MANDATE_PENDING', 'MANDATE_ACCEPTED', 'FUNDS_BLOCKED', 'ALLOTMENT_PENDING'].includes(a.status);
  const isAllotted =
    a.lotsAllotted > 0 ||
    a.allottedAmount > 0 ||
    ['FULLY_ALLOTTED', 'PARTIALLY_ALLOTTED'].includes(a.status);
  return isBlocked || isAllotted;
}

export function AccountsScreen() {
  const {
    accounts,
    applications,
    allocations,
    investments,
    transactions,
    activeMemberId,
    familyMembers,
    selectedAccountDetailId,
    setSelectedAccountDetailId,
    activeAccountFilter,
    setActiveAccountFilter,
    setQuickActionOpen,
    deleteAccount,
    updateAccount,
    reorderAccounts,
    setAccountAllocations,
  } = useAppStore();

  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editInvestedAmount, setEditInvestedAmount] = useState('');

  // Allocation manager modal
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationItems, setAllocationItems] = useState<Array<{ category: AllocationCategory; label: string; amount: number }>>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Back Navigation Handlers
  useBackHandler(isDeleteDialogOpen, () => {
    setIsDeleteDialogOpen(false);
    return true;
  });

  useBackHandler(isScannerOpen, () => {
    setIsScannerOpen(false);
    return true;
  });

  useBackHandler(isAllocating, () => {
    setIsAllocating(false);
    return true;
  });

  useBackHandler(isEditingAccount, () => {
    setIsEditingAccount(false);
    return true;
  });

  // Helper to reorder filtered accounts while maintaining overall structure
  const reorderWithFilter = (
    allAccounts: Account[],
    filtered: Account[],
    sourceId: string,
    targetId: string
  ): Account[] => {
    if (sourceId === targetId) return allAccounts;

    const fromIndex = filtered.findIndex((a) => a.id === sourceId);
    const toIndex = filtered.findIndex((a) => a.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return allAccounts;

    const newFiltered = [...filtered];
    const [movedItem] = newFiltered.splice(fromIndex, 1);
    newFiltered.splice(toIndex, 0, movedItem);

    let filteredPointer = 0;
    return allAccounts.map((acc) => {
      if (newFiltered.some((f) => f.id === acc.id)) {
        const item = newFiltered[filteredPointer];
        filteredPointer++;
        return item;
      }
      return acc;
    });
  };

  // Drag & Touch-hold Reorder State
  const [draggedAccountId, setDraggedAccountId] = useState<string | null>(null);
  const [dragOverAccountId, setDragOverAccountId] = useState<string | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef<boolean>(false);
  const activeDragIdRef = useRef<string | null>(null);

  const clearHoldTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent, accId: string) => {
    if (e.button !== 0) return;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    clearHoldTimer();

    holdTimerRef.current = setTimeout(() => {
      hasDraggedRef.current = true;
      activeDragIdRef.current = accId;
      setDraggedAccountId(accId);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(35);
        } catch {}
      }
    }, 200);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerStartPosRef.current) {
      const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
      if (!activeDragIdRef.current && (dx > 8 || dy > 8)) {
        clearHoldTimer();
      }
    }

    if (activeDragIdRef.current) {
      const elem = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-account-id]');
      if (elem) {
        const targetId = elem.getAttribute('data-account-id');
        if (targetId && targetId !== activeDragIdRef.current) {
          setDragOverAccountId(targetId);
        }
      }
    }
  };

  const handlePointerUp = () => {
    clearHoldTimer();
    const sourceId = activeDragIdRef.current || draggedAccountId;
    const targetId = dragOverAccountId;

    if (sourceId && targetId && sourceId !== targetId) {
      const updated = reorderWithFilter(accounts, filteredAccounts, sourceId, targetId);
      reorderAccounts(updated);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([20, 30, 20]);
        } catch {}
      }
    }

    setDraggedAccountId(null);
    setDragOverAccountId(null);
    activeDragIdRef.current = null;
    pointerStartPosRef.current = null;

    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 120);
  };

  const handleDragStart = (e: React.DragEvent, accId: string) => {
    e.dataTransfer.setData('text/plain', accId);
    e.dataTransfer.effectAllowed = 'move';
    activeDragIdRef.current = accId;
    setDraggedAccountId(accId);
    hasDraggedRef.current = true;
  };

  const handleDragOver = (e: React.DragEvent, accId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverAccountId !== accId) {
      setDragOverAccountId(accId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedAccountId;
    if (sourceId && targetId && sourceId !== targetId) {
      const updated = reorderWithFilter(accounts, filteredAccounts, sourceId, targetId);
      reorderAccounts(updated);
    }
    setDraggedAccountId(null);
    setDragOverAccountId(null);
    activeDragIdRef.current = null;
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 120);
  };

  const handleDragEnd = () => {
    setDraggedAccountId(null);
    setDragOverAccountId(null);
    activeDragIdRef.current = null;
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 120);
  };

  const selectedAccount = useMemo(() => accounts.find((a) => a.id === selectedAccountDetailId), [accounts, selectedAccountDetailId]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (activeMemberId !== 'all') {
        if (acc.memberId && acc.memberId !== activeMemberId) return false;
        if (!acc.memberId && activeMemberId !== 'self') return false;
      }
      if (activeAccountFilter === 'ALL') return true;
      if (activeAccountFilter === 'BANK') return acc.type === 'bank';
      if (activeAccountFilter === 'DEMAT') return acc.type === 'demat' || acc.type === 'investment';
      if (activeAccountFilter === 'CASH') return acc.type === 'cash' || acc.type === 'wallet';
      return true;
    });
  }, [accounts, activeAccountFilter, activeMemberId]);

  const handleOpenAccountDetail = (acc: Account) => {
    setSelectedAccountDetailId(acc.id);
    setIsEditingAccount(false);
    setIsAllocating(false);
    setEditName(acc.name);
    setEditNotes(acc.notes || '');
    setEditBalance(acc.balance.toString());
    setEditInvestedAmount((acc.investedAmount ?? 0).toString());
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    const parsedBal = parseFloat(editBalance);
    const isDemat = selectedAccount.type === 'demat' || selectedAccount.type === 'investment';
    const parsedInvested = isDemat ? (parseFloat(editInvestedAmount) || 0) : undefined;

    updateAccount(selectedAccount.id, {
      name: editName.trim() || selectedAccount.name,
      notes: editNotes.trim() || undefined,
      balance: isNaN(parsedBal) ? selectedAccount.balance : parsedBal,
      investedAmount: parsedInvested,
    });
    setIsEditingAccount(false);
  };

  const handleDeleteAccount = () => {
    if (!selectedAccount) return;
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteAccount = () => {
    if (!selectedAccount) return;
    deleteAccount(selectedAccount.id);
    setSelectedAccountDetailId(null);
  };

  const handleOpenAllocationManager = () => {
    if (!selectedAccount) return;
    const existing = allocations.filter((al) => al.accountId === selectedAccount.id && al.type === 'GENERAL');
    if (existing.length > 0) {
      setAllocationItems(existing.map((e) => ({ category: e.category, label: e.label, amount: e.amount })));
    } else {
      setAllocationItems([
        { category: 'PERSONAL', label: 'Personal Expenses', amount: 0 },
        { category: 'IPO', label: 'IPO Dedicated', amount: 0 },
        { category: 'TRADING', label: 'Trading Capital', amount: 0 },
        { category: 'FREE', label: 'Free / Emergency', amount: 0 },
      ]);
    }
    setIsAllocating(true);
  };

  const handleSaveAllocations = () => {
    if (!selectedAccount) return;
    setAccountAllocations(selectedAccount.id, allocationItems);
    setIsAllocating(false);
  };

  const currentFilterIndex = ACCOUNT_FILTERS.indexOf(activeAccountFilter);

  const handleSwipeLeft = useCallback(() => {
    if (currentFilterIndex < ACCOUNT_FILTERS.length - 1) {
      setActiveAccountFilter(ACCOUNT_FILTERS[currentFilterIndex + 1]);
    }
  }, [currentFilterIndex, setActiveAccountFilter]);

  const handleSwipeRight = useCallback(() => {
    if (currentFilterIndex > 0) {
      setActiveAccountFilter(ACCOUNT_FILTERS[currentFilterIndex - 1]);
    }
  }, [currentFilterIndex, setActiveAccountFilter]);

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  return (
    <div {...swipeHandlers} className="space-y-4 pb-6 animate-fade-in touch-pan-y flex-1 min-h-full flex flex-col justify-start">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Virtual Accounts</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Manage bank mandates & broker funds</p>
        </div>
        <button
          onClick={() => setQuickActionOpen(true, 'add_account')}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>New Account</span>
        </button>
      </div>

      {/* Account Type Filters with Green Underline */}
      <div className="px-1 py-1">
        <SlidingSegmentedTabs
          tabs={[
            { id: 'ALL' as const, label: 'All' },
            { id: 'BANK' as const, label: 'Bank' },
            { id: 'DEMAT' as const, label: 'Demat' },
            { id: 'CASH' as const, label: 'Cash / Wallet' },
          ]}
          activeId={activeAccountFilter}
          onChange={(filter) => setActiveAccountFilter(filter)}
          size="sm"
          variant="equal"
          pillVariant="underline"
        />
      </div>

      {/* Accounts List */}
      {filteredAccounts.length === 0 ? (
        <div
          key={`empty-${activeAccountFilter}`}
          className="p-8 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-xs animate-card-slide"
        >
          <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No accounts in this category</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Create a virtual account to track your money balances and link IPO applications.
          </p>
          <button
            onClick={() => setQuickActionOpen(true, 'add_account')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>
      ) : (
        <div key={activeAccountFilter} className="space-y-3 animate-card-slide">
          {filteredAccounts.map((acc, index) => {
            const available = getAccountAvailableBalance(acc, applications, allocations);
            const blocked = getAccountIPOBlockedAmount(acc.id, applications);
            const isDemat = acc.type === 'demat' || acc.type === 'investment';
            const isDragging = draggedAccountId === acc.id;
            const isOver = dragOverAccountId === acc.id && draggedAccountId !== acc.id;

            return (
              <div
                key={acc.id}
                data-account-id={acc.id}
                draggable
                onDragStart={(e) => handleDragStart(e, acc.id)}
                onDragOver={(e) => handleDragOver(e, acc.id)}
                onDrop={(e) => handleDrop(e, acc.id)}
                onDragEnd={handleDragEnd}
                onPointerDown={(e) => handlePointerDown(e, acc.id)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onClick={() => {
                  if (!hasDraggedRef.current) {
                    handleOpenAccountDetail(acc);
                  }
                }}
                style={{ animationDelay: `${Math.min(index * 35, 180)}ms` }}
                className={`animate-card-item p-4 rounded-3xl border transition-all select-none space-y-3 ${
                  isDragging
                    ? 'scale-[1.02] shadow-2xl ring-2 ring-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-500 z-30 opacity-90 cursor-grabbing'
                    : isOver
                    ? 'ring-2 ring-dashed ring-emerald-400 dark:ring-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700'
                    : 'ios-glass-card hover:bg-white dark:hover:bg-slate-800/90 active:scale-[0.99] cursor-pointer'
                }`}
              >
                {/* Header Row: Logo + Name + Balance */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 min-w-0 flex-1">
                    <BankLogo name={acc.name} type={acc.type} color={acc.color} size="md" className="mt-0.5" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-snug break-words">{acc.name}</h3>
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wide shrink-0">
                          {acc.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        {isDemat ? 'Stock & Demat Broker' : 'Bank Mandate Account'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider block">
                      {isDemat ? 'Trading Fund' : 'Total Balance'}
                    </span>
                    <div className="text-base font-black text-slate-950 dark:text-slate-50 leading-tight mt-0.5">
                      {formatINR(acc.balance)}
                    </div>
                  </div>
                </div>

                {/* Sub Balances Breakdown */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  {isDemat ? (
                    (() => {
                      const linkedIpos = applications.filter(
                        (a) => a.dematAccountId === acc.id && isBlockedOrAllottedApp(a)
                      ).length;
                      const investedVal = getDematInvestedValue(acc, investments, accounts);

                      return (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900/60 text-center">
                            <span className="text-[9px] text-indigo-700 dark:text-indigo-400 font-extrabold uppercase tracking-tight block">Invested Money</span>
                            <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">{formatINR(investedVal)}</div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100/80 dark:border-emerald-900/60 text-center">
                            <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-extrabold uppercase tracking-tight block">Fund on Account</span>
                            <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">{formatINR(acc.balance)}</div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-tight block">IPO Linked</span>
                            <div className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">{linkedIpos} {linkedIpos === 1 ? 'IPO' : 'IPOs'}</div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100/80 dark:border-emerald-900/60">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold uppercase tracking-wide block">Available Funds</span>
                        <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">{formatINR(available)}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100/80 dark:border-amber-900/60">
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-extrabold uppercase tracking-wide block">IPO Blocked</span>
                        <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">{formatINR(blocked)}</div>
                      </div>
                    </div>
                  )}
                </div>

                {acc.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 break-words">
                    “{acc.notes}”
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Account Detail Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedAccountDetailId}
        onClose={() => setSelectedAccountDetailId(null)}
        title={selectedAccount?.name}
        subtitle={`${selectedAccount?.type.toUpperCase()} ACCOUNT • MANUAL TRACKING`}
      >
        {selectedAccount && (
          <div className="space-y-5">
            {/* Balance Overview */}
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <BankLogo name={selectedAccount.name} type={selectedAccount.type} color={selectedAccount.color} size="md" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-wider block">
                      {selectedAccount.type === 'demat' || selectedAccount.type === 'investment'
                        ? 'Total Demat Asset Value'
                        : 'Total Balance'}
                    </span>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight mt-0.5 truncate">
                      {selectedAccount.type === 'demat' || selectedAccount.type === 'investment'
                        ? formatINR(getDematInvestedValue(selectedAccount, investments, accounts) + selectedAccount.balance)
                        : formatINR(selectedAccount.balance)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => setIsEditingAccount(!isEditingAccount)}
                    className="p-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 shadow-xs transition-colors cursor-pointer"
                    title="Edit account"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="p-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-200 text-rose-600 dark:text-rose-400 hover:text-rose-700 shadow-xs transition-colors cursor-pointer"
                    title="Delete account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Edit Mode */}
              {isEditingAccount && (
                <form onSubmit={handleSaveEdit} className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="text-xs text-slate-700 dark:text-slate-300 font-bold">Account Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs mt-1"
                      required
                    />
                  </div>

                  {selectedAccount.type === 'demat' || selectedAccount.type === 'investment' ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs text-indigo-700 dark:text-indigo-400 font-bold block">Invested Money (₹)</label>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1">Equity/stocks holdings</span>
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={editInvestedAmount}
                          onChange={(e) => setEditInvestedAmount(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-slate-900 dark:text-slate-100 text-xs font-bold"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-emerald-700 dark:text-emerald-400 font-bold block">Fund on Account (₹)</label>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1">Cash trading balance</span>
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={editBalance}
                          onChange={(e) => setEditBalance(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-slate-100 text-xs font-bold"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs text-slate-700 dark:text-slate-300 font-bold">Account Balance (₹)</label>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={editBalance}
                        onChange={(e) => setEditBalance(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold mt-1"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-slate-700 dark:text-slate-300 font-bold">Notes</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs mt-1"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingAccount(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {/* Sub Balances */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                {selectedAccount.type === 'demat' || selectedAccount.type === 'investment' ? (
                  (() => {
                    const modalLinkedIpos = applications.filter(
                      (a) => a.dematAccountId === selectedAccount.id && isBlockedOrAllottedApp(a)
                    ).length;
                    const modalInvestedVal = getDematInvestedValue(selectedAccount, investments, accounts);

                    return (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 text-center">
                          <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold uppercase block">Invested Money</span>
                          <div className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                            {formatINR(modalInvestedVal)}
                          </div>
                        </div>
                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/60 text-center">
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase block">Fund on Account</span>
                          <div className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                            {formatINR(selectedAccount.balance)}
                          </div>
                        </div>
                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">IPO Linked</span>
                          <div className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                            {modalLinkedIpos} {modalLinkedIpos === 1 ? 'IPO' : 'IPOs'}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">Available</span>
                      <div className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                        {formatINR(getAccountAvailableBalance(selectedAccount, applications, allocations))}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase">IPO Blocked</span>
                      <div className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                        {formatINR(getAccountIPOBlockedAmount(selectedAccount.id, applications))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Money Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  const accId = selectedAccount.id;
                  setSelectedAccountDetailId(null);
                  setQuickActionOpen(true, 'add_money', accId);
                }}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center text-center group cursor-pointer transition-colors"
              >
                <ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Add Money</span>
              </button>

              <button
                onClick={() => {
                  const accId = selectedAccount.id;
                  setSelectedAccountDetailId(null);
                  setQuickActionOpen(true, 'remove_money', accId);
                }}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center text-center group cursor-pointer transition-colors"
              >
                <ArrowUpRight className="w-5 h-5 text-rose-600 dark:text-rose-400 mb-1" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Withdraw</span>
              </button>

              <button
                onClick={() => {
                  const accId = selectedAccount.id;
                  setSelectedAccountDetailId(null);
                  setQuickActionOpen(true, 'transfer', accId);
                }}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center text-center group cursor-pointer transition-colors"
              >
                <ArrowRightLeft className="w-5 h-5 text-sky-600 dark:text-sky-400 mb-1" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Transfer</span>
              </button>
            </div>

            {/* Demat Stock Holdings Section */}
            {(selectedAccount.type === 'demat' || selectedAccount.type === 'investment') && (() => {
              const dematInvestments = investments.filter((i) => i.accountId === selectedAccount.id);
              const totalHoldingVal = dematInvestments.reduce((sum, inv) => sum + (inv.quantity * (inv.currentPrice || inv.avgPrice)), 0);
              const totalInvestedVal = dematInvestments.reduce((sum, inv) => sum + (inv.quantity * inv.avgPrice), 0);
              const totalPnl = totalHoldingVal - totalInvestedVal;
              const totalPnlPct = totalInvestedVal > 0 ? (totalPnl / totalInvestedVal) * 100 : 0;

              return (
                <div className="space-y-3 p-4 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <LineChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Demat Holdings ({dematInvestments.length})
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setIsScannerOpen(true);
                        }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold flex items-center space-x-1 cursor-pointer bg-indigo-100/60 dark:bg-indigo-900/40 px-2.5 py-1 rounded-xl"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Scan</span>
                      </button>
                      <button
                        onClick={() => {
                          const accId = selectedAccount.id;
                          setSelectedAccountDetailId(null);
                          setQuickActionOpen(true, 'add_investment', accId);
                        }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold flex items-center space-x-1 cursor-pointer bg-indigo-100/60 dark:bg-indigo-900/40 px-2.5 py-1 rounded-xl"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Stock</span>
                      </button>
                    </div>
                  </div>

                  {dematInvestments.length === 0 ? (
                    <div className="py-4 text-center space-y-1">
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        No stocks currently linked to this Demat account.
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Allotted IPO shares or manual holdings assigned to this Demat will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-indigo-100 dark:border-indigo-900/40 flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-bold">Total Holdings Value:</span>
                        <div className="text-right">
                          <span className="font-black text-slate-900 dark:text-slate-100">{formatINR(totalHoldingVal)}</span>
                          <span className={`ml-1.5 text-[10px] font-bold ${totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            ({totalPnl >= 0 ? '+' : ''}{formatINR(totalPnl)})
                          </span>
                        </div>
                      </div>

                      {dematInvestments.map((inv) => {
                        const curVal = inv.quantity * (inv.currentPrice || inv.avgPrice);
                        const invVal = inv.quantity * inv.avgPrice;
                        const pnl = curVal - invVal;
                        const pnlPct = invVal > 0 ? (pnl / invVal) * 100 : 0;
                        const hasDayChange = inv.dayChange !== undefined && inv.dayChange !== null;
                        const isDayPositive = (inv.dayChange || 0) >= 0;

                        return (
                          <div
                            key={inv.id}
                            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs"
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{inv.symbol}</h4>
                                {inv.isIpoAllotted && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                                    IPO Allotted
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                                  {inv.name}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {inv.quantity} shares • Avg: ₹{inv.avgPrice} • LTP: ₹{inv.currentPrice || inv.avgPrice}
                              </p>
                              {hasDayChange && (
                                <p className={`text-[10px] font-bold mt-0.5 ${isDayPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                  1D: {isDayPositive ? '+' : ''}₹{inv.dayChange} ({isDayPositive ? '+' : ''}{inv.dayChangePercent?.toFixed(2)}%)
                                </p>
                              )}
                            </div>

                            <div className="text-right">
                              <div className="text-xs font-black text-slate-900 dark:text-slate-100">{formatINR(curVal)}</div>
                              <span className={`text-[10px] font-bold ${pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {pnl >= 0 ? '+' : ''}{formatINR(pnl)} ({pnlPct.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Sub-Allocations Section */}
            <div className="space-y-3 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Virtual Purpose Allocations
                  </h3>
                </div>
                <button
                  onClick={handleOpenAllocationManager}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 font-bold cursor-pointer"
                >
                  {isAllocating ? 'Close' : 'Manage'}
                </button>
              </div>

              {isAllocating ? (
                <div className="space-y-3 pt-2">
                  {allocationItems.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-xs text-slate-700 dark:text-slate-300 w-1/3 truncate font-bold">{item.label}:</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={item.amount || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setAllocationItems((prev) =>
                            prev.map((it, i) => (i === idx ? { ...it, amount: val } : it))
                          );
                        }}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                        placeholder="₹ Amount"
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleSaveAllocations}
                    className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 shadow-xs cursor-pointer"
                  >
                    Save Purpose Allocations
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {allocations
                    .filter((al) => al.accountId === selectedAccount.id && al.type === 'GENERAL')
                    .map((al) => (
                      <div key={al.id} className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">{al.label}</span>
                        <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">{formatINR(al.amount)}</div>
                      </div>
                    ))}
                  {allocations.filter((al) => al.accountId === selectedAccount.id && al.type === 'GENERAL').length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 col-span-2 text-center py-2">
                      No custom allocations configured. Tap Manage to allocate.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Related IPO Applications */}
            <div className="space-y-2">
              {(() => {
                const linkedApps = applications.filter(
                  (a) =>
                    (a.accountId === selectedAccount.id || a.dematAccountId === selectedAccount.id) &&
                    isBlockedOrAllottedApp(a)
                );

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Linked IPO Applications
                      </h3>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                        {linkedApps.length} Active / Allotted
                      </span>
                    </div>

                    {linkedApps.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                        No active blocked or allotted IPO applications linked to this {selectedAccount.type === 'demat' ? 'Demat' : 'Bank'} account.
                      </p>
                    ) : (
                      linkedApps.map((app) => {
                    const isBankSource = app.accountId === selectedAccount.id;
                    const isDematBeneficiary = app.dematAccountId === selectedAccount.id;

                    return (
                      <div
                        key={app.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{app.companyName}</h4>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">({app.symbol})</span>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            <span>{app.lotsApplied} Lot(s)</span>
                            <span>•</span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-bold ${
                                app.status === 'FULLY_ALLOTTED'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                                  : app.status === 'NOT_ALLOTTED'
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {app.status.replace(/_/g, ' ')}
                            </span>
                            {isDematBeneficiary && (
                              <span className="px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold">
                                Equity Beneficiary
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                            {formatINR(app.applicationAmount)}
                          </span>
                          <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {isBankSource ? 'Blocked in Bank' : 'Shares in Demat'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            );
          })()}
        </div>
          </div>
        )}
      </BottomSheet>

      {/* Demat Screenshot Scanner Modal */}
      <DematScreenshotScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        defaultAccountId={selectedAccount?.id}
      />

      {/* Delete Account Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDeleteAccount}
        title={`Delete ${selectedAccount?.name}?`}
        message={`Are you sure you want to delete ${selectedAccount?.name}? All linked transactions will also be permanently cleared.`}
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="danger"
        icon="trash"
      />
    </div>
  );
}
