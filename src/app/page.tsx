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
      <div key={activeTab} className="animate-page-enter w-full">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'accounts' && <AccountsScreen />}
        {activeTab === 'ipos' && <IPOsScreen />}
        {activeTab === 'transactions' && <TransactionsScreen />}
        {activeTab === 'holdings' && <HoldingPortfolioScreen />}
        {activeTab === 'more' && <MoreScreen />}
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
