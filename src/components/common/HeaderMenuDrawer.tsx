'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { BottomSheet } from './BottomSheet';
import {
  Users,
  Settings,
  Lock,
  Sun,
  Moon,
  Smartphone,
  Eye,
  EyeOff,
  UserPlus,
  RefreshCw,
  Shield,
  Check,
  ChevronRight,
} from 'lucide-react';

interface HeaderMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const RELATION_ICONS: Record<string, string> = {
  Self: '👤',
  Father: '👨',
  Mother: '👩',
  Brother: '👦',
  Sister: '👧',
  Spouse: '💍',
  Son: '🧒',
  Daughter: '👧',
  Other: '👤',
};

export function HeaderMenuDrawer({ isOpen, onClose }: HeaderMenuDrawerProps) {
  const {
    themeMode,
    setThemeMode,
    isPrivacyMode,
    togglePrivacyMode,
    pin,
    lockApp,
    familyMembers,
    activeMemberId,
    setActiveMemberId,
    setIsFamilyModalOpen,
    setActiveTab,
    accounts,
    checkAndFetchNewSmsOnOpen,
  } = useAppStore();

  const [isSyncingSms, setIsSyncingSms] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSelectMember = (id: string | 'all') => {
    setActiveMemberId(id);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(20);
      } catch {}
    }
  };

  const handleOpenSettings = () => {
    setActiveTab('more');
    onClose();
  };

  const handleManageFamily = () => {
    onClose();
    setTimeout(() => {
      setIsFamilyModalOpen(true);
    }, 200);
  };

  const handleLockNow = () => {
    onClose();
    setTimeout(() => {
      lockApp();
    }, 150);
  };

  const handleTriggerSmsSync = async () => {
    setIsSyncingSms(true);
    setSyncFeedback(null);
    try {
      await checkAndFetchNewSmsOnOpen();
      setSyncFeedback('SMS scan complete');
      setTimeout(() => setSyncFeedback(null), 2500);
    } catch {
      setSyncFeedback('Scan finished');
      setTimeout(() => setSyncFeedback(null), 2500);
    } finally {
      setIsSyncingSms(false);
    }
  };

  const currentMember = activeMemberId === 'all'
    ? { name: 'All Family Accounts', relation: 'All' }
    : familyMembers.find((m) => m.id === activeMemberId) || { name: 'Me (Primary)', relation: 'Self' };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Menu & Controls"
      subtitle={`Active: ${currentMember.name}`}
    >
      <div className="space-y-4 pb-6 select-none">
        {/* 1. Family Profile Switcher Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active User / Profile
            </span>
            <button
              type="button"
              onClick={handleManageFamily}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 hover:underline cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Manage Members</span>
            </button>
          </div>

          <div className="p-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 space-y-1">
            {/* All Family Option */}
            <button
              type="button"
              onClick={() => handleSelectMember('all')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer touch-press ${
                activeMemberId === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/10 dark:bg-white/10">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span>All Family (Combined Wealth)</span>
              </div>
              {activeMemberId === 'all' && <Check className="w-4 h-4" />}
            </button>

            {/* Member List */}
            {familyMembers.map((member) => {
              const isActive = activeMemberId === member.id;
              const icon = RELATION_ICONS[member.relation] || '👤';
              const memberAccountsCount = accounts.filter(
                (a) => a.memberId === member.id || (member.id === 'self' && !a.memberId)
              ).length;

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleSelectMember(member.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer touch-press ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-sm leading-none">{icon}</span>
                    <span>{member.name}</span>
                    <span className="text-[10px] opacity-60 font-normal">({member.relation})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {memberAccountsCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black' : 'bg-black/5 dark:bg-white/10 text-slate-500'
                      }`}>
                        {memberAccountsCount} Acc
                      </span>
                    )}
                    {isActive && <Check className="w-4 h-4" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Theme & Appearance Section */}
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
            Appearance
          </span>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={() => setThemeMode('system')}
              className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer touch-press ${
                themeMode === 'system'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              <span>System</span>
            </button>

            <button
              type="button"
              onClick={() => setThemeMode('light')}
              className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer touch-press ${
                themeMode === 'light'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer touch-press ${
                themeMode === 'dark'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* 3. Quick Actions & Tools Grid */}
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
            Quick Tools & Privacy
          </span>
          <div className="grid grid-cols-2 gap-2">
            {/* Privacy Mode */}
            <button
              type="button"
              onClick={togglePrivacyMode}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer touch-press flex items-center space-x-3 ${
                isPrivacyMode
                  ? 'bg-emerald-500/15 dark:bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-black/[0.03] dark:bg-white/[0.04] border-black/5 dark:border-white/5 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className={`p-2 rounded-xl ${
                isPrivacyMode ? 'bg-emerald-500/20 text-emerald-600' : 'bg-black/5 dark:bg-white/10 text-slate-500'
              }`}>
                {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">Privacy Mask</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isPrivacyMode ? 'Balances Hidden' : 'Balances Visible'}
                </div>
              </div>
            </button>

            {/* Lock App Now (if PIN exists) or Set PIN */}
            {pin ? (
              <button
                type="button"
                onClick={handleLockNow}
                className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 text-left transition-all cursor-pointer touch-press flex items-center space-x-3 text-slate-700 dark:text-slate-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
              >
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">Lock Vault</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    PIN Protected
                  </div>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenSettings}
                className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 text-left transition-all cursor-pointer touch-press flex items-center space-x-3 text-slate-700 dark:text-slate-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
              >
                <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">Set PIN Lock</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Secure Vault
                  </div>
                </div>
              </button>
            )}

            {/* Scan / Sync Bank SMS */}
            <button
              type="button"
              onClick={handleTriggerSmsSync}
              disabled={isSyncingSms}
              className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 text-left transition-all cursor-pointer touch-press flex items-center space-x-3 text-slate-700 dark:text-slate-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] col-span-2"
            >
              <div className={`p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 ${
                isSyncingSms ? 'animate-spin' : ''
              }`}>
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold leading-tight">
                  {syncFeedback || (isSyncingSms ? 'Scanning SMS...' : 'Scan Bank SMS & Notifications')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Fetch latest debit/credit transactions & OTPs
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 4. Full Settings Navigation Tile */}
        <button
          type="button"
          onClick={handleOpenSettings}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white flex items-center justify-between shadow-md transition-all cursor-pointer touch-press"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Settings className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-extrabold leading-tight">All Settings & Backup</div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                Export JSON, Snapshots, Reset Data, Help
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </BottomSheet>
  );
}
