import {
  Account,
  Transaction,
  Allocation,
  IPOApplication,
  Investment,
  MoneySummary,
  AccountType,
} from '../types/finance';

/**
 * Calculates the computed balance of an account from its ledger transactions
 */
export function calculateAccountBalance(
  account: Account,
  transactions: Transaction[]
): number {
  const accountTxs = transactions.filter((tx) => tx.accountId === account.id);
  
  let balance = account.initialBalance;
  for (const tx of accountTxs) {
    switch (tx.type) {
      case 'MONEY_ADDED':
      case 'TRANSFER_IN':
      case 'INVESTMENT_SALE':
      case 'INCOME':
        balance += tx.amount;
        break;
      case 'MONEY_REMOVED':
      case 'TRANSFER_OUT':
      case 'IPO_ALLOTMENT_INVESTED':
      case 'INVESTMENT_PURCHASE':
      case 'EXPENSE':
        balance -= tx.amount;
        break;
      case 'IPO_ALLOCATION_BLOCKED':
      case 'IPO_RELEASED':
      case 'OTHER':
        // These are tracking/allocation events and do not mutate raw nominal cash
        break;
    }
  }
  return Math.round(balance * 100) / 100;
}

/**
 * Gets the total blocked IPO funds for a specific account
 */
export function getAccountIPOBlockedAmount(
  accountId: string,
  applications: IPOApplication[]
): number {
  const activeApps = applications.filter(
    (app) =>
      app.accountId === accountId &&
      !['NOT_ALLOTTED', 'FULLY_ALLOTTED', 'PARTIALLY_ALLOTTED', 'CANCELLED', 'COMPLETED'].includes(
        app.status
      )
  );

  return activeApps.reduce((sum, app) => sum + (app.blockedAmount || 0), 0);
}

/**
 * Gets the sub-allocated amounts for an account (e.g. personal, trading, emergency)
 */
export function getAccountAllocatedAmount(
  accountId: string,
  allocations: Allocation[]
): number {
  const accountAllocations = allocations.filter(
    (a) => a.accountId === accountId && a.type === 'GENERAL'
  );
  return accountAllocations.reduce((sum, a) => sum + a.amount, 0);
}

/**
 * Calculates available funds for a specific account
 */
export function getAccountAvailableBalance(
  account: Account,
  applications: IPOApplication[],
  allocations: Allocation[] = []
): number {
  const blocked = getAccountIPOBlockedAmount(account.id, applications);
  const generalAllocations = getAccountAllocatedAmount(account.id, allocations);
  const available = account.balance - blocked - generalAllocations;
  return Math.max(0, Math.round(available * 100) / 100);
}

/**
 * Calculates the dynamic invested value for a specific Demat/Investment account from live holdings
 */
export function getDematInvestedValue(
  account: Account,
  investments: Investment[] = [],
  allAccounts: Account[] = []
): number {
  const linked = investments.filter((inv) => inv.accountId === account.id);
  if (linked.length > 0) {
    return linked.reduce(
      (sum, inv) => sum + inv.quantity * (inv.currentPrice || inv.avgPrice),
      0
    );
  }

  const dematAccounts = allAccounts.filter(
    (a) => a.type === 'demat' || a.type === 'investment'
  );
  if (dematAccounts.length === 1 && dematAccounts[0].id === account.id) {
    const unassigned = investments.filter((inv) => !inv.accountId);
    if (unassigned.length > 0) {
      return unassigned.reduce(
        (sum, inv) => sum + inv.quantity * (inv.currentPrice || inv.avgPrice),
        0
      );
    }
  }

  return account.investedAmount ?? 0;
}

/**
 * Calculates complete system money summary without double counting
 */
export function calculateMoneySummary(
  accounts: Account[],
  applications: IPOApplication[],
  allocations: Allocation[] = [],
  investments: Investment[] = []
): MoneySummary {
  const byAccountType: Record<AccountType, number> = {
    bank: 0,
    cash: 0,
    demat: 0,
    wallet: 0,
    investment: 0,
    other: 0,
  };

  const byAccount: Record<string, { total: number; available: number; blocked: number }> = {};

  let totalLiquid = 0;
  let totalBlocked = 0;

  for (const acc of accounts) {
    const blocked = getAccountIPOBlockedAmount(acc.id, applications);
    const available = getAccountAvailableBalance(acc, applications, allocations);
    
    byAccount[acc.id] = {
      total: acc.balance,
      available,
      blocked,
    };

    byAccountType[acc.type] = (byAccountType[acc.type] || 0) + acc.balance;

    totalLiquid += acc.balance;
    if (acc.type !== 'demat' && acc.type !== 'investment') {
      totalBlocked += blocked;
    }
  }

  // Invested Money includes manual investment holdings value + unlinked demat investedAmount
  let investedMoney = investments.reduce(
    (sum, inv) => sum + inv.quantity * (inv.currentPrice || inv.avgPrice),
    0
  );
  const dematAccounts = accounts.filter(
    (acc) => acc.type === 'demat' || acc.type === 'investment'
  );
  for (const demat of dematAccounts) {
    const hasLinkedHoldings = investments.some((inv) => inv.accountId === demat.id);
    if (!hasLinkedHoldings && (dematAccounts.length > 1 || investments.length === 0)) {
      investedMoney += demat.investedAmount ?? 0;
    }
  }
  investedMoney = Math.round(investedMoney * 100) / 100;

  const totalTrackedMoney = Math.round((totalLiquid + investedMoney) * 100) / 100;
  const availableMoney = Math.max(0, Math.round((totalLiquid - totalBlocked) * 100) / 100);

  return {
    totalTrackedMoney,
    availableMoney,
    blockedMoney: Math.round(totalBlocked * 100) / 100,
    investedMoney,
    byAccountType,
    byAccount,
  };
}

/**
 * Calculates IPO application cost based on lot size, price and lot count
 */
export function calculateIPOAmount(
  price: number,
  lotSize: number,
  lots: number
): number {
  if (price <= 0 || lotSize <= 0 || lots <= 0) return 0;
  return Math.round(price * lotSize * lots * 100) / 100;
}

/**
 * Computes allotment settlement amounts for an application
 */
export function calculateAllotmentSettlement(
  appliedAmount: number,
  applicationPrice: number,
  lotSize: number,
  lotsAllotted: number
): {
  allottedAmount: number;
  releasedAmount: number;
  isFull: boolean;
  isPartial: boolean;
  isZero: boolean;
} {
  const allottedAmount = Math.min(appliedAmount, Math.round(applicationPrice * lotSize * lotsAllotted * 100) / 100);
  const releasedAmount = Math.max(0, Math.round((appliedAmount - allottedAmount) * 100) / 100);

  return {
    allottedAmount,
    releasedAmount,
    isFull: releasedAmount === 0 && allottedAmount === appliedAmount && allottedAmount > 0,
    isPartial: allottedAmount > 0 && releasedAmount > 0,
    isZero: allottedAmount === 0,
  };
}
