'use client';

import React from 'react';

export function AppSkeletonLoader() {
  return (
    <div className="space-y-4 pb-28 animate-pulse w-full">
      {/* Greeting Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-slate-200/80 rounded-md" />
          <div className="h-6 w-48 bg-slate-200/90 rounded-lg" />
        </div>
        <div className="h-6 w-20 bg-emerald-100/60 rounded-full" />
      </div>

      {/* Main Hero Card Skeleton */}
      <div className="relative rounded-3xl bg-white p-5 border border-slate-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-emerald-200/70 rounded-md" />
            <div className="h-9 w-44 bg-slate-200 rounded-xl" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-2.5 w-20 bg-slate-200/70 rounded-md ml-auto" />
            <div className="h-4 w-16 bg-slate-200 rounded-md ml-auto" />
          </div>
        </div>

        {/* 3 Sub Balances Skeleton */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
          <div className="h-14 rounded-2xl bg-emerald-50/60 border border-emerald-100/40 p-2.5 space-y-1.5">
            <div className="h-2.5 w-14 bg-emerald-200/60 rounded" />
            <div className="h-4 w-16 bg-emerald-200/80 rounded" />
          </div>
          <div className="h-14 rounded-2xl bg-amber-50/60 border border-amber-100/40 p-2.5 space-y-1.5">
            <div className="h-2.5 w-14 bg-amber-200/60 rounded" />
            <div className="h-4 w-16 bg-amber-200/80 rounded" />
          </div>
          <div className="h-14 rounded-2xl bg-indigo-50/60 border border-indigo-100/40 p-2.5 space-y-1.5">
            <div className="h-2.5 w-14 bg-indigo-200/60 rounded" />
            <div className="h-4 w-16 bg-indigo-200/80 rounded" />
          </div>
        </div>
      </div>

      {/* Quick Action Grid Skeleton */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/60 space-y-2"
          >
            <div className="w-10 h-10 rounded-2xl bg-slate-100" />
            <div className="h-2.5 w-10 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Distribution Card Skeleton */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/60 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="h-3 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-16 bg-slate-200 rounded" />
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full" />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="h-10 bg-slate-50 rounded-2xl border border-slate-100" />
          <div className="h-10 bg-slate-50 rounded-2xl border border-slate-100" />
        </div>
      </div>

      {/* Accounts List Skeleton */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="h-3 w-28 bg-slate-200 rounded" />
          <div className="h-3 w-14 bg-slate-200 rounded" />
        </div>

        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white border border-slate-200/60 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 bg-slate-200 rounded" />
                  <div className="h-2.5 w-20 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-4 w-16 bg-slate-200 rounded ml-auto" />
                <div className="h-2.5 w-12 bg-slate-100 rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
