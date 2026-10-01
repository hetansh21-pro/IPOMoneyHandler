'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/lib/store/useAppStore';
import { Wallet, Shield, TrendingUp, Sparkles, ArrowRight, Check } from 'lucide-react';

export function OnboardingModal() {
  const { hasCompletedOnboarding, completeOnboarding } = useAppStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (hasCompletedOnboarding || !mounted) return null;

  const slides = [
    {
      icon: <Wallet className="w-10 h-10 text-emerald-600" />,
      title: 'Know Where Your Money Is',
      description:
        'Track all your virtual bank accounts, cash, and Demats in one clean dashboard without connecting real bank credentials.',
      badge: 'Manual & Private',
    },
    {
      icon: <Shield className="w-10 h-10 text-sky-600" />,
      title: 'Track Multiple Accounts',
      description:
        'Keep clear separation of your funds across HDFC, SBI, ICICI, Cash, and Demats. Never double-count a single rupee.',
      badge: 'Clean Accounting',
    },
    {
      icon: <TrendingUp className="w-10 h-10 text-amber-600" />,
      title: 'Manage IPO Applications',
      description:
        'Select live Indian IPOs, auto-calculate lot sizes, and mark money as blocked without messing up your actual bank balances.',
      badge: 'Smart IPO Blocks',
    },
    {
      icon: <Sparkles className="w-10 h-10 text-indigo-600" />,
      title: 'Live IPO Data. Total Privacy.',
      description:
        'Real-time public IPO dates, price bands, and subscription rates. Your financial data stays 100% manual and on your device.',
      badge: 'Ready to Start',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      completeOnboarding();
    }
  };

  const slide = slides[currentSlide];

  const content = (
    <div className="fixed inset-0 z-[999999] bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-3xl flex flex-col justify-between p-6 max-w-md mx-auto shadow-2xl transition-colors">
      {/* Skip Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={completeOnboarding}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 font-medium px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
        >
          Skip
        </button>
      </div>

      {/* Main Slide Content */}
      <div className="flex flex-col items-center text-center px-4 space-y-6">
        <div className="w-24 h-24 rounded-3xl ios-glass-card flex items-center justify-center shadow-sm relative">
          <div className="absolute inset-0 bg-emerald-500/5 rounded-3xl blur-lg" />
          {slide.icon}
        </div>

        <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full ios-glass-pill text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          <span>{slide.badge}</span>
        </div>

        <div className="space-y-2.5">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{slide.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">{slide.description}</p>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="space-y-6 pb-6">
        {/* Indicators */}
        <div className="flex justify-center space-x-2">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-8 bg-emerald-600' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-transform"
        >
          <span>{currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}</span>
          {currentSlide === slides.length - 1 ? (
            <Check className="w-4 h-4" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
