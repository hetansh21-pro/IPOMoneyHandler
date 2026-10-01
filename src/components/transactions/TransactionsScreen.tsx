'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { Transaction, TransactionType } from '@/lib/types/finance';
import { formatINR, formatDate } from '@/lib/utils/formatters';
import { BottomSheet } from '../common/BottomSheet';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { BankLogo } from '../common/SegmentedBar';
import { SlidingSegmentedTabs } from '../common/SlidingSegmentedTabs';
import { useBackHandler } from '@/lib/hooks/useBackHandler';
import { useSwipeGesture } from '@/lib/hooks/useSwipeGesture';
import {
  Receipt,
  Search,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Unlock,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

const TX_FILTERS = ['ALL', 'IN', 'OUT', 'IPO', 'TRANSFER'] as const;

export function TransactionsScreen() {
  const { transactions, accounts, exportTransactionsCSV, activeMemberId, deleteTransaction } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const currentFilterIndex = TX_FILTERS.indexOf(selectedTypeFilter as any);

  useBackHandler(!!txToDelete, () => {
    setTxToDelete(null);
    return true;
  });

  const handleSwipeLeft = () => {
    if (currentFilterIndex >= 0 && currentFilterIndex < TX_FILTERS.length - 1) {
      setSelectedTypeFilter(TX_FILTERS[currentFilterIndex + 1]);
    }
  };

  const handleSwipeRight = () => {
    if (currentFilterIndex > 0) {
      setSelectedTypeFilter(TX_FILTERS[currentFilterIndex - 1]);
    }
  };

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  useBackHandler(!!selectedTxDetail, () => {
    setSelectedTxDetail(null);
    return true;
  });

  const filteredTransactions = transactions.filter((tx) => {
    // Exclude ₹0 account opening / placeholder entries
    if (tx.amount <= 0) return false;

    // Filter by active family member
    if (activeMemberId && activeMemberId !== 'all') {
      const acc = accounts.find((a) => a.id === tx.accountId);
      const memberId = tx.memberId || acc?.memberId || 'self';
      if (activeMemberId === 'self') {
        if (memberId !== 'self') return false;
      } else {
        if (memberId !== activeMemberId) return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const acc = accounts.find((a) => a.id === tx.accountId);
      const matchesDesc = tx.description.toLowerCase().includes(q);
      const matchesAcc = acc?.name.toLowerCase().includes(q);
      const matchesAmount = tx.amount.toString().includes(q);
      if (!matchesDesc && !matchesAcc && !matchesAmount) return false;
    }

    if (selectedTypeFilter !== 'ALL') {
      if (selectedTypeFilter === 'IN' && !['MONEY_ADDED', 'TRANSFER_IN', 'INCOME', 'IPO_RELEASED'].includes(tx.type)) return false;
      if (selectedTypeFilter === 'OUT' && !['MONEY_REMOVED', 'TRANSFER_OUT', 'EXPENSE', 'IPO_ALLOTMENT_INVESTED'].includes(tx.type)) return false;
      if (selectedTypeFilter === 'TRANSFER' && !['TRANSFER_IN', 'TRANSFER_OUT'].includes(tx.type)) return false;
      if (selectedTypeFilter === 'IPO' && !['IPO_ALLOCATION_BLOCKED', 'IPO_RELEASED', 'IPO_ALLOTMENT_INVESTED'].includes(tx.type)) return false;
    }

    return true;
  });

  const handleExportCSV = () => {
    const csvContent = exportTransactionsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `IPO_Money_Ledger_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const getTxTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'MONEY_ADDED':
      case 'INCOME':
        return { label: 'Credit', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' };
      case 'MONEY_REMOVED':
      case 'EXPENSE':
        return { label: 'Debit', color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' };
      case 'TRANSFER_IN':
      case 'TRANSFER_OUT':
        return { label: 'Transfer', color: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800' };
      case 'IPO_ALLOCATION_BLOCKED':
        return { label: 'Blocked', color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' };
      case 'IPO_RELEASED':
        return { label: 'Unblocked', color: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800' };
      case 'IPO_ALLOTMENT_INVESTED':
        return { label: 'Allotted', color: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' };
      default:
        return { label: 'Activity', color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
    }
  };

  return (
    <div {...swipeHandlers} className="space-y-4 pb-6 animate-fade-in touch-pan-y flex-1 min-h-full flex flex-col justify-start">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Activity</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {transactions.filter((t) => t.amount > 0).length} total recorded
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs active:scale-95 transition-all cursor-pointer"
          title="Export CSV"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {copiedNotification && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center space-x-2 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>CSV file downloaded successfully!</span>
        </div>
      )}

      {/* Quick Filter & Search Bar with iOS Frosted Glass (Matching IPO Screen) */}
      <div className="space-y-2.5 ios-glass-card p-3 rounded-2xl">
        {/* Row 1: Type Filter Tabs with Green Underline */}
        <div className="px-1">
          <SlidingSegmentedTabs
            tabs={[
              { id: 'ALL', label: 'All' },
              { id: 'IN', label: 'Credit (+)' },
              { id: 'OUT', label: 'Debit (-)' },
              { id: 'IPO', label: 'IPO' },
              { id: 'TRANSFER', label: 'Transfer' },
            ]}
            activeId={selectedTypeFilter}
            onChange={(chip) => setSelectedTypeFilter(chip)}
            size="sm"
            variant="scrollable"
            pillVariant="underline"
          />
        </div>

        {/* Row 2: Search Bar Underneath Filter Buttons */}
        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search by note, account, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-[11px] focus:outline-none focus:border-emerald-600 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <span className="text-xs">✕</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div
          key={`empty-${selectedTypeFilter}`}
          className="p-8 rounded-3xl ios-glass-card text-center space-y-2 shadow-xs animate-card-slide"
        >
          <Receipt className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No transactions match filters</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Try changing your search term or filter options.</p>
        </div>
      ) : (
        <div key={selectedTypeFilter} className="space-y-2 animate-card-slide">
          {filteredTransactions.map((tx, index) => {
            const acc = accounts.find((a) => a.id === tx.accountId);
            const relAcc = accounts.find((a) => a.id === tx.relatedAccountId);
            const badge = getTxTypeBadge(tx.type);
            const isCredit = ['MONEY_ADDED', 'TRANSFER_IN', 'INCOME', 'IPO_RELEASED'].includes(tx.type);
            const isBlocked = tx.type === 'IPO_ALLOCATION_BLOCKED';

            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTxDetail(tx)}
                style={{ animationDelay: `${Math.min(index * 30, 150)}ms` }}
                className="animate-card-item p-3.5 rounded-2xl ios-glass-card hover:bg-white dark:hover:bg-slate-800/90 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                      isCredit
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                        : isBlocked
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isCredit ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : isBlocked ? (
                      <Lock className="w-4 h-4" />
                    ) : tx.type === 'IPO_RELEASED' ? (
                      <Unlock className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {tx.description}
                    </h4>
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{acc?.name || 'Account'}</span>
                      {relAcc && <span>→ {relAcc.name}</span>}
                      <span>•</span>
                      <span>{formatDate(tx.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-sm font-black ${
                      isCredit
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isBlocked
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isCredit ? '+' : isBlocked ? '' : '-'}
                    {formatINR(tx.amount)}
                  </div>
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border mt-0.5 ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction Receipt Modal */}
      <BottomSheet
        isOpen={!!selectedTxDetail}
        onClose={() => setSelectedTxDetail(null)}
        title="Transaction Details"
        subtitle={`ID: ${selectedTxDetail?.id}`}
      >
        {selectedTxDetail && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
                Amount
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {formatINR(selectedTxDetail.amount)}
              </div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getTxTypeBadge(selectedTxDetail.type).color}`}>
                {getTxTypeBadge(selectedTxDetail.type).label}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Description:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-right">
                  {selectedTxDetail.description}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Primary Account:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                  {accounts.find((a) => a.id === selectedTxDetail.accountId) && (
                    <BankLogo
                      name={accounts.find((a) => a.id === selectedTxDetail.accountId)!.name}
                      type={accounts.find((a) => a.id === selectedTxDetail.accountId)!.type}
                      size="sm"
                      className="w-5 h-5 rounded-md !p-0.5"
                    />
                  )}
                  <span>{accounts.find((a) => a.id === selectedTxDetail.accountId)?.name || selectedTxDetail.accountId}</span>
                </span>
              </div>
              {selectedTxDetail.relatedAccountId && (
                <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Linked Account:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                    {accounts.find((a) => a.id === selectedTxDetail.relatedAccountId) && (
                      <BankLogo
                        name={accounts.find((a) => a.id === selectedTxDetail.relatedAccountId)!.name}
                        type={accounts.find((a) => a.id === selectedTxDetail.relatedAccountId)!.type}
                        size="sm"
                        className="w-5 h-5 rounded-md !p-0.5"
                      />
                    )}
                    <span>{accounts.find((a) => a.id === selectedTxDetail.relatedAccountId)?.name}</span>
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Date:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{formatDate(selectedTxDetail.date)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 pt-1">
              <button
                type="button"
                onClick={() => setTxToDelete(selectedTxDetail.id)}
                className="flex-1 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-black flex items-center justify-center space-x-1.5 cursor-pointer transition-colors active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Entry</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTxDetail(null)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-bold cursor-pointer transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Delete Single Transaction Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirm={() => {
          if (txToDelete) {
            deleteTransaction(txToDelete);
            setTxToDelete(null);
            if (selectedTxDetail?.id === txToDelete) {
              setSelectedTxDetail(null);
            }
          }
        }}
        title="Delete Transaction?"
        message="Are you sure you want to delete this transaction record from your ledger?"
        confirmText="Delete"
        variant="danger"
        icon="trash"
      />
    </div>
  );
}
