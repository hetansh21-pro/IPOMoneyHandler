'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { BottomSheet } from './BottomSheet';
import { FamilyMember, FamilyRelation } from '@/lib/types/finance';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Check,
  User,
  Shield,
  CreditCard,
  Building2,
  Sparkles,
  ArrowRight,
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

const RELATION_ICONS: Record<FamilyRelation, string> = {
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

  // Form State
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<FamilyRelation>('Brother');
  const [panNumber, setPanNumber] = useState('');
  const [dematId, setDematId] = useState('');
  const [upiId, setUpiId] = useState('');
  const [avatarColor, setAvatarColor] = useState(COLOR_PALETTES[0]);

  const resetForm = () => {
    setName('');
    setRelation('Brother');
    setPanNumber('');
    setDematId('');
    setUpiId('');
    setAvatarColor(COLOR_PALETTES[0]);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartEdit = (member: FamilyMember) => {
    setEditingId(member.id);
    setName(member.name);
    setRelation(member.relation);
    setPanNumber(member.panNumber || '');
    setDematId(member.dematId || '');
    setUpiId(member.upiId || '');
    setAvatarColor(member.avatarColor || COLOR_PALETTES[0]);
    setIsAdding(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

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

    resetForm();
  };

  const handleDelete = (id: string) => {
    if (id === 'self') return;
    deleteFamilyMember(id);
  };

  return (
    <BottomSheet
      isOpen={isFamilyModalOpen}
      onClose={() => {
        setIsFamilyModalOpen(false);
        resetForm();
      }}
      title="Family Profiles & Multi-User"
      subtitle="Manage accounts, holdings & multi-PAN IPO bids per person"
    >
      <div className="space-y-4 pb-2 max-h-[75vh] overflow-y-auto pr-0.5">
        {/* Info Banner */}
        <div className="p-3 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-start space-x-2.5">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed font-medium">
            <strong>1-Click Profile Switching:</strong> Switch between family members to view individual bank balances, stock portfolios, and submit multi-PAN IPO bids.
          </div>
        </div>

        {/* Add / Edit Form */}
        {isAdding ? (
          <form
            onSubmit={handleSaveMember}
            className="p-4 rounded-3xl ios-glass-card border border-white/80 dark:border-white/10 space-y-3.5 animate-scale-up"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                {editingId ? 'Edit Family Member' : 'Add New Family Member'}
              </h4>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                Cancel
              </button>
            </div>

            {/* Relation Selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                Relation / Role
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {RELATIONS.map((rel) => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => setRelation(rel)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                      relation === rel
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{RELATION_ICONS[rel]}</span>
                    <span>{rel}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                Member Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Brother, Mom, Hetansh"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* PAN Number (For IPO Allotment) */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                PAN Number (Optional, for IPO Bids)
              </label>
              <input
                type="text"
                maxLength={10}
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono font-bold text-xs uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Demat ID & UPI ID */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                  Demat / DP ID
                </label>
                <input
                  type="text"
                  value={dematId}
                  onChange={(e) => setDematId(e.target.value)}
                  placeholder="12081600..."
                  className="w-full px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                  UPI ID (For Mandates)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="user@okhdfcbank"
                  className="w-full px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                Avatar Theme Color
              </label>
              <div className="flex items-center space-x-2">
                {COLOR_PALETTES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                      avatarColor === c ? 'scale-125 ring-2 ring-emerald-500 ring-offset-2' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 active:scale-98 transition-transform cursor-pointer"
            >
              {editingId ? 'Update Member Profile' : 'Save & Add Member'}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-extrabold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Family Member (Brother, Mom, Dad, etc.)</span>
          </button>
        )}

        {/* Existing Family Members List */}
        <div className="space-y-2 pt-2">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
            Current Family Profiles ({familyMembers.length})
          </h4>

          <div className="space-y-2">
            {familyMembers.map((member) => {
              const isCurrentActive = activeMemberId === member.id;
              const memberAccounts = accounts.filter(
                (a) => a.memberId === member.id || (member.id === 'self' && !a.memberId)
              );
              const memberApps = applications.filter(
                (app) => app.memberId === member.id || (member.id === 'self' && !app.memberId)
              );
              const icon = RELATION_ICONS[member.relation] || '👤';

              return (
                <div
                  key={member.id}
                  className={`p-3.5 rounded-3xl ios-glass-card border transition-all flex items-center justify-between ${
                    isCurrentActive
                      ? 'border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm'
                      : 'border-white/80 dark:border-white/10'
                  }`}
                >
                  <div
                    onClick={() => {
                      setActiveMemberId(member.id);
                      setIsFamilyModalOpen(false);
                    }}
                    className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0 select-none"
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-base shrink-0 shadow-xs text-white"
                      style={{ backgroundColor: member.avatarColor || '#0284c7' }}
                    >
                      {icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                          {member.name}
                        </h5>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                          {member.relation}
                        </span>
                        {member.isDefault && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shrink-0">
                            Primary
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                        {memberAccounts.length} Account(s) • {memberApps.length} IPO Bid(s)
                        {member.panNumber ? ` • PAN: ${member.panNumber}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(member)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {!member.isDefault && member.id !== 'self' && (
                      <button
                        type="button"
                        onClick={() => handleDelete(member.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setActiveMemberId(member.id);
                        setIsFamilyModalOpen(false);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                        isCurrentActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                      }`}
                    >
                      {isCurrentActive ? 'Active' : 'Switch'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
