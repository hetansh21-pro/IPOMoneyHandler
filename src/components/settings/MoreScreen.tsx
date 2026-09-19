'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { calculateMoneySummary } from '@/lib/finance/ledger';
import { formatINR, formatDate } from '@/lib/utils/formatters';
import { BottomSheet } from '../common/BottomSheet';
import {
  Shield,
  Lock,
  Download,
  Upload,
  RotateCcw,
  Camera,
  LineChart,
  AlertTriangle,
  ChevronRight,
  Info,
  Plus,
  Trash2,
  Edit2,
  Check,
  Share2,
  Copy,
  FileUp,
  CheckCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { Investment } from '@/lib/types/finance';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';

export function MoreScreen() {
  const {
    themeMode,
    setThemeMode,
    accounts,
    applications,
    allocations,
    investments,
    snapshots,
    pin,
    autoLockDuration,
    setPin,
    lockApp,
    setAutoLockDuration,
    createSnapshot,
    deleteInvestment,
    updateInvestment,
    addInvestment,
    exportDataJSON,
    importDataJSON,
    resetAllData,
  } = useAppStore();

  const summary = calculateMoneySummary(accounts, applications, allocations, investments);

  const [activeSheet, setActiveSheet] = useState<
    'none' | 'pin_setup' | 'investments' | 'snapshots' | 'backup' | 'about' | 'reset'
  >('none');

  // Stock Edit state
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [editSymbol, setEditSymbol] = useState('');
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editAvgPrice, setEditAvgPrice] = useState('');
  const [editCurPrice, setEditCurPrice] = useState('');

  // Stock Add state
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newAvgPrice, setNewAvgPrice] = useState('');
  const [newCurPrice, setNewCurPrice] = useState('');

  // PIN setup state
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [snapTitle, setSnapTitle] = useState('');
  const [snapNotes, setSnapNotes] = useState('');

  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const [resetConfirmText, setResetConfirmText] = useState('');

  const handleOpenEditInvestment = (inv: Investment) => {
    setEditingInvestment(inv);
    setEditSymbol(inv.symbol);
    setEditName(inv.name);
    setEditQty(inv.quantity.toString());
    setEditAvgPrice(inv.avgPrice.toString());
    setEditCurPrice((inv.currentPrice || inv.avgPrice).toString());
  };

  const handleSaveEditInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvestment) return;
    const qty = parseInt(editQty) || 0;
    if (qty <= 0) {
      deleteInvestment(editingInvestment.id);
    } else {
      updateInvestment(editingInvestment.id, {
        symbol: editSymbol.toUpperCase().trim(),
        name: editName.trim(),
        quantity: qty,
        avgPrice: parseFloat(editAvgPrice) || 0,
        currentPrice: parseFloat(editCurPrice) || parseFloat(editAvgPrice) || 0,
      });
    }
    setEditingInvestment(null);
  };

  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim() || !newName.trim()) return;
    const qty = parseInt(newQty) || 1;
    const avg = parseFloat(newAvgPrice) || 0;
    const cur = parseFloat(newCurPrice) || avg;

    addInvestment({
      symbol: newSymbol.toUpperCase().trim(),
      name: newName.trim(),
      quantity: qty,
      avgPrice: avg,
      currentPrice: cur,
    });

    setIsAddingStock(false);
    setNewSymbol('');
    setNewName('');
    setNewQty('1');
    setNewAvgPrice('');
    setNewCurPrice('');
  };

  const handleClearAllInvestments = () => {
    if (confirm('Are you sure you want to clear all stock holdings to make Invested value ₹0?')) {
      for (const inv of investments) {
        deleteInvestment(inv.id);
      }
    }
  };

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
    if (confirm('Are you sure you want to remove the App Lock PIN?')) {
      setPin(null);
      setActiveSheet('none');
    }
  };

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    createSnapshot(snapTitle.trim() || undefined, snapNotes.trim() || undefined);
    setSnapTitle('');
    setSnapNotes('');
  };

  const handleShareOrExportJSON = async () => {
    try {
      const json = exportDataJSON();
      const filename = `IPO_Money_Backup_${new Date().toISOString().split('T')[0]}.json`;

      // 1. Native Android Phone File Share (via Capacitor)
      if (Capacitor.isNativePlatform()) {
        try {
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
      if (Capacitor.isNativePlatform()) {
        await Clipboard.write({ string: json });
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
        return;
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

  return (
    <div className="space-y-5 pb-28 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-[#0f172a] dark:text-slate-100">More & Settings</h1>
        <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">Holdings portfolio, PIN lock & backups</p>
      </div>

      {/* Quick Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Manual Investments */}
        <button
          onClick={() => setActiveSheet('investments')}
          className="p-4 rounded-3xl bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-slate-800 hover:border-[#cbd5e1] dark:hover:border-slate-700 text-left space-y-2 shadow-[0_2px_8px_rgba(0,0,0,0.03)] group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#eef2ff] dark:bg-indigo-950/50 text-[#4f46e5] dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <LineChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0f172a] dark:text-slate-100">Holdings Portfolio</h3>
            <p className="text-xs text-[#059669] dark:text-emerald-400 font-extrabold mt-0.5">{formatINR(summary.investedMoney)}</p>
            <span className="text-[10px] text-[#64748b] dark:text-slate-400">{investments.length} Stocks • Tap to Edit</span>
          </div>
        </button>

        {/* Snapshots & Reports */}
        <button
          onClick={() => setActiveSheet('snapshots')}
          className="p-4 rounded-3xl bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-slate-800 hover:border-[#cbd5e1] dark:hover:border-slate-700 text-left space-y-2 shadow-[0_2px_8px_rgba(0,0,0,0.03)] group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#fffbeb] dark:bg-amber-950/50 text-[#d97706] dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0f172a] dark:text-slate-100">Money Snapshots</h3>
            <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">{snapshots.length} Snapshots Saved</p>
            <span className="text-[10px] text-[#059669] dark:text-emerald-400 font-bold">Point-in-Time</span>
          </div>
        </button>
      </div>

      {/* Theme & Appearance Section */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-[#94a3b8] dark:text-slate-400 uppercase tracking-wider">
          Appearance & Theme
        </h2>
        <div className="p-4 rounded-3xl bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-slate-800 space-y-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              {themeMode === 'dark' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f172a] dark:text-slate-100">Display Theme</h3>
              <p className="text-xs text-[#64748b] dark:text-slate-400">
                {themeMode === 'dark' ? 'Dark mode active' : 'Light mode active'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setThemeMode('light')}
              className={`py-3 px-3 rounded-2xl flex items-center justify-center space-x-2 text-xs font-bold border transition-all cursor-pointer ${
                themeMode === 'light'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light Theme</span>
            </button>

            <button
              onClick={() => setThemeMode('dark')}
              className={`py-3 px-3 rounded-2xl flex items-center justify-center space-x-2 text-xs font-bold border transition-all cursor-pointer ${
                themeMode === 'dark'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Dark Theme</span>
            </button>
          </div>
        </div>
      </div>

      {/* App Security & Lock Section */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-[#94a3b8] dark:text-slate-400 uppercase tracking-wider">
          Security & Privacy
        </h2>
        <div className="p-4 rounded-3xl bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-slate-800 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#ecfdf5] dark:bg-emerald-950/50 text-[#059669] dark:text-emerald-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0f172a] dark:text-slate-100">App PIN Lock</h3>
                <p className="text-xs text-[#64748b] dark:text-slate-400">
                  {pin ? 'Protected with 4-digit PIN' : 'Not configured (Unlocked)'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveSheet('pin_setup')}
              className="px-3.5 py-1.5 rounded-xl bg-[#f8fafc] dark:bg-slate-800 hover:bg-[#f1f5f9] dark:hover:bg-slate-700 border border-[#e2e8f0] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 text-xs font-bold"
            >
              {pin ? 'Change' : 'Set PIN'}
            </button>
          </div>

          {pin && (
            <div className="pt-2 border-t border-[#f1f5f9] dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[#64748b] dark:text-slate-400 font-medium">Auto-lock timer:</span>
              <select
                value={autoLockDuration}
                onChange={(e) => setAutoLockDuration(parseInt(e.target.value))}
                className="bg-[#f8fafc] dark:bg-slate-800 px-3 py-1 rounded-xl border border-[#e2e8f0] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 text-xs font-semibold"
              >
                <option value="0">Immediately</option>
                <option value="1">After 1 minute</option>
                <option value="5">After 5 minutes</option>
                <option value="15">After 15 minutes</option>
                <option value="-1">Never</option>
              </select>
            </div>
          )}

          {pin && (
            <button
              onClick={lockApp}
              className="w-full py-2.5 rounded-2xl bg-[#f8fafc] dark:bg-slate-800 hover:bg-[#f1f5f9] dark:hover:bg-slate-700 border border-[#e2e8f0] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock App Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Data Management Section */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-[#94a3b8] dark:text-slate-400 uppercase tracking-wider">
          Data & Storage
        </h2>
        <div className="space-y-2">
          <button
            onClick={() => setActiveSheet('backup')}
            className="w-full p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-slate-800 hover:border-[#cbd5e1] dark:hover:border-slate-700 flex items-center justify-between text-left shadow-xs cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Download className="w-5 h-5 text-[#059669] dark:text-emerald-400" />
              <div>
                <h3 className="text-xs font-bold text-[#0f172a] dark:text-slate-100">Backup & Restore</h3>
                <p className="text-[11px] text-[#64748b] dark:text-slate-400">Export JSON file or restore backup</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
          </button>

          <button
            onClick={() => setActiveSheet('reset')}
            className="w-full p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-slate-800 hover:border-[#fca5a5] dark:hover:border-rose-900/60 flex items-center justify-between text-left group shadow-xs cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <RotateCcw className="w-5 h-5 text-[#e11d48]" />
              <div>
                <h3 className="text-xs font-bold text-[#0f172a] dark:text-slate-100 group-hover:text-[#be123c] dark:group-hover:text-rose-400">
                  Reset / Clear Ledger
                </h3>
                <p className="text-[11px] text-[#64748b] dark:text-slate-400">Erase all manual transactions and accounts</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
          </button>
        </div>
      </div>

      {/* Stock Holdings / Invested Tracker BottomSheet (Full Editability) */}
      <BottomSheet
        isOpen={activeSheet === 'investments' && !editingInvestment && !isAddingStock}
        onClose={() => setActiveSheet('none')}
        title="Stock Holdings (Invested Value)"
        subtitle={`Total Portfolio: ${formatINR(summary.investedMoney)}`}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#64748b] dark:text-slate-400 font-bold">{investments.length} Stocks</span>
            <div className="flex space-x-2">
              {investments.length > 0 && (
                <button
                  onClick={handleClearAllInvestments}
                  className="px-3 py-1.5 rounded-2xl bg-[#fff1f2] dark:bg-rose-950/40 text-[#e11d48] dark:text-rose-400 hover:bg-[#ffe4e6] dark:hover:bg-rose-900/40 border border-[#fecdd3] dark:border-rose-900 font-bold text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All (Make ₹0)</span>
                </button>
              )}
              <button
                onClick={() => setIsAddingStock(true)}
                className="px-3.5 py-1.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs flex items-center space-x-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stock</span>
              </button>
            </div>
          </div>

          {investments.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#f8fafc] dark:bg-slate-800/60 border border-[#e2e8f0] dark:border-slate-700 text-center space-y-2">
              <LineChart className="w-10 h-10 text-[#94a3b8] dark:text-slate-500 mx-auto" />
              <h4 className="text-xs font-bold text-[#0f172a] dark:text-slate-100">No stock holdings tracked</h4>
              <p className="text-[11px] text-[#64748b] dark:text-slate-400">Your Invested value is currently ₹0.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {investments.map((inv) => {
                const currentVal = inv.quantity * (inv.currentPrice || inv.avgPrice);
                const investedVal = inv.quantity * inv.avgPrice;
                const pnl = currentVal - investedVal;
                const pnlPct = investedVal > 0 ? (pnl / investedVal) * 100 : 0;

                return (
                  <div
                    key={inv.id}
                    onClick={() => handleOpenEditInvestment(inv)}
                    className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/70 border border-[#e2e8f0] dark:border-slate-700 hover:border-[#cbd5e1] dark:hover:border-slate-600 flex items-center justify-between cursor-pointer group shadow-xs transition-all"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-[#0f172a] dark:text-slate-100">{inv.symbol}</h4>
                        <span className="text-[10px] text-[#64748b] dark:text-slate-400 truncate max-w-[130px]">
                          {inv.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748b] dark:text-slate-400 mt-0.5">
                        {inv.quantity} shares • Avg: ₹{inv.avgPrice} • LTP: ₹{inv.currentPrice}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-xs font-black text-[#0f172a] dark:text-slate-100">{formatINR(currentVal)}</div>
                        <span
                          className={`text-[10px] font-bold ${
                            pnl >= 0 ? 'text-[#059669] dark:text-emerald-400' : 'text-[#e11d48] dark:text-rose-400'
                          }`}
                        >
                          {pnl >= 0 ? '+' : ''}
                          {formatINR(pnl)} ({pnlPct.toFixed(1)}%)
                        </span>
                      </div>

                      <div className="p-1.5 rounded-xl bg-white dark:bg-slate-700 border border-[#e2e8f0] dark:border-slate-600 text-[#059669] dark:text-emerald-400 group-hover:bg-[#ecfdf5] dark:group-hover:bg-emerald-950/40 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Edit Stock Holding Modal */}
      <BottomSheet
        isOpen={!!editingInvestment}
        onClose={() => setEditingInvestment(null)}
        title={`Edit ${editingInvestment?.symbol}`}
        subtitle="Update price, quantity or delete"
      >
        {editingInvestment && (
          <form onSubmit={handleSaveEditInvestment} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">Stock Symbol</label>
                <input
                  type="text"
                  value={editSymbol}
                  onChange={(e) => setEditSymbol(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 font-bold text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">Quantity (Shares)</label>
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

            <div>
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">Company Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 text-xs font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">Avg Buy Price (₹)</label>
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
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">Current Price (₹)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={editCurPrice}
                  onChange={(e) => setEditCurPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 font-bold text-xs"
                  required
                />
              </div>
            </div>

            {/* Calculated Holding Value Preview */}
            <div className="p-3 rounded-2xl bg-[#ecfdf5] dark:bg-emerald-950/40 border border-[#a7f3d0] dark:border-emerald-800/60 flex justify-between items-center text-xs">
              <span className="text-[#047857] dark:text-emerald-400 font-bold">New Holding Value:</span>
              <span className="text-[#047857] dark:text-emerald-400 font-black text-sm">
                {formatINR((parseInt(editQty) || 0) * (parseFloat(editCurPrice) || parseFloat(editAvgPrice) || 0))}
              </span>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  deleteInvestment(editingInvestment.id);
                  setEditingInvestment(null);
                }}
                className="py-3 px-4 rounded-2xl bg-[#fff1f2] dark:bg-rose-950/40 border border-[#fecdd3] dark:border-rose-900 text-[#e11d48] dark:text-rose-400 font-bold text-xs flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs shadow-md shadow-[#059669]/20 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Add Stock Modal */}
      <BottomSheet
        isOpen={isAddingStock}
        onClose={() => setIsAddingStock(false)}
        title="Add Stock Holding"
        subtitle="Track stock portfolio manually"
      >
        <form onSubmit={handleAddStockSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">Stock Symbol</label>
              <input
                type="text"
                placeholder="e.g. RELIANCE"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 font-bold text-xs uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">Quantity</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="e.g. 10"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 font-bold text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">Company Name</label>
            <input
              type="text"
              placeholder="e.g. Reliance Industries Limited"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 text-xs font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">Avg Buy Price (₹)</label>
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
              <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">Current Price (₹)</label>
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

      {/* PIN Setup BottomSheet */}
      <BottomSheet
        isOpen={activeSheet === 'pin_setup'}
        onClose={() => setActiveSheet('none')}
        title={pin ? 'Manage App PIN' : 'Set Up App Lock PIN'}
        subtitle="4-digit security code"
      >
        <form onSubmit={handleSavePin} className="space-y-4">
          <div>
            <label className="block text-xs text-[#334155] dark:text-slate-300 font-bold mb-1">Enter 4-Digit PIN</label>
            <input
              type="password"
              maxLength={4}
              inputMode="numeric"
              placeholder="••••"
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-center text-2xl font-black tracking-widest text-[#0f172a] dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-[#334155] dark:text-slate-300 font-bold mb-1">Confirm 4-Digit PIN</label>
            <input
              type="password"
              maxLength={4}
              inputMode="numeric"
              placeholder="••••"
              value={confirmPinInput}
              onChange={(e) => setConfirmPinInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-center text-2xl font-black tracking-widest text-[#0f172a] dark:text-slate-100"
              required
            />
          </div>

          {pinError && <p className="text-xs text-[#e11d48] dark:text-rose-400 text-center font-bold">{pinError}</p>}

          <div className="flex space-x-3 pt-2">
            {pin && (
              <button
                type="button"
                onClick={handleRemovePin}
                className="py-3 px-4 rounded-2xl bg-[#fff1f2] dark:bg-rose-950/40 text-[#e11d48] dark:text-rose-400 text-xs font-bold cursor-pointer"
              >
                Disable PIN
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Save PIN
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Snapshots BottomSheet */}
      <BottomSheet
        isOpen={activeSheet === 'snapshots'}
        onClose={() => setActiveSheet('none')}
        title="Money Balance Snapshots"
        subtitle="Point-in-time financial records"
      >
        <div className="space-y-4">
          <form onSubmit={handleCreateSnapshot} className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/70 border border-[#e2e8f0] dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-[#0f172a] dark:text-slate-100">Capture Today's Snapshot</h4>
            <input
              type="text"
              placeholder="Snapshot Title (e.g. End of Month September)"
              value={snapTitle}
              onChange={(e) => setSnapTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 text-xs placeholder:text-[#94a3b8] dark:placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl bg-[#d97706] hover:bg-[#b45309] text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Take Balance Snapshot
            </button>
          </form>

          <div className="space-y-2">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/70 border border-[#e2e8f0] dark:border-slate-700 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#0f172a] dark:text-slate-100">{snap.title}</h4>
                    <span className="text-[10px] text-[#64748b] dark:text-slate-400">{formatDate(snap.date)}</span>
                  </div>
                  <div className="text-sm font-black text-[#0f172a] dark:text-slate-100">{formatINR(snap.totalMoney)}</div>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-1 border-t border-[#e2e8f0] dark:border-slate-700 text-[10px] text-center font-bold">
                  <div className="text-[#059669] dark:text-emerald-400">Avail: {formatINR(snap.availableMoney)}</div>
                  <div className="text-[#d97706] dark:text-amber-400">Blocked: {formatINR(snap.blockedMoney)}</div>
                  <div className="text-[#4f46e5] dark:text-indigo-400">Invested: {formatINR(snap.investedMoney)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* Backup & Restore BottomSheet */}
      <BottomSheet
        isOpen={activeSheet === 'backup'}
        onClose={() => {
          setActiveSheet('none');
          setShowRawJson(false);
          setImportStatus('');
        }}
        title="Backup & Restore Data"
        subtitle="100% private & portable JSON backups"
      >
        <div className="space-y-4">
          {/* Export Card */}
          <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/70 border border-[#e2e8f0] dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#0f172a] dark:text-slate-100 uppercase tracking-wider">Export Backup</h4>
              <span className="text-[10px] text-[#059669] dark:text-emerald-400 bg-[#ecfdf5] dark:bg-emerald-950/40 border border-[#a7f3d0] dark:border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                100% Offline
              </span>
            </div>
            <p className="text-xs text-[#64748b] dark:text-slate-400 leading-relaxed">
              Export your accounts, applications, stock holdings, and full ledger history.
            </p>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleShareOrExportJSON}
                className="w-full py-2.5 px-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-[#059669]/20 active:scale-95 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Save / Share File</span>
              </button>

              <button
                type="button"
                onClick={handleCopyJSON}
                className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95 ${
                  copySuccess
                    ? 'bg-[#ecfdf5] dark:bg-emerald-950/50 border-[#10b981] text-[#059669] dark:text-emerald-400'
                    : 'bg-white dark:bg-slate-800 border-[#cbd5e1] dark:border-slate-700 hover:bg-[#f1f5f9] dark:hover:bg-slate-700 text-[#334155] dark:text-slate-200'
                }`}
              >
                {copySuccess ? <CheckCheck className="w-4 h-4 text-[#059669] dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy Backup JSON'}</span>
              </button>
            </div>

            {/* Raw JSON inspection toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-[11px] text-[#0284c7] dark:text-sky-400 font-bold hover:underline cursor-pointer"
              >
                {showRawJson ? '▲ Hide raw backup text' : '▼ View raw backup text'}
              </button>

              {showRawJson && (
                <div className="mt-2 space-y-2">
                  <textarea
                    readOnly
                    rows={5}
                    value={exportDataJSON()}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 text-[10px] font-mono text-[#334155] dark:text-slate-200 select-all"
                  />
                  <p className="text-[10px] text-[#94a3b8] dark:text-slate-500">
                    You can copy the raw text above and save it in WhatsApp or Notes.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Restore Card */}
          <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/70 border border-[#e2e8f0] dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-[#0f172a] dark:text-slate-100 uppercase tracking-wider">Restore from Backup</h4>
            
            {/* File Upload Button */}
            <div>
              <label className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 hover:bg-[#f1f5f9] dark:hover:bg-slate-700 text-[#0f172a] dark:text-slate-100 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs active:scale-95 transition-all">
                <FileUp className="w-4 h-4 text-[#0284c7] dark:text-sky-400" />
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
              <div className="flex-grow border-t border-[#e2e8f0] dark:border-slate-700"></div>
              <span className="flex-shrink mx-2 text-[10px] text-[#94a3b8] dark:text-slate-400 font-bold uppercase">or paste JSON text</span>
              <div className="flex-grow border-t border-[#e2e8f0] dark:border-slate-700"></div>
            </div>

            <textarea
              rows={3}
              placeholder="Paste JSON backup text here..."
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 text-xs font-mono placeholder:text-[#94a3b8] dark:placeholder:text-slate-500"
            />
            {importStatus && (
              <p className={`text-xs font-bold ${importStatus.includes('successfully') ? 'text-[#059669] dark:text-emerald-400' : 'text-[#e11d48] dark:text-rose-400'}`}>
                {importStatus}
              </p>
            )}
            <button
              type="button"
              onClick={handleImportJSON}
              disabled={!importJsonText.trim()}
              className="w-full py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Restore Backup</span>
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Reset Confirmation BottomSheet */}
      <BottomSheet
        isOpen={activeSheet === 'reset'}
        onClose={() => setActiveSheet('none')}
        title="Reset All Data"
        subtitle="Danger Zone"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#fff1f2] dark:bg-rose-950/40 border border-[#fecdd3] dark:border-rose-900/60 text-[#be123c] dark:text-rose-300 text-xs space-y-2">
            <div className="flex items-center space-x-2 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Warning: This cannot be undone!</span>
            </div>
            <p>
              This will permanently delete all your virtual accounts, allocations, IPO applications, and transaction records.
            </p>
          </div>

          <div>
            <label className="block text-xs text-[#334155] dark:text-slate-300 font-bold mb-1">
              Type <strong className="text-[#e11d48] dark:text-rose-400">DELETE</strong> to confirm:
            </label>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 text-[#0f172a] dark:text-slate-100 text-xs focus:border-[#e11d48]"
            />
          </div>

          <button
            onClick={handleConfirmReset}
            disabled={resetConfirmText.toLowerCase() !== 'delete'}
            className="w-full py-3 rounded-2xl bg-[#e11d48] hover:bg-[#be123c] disabled:opacity-40 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Permanently Erase All Data
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
