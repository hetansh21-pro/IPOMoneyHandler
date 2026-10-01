'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/lib/store/useAppStore';
import { Lock, Delete, ShieldCheck } from 'lucide-react';

export function PinLockModal() {
  const { isLocked, pin, unlockWithPin } = useAppStore();
  const [enteredPin, setEnteredPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (enteredPin.length === 4) {
      const success = unlockWithPin(enteredPin);
      if (success) {
        setEnteredPin('');
        setErrorMessage('');
      } else {
        setErrorShake(true);
        setErrorMessage('Incorrect PIN. Please try again.');
        setTimeout(() => {
          setErrorShake(false);
          setEnteredPin('');
        }, 500);
      }
    }
  }, [enteredPin, unlockWithPin]);

  if (!isLocked || !pin || !mounted) return null;

  const handleDigit = (digit: string) => {
    if (enteredPin.length < 4) {
      setEnteredPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const modal = (
    <div className="fixed inset-0 z-[999999] bg-white dark:bg-[#0b1120] flex flex-col items-center justify-between p-6 max-w-md mx-auto shadow-2xl transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-col items-center mt-12 space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">App Locked</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-xs">
          Enter your 4-digit security PIN to access your personal money and IPO ledger.
        </p>

        {/* PIN Indicators */}
        <div className={`flex items-center space-x-4 my-6 ${errorShake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const filled = enteredPin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  filled
                    ? 'bg-emerald-600 dark:bg-emerald-400 scale-110 shadow-sm shadow-emerald-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700'
                }`}
              />
            );
          })}
        </div>
        {errorMessage && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-2">{errorMessage}</p>
        )}
      </div>

      {/* Number Pad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-4 mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleDigit(num.toString())}
            className="w-16 h-16 mx-auto rounded-full bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/60 dark:border-white/10 text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center active:bg-slate-200/90 dark:active:bg-slate-700/90 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            {num}
          </button>
        ))}
        {/* Empty placeholder for clean symmetric 3x4 layout */}
        <div className="w-16 h-16 mx-auto" />
        <button
          onClick={() => handleDigit('0')}
          className="w-16 h-16 mx-auto rounded-full bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/60 dark:border-white/10 text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center active:bg-slate-200/90 dark:active:bg-slate-700/90 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-16 h-16 mx-auto rounded-full bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/60 dark:border-white/10 text-slate-500 dark:text-slate-400 flex items-center justify-center active:bg-slate-200/90 dark:active:bg-slate-700/90 active:scale-95 transition-all shadow-xs cursor-pointer"
          aria-label="Delete digit"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center space-x-1.5 text-slate-400 dark:text-slate-500 text-[11px] mb-4">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>100% Offline & Private Encrypted Storage</span>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
