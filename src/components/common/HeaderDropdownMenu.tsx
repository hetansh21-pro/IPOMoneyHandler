'use client';

import React, { useRef } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { useBackHandler } from '@/lib/hooks/useBackHandler';
import {
  Users,
  Settings,
  Lock,
  Sun,
  Moon,
  Eye,
  EyeOff,
  UserPlus,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface HeaderDropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HeaderDropdownMenu({ isOpen, onClose }: HeaderDropdownMenuProps) {
  const {
    themeMode,
    setThemeMode,
    isPrivacyMode,
    togglePrivacyMode,
    pin,
    lockApp,
    familyMembers,
    activeMemberId,
    setIsFamilyModalOpen,
    setActiveTab,
  } = useAppStore();

  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape or back button
  useBackHandler(isOpen, () => {
    onClose();
    return true;
  });

  if (!isOpen) return null;

  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleSelectTheme = (mode: 'light' | 'dark') => {
    setThemeMode(mode);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(10);
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
    }, 150);
  };

  const handleLockNow = () => {
    onClose();
    setTimeout(() => {
      lockApp();
    }, 120);
  };

  const activeMember = familyMembers.find((m) => m.id === activeMemberId);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] transition-opacity animate-fade-in touch-manipulation"
      />

      {/* Floating Dropdown Menu Card */}
      <div
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-3 top-[calc(max(env(safe-area-inset-top,0px),10px)+3.2rem)] z-50 w-[290px] rounded-[24px] bg-white dark:bg-[#0f172a] border border-black/10 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] p-3 space-y-3 select-none animate-scale-up origin-top-right text-[#0f172a] dark:text-slate-100"
      >
        {/* 1. User & Family Profile Card */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              User Profile
            </span>
            <button
              type="button"
              onClick={handleManageFamily}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 hover:underline cursor-pointer touch-manipulation active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Manage</span>
            </button>
          </div>

          {/* Active Profile Card */}
          <div
            onClick={handleManageFamily}
            className="p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800/90 transition-all group"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-xs shrink-0 text-white"
                style={{
                  backgroundColor:
                    activeMemberId === 'all'
                      ? '#059669'
                      : activeMember?.avatarColor || '#0284c7',
                }}
              >
                {activeMemberId === 'all' ? (
                  <Users className="w-4 h-4 text-white stroke-[2.5]" />
                ) : (
                  <span>{activeMember?.name?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                    {activeMemberId === 'all'
                      ? 'All Family Overview'
                      : activeMember?.name.replace(/\s*\(Primary\)/i, '') || 'Me'}
                  </h4>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {activeMemberId === 'all'
                    ? `${familyMembers.length} Family Profiles Combined`
                    : `${activeMember?.relation || 'Self'} • Active Profile`}
                </p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors shrink-0 ml-1" />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 dark:bg-white/5" />

        {/* 2. 1-Click Smooth Theme Switcher with Sliding Green Line */}
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 block">
            Appearance
          </span>
          <div className="relative flex items-center justify-around pt-0.5 pb-1 select-none">
            {/* Sliding Green Line Indicator */}
            <div
              className="absolute bottom-0 left-0 h-[2.5px] w-1/2 flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.2,0.9,0.2,1)] will-change-transform pointer-events-none"
              style={{
                transform: isDark ? 'translateX(100%)' : 'translateX(0%)',
              }}
            >
              <span className="w-12 h-full rounded-full bg-emerald-600 dark:bg-emerald-400 shadow-[0_1px_4px_rgba(5,150,105,0.4)]" />
            </div>

            <button
              type="button"
              onClick={() => handleSelectTheme('light')}
              className={`relative flex-1 flex items-center justify-center space-x-1.5 py-1.5 text-xs transition-colors duration-200 cursor-pointer touch-manipulation active:scale-95 ${
                !isDark
                  ? 'text-emerald-600 dark:text-emerald-400 font-black'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold'
              }`}
            >
              <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500 stroke-[2.5]' : 'text-slate-400'}`} />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTheme('dark')}
              className={`relative flex-1 flex items-center justify-center space-x-1.5 py-1.5 text-xs transition-colors duration-200 cursor-pointer touch-manipulation active:scale-95 ${
                isDark
                  ? 'text-emerald-600 dark:text-emerald-400 font-black'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold'
              }`}
            >
              <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400 stroke-[2.5]' : 'text-slate-400'}`} />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 dark:bg-white/5" />

        {/* 3. Quick Options & Settings Rows */}
        <div className="space-y-1">
          {/* Privacy Toggle Row */}
          <div
            onClick={togglePrivacyMode}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
          >
            <div className="flex items-center space-x-2.5">
              <div className={`p-1.5 rounded-lg ${isPrivacyMode ? 'bg-emerald-500/15 text-emerald-600' : 'bg-black/5 dark:bg-white/10 text-slate-500'}`}>
                {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs font-bold">Privacy Mask</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              {isPrivacyMode ? 'Hidden' : 'Visible'}
            </span>
          </div>

          {/* App Lock Row */}
          {pin ? (
            <div
              onClick={handleLockNow}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold">Lock App</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Lock Now</span>
            </div>
          ) : (
            <div
              onClick={handleOpenSettings}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-600">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold">Set PIN Lock</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
          )}

          {/* Settings Row */}
          <div
            onClick={handleOpenSettings}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
          >
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                <Settings className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold">All Settings & Backup</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>
    </>
  );
}
