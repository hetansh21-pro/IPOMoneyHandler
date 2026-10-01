import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { BottomSheet } from './BottomSheet';
import { CustomDropdown } from './CustomDropdown';
import { BankLogo } from './SegmentedBar';
import {
  startLiveSmsTracking,
  requestSmsPermission,
  checkNotificationAccessPermission,
  openAndroidNotificationSettings,
  openAndroidAppDetailsSettings,
  isNativePlatform,
} from '@/lib/native/smsPlugin';
import { parseBankSms } from '@/lib/finance/smsParser';
import { ParsedSmsTransaction } from '@/lib/types/finance';
import { formatINR, formatDate } from '@/lib/utils/formatters';
import {
  Radio,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Check,
  AlertCircle,
  Building2,
  Trash2,
  Zap,
  BellRing,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Settings,
  Info,
} from 'lucide-react';

interface SmsItemState extends ParsedSmsTransaction {
  selected: boolean;
  selectedAccountId: string;
  isLiveArrival?: boolean;
}

interface SmsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SmsSyncModal({ isOpen, onClose }: SmsSyncModalProps) {
  const { accounts, syncSmsTransactions, autoProcessIncomingSms, isAutoSmsSyncEnabled, toggleAutoSmsSync } = useAppStore();

  const [isListening, setIsListening] = useState(false);
  const [hasNotificationAccess, setHasNotificationAccess] = useState(false);
  const [showRestrictedHelp, setShowRestrictedHelp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [items, setItems] = useState<SmsItemState[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const bankAccounts = accounts.filter((a) => a.type === 'bank' || a.type === 'wallet');
  const stopListenerRef = useRef<(() => void) | null>(null);

  // Start Live Real-time SMS & Notification Tracker when modal is open
  useEffect(() => {
    if (!isOpen) {
      if (stopListenerRef.current) {
        stopListenerRef.current();
        stopListenerRef.current = null;
      }
      setIsListening(false);
      return;
    }

    let isMounted = true;

    const initTracker = async () => {
      setErrorMessage(null);
      try {
        checkNotificationAccessPermission().then((granted) => {
          if (isMounted) setHasNotificationAccess(granted);
        });

        const perm = await requestSmsPermission();
        if (!perm.granted) {
          if (isMounted) {
            setErrorMessage(
              'SMS permission is required to detect live incoming bank messages. Please allow SMS permission in Android App Settings.'
            );
          }
          return;
        }

        const tracker = await startLiveSmsTracking((newLiveTx) => {
          if (!isMounted) return;

          // Haptic alert on live message arrival
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate([40, 60, 40]);
            } catch {}
          }

          // Determine account match
          let matchedAccountId = newLiveTx.suggestedAccountId || '';
          if (!matchedAccountId && bankAccounts.length > 0) {
            if (newLiveTx.accountNumber) {
              const matchedByNumber = bankAccounts.find(
                (acc) =>
                  acc.accountNumber &&
                  acc.accountNumber.replace(/\D/g, '').endsWith(newLiveTx.accountNumber!)
              );
              if (matchedByNumber) matchedAccountId = matchedByNumber.id;
            }
            if (!matchedAccountId) matchedAccountId = bankAccounts[0].id;
          }

          const newItem: SmsItemState = {
            ...newLiveTx,
            selected: true,
            selectedAccountId: matchedAccountId,
            isLiveArrival: true,
          };

          setItems((prev) => [newItem, ...prev.filter((p) => p.id !== newItem.id)]);
        }, accounts);

        if (isMounted) {
          if (tracker.active) {
            stopListenerRef.current = tracker.stop;
            setIsListening(true);
          } else if (tracker.error) {
            setErrorMessage(tracker.error);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err?.message || 'Failed to initialize live SMS listener.');
        }
      }
    };

    initTracker();

    return () => {
      isMounted = false;
      if (stopListenerRef.current) {
        stopListenerRef.current();
        stopListenerRef.current = null;
      }
    };
  }, [isOpen, accounts]);

  const toggleSelectAll = (checked: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: checked })));
  };

  const toggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleAccountChange = (index: number, accountId: string) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, selectedAccountId: accountId } : item))
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleImport = () => {
    const selectedItems = items
      .filter((i) => i.selected && i.selectedAccountId)
      .map((i) => ({
        ...i,
        suggestedAccountId: i.selectedAccountId,
      }));

    if (selectedItems.length === 0) return;

    const res = syncSmsTransactions(selectedItems);
    setImportSuccessCount(res.importedCount);
    setTimeout(() => {
      onClose();
      setImportSuccessCount(null);
      setItems([]);
    }, 1400);
  };

  // Simulation tool for testing live incoming messages on web or emulator
  const handleSimulateLiveSms = (type: 'debit' | 'credit' | 'ipo') => {
    const randomAmount = Math.floor(Math.random() * 5000) + 250;
    const targetAccount = bankAccounts[0] || accounts[0];
    const accNumber = targetAccount?.accountNumber ? targetAccount.accountNumber.slice(-4) : '4821';

    let simulatedText = '';
    if (type === 'debit') {
      simulatedText = `Dear Customer, your A/C ending XX${accNumber} has been debited by Rs.${randomAmount}.00 on ${new Date().toLocaleDateString(
        'en-IN'
      )} towards UPI/Swiggy. Avail Bal: Rs.45,210.00`;
    } else if (type === 'credit') {
      simulatedText = `Dear Customer, your A/C XX${accNumber} is credited by Rs.${randomAmount}.00 on ${new Date().toLocaleDateString(
        'en-IN'
      )} via UPI/Salary. Avail Bal: Rs.52,400.00`;
    } else {
      simulatedText = `UPI Mandate created for Rs.14,700.00 towards NTPC Green Energy IPO on A/C XX${accNumber}. Funds blocked until allotment.`;
    }

    const res = autoProcessIncomingSms({
      address: 'VM-HDFCBK',
      body: simulatedText,
      date: Date.now(),
      source: 'sms',
    });

    if (res.duplicate) {
      setErrorMessage('Duplicate alert detected! This transaction was already synced and double-entry was prevented.');
    } else if (res.processed) {
      const parsed = parseBankSms(simulatedText, 'VM-HDFCBK', new Date().toISOString(), accounts);
      if (parsed) {
        const newItem: SmsItemState = {
          ...parsed,
          selected: true,
          selectedAccountId: targetAccount?.id || '',
          isLiveArrival: true,
        };
        setItems((prev) => [newItem, ...prev]);
      }
    }
  };

  const selectedCount = items.filter((i) => i.selected && i.selectedAccountId).length;
  const isAllSelected = items.length > 0 && items.every((i) => i.selected);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Live Bank & Mandate SMS Sync"
      subtitle="Real-time Incoming Alert Monitor • 100% On-Device"
    >
      <div className="space-y-4 max-h-[75vh] flex flex-col">
        {/* Privacy & Live Status Header */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-emerald-900 dark:text-emerald-300 truncate">
                {isListening ? 'Live SMS Monitor Active' : 'Initializing Live Listener...'}
              </h4>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate">
                Fetches incoming live bank alerts only • Old history ignored
              </p>
            </div>
          </div>
          <div className="px-2 py-0.5 rounded-md bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-black uppercase tracking-wider shrink-0">
            Real-Time
          </div>
        </div>

        {/* Notification Listener Banner / Status for Android */}
        {isNativePlatform() && hasNotificationAccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold text-emerald-950 dark:text-emerald-200 text-[11px] truncate">
                Notification Reader Active (GPay, PhonePe, Paytm & Banks)
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
              Active
            </span>
          </div>
        )}

        {isNativePlatform() && !hasNotificationAccess && (
          <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 overflow-hidden text-xs">
            <div className="p-3.5 flex items-start justify-between gap-3">
              <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                <BellRing className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-indigo-950 dark:text-indigo-200">
                    Instant UPI & App Notification Capture
                  </h4>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed mt-0.5">
                    Allow Notification Access to automatically capture GPay, PhonePe, Paytm, and banking app alerts instantly.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await openAndroidNotificationSettings();
                  setTimeout(async () => {
                    const granted = await checkNotificationAccessPermission();
                    setHasNotificationAccess(granted);
                  }, 1500);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] shrink-0 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                Enable
              </button>
            </div>

            {/* Android 13+ "Restricted Setting" Fix Guide */}
            <div className="border-t border-indigo-200/70 dark:border-indigo-800/50 bg-indigo-100/40 dark:bg-indigo-900/30 px-3.5 py-2.5">
              <button
                type="button"
                onClick={() => setShowRestrictedHelp(!showRestrictedHelp)}
                className="w-full flex items-center justify-between text-left text-[11px] font-bold text-indigo-900 dark:text-indigo-200 hover:text-indigo-700 dark:hover:text-indigo-100 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  Seeing "Restricted setting" error on Android 13+?
                </span>
                {showRestrictedHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showRestrictedHelp && (
                <div className="mt-3 space-y-2.5 text-[11px] text-indigo-950 dark:text-indigo-200 animate-fadeIn">
                  <p className="text-slate-600 dark:text-slate-300 text-[10px] leading-relaxed">
                    Android 13, 14 & 15 block sensitive permissions for sideloaded APKs by default. You can allow it in 2 quick steps:
                  </p>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2.5 shadow-xs">
                    <div className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-black shrink-0 mt-0.5">
                        1
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          Allow Restricted Settings in App Info
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                          Open App Info &rarr; Tap the <strong>3 dots (⋮)</strong> at top-right &rarr; Tap <strong>"Allow restricted settings"</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={() => openAndroidAppDetailsSettings()}
                          className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer active:scale-95"
                        >
                          <Settings className="w-3 h-3" />
                          1. Open App Info
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-black shrink-0 mt-0.5">
                        2
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          Enable Notification Access
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                          Turn toggle <strong>ON</strong> for <strong>IPO Money Handler</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={async () => {
                            await openAndroidNotificationSettings();
                            setTimeout(async () => {
                              const granted = await checkNotificationAccessPermission();
                              setHasNotificationAccess(granted);
                            }, 1500);
                          }}
                          className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] hover:bg-indigo-500 transition-colors cursor-pointer active:scale-95"
                        >
                          <BellRing className="w-3 h-3" />
                          2. Open Notification Access
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start space-x-2.5 text-xs text-rose-800 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Notice</p>
              <p className="text-[11px] leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Confirmation Toast */}
        {importSuccessCount !== null && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-center space-y-1 text-xs text-emerald-800 dark:text-emerald-300 animate-fade-in">
            <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600 dark:text-emerald-400" />
            <p className="font-extrabold text-sm">
              Successfully Imported {importSuccessCount} Transaction{importSuccessCount === 1 ? '' : 's'}!
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
              Ledger and balances have been updated in real-time.
            </p>
          </div>
        )}

        {/* Live Waiting Radar State */}
        {items.length === 0 && (
          <div className="py-8 px-4 rounded-3xl ios-glass-card text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/30"></span>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1 max-w-xs mx-auto">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Waiting for Live Bank SMS...
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                When your bank sends an SMS for a debit, credit, or IPO mandate, it will instantly appear right here.
              </p>
            </div>

            {/* Test Simulation Actions */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider mb-2">
                Simulate Live Alert (Demo / Test)
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handleSimulateLiveSms('debit')}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-200 dark:border-rose-900 active:scale-95 transition-all"
                >
                  + Debit Alert
                </button>
                <button
                  onClick={() => handleSimulateLiveSms('credit')}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-900 active:scale-95 transition-all"
                >
                  + Credit Alert
                </button>
                <button
                  onClick={() => handleSimulateLiveSms('ipo')}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-200 dark:border-amber-900 active:scale-95 transition-all"
                >
                  + IPO Mandate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Incoming Messages List */}
        {items.length > 0 && (
          <div className="space-y-3 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="select_all_sms"
                  checked={isAllSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="select_all_sms"
                  className="text-xs font-bold text-slate-900 dark:text-slate-200 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Select All ({items.length})</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500 text-white">
                    LIVE
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSimulateLiveSms('debit')}
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center space-x-1 cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800"
                >
                  <Zap className="w-3 h-3" />
                  <span>+ Test SMS</span>
                </button>
                <button
                  onClick={() => setItems([])}
                  className="text-[10px] text-slate-400 hover:text-rose-500 font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {bankAccounts.length === 0 && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                Please add a Bank Account in the Accounts tab to assign live captured transactions.
              </div>
            )}

            <div className="space-y-2.5 max-h-[44vh] overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const isDebit = item.type === 'DEBIT';
                const isCredit = item.type === 'CREDIT';

                return (
                  <div
                    key={item.id || `live-sms-${idx}`}
                    className={`p-3.5 rounded-2xl border transition-all animate-card-slide ${
                      item.selected
                        ? 'bg-white dark:bg-slate-800/90 border-emerald-400/80 dark:border-emerald-600/70 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between space-x-2">
                      <div className="flex items-start space-x-2.5">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleItem(idx)}
                          className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer shrink-0"
                        />

                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                                isDebit
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                  : isCredit
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {item.type.replace(/_/g, ' ')}
                            </span>

                            {item.bankName && (
                              <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold">
                                {item.bankName}
                              </span>
                            )}

                            {item.accountNumber && (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-bold">
                                A/C ••{item.accountNumber}
                              </span>
                            )}

                            {item.isLiveArrival && (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider animate-pulse">
                                Live
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                            {item.ipoName ? `IPO: ${item.ipoName}` : item.merchantOrSender || item.sender || 'Bank Transaction'}
                          </p>

                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            {item.date ? formatDate(item.date) : 'Just Now'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-black ${
                            isDebit
                              ? 'text-rose-600 dark:text-rose-400'
                              : isCredit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {isDebit ? '-' : isCredit ? '+' : ''}
                          {formatINR(item.amount)}
                        </span>
                        <button
                          onClick={() => removeItem(idx)}
                          className="block ml-auto mt-1 p-1 text-slate-300 hover:text-rose-500"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Account Assignment Selector */}
                    {item.selected && bankAccounts.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0 mr-2">Assign to:</span>
                        <div className="flex-1 max-w-[210px]">
                          <CustomDropdown
                            value={item.selectedAccountId}
                            onChange={(val) => handleAccountChange(idx, val)}
                            themeVariant="emerald"
                            size="sm"
                            align="right"
                            options={bankAccounts.map((acc) => ({
                              value: acc.id,
                              label: acc.name,
                              subLabel: `Balance: ${formatINR(acc.balance)}`,
                              icon: (
                                <BankLogo
                                  name={acc.name}
                                  type={acc.type}
                                  color={acc.color}
                                  size="sm"
                                  className="w-3.5 h-3.5 rounded-md !p-0.5"
                                />
                              ),
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Import Button */}
            <div className="pt-2">
              <button
                onClick={handleImport}
                disabled={selectedCount === 0}
                className={`w-full py-3.5 rounded-2xl font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all cursor-pointer ${
                  selectedCount > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-[0.98]'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Import {selectedCount} Live Transaction{selectedCount === 1 ? '' : 's'} to Ledger</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

