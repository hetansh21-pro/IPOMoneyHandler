'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, ShieldAlert, X } from 'lucide-react';
import { useBackHandler } from '@/lib/hooks/useBackHandler';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: 'trash' | 'warning' | 'shield';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon = 'warning',
}: ConfirmDialogProps) {
  const dialogMessage = message || description || '';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useBackHandler(isOpen, () => {
    onClose();
    return true;
  });

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const getIcon = () => {
    switch (icon) {
      case 'trash':
        return <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />;
      case 'shield':
        return <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
    }
  };

  const getIconBg = () => {
    if (variant === 'danger') {
      return 'bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/50';
    }
    if (variant === 'warning') {
      return 'bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/50';
    }
    return 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900/50';
  };

  const getConfirmButtonClasses = () => {
    if (variant === 'danger') {
      return 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30';
    }
    if (variant === 'warning') {
      return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30';
    }
    return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30';
  };

  const content = (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[360px] bg-white/90 dark:bg-[#0b111e]/90 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-[32px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-4 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${getIconBg()}`}>
            {getIcon()}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {dialogMessage}
          </p>
        </div>

        <div className="flex items-center space-x-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer ${getConfirmButtonClasses()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
