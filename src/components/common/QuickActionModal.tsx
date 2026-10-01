'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { BottomSheet } from './BottomSheet';
import { CustomDropdown } from './CustomDropdown';
import {
  PlusCircle,
  MinusCircle,
  ArrowRightLeft,
  Building2,
  TrendingUp,
  LineChart,
  Camera,
} from 'lucide-react';
import { AccountType } from '@/lib/types/finance';
import { formatINR } from '@/lib/utils/formatters';
import { getAccountAvailableBalance, getAccountIPOBlockedAmount } from '@/lib/finance/ledger';
import { BankLogo } from './SegmentedBar';
import { fetchLiveStockQuote } from '@/lib/market/priceFetcher';
import { Zap, Loader2 } from 'lucide-react';
import { DematScreenshotScannerModal } from '../investments/DematScreenshotScannerModal';
import { useBackHandler } from '@/lib/hooks/useBackHandler';

export function QuickActionModal() {
  const {
    quickActionOpen,
    quickActionType,
    quickActionAccountId,
    setQuickActionOpen,
    accounts,
    applications,
    allocations,
    addMoney,
    removeMoney,
    transferMoney,
    addAccount,
    addInvestment,
    setActiveTab,
    activeMemberId,
  } = useAppStore();

  const [activeAction, setActiveAction] = useState<
    'menu' | 'add_money' | 'remove_money' | 'transfer' | 'add_account' | 'add_investment'
  >('menu');

  // Form states
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [targetAccountId, setTargetAccountId] = useState(accounts[1]?.id || '');
  const [amountInput, setAmountInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [formError, setFormError] = useState('');

  React.useEffect(() => {
    if (quickActionOpen) {
      if (quickActionType) {
        setActiveAction(quickActionType);
      }
      if (quickActionAccountId && accounts.some((a) => a.id === quickActionAccountId)) {
        setSelectedAccountId(quickActionAccountId);
      } else if (!selectedAccountId && accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
      setAmountInput('');
      setDescriptionInput('');
      setFormError('');
    }
  }, [quickActionOpen, quickActionType, quickActionAccountId, accounts, selectedAccountId]);

  // Add Account form
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('bank');
  const [accInitialBalance, setAccInitialBalance] = useState('');
  const [accInvestedAmount, setAccInvestedAmount] = useState('');
  const [accNotes, setAccNotes] = useState('');

  const dematAccounts = accounts.filter((a) => a.type === 'demat' || a.type === 'investment');

  // Add Investment form
  const [invSymbol, setInvSymbol] = useState('');
  const [invName, setInvName] = useState('');
  const [invQty, setInvQty] = useState('');
  const [invAvgPrice, setInvAvgPrice] = useState('');
  const [invCurPrice, setInvCurPrice] = useState('');
  const [invAccountId, setInvAccountId] = useState(dematAccounts[0]?.id || '');
  const [isFetchingLtp, setIsFetchingLtp] = useState(false);
  const [ltpFeedback, setLtpFeedback] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Back Navigation Handlers
  useBackHandler(isScannerOpen, () => {
    setIsScannerOpen(false);
    return true;
  });

  useBackHandler(quickActionOpen, () => {
    if (activeAction !== 'menu' && quickActionType === 'menu') {
      setActiveAction('menu');
      return true;
    }
    setQuickActionOpen(false);
    return true;
  });

  const handleFetchLtp = async () => {
    if (!invSymbol.trim()) return;
    setIsFetchingLtp(true);
    setLtpFeedback(null);
    try {
      const quote = await fetchLiveStockQuote(invSymbol);
      if (quote && quote.price > 0) {
        setInvCurPrice(quote.price.toString());
        if (!invName.trim() && quote.name) {
          setInvName(quote.name);
        }
        if (!invAvgPrice) {
          setInvAvgPrice(quote.price.toString());
        }
        setLtpFeedback(`⚡ Live LTP: ₹${quote.price} (${quote.source || 'NSE'})`);
      } else {
        setLtpFeedback('Symbol not found on NSE/BSE. You can type manual price.');
      }
    } catch {
      setLtpFeedback('Could not fetch online. Please enter manual price.');
    } finally {
      setIsFetchingLtp(false);
    }
  };

  const resetForms = () => {
    setActiveAction('menu');
    setAmountInput('');
    setDescriptionInput('');
    setFormError('');
    setAccName('');
    setAccInitialBalance('');
    setAccInvestedAmount('');
    setAccNotes('');
    setInvSymbol('');
    setInvName('');
    setInvQty('');
    setInvAvgPrice('');
    setInvCurPrice('');
    setInvAccountId(dematAccounts[0]?.id || '');
  };

  const handleClose = () => {
    setQuickActionOpen(false);
    setTimeout(resetForms, 250);
  };

  const handleAddMoneySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) {
      setFormError('Please enter a valid positive amount.');
      return;
    }
    addMoney(selectedAccountId, amount, descriptionInput.trim() || 'Manual Deposit');
    handleClose();
  };

  const handleRemoveMoneySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) {
      setFormError('Please enter a valid positive amount.');
      return;
    }
    const acc = accounts.find((a) => a.id === selectedAccountId);
    if (acc) {
      const avail = getAccountAvailableBalance(acc, applications, allocations);
      if (amount > avail) {
        setFormError(`Cannot withdraw ₹${amount}. Available unblocked balance is only ₹${avail}.`);
        return;
      }
    }
    removeMoney(selectedAccountId, amount, descriptionInput.trim() || 'Manual Withdrawal');
    handleClose();
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) {
      setFormError('Please enter a valid positive amount.');
      return;
    }
    if (!targetAccountId || targetAccountId === selectedAccountId) {
      setFormError('Please select a different target account for transfer.');
      return;
    }
    const fromAcc = accounts.find((a) => a.id === selectedAccountId);
    if (fromAcc) {
      const avail = getAccountAvailableBalance(fromAcc, applications, allocations);
      if (amount > avail) {
        setFormError(`Cannot transfer ₹${amount}. Available unblocked balance is only ₹${avail}.`);
        return;
      }
    }
    transferMoney(
      selectedAccountId,
      targetAccountId,
      amount,
      descriptionInput.trim() || 'Account Transfer'
    );
    handleClose();
  };

  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) {
      setFormError('Account name is required.');
      return;
    }
    const initBal = parseFloat(accInitialBalance) || 0;
    const isDemat = accType === 'demat' || accType === 'investment';
    const investedVal = isDemat ? (parseFloat(accInvestedAmount) || 0) : undefined;
    addAccount({
      name: accName.trim(),
      type: accType,
      initialBalance: initBal,
      investedAmount: investedVal,
      currency: 'INR',
      notes: accNotes.trim() || undefined,
      memberId: activeMemberId === 'all' ? 'self' : activeMemberId,
    });
    handleClose();
  };

  const handleAddInvestmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invSymbol.trim() || !invName.trim()) {
      setFormError('Symbol and Company Name are required.');
      return;
    }
    const qty = parseInt(invQty) || 1;
    const avgP = parseFloat(invAvgPrice) || 0;
    const curP = parseFloat(invCurPrice) || avgP;

    addInvestment({
      symbol: invSymbol.toUpperCase().trim(),
      name: invName.trim(),
      quantity: qty,
      avgPrice: avgP,
      currentPrice: curP,
      accountId: invAccountId || undefined,
      memberId: activeMemberId === 'all' ? 'self' : activeMemberId,
    });
    handleClose();
  };

  return (
    <>
      <BottomSheet
        isOpen={quickActionOpen}
        onClose={handleClose}
      title={
        activeAction === 'menu'
          ? 'Quick Actions'
          : activeAction === 'add_money'
          ? 'Add Money'
          : activeAction === 'remove_money'
          ? 'Remove / Withdraw Money'
          : activeAction === 'transfer'
          ? 'Transfer Money'
          : activeAction === 'add_account'
          ? 'Create Virtual Account'
          : 'Track Stock / Investment'
      }
      subtitle={activeAction === 'menu' ? 'Select an operation' : 'Manual entry • Instant update'}
    >
      {activeAction === 'menu' && (
        <div className="grid grid-cols-2 gap-3 py-1">
          <button
            onClick={() => setActiveAction('add_money')}
            className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Add Money</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Deposit to account</span>
          </button>

          <button
            onClick={() => setActiveAction('remove_money')}
            className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <MinusCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Remove Money</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Withdraw / spend</span>
          </button>

          <button
            onClick={() => setActiveAction('transfer')}
            className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Transfer</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Between accounts</span>
          </button>

          <button
            onClick={() => {
              handleClose();
              setActiveTab('ipos');
            }}
            className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Apply Live IPO</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Calculate & block funds</span>
          </button>

          <button
            onClick={() => setActiveAction('add_account')}
            className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Add Account</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Bank, Cash or Demat</span>
          </button>

          <button
            onClick={() => setActiveAction('add_investment')}
            className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <LineChart className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Add Stock</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Track holding</span>
          </button>

          <button
            onClick={() => {
              handleClose();
              setIsScannerOpen(true);
            }}
            className="flex flex-col items-center justify-center p-4 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 transition-all text-center group cursor-pointer col-span-2"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-emerald-900 dark:text-emerald-100">Scan Demat Screenshot</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5">Auto-extract holdings from Zerodha, Groww, Angel One</span>
          </button>
        </div>
      )}

      {/* Add Money Form */}
      {activeAction === 'add_money' && (
        <form onSubmit={handleAddMoneySubmit} className="space-y-4">
          <CustomDropdown
            label="Select Account"
            value={selectedAccountId}
            onChange={(val) => setSelectedAccountId(val)}
            themeVariant="emerald"
            options={accounts.map((acc) => ({
              value: acc.id,
              label: acc.name,
              subLabel: `Balance: ${formatINR(acc.balance)}`,
              icon: (
                <BankLogo
                  name={acc.name}
                  type={acc.type}
                  color={acc.color}
                  size="sm"
                  className="w-4 h-4 rounded-md !p-0.5"
                />
              ),
            }))}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Amount (₹)</label>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              placeholder="e.g. 25000.50"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-lg font-bold focus:outline-none focus:border-emerald-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Salary, Dividend, Cash deposit"
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-600"
            />
          </div>

          {formError && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{formError}</p>}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveAction('menu')}
              className="w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-sm cursor-pointer"
            >
              Confirm Add Money
            </button>
          </div>
        </form>
      )}

      {/* Remove Money Form */}
      {activeAction === 'remove_money' && (
        <form onSubmit={handleRemoveMoneySubmit} className="space-y-4">
          <CustomDropdown
            label="Select Account"
            value={selectedAccountId}
            onChange={(val) => setSelectedAccountId(val)}
            themeVariant="rose"
            options={accounts.map((acc) => {
              const avail = getAccountAvailableBalance(acc, applications, allocations);
              return {
                value: acc.id,
                label: acc.name,
                subLabel: `Available: ${formatINR(avail)}`,
                icon: (
                  <BankLogo
                    name={acc.name}
                    type={acc.type}
                    color={acc.color}
                    size="sm"
                    className="w-4 h-4 rounded-md !p-0.5"
                  />
                ),
              };
            })}
          />

          {(() => {
            const acc = accounts.find((a) => a.id === selectedAccountId);
            if (!acc) return null;
            const avail = getAccountAvailableBalance(acc, applications, allocations);
            const blocked = getAccountIPOBlockedAmount(acc.id, applications);

            return (
              <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold uppercase block">Max Withdrawable</span>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100">{formatINR(avail)}</span>
                </div>
                {blocked > 0 && (
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                    🔒 {formatINR(blocked)} IPO Blocked
                  </span>
                )}
              </div>
            );
          })()}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Amount to Withdraw (₹)</label>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              placeholder="e.g. 5000.75"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-lg font-bold focus:outline-none focus:border-rose-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Rent, Grocery, Cash Withdrawal"
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-rose-600"
            />
          </div>

          {formError && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{formError}</p>}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveAction('menu')}
              className="w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 shadow-sm cursor-pointer"
            >
              Confirm Remove Money
            </button>
          </div>
        </form>
      )}

      {/* Transfer Form */}
      {activeAction === 'transfer' && (
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <CustomDropdown
            label="From Account"
            value={selectedAccountId}
            onChange={(val) => setSelectedAccountId(val)}
            themeVariant="sky"
            options={accounts.map((acc) => {
              const avail = getAccountAvailableBalance(acc, applications, allocations);
              return {
                value: acc.id,
                label: acc.name,
                subLabel: `Available: ${formatINR(avail)}`,
                icon: (
                  <BankLogo
                    name={acc.name}
                    type={acc.type}
                    color={acc.color}
                    size="sm"
                    className="w-4 h-4 rounded-md !p-0.5"
                  />
                ),
              };
            })}
          />

          {(() => {
            const fromAcc = accounts.find((a) => a.id === selectedAccountId);
            if (!fromAcc) return null;
            const avail = getAccountAvailableBalance(fromAcc, applications, allocations);

            return (
              <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold uppercase block">Transfer Limit</span>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100">{formatINR(avail)}</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Available in {fromAcc.name}
                </span>
              </div>
            );
          })()}

          <CustomDropdown
            label="To Destination Account"
            value={targetAccountId}
            onChange={(val) => setTargetAccountId(val)}
            themeVariant="sky"
            options={accounts.map((acc) => ({
              value: acc.id,
              label: acc.name,
              subLabel: `Balance: ${formatINR(acc.balance)}`,
              icon: (
                <BankLogo
                  name={acc.name}
                  type={acc.type}
                  color={acc.color}
                  size="sm"
                  className="w-4 h-4 rounded-md !p-0.5"
                />
              ),
            }))}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Transfer Amount (₹)</label>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              placeholder="e.g. 10000.50"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-lg font-bold focus:outline-none focus:border-sky-600"
              required
            />
          </div>

          {formError && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{formError}</p>}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveAction('menu')}
              className="w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 shadow-sm cursor-pointer"
            >
              Confirm Transfer
            </button>
          </div>
        </form>
      )}

      {/* Add Account Form */}
      {activeAction === 'add_account' && (
        <form onSubmit={handleAddAccountSubmit} className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl">
            <BankLogo name={accName || (accType === 'demat' ? 'Groww' : 'HDFC Bank')} type={accType} size="md" />
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Account Label / Name</label>
              <input
                type="text"
                placeholder="e.g. Groww, Zerodha, HDFC Bank, SBI"
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:border-purple-600"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Quick Popular Suggestions</label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Tap to select</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50/70 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              {[
                { label: 'Groww', type: 'demat' as AccountType },
                { label: 'Zerodha Kite', type: 'demat' as AccountType },
                { label: 'Angel One', type: 'demat' as AccountType },
                { label: 'Upstox', type: 'demat' as AccountType },
                { label: 'Dhan', type: 'demat' as AccountType },
                { label: 'INDmoney', type: 'demat' as AccountType },
                { label: 'Paytm Money', type: 'demat' as AccountType },
                { label: 'ICICI Direct', type: 'demat' as AccountType },
                { label: 'Kotak Neo', type: 'demat' as AccountType },
                { label: 'HDFC Bank', type: 'bank' as AccountType },
                { label: 'State Bank of India', type: 'bank' as AccountType },
                { label: 'ICICI Bank', type: 'bank' as AccountType },
                { label: 'Axis Bank', type: 'bank' as AccountType },
                { label: 'Bank of Baroda', type: 'bank' as AccountType },
                { label: 'Punjab National Bank', type: 'bank' as AccountType },
              ].map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => {
                    setAccName(item.label);
                    setAccType(item.type);
                  }}
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    accName.toLowerCase() === item.label.toLowerCase()
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <BankLogo name={item.label} type={item.type} size="sm" className="w-4 h-4 rounded-md !p-0.5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Account Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['bank', 'cash', 'demat', 'wallet', 'investment', 'other'] as AccountType[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setAccType(t)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                    accType === t
                      ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-600 text-purple-700 dark:text-purple-300'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {accType === 'demat' || accType === 'investment' ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1.5">Invested Money (₹)</label>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={accInvestedAmount}
                  onChange={(e) => setAccInvestedAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:border-indigo-600"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">Equity/stocks holding</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1.5">Fund on Account (₹)</label>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={accInitialBalance}
                  onChange={(e) => setAccInitialBalance(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">Cash trading balance</span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Initial Balance (₹)</label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="0.00"
                value={accInitialBalance}
                onChange={(e) => setAccInitialBalance(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-base font-bold focus:outline-none focus:border-purple-600"
              />
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveAction('menu')}
              className="w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 shadow-sm cursor-pointer"
            >
              Save Account
            </button>
          </div>
        </form>
      )}

      {/* Add Investment Form */}
      {activeAction === 'add_investment' && (
        <div className="space-y-4">
          {/* Quick Scanner Shortcut Banner */}
          <div
            onClick={() => {
              handleClose();
              setIsScannerOpen(true);
            }}
            className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between cursor-pointer hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 transition-all group"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                  Have a Demat Screenshot?
                </h4>
                <p className="text-[10px] text-indigo-700 dark:text-indigo-400">
                  Tap to auto-scan Zerodha, Groww, AngelOne holdings
                </p>
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">Scan Now →</span>
          </div>

          <form onSubmit={handleAddInvestmentSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Stock Symbol</label>
                  <button
                    type="button"
                    onClick={handleFetchLtp}
                    disabled={isFetchingLtp || !invSymbol.trim()}
                    className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center space-x-1 cursor-pointer disabled:opacity-40"
                    title="Fetch current market price from NSE/BSE"
                  >
                  {isFetchingLtp ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  )}
                  <span>{isFetchingLtp ? 'Fetching...' : 'Fetch LTP'}</span>
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. RELIANCE"
                value={invSymbol}
                onChange={(e) => {
                  setInvSymbol(e.target.value);
                  setLtpFeedback(null);
                }}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs uppercase font-bold focus:outline-none focus:border-indigo-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Quantity</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="e.g. 10"
                value={invQty}
                onChange={(e) => setInvQty(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:border-indigo-600"
                required
              />
            </div>
          </div>

          {ltpFeedback && (
            <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
              {ltpFeedback}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Company Name</label>
            <input
              type="text"
              placeholder="e.g. Reliance Industries Limited"
              value={invName}
              onChange={(e) => setInvName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-600"
              required
            />
          </div>

          {dematAccounts.length > 0 && (
            <CustomDropdown
              label="Demat Account"
              value={invAccountId}
              onChange={(val) => setInvAccountId(val)}
              themeVariant="indigo"
              placeholder="General Portfolio (No Specific Demat)"
              options={[
                {
                  value: '',
                  label: 'General Portfolio (No Specific Demat)',
                  subLabel: 'Do not assign to a specific Demat',
                },
                ...dematAccounts.map((d) => ({
                  value: d.id,
                  label: d.name,
                  subLabel: `Funds: ${formatINR(d.balance)} • Invested: ${formatINR(d.investedAmount ?? 0)}`,
                  badge: d.type.toUpperCase(),
                  icon: (
                    <BankLogo
                      name={d.name}
                      type="demat"
                      color={d.color}
                      size="sm"
                      className="w-4 h-4 rounded-md !p-0.5"
                    />
                  ),
                })),
              ]}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Avg Buy Price (₹)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="e.g. 2950"
                value={invAvgPrice}
                onChange={(e) => setInvAvgPrice(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:border-indigo-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Current Price (₹)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="e.g. 3020"
                value={invCurPrice}
                onChange={(e) => setInvCurPrice(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveAction('menu')}
                className="w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 shadow-sm cursor-pointer"
              >
                Save Stock Holding
              </button>
            </div>
          </form>
        </div>
      )}
    </BottomSheet>

    <DematScreenshotScannerModal
      isOpen={isScannerOpen}
      onClose={() => setIsScannerOpen(false)}
      defaultAccountId={invAccountId || selectedAccountId}
    />
  </>
  );
}
