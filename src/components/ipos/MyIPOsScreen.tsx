'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { IPOApplication, ApplicationStatus } from '@/lib/types/finance';
import { formatINR, formatDate, getShortAccountName } from '@/lib/utils/formatters';
import { calculateAllotmentSettlement } from '@/lib/finance/ledger';
import { BottomSheet } from '../common/BottomSheet';
import { BankLogo } from '../common/SegmentedBar';
import { SlidingSegmentedTabs } from '../common/SlidingSegmentedTabs';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useBackHandler } from '@/lib/hooks/useBackHandler';
import {
  Layers,
  Edit3,
  Trash2,
  TrendingUp,
  CheckCircle2,
  ArrowRightLeft,
  Clock,
  Zap,
  XCircle,
  Ban,
  ShieldCheck,
  Briefcase,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MyIPOsScreenProps {
  onSwitchToLive?: () => void;
}

export function MyIPOsScreen({ onSwitchToLive }: MyIPOsScreenProps) {
  const {
    applications,
    accounts,
    liveIPOs,
    selectedAppDetailId,
    setSelectedAppDetailId,
    updateApplicationStatus,
    updateApplicationDematAccount,
    deleteApplication,
    activeMemberId,
    familyMembers,
  } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'PENDING' | 'ALLOTTED' | 'NOT_ALLOTTED' | 'ALL'>('ACTIVE');

  // Status update modal
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus>('ALLOTMENT_PENDING');
  const [partialLotsInput, setPartialLotsInput] = useState<number>(1);
  const [updateNote, setUpdateNote] = useState('');

  // Demat switcher modal
  const [changingDematAppId, setChangingDematAppId] = useState<string | null>(null);
  const [dematSuccessMsg, setDematSuccessMsg] = useState('');
  const [appToDelete, setAppToDelete] = useState<string | null>(null);

  // Back Navigation Handlers
  useBackHandler(!!appToDelete, () => {
    setAppToDelete(null);
    return true;
  });

  useBackHandler(!!changingDematAppId, () => {
    setChangingDematAppId(null);
    return true;
  });

  useBackHandler(isUpdatingStatus, () => {
    setIsUpdatingStatus(false);
    return true;
  });

  useBackHandler(!!selectedAppDetailId, () => {
    setSelectedAppDetailId(null);
    return true;
  });

  const memberApplications = React.useMemo(() => {
    if (!activeMemberId || activeMemberId === 'all') return applications;
    if (activeMemberId === 'self') return applications.filter((app) => !app.memberId || app.memberId === 'self');
    return applications.filter((app) => app.memberId === activeMemberId);
  }, [applications, activeMemberId]);

  const selectedApp = applications.find((a) => a.id === selectedAppDetailId);
  const selectedAppBank = accounts.find((a) => a.id === selectedApp?.accountId);
  const selectedAppDemat = accounts.find((a) => a.id === selectedApp?.dematAccountId);
  const matchedIPO = liveIPOs.find((i) => i.id === selectedApp?.ipoId);
  const lotSize = matchedIPO?.lotSize || 1;

  const filteredApps = memberApplications.filter((app) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') {
      return !['NOT_ALLOTTED', 'CANCELLED', 'COMPLETED', 'FULLY_ALLOTTED'].includes(app.status);
    }
    if (statusFilter === 'PENDING') return app.status === 'ALLOTMENT_PENDING' || app.status === 'FUNDS_BLOCKED';
    if (statusFilter === 'ALLOTTED') return app.status === 'FULLY_ALLOTTED' || app.status === 'PARTIALLY_ALLOTTED';
    if (statusFilter === 'NOT_ALLOTTED') return app.status === 'NOT_ALLOTTED' || app.status === 'CANCELLED';
    return true;
  });

  const handleOpenUpdateModal = (app: IPOApplication) => {
    setSelectedAppDetailId(app.id);
    setTargetStatus(app.status);
    setPartialLotsInput(1);
    setUpdateNote('');
    setIsUpdatingStatus(true);
  };

  const handleConfirmStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    if (targetStatus === 'FULLY_ALLOTTED') {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    updateApplicationStatus(
      selectedApp.id,
      targetStatus,
      targetStatus === 'PARTIALLY_ALLOTTED' ? partialLotsInput : undefined,
      updateNote.trim() || undefined
    );

    setIsUpdatingStatus(false);
  };

  const handleDelete = (appId: string) => {
    setAppToDelete(appId);
  };

  const handleConfirmDelete = () => {
    if (appToDelete) {
      deleteApplication(appToDelete);
      setSelectedAppDetailId(null);
      setAppToDelete(null);
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'FULLY_ALLOTTED':
        return (
          <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Allotted</span>
          </div>
        );
      case 'PARTIALLY_ALLOTTED':
        return (
          <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-[10px] font-extrabold">
            <Zap className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            <span>Partial</span>
          </div>
        );
      case 'NOT_ALLOTTED':
        return (
          <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold">
            <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>Not Allotted</span>
          </div>
        );
      case 'CANCELLED':
        return (
          <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
            <Ban className="w-3 h-3 text-slate-400" />
            <span>Cancelled</span>
          </div>
        );
      case 'FUNDS_BLOCKED':
        return (
          <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold">
            <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>Blocked</span>
          </div>
        );
      case 'ALLOTMENT_PENDING':
      default:
        return (
          <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Pending</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-3.5 animate-fade-in">
      {/* Status Filter Tabs */}
      <SlidingSegmentedTabs
        tabs={[
          { id: 'ACTIVE', label: 'Active' },
          { id: 'PENDING', label: 'Pending' },
          { id: 'ALLOTTED', label: 'Allotted' },
          { id: 'NOT_ALLOTTED', label: 'Not Allotted' },
          { id: 'ALL', label: 'All' },
        ]}
        activeId={statusFilter}
        onChange={(tabId) => setStatusFilter(tabId as any)}
        size="sm"
        variant="scrollable"
      />

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div
          key={`empty-${statusFilter}`}
          className="p-8 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-xs animate-card-slide"
        >
          <Briefcase className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No applications in this category</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Browse live Indian IPOs and apply to track lot allocations and fund blocks.
          </p>
          {onSwitchToLive && (
            <button
              onClick={onSwitchToLive}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Browse Live IPOs</span>
            </button>
          )}
        </div>
      ) : (
        <div key={statusFilter} className="space-y-3 animate-card-slide">
          {filteredApps.map((app, index) => {
            const bank = accounts.find((a) => a.id === app.accountId);
            const demat = accounts.find((a) => a.id === app.dematAccountId);

            return (
              <div
                key={app.id}
                onClick={() => setSelectedAppDetailId(app.id)}
                style={{ animationDelay: `${Math.min(index * 35, 180)}ms` }}
                className="animate-card-item p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-600/50 active:scale-[0.99] transition-all cursor-pointer shadow-xs hover:shadow-sm space-y-3"
              >
                {/* Top Row: Company Name + Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 tracking-tight leading-snug break-words">
                      {app.companyName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400/80 dark:text-slate-500/80 font-medium tracking-tight">
                      <span>{app.lotsApplied} {app.lotsApplied === 1 ? 'Lot' : 'Lots'} Applied</span>
                      {app.lotsAllotted > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">• {app.lotsAllotted} Allotted</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {getStatusBadge(app.status)}
                  </div>
                </div>

                {/* Direct Specs: Amount & Linked Accounts in One Clean Row */}
                <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block">
                      Applied Value
                    </span>
                    <div className="font-black text-slate-900 dark:text-slate-100 text-xs mt-0.5">
                      {formatINR(app.applicationAmount)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
                    {bank && (
                      <div className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                        <BankLogo name={bank.name} type="bank" size="sm" className="w-3 h-3 rounded !p-0" />
                        <span>{getShortAccountName(bank.name)}</span>
                      </div>
                    )}
                    {demat && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setChangingDematAppId(app.id);
                        }}
                        className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 text-[10px] font-bold text-purple-800 dark:text-purple-300 shrink-0 transition-colors cursor-pointer"
                        title="Click to switch Demat"
                      >
                        <BankLogo name={demat.name} type="demat" size="sm" className="w-3 h-3 rounded !p-0" />
                        <span>{getShortAccountName(demat.name)}</span>
                        <Edit3 className="w-2.5 h-2.5 opacity-70" />
                      </div>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Application Details BottomSheet */}
      <BottomSheet
        isOpen={!!selectedAppDetailId && !isUpdatingStatus && !changingDematAppId}
        onClose={() => setSelectedAppDetailId(null)}
        title={selectedApp?.companyName}
        subtitle={`IPO APPLICATION TRACKING • ${selectedApp?.status.replace(/_/g, ' ')}`}
      >
        {selectedApp && (
          <div className="space-y-4">
            {/* Status Hero */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                    Current Status
                  </span>
                  <div className="mt-1">
                    {getStatusBadge(selectedApp.status)}
                  </div>
                </div>
                <button
                  onClick={() => handleOpenUpdateModal(selectedApp)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update Status</span>
                </button>
              </div>

              {/* Financial Settlement Breakdown */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Applied</span>
                  <div className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                    {formatINR(selectedApp.applicationAmount)}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold">Blocked</span>
                  <div className="text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5">
                    {formatINR(selectedApp.blockedAmount)}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold">Allotted</span>
                  <div className="text-xs font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {formatINR(selectedApp.allottedAmount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Application Parameters */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Application Parameters
              </h4>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Lots Applied:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedApp.lotsApplied} Lots</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Application Price:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">₹{selectedApp.applicationPrice}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Bank Account:</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    {selectedAppBank && <BankLogo name={selectedAppBank.name} type="bank" size="sm" className="w-4 h-4 rounded-md !p-0.5 shrink-0" />}
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{selectedAppBank?.name || 'Manual Bank'}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Demat Account:</span>
                    <button
                      onClick={() => setChangingDematAppId(selectedApp.id)}
                      className="text-purple-600 dark:text-purple-400 font-bold hover:underline text-[10px] flex items-center space-x-0.5 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-2.5 h-2.5" />
                      <span>Change</span>
                    </button>
                  </div>
                  <div
                    onClick={() => setChangingDematAppId(selectedApp.id)}
                    className="flex items-center space-x-1.5 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {selectedAppDemat && <BankLogo name={selectedAppDemat.name} type="demat" size="sm" className="w-4 h-4 rounded-md !p-0.5 shrink-0" />}
                    <p className="font-bold text-purple-700 dark:text-purple-400 truncate">{selectedAppDemat?.name || 'Manual Demat'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Timeline */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Application Timeline
              </h4>
              <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                {selectedApp.timeline.map((event, idx) => (
                  <div key={idx} className="relative">
                    <div
                      className={`absolute -left-[21px] top-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                        event.status === 'completed'
                          ? 'bg-emerald-600'
                          : event.status === 'current'
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{event.title}</div>
                    {event.timestamp && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(event.timestamp)}</span>
                    )}
                    {event.note && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{event.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => handleDelete(selectedApp.id)}
                className="py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
              <button
                onClick={() => handleOpenUpdateModal(selectedApp)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Update Status
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Allotment Status Update Modal */}
      <BottomSheet
        isOpen={isUpdatingStatus}
        onClose={() => setIsUpdatingStatus(false)}
        title="Update Application Status"
        subtitle={selectedApp?.companyName}
      >
        {selectedApp && (
          <form onSubmit={handleConfirmStatusUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Select New Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'FULLY_ALLOTTED', label: 'Fully Allotted', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
                  { id: 'PARTIALLY_ALLOTTED', label: 'Partially Allotted', icon: Zap, color: 'text-sky-600 dark:text-sky-400' },
                  { id: 'ALLOTMENT_PENDING', label: 'Allotment Pending', icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
                  { id: 'FUNDS_BLOCKED', label: 'Funds Blocked', icon: ShieldCheck, color: 'text-indigo-600 dark:text-indigo-400' },
                  { id: 'NOT_ALLOTTED', label: 'Not Allotted', icon: XCircle, color: 'text-rose-600 dark:text-rose-400' },
                  { id: 'CANCELLED', label: 'Cancelled', icon: Ban, color: 'text-slate-500 dark:text-slate-400' },
                ].map((st) => {
                  const Icon = st.icon;
                  const isSelected = targetStatus === st.id;
                  return (
                    <button
                      type="button"
                      key={st.id}
                      onClick={() => setTargetStatus(st.id as ApplicationStatus)}
                      className={`p-3 rounded-xl text-xs font-bold border transition-all flex items-center space-x-2 text-left cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : st.color}`} />
                      <span className="truncate">{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Partial Allotment: Lots input */}
            {targetStatus === 'PARTIALLY_ALLOTTED' && (
              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-3">
                <label className="block text-xs font-bold text-sky-900 dark:text-sky-300">
                  Lots Allotted (out of {selectedApp.lotsApplied})
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max={Math.max(1, selectedApp.lotsApplied - 1)}
                    value={partialLotsInput}
                    onChange={(e) => setPartialLotsInput(parseInt(e.target.value) || 1)}
                    className="w-24 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-base font-bold text-center"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Lots</span>
                </div>

                {(() => {
                  const settlement = calculateAllotmentSettlement(
                    selectedApp.applicationAmount,
                    selectedApp.applicationPrice,
                    lotSize,
                    partialLotsInput
                  );
                  return (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-sky-200/80 dark:border-sky-800 text-xs">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/60">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">Used / Debited</span>
                        <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 mt-0.5">{formatINR(settlement.allottedAmount)}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/60">
                        <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold uppercase">Released Back</span>
                        <div className="text-xs font-black text-sky-800 dark:text-sky-300 mt-0.5">{formatINR(settlement.releasedAmount)}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Note / Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Allotment checked on registrar"
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsUpdatingStatus(false)}
                className="w-1/3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Confirm Status
              </button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Demat Account Switcher BottomSheet */}
      <BottomSheet
        isOpen={!!changingDematAppId}
        onClose={() => {
          setChangingDematAppId(null);
          setDematSuccessMsg('');
        }}
        title="Change Beneficiary Demat Account"
        subtitle="Select the Demat account to link with this IPO application"
      >
        {changingDematAppId && (
          <div className="space-y-4">
            {dematSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center space-x-2 font-bold">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{dematSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              {accounts
                .filter((a) => a.type === 'demat' || a.type === 'investment')
                .map((dematAcc) => {
                  const currentApp = applications.find((a) => a.id === changingDematAppId);
                  const isSelected = currentApp?.dematAccountId === dematAcc.id;

                  return (
                    <div
                      key={dematAcc.id}
                      onClick={() => {
                        updateApplicationDematAccount(changingDematAppId, dematAcc.id);
                        setDematSuccessMsg(`Demat account changed to ${dematAcc.name}!`);
                        setTimeout(() => {
                          setChangingDematAppId(null);
                          setDematSuccessMsg('');
                        }, 800);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-50/80 dark:bg-purple-950/50 border-purple-500 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <BankLogo name={dematAcc.name} type="demat" size="md" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{dematAcc.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Invested: {formatINR(dematAcc.investedAmount ?? 0)} • Funds: {formatINR(dematAcc.balance)}
                          </p>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="px-2.5 py-1 rounded-xl bg-purple-600 text-white text-[11px] font-bold shadow-xs">
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => {
                setChangingDematAppId(null);
                setDematSuccessMsg('');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Delete IPO Application Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!appToDelete}
        onClose={() => setAppToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete IPO Application?"
        message="Are you sure you want to delete this IPO application? Blocked bank funds and allocations will be unblocked."
        confirmText="Delete Application"
        cancelText="Cancel"
        variant="danger"
        icon="trash"
      />
    </div>
  );
}
