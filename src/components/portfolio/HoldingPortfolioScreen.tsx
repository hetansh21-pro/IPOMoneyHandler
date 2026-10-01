'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { formatINR } from '@/lib/utils/formatters';
import { Investment } from '@/lib/types/finance';
import { fetchLiveStockQuote } from '@/lib/market/priceFetcher';
import { BottomSheet } from '../common/BottomSheet';
import { CustomDropdown } from '../common/CustomDropdown';
import { BankLogo } from '../common/SegmentedBar';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { SlidingSegmentedTabs } from '../common/SlidingSegmentedTabs';
import { DematScreenshotScannerModal } from '../investments/DematScreenshotScannerModal';
import { useBackHandler } from '@/lib/hooks/useBackHandler';
import { useSwipeGesture } from '@/lib/hooks/useSwipeGesture';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  Camera,
  Trash2,
  Edit2,
  Search,
  Zap,
  Loader2,
  LineChart,
  Briefcase,
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  CheckCircle2,
  Banknote,
  DollarSign,
} from 'lucide-react';

export function HoldingPortfolioScreen() {
  const {
    accounts,
    investments,
    isRefreshingPrices,
    deleteInvestment,
    updateInvestment,
    addInvestment,
    sellInvestment,
    refreshHoldingsPrices,
    activeMemberId,
    familyMembers,
  } = useAppStore();

  const dematAccounts = useMemo(
    () => accounts.filter((a) => a.type === 'demat' || a.type === 'investment'),
    [accounts]
  );

  // Filter & Search states
  const [selectedBrokerFilter, setSelectedBrokerFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'pnl' | 'invested' | 'name'>('value');

  // Modal states
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState<Investment | null>(null);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);

  // Form states for Add Stock
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newAvgPrice, setNewAvgPrice] = useState('');
  const [newCurPrice, setNewCurPrice] = useState('');
  const [newAccountId, setNewAccountId] = useState(dematAccounts[0]?.id || '');
  const [isFetchingNewLtp, setIsFetchingNewLtp] = useState(false);
  const [newLtpFeedback, setNewLtpFeedback] = useState<string | null>(null);

  // Form states for Edit Stock
  const [editSymbol, setEditSymbol] = useState('');
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editAvgPrice, setEditAvgPrice] = useState('');
  const [editCurPrice, setEditCurPrice] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [isFetchingEditLtp, setIsFetchingEditLtp] = useState(false);
  const [editLtpFeedback, setEditLtpFeedback] = useState<string | null>(null);

  // Form states for Sell Stock
  const [sellingInvestment, setSellingInvestment] = useState<Investment | null>(null);
  const [sellQty, setSellQty] = useState<string>('1');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [sellCreditAccountId, setSellCreditAccountId] = useState<string>('');
  const [sellNotes, setSellNotes] = useState<string>('');
  const [sellError, setSellError] = useState<string | null>(null);
  const [sellSuccessMsg, setSellSuccessMsg] = useState<string | null>(null);
  const [isFetchingSellLtp, setIsFetchingSellLtp] = useState(false);

  // Back Navigation Handlers
  useBackHandler(isClearAllDialogOpen, () => {
    setIsClearAllDialogOpen(false);
    return true;
  });

  useBackHandler(!!stockToDelete, () => {
    setStockToDelete(null);
    return true;
  });

  useBackHandler(isScannerOpen, () => {
    setIsScannerOpen(false);
    return true;
  });

  useBackHandler(isAddingStock, () => {
    setIsAddingStock(false);
    return true;
  });

  useBackHandler(!!editingInvestment, () => {
    setEditingInvestment(null);
    return true;
  });

  useBackHandler(!!sellingInvestment, () => {
    setSellingInvestment(null);
    return true;
  });

  // Member-scoped investments
  const memberInvestments = useMemo(() => {
    if (!activeMemberId || activeMemberId === 'all') return investments;
    if (activeMemberId === 'self') return investments.filter((inv) => !inv.memberId || inv.memberId === 'self');
    return investments.filter((inv) => inv.memberId === activeMemberId);
  }, [investments, activeMemberId]);

  // Calculate overall portfolio metrics
  const portfolioStats = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;

    memberInvestments.forEach((inv) => {
      const curP = inv.currentPrice && inv.currentPrice > 0 ? inv.currentPrice : inv.avgPrice;
      const invVal = inv.quantity * inv.avgPrice;
      const curVal = inv.quantity * curP;
      totalInvested += invVal;
      totalCurrent += curVal;
    });

    const totalPnl = totalCurrent - totalInvested;
    const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrent,
      totalPnl,
      totalPnlPct,
      count: memberInvestments.length,
    };
  }, [memberInvestments]);

  // Filtered & Sorted Stock list
  const filteredInvestments = useMemo(() => {
    return memberInvestments
      .filter((inv) => {
        // Broker filter
        if (selectedBrokerFilter === 'UNASSIGNED') {
          if (inv.accountId) return false;
        } else if (selectedBrokerFilter !== 'ALL') {
          if (inv.accountId !== selectedBrokerFilter) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesSymbol = inv.symbol.toLowerCase().includes(q);
          const matchesName = (inv.name || '').toLowerCase().includes(q);
          return matchesSymbol || matchesName;
        }

        return true;
      })
      .sort((a, b) => {
        const curA = a.quantity * (a.currentPrice || a.avgPrice);
        const curB = b.quantity * (b.currentPrice || b.avgPrice);
        const invA = a.quantity * a.avgPrice;
        const invB = b.quantity * b.avgPrice;
        const pnlA = curA - invA;
        const pnlB = curB - invB;

        if (sortBy === 'value') return curB - curA;
        if (sortBy === 'pnl') return pnlB - pnlA;
        if (sortBy === 'invested') return invB - invA;
        return a.symbol.localeCompare(b.symbol);
      });
  }, [memberInvestments, selectedBrokerFilter, searchQuery, sortBy]);

  // Handle Fetch LTP for new stock
  const handleFetchNewStockLtp = async () => {
    if (!newSymbol.trim()) return;
    setIsFetchingNewLtp(true);
    setNewLtpFeedback(null);
    try {
      const quote = await fetchLiveStockQuote(newSymbol);
      if (quote && quote.price > 0) {
        setNewCurPrice(quote.price.toString());
        if (!newName.trim() && quote.name) {
          setNewName(quote.name);
        }
        if (!newAvgPrice) {
          setNewAvgPrice(quote.price.toString());
        }
        setNewLtpFeedback(`⚡ Live LTP: ₹${quote.price.toLocaleString('en-IN')} (${quote.source || 'NSE'})`);
      } else {
        setNewLtpFeedback('Symbol not found on NSE/BSE. You can enter manual price.');
      }
    } catch {
      setNewLtpFeedback('Failed to fetch. Please enter manual price.');
    } finally {
      setIsFetchingNewLtp(false);
    }
  };

  // Handle Fetch LTP for edit stock
  const handleFetchEditStockLtp = async () => {
    if (!editSymbol.trim()) return;
    setIsFetchingEditLtp(true);
    setEditLtpFeedback(null);
    try {
      const quote = await fetchLiveStockQuote(editSymbol);
      if (quote && quote.price > 0) {
        setEditCurPrice(quote.price.toString());
        if (!editName.trim() && quote.name) {
          setEditName(quote.name);
        }
        setEditLtpFeedback(`⚡ Live LTP: ₹${quote.price.toLocaleString('en-IN')} (${quote.source || 'NSE'})`);
      } else {
        setEditLtpFeedback('Symbol not found on NSE/BSE.');
      }
    } catch {
      setEditLtpFeedback('Failed to fetch live price.');
    } finally {
      setIsFetchingEditLtp(false);
    }
  };

  const handleOpenEdit = (inv: Investment) => {
    setEditingInvestment(inv);
    setEditSymbol(inv.symbol);
    setEditName(inv.name || inv.symbol);
    setEditQty(inv.quantity.toString());
    setEditAvgPrice(inv.avgPrice.toString());
    setEditCurPrice((inv.currentPrice || inv.avgPrice).toString());
    setEditAccountId(inv.accountId || '');
    setEditLtpFeedback(null);
  };

  const handleSaveAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(newQty) || 1;
    const avg = parseFloat(newAvgPrice) || 0;
    const cur = parseFloat(newCurPrice) || avg;

    addInvestment({
      symbol: newSymbol.trim().toUpperCase(),
      name: newName.trim() || newSymbol.trim().toUpperCase(),
      quantity: qty,
      avgPrice: avg,
      currentPrice: cur,
      accountId: newAccountId || undefined,
      memberId: activeMemberId === 'all' ? 'self' : activeMemberId,
    });

    setIsAddingStock(false);
    setNewSymbol('');
    setNewName('');
    setNewQty('1');
    setNewAvgPrice('');
    setNewCurPrice('');
    setNewLtpFeedback(null);
  };

  const handleSaveEditStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvestment) return;

    const qty = parseInt(editQty) || 1;
    const avg = parseFloat(editAvgPrice) || 0;
    const cur = parseFloat(editCurPrice) || avg;

    updateInvestment(editingInvestment.id, {
      symbol: editSymbol.trim().toUpperCase(),
      name: editName.trim() || editSymbol.trim().toUpperCase(),
      quantity: qty,
      avgPrice: avg,
      currentPrice: cur,
      accountId: editAccountId || undefined,
    });

    setEditingInvestment(null);
  };

  const handleOpenSell = (inv: Investment) => {
    setSellingInvestment(inv);
    setSellQty(inv.quantity.toString());
    const curP = inv.currentPrice && inv.currentPrice > 0 ? inv.currentPrice : inv.avgPrice;
    setSellPrice(curP.toString());

    // Prefer bank accounts for receiving cash funds, fallback to linked Demat or first account
    const defaultAcc =
      accounts.find((a) => a.type === 'bank') ||
      accounts.find((a) => a.id === inv.accountId) ||
      accounts[0];

    setSellCreditAccountId(defaultAcc ? defaultAcc.id : '');
    setSellNotes(`Sold ${inv.symbol} shares`);
    setSellError(null);
    setSellSuccessMsg(null);
  };

  const handleFetchSellStockLtp = async () => {
    if (!sellingInvestment?.symbol) return;
    setIsFetchingSellLtp(true);
    try {
      const quote = await fetchLiveStockQuote(sellingInvestment.symbol);
      if (quote && quote.price > 0) {
        setSellPrice(quote.price.toString());
      }
    } catch {
      // ignore
    } finally {
      setIsFetchingSellLtp(false);
    }
  };

  const handleConfirmSell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingInvestment) return;

    const parsedQty = parseInt(sellQty) || 0;
    const parsedPrice = parseFloat(sellPrice) || 0;

    if (parsedQty <= 0 || parsedQty > sellingInvestment.quantity) {
      setSellError(`Please enter a quantity between 1 and ${sellingInvestment.quantity}.`);
      return;
    }
    if (parsedPrice <= 0) {
      setSellError('Please enter a valid selling price greater than ₹0.');
      return;
    }
    if (!sellCreditAccountId) {
      setSellError('Please select a bank account to receive the sale proceeds.');
      return;
    }

    const res = sellInvestment({
      investmentId: sellingInvestment.id,
      quantityToSell: parsedQty,
      sellingPrice: parsedPrice,
      creditedAccountId: sellCreditAccountId,
      notes: sellNotes,
    });

    if (res.success) {
      const acc = accounts.find((a) => a.id === sellCreditAccountId);
      setSellSuccessMsg(
        `Successfully sold ${parsedQty} share(s)! ${formatINR(res.proceeds || 0)} credited to ${acc?.name || 'your balance'}.`
      );
      setTimeout(() => {
        setSellingInvestment(null);
        setSellSuccessMsg(null);
      }, 1100);
    } else {
      setSellError(res.error || 'Failed to complete stock sale.');
    }
  };

  const handleConfirmClearAll = () => {
    for (const inv of investments) {
      deleteInvestment(inv.id);
    }
  };

  const brokerTabs = useMemo(() => ['ALL', ...dematAccounts.map((a) => a.id)], [dematAccounts]);
  const currentBrokerIndex = brokerTabs.indexOf(selectedBrokerFilter);

  const handleSwipeLeft = () => {
    if (currentBrokerIndex >= 0 && currentBrokerIndex < brokerTabs.length - 1) {
      setSelectedBrokerFilter(brokerTabs[currentBrokerIndex + 1]);
    }
  };

  const handleSwipeRight = () => {
    if (currentBrokerIndex > 0) {
      setSelectedBrokerFilter(brokerTabs[currentBrokerIndex - 1]);
    }
  };

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  return (
    <div {...swipeHandlers} className="space-y-4 pb-6 animate-fade-in touch-pan-y flex-1 min-h-full flex flex-col justify-start">
      {/* Top Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[#64748b] dark:text-slate-400">
            Stock Holdings & Demat
          </span>
          <h1 className="text-xl font-extrabold text-[#0f172a] dark:text-slate-100 tracking-tight flex items-center space-x-2">
            <span>Holding Portfolio</span>
          </h1>
        </div>

        {/* Live status badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live 1m Sync</span>
        </div>
      </div>

      {/* Main Portfolio Summary Card with iOS Frosted Glass */}
      <div className="relative rounded-[30px] bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-indigo-950/90 text-white p-5 border border-white/20 dark:border-white/10 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider block">
                Current Portfolio Value
              </span>
              <div className="text-3xl font-black tracking-tight mt-0.5 text-white">
                {formatINR(portfolioStats.totalCurrent)}
              </div>
            </div>

            <button
              onClick={() => refreshHoldingsPrices()}
              disabled={isRefreshingPrices}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center space-x-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Fetch live prices from NSE/BSE"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-indigo-300 ${isRefreshingPrices ? 'animate-spin' : ''}`}
              />
              <span className="text-[11px]">
                {isRefreshingPrices ? 'Syncing...' : 'Sync Prices'}
              </span>
            </button>
          </div>

          {/* Sub Metrics: Invested, Returns, Holdings Count */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/15">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-bold text-slate-300 uppercase block">
                Total Invested
              </span>
              <div className="text-xs font-black text-white mt-0.5 truncate">
                {formatINR(portfolioStats.totalInvested)}
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md col-span-2">
              <span className="text-[10px] font-bold text-slate-300 uppercase block">
                Total Returns (P&L)
              </span>
              <div
                className={`text-xs font-black mt-0.5 flex items-center space-x-1 ${
                  portfolioStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {portfolioStats.totalPnl >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>
                  {portfolioStats.totalPnl >= 0 ? '+' : ''}
                  {formatINR(portfolioStats.totalPnl)} (
                  {portfolioStats.totalPnlPct >= 0 ? '+' : ''}
                  {portfolioStats.totalPnlPct.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Buttons Row */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setIsAddingStock(true)}
          className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Stock</span>
        </button>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>Scan Screenshot</span>
        </button>
      </div>

      {/* Broker / Demat Account Filter Tabs */}
      {dematAccounts.length > 0 && (
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedBrokerFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedBrokerFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            All Accounts ({investments.length})
          </button>

          {dematAccounts.map((acc) => {
            const accCount = investments.filter((i) => i.accountId === acc.id).length;
            const isSelected = selectedBrokerFilter === acc.id;
            return (
              <button
                key={acc.id}
                onClick={() => setSelectedBrokerFilter(acc.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 flex items-center space-x-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{acc.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isSelected
                      ? 'bg-indigo-700 text-indigo-100'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {accCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search & Sort Toolbar with iOS Glass */}
      {investments.length > 0 && (
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search stock by name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-2xl ios-glass-pill text-slate-900 dark:text-slate-100 text-xs font-semibold placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div className="w-36 shrink-0">
            <CustomDropdown
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              themeVariant="indigo"
              size="sm"
              options={[
                { value: 'value', label: 'Sort: Value' },
                { value: 'pnl', label: 'Sort: Gain/Loss' },
                { value: 'invested', label: 'Sort: Invested' },
                { value: 'name', label: 'Sort: A-Z' },
              ]}
            />
          </div>

          <button
            onClick={() => setIsClearAllDialogOpen(true)}
            className="p-2 rounded-2xl ios-glass-pill text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shadow-xs"
            title="Clear all holdings"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Holdings List */}
      {filteredInvestments.length === 0 ? (
        <div
          key={`empty-${selectedBrokerFilter}`}
          className="p-8 rounded-3xl ios-glass-card text-center space-y-3 animate-card-slide"
        >
          <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <LineChart className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              {investments.length === 0 ? 'No Stock Holdings Yet' : 'No Matching Stocks'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[260px] mx-auto">
              {investments.length === 0
                ? 'Add your stocks manually or scan your Zerodha, Groww, AngelOne broker screenshots.'
                : 'Try adjusting your search query or broker filters.'}
            </p>
          </div>
          {investments.length === 0 && (
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                onClick={() => setIsAddingStock(true)}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Add First Stock
              </button>
              <button
                onClick={() => setIsScannerOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Scan Broker App
              </button>
            </div>
          )}
        </div>
      ) : (
        <div key={selectedBrokerFilter} className="space-y-2.5 animate-card-slide">
          {filteredInvestments.map((inv, index) => {
            const currentPrice = inv.currentPrice && inv.currentPrice > 0 ? inv.currentPrice : inv.avgPrice;
            const currentVal = inv.quantity * currentPrice;
            const investedVal = inv.quantity * inv.avgPrice;
            const pnl = currentVal - investedVal;
            const pnlPct = investedVal > 0 ? (pnl / investedVal) * 100 : 0;
            const linkedAccount = accounts.find((a) => a.id === inv.accountId);

            return (
              <div
                key={inv.id}
                style={{ animationDelay: `${Math.min(index * 30, 150)}ms` }}
                className="animate-card-item p-4 rounded-[28px] ios-glass-card space-y-3.5 transition-all hover:border-indigo-400/40 dark:hover:border-indigo-500/40 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] relative overflow-hidden group"
              >
                {/* Header: Symbol + Account Pill + Actions */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {inv.symbol}
                      </span>
                      {linkedAccount && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                          {linkedAccount.name}
                        </span>
                      )}
                      {inv.isIpoAllotted && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase">
                          IPO Allotted
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5 max-w-[220px]">
                      {inv.name || inv.symbol}
                    </p>
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(inv)}
                      className="w-7 h-7 rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                      title="Edit Stock"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setStockToDelete(inv)}
                      className="w-7 h-7 rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                      title="Delete Stock"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Value & P&L Hero Section */}
                <div className="flex items-end justify-between pt-0.5">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Current Value
                    </span>
                    <div className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight mt-0.5">
                      {formatINR(currentVal)}
                    </div>
                  </div>

                  {/* Modern Floating iOS P&L Pill Badge */}
                  <div
                    className={`px-3 py-1.5 rounded-2xl flex items-center space-x-1.5 shadow-xs border ${
                      pnl >= 0
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {pnl >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                    <span className="text-xs font-black">
                      {pnl >= 0 ? '+' : ''}{formatINR(pnl)}
                    </span>
                    <span className="text-[11px] font-extrabold opacity-80">
                      ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Glass Inset Stats Row: Qty, Avg Buy, LTP, Invested */}
                <div className="grid grid-cols-4 gap-2 p-2.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-white/60 dark:border-white/5 backdrop-blur-md text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Shares</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-[11px] mt-0.5 block">
                      {inv.quantity}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Avg Buy</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-[11px] mt-0.5 block">
                      ₹{inv.avgPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block">LTP</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-[11px] mt-0.5 block">
                      ₹{currentPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Invested</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-[11px] mt-0.5 block truncate">
                      {formatINR(investedVal)}
                    </span>
                  </div>
                </div>

                {/* Footer: Quick Sell Action Pill */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 dark:border-white/5">
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Market Tracked</span>
                  </div>

                  <button
                    onClick={() => handleOpenSell(inv)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 dark:bg-rose-500/15 dark:hover:bg-rose-600 text-rose-600 hover:text-white dark:text-rose-400 dark:hover:text-white border border-rose-500/25 hover:border-rose-600 font-extrabold text-xs flex items-center space-x-1.5 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
                    title="Sell stock and credit funds to balance"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Sell Position</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Stock BottomSheet Modal */}
      <BottomSheet
        isOpen={isAddingStock}
        onClose={() => setIsAddingStock(false)}
        title="Add Stock Holding"
        subtitle="Track stock in your Demat portfolio"
      >
        <form onSubmit={handleSaveAddStock} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300">
                  Stock Symbol
                </label>
                <button
                  type="button"
                  onClick={handleFetchNewStockLtp}
                  disabled={isFetchingNewLtp || !newSymbol.trim()}
                  className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center space-x-1 cursor-pointer disabled:opacity-40"
                  title="Auto-fetch live price from NSE/BSE"
                >
                  {isFetchingNewLtp ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  )}
                  <span>{isFetchingNewLtp ? 'Fetching...' : 'Fetch LTP'}</span>
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. RELIANCE"
                value={newSymbol}
                onChange={(e) => {
                  setNewSymbol(e.target.value);
                  setNewLtpFeedback(null);
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 font-bold text-xs uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">
                Quantity (Shares)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 font-bold text-xs"
                required
              />
            </div>
          </div>

          {newLtpFeedback && (
            <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
              {newLtpFeedback}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">
              Company Name
            </label>
            <input
              type="text"
              placeholder="e.g. Reliance Industries Ltd"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 text-xs font-medium"
              required
            />
          </div>

          {dematAccounts.length > 0 && (
            <CustomDropdown
              label="Linked Demat Account"
              value={newAccountId}
              onChange={(val) => setNewAccountId(val)}
              themeVariant="indigo"
              placeholder="General Portfolio (No Demat Assigned)"
              options={[
                {
                  value: '',
                  label: 'General Portfolio (No Demat Assigned)',
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
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">
                Avg Buy Price (₹)
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="e.g. 2950"
                value={newAvgPrice}
                onChange={(e) => setNewAvgPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 font-bold text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">
                Current Market Price (₹)
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="e.g. 3020"
                value={newCurPrice}
                onChange={(e) => setNewCurPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 font-bold text-xs"
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingStock(false)}
              className="w-1/3 py-3 rounded-2xl bg-[#f1f5f9] dark:bg-slate-800 text-[#64748b] dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs shadow-md cursor-pointer"
            >
              Save Stock Holding
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Edit Stock Holding Modal */}
      <BottomSheet
        isOpen={!!editingInvestment}
        onClose={() => setEditingInvestment(null)}
        title={`Edit ${editingInvestment?.symbol}`}
        subtitle="Update quantity, price or linked Demat account"
      >
        {editingInvestment && (
          <form onSubmit={handleSaveEditStock} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#334155] dark:text-slate-300">
                    Stock Symbol
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchEditStockLtp}
                    disabled={isFetchingEditLtp || !editSymbol.trim()}
                    className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center space-x-1 cursor-pointer disabled:opacity-40"
                    title="Fetch current market price from NSE/BSE"
                  >
                    {isFetchingEditLtp ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    )}
                    <span>{isFetchingEditLtp ? 'Fetching...' : 'Fetch LTP'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={editSymbol}
                  onChange={(e) => {
                    setEditSymbol(e.target.value);
                    setEditLtpFeedback(null);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 font-bold text-xs uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">
                  Quantity (Shares)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 font-bold text-xs"
                  required
                />
              </div>
            </div>

            {editLtpFeedback && (
              <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                {editLtpFeedback}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 text-xs font-medium"
                required
              />
            </div>

            {dematAccounts.length > 0 && (
              <CustomDropdown
                label="Demat Account"
                value={editAccountId}
                onChange={(val) => setEditAccountId(val)}
                themeVariant="indigo"
                placeholder="General Portfolio (No Demat Assigned)"
                options={[
                  {
                    value: '',
                    label: 'General Portfolio (No Demat Assigned)',
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
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">
                  Avg Buy Price (₹)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={editAvgPrice}
                  onChange={(e) => setEditAvgPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 font-bold text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">
                  Current Price (₹)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={editCurPrice}
                  onChange={(e) => setEditCurPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 font-bold text-xs"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingInvestment(null)}
                className="w-1/3 py-3 rounded-2xl bg-[#f1f5f9] dark:bg-slate-800 text-[#64748b] dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs shadow-md cursor-pointer"
              >
                Update Stock
              </button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Sell Stock Holding BottomSheet Modal */}
      <BottomSheet
        isOpen={!!sellingInvestment}
        onClose={() => setSellingInvestment(null)}
        title={`Sell ${sellingInvestment?.symbol}`}
        subtitle="Book profits & credit proceeds directly to your account balance"
      >
        {sellingInvestment && (() => {
          const parsedQty = Math.max(1, Math.min(sellingInvestment.quantity, parseInt(sellQty) || 1));
          const parsedPrice = parseFloat(sellPrice) || 0;
          const totalProceeds = parsedQty * parsedPrice;
          const costBasis = parsedQty * sellingInvestment.avgPrice;
          const realizedPnl = totalProceeds - costBasis;
          const realizedPnlPct = costBasis > 0 ? (realizedPnl / costBasis) * 100 : 0;
          const isFullSell = parsedQty === sellingInvestment.quantity;

          return (
            <form onSubmit={handleConfirmSell} className="space-y-4">
              {sellSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs flex items-center space-x-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{sellSuccessMsg}</span>
                </div>
              )}

              {/* Holding Info Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Stock</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">
                    {sellingInvestment.symbol}
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                    {sellingInvestment.name || sellingInvestment.symbol}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Holding Qty</span>
                  <span className="font-black text-slate-900 dark:text-slate-100">
                    {sellingInvestment.quantity} Shares
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg Buy</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    ₹{sellingInvestment.avgPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Quantity to Sell & Quick Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Quantity to Sell (Shares)
                  </label>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    Max: {sellingInvestment.quantity}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={sellingInvestment.quantity}
                    inputMode="numeric"
                    value={sellQty}
                    onChange={(e) => setSellQty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-base font-black focus:outline-none focus:border-emerald-600 shadow-inner"
                    required
                  />
                </div>

                {/* Quick % Chips */}
                <div className="flex items-center space-x-1.5 pt-0.5">
                  {[
                    { label: '25%', frac: 0.25 },
                    { label: '50%', frac: 0.5 },
                    { label: '75%', frac: 0.75 },
                    { label: '100% (All)', frac: 1.0 },
                  ].map((chip) => {
                    const targetQ = Math.max(1, Math.floor(sellingInvestment.quantity * chip.frac));
                    const isSelected = parseInt(sellQty) === targetQ;
                    return (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => setSellQty(targetQ.toString())}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selling Price per share */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Selling Price per Share (₹)
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchSellStockLtp}
                    disabled={isFetchingSellLtp}
                    className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center space-x-1 cursor-pointer disabled:opacity-40"
                  >
                    {isFetchingSellLtp ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    )}
                    <span>Fetch Current LTP</span>
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-base font-black focus:outline-none focus:border-emerald-600 shadow-inner"
                    placeholder="e.g. 3100"
                    required
                  />
                </div>
              </div>

              {/* Sale Summary Card (Proceeds & Realized Gain/Loss) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-emerald-950/40 dark:to-teal-950/30 border-2 border-emerald-300 dark:border-emerald-700 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block">
                      Total Sale Proceeds (Credited to Balance)
                    </span>
                    <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight mt-0.5">
                      {formatINR(totalProceeds)}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                      Realized P&L
                    </span>
                    <div
                      className={`text-sm font-black mt-0.5 flex items-center justify-end space-x-1 ${
                        realizedPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      <span>{realizedPnl >= 0 ? '+' : ''}{formatINR(realizedPnl)}</span>
                      <span className="text-[10px]">({realizedPnlPct >= 0 ? '+' : ''}{realizedPnlPct.toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-semibold border-t border-emerald-200/80 dark:border-emerald-800/80 pt-2">
                  {isFullSell ? 'All shares will be sold and removed from holdings.' : `Remaining: ${sellingInvestment.quantity - parsedQty} shares in your Demat.`}
                </p>
              </div>

              {/* Credit Account Selector */}
              <CustomDropdown
                label="Credit Proceeds To (Bank Account)"
                value={sellCreditAccountId}
                onChange={(val) => setSellCreditAccountId(val)}
                themeVariant="emerald"
                options={accounts.map((acc) => ({
                  value: acc.id,
                  label: acc.name,
                  subLabel: `Current Balance: ${formatINR(acc.balance)}`,
                  badge: acc.type.toUpperCase(),
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

              {sellError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {sellError}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSellingInvestment(null)}
                  className="w-1/3 py-3 rounded-2xl bg-[#f1f5f9] dark:bg-slate-800 text-[#64748b] dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-600/30 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                  <span>Sell & Credit {formatINR(totalProceeds)}</span>
                </button>
              </div>
            </form>
          );
        })()}
      </BottomSheet>

      {/* Demat Screenshot Scanner Modal */}
      <DematScreenshotScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

      {/* Delete Stock Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!stockToDelete}
        onClose={() => setStockToDelete(null)}
        onConfirm={() => {
          if (stockToDelete) {
            deleteInvestment(stockToDelete.id);
            setStockToDelete(null);
          }
        }}
        title={`Delete ${stockToDelete?.symbol}?`}
        message={`Are you sure you want to remove ${stockToDelete?.symbol} (${stockToDelete?.name}) from your stock holdings? This will reduce your Invested value.`}
        confirmText="Delete Stock"
        cancelText="Cancel"
        variant="danger"
        icon="trash"
      />

      {/* Clear All Holdings Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isClearAllDialogOpen}
        onClose={() => setIsClearAllDialogOpen(false)}
        onConfirm={handleConfirmClearAll}
        title="Clear All Stock Holdings?"
        message="Are you sure you want to clear all tracked stock holdings? Your total Invested value will become ₹0."
        confirmText="Clear All Holdings"
        cancelText="Cancel"
        variant="danger"
        icon="trash"
      />
    </div>
  );
}
