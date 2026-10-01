'use client';

import React, { useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { useBackHandler } from '@/lib/hooks/useBackHandler';
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
  ChevronRight,
  Shield,
  Check,
} from 'lucide-react';

interface HeaderDropdownMenuProps {
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
    setActiveMemberId,
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

  const handleSelectMember = (id: string | 'all') => {
    setActiveMemberId(id);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
  };

  const handleSelectTheme = (mode: 'system' | 'light' | 'dark') => {
    setThemeMode(mode);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
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
        {/* 1. User & Family Profile Switcher */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              User Profile
            </span>
            <button
              type="button"
              onClick={handleManageFamily}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 hover:underline cursor-pointer touch-manipulation active:scale-95"
            >
              <UserPlus className="w-3 h-3" />
              <span>Manage</span>
            </button>
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] py-0.5">
            {/* All Option */}
            <button
              type="button"
              onClick={() => handleSelectMember('all')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 touch-manipulation active:scale-95 ${
                activeMemberId === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>All</span>
            </button>

            {/* Individual Members */}
            {familyMembers.map((member) => {
              const isActive = activeMemberId === member.id;
              const icon = RELATION_ICONS[member.relation] || '👤';

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleSelectMember(member.id)}
                  className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 touch-manipulation active:scale-95 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                      : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="text-[10px] leading-none">{icon}</span>
                  <span className="truncate max-w-[70px]">{member.name.replace(/\s*\(Primary\)/i, '')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 dark:bg-white/5" />

        {/* 2. 1-Click Theme Switcher (Light / Dark) with clean Underline */}
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 block">
            Appearance
          </span>
          <div className="relative flex items-center justify-around pt-0.5 pb-1 select-none">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectTheme('light');
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectTheme('light');
              }}
              className={`relative flex-1 flex items-center justify-center space-x-1.5 py-1.5 text-xs font-black transition-colors cursor-pointer touch-manipulation active:scale-95 ${
                themeMode === 'light'
                  ? 'text-slate-950 dark:text-white'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Sun className={`w-3.5 h-3.5 ${themeMode === 'light' ? 'text-amber-500 stroke-[2.5]' : 'text-slate-400'}`} />
              <span>Light</span>
              {themeMode === 'light' && (
                <span className="absolute bottom-0 inset-x-4 h-[2.5px] rounded-full bg-slate-900 dark:bg-white shadow-xs transition-all duration-300" />
              )}
            </button>

            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectTheme('dark');
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectTheme('dark');
              }}
              className={`relative flex-1 flex items-center justify-center space-x-1.5 py-1.5 text-xs font-black transition-colors cursor-pointer touch-manipulation active:scale-95 ${
                themeMode === 'dark' || (themeMode === 'system' && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
                  ? 'text-slate-950 dark:text-white'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Moon className={`w-3.5 h-3.5 ${themeMode === 'dark' ? 'text-indigo-400 stroke-[2.5]' : 'text-slate-400'}`} />
              <span>Dark</span>
              {(themeMode === 'dark' || (themeMode === 'system' && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) && (
                <span className="absolute bottom-0 inset-x-4 h-[2.5px] rounded-full bg-slate-900 dark:bg-white shadow-xs transition-all duration-300" />
              )}
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
