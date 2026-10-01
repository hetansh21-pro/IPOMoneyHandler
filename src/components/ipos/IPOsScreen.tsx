'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { IPO, IPOStatus } from '@/lib/types/finance';
import { formatINR, formatDateRange } from '@/lib/utils/formatters';
import { getRealtimeIPOTiming, getNowIST } from '@/lib/market/marketHours';
import { BottomSheet } from '../common/BottomSheet';
import { CustomDropdown } from '../common/CustomDropdown';
import { BankLogo } from '../common/SegmentedBar';
import { MyIPOsScreen } from './MyIPOsScreen';
import { IPODetailModal } from './IPODetailModal';
import { SlidingSegmentedTabs } from '../common/SlidingSegmentedTabs';
import { useBackHandler } from '@/lib/hooks/useBackHandler';
import { useSwipeGesture } from '@/lib/hooks/useSwipeGesture';
import {
  TrendingUp,
  RefreshCw,
  Search,
  Calendar,
  Layers,
  Plus,
  Minus,
  CheckCircle2,
  Lock,
  ArrowRight,
  Briefcase,
  X,
  Sparkles,
  ArrowUpRight,
  Clock,
  Activity,
  ExternalLink,
  Flame,
} from 'lucide-react';

export type IpoTimelineGroup = 'CLOSING_TODAY' | 'OPEN' | 'UPCOMING' | 'CLOSED';

export function getIpoTimelineGroup(ipo: IPO, todayStr: string): IpoTimelineGroup {
  if (ipo.status === 'CLOSED' || ipo.status === 'LISTED') return 'CLOSED';
  
  const daysToClose = Math.ceil(
    (new Date(ipo.closeDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (ipo.status === 'OPEN') {
    if (ipo.closeDate === todayStr || daysToClose <= 0) {
      return 'CLOSING_TODAY';
    }
    return 'OPEN';
  }

  if (ipo.status === 'UPCOMING') {
    return 'UPCOMING';
  }

  return 'CLOSED';
}

function formatCleanExchange(exchange: string): string {
  if (!exchange) return 'NSE / BSE';
  const cleaned = exchange
    .replace(/\bSME\b/gi, '')
    .replace(/,\s*/g, ' / ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\/|\/$/g, '')
    .trim();
  return cleaned || 'NSE / BSE';
}

export function IPOsScreen() {
  const {
    liveIPOs,
    isIPORefreshing,
    fetchLiveIPOs,
    accounts,
    applications,
    applyForIPO,
    selectedIPODetailId,
    setSelectedIPODetailId,
    activeIpoSubTab,
    setActiveIpoSubTab,
    setQuickActionOpen,
  } = useAppStore();

  const [activeStatusTab, setActiveStatusTab] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'MAINBOARD' | 'SME'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Application Modal state
  const [applyingIPO, setApplyingIPO] = useState<IPO | null>(null);
  const [lotCount, setLotCount] = useState<number>(1);
  const [lotSize, setLotSize] = useState<number | ''>(1);
  const [useCutoffPrice, setUseCutoffPrice] = useState(true);
  const [customPrice, setCustomPrice] = useState(0);
  const [manualCost, setManualCost] = useState<number | ''>(0);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [selectedDematId, setSelectedDematId] = useState('');
  const [appNotes, setAppNotes] = useState('');
  const [applyError, setApplyError] = useState('');
  const [applySuccessMessage, setApplySuccessMessage] = useState('');

  useEffect(() => {
    setIsTransitioning(true);
    const mainEl = document.querySelector('main');
    if (mainEl && mainEl.scrollTop > 50) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 320);
    return () => clearTimeout(timer);
  }, [activeIpoSubTab]);

  useBackHandler(!!applyingIPO, () => {
    setApplyingIPO(null);
    return true;
  });

  useBackHandler(!!selectedIPODetailId, () => {
    setSelectedIPODetailId(null);
    return true;
  });

  const ist = getNowIST();
  const todayStr = ist.istDateStr;

  const filteredIPOs = useMemo(() => {
    const list = liveIPOs.filter((ipo) => {
      if (activeStatusTab === 'OPEN') {
        if (ipo.status !== 'OPEN' && ipo.status !== 'UPCOMING') return false;
      } else {
        if (ipo.status !== 'CLOSED' && ipo.status !== 'LISTED') return false;
      }
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

    if (activeStatusTab === 'OPEN') {
      const priorityMap: Record<IpoTimelineGroup, number> = {
        CLOSING_TODAY: 1,
        OPEN: 2,
        UPCOMING: 3,
        CLOSED: 4,
      };

      return list.sort((a, b) => {
        const groupA = getIpoTimelineGroup(a, todayStr);
        const groupB = getIpoTimelineGroup(b, todayStr);

        const prioA = priorityMap[groupA] || 99;
        const prioB = priorityMap[groupB] || 99;

        if (prioA !== prioB) {
          return prioA - prioB;
        }

        if (groupA === 'CLOSING_TODAY') {
          return (b.gmp || 0) - (a.gmp || 0);
        }

        if (groupA === 'OPEN') {
          const timeA = new Date(a.closeDate).getTime();
          const timeB = new Date(b.closeDate).getTime();
          if (timeA !== timeB) return timeA - timeB;
          return (b.gmp || 0) - (a.gmp || 0);
        }

        if (groupA === 'UPCOMING') {
          const timeA = new Date(a.openDate).getTime();
          const timeB = new Date(b.openDate).getTime();
          if (timeA !== timeB) return timeA - timeB;
          return (b.gmp || 0) - (a.gmp || 0);
        }

        return 0;
      });
    }

    return list.sort((a, b) => new Date(b.closeDate).getTime() - new Date(a.closeDate).getTime());
  }, [liveIPOs, activeStatusTab, todayStr, selectedCategory, searchQuery]);

  const openIPOCount = useMemo(() => {
    return liveIPOs.filter((i) => i.status === 'OPEN' || i.status === 'UPCOMING').length;
  }, [liveIPOs]);

  const closedIPOCount = useMemo(() => {
    return liveIPOs.filter((i) => i.status === 'CLOSED' || i.status === 'LISTED').length;
  }, [liveIPOs]);

  const selectedIPO = useMemo(() => {
    return liveIPOs.find((i) => i.id === selectedIPODetailId || i.symbol === selectedIPODetailId) || null;
  }, [liveIPOs, selectedIPODetailId]);

  const handleOpenApplyModal = (ipo: IPO, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const defaultBank = accounts.find((a) => a.type === 'bank') || accounts[0];
    if (!defaultBank) {
      alert('Please add a Bank Account first to record your IPO applications and blocked funds.');
      setQuickActionOpen(true, 'add_account');
      return;
    }
    const initialLotSize = ipo.lotSize || 1;
    const initialCost = ipo.priceHigh * initialLotSize;
    setApplyingIPO(ipo);
    setLotCount(1);
    setLotSize(initialLotSize);
    setUseCutoffPrice(true);
    setCustomPrice(ipo.priceHigh);
    setManualCost(initialCost);
    setSelectedBankId(defaultBank.id);
    setSelectedDematId(accounts.find((a) => a.type === 'demat')?.id || '');
    setApplyError('');
    setApplySuccessMessage('');
    setAppNotes(`Applied for ${ipo.companyName}`);
  };

  const handleLotCountChange = (newLots: number) => {
    const safeLots = Math.max(1, newLots);
    setLotCount(safeLots);
    if (applyingIPO) {
      const price = useCutoffPrice ? applyingIPO.priceHigh : (customPrice || applyingIPO.priceHigh);
      const safeLotSize = typeof lotSize === 'number' && lotSize > 0 ? lotSize : (applyingIPO.lotSize || 1);
      setManualCost(price * safeLotSize * safeLots);
    }
  };

  const handleLotSizeChange = (newSize: number | '') => {
    if (newSize === '') {
      setLotSize('');
      return;
    }
    const safeSize = Math.max(1, newSize);
    setLotSize(safeSize);
    if (applyingIPO) {
      const price = useCutoffPrice ? applyingIPO.priceHigh : (customPrice || applyingIPO.priceHigh);
      setManualCost(price * safeSize * lotCount);
    }
  };

  const handlePriceModeToggle = (cutoff: boolean) => {
    setUseCutoffPrice(cutoff);
    if (applyingIPO) {
      const price = cutoff ? applyingIPO.priceHigh : (customPrice || applyingIPO.priceHigh);
      const safeLotSize = typeof lotSize === 'number' && lotSize > 0 ? lotSize : (applyingIPO.lotSize || 1);
      setManualCost(price * safeLotSize * lotCount);
    }
  };

  const handleCustomPriceChange = (val: number) => {
    setCustomPrice(val);
    if (applyingIPO) {
      const safeLotSize = typeof lotSize === 'number' && lotSize > 0 ? lotSize : (applyingIPO.lotSize || 1);
      setManualCost(val * safeLotSize * lotCount);
    }
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingIPO) return;

    const safeLotSize = typeof lotSize === 'number' && lotSize > 0 ? lotSize : (applyingIPO.lotSize || 1);
    const finalPrice = useCutoffPrice ? applyingIPO.priceHigh : customPrice;
    const finalAmount =
      typeof manualCost === 'number' && manualCost > 0
        ? manualCost
        : finalPrice * safeLotSize * lotCount;

    const result = applyForIPO({
      ipoId: applyingIPO.id,
      companyName: applyingIPO.companyName,
      symbol: applyingIPO.symbol,
      accountId: selectedBankId,
      dematAccountId: selectedDematId || undefined,
      lotsApplied: lotCount,
      applicationPrice: finalPrice,
      lotSize: safeLotSize,
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

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      if (activeIpoSubTab === 'LIVE') {
        setActiveIpoSubTab('MY_APPLICATIONS');
      }
    },
    onSwipeRight: () => {
      if (activeIpoSubTab === 'MY_APPLICATIONS') {
        setActiveIpoSubTab('LIVE');
      }
    },
  });

  return (
    <div
      {...swipeHandlers}
      className="space-y-4 pb-12 animate-fade-in touch-pan-y flex-1 min-h-full flex flex-col justify-start"
    >
      {/* Top Header Mode Navigation with Green Box Style */}
      <SlidingSegmentedTabs
        tabs={[
          { id: 'LIVE', label: 'Live Market IPOs', icon: TrendingUp },
          { id: 'MY_APPLICATIONS', label: 'My Applications', count: applications.length, icon: Layers },
        ]}
        activeId={activeIpoSubTab}
        onChange={(id) => setActiveIpoSubTab(id)}
        size="md"
        variant="equal"
        pillVariant="solid"
      />

      {/* Dual Pane GPU-Accelerated Carousel Track */}
      <div className="relative overflow-hidden w-full">
        <div
          className={`flex w-[200%] items-start transition-transform duration-300 ease-out will-change-transform ${
            activeIpoSubTab === 'MY_APPLICATIONS' ? '-translate-x-1/2' : 'translate-x-0'
          }`}
        >
          {/* Pane 1: Live Market IPOs */}
          <div
            className={`w-1/2 shrink-0 pr-1.5 space-y-3 pb-16 transition-opacity duration-200 ${
              activeIpoSubTab !== 'LIVE' && !isTransitioning
                ? 'h-0 overflow-hidden invisible pointer-events-none'
                : 'h-auto opacity-100'
            }`}
          >
            {/* Quick Filter & Search Bar with iOS Frosted Glass */}
            <div className="space-y-2.5 ios-glass-card p-3 rounded-2xl">
              {/* Row 1: Filter Pills (Open/Closed & Category) */}
              <div className="flex items-center justify-between gap-3 px-1">
                {/* Status Switcher */}
                <div className="flex-1 max-w-[210px]">
                  <SlidingSegmentedTabs
                    tabs={[
                      { id: 'OPEN', label: `Open (${openIPOCount})` },
                      { id: 'CLOSED', label: `Closed (${closedIPOCount})` },
                    ]}
                    activeId={activeStatusTab}
                    onChange={(id) => setActiveStatusTab(id as 'OPEN' | 'CLOSED')}
                    size="sm"
                    variant="equal"
                    pillVariant="underline"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex-1 max-w-[170px]">
                  <SlidingSegmentedTabs
                    tabs={[
                      { id: 'ALL', label: 'ALL' },
                      { id: 'MAINBOARD', label: 'MAIN' },
                      { id: 'SME', label: 'SME' },
                    ]}
                    activeId={selectedCategory}
                    onChange={(id) => setSelectedCategory(id as any)}
                    size="sm"
                    variant="equal"
                    pillVariant="underline"
                  />
                </div>
              </div>

              {/* Row 2: Search Input & Compact Refresh (Underneath the filter buttons) */}
              <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Search IPOs by name or symbol..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-[11px] focus:outline-none focus:border-emerald-600 transition-all font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => fetchLiveIPOs(true)}
                  disabled={isIPORefreshing}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-all text-[11px] font-semibold shrink-0 flex items-center space-x-1 cursor-pointer"
                  title="Refresh Live Data"
                >
                  <RefreshCw className={`w-3 h-3 ${isIPORefreshing ? 'animate-spin text-emerald-600' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* IPO Cards Feed */}
            {filteredIPOs.length === 0 ? (
              <div
                key={`empty-${activeStatusTab}-${selectedCategory}`}
                className="p-8 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-xs animate-card-slide"
              >
                <Briefcase className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No {activeStatusTab === 'OPEN' ? 'open' : 'closed'} IPOs found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Try switching filters or searching another keyword.
                </p>
              </div>
            ) : (
              <div key={`${activeStatusTab}-${selectedCategory}`} className="space-y-3 animate-card-slide">
                {filteredIPOs.map((ipo, index) => {
                  const oneLotCost = ipo.minimumInvestment || (ipo.priceHigh * ipo.lotSize);
                  const cleanExchange = formatCleanExchange(ipo.exchange);
                  const timing = getRealtimeIPOTiming(ipo);
                  const isUpcoming = ipo.status === 'UPCOMING';
                  const isOpen = ipo.status === 'OPEN';

                  const currentGroup = getIpoTimelineGroup(ipo, todayStr);
                  const prevGroup = index > 0 ? getIpoTimelineGroup(filteredIPOs[index - 1], todayStr) : null;
                  const isNewGroup = activeStatusTab === 'OPEN' && (index === 0 || currentGroup !== prevGroup);

                  const groupHeader = isNewGroup ? {
                    CLOSING_TODAY: {
                      title: 'Closing Today',
                      count: filteredIPOs.filter((i) => getIpoTimelineGroup(i, todayStr) === 'CLOSING_TODAY').length,
                      icon: <Flame className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />,
                      color: 'text-amber-700 dark:text-amber-400',
                      badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
                    },
                    OPEN: {
                      title: 'Open for Bidding',
                      count: filteredIPOs.filter((i) => getIpoTimelineGroup(i, todayStr) === 'OPEN').length,
                      icon: <Activity className="w-4 h-4 text-emerald-500 shrink-0" />,
                      color: 'text-emerald-700 dark:text-emerald-400',
                      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
                    },
                    UPCOMING: {
                      title: 'Opening Tomorrow & Upcoming',
                      count: filteredIPOs.filter((i) => getIpoTimelineGroup(i, todayStr) === 'UPCOMING').length,
                      icon: <Clock className="w-4 h-4 text-blue-500 shrink-0" />,
                      color: 'text-blue-700 dark:text-blue-400',
                      badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
                    },
                    CLOSED: null,
                  }[currentGroup] : null;

                  return (
                    <React.Fragment key={ipo.id}>
                      {groupHeader && (
                        <div className={`flex items-center justify-between gap-2 px-1 ${index > 0 ? 'pt-4 pb-1' : 'pt-1 pb-1'}`}>
                          <div className="flex items-center space-x-2 min-w-0">
                            {groupHeader.icon}
                            <span className={`text-xs font-black uppercase tracking-wider ${groupHeader.color}`}>
                              {groupHeader.title}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${groupHeader.badgeBg}`}>
                              {groupHeader.count}
                            </span>
                          </div>
                          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                        </div>
                      )}

                      <div
                        onClick={() => setSelectedIPODetailId(ipo.id)}
                        style={{ animationDelay: `${Math.min(index * 30, 150)}ms` }}
                        className="animate-card-item p-3.5 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-slate-800 hover:border-[#387ed1] dark:hover:border-[#387ed1] active:scale-[0.99] transition-all cursor-pointer shadow-xs space-y-2.5"
                      >
                        {/* Row 1: Company Name + Category Tag */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-snug break-words">
                              {ipo.companyName}
                            </h3>
                            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                              <span>{ipo.symbol}</span>
                              <span>•</span>
                              <span className={`font-bold ${ipo.category === 'SME' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                {ipo.category === 'SME' ? 'SME' : 'Mainboard'}
                              </span>
                            </div>
                          </div>

                          {/* Quick Status Tag */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              isOpen
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : isUpcoming
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isOpen ? 'Open' : isUpcoming ? 'Upcoming' : 'Closed'}
                          </span>
                        </div>

                        {/* Row 2: Price + Lot + Apply Button */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-center space-x-4">
                            <div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block">
                                Price
                              </span>
                              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                                {ipo.priceLow === ipo.priceHigh ? `₹${ipo.priceHigh}` : `₹${ipo.priceLow} – ₹${ipo.priceHigh}`}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block">
                                Lot
                              </span>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {ipo.lotSize} Qty
                              </span>
                            </div>
                          </div>

                          {/* Direct Apply Button */}
                          <div>
                            {isOpen ? (
                              <button
                                onClick={(e) => handleOpenApplyModal(ipo, e)}
                                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
                              >
                                <span>Apply</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            ) : isUpcoming ? (
                              <button
                                onClick={(e) => handleOpenApplyModal(ipo, e)}
                                className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-bold active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
                              >
                                <span>Pre-Apply</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedIPODetailId(ipo.id)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                              >
                                <span>Details</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pane 2: My Applications */}
          <div
            className={`w-1/2 shrink-0 pl-1.5 pb-16 transition-opacity duration-200 ${
              activeIpoSubTab !== 'MY_APPLICATIONS' && !isTransitioning
                ? 'h-0 overflow-hidden invisible pointer-events-none'
                : 'h-auto opacity-100'
            }`}
          >
            <MyIPOsScreen onSwitchToLive={() => setActiveIpoSubTab('LIVE')} />
          </div>
        </div>
      </div>

      {/* IPODetailModal */}
      <IPODetailModal
        ipo={selectedIPO}
        isOpen={!!selectedIPO}
        onClose={() => setSelectedIPODetailId(null)}
        onApply={(ipo) => handleOpenApplyModal(ipo)}
      />

      {/* Apply IPO BottomSheet Modal */}
      <BottomSheet
        isOpen={!!applyingIPO}
        onClose={() => setApplyingIPO(null)}
        title={`Apply: ${applyingIPO?.symbol || 'IPO'}`}
        subtitle={applyingIPO?.companyName}
      >
        {applyingIPO && (
          <form onSubmit={handleApplySubmit} className="space-y-4">
            {/* Price Mode */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bid Price Mode</span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handlePriceModeToggle(true)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      useCutoffPrice
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Cut-off (₹{applyingIPO.priceHigh})
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriceModeToggle(false)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      !useCutoffPrice
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {!useCutoffPrice && (
                <div className="relative pt-1">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min={applyingIPO.priceLow}
                    max={applyingIPO.priceHigh}
                    value={customPrice}
                    onChange={(e) => handleCustomPriceChange(parseFloat(e.target.value) || applyingIPO.priceHigh)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold"
                  />
                </div>
              )}
            </div>

            {/* Shares per lot input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Shares per Lot (Qty)
              </label>
              <input
                type="number"
                min="1"
                value={lotSize}
                onChange={(e) => handleLotSizeChange(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold"
                required
              />
            </div>

            {/* Lots Stepper & Chips */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Number of Lots</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  ({(typeof lotSize === 'number' && lotSize > 0 ? lotSize : applyingIPO.lotSize) * lotCount} total shares)
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleLotCountChange(lotCount - 1)}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 text-slate-900 dark:text-slate-100 flex items-center justify-center font-bold active:scale-95 shadow-xs cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={lotCount}
                  onChange={(e) => handleLotCountChange(parseInt(e.target.value) || 1)}
                  className="flex-1 text-center py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-black text-base text-slate-900 dark:text-slate-100 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => handleLotCountChange(lotCount + 1)}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 text-slate-900 dark:text-slate-100 flex items-center justify-center font-bold active:scale-95 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-1.5 pt-1">
                {[1, 2, 3, 5, 10].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => handleLotCountChange(num)}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      lotCount === num
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {num}L
                  </button>
                ))}
              </div>
            </div>

            {/* Total Payable Amount */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Total Block Amount</span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                {formatINR(typeof manualCost === 'number' ? manualCost : 0)}
              </span>
            </div>

            {/* Account Selectors */}
            <CustomDropdown
              label="Bank Account (Block Funds)"
              value={selectedBankId}
              onChange={(val) => setSelectedBankId(val)}
              themeVariant="emerald"
              options={accounts
                .filter((a) => a.type === 'bank')
                .map((acc) => ({
                  value: acc.id,
                  label: acc.name,
                  subLabel: `Available: ${formatINR(acc.balance)}`,
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

            {accounts.some((a) => a.type === 'demat') && (
              <CustomDropdown
                label="Demat Account (For Allotment)"
                value={selectedDematId}
                onChange={(val) => setSelectedDematId(val)}
                themeVariant="emerald"
                options={accounts
                  .filter((a) => a.type === 'demat')
                  .map((acc) => ({
                    value: acc.id,
                    label: acc.name,
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
            )}

            {applyError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
                {applyError}
              </div>
            )}

            {applySuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{applySuccessMessage}</span>
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setApplyingIPO(null)}
                className="w-1/3 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
              >
                Confirm & Block Funds
              </button>
            </div>
          </form>
        )}
      </BottomSheet>
    </div>
  );
}