'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { calculateMoneySummary, getAccountAvailableBalance } from '@/lib/finance/ledger';
import { formatINR, formatDate } from '@/lib/utils/formatters';
import { SegmentedBar, BankLogo } from '../common/SegmentedBar';
import { BottomSheet } from '../common/BottomSheet';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  TrendingUp,
  Building2,
  ChevronRight,
  Lock,
  LineChart,
  Plus,
  Trash2,
} from 'lucide-react';

export function HomeScreen() {
  const {
    accounts,
    applications,
    allocations,
    investments,
    transactions,
    deleteInvestment,
    setActiveTab,
    setActiveIpoSubTab,
    setActiveAccountFilter,
    setSelectedAccountDetailId,
    setSelectedAppDetailId,
    setQuickActionOpen,
  } = useAppStore();

  const [investedModalOpen, setInvestedModalOpen] = useState(false);

  const summary = calculateMoneySummary(accounts, applications, allocations, investments);

  const activeApplications = applications.filter(
    (app) => !['NOT_ALLOTTED', 'CANCELLED', 'COMPLETED'].includes(app.status)
  );

  const recentTransactions = transactions.slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const segments = [
    {
      label: 'Bank Accounts',
      amount: summary.byAccountType.bank || 0,
      color: '#0284c7', // Sky
      onClick: () => {
        setActiveAccountFilter('BANK');
        setActiveTab('accounts');
      },
    },
    {
      label: 'Cash & Wallets',
      amount: summary.byAccountType.cash || 0,
      color: '#d97706', // Amber
      onClick: () => {
        setActiveAccountFilter('CASH');
        setActiveTab('accounts');
      },
    },
    {
      label: 'Investments / Demat',
      amount: summary.investedMoney || 0,
      color: '#6366f1', // Indigo
      onClick: () => setInvestedModalOpen(true),
    },
    {
      label: 'IPO Blocked',
      amount: summary.blockedMoney || 0,
      color: '#ea580c', // Orange
      onClick: () => {
        setActiveIpoSubTab('MY_APPLICATIONS');
        setActiveTab('ipos');
      },
    },
  ];

  const handleClearAllInvestments = () => {
    if (confirm('Clear all tracked stock holdings to make Invested value ₹0?')) {
      for (const inv of investments) {
        deleteInvestment(inv.id);
      }
    }
  };

  return (
    <div className="space-y-4 pb-28 animate-fade-in">
      {/* Header Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[#64748b] dark:text-slate-400">{greeting} 👋</span>
          <h1 className="text-xl font-extrabold text-[#0f172a] dark:text-slate-100 tracking-tight">Where is my money?</h1>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#ecfdf5] dark:bg-emerald-950/50 border border-[#a7f3d0] dark:border-emerald-800 text-[11px] text-[#047857] dark:text-emerald-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          <span>Manual</span>
        </div>
      </div>

      {/* Main Available Balance Hero Card */}
      <div className="relative rounded-3xl bg-white dark:bg-[#0f172a] p-5 border border-[#e2e8f0] dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden transition-colors">
        <div className="space-y-3.5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-[#059669] dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                <span>Available Balance</span>
              </span>
              <div className="text-3xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight mt-0.5">
                {formatINR(summary.availableMoney)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#94a3b8] dark:text-slate-400 uppercase tracking-wider">
                Total Tracked
              </span>
              <div className="text-xs font-black text-[#334155] dark:text-slate-300 mt-0.5">
                {formatINR(summary.totalTrackedMoney)}
              </div>
            </div>
          </div>

          {/* Sub Balances in clean rounded tiles */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#f1f5f9] dark:border-slate-800">
            <button
              onClick={() => {
                setActiveAccountFilter('ALL');
                setActiveTab('accounts');
              }}
              className="p-2.5 rounded-2xl bg-[#f0fdf4] dark:bg-emerald-950/30 border border-[#dcfce7] dark:border-emerald-900/50 text-left hover:bg-[#dcfce7]/60 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
            >
              <span className="text-[10px] text-[#15803d] dark:text-emerald-400 font-bold uppercase">Total Tracked</span>
              <div className="text-xs font-black text-[#0f172a] dark:text-slate-100 mt-0.5 truncate">
                {formatINR(summary.totalTrackedMoney)}
              </div>
            </button>

            <button
              onClick={() => {
                setActiveIpoSubTab('MY_APPLICATIONS');
                setActiveTab('ipos');
              }}
              className="p-2.5 rounded-2xl bg-[#fffbeb] dark:bg-amber-950/30 border border-[#fef3c7] dark:border-amber-900/50 text-left hover:bg-[#fef3c7]/60 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
            >
              <span className="text-[10px] text-[#b45309] dark:text-amber-400 font-bold uppercase">IPO Blocked</span>
              <div className="text-xs font-black text-[#0f172a] dark:text-slate-100 mt-0.5 truncate">
                {formatINR(summary.blockedMoney)}
              </div>
            </button>

            <button
              onClick={() => setInvestedModalOpen(true)}
              className="p-2.5 rounded-2xl bg-[#eef2ff] dark:bg-indigo-950/30 border border-[#e0e7ff] dark:border-indigo-900/50 text-left hover:bg-[#e0e7ff]/60 dark:hover:bg-indigo-900/40 transition-colors group cursor-pointer"
              title="Tap to manage investments"
            >
              <span className="text-[10px] text-[#4338ca] dark:text-indigo-400 font-bold uppercase flex items-center justify-between">
                <span>Invested</span>
                <span className="text-[9px] text-[#6366f1] dark:text-indigo-300 group-hover:underline">Edit →</span>
              </span>
              <div className="text-xs font-black text-[#0f172a] dark:text-slate-100 mt-0.5 truncate">
                {formatINR(summary.investedMoney)}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setQuickActionOpen(true, 'add_money')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-slate-800 hover:border-[#10b981] active:scale-95 transition-all text-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#ecfdf5] dark:bg-emerald-950/50 text-[#059669] dark:text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-[#1e293b] dark:text-slate-200">Add</span>
        </button>

        <button
          onClick={() => setQuickActionOpen(true, 'transfer')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-slate-800 hover:border-[#0ea5e9] active:scale-95 transition-all text-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#f0f9ff] dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-[#1e293b] dark:text-slate-200">Transfer</span>
        </button>

        <button
          onClick={() => {
            setActiveIpoSubTab('LIVE');
            setActiveTab('ipos');
          }}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-slate-800 hover:border-[#f59e0b] active:scale-95 transition-all text-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#fffbeb] dark:bg-amber-950/50 text-[#d97706] dark:text-amber-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-[#1e293b] dark:text-slate-200">Apply IPO</span>
        </button>

        <button
          onClick={() => setQuickActionOpen(true, 'add_account')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-slate-800 hover:border-[#8b5cf6] active:scale-95 transition-all text-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#fdf4ff] dark:bg-purple-950/50 text-[#9333ea] dark:text-purple-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-[#1e293b] dark:text-slate-200">Account</span>
        </button>
      </div>

      {/* Money Distribution Visualizer */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-slate-800 space-y-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider">
            Money Distribution
          </span>
          <span className="text-xs font-bold text-[#94a3b8] dark:text-slate-400">
            {accounts.length} Accounts
          </span>
        </div>
        <SegmentedBar segments={segments} total={summary.totalTrackedMoney} />
      </div>

      {/* Your Accounts Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider">
            Your Accounts
          </h2>
          <button
            onClick={() => {
              setActiveAccountFilter('ALL');
              setActiveTab('accounts');
            }}
            className="text-xs text-[#059669] dark:text-emerald-400 hover:text-[#047857] font-bold flex items-center space-x-0.5 cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {accounts.length === 0 ? (
          <div
            onClick={() => setQuickActionOpen(true, 'add_account')}
            className="p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">No Accounts Added Yet</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Tap here to add your first Bank or Demat account</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.slice(0, 3).map((acc) => {
              const avail = getAccountAvailableBalance(acc, applications, allocations);
              return (
                <div
                  key={acc.id}
                  onClick={() => setSelectedAccountDetailId(acc.id)}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-slate-800 hover:border-[#cbd5e1] dark:hover:border-slate-700 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center space-x-3">
                    <BankLogo name={acc.name} type={acc.type} color={acc.color} size="md" />
                    <div>
                      <h3 className="text-sm font-bold text-[#0f172a] dark:text-slate-100">{acc.name}</h3>
                      <p className="text-xs text-[#64748b] dark:text-slate-400 capitalize">
                        {acc.type === 'demat' || acc.type === 'investment'
                          ? `${acc.type} • Equity Holdings`
                          : `${acc.type} • Avail: ${formatINR(avail)}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-[#0f172a] dark:text-slate-100">{formatINR(acc.balance)}</div>
                    {acc.type !== 'demat' && acc.type !== 'investment' && acc.balance !== avail && (
                      <span className="text-[10px] text-[#d97706] dark:text-amber-400 font-bold">
                        Blocked: {formatINR(acc.balance - avail)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Active IPO Applications */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider">
            My IPO Applications
          </h2>
          <button
            onClick={() => {
              setActiveIpoSubTab('MY_APPLICATIONS');
              setActiveTab('ipos');
            }}
            className="text-xs text-[#059669] dark:text-emerald-400 hover:text-[#047857] font-bold flex items-center space-x-0.5 cursor-pointer"
          >
            <span>View all ({applications.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {activeApplications.length === 0 ? (
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-slate-800 text-center space-y-2 shadow-xs">
            <TrendingUp className="w-8 h-8 text-[#94a3b8] dark:text-slate-500 mx-auto" />
            <p className="text-xs text-[#64748b] dark:text-slate-400 font-medium">No active IPO applications right now.</p>
            <button
              onClick={() => {
                setActiveIpoSubTab('LIVE');
                setActiveTab('ipos');
              }}
              className="text-xs text-[#059669] dark:text-emerald-400 font-bold hover:underline cursor-pointer"
            >
              Browse Live IPOs →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {activeApplications.slice(0, 2).map((app) => {
              const bankAcc = accounts.find((a) => a.id === app.accountId);
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedAppDetailId(app.id)}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-slate-800 hover:border-[#cbd5e1] dark:hover:border-slate-700 active:scale-[0.99] transition-all space-y-2 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#0f172a] dark:text-slate-100">{app.companyName}</h3>
                      <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">
                        {app.lotsApplied} Lot(s) • Bank: {bankAcc?.name || 'Manual Bank'}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        app.status === 'FULLY_ALLOTTED'
                          ? 'bg-[#ecfdf5] text-[#047857] border-[#a7f3d0] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : app.status === 'PARTIALLY_ALLOTTED'
                          ? 'bg-[#f0f9ff] text-[#0369a1] border-[#bae6fd] dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                          : app.status === 'NOT_ALLOTTED'
                          ? 'bg-[#fff1f2] text-[#be123c] border-[#fecdd3] dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                          : 'bg-[#fffbeb] text-[#b45309] border-[#fde68a] dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#f1f5f9] dark:border-slate-800">
                    <span className="text-[#64748b] dark:text-slate-400 font-medium">Blocked Amount</span>
                    <span className="font-extrabold text-[#d97706] dark:text-amber-400">{formatINR(app.blockedAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider">
            Recent Activity
          </h2>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs text-[#059669] dark:text-emerald-400 hover:text-[#047857] font-bold flex items-center space-x-0.5"
          >
            <span>History</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <p className="text-xs text-[#94a3b8] dark:text-slate-500 text-center py-4">No recent activity recorded.</p>
          ) : (
            recentTransactions.map((tx) => {
              const acc = accounts.find((a) => a.id === tx.accountId);
              const isCredit = ['MONEY_ADDED', 'TRANSFER_IN', 'INCOME', 'IPO_RELEASED'].includes(tx.type);
              const isBlocked = tx.type === 'IPO_ALLOCATION_BLOCKED';

              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-slate-800 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold ${
                        isCredit
                          ? 'bg-[#ecfdf5] dark:bg-emerald-950/50 text-[#059669] dark:text-emerald-400'
                          : isBlocked
                          ? 'bg-[#fffbeb] dark:bg-amber-950/50 text-[#d97706] dark:text-amber-400'
                          : 'bg-[#fff1f2] dark:bg-rose-950/50 text-[#e11d48] dark:text-rose-400'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : isBlocked ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0f172a] dark:text-slate-100 line-clamp-1">
                        {tx.description}
                      </h4>
                      <p className="text-[11px] text-[#64748b] dark:text-slate-400 mt-0.5">
                        {acc?.name || 'Account'} • {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-black ${
                      isCredit
                        ? 'text-[#059669]'
                        : isBlocked
                        ? 'text-[#d97706]'
                        : 'text-[#e11d48]'
                    }`}
                  >
                    {isCredit ? '+' : isBlocked ? '🔒 ' : '-'}
                    {formatINR(tx.amount)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Invested Holdings Management Modal */}
      <BottomSheet
        isOpen={investedModalOpen}
        onClose={() => setInvestedModalOpen(false)}
        title="Stock Holdings (Invested Value)"
        subtitle={`Current Value: ${formatINR(summary.investedMoney)}`}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#64748b] font-bold">{investments.length} Stocks Tracked</span>
            <div className="flex space-x-2">
              {investments.length > 0 && (
                <button
                  onClick={handleClearAllInvestments}
                  className="px-3 py-1.5 rounded-2xl bg-[#fff1f2] text-[#e11d48] hover:bg-[#ffe4e6] font-bold text-xs flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All (Make ₹0)</span>
                </button>
              )}
              <button
                onClick={() => {
                  setInvestedModalOpen(false);
                  setQuickActionOpen(true, 'add_investment');
                }}
                className="px-3.5 py-1.5 rounded-2xl bg-[#059669] text-white font-bold text-xs flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stock</span>
              </button>
            </div>
          </div>

          {investments.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0] text-center space-y-2">
              <LineChart className="w-10 h-10 text-[#94a3b8] mx-auto" />
              <h4 className="text-xs font-bold text-[#0f172a]">No stock holdings tracked</h4>
              <p className="text-[11px] text-[#64748b]">Your Invested value is now ₹0.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {investments.map((inv) => {
                const currentVal = inv.quantity * (inv.currentPrice || inv.avgPrice);
                const investedVal = inv.quantity * inv.avgPrice;
                const pnl = currentVal - investedVal;
                const pnlPct = investedVal > 0 ? (pnl / investedVal) * 100 : 0;

                return (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-[#0f172a]">{inv.symbol}</h4>
                        <span className="text-[10px] text-[#64748b] truncate max-w-[120px]">
                          {inv.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748b] mt-0.5">
                        {inv.quantity} shares • Avg: ₹{inv.avgPrice} • LTP: ₹{inv.currentPrice}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-xs font-black text-[#0f172a]">{formatINR(currentVal)}</div>
                        <span
                          className={`text-[10px] font-bold ${
                            pnl >= 0 ? 'text-[#059669]' : 'text-[#e11d48]'
                          }`}
                        >
                          {pnl >= 0 ? '+' : ''}
                          {formatINR(pnl)} ({pnlPct.toFixed(1)}%)
                        </span>
                      </div>

                      <button
                        onClick={() => deleteInvestment(inv.id)}
                        className="p-2 rounded-xl text-[#e11d48] hover:bg-[#ffe4e6] transition-colors"
                        title="Delete stock to reduce Invested value"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
