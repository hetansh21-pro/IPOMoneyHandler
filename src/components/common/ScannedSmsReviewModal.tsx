'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { BottomSheet } from './BottomSheet';
import { CustomDropdown } from './CustomDropdown';
import { BankLogo } from './SegmentedBar';
import { formatINR, formatDate } from '@/lib/utils/formatters';
import { ParsedSmsTransaction } from '@/lib/types/finance';
import {
  Sparkles,
  Lock,
  Unlock,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  Building2,
  Bell,
  MessageSquare,
  Layers,
  Hash,
  Wallet,
} from 'lucide-react';

export function ScannedSmsReviewModal() {
  const {
    pendingScannedSms,
    isSmsReviewPopupOpen,
    closeSmsReviewPopup,
    confirmPendingScannedItems,
    removePendingScannedItem,
    clearAllPendingScannedItems,
    updatePendingScannedItem,
    accounts,
  } = useAppStore();

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [expandedTextIds, setExpandedTextIds] = useState<Set<string>>(new Set());

  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');

  if (!isSmsReviewPopupOpen || !pendingScannedSms || pendingScannedSms.length === 0) {
    return null;
  }

  const bankAccounts = accounts.filter((a) => a.type === 'bank' || a.type === 'wallet');
  const accountOptions = bankAccounts.map((a) => ({
    value: a.id,
    label: `${a.name} (${formatINR(a.balance)})`,
    subLabel: a.accountNumber ? `A/c: ${a.accountNumber}` : undefined,
    icon: (
      <BankLogo
        name={a.name}
        type={a.type}
        color={a.color}
        size="sm"
        className="w-3.5 h-3.5 rounded-md !p-0.5"
      />
    ),
  }));

  const handleStartEdit = (item: ParsedSmsTransaction) => {
    setEditingItemId(item.id);
    setEditTitle(item.ipoName || item.merchantOrSender || '');
    setEditAmount(String(item.amount));
  };

  const handleSaveEdit = (id: string) => {
    const numAmt = parseFloat(editAmount);
    updatePendingScannedItem(id, {
      ipoName: editTitle.trim() || undefined,
      merchantOrSender: editTitle.trim() || undefined,
      amount: !isNaN(numAmt) && numAmt > 0 ? numAmt : undefined,
    });
    setEditingItemId(null);
  };

  const toggleExpandRaw = (id: string) => {
    setExpandedTextIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmSingle = (id: string) => {
    confirmPendingScannedItems([id]);
  };

  const handleConfirmAll = () => {
    confirmPendingScannedItems();
  };

  return (
    <BottomSheet
      isOpen={isSmsReviewPopupOpen && pendingScannedSms.length > 0}
      onClose={closeSmsReviewPopup}
      title="Bank Alerts & SMS Sync"
      subtitle={`${pendingScannedSms.length} new transaction alert(s) ready to verify & sync`}
    >
      <div className="space-y-4 pb-2 max-h-[75vh] overflow-y-auto pr-0.5">
        {/* Info Banner */}
        <div className="p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start space-x-2.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
            <strong>Multi-Bank Verified:</strong> We compared incoming notifications & SMS across all your banks. Review details below, confirm the linked account, and sync to your ledger.
          </div>
        </div>

        {/* Transaction Cards List */}
        <div className="space-y-3.5">
          {pendingScannedSms.map((item) => {
            const isEditing = editingItemId === item.id;
            const isExpanded = expandedTextIds.has(item.id);

            const isBlocked = item.type === 'IPO_BLOCKED';
            const isReleased = item.type === 'IPO_RELEASED';
            const isCredit = item.type === 'CREDIT';
            const isDebit = item.type === 'DEBIT';

            const sourceLabel =
              item.source === 'merged'
                ? 'Merged (SMS + Push)'
                : item.source === 'notification'
                ? 'Push Notification'
                : 'Bank SMS';

            const matchedAccount = accounts.find((a) => a.id === item.suggestedAccountId);

            return (
              <div
                key={item.id}
                className="p-4 rounded-3xl ios-glass-card space-y-3.5 shadow-xs border border-white/80 dark:border-white/10 transition-all animate-scale-up"
              >
                {/* Header: Type Badge, Source Pill & Actions */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {/* Transaction Type Badge */}
                    {isBlocked ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300/70 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
                        <Lock className="w-3 h-3" />
                        <span>IPO Blocked</span>
                      </span>
                    ) : isReleased ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 border border-sky-300/70 dark:border-sky-800/60 text-sky-800 dark:text-sky-300 text-[10px] font-black uppercase tracking-wider">
                        <Unlock className="w-3 h-3" />
                        <span>Mandate Released</span>
                      </span>
                    ) : isCredit ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300/70 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                        <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                        <span>Credit</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-300/70 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-[10px] font-black uppercase tracking-wider">
                        <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                        <span>Debit</span>
                      </span>
                    )}

                    {/* Detected Bank Name Pill */}
                    {item.bankName && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                        <Building2 className="w-2.5 h-2.5" />
                        <span>{item.bankName}</span>
                      </span>
                    )}

                    {/* Source Pill */}
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[9px] font-bold">
                      {item.source === 'merged' ? (
                        <Layers className="w-2.5 h-2.5 text-purple-500" />
                      ) : item.source === 'notification' ? (
                        <Bell className="w-2.5 h-2.5 text-blue-500" />
                      ) : (
                        <MessageSquare className="w-2.5 h-2.5 text-emerald-500" />
                      )}
                      <span>{sourceLabel}</span>
                    </span>
                  </div>

                  {/* Actions: Edit & Discard */}
                  <div className="flex items-center space-x-1 shrink-0 ml-auto">
                    <button
                      type="button"
                      onClick={() => (isEditing ? handleSaveEdit(item.id) : handleStartEdit(item))}
                      className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      title={isEditing ? 'Save edits' : 'Edit transaction'}
                    >
                      {isEditing ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Edit2 className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => removePendingScannedItem(item.id)}
                      className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Discard from sync list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Content Area */}
                {isEditing ? (
                  <div className="space-y-2 p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                        {isBlocked || isReleased ? 'IPO Company / Mandate' : 'Merchant / Description'}
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold"
                        placeholder="Company name or sender"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold"
                        placeholder="Amount"
                      />
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(item.id)}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Done Editing
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                        {item.ipoName ? `IPO: ${item.ipoName}` : item.merchantOrSender || 'Bank Transaction'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        {formatDate(item.date)} • {item.sender || item.bankName || 'Alert'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-base font-mono font-black ${
                          isCredit
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isDebit
                            ? 'text-rose-600 dark:text-rose-400'
                            : isBlocked
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-sky-600 dark:text-sky-400'
                        }`}
                      >
                        {isCredit ? '+' : isDebit ? '-' : ''}
                        {formatINR(item.amount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Details Comparison Pods */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-white/60 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 text-[11px]">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Account / Bank
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {item.bankName || 'Bank'} {item.accountNumber ? `(${item.accountNumber})` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Reference / UTR
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate block">
                      {item.mandateRef || 'Auto-Verified'}
                    </span>
                  </div>

                  {item.availableBalance !== undefined && (
                    <div className="col-span-2 pt-1 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Available Balance after txn
                      </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatINR(item.availableBalance)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Linked Bank Account Selector */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                      <Wallet className="w-3 h-3 text-emerald-500" />
                      <span>Linked Account in Ledger</span>
                    </label>
                    {matchedAccount && (
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ Auto-Matched
                      </span>
                    )}
                  </div>
                  <CustomDropdown
                    options={accountOptions}
                    value={item.suggestedAccountId || (accountOptions[0]?.value ?? '')}
                    onChange={(newAccId) =>
                      updatePendingScannedItem(item.id, {
                        suggestedAccountId: String(newAccId),
                        suggestedAccountName:
                          accounts.find((a) => a.id === newAccId)?.name || item.suggestedAccountName,
                      })
                    }
                    placeholder="Choose Linked Bank Account"
                  />
                </div>

                {/* Collapsible Raw Message */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => toggleExpandRaw(item.id)}
                    className="flex items-center space-x-1 text-[10px] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer font-semibold transition-colors"
                  >
                    <span>{isExpanded ? 'Hide original message' : 'View original alert text'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-1.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 leading-relaxed break-words select-all">
                      {item.rawText}
                    </div>
                  )}
                </div>

                {/* Individual 1-Click Sync Button */}
                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleConfirmSingle(item.id)}
                    className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center space-x-1.5 shadow-sm shadow-emerald-600/30 cursor-pointer active:scale-95 transition-transform"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Sync to Account</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Footer Actions */}
        <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 space-y-2">
          <button
            type="button"
            onClick={handleConfirmAll}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 active:scale-98 transition-all cursor-pointer"
          >
            <CheckCheck className="w-5 h-5" />
            <span>Sync All ({pendingScannedSms.length}) Transactions</span>
          </button>

          <button
            type="button"
            onClick={clearAllPendingScannedItems}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 cursor-pointer transition-colors"
          >
            Discard All Scanned Items
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
