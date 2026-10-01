'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { BottomSheet } from './BottomSheet';
import { FamilyMember, FamilyRelation } from '@/lib/types/finance';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Check,
  User,
  CreditCard,
  Building2,
  Wallet,
  TrendingUp,
  UserPlus,
  AlertCircle,
} from 'lucide-react';

const RELATIONS: FamilyRelation[] = [
  'Self',
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Spouse',
  'Son',
  'Daughter',
  'Other',
];

const COLOR_PALETTES = [
  '#0284c7', // Sky Blue
  '#059669', // Emerald Green
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#d97706', // Amber
  '#dc2626', // Red
  '#4f46e5', // Indigo
  '#0d9488', // Teal
];

export function FamilyManagementModal() {
  const {
    familyMembers,
    activeMemberId,
    setActiveMemberId,
    isFamilyModalOpen,
    setIsFamilyModalOpen,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    accounts,
    applications,
  } = useAppStore();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<FamilyRelation>('Brother');
  const [panNumber, setPanNumber] = useState('');
  const [dematId, setDematId] = useState('');
  const [upiId, setUpiId] = useState('');
  const [avatarColor, setAvatarColor] = useState(COLOR_PALETTES[0]);
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setName('');
    setRelation('Brother');
    setPanNumber('');
    setDematId('');
    setUpiId('');
    setAvatarColor(COLOR_PALETTES[0]);
    setIsAdding(false);
    setEditingId(null);
    setFormError('');
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleStartEdit = (member: FamilyMember, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(member.id);
    setName(member.name);
    setRelation(member.relation);
    setPanNumber(member.panNumber || '');
    setDematId(member.dematId || '');
    setUpiId(member.upiId || '');
    setAvatarColor(member.avatarColor || COLOR_PALETTES[0]);
    setFormError('');
    setIsAdding(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter a valid member name');
      return;
    }

    if (editingId) {
      updateFamilyMember(editingId, {
        name: name.trim(),
        relation,
        panNumber: panNumber.trim().toUpperCase() || undefined,
        dematId: dematId.trim() || undefined,
        upiId: upiId.trim() || undefined,
        avatarColor,
      });
    } else {
      addFamilyMember({
        name: name.trim(),
        relation,
        panNumber: panNumber.trim().toUpperCase() || undefined,
        dematId: dematId.trim() || undefined,
        upiId: upiId.trim() || undefined,
        avatarColor,
      });
    }

    try {
      navigator?.vibrate?.(15);
    } catch {}

    resetForm();
  };

  const handleConfirmDelete = () => {
    if (!memberToDelete || memberToDelete.id === 'self') return;
    deleteFamilyMember(memberToDelete.id);
    setMemberToDelete(null);
    try {
      navigator?.vibrate?.(20);
    } catch {}
  };

  const handleSwitchProfile = (id: string | 'all') => {
    setActiveMemberId(id);
    try {
      navigator?.vibrate?.(10);
    } catch {}
    setIsFamilyModalOpen(false);
  };

  // Stats calculation
  const totalProfilesCount = familyMembers.length;
  const totalAccountsCount = accounts.length;
  const totalBidsCount = applications.length;

  return (
    <BottomSheet
      isOpen={isFamilyModalOpen}
      onClose={() => {
        setIsFamilyModalOpen(false);
        resetForm();
        setMemberToDelete(null);
      }}
      title="Family Profiles & Access"
      subtitle="Manage linked accounts, holdings & multi-PAN bids"
    >
      <div className="space-y-4 pb-4 max-h-[78vh] overflow-y-auto pr-0.5 select-none">
        {/* 1. Sleek Dashboard Metric Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white shadow-md border border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-white truncate flex items-center space-x-1.5">
                <span>Multi-User System</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </h4>
              <p className="text-[11px] text-slate-300 font-medium truncate">
                {totalProfilesCount} Profiles • {totalAccountsCount} Accounts • {totalBidsCount} Bids
              </p>
            </div>
          </div>

          <div className="shrink-0 pl-2">
            {!isAdding && (
              <button
                type="button"
                onClick={handleStartAdd}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer touch-manipulation active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Member</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Add / Edit Form Card */}
        {isAdding && (
          <form
            onSubmit={handleSaveMember}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-scale-up"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  {editingId ? 'Edit Profile Details' : 'New Family Member Profile'}
                </h4>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Relation Pills */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Relation / Role
              </label>
              <div className="flex flex-wrap gap-1.5">
                {RELATIONS.map((rel) => {
                  const isSelected = relation === rel;
                  return (
                    <button
                      key={rel}
                      type="button"
                      onClick={() => setRelation(rel)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer touch-manipulation active:scale-95 ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
                      }`}
                    >
                      {rel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Full Name *
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g. Dad, Mom, Hetansh Patel"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all"
                />
              </div>
            </div>

            {/* PAN Number */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  PAN Number (Optional, for IPO Bids)
                </label>
                <span className="text-[10px] font-bold text-slate-400 font-mono">10 Characters</span>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 font-mono font-bold text-xs uppercase focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all"
                />
              </div>
            </div>

            {/* Demat ID & UPI ID */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Demat / DP ID
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={dematId}
                    onChange={(e) => setDematId(e.target.value)}
                    placeholder="12081600..."
                    className="w-full pl-8 pr-2.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  UPI ID (Mandate)
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="user@bank"
                    className="w-full pl-8 pr-2.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Profile Avatar Color Picker */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Avatar Theme Color
              </label>
              <div className="flex items-center space-x-2.5 pt-0.5">
                {COLOR_PALETTES.map((c) => {
                  const isSelected = avatarColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`w-7 h-7 rounded-full transition-all cursor-pointer relative flex items-center justify-center ${
                        isSelected
                          ? 'scale-110 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 shadow-md'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="pt-2 flex items-center space-x-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition-colors cursor-pointer touch-manipulation"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[2] py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer touch-manipulation active:scale-[0.98]"
              >
                {editingId ? 'Update Member Profile' : 'Save & Add Member'}
              </button>
            </div>
          </form>
        )}

        {/* 3. Existing Family Profiles List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Profiles & Access ({familyMembers.length + 1})
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              Tap card to switch profile
            </span>
          </div>

          <div className="space-y-2.5">
            {/* 3.1 All Family Combined Profile Card */}
            {(() => {
              const isAllActive = activeMemberId === 'all';
              return (
                <div
                  onClick={() => handleSwitchProfile('all')}
                  className={`p-3.5 rounded-3xl transition-all cursor-pointer border flex items-center justify-between touch-manipulation group active:scale-[0.99] ${
                    isAllActive
                      ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12] border-emerald-500/80 shadow-md shadow-emerald-500/5'
                      : 'bg-white/90 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm relative">
                      <Users className="w-5 h-5 stroke-[2.2]" />
                      {isAllActive && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                          <Check className="w-2 h-2 text-slate-950 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                          All Family Overview
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shrink-0">
                          Combined
                        </span>
                      </div>

                      {/* Meta chips */}
                      <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                        <span className="flex items-center space-x-1">
                          <Wallet className="w-3 h-3 text-slate-400" />
                          <span>{accounts.length} Accounts</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3 text-slate-400" />
                          <span>{applications.length} IPO Bids</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Status / Action */}
                  <div className="shrink-0 ml-3">
                    {isAllActive ? (
                      <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-black shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwitchProfile('all');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-extrabold text-[11px] transition-colors cursor-pointer"
                      >
                        Switch
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 3.2 Individual Member Cards */}
            {familyMembers.map((member) => {
              const isCurrentActive = activeMemberId === member.id;
              const memberAccounts = accounts.filter(
                (a) => a.memberId === member.id || (member.id === 'self' && !a.memberId)
              );
              const memberApps = applications.filter(
                (app) => app.memberId === member.id || (member.id === 'self' && !app.memberId)
              );
              const initialLetter = member.name.trim().charAt(0).toUpperCase() || 'U';

              return (
                <div
                  key={member.id}
                  onClick={() => handleSwitchProfile(member.id)}
                  className={`p-3.5 rounded-3xl transition-all cursor-pointer border flex items-center justify-between touch-manipulation group active:scale-[0.99] ${
                    isCurrentActive
                      ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12] border-emerald-500/80 shadow-md shadow-emerald-500/5'
                      : 'bg-white/90 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {/* Modern Typography Avatar Badge */}
                    <div
                      className="w-11 h-11 rounded-2xl text-white font-black text-base flex items-center justify-center shrink-0 shadow-sm relative"
                      style={{ backgroundColor: member.avatarColor || '#0284c7' }}
                    >
                      <span>{initialLetter}</span>
                      {isCurrentActive && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                          <Check className="w-2 h-2 text-slate-950 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                          {member.name.replace(/\s*\(Primary\)/i, '')}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                          {member.relation}
                        </span>
                        {member.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shrink-0">
                            Primary
                          </span>
                        )}
                      </div>

                      {/* Meta chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                        <span className="flex items-center space-x-1">
                          <Wallet className="w-3 h-3 text-slate-400" />
                          <span>{memberAccounts.length} Account{memberAccounts.length !== 1 ? 's' : ''}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3 text-slate-400" />
                          <span>{memberApps.length} Bid{memberApps.length !== 1 ? 's' : ''}</span>
                        </span>
                        {member.panNumber && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                              PAN: {member.panNumber}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={(e) => handleStartEdit(member, e)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer touch-manipulation active:scale-95"
                      title="Edit Profile"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {!member.isDefault && member.id !== 'self' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMemberToDelete(member);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer touch-manipulation active:scale-95"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {isCurrentActive ? (
                      <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-black shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwitchProfile(member.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-extrabold text-[11px] transition-colors cursor-pointer"
                      >
                        Switch
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Delete Confirmation Modal Dialog */}
        {memberToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3.5 shadow-2xl animate-scale-up"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Delete "{memberToDelete.name}"?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to remove this family profile? Linked accounts and records will be unassigned but not lost.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-colors"
                >
                  Delete Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
