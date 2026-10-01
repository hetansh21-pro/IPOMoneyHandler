'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store/useAppStore';
import { MobileShell } from '@/components/layout/MobileShell';
import { HomeScreen } from '@/components/dashboard/HomeScreen';
import { AccountsScreen } from '@/components/accounts/AccountsScreen';
import { IPOsScreen } from '@/components/ipos/IPOsScreen';
import { TransactionsScreen } from '@/components/transactions/TransactionsScreen';
import { HoldingPortfolioScreen } from '@/components/portfolio/HoldingPortfolioScreen';
import { MoreScreen } from '@/components/settings/MoreScreen';
import { AppSkeletonLoader } from '@/components/common/AppSkeletonLoader';

function MainAppContent() {
  const { activeTab } = useAppStore();

  return (
    <MobileShell>
      <div className="relative w-full">
        <div className={`transition-opacity duration-150 ${activeTab === 'home' ? 'block opacity-100' : 'hidden opacity-0'}`}>
          <HomeScreen />
        </div>
        <div className={`transition-opacity duration-150 ${activeTab === 'accounts' ? 'block opacity-100' : 'hidden opacity-0'}`}>
          <AccountsScreen />
        </div>
        <div className={`transition-opacity duration-150 ${activeTab === 'ipos' ? 'block opacity-100' : 'hidden opacity-0'}`}>
          <IPOsScreen />
        </div>
        <div className={`transition-opacity duration-150 ${activeTab === 'transactions' ? 'block opacity-100' : 'hidden opacity-0'}`}>
          <TransactionsScreen />
        </div>
        <div className={`transition-opacity duration-150 ${activeTab === 'holdings' ? 'block opacity-100' : 'hidden opacity-0'}`}>
          <HoldingPortfolioScreen />
        </div>
        <div className={`transition-opacity duration-150 ${activeTab === 'more' ? 'block opacity-100' : 'hidden opacity-0'}`}>
          <MoreScreen />
        </div>
      </div>
    </MobileShell>
  );
}

const DynamicApp = dynamic(() => Promise.resolve(MainAppContent), {
  ssr: false,
  loading: () => <AppSkeletonLoader />,
});

export default function AppPage() {
  return <DynamicApp />;
}
