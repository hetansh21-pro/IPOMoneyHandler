import { describe, it, expect } from 'vitest';
import {
  calculateAccountBalance,
  getAccountIPOBlockedAmount,
  getAccountAvailableBalance,
  calculateMoneySummary,
  calculateIPOAmount,
  calculateAllotmentSettlement,
} from './ledger';
import { Account, Transaction, IPOApplication, Investment } from '../types/finance';

describe('Financial Ledger & IPO Accounting Rules', () => {
  const mockDate = '2026-09-18T10:00:00.000Z';

  it('1. Add ₹10,000: correctly increments account balance', () => {
    const account: Account = {
      id: 'acc-hdfc',
      name: 'HDFC Bank',
      type: 'bank',
      initialBalance: 50000,
      balance: 50000,
      currency: 'INR',
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        accountId: 'acc-hdfc',
        type: 'MONEY_ADDED',
        amount: 10000,
        description: 'Salary bonus',
        date: mockDate,
        createdAt: mockDate,
      },
    ];

    const computed = calculateAccountBalance(account, transactions);
    expect(computed).toBe(60000);
  });

  it('2. Remove ₹2,000: correctly decrements account balance', () => {
    const account: Account = {
      id: 'acc-hdfc',
      name: 'HDFC Bank',
      type: 'bank',
      initialBalance: 60000,
      balance: 60000,
      currency: 'INR',
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    const transactions: Transaction[] = [
      {
        id: 'tx-2',
        accountId: 'acc-hdfc',
        type: 'MONEY_REMOVED',
        amount: 2000,
        description: 'Cash withdrawal',
        date: mockDate,
        createdAt: mockDate,
      },
    ];

    const computed = calculateAccountBalance(account, transactions);
    expect(computed).toBe(58000);
  });

  it('3. Transfer ₹3,000: debits source and credits destination account atomically', () => {
    const hdfc: Account = {
      id: 'acc-hdfc',
      name: 'HDFC Bank',
      type: 'bank',
      initialBalance: 58000,
      balance: 58000,
      currency: 'INR',
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    const sbi: Account = {
      id: 'acc-sbi',
      name: 'SBI Bank',
      type: 'bank',
      initialBalance: 20000,
      balance: 20000,
      currency: 'INR',
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    const transactions: Transaction[] = [
      {
        id: 'tx-3a',
        accountId: 'acc-hdfc',
        type: 'TRANSFER_OUT',
        amount: 3000,
        relatedAccountId: 'acc-sbi',
        description: 'Transfer to SBI',
        date: mockDate,
        createdAt: mockDate,
      },
      {
        id: 'tx-3b',
        accountId: 'acc-sbi',
        type: 'TRANSFER_IN',
        amount: 3000,
        relatedAccountId: 'acc-hdfc',
        description: 'Transfer from HDFC',
        date: mockDate,
        createdAt: mockDate,
      },
    ];

    expect(calculateAccountBalance(hdfc, transactions)).toBe(55000);
    expect(calculateAccountBalance(sbi, transactions)).toBe(23000);
  });

  it('4 & 5. Apply for 2 IPO lots and block amount without double-counting or raw balance deduction', () => {
    // IPO: Price 295, Lot Size 50, Lots: 2 -> Amount: 295 * 50 * 2 = 29,500
    const ipoPrice = 295;
    const lotSize = 50;
    const lots = 2;
    const totalIPOAmount = calculateIPOAmount(ipoPrice, lotSize, lots);
    expect(totalIPOAmount).toBe(29500);

    const hdfc: Account = {
      id: 'acc-hdfc',
      name: 'HDFC Bank',
      type: 'bank',
      initialBalance: 80000,
      balance: 80000,
      currency: 'INR',
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    const applications: IPOApplication[] = [
      {
        id: 'app-1',
        ipoId: 'ipo-abc',
        companyName: 'ABC Limited',
        symbol: 'ABC',
        accountId: 'acc-hdfc',
        lotsApplied: 2,
        lotsAllotted: 0,
        applicationPrice: 295,
        applicationAmount: 29500,
        blockedAmount: 29500,
        allottedAmount: 0,
        releasedAmount: 0,
        status: 'APPLIED',
        timeline: [],
        appliedAt: mockDate,
        updatedAt: mockDate,
      },
    ];

    const blocked = getAccountIPOBlockedAmount('acc-hdfc', applications);
    expect(blocked).toBe(29500);

    const available = getAccountAvailableBalance(hdfc, applications);
    expect(available).toBe(50500); // 80,000 - 29,500 = 50,500

    const summary = calculateMoneySummary([hdfc], applications);
    expect(summary.totalTrackedMoney).toBe(80000);
    expect(summary.availableMoney).toBe(50500);
    expect(summary.blockedMoney).toBe(29500);
  });

  it('6. Fully Allotted: converts blocked allocation to invested debit', () => {
    const appliedAmount = 29500;
    const price = 295;
    const lotSize = 50;
    const lotsAllotted = 2;

    const settlement = calculateAllotmentSettlement(appliedAmount, price, lotSize, lotsAllotted);
    expect(settlement.isFull).toBe(true);
    expect(settlement.allottedAmount).toBe(29500);
    expect(settlement.releasedAmount).toBe(0);

    const hdfc: Account = {
      id: 'acc-hdfc',
      name: 'HDFC Bank',
      type: 'bank',
      initialBalance: 80000,
      balance: 80000,
      currency: 'INR',
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    const postAllotmentTxs: Transaction[] = [
      {
        id: 'tx-allot-1',
        accountId: 'acc-hdfc',
        type: 'IPO_ALLOTMENT_INVESTED',
        amount: 29500,
        description: 'ABC Limited IPO Allotment (2 Lots)',
        date: mockDate,
        createdAt: mockDate,
      },
    ];

    const remainingBalance = calculateAccountBalance(hdfc, postAllotmentTxs);
    expect(remainingBalance).toBe(50500);
  });

  it('7. Partially Allotted: applied 5 lots (73,750), allotted 2 lots (29,500) -> 44,250 released', () => {
    const appliedAmount = 73750;
    const price = 295;
    const lotSize = 50;
    const lotsAllotted = 2;

    const settlement = calculateAllotmentSettlement(appliedAmount, price, lotSize, lotsAllotted);
    expect(settlement.isPartial).toBe(true);
    expect(settlement.allottedAmount).toBe(29500);
    expect(settlement.releasedAmount).toBe(44250);

    const hdfc: Account = {
      id: 'acc-hdfc',
      name: 'HDFC Bank',
      type: 'bank',
      initialBalance: 100000,
      balance: 100000,
      currency: 'INR',
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    // Bank is debited only for the allotted amount:
    const txs: Transaction[] = [
      {
        id: 'tx-partial-1',
        accountId: 'acc-hdfc',
        type: 'IPO_ALLOTMENT_INVESTED',
        amount: 29500,
        description: 'Partial Allotment ABC (2/5 lots)',
        date: mockDate,
        createdAt: mockDate,
      },
      {
        id: 'tx-partial-2',
        accountId: 'acc-hdfc',
        type: 'IPO_RELEASED',
        amount: 44250,
        description: 'Unused IPO funds unblocked',
        date: mockDate,
        createdAt: mockDate,
      },
    ];

    const currentBalance = calculateAccountBalance(hdfc, txs);
    expect(currentBalance).toBe(70500); // 100,000 - 29,500 = 70,500
  });

  it('8. Not Allotted: releases entire blocked amount back to available balance', () => {
    const appliedAmount = 29500;
    const settlement = calculateAllotmentSettlement(appliedAmount, 295, 50, 0);
    expect(settlement.isZero).toBe(true);
    expect(settlement.allottedAmount).toBe(0);
    expect(settlement.releasedAmount).toBe(29500);

    const hdfc: Account = {
      id: 'acc-hdfc',
      name: 'HDFC Bank',
      type: 'bank',
      initialBalance: 80000,
      balance: 80000,
      currency: 'INR',
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    // Status is now NOT_ALLOTTED, so blockedAmount is 0
    const applications: IPOApplication[] = [
      {
        id: 'app-1',
        ipoId: 'ipo-abc',
        companyName: 'ABC Limited',
        symbol: 'ABC',
        accountId: 'acc-hdfc',
        lotsApplied: 2,
        lotsAllotted: 0,
        applicationPrice: 295,
        applicationAmount: 29500,
        blockedAmount: 0,
        allottedAmount: 0,
        releasedAmount: 29500,
        status: 'NOT_ALLOTTED',
        timeline: [],
        appliedAt: mockDate,
        updatedAt: mockDate,
      },
    ];

    expect(getAccountIPOBlockedAmount('acc-hdfc', applications)).toBe(0);
    expect(getAccountAvailableBalance(hdfc, applications)).toBe(80000);
  });

  it('9. Cancel Application: unblocks funds completely', () => {
    const hdfc: Account = {
      id: 'acc-hdfc',
      name: 'HDFC Bank',
      type: 'bank',
      initialBalance: 80000,
      balance: 80000,
      currency: 'INR',
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    const cancelledApp: IPOApplication = {
      id: 'app-cancelled',
      ipoId: 'ipo-abc',
      companyName: 'ABC Limited',
      symbol: 'ABC',
      accountId: 'acc-hdfc',
      lotsApplied: 2,
      lotsAllotted: 0,
      applicationPrice: 295,
      applicationAmount: 29500,
      blockedAmount: 0,
      allottedAmount: 0,
      releasedAmount: 29500,
      status: 'CANCELLED',
      timeline: [],
      appliedAt: mockDate,
      updatedAt: mockDate,
    };

    expect(getAccountAvailableBalance(hdfc, [cancelledApp])).toBe(80000);
  });

  it('10 & 11. Delete and Edit transaction: reflects dynamically in audited balance', () => {
    const acc: Account = {
      id: 'acc-1',
      name: 'Cash',
      type: 'cash',
      initialBalance: 1000,
      balance: 1000,
      currency: 'INR',
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    let txs: Transaction[] = [
      { id: 't1', accountId: 'acc-1', type: 'MONEY_ADDED', amount: 500, description: 'gift', date: mockDate, createdAt: mockDate },
      { id: 't2', accountId: 'acc-1', type: 'EXPENSE', amount: 200, description: 'coffee', date: mockDate, createdAt: mockDate },
    ];

    expect(calculateAccountBalance(acc, txs)).toBe(1300);

    // Edit transaction t2 from 200 to 250
    txs = txs.map((t) => (t.id === 't2' ? { ...t, amount: 250 } : t));
    expect(calculateAccountBalance(acc, txs)).toBe(1250);

    // Delete transaction t2
    txs = txs.filter((t) => t.id !== 't2');
    expect(calculateAccountBalance(acc, txs)).toBe(1500);
  });

  it('12. Multiple Accounts: handles bank, cash, demat, investments correctly', () => {
    const accounts: Account[] = [
      { id: 'acc-hdfc', name: 'HDFC', type: 'bank', initialBalance: 300000, balance: 300000, currency: 'INR', createdAt: mockDate, updatedAt: mockDate },
      { id: 'acc-cash', name: 'Cash In Hand', type: 'cash', initialBalance: 50000, balance: 50000, currency: 'INR', createdAt: mockDate, updatedAt: mockDate },
      { id: 'acc-zerodha', name: 'Zerodha Demat', type: 'demat', initialBalance: 100000, balance: 100000, currency: 'INR', createdAt: mockDate, updatedAt: mockDate },
    ];

    const manualInvestments: Investment[] = [
      { id: 'inv-1', symbol: 'TCS', name: 'Tata Consultancy Services', quantity: 10, avgPrice: 3200, currentPrice: 3450, createdAt: mockDate, updatedAt: mockDate },
    ]; // 10 * 3450 = 34,500

    const summary = calculateMoneySummary(accounts, [], [], manualInvestments);
    // Liquid: 300,000 + 50,000 = 350,000
    // Invested: 100,000 (Demat) + 34,500 (TCS) = 134,500
    // Total: 484,500
    expect(summary.totalTrackedMoney).toBe(484500);
    expect(summary.availableMoney).toBe(350000);
    expect(summary.investedMoney).toBe(134500);
    expect(summary.blockedMoney).toBe(0);
  });

  it('13. Multiple Simultaneous IPOs across different accounts: calculates isolated blocks correctly', () => {
    const hdfc: Account = { id: 'acc-hdfc', name: 'HDFC', type: 'bank', initialBalance: 150000, balance: 150000, currency: 'INR', createdAt: mockDate, updatedAt: mockDate };
    const icici: Account = { id: 'acc-icici', name: 'ICICI', type: 'bank', initialBalance: 100000, balance: 100000, currency: 'INR', createdAt: mockDate, updatedAt: mockDate };

    const apps: IPOApplication[] = [
      {
        id: 'app-1',
        ipoId: 'ipo-1',
        companyName: 'Bajaj Housing Finance',
        symbol: 'BAJAJHFL',
        accountId: 'acc-hdfc',
        lotsApplied: 2,
        lotsAllotted: 0,
        applicationPrice: 70,
        applicationAmount: 29960,
        blockedAmount: 29960,
        allottedAmount: 0,
        releasedAmount: 0,
        status: 'FUNDS_BLOCKED',
        timeline: [],
        appliedAt: mockDate,
        updatedAt: mockDate,
      },
      {
        id: 'app-2',
        ipoId: 'ipo-2',
        companyName: 'Western Carriers',
        symbol: 'WESTERN',
        accountId: 'acc-hdfc',
        lotsApplied: 1,
        lotsAllotted: 0,
        applicationPrice: 172,
        applicationAmount: 14964,
        blockedAmount: 14964,
        allottedAmount: 0,
        releasedAmount: 0,
        status: 'FUNDS_BLOCKED',
        timeline: [],
        appliedAt: mockDate,
        updatedAt: mockDate,
      },
      {
        id: 'app-3',
        ipoId: 'ipo-3',
        companyName: 'Arkade Developers',
        symbol: 'ARKADE',
        accountId: 'acc-icici',
        lotsApplied: 1,
        lotsAllotted: 0,
        applicationPrice: 128,
        applicationAmount: 14080,
        blockedAmount: 14080,
        allottedAmount: 0,
        releasedAmount: 0,
        status: 'MANDATE_ACCEPTED',
        timeline: [],
        appliedAt: mockDate,
        updatedAt: mockDate,
      },
    ];

    // HDFC has 2 applications: 29,960 + 14,964 = 44,924 blocked
    expect(getAccountIPOBlockedAmount('acc-hdfc', apps)).toBe(44924);
    expect(getAccountAvailableBalance(hdfc, apps)).toBe(105076); // 150,000 - 44,924 = 105,076

    // ICICI has 1 application: 14,080 blocked
    expect(getAccountIPOBlockedAmount('acc-icici', apps)).toBe(14080);
    expect(getAccountAvailableBalance(icici, apps)).toBe(85920); // 100,000 - 14,080 = 85,920

    const summary = calculateMoneySummary([hdfc, icici], apps);
    expect(summary.totalTrackedMoney).toBe(250000);
    expect(summary.blockedMoney).toBe(59004); // 44,924 + 14,080
    expect(summary.availableMoney).toBe(190996); // 250,000 - 59,004
  });
});

import { useAppStore } from '../store/useAppStore';

describe('App Store State & Navigation Integration Tests', () => {
  it('14. Navigation Tab Switch cleanly clears modal states and sets activeTab', () => {
    const store = useAppStore.getState();
    store.resetAllData();
    expect(useAppStore.getState().activeTab).toBe('home');

    useAppStore.getState().setSelectedAccountDetailId('acc-hdfc');
    expect(useAppStore.getState().selectedAccountDetailId).toBe('acc-hdfc');

    useAppStore.getState().setActiveTab('accounts');
    expect(useAppStore.getState().activeTab).toBe('accounts');
    expect(useAppStore.getState().selectedAccountDetailId).toBeNull();

    useAppStore.getState().setActiveTab('ipos');
    expect(useAppStore.getState().activeTab).toBe('ipos');

    useAppStore.getState().setActiveTab('transactions');
    expect(useAppStore.getState().activeTab).toBe('transactions');

    useAppStore.getState().setActiveTab('more');
    expect(useAppStore.getState().activeTab).toBe('more');
  });

  it('15. Stock Portfolio: add, update, delete, and clear all holdings to reach ₹0', () => {
    useAppStore.getState().resetAllData();

    // Add stock
    useAppStore.getState().addInvestment({
      symbol: 'WIPRO',
      name: 'Wipro Limited',
      quantity: 20,
      avgPrice: 450,
      currentPrice: 480,
    });

    const wipro = useAppStore.getState().investments.find((i) => i.symbol === 'WIPRO');
    expect(wipro).toBeDefined();
    expect(wipro?.quantity).toBe(20);

    // Edit stock
    useAppStore.getState().updateInvestment(wipro!.id, {
      quantity: 30,
      currentPrice: 500,
    });
    const updatedWipro = useAppStore.getState().investments.find((i) => i.symbol === 'WIPRO');
    expect(updatedWipro?.quantity).toBe(30);

    // Delete single stock
    useAppStore.getState().deleteInvestment(wipro!.id);
    expect(useAppStore.getState().investments.find((i) => i.symbol === 'WIPRO')).toBeUndefined();

    // Clear all holdings to make ₹0
    const all = useAppStore.getState().investments;
    for (const inv of all) {
      useAppStore.getState().deleteInvestment(inv.id);
    }
    expect(useAppStore.getState().investments.length).toBe(0);
  });
});

