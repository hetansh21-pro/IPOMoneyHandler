'use client';

import React from 'react';
import { IPO } from '@/lib/types/finance';
import { formatINR, formatDateRange } from '@/lib/utils/formatters';
import { getRealtimeIPOTiming } from '@/lib/market/marketHours';
import { BottomSheet } from '../common/BottomSheet';
import {
  TrendingUp,
  Calendar,
  Layers,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Activity,
  ArrowRight,
  Info,
  Building2,
} from 'lucide-react';

interface IPODetailModalProps {
  ipo: IPO | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (ipo: IPO) => void;
}

export function IPODetailModal({ ipo, isOpen, onClose, onApply }: IPODetailModalProps) {
  if (!ipo) return null;

  const timing = getRealtimeIPOTiming(ipo);
  const minInvestment = ipo.minimumInvestment || ipo.priceHigh * ipo.lotSize;
  const isSME = ipo.category === 'SME';

  // Retail max calculations (standard 2 Lakh retail limit)
  const retailMaxLots = ipo.retailMaxLots || (isSME ? 1 : Math.max(1, Math.floor(200000 / minInvestment)));
  const retailMaxAmount = ipo.retailMaxAmount || retailMaxLots * minInvestment;

  // Small HNI (2L to 10L)
  const sHniMinLots = ipo.hniMinLots || (isSME ? 2 : retailMaxLots + 1);
  const sHniMinAmount = ipo.hniMinAmount || sHniMinLots * minInvestment;

  const gmpPercent = ipo.gmp ? ((ipo.gmp / ipo.priceHigh) * 100).toFixed(1) : null;
  const estListingPrice = ipo.gmp ? ipo.priceHigh + ipo.gmp : null;

  const actionFooter = (
    <button
      type="button"
      onClick={() => {
        onClose();
        onApply(ipo);
      }}
      className={`w-full py-3.5 rounded-xl font-black text-sm text-white shadow-lg active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer ${
        ipo.status === 'OPEN'
          ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
          : ipo.status === 'UPCOMING'
          ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25'
          : 'bg-slate-800 hover:bg-slate-700 shadow-slate-800/25'
      }`}
    >
      <span>
        {ipo.status === 'OPEN'
          ? `Apply with Virtual Ledger (${formatINR(minInvestment)})`
          : ipo.status === 'UPCOMING'
          ? 'Pre-Apply & Block Funds'
          : 'Record Past Application'}
      </span>
      <ArrowRight className="w-4 h-4" />
    </button>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={ipo.companyName}
      subtitle={`${ipo.symbol} • ${isSME ? 'SME Public Issue' : 'Mainboard Public Issue'}`}
      footer={actionFooter}
    >
      <div className="space-y-4">
        {/* Top Status & Timing Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-900 dark:to-slate-900/80 border border-slate-200/90 dark:border-slate-800/90 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                ipo.status === 'OPEN'
                  ? 'bg-emerald-500 animate-pulse'
                  : ipo.status === 'UPCOMING'
                  ? 'bg-blue-500'
                  : 'bg-slate-400'
              }`}
            />
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {timing.badgeText}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {ipo.exchange || 'NSE / BSE'} • {ipo.issueType || 'Book Built Issue'}
              </div>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
              isSME
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
            }`}
          >
            {isSME ? 'BSE/NSE SME' : 'MAINBOARD'}
          </span>
        </div>

        {/* Primary Pricing & Grey Market Card */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Price & Lot */}
          <div className="p-3.5 rounded-2xl ios-glass-card space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price Band & Lot</div>
            <div className="text-sm font-black text-slate-900 dark:text-slate-100">
              {ipo.priceLow === ipo.priceHigh ? `₹${ipo.priceHigh}` : `₹${ipo.priceLow} – ₹${ipo.priceHigh}`}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold">
              {ipo.lotSize} Shares / Lot (FV: {ipo.faceValue || '₹10'})
            </div>
          </div>

          {/* Min Investment */}
          <div className="p-3.5 rounded-2xl ios-glass-card space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Retail Min. Amount</div>
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {formatINR(minInvestment)}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold">1 Lot ({ipo.lotSize} Shares)</div>
          </div>
        </div>

        {/* Grey Market Premium (GMP) & Estimated Gain */}
        {ipo.gmp !== undefined && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Grey Market Premium (GMP)
              </div>
              <div className="text-base font-black text-emerald-700 dark:text-emerald-400">
                +₹{ipo.gmp} ({gmpPercent}%)
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Est. Listing Price
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                ₹{estListingPrice}
              </div>
            </div>
          </div>
        )}

        {/* Issue Size Breakdown */}
        <div className="p-3.5 rounded-2xl ios-glass-card space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Issue Details & Capital Size</span>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-slate-100">
              {ipo.issueSize || '₹--- Cr'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-400 block">Fresh Issue</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {ipo.freshIssue || ipo.issueSize || 'Entire Issue'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Offer for Sale (OFS)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {ipo.offerForSale || 'Nil / Pure Fresh'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Subscription Status */}
        {ipo.subscriptionData && (
          <div className="p-3.5 rounded-2xl ios-glass-card space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                <span>Live Subscription Demand</span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Total: {ipo.subscriptionData.total}x
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 font-bold block">QIB</span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {ipo.subscriptionData.qib !== undefined ? `${ipo.subscriptionData.qib}x` : 'N/A'}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 font-bold block">NII / HNI</span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {ipo.subscriptionData.nii !== undefined ? `${ipo.subscriptionData.nii}x` : 'N/A'}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 font-bold block">Retail (RII)</span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {ipo.subscriptionData.retail !== undefined ? `${ipo.subscriptionData.retail}x` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Official IPO Schedule Timetable */}
        <div className="p-3.5 rounded-2xl ios-glass-card space-y-2.5">
          <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>IPO Timetable & Key Dates (IST)</span>
          </div>

          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">IPO Open Date</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{ipo.openDate}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">IPO Close Date</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{ipo.closeDate}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Basis of Allotment</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {ipo.allotmentDate || 'T+1 Day'}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Refunds / Unblocking</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {ipo.refundDate || ipo.allotmentDate || 'T+2 Days'}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Credit to Demat</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {ipo.creditDate || ipo.listingDate || 'T+2 Days'}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Listing Date</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {ipo.listingDate || 'T+3 Days'}
              </span>
            </div>
          </div>
        </div>

        {/* Investment Category Quotas & Limits */}
        <div className="p-3.5 rounded-2xl ios-glass-card space-y-2 text-xs">
          <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Retail & HNI Bidding Limits</span>
          </div>
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Retail Minimum (1 Lot)</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {ipo.lotSize} shares • {formatINR(minInvestment)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Retail Maximum ({retailMaxLots} Lots)</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {retailMaxLots * ipo.lotSize} shares • {formatINR(retailMaxAmount)}
              </span>
            </div>
            {!isSME && (
              <div className="flex justify-between">
                <span className="text-slate-500">Small HNI (Min. {sHniMinLots} Lots)</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {sHniMinLots * ipo.lotSize} shares • {formatINR(sHniMinAmount)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
