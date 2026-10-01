'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { formatINR, formatDate } from '@/lib/utils/formatters';
import { BottomSheet } from '../common/BottomSheet';
import { CustomDropdown } from '../common/CustomDropdown';
import { SmsSyncModal } from '../common/SmsSyncModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useBackHandler } from '@/lib/hooks/useBackHandler';
import {
  Shield,
  Lock,
  Download,
  Upload,
  Camera,
  AlertTriangle,
  ChevronRight,
  Info,
  Trash2,
  Share2,
  Copy,
  FileUp,
  CheckCheck,
  Sun,
  Moon,
  Smartphone,
  MessageSquare,
  Sparkles,
  Eye,
  EyeOff,
  FileSpreadsheet,
  History,
} from 'lucide-react';

export function MoreScreen() {
  const {
    themeMode,
    setThemeMode,
    isPrivacyMode,
    togglePrivacyMode,
    snapshots,
    pin,
    autoLockDuration,
    setPin,
    lockApp,
    setAutoLockDuration,
    createSnapshot,
    deleteSnapshot,
    exportDataJSON,
    importDataJSON,
    exportTransactionsCSV,
    clearTransactionHistory,
    clearIPOApplicationHistory,
    clearAllHistory,
    deleteTransaction,
    deleteApplication,
    resetAllData,
    accounts,
    applications,
    transactions,
  } = useAppStore();

  const [activeSheet, setActiveSheet] = useState<
    'none' | 'pin_setup' | 'snapshots' | 'backup' | 'about' | 'history' | 'reset'
  >('none');
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [isRemovePinDialogOpen, setIsRemovePinDialogOpen] = useState(false);
  const [snapshotToDelete, setSnapshotToDelete] = useState<string | null>(null);

  // PIN setup state
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Snapshot creation state
  const [snapTitle, setSnapTitle] = useState('');

  // Backup & Import state
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [csvExportSuccess, setCsvExportSuccess] = useState(false);

  // Reset confirmation state
  const [resetConfirmText, setResetConfirmText] = useState('');

  // History deletion state
  const [historyMode, setHistoryMode] = useState<'bulk' | 'individual'>('bulk');
  const [historyToast, setHistoryToast] = useState<string | null>(null);
  const [historyConfirmModal, setHistoryConfirmModal] = useState<{
    isOpen: boolean;
    type: 'transactions' | 'applications' | 'all';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'transactions',
    title: '',
    message: '',
  });

  // Back Navigation Handlers for MoreScreen
  useBackHandler(historyConfirmModal.isOpen, () => {
    setHistoryConfirmModal((prev) => ({ ...prev, isOpen: false }));
    return true;
  });

  useBackHandler(isRemovePinDialogOpen, () => {
    setIsRemovePinDialogOpen(false);
    return true;
  });

  useBackHandler(!!snapshotToDelete, () => {
    setSnapshotToDelete(null);
    return true;
  });

  useBackHandler(isSmsModalOpen, () => {
    setIsSmsModalOpen(false);
    return true;
  });

  useBackHandler(activeSheet !== 'none', () => {
    setActiveSheet('none');
    return true;
  });

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length !== 4) {
      setPinError('PIN must be exactly 4 digits.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinError('PINs do not match.');
      return;
    }
    setPin(newPinInput);
    setActiveSheet('none');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinError('');
  };

  const handleRemovePin = () => {
    setIsRemovePinDialogOpen(true);
  };

  const handleConfirmRemovePin = () => {
    setPin(null);
    setActiveSheet('none');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinError('');
  };

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    createSnapshot(snapTitle.trim() || undefined);
    setSnapTitle('');
  };

  const handleConfirmDeleteSnapshot = () => {
    if (snapshotToDelete) {
      deleteSnapshot(snapshotToDelete);
      setSnapshotToDelete(null);
    }
  };

  const handleShareOrExportJSON = async () => {
    try {
      const json = exportDataJSON();
      const filename = `IPO_Money_Backup_${new Date().toISOString().split('T')[0]}.json`;

      // 1. Native Android Phone File Share (via Capacitor)
      if (typeof window !== 'undefined') {
        try {
          const { Capacitor } = await import('@capacitor/core');
          if (Capacitor.isNativePlatform()) {
            const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
            const { Share } = await import('@capacitor/share');
            const writtenFile = await Filesystem.writeFile({
              path: filename,
              data: json,
              directory: Directory.Cache,
              encoding: Encoding.UTF8,
            });

            await Share.share({
              title: 'IPO Money Backup',
              text: 'IPO Money Handler Backup Data',
              url: writtenFile.uri,
              dialogTitle: 'Save or Share Backup File',
            });
            return;
          }
        } catch (capErr) {
          console.log('Capacitor native share error or dismissed:', capErr);
        }
      }

      // 2. Web Share API Fallback
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          const file = new File([json], filename, { type: 'application/json' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'IPO Money Backup',
              text: 'IPO Money Handler Backup Data',
            });
            return;
          } else {
            await navigator.share({
              title: 'IPO Money Backup',
              text: json,
            });
            return;
          }
        } catch (shareErr: any) {
          if (shareErr?.name !== 'AbortError') {
            console.log('Web share fallback error:', shareErr);
          }
        }
      }

      // 3. Direct Anchor download with Blob support
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (e) {
      console.error('Export failed:', e);
      handleCopyJSON();
    }
  };

  const handleCopyJSON = async () => {
    const json = exportDataJSON();
    try {
      if (typeof window !== 'undefined') {
        try {
          const { Capacitor } = await import('@capacitor/core');
          if (Capacitor.isNativePlatform()) {
            const { Clipboard } = await import('@capacitor/clipboard');
            await Clipboard.write({ string: json });
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 3000);
            return;
          }
        } catch {}
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(json);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
        return;
      }
    } catch (err) {
      console.error('Clipboard error:', err);
    }
    setImportJsonText(json);
    setShowRawJson(true);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handleExportCSV = async () => {
    try {
      const csv = exportTransactionsCSV();
      const filename = `IPO_Transactions_${new Date().toISOString().split('T')[0]}.csv`;

      if (typeof window !== 'undefined') {
        try {
          const { Capacitor } = await import('@capacitor/core');
          if (Capacitor.isNativePlatform()) {
            const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
            const { Share } = await import('@capacitor/share');
            const writtenFile = await Filesystem.writeFile({
              path: filename,
              data: csv,
              directory: Directory.Cache,
              encoding: Encoding.UTF8,
            });

            await Share.share({
              title: 'Transactions CSV Export',
              text: 'IPO Money Handler Ledger CSV',
              url: writtenFile.uri,
              dialogTitle: 'Save or Share Transactions CSV',
            });
            setCsvExportSuccess(true);
            setTimeout(() => setCsvExportSuccess(false), 3000);
            return;
          }
        } catch (capErr) {
          console.log('Capacitor CSV share:', capErr);
        }
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);

      setCsvExportSuccess(true);
      setTimeout(() => setCsvExportSuccess(false), 3000);
    } catch (e) {
      console.error('CSV export failed:', e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJsonText(content);
        const res = importDataJSON(content);
        if (res.success) {
          setImportStatus('Backup restored successfully!');
          setTimeout(() => {
            setActiveSheet('none');
            setImportJsonText('');
            setImportStatus('');
          }, 1200);
        } else {
          setImportStatus(res.error || 'Failed to parse JSON file.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleImportJSON = () => {
    if (!importJsonText.trim()) return;
    const res = importDataJSON(importJsonText);
    if (res.success) {
      setImportStatus('Backup restored successfully!');
      setTimeout(() => {
        setActiveSheet('none');
        setImportJsonText('');
        setImportStatus('');
      }, 1200);
    } else {
      setImportStatus(res.error || 'Failed to import backup.');
    }
  };

  const handleConfirmReset = () => {
    if (resetConfirmText.toLowerCase() === 'delete') {
      resetAllData();
      setActiveSheet('none');
      setResetConfirmText('');
    }
  };

  const handleExecuteHistoryClear = () => {
    if (historyConfirmModal.type === 'transactions') {
      clearTransactionHistory(true);
      setHistoryToast('Transaction history cleared (account balances kept intact).');
    } else if (historyConfirmModal.type === 'applications') {
      clearIPOApplicationHistory();
      setHistoryToast('IPO application history cleared.');
    } else if (historyConfirmModal.type === 'all') {
      clearAllHistory();
      setHistoryToast('All transaction & application history cleared.');
    }
    setHistoryConfirmModal((prev) => ({ ...prev, isOpen: false }));
    setTimeout(() => {
      setHistoryToast(null);
    }, 3500);
  };

  return (
    <div className="space-y-4 pb-8 animate-fade-in">
      {/* 1. Clean Profile & Identity Card with iOS Glass */}
      <div className="p-4 rounded-[28px] ios-glass-card space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-base flex items-center justify-center shadow-sm shadow-emerald-500/20 shrink-0">
              HP
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Hetansh Patel
                </h2>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  HP4291
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                100% Offline • Private Device Ledger
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={togglePrivacyMode}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              isPrivacyMode
                ? 'bg-emerald-500/15 dark:bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'ios-glass-pill text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title={isPrivacyMode ? 'Privacy Mode ON (Masked)' : 'Privacy Mode OFF (Visible)'}
          >
            {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Stats Pill Row */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-2xl ios-glass-pill">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Accounts</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5 block">{accounts.length}</span>
          </div>
          <div className="p-2 rounded-2xl ios-glass-pill">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Applications</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5 block">{applications.length}</span>
          </div>
          <div className="p-2 rounded-2xl ios-glass-pill">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Snapshots</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5 block">{snapshots.length}</span>
          </div>
        </div>
      </div>

      {/* 2. Preferences Section */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3">
          Preferences
        </h3>
        <div className="rounded-[28px] ios-glass-card overflow-hidden divide-y divide-slate-100/80 dark:divide-white/5 shadow-xs">
          {/* Theme Mode Selector (System Auto / Light / Dark) */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {themeMode === 'system' ? (
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                  ) : themeMode === 'dark' ? (
                    <Moon className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">App Theme</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {themeMode === 'system'
                      ? 'Auto (Sync with Device/OS theme)'
                      : themeMode === 'dark'
                      ? 'Dark theme active'
                      : 'Light theme active'}
                  </p>
                </div>
              </div>
            </div>

            {/* 2-Way Underline Selector (Light / Dark) without outer box */}
            <div className="relative flex items-center justify-around pt-1 pb-1.5 select-none">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setThemeMode('light');
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setThemeMode('light');
                }}
                className={`relative flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-black transition-colors cursor-pointer touch-manipulation active:scale-95 ${
                  themeMode === 'light'
                    ? 'text-slate-950 dark:text-white'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Sun className={`w-4 h-4 ${themeMode === 'light' ? 'text-amber-500 stroke-[2.5]' : 'text-slate-400'}`} />
                <span>Light</span>
                {themeMode === 'light' && (
                  <span className="absolute bottom-0 inset-x-6 h-[3px] rounded-full bg-slate-900 dark:bg-white shadow-xs transition-all duration-300" />
                )}
              </button>

              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setThemeMode('dark');
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setThemeMode('dark');
                }}
                className={`relative flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-black transition-colors cursor-pointer touch-manipulation active:scale-95 ${
                  themeMode === 'dark' || (themeMode === 'system' && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
                    ? 'text-slate-950 dark:text-white'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Moon className={`w-4 h-4 ${themeMode === 'dark' ? 'text-indigo-400 stroke-[2.5]' : 'text-slate-400'}`} />
                <span>Dark</span>
                {(themeMode === 'dark' || (themeMode === 'system' && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) && (
                  <span className="absolute bottom-0 inset-x-6 h-[3px] rounded-full bg-slate-900 dark:bg-white shadow-xs transition-all duration-300" />
                )}
              </button>
            </div>
          </div>

          {/* Privacy Mode Row */}
          <div
            onClick={togglePrivacyMode}
            className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 active:bg-slate-100/50 dark:active:bg-slate-800/60 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center space-x-3.5">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                isPrivacyMode
                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}>
                {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">Privacy Masking</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {isPrivacyMode ? 'Balances masked with ••••' : 'All balances visible'}
                </p>
              </div>
            </div>

            <div
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                isPrivacyMode ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isPrivacyMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Security Section */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3">
          Security & Access
        </h3>
        <div className="rounded-[28px] ios-glass-card overflow-hidden divide-y divide-slate-100/80 dark:divide-white/5 shadow-xs">
          {/* PIN Lock Row */}
          <div
            onClick={() => setActiveSheet('pin_setup')}
            className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 active:bg-slate-100/50 dark:active:bg-slate-800/60 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">4-Digit Security PIN</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {pin ? 'Protected • Tap to change PIN' : 'Not configured (Tap to secure)'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  pin
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {pin ? 'Active' : 'Off'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
          </div>

          {/* Auto Lock Timer Dropdown */}
          {pin && (
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">Auto-Lock Delay</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Lock on inactive background</p>
                </div>
              </div>

              <div className="w-32">
                <CustomDropdown
                  options={[
                    { value: '0', label: 'Immediately' },
                    { value: '60', label: 'After 1 min' },
                    { value: '300', label: 'After 5 mins' },
                    { value: '900', label: 'After 15 mins' },
                  ]}
                  value={String(autoLockDuration)}
                  onChange={(val) => setAutoLockDuration(Number(val))}
                  placeholder="Auto-lock"
                  size="sm"
                />
              </div>
            </div>
          )}

          {/* Lock Now Row */}
          {pin && (
            <div
              onClick={lockApp}
              className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 active:bg-slate-100/50 dark:active:bg-slate-800/60 transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">Lock Application Now</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Secure screen instantly</p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
          )}
        </div>
      </div>

      {/* 4. Smart Automation & SMS Sync */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3">
          Automation & Live Sync
        </h3>
        <div className="rounded-[28px] ios-glass-card overflow-hidden divide-y divide-slate-100/80 dark:divide-white/5 shadow-xs">
          <div
            onClick={() => setIsSmsModalOpen(true)}
            className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 active:bg-slate-100/50 dark:active:bg-slate-800/60 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/60 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    SMS & Bank Sync Engine
                  </h4>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500 text-white shrink-0">
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                  Auto-capture UPI mandates & bank alerts
                </p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* 5. Data & Backup Management */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3">
          Data & Snapshots
        </h3>
        <div className="rounded-[28px] ios-glass-card overflow-hidden divide-y divide-slate-100/80 dark:divide-white/5 shadow-xs">
          {/* Snapshots Row */}
          <div
            onClick={() => setActiveSheet('snapshots')}
            className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 active:bg-slate-100/50 dark:active:bg-slate-800/60 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">Daily Balance Snapshots</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {snapshots.length} historical milestone snapshot(s)
                </p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>

          {/* Export & Restore JSON Backup */}
          <div
            onClick={() => setActiveSheet('backup')}
            className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 active:bg-slate-100/50 dark:active:bg-slate-800/60 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">Export & Restore Backup</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">100% Offline JSON file & clipboard</p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>

          {/* Export Transactions CSV */}
          <div
            onClick={handleExportCSV}
            className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 active:bg-slate-100/50 dark:active:bg-slate-800/60 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">Export Transactions (CSV)</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Download ledger for Excel / Sheets</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {csvExportSuccess && (
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">Saved!</span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 6. System & Danger Zone */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3">
          System & Privacy
        </h3>
        <div className="rounded-[28px] ios-glass-card overflow-hidden divide-y divide-slate-100/80 dark:divide-white/5 shadow-xs">
          {/* About App */}
          <div
            onClick={() => setActiveSheet('about')}
            className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 active:bg-slate-100/50 dark:active:bg-slate-800/60 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">About IPO Money Handler</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Version 1.8.0 • Zero Cloud Tracking</p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>

          {/* Delete History */}
          <div
            onClick={() => setActiveSheet('history')}
            className="p-4 flex items-center justify-between hover:bg-amber-50/50 dark:hover:bg-amber-950/20 active:bg-amber-100/40 dark:active:bg-amber-950/30 transition-colors cursor-pointer select-none group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60 flex items-center justify-center shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">Delete / Clear History</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Clear transactions, IPO records, or activity</p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-amber-600" />
          </div>

          {/* Reset All Data */}
          <div
            onClick={() => setActiveSheet('reset')}
            className="p-4 flex items-center justify-between hover:bg-rose-50/50 dark:hover:bg-rose-950/20 active:bg-rose-100/40 dark:active:bg-rose-950/30 transition-colors cursor-pointer select-none group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-rose-600 dark:text-rose-400">Reset All App Data</h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Permanently wipe accounts & ledger</p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-rose-600" />
          </div>
        </div>
      </div>

      {/* SMS Sync Modal */}
      <SmsSyncModal isOpen={isSmsModalOpen} onClose={() => setIsSmsModalOpen(false)} />

      {/* Remove PIN Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isRemovePinDialogOpen}
        onClose={() => setIsRemovePinDialogOpen(false)}
        onConfirm={handleConfirmRemovePin}
        title="Remove PIN Protection"
        description="Are you sure you want to remove the PIN lock? Anyone with access to your device will be able to view your financial portfolio."
        confirmText="Remove PIN"
        cancelText="Keep PIN"
        variant="danger"
      />

      {/* Delete Snapshot Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!snapshotToDelete}
        onClose={() => setSnapshotToDelete(null)}
        onConfirm={handleConfirmDeleteSnapshot}
        title="Delete Balance Snapshot"
        description="Are you sure you want to delete this historical balance snapshot? This action cannot be undone."
        confirmText="Delete Snapshot"
        cancelText="Cancel"
        variant="danger"
      />

      {/* PIN Setup BottomSheet */}
      <BottomSheet
        isOpen={activeSheet === 'pin_setup'}
        onClose={() => setActiveSheet('none')}
        title={pin ? 'Modify App PIN' : 'Set Up App PIN'}
        subtitle="4-digit numeric code"
      >
        <form onSubmit={handleSavePin} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              {pin ? 'New 4-Digit PIN' : 'Enter 4-Digit PIN'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              pattern="[0-9]{4}"
              placeholder="••••"
              value={newPinInput}
              onChange={(e) => {
                setNewPinInput(e.target.value.replace(/\D/g, ''));
                setPinError('');
              }}
              required
              className="w-full text-center tracking-[1em] text-xl font-black py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              Confirm 4-Digit PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              pattern="[0-9]{4}"
              placeholder="••••"
              value={confirmPinInput}
              onChange={(e) => {
                setConfirmPinInput(e.target.value.replace(/\D/g, ''));
                setPinError('');
              }}
              required
              className="w-full text-center tracking-[1em] text-xl font-black py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          {pinError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold text-center">
              {pinError}
            </p>
          )}

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer active:scale-98 transition-all"
            >
              Save PIN
            </button>
            {pin && (
              <button
                type="button"
                onClick={handleRemovePin}
                className="w-full py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"
              >
                Disable PIN Lock
              </button>
            )}
          </div>
        </form>
      </BottomSheet>

      {/* Snapshots BottomSheet */}
      <BottomSheet
        isOpen={activeSheet === 'snapshots'}
        onClose={() => setActiveSheet('none')}
        title="Balance Snapshots"
        subtitle="Record net worth milestones"
      >
        <div className="space-y-4 pt-1">
          <form onSubmit={handleCreateSnapshot} className="flex space-x-2">
            <input
              type="text"
              placeholder="Snapshot label (e.g., Post-IPO allotment)"
              value={snapTitle}
              onChange={(e) => setSnapTitle(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs placeholder:text-slate-400 font-medium"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 cursor-pointer shrink-0 active:scale-95 transition-all shadow-xs"
            >
              Take Now
            </button>
          </form>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
            {snapshots.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-medium">
                No snapshots captured yet. Take one today to track your wealth trajectory!
              </div>
            ) : (
              snapshots.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{s.title}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {formatDate(s.date)} • {Object.keys(s.breakdown || {}).length} Accounts
                    </p>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {formatINR(s.totalMoney)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSnapshotToDelete(s.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Backup & Export BottomSheet */}
      <BottomSheet
        isOpen={activeSheet === 'backup'}
        onClose={() => setActiveSheet('none')}
        title="Backup & Restore"
        subtitle="Manage local database export"
      >
        <div className="space-y-4 pt-1">
          {/* Export Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Export Database</h4>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                100% Offline
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Export your accounts, applications, stock holdings, and full ledger history.
            </p>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleShareOrExportJSON}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Save / Share File</span>
              </button>

              <button
                type="button"
                onClick={handleCopyJSON}
                className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95 ${
                  copySuccess
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200'
                }`}
              >
                {copySuccess ? <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copySuccess ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            </div>

            {/* Raw JSON inspection toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                {showRawJson ? '▲ Hide raw backup text' : '▼ View raw backup text'}
              </button>

              {showRawJson && (
                <div className="mt-2 space-y-2">
                  <textarea
                    readOnly
                    rows={5}
                    value={exportDataJSON()}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-200 select-all"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    You can copy the raw text above and store it securely in your notes.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Restore Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Restore Database</h4>
            
            {/* File Upload Button */}
            <div>
              <label className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-900 dark:text-slate-100 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs active:scale-95 transition-all">
                <FileUp className="w-4 h-4 text-emerald-600" />
                <span>Upload .JSON File</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink mx-2 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">or paste JSON</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            <textarea
              rows={3}
              placeholder="Paste JSON backup text here..."
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-mono placeholder:text-slate-400"
            />
            {importStatus && (
              <p className={`text-xs font-bold ${importStatus.includes('successfully') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {importStatus}
              </p>
            )}
            <button
              type="button"
              onClick={handleImportJSON}
              disabled={!importJsonText.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Restore Database</span>
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* About App BottomSheet */}
      <BottomSheet
        isOpen={activeSheet === 'about'}
        onClose={() => setActiveSheet('none')}
        title="About App"
        subtitle="IPO Money Handler"
      >
        <div className="space-y-3 pt-1">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Version 1.8.0 (Emerald Edition)</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Designed for high-net-worth multi-account Indian IPO investors, family portfolio managers, and SME bidding syndicates.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-1">
            <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Zero Cloud Tracking</h5>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
              All accounts, PAN numbers, bank balances, and IPO transactions reside strictly on your local device.
            </p>
          </div>
        </div>
      </BottomSheet>

      {/* Delete / Clear History BottomSheet */}
      <BottomSheet
        isOpen={activeSheet === 'history'}
        onClose={() => setActiveSheet('none')}
        title="Delete History"
        subtitle="Manage, clean, or delete records one by one"
      >
        <div className="space-y-4 pt-1">
          {historyToast && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-fade-in">
              <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{historyToast}</span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setHistoryMode('bulk')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                historyMode === 'bulk'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bulk Clear
            </button>
            <button
              type="button"
              onClick={() => setHistoryMode('individual')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                historyMode === 'individual'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Delete One by One
            </button>
          </div>

          {historyMode === 'bulk' ? (
            <>
              {/* Ledger Summary Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ledger</div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">{transactions.length}</div>
                  <div className="text-[10px] text-slate-500 font-medium">entries</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IPOs</div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">{applications.length}</div>
                  <div className="text-[10px] text-slate-500 font-medium">records</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Snapshots</div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">{snapshots.length}</div>
                  <div className="text-[10px] text-slate-500 font-medium">milestones</div>
                </div>
              </div>

              {/* Option 1: Clear Transactions */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Clear Transactions
                  </h4>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-full font-bold">
                    Balances Kept
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Deletes all past transaction entries from your ledger history while keeping your current bank and demat account balances intact.
                </p>
                <button
                  type="button"
                  disabled={transactions.length === 0}
                  onClick={() =>
                    setHistoryConfirmModal({
                      isOpen: true,
                      type: 'transactions',
                      title: 'Clear Transaction History?',
                      message: `Are you sure you want to delete all ${transactions.length} transaction entries? Your accounts will keep their current balances.`,
                    })
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear {transactions.length} Transactions</span>
                </button>
              </div>

              {/* Option 2: Clear IPO Applications */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Clear IPO Applications
                  </h4>
                  <span className="text-[10px] text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-800 px-2 py-0.5 rounded-full font-bold">
                    Applications
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Deletes all past and closed IPO bidding and application history records.
                </p>
                <button
                  type="button"
                  disabled={applications.length === 0}
                  onClick={() =>
                    setHistoryConfirmModal({
                      isOpen: true,
                      type: 'applications',
                      title: 'Clear IPO History?',
                      message: `Are you sure you want to delete all ${applications.length} IPO application records?`,
                    })
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear {applications.length} IPO Applications</span>
                </button>
              </div>

              {/* Option 3: Clear All Activity & History */}
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                    Clear All Activity & History
                  </h4>
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-2 py-0.5 rounded-full font-bold">
                    Accounts Preserved
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Wipes all transaction ledger history, IPO application history, and snapshots together in one click while safely preserving your accounts, PIN, and settings.
                </p>
                <button
                  type="button"
                  disabled={transactions.length === 0 && applications.length === 0 && snapshots.length === 0}
                  onClick={() =>
                    setHistoryConfirmModal({
                      isOpen: true,
                      type: 'all',
                      title: 'Clear All History?',
                      message: 'This will wipe all transactions, IPO applications, and snapshots. Your accounts and settings will remain safe.',
                    })
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All History Records</span>
                </button>
              </div>
            </>
          ) : (
            /* Individual One-by-One History Deletion List */
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Individual History Items
              </h4>

              {transactions.length === 0 && applications.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-medium">
                  No history records available.
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-0.5">
                  {/* Transactions List */}
                  {transactions.slice(0, 30).map((tx) => {
                    const acc = accounts.find((a) => a.id === tx.accountId);
                    return (
                      <div
                        key={tx.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {tx.description}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {formatDate(tx.date)} • {acc?.name || 'Account'} • {formatINR(tx.amount)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            deleteTransaction(tx.id);
                            setHistoryToast('Transaction entry deleted.');
                            setTimeout(() => setHistoryToast(null), 2500);
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors shrink-0 active:scale-90"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}

                  {/* IPO Applications List */}
                  {applications.slice(0, 20).map((app) => (
                    <div
                      key={app.id}
                      className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {app.companyName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                            IPO
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          {formatDate(app.appliedAt)} • {app.lotsApplied} lot(s) • {formatINR(app.applicationAmount)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          deleteApplication(app.id);
                          setHistoryToast('IPO record deleted.');
                          setTimeout(() => setHistoryToast(null), 2500);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors shrink-0 active:scale-90"
                        title="Delete IPO record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </BottomSheet>

      {/* History Clear ConfirmDialog */}
      <ConfirmDialog
        isOpen={historyConfirmModal.isOpen}
        onClose={() => setHistoryConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteHistoryClear}
        title={historyConfirmModal.title}
        message={historyConfirmModal.message}
        confirmText="Confirm & Delete"
        variant="danger"
        icon="trash"
      />

      {/* Reset Confirmation BottomSheet */}
      <BottomSheet
        isOpen={activeSheet === 'reset'}
        onClose={() => setActiveSheet('none')}
        title="Reset All Data"
        subtitle="Danger Zone"
      >
        <div className="space-y-4 pt-1">
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs space-y-2">
            <div className="flex items-center space-x-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Warning: This cannot be undone!</span>
            </div>
            <p className="leading-relaxed">
              This will permanently delete all your virtual accounts, allocations, IPO applications, and transaction records.
            </p>
          </div>

          <div>
            <label className="block text-xs text-slate-700 dark:text-slate-300 font-bold mb-1.5">
              Type <strong className="text-rose-600 dark:text-rose-400">DELETE</strong> to confirm:
            </label>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold focus:border-rose-600"
            />
          </div>

          <button
            type="button"
            onClick={handleConfirmReset}
            disabled={resetConfirmText.toLowerCase() !== 'delete'}
            className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-extrabold text-xs shadow-xs cursor-pointer active:scale-98 transition-all"
          >
            Permanently Erase All Data
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

