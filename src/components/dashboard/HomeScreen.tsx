'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { calculateMoneySummary, getAccountAvailableBalance } from '@/lib/finance/ledger';
import { formatINR, formatDate } from '@/lib/utils/formatters';
import { SegmentedBar, BankLogo } from '../common/SegmentedBar';
import { BottomSheet } from '../common/BottomSheet';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useBackHandler } from '@/lib/hooks/useBackHandler';
import { getIndianMarketStatus } from '@/lib/market/marketHours';
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
  Activity,
  Clock,
} from 'lucide-react';

export function HomeScreen() {
  const {
    accounts,
    applications,
    allocations,
    investments,
    transactions,
    activeMemberId,
    familyMembers,
    deleteInvestment,
    setActiveTab,
    setActiveIpoSubTab,
    setActiveAccountFilter,
    setSelectedAccountDetailId,
    setSelectedAppDetailId,
    setQuickActionOpen,
  } = useAppStore();

  const [investedModalOpen, setInvestedModalOpen] = useState(false);
  const [isClearInvestmentsDialogOpen, setIsClearInvestmentsDialogOpen] = useState(false);

  useBackHandler(investedModalOpen, () => {
    setInvestedModalOpen(false);
    return true;
  });

  useBackHandler(isClearInvestmentsDialogOpen, () => {
    setIsClearInvestmentsDialogOpen(false);
    return true;
  });

  // Filter state for active family member
  const filteredAccounts = activeMemberId === 'all'
    ? accounts
    : accounts.filter((a) => a.memberId === activeMemberId || (activeMemberId === 'self' && !a.memberId));

  const filteredApplications = activeMemberId === 'all'
    ? applications
    : applications.filter((app) => app.memberId === activeMemberId || (activeMemberId === 'self' && !app.memberId));

  const filteredInvestments = activeMemberId === 'all'
    ? investments
    : investments.filter((inv) => inv.memberId === activeMemberId || (activeMemberId === 'self' && !inv.memberId));

  const filteredAllocations = activeMemberId === 'all'
    ? allocations
    : allocations.filter((al) => filteredAccounts.some((acc) => acc.id === al.accountId));

  const filteredTransactions = activeMemberId === 'all'
    ? transactions
    : transactions.filter((t) => t.memberId === activeMemberId || (activeMemberId === 'self' && !t.memberId) || filteredAccounts.some((acc) => acc.id === t.accountId));

  const summary = calculateMoneySummary(filteredAccounts, filteredApplications, filteredAllocations, filteredInvestments);

  const activeApplications = filteredApplications.filter(
    (app) => !['NOT_ALLOTTED', 'CANCELLED', 'COMPLETED'].includes(app.status)
  );

  const recentTransactions = filteredTransactions.filter((t) => t.amount > 0).slice(0, 5);

  const activeMember = familyMembers.find((m) => m.id === activeMemberId);
  const memberTitle = activeMember ? `${activeMember.name}'s Portfolio` : 'All Family Overview';

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
      onClick: () => setActiveTab('holdings'),
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
    setIsClearInvestmentsDialogOpen(true);
  };

  const handleConfirmClearInvestments = () => {
    for (const inv of investments) {
      deleteInvestment(inv.id);
    }
  };

  return (
    <div className="space-y-4 pb-6 animate-fade-in">
      {/* Header Greeting & Market Timing Status */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[#64748b] dark:text-slate-400">{greeting}</span>
          <h1 className="text-xl font-extrabold text-[#0f172a] dark:text-slate-100 tracking-tight">Where is my money?</h1>
        </div>
        
        {/* Real-time Indian Market Status Chip */}
        {(() => {
          const market = getIndianMarketStatus();
          const isLive = market.isTradingActive;
          return (
            <button
              onClick={() => setActiveTab('ipos')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs ${
                isLive
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
              title={market.subLabel}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{isLive ? 'Market Live' : 'Market Closed'}</span>
            </button>
          );
        })()}
      </div>

      {/* Main Available Balance Hero Card with Silver Shine Metallic Titanium Finish */}
      <div className="relative rounded-[32px] bg-gradient-to-br from-[#ffffff] via-[#f1f5f9] to-[#d8e2ee] dark:from-[#1e293b] dark:via-[#0f172a] dark:to-[#1a2234] p-5 border border-white/90 dark:border-slate-600/50 shadow-[0_16px_45px_rgba(148,163,184,0.22)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all group">
        {/* Specular Silver Metallic Shine Streaks */}
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-gradient-to-br from-white/80 via-slate-200/30 to-transparent dark:from-slate-700/20 dark:via-slate-800/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-gradient-to-tr from-slate-200/50 via-white/40 to-transparent dark:from-slate-800/30 dark:via-slate-700/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/90 dark:via-slate-400/30 to-transparent pointer-events-none" />

        <div className="space-y-4 relative z-10">
          {/* Top Label */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
              <span>Available Balance</span>
            </span>
          </div>

          {/* Hero Big Balance */}
          <div>
            <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {formatINR(summary.availableMoney)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Ready for withdrawal & IPO applications
            </p>
          </div>

          {/* 3-Column Silver Frosted Glass Pods */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => {
                setActiveAccountFilter('ALL');
                setActiveTab('accounts');
              }}
              className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 backdrop-blur-xl text-left transition-all cursor-pointer active:scale-95 shadow-xs group/pod"
            >
              <div className="flex items-center space-x-1.5 mb-1">
                <div className="w-4 h-4 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Wallet className="w-2.5 h-2.5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tracked
                </span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-slate-100 truncate tracking-tight">
                {formatINR(summary.totalTrackedMoney)}
              </div>
            </button>

            <button
              onClick={() => {
                setActiveIpoSubTab('MY_APPLICATIONS');
                setActiveTab('ipos');
              }}
              className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 backdrop-blur-xl text-left transition-all cursor-pointer active:scale-95 shadow-xs group/pod"
            >
              <div className="flex items-center space-x-1.5 mb-1">
                <div className="w-4 h-4 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Lock className="w-2.5 h-2.5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Blocked
                </span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-slate-100 truncate tracking-tight">
                {formatINR(summary.blockedMoney)}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('holdings')}
              className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 backdrop-blur-xl text-left transition-all cursor-pointer active:scale-95 shadow-xs group/pod"
            >
              <div className="flex items-center space-x-1.5 mb-1">
                <div className="w-4 h-4 rounded-md bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <LineChart className="w-2.5 h-2.5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Invested
                </span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-slate-100 truncate tracking-tight">
                {formatINR(summary.investedMoney)}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions Row with iOS Glass styling */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setQuickActionOpen(true, 'add_money')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl ios-glass-card hover:bg-white dark:hover:bg-slate-800/90 active:scale-95 transition-all text-center group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Add</span>
        </button>

        <button
          onClick={() => setQuickActionOpen(true, 'transfer')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl ios-glass-card hover:bg-white dark:hover:bg-slate-800/90 active:scale-95 transition-all text-center group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-sky-500/15 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <ArrowRightLeft className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Transfer</span>
        </button>

        <button
          onClick={() => {
            setActiveIpoSubTab('LIVE');
            setActiveTab('ipos');
          }}
          className="flex flex-col items-center justify-center p-3 rounded-2xl ios-glass-card hover:bg-white dark:hover:bg-slate-800/90 active:scale-95 transition-all text-center group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Apply IPO</span>
        </button>

        <button
          onClick={() => setQuickActionOpen(true, 'add_account')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl ios-glass-card hover:bg-white dark:hover:bg-slate-800/90 active:scale-95 transition-all text-center group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-500/15 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Account</span>
        </button>
      </div>

      {/* Money Distribution Visualizer */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-slate-800 space-y-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider">
            Money Distribution
          </span>
          <span className="text-xs font-bold text-[#94a3b8] dark:text-slate-400">
            {filteredAccounts.length} Accounts
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

        {filteredAccounts.length === 0 ? (
          <div
            onClick={() => setQuickActionOpen(true, 'add_account')}
            className="p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">No Accounts Added Yet</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Tap here to add an account for this profile</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAccounts.slice(0, 3).map((acc) => {
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
                    {isCredit ? '+' : isBlocked ? '' : '-'}
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

      {/* Clear Investments Confirm Dialog */}
      <ConfirmDialog
        isOpen={isClearInvestmentsDialogOpen}
        onClose={() => setIsClearInvestmentsDialogOpen(false)}
        onConfirm={handleConfirmClearInvestments}
        title="Clear All Stock Holdings?"
        message="Are you sure you want to clear all tracked stock holdings? This will make your Invested value ₹0."
        confirmText="Clear Holdings"
        cancelText="Cancel"
        variant="danger"
        icon="trash"
      />
    </div>
  );
}
