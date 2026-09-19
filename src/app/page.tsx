'use client';

import React from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { MobileShell } from '@/components/layout/MobileShell';
import { HomeScreen } from '@/components/dashboard/HomeScreen';
import { AccountsScreen } from '@/components/accounts/AccountsScreen';
import { IPOsScreen } from '@/components/ipos/IPOsScreen';
import { TransactionsScreen } from '@/components/transactions/TransactionsScreen';
import { MoreScreen } from '@/components/settings/MoreScreen';

export default function AppPage() {
  const { activeTab } = useAppStore();

  return (
    <MobileShell>
      {activeTab === 'home' && <HomeScreen />}
      {activeTab === 'accounts' && <AccountsScreen />}
      {activeTab === 'ipos' && <IPOsScreen />}
      {activeTab === 'transactions' && <TransactionsScreen />}
      {activeTab === 'more' && <MoreScreen />}
    </MobileShell>
  );
}
