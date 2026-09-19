'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { IPO, IPOStatus } from '@/lib/types/finance';
import { formatINR, formatDate, formatDateRange, formatTime } from '@/lib/utils/formatters';
import { getAccountAvailableBalance } from '@/lib/finance/ledger';
import { BottomSheet } from '../common/BottomSheet';
import { MyIPOsScreen } from './MyIPOsScreen';
import {
  TrendingUp,
  RefreshCw,
  Search,
  Calendar,
  Layers,
  Plus,
  Minus,
  CheckCircle2,
} from 'lucide-react';

export function IPOsScreen() {
  const {
    liveIPOs,
    isIPORefreshing,
    lastIPORefresh,
    ipoProviderSource,
    fetchLiveIPOs,
    accounts,
    applications,
    allocations,
    applyForIPO,
    selectedIPODetailId,
    setSelectedIPODetailId,
    activeIpoSubTab,
    setActiveIpoSubTab,
    setQuickActionOpen,
  } = useAppStore();

  const [activeStatusTab, setActiveStatusTab] = useState<IPOStatus>('OPEN');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'MAINBOARD' | 'SME'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Application Modal state
  const [applyingIPO, setApplyingIPO] = useState<IPO | null>(null);
  const [lotCount, setLotCount] = useState(1);
  const [useCutoffPrice, setUseCutoffPrice] = useState(true);
  const [customPrice, setCustomPrice] = useState(0);
  const [manualCost, setManualCost] = useState<number | ''>(0);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [selectedDematId, setSelectedDematId] = useState('');
  const [appNotes, setAppNotes] = useState('');
  const [applyError, setApplyError] = useState('');
  const [applySuccessMessage, setApplySuccessMessage] = useState('');

  const filteredIPOs = liveIPOs.filter((ipo) => {
    if (ipo.status !== activeStatusTab) return false;
    if (selectedCategory !== 'ALL' && ipo.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ipo.companyName.toLowerCase().includes(q) ||
        ipo.symbol.toLowerCase().includes(q) ||
        ipo.exchange.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenApplyModal = (ipo: IPO) => {
    const defaultBank = accounts.find((a) => a.type === 'bank') || accounts[0];
    if (!defaultBank) {
      alert('Please add a Bank Account first to record your IPO applications and blocked funds.');
      setQuickActionOpen(true, 'add_account');
      return;
    }
    const initialCost = ipo.priceHigh * ipo.lotSize;
    setApplyingIPO(ipo);
    setLotCount(1);
    setUseCutoffPrice(true);
    setCustomPrice(ipo.priceHigh);
    setManualCost(initialCost);
    setSelectedBankId(defaultBank.id);
    setSelectedDematId(accounts.find((a) => a.type === 'demat')?.id || '');
    setApplyError('');
    setApplySuccessMessage('');
    setAppNotes(`Applied for ${ipo.companyName}`);
  };

  const handleLotChange = (newLots: number) => {
    const safeLots = Math.max(1, newLots);
    setLotCount(safeLots);
    if (applyingIPO) {
      const price = useCutoffPrice ? applyingIPO.priceHigh : (customPrice || applyingIPO.priceHigh);
      setManualCost(price * applyingIPO.lotSize * safeLots);
    }
  };

  const handlePriceModeToggle = (cutoff: boolean) => {
    setUseCutoffPrice(cutoff);
    if (applyingIPO) {
      const price = cutoff ? applyingIPO.priceHigh : (customPrice || applyingIPO.priceHigh);
      setManualCost(price * applyingIPO.lotSize * lotCount);
    }
  };

  const handleCustomPriceChange = (val: number) => {
    setCustomPrice(val);
    if (applyingIPO) {
      setManualCost(val * applyingIPO.lotSize * lotCount);
    }
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingIPO) return;

    const finalPrice = useCutoffPrice ? applyingIPO.priceHigh : customPrice;
    const finalAmount =
      typeof manualCost === 'number' && manualCost > 0
        ? manualCost
        : finalPrice * applyingIPO.lotSize * lotCount;

    const result = applyForIPO({
      ipoId: applyingIPO.id,
      companyName: applyingIPO.companyName,
      symbol: applyingIPO.symbol,
      accountId: selectedBankId,
      dematAccountId: selectedDematId || undefined,
      lotsApplied: lotCount,
      applicationPrice: finalPrice,
      lotSize: applyingIPO.lotSize,
      customTotalAmount: finalAmount,
      notes: appNotes,
    });

    if (result.success) {
      setApplySuccessMessage('Application confirmed! Funds marked as blocked in your virtual ledger.');
      setTimeout(() => {
        setApplyingIPO(null);
        setSelectedIPODetailId(null);
        setActiveIpoSubTab('MY_APPLICATIONS');
      }, 1100);
    } else {
      setApplyError(result.error || 'Failed to submit application.');
    }
  };

  return (
    <div className="space-y-4 pb-36 animate-fade-in">
      {/* Top Navigation: Live Market vs My Applications */}
      <div className="flex p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <button
          onClick={() => setActiveIpoSubTab('LIVE')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeIpoSubTab === 'LIVE'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Live Market IPOs</span>
        </button>
        <button
          onClick={() => setActiveIpoSubTab('MY_APPLICATIONS')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeIpoSubTab === 'MY_APPLICATIONS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>My IPOs ({applications.length})</span>
        </button>
      </div>

      {activeIpoSubTab === 'MY_APPLICATIONS' ? (
        <MyIPOsScreen onSwitchToLive={() => setActiveIpoSubTab('LIVE')} />
      ) : (
        <>
          {/* Clean Search & Status Bar in Green Theme */}
          <div className="space-y-3 bg-white dark:bg-[#0f172a] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search IPOs by name, symbol..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-7 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                onClick={() => fetchLiveIPOs(true)}
                disabled={isIPORefreshing}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-all text-xs font-bold shrink-0 flex items-center space-x-1.5 cursor-pointer"
                title="Refresh Live Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isIPORefreshing ? 'animate-spin text-emerald-600' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Segmented Status Tabs in Emerald */}
            <div className="flex items-center space-x-1 border-b border-slate-100 dark:border-slate-800 pb-1 overflow-x-auto scrollbar-none">
              {(['OPEN', 'CLOSED'] as IPOStatus[]).map((st) => {
                const isActive = activeStatusTab === st;
                const label = st === 'OPEN' ? '🟢 Ongoing / Open' : '🔒 Closed / Past';
                return (
                  <button
                    key={st}
                    onClick={() => setActiveStatusTab(st)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Category Filter */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-slate-400 dark:text-slate-500 font-bold text-[11px] uppercase tracking-wider">Issue Type</span>
              <div className="flex items-center space-x-1.5">
                {(['ALL', 'MAINBOARD', 'SME'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Spacious & Clean Live IPO Cards List */}
          {filteredIPOs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-xs">
              <TrendingUp className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No {activeStatusTab.toLowerCase()} IPOs found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Try switching status tabs or search for another company.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIPOs.map((ipo) => {
                const oneLotCost = ipo.minimumInvestment || (ipo.priceHigh * ipo.lotSize);

                return (
                  <div
                    key={ipo.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600 active:scale-[0.99] transition-all shadow-xs hover:shadow-md space-y-3"
                  >
                    {/* Header Row: Company Title + Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-snug break-words">
                            {ipo.companyName}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border shrink-0 ${
                              ipo.category === 'SME'
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            {ipo.category}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{ipo.symbol}</span>
                          <span>•</span>
                          <span>{ipo.exchange}</span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border shrink-0 ${
                          ipo.status === 'OPEN'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {ipo.status === 'OPEN' ? '🟢 Open Now' : '🔒 Closed'}
                      </span>
                    </div>

                    {/* 3-Column Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide block">Price Band</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                          {ipo.priceLow === ipo.priceHigh ? `₹${ipo.priceHigh}` : `₹${ipo.priceLow} – ₹${ipo.priceHigh}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide block">Lot Size</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                          {ipo.lotSize} shares
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide block">
                          Timeline
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block truncate">
                          {formatDateRange(ipo.openDate, ipo.closeDate)}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Min. 1 Lot = <span className="font-extrabold text-slate-900 dark:text-slate-100">{ipo.lotSize} Shares</span>
                      </div>

                      <button
                        onClick={() => handleOpenApplyModal(ipo)}
                        className={`px-3.5 py-2 rounded-xl active:scale-95 text-white shadow-md transition-all flex items-center space-x-2 shrink-0 cursor-pointer group ${
                          ipo.status === 'OPEN'
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                            : 'bg-slate-700 hover:bg-slate-600 shadow-slate-700/25'
                        }`}
                      >
                        <span className="text-xs font-black text-white">{formatINR(oneLotCost)}</span>
                        <div className="w-px h-4 bg-white/30" />
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg shadow-2xs transition-colors flex items-center space-x-0.5 ${
                          ipo.status === 'OPEN'
                            ? 'bg-white text-emerald-700 group-hover:bg-emerald-50'
                            : 'bg-white text-slate-800'
                        }`}>
                          <span>{ipo.status === 'OPEN' ? 'Apply' : 'Record'}</span>
                          <span>+</span>
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Apply Modal with Direct Manual Cost Editing */}
          <BottomSheet
            isOpen={!!applyingIPO}
            onClose={() => setApplyingIPO(null)}
            title={`Apply: ${applyingIPO?.companyName}`}
            subtitle={`${applyingIPO?.symbol} • ${applyingIPO?.category} Issue`}
          >
            {applyingIPO && (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                {applySuccessMessage && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center space-x-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{applySuccessMessage}</span>
                  </div>
                )}

                {/* Issue Details Breakdown Header */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block">Issue Price Band</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                      {applyingIPO.priceLow === applyingIPO.priceHigh
                        ? `₹${applyingIPO.priceHigh.toLocaleString('en-IN')}`
                        : `₹${applyingIPO.priceLow.toLocaleString('en-IN')} – ₹${applyingIPO.priceHigh.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block">Lot Size</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                      {applyingIPO.lotSize.toLocaleString('en-IN')} shares / lot
                    </span>
                  </div>
                </div>

                {/* 1. Direct Editable Application Cost */}
                <div className="p-4 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-emerald-950 dark:text-emerald-300 uppercase tracking-wider">
                      Application Cost (₹)
                    </label>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                      Directly Editable
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-lg font-black text-emerald-700 dark:text-emerald-400">₹</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={manualCost}
                      onChange={(e) =>
                        setManualCost(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-slate-100 text-xl font-black focus:outline-none focus:border-emerald-600 shadow-inner"
                      placeholder="Enter exact cost"
                      required
                    />
                  </div>

                  <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-medium">
                    This exact amount will be tracked as blocked funds in your selected bank account.
                  </p>
                </div>

                {/* 2. Lot Multiplier Controls */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Number of Lots</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      ({applyingIPO.lotSize} shares/lot)
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleLotChange(lotCount - 1)}
                      className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 flex items-center justify-center font-bold active:scale-95 shadow-xs cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 text-center py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-black text-base text-slate-900 dark:text-slate-100 shadow-inner">
                      {lotCount} {lotCount === 1 ? 'Lot' : 'Lots'}
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                        ({lotCount * applyingIPO.lotSize} total shares)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLotChange(lotCount + 1)}
                      className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 flex items-center justify-center font-bold active:scale-95 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Lot Selection Chips */}
                  <div className="flex items-center space-x-1.5 pt-1">
                    {[1, 2, 3, 5, 10].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => handleLotChange(num)}
                        className={`flex-1 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          lotCount === num
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {num}L
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Price Mode Option */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bid Price per Share</label>
                    <button
                      type="button"
                      onClick={() => handlePriceModeToggle(!useCutoffPrice)}
                      className={`text-[11px] font-bold cursor-pointer ${
                        useCutoffPrice ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {useCutoffPrice ? '✓ Cut-off Price' : 'Custom Price'}
                    </button>
                  </div>

                  {useCutoffPrice ? (
                    <div className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs flex justify-between items-center">
                      <span>Cut-off Price (Cap)</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-black">₹{applyingIPO.priceHigh}</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      inputMode="decimal"
                      value={customPrice || ''}
                      onChange={(e) => handleCustomPriceChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:border-emerald-600"
                      placeholder="Enter bid price"
                    />
                  )}
                </div>

                {/* 4. Bank Account Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Account (for ASBA / UPI Mandate Block)
                  </label>
                  <select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                    required
                  >
                    {accounts
                      .filter((a) => a.type === 'bank' || a.type === 'cash' || a.type === 'wallet')
                      .map((acc) => {
                        const avail = getAccountAvailableBalance(acc, applications, allocations);
                        return (
                          <option key={acc.id} value={acc.id}>
                            🏦 {acc.name} (Avail: {formatINR(avail)})
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* 5. Demat Account Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Demat Account (for Share Allotment Credit)
                  </label>
                  <select
                    value={selectedDematId}
                    onChange={(e) => setSelectedDematId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">None / Manual Record</option>
                    {accounts
                      .filter((a) => a.type === 'demat' || a.type === 'investment')
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          📊 {acc.name}
                        </option>
                      ))}
                  </select>
                </div>

                {applyError && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                    {applyError}
                  </div>
                )}

                {/* Confirm Application Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all cursor-pointer"
                >
                  Confirm & Block {typeof manualCost === 'number' ? formatINR(manualCost) : 'Funds'}
                </button>
              </form>
            )}
          </BottomSheet>
        </>
      )}
    </div>
  );
}
