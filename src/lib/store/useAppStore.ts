'use client';

import { create } from 'zustand';
import {
  Account,
  Transaction,
  Allocation,
  IPOApplication,
  Investment,
  Snapshot,
  Reminder,
  IPO,
  ApplicationStatus,
  TimelineEvent,
  AccountType,
} from '../types/finance';
import {
  calculateAccountBalance,
  calculateIPOAmount,
  calculateAllotmentSettlement,
  calculateMoneySummary,
  getAccountAvailableBalance,
} from '../finance/ledger';
import { PUBLIC_INDIAN_IPOS, defaultIPOProvider } from '../ipo/provider';

const STORAGE_KEY = 'ipo_money_handler_v1';

// Clean empty starter data for fresh installations
const DEFAULT_ACCOUNTS: Account[] = [];
const DEFAULT_TRANSACTIONS: Transaction[] = [];
const DEFAULT_APPLICATIONS: IPOApplication[] = [];
const DEFAULT_INVESTMENTS: Investment[] = [];

export interface AppState {
  isHydrated: boolean;
  accounts: Account[];
  transactions: Transaction[];
  allocations: Allocation[];
  applications: IPOApplication[];
  investments: Investment[];
  snapshots: Snapshot[];
  reminders: Reminder[];
  liveIPOs: IPO[];
  lastIPORefresh: string;
  isIPORefreshing: boolean;
  ipoProviderSource: string;

  // App settings & navigation
  themeMode: 'light' | 'dark';
  pin: string | null;
  isLocked: boolean;
  autoLockDuration: number; // in minutes (0 = immediately, -1 = never)
  lastActivityTime: number;
  hasCompletedOnboarding: boolean;
  activeTab: 'home' | 'accounts' | 'ipos' | 'transactions' | 'more';
  activeIpoSubTab: 'LIVE' | 'MY_APPLICATIONS';
  activeAccountFilter: 'ALL' | 'BANK' | 'DEMAT' | 'CASH';
  searchQuery: string;

  // UI state
  quickActionOpen: boolean;
  quickActionType: 'menu' | 'add_money' | 'remove_money' | 'transfer' | 'add_account' | 'add_investment';
  quickActionAccountId: string | null;
  selectedAccountDetailId: string | null;
  selectedIPODetailId: string | null;
  selectedAppDetailId: string | null;

  // Actions
  init: () => void;
  saveToStorage: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  setActiveTab: (tab: 'home' | 'accounts' | 'ipos' | 'transactions' | 'more') => void;
  setActiveIpoSubTab: (tab: 'LIVE' | 'MY_APPLICATIONS') => void;
  setActiveAccountFilter: (filter: 'ALL' | 'BANK' | 'DEMAT' | 'CASH') => void;
  setSearchQuery: (query: string) => void;
  setQuickActionOpen: (
    open: boolean,
    action?: 'menu' | 'add_money' | 'remove_money' | 'transfer' | 'add_account' | 'add_investment',
    accountId?: string | null
  ) => void;
  setSelectedAccountDetailId: (id: string | null) => void;
  setSelectedIPODetailId: (id: string | null) => void;
  setSelectedAppDetailId: (id: string | null) => void;

  // Account operations
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balance'> & { initialBalance: number }) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addMoney: (accountId: string, amount: number, description: string, date?: string) => void;
  removeMoney: (accountId: string, amount: number, description: string, date?: string) => boolean;
  transferMoney: (fromAccountId: string, toAccountId: string, amount: number, description: string, date?: string) => boolean;

  // Allocation operations
  setAccountAllocations: (accountId: string, allocationsList: Array<{ category: any; label: string; amount: number }>) => void;

  // IPO Application operations
  applyForIPO: (params: {
    ipoId: string;
    companyName: string;
    symbol: string;
    accountId: string;
    dematAccountId?: string;
    lotsApplied: number;
    applicationPrice: number;
    lotSize: number;
    customTotalAmount?: number;
    notes?: string;
  }) => { success: boolean; error?: string; application?: IPOApplication };
  updateApplicationStatus: (
    applicationId: string,
    newStatus: ApplicationStatus,
    lotsAllotted?: number,
    note?: string
  ) => void;
  updateApplicationDematAccount: (applicationId: string, dematAccountId: string) => void;
  deleteApplication: (applicationId: string) => void;

  // Investments
  addInvestment: (inv: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInvestment: (id: string, updates: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;

  // Snapshots & Reminders
  createSnapshot: (title?: string, notes?: string) => Snapshot;
  deleteSnapshot: (id: string) => void;
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'isCompleted'>) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;

  // IPO Data
  fetchLiveIPOs: (forceRefresh?: boolean) => Promise<void>;

  // Security & App Lock
  setPin: (newPin: string | null) => void;
  unlockWithPin: (enteredPin: string) => boolean;
  lockApp: () => void;
  setAutoLockDuration: (minutes: number) => void;
  recordUserActivity: () => void;
  completeOnboarding: () => void;

  // Backup / Reset
  exportDataJSON: () => string;
  exportTransactionsCSV: () => string;
  importDataJSON: (jsonString: string) => { success: boolean; error?: string };
  resetAllData: () => void;
}

export function applyThemeToDOM(mode: 'light' | 'dark') {
  if (typeof window === 'undefined') return;
  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  isHydrated: false,
  themeMode: 'light',
  accounts: DEFAULT_ACCOUNTS,
  transactions: DEFAULT_TRANSACTIONS,
  allocations: [],
  applications: DEFAULT_APPLICATIONS,
  investments: DEFAULT_INVESTMENTS,
  snapshots: [],
  reminders: [],
  liveIPOs: PUBLIC_INDIAN_IPOS,
  lastIPORefresh: new Date().toISOString(),
  isIPORefreshing: false,
  ipoProviderSource: 'NSE / BSE Public Filings',

  pin: null,
  isLocked: false,
  autoLockDuration: -1, // Never by default
  lastActivityTime: Date.now(),
  hasCompletedOnboarding: true,
  activeTab: 'home',
  activeIpoSubTab: 'LIVE',
  activeAccountFilter: 'ALL',
  searchQuery: '',

  quickActionOpen: false,
  quickActionType: 'menu',
  quickActionAccountId: null,
  selectedAccountDetailId: null,
  selectedIPODetailId: null,
  selectedAppDetailId: null,

  init: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const theme = parsed.themeMode === 'dark' ? 'dark' : 'light';
        applyThemeToDOM(theme);
        set({
          themeMode: theme,
          accounts: parsed.accounts || [],
          transactions: parsed.transactions || [],
          allocations: parsed.allocations || [],
          applications: parsed.applications || [],
          investments: parsed.investments || [],
          snapshots: parsed.snapshots || [],
          reminders: parsed.reminders || [],
          liveIPOs: parsed.liveIPOs && parsed.liveIPOs.length > 0 ? parsed.liveIPOs : PUBLIC_INDIAN_IPOS,
          lastIPORefresh: parsed.lastIPORefresh || new Date().toISOString(),
          pin: parsed.pin || null,
          isLocked: !!parsed.pin, // Lock if PIN exists on fresh boot
          autoLockDuration: parsed.autoLockDuration ?? -1,
          hasCompletedOnboarding: true,
          isHydrated: true,
        });
      } else {
        applyThemeToDOM('light');
        set({ isHydrated: true });
      }
    } catch (e) {
      console.error('Failed to load local storage:', e);
      applyThemeToDOM('light');
      set({ isHydrated: true });
    }
  },

  setThemeMode: (themeMode) => {
    applyThemeToDOM(themeMode);
    set({ themeMode });
    get().saveToStorage();
  },

  saveToStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const state = get();
      const payload = {
        themeMode: state.themeMode,
        accounts: state.accounts,
        transactions: state.transactions,
        allocations: state.allocations,
        applications: state.applications,
        investments: state.investments,
        snapshots: state.snapshots,
        reminders: state.reminders,
        liveIPOs: state.liveIPOs,
        lastIPORefresh: state.lastIPORefresh,
        pin: state.pin,
        autoLockDuration: state.autoLockDuration,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  },

  setActiveTab: (activeTab) => {
    set({
      activeTab,
      selectedAccountDetailId: null,
      selectedIPODetailId: null,
      selectedAppDetailId: null,
      quickActionOpen: false,
    });
  },

  setActiveIpoSubTab: (activeIpoSubTab) => set({ activeIpoSubTab }),
  setActiveAccountFilter: (activeAccountFilter) => set({ activeAccountFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setQuickActionOpen: (quickActionOpen, action = 'menu', accountId = null) => {
    set({
      quickActionOpen,
      quickActionType: action,
      quickActionAccountId: accountId,
    });
  },
  setSelectedAccountDetailId: (selectedAccountDetailId) => set({ selectedAccountDetailId }),
  setSelectedIPODetailId: (selectedIPODetailId) => set({ selectedIPODetailId }),
  setSelectedAppDetailId: (selectedAppDetailId) => set({ selectedAppDetailId }),

  addAccount: (accountData) => {
    const id = `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();
    const newAccount: Account = {
      ...accountData,
      id,
      balance: accountData.initialBalance,
      currency: 'INR',
      createdAt: now,
      updatedAt: now,
    };

    const initialTx: Transaction = {
      id: `tx-${Date.now()}`,
      accountId: id,
      type: 'MONEY_ADDED',
      amount: accountData.initialBalance,
      description: `Initial balance for ${accountData.name}`,
      date: now,
      createdAt: now,
    };

    set((state) => ({
      accounts: [...state.accounts, newAccount],
      transactions: [initialTx, ...state.transactions],
    }));

    get().saveToStorage();
    return newAccount;
  },

  updateAccount: (id, updates) => {
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      ),
    }));
    get().saveToStorage();
  },

  deleteAccount: (id) => {
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
      transactions: state.transactions.filter((t) => t.accountId !== id && t.relatedAccountId !== id),
      allocations: state.allocations.filter((al) => al.accountId !== id),
      applications: state.applications.filter((ap) => ap.accountId !== id),
    }));
    get().saveToStorage();
  },

  addMoney: (accountId, amount, description, date) => {
    if (amount <= 0) return;
    const now = date || new Date().toISOString();
    const tx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      accountId,
      type: 'MONEY_ADDED',
      amount,
      description: description || 'Money added to account',
      date: now,
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const updatedAccounts = state.accounts.map((acc) => {
        if (acc.id === accountId) {
          const newBal = acc.balance + amount;
          return { ...acc, balance: newBal, updatedAt: new Date().toISOString() };
        }
        return acc;
      });
      return {
        accounts: updatedAccounts,
        transactions: [tx, ...state.transactions],
      };
    });

    get().saveToStorage();
  },

  removeMoney: (accountId, amount, description, date) => {
    if (amount <= 0) return false;
    const state = get();
    const account = state.accounts.find((a) => a.id === accountId);
    if (!account) return false;

    const available = getAccountAvailableBalance(account, state.applications, state.allocations);
    if (amount > available) {
      return false;
    }

    const now = date || new Date().toISOString();
    const tx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      accountId,
      type: 'MONEY_REMOVED',
      amount,
      description: description || 'Money removed/withdrawn',
      date: now,
      createdAt: new Date().toISOString(),
    };

    set((s) => ({
      accounts: s.accounts.map((a) =>
        a.id === accountId ? { ...a, balance: Math.max(0, a.balance - amount), updatedAt: new Date().toISOString() } : a
      ),
      transactions: [tx, ...s.transactions],
    }));

    get().saveToStorage();
    return true;
  },

  transferMoney: (fromAccountId, toAccountId, amount, description, date) => {
    if (amount <= 0 || fromAccountId === toAccountId) return false;
    const state = get();
    const fromAcc = state.accounts.find((a) => a.id === fromAccountId);
    const toAcc = state.accounts.find((a) => a.id === toAccountId);
    if (!fromAcc || !toAcc) return false;

    const available = getAccountAvailableBalance(fromAcc, state.applications, state.allocations);
    if (amount > available) {
      return false;
    }

    const now = date || new Date().toISOString();
    const txOut: Transaction = {
      id: `tx-${Date.now()}-out`,
      accountId: fromAccountId,
      relatedAccountId: toAccountId,
      type: 'TRANSFER_OUT',
      amount,
      description: description || `Transfer to ${toAcc.name}`,
      date: now,
      createdAt: new Date().toISOString(),
    };

    const txIn: Transaction = {
      id: `tx-${Date.now()}-in`,
      accountId: toAccountId,
      relatedAccountId: fromAccountId,
      type: 'TRANSFER_IN',
      amount,
      description: description || `Transfer from ${fromAcc.name}`,
      date: now,
      createdAt: new Date().toISOString(),
    };

    set((s) => ({
      accounts: s.accounts.map((a) => {
        if (a.id === fromAccountId) return { ...a, balance: a.balance - amount, updatedAt: new Date().toISOString() };
        if (a.id === toAccountId) return { ...a, balance: a.balance + amount, updatedAt: new Date().toISOString() };
        return a;
      }),
      transactions: [txOut, txIn, ...s.transactions],
    }));

    get().saveToStorage();
    return true;
  },

  setAccountAllocations: (accountId, allocationsList) => {
    const now = new Date().toISOString();
    const newAllocations: Allocation[] = allocationsList.map((item, idx) => ({
      id: `alloc-${accountId}-${idx}-${Date.now()}`,
      accountId,
      category: item.category,
      label: item.label,
      amount: item.amount,
      type: 'GENERAL',
      createdAt: now,
      updatedAt: now,
    }));

    set((state) => ({
      allocations: [
        ...state.allocations.filter((a) => a.accountId !== accountId || a.type === 'IPO_BLOCKED'),
        ...newAllocations,
      ],
    }));

    get().saveToStorage();
  },

  applyForIPO: ({ ipoId, companyName, symbol, accountId, dematAccountId, lotsApplied, applicationPrice, lotSize, customTotalAmount, notes }) => {
    const state = get();
    const account = state.accounts.find((a) => a.id === accountId);
    if (!account) return { success: false, error: 'Please select a valid bank account.' };

    if (account.type === 'demat' || account.type === 'investment') {
      return {
        success: false,
        error: 'IPO funds cannot be debited directly from a Demat account. Please select a Bank account for the UPI Mandate/ASBA block. Demat accounts only receive equity shares upon allotment.',
      };
    }

    if (lotsApplied <= 0) return { success: false, error: 'Lots applied must be at least 1.' };
    if (applicationPrice <= 0 && (!customTotalAmount || customTotalAmount <= 0)) {
      return { success: false, error: 'Valid price or application amount is required.' };
    }

    const calculated = calculateIPOAmount(applicationPrice, lotSize, lotsApplied);
    const totalAmount = customTotalAmount && customTotalAmount > 0 ? customTotalAmount : calculated;
    const available = getAccountAvailableBalance(account, state.applications, state.allocations);

    if (totalAmount > available) {
      return {
        success: false,
        error: `Insufficient available funds in ${account.name}. Needed: ₹${totalAmount.toLocaleString('en-IN')}, Available: ₹${available.toLocaleString('en-IN')}.`,
      };
    }

    const appId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();

    const timeline: TimelineEvent[] = [
      {
        title: 'Application Created',
        timestamp: now,
        note: `Applied for ${lotsApplied} lot(s) (${lotsApplied * lotSize} shares) @ ₹${applicationPrice}`,
        status: 'completed',
      },
      {
        title: 'Funds Marked as Blocked',
        timestamp: now,
        note: `₹${totalAmount.toLocaleString('en-IN')} marked as blocked in ${account.name} (Tracking only)`,
        status: 'completed',
      },
      {
        title: 'Allotment Pending',
        timestamp: now,
        note: 'Awaiting allotment results from registrar',
        status: 'current',
      },
      {
        title: 'Final Settlement',
        timestamp: '',
        note: 'Shares credited to Demat or funds released',
        status: 'upcoming',
      },
    ];

    const application: IPOApplication = {
      id: appId,
      ipoId,
      companyName,
      symbol,
      accountId,
      dematAccountId,
      lotsApplied,
      lotsAllotted: 0,
      applicationPrice,
      applicationAmount: totalAmount,
      blockedAmount: totalAmount,
      allottedAmount: 0,
      releasedAmount: 0,
      status: 'FUNDS_BLOCKED',
      notes: notes || `UPI Mandate on ${account.name}`,
      timeline,
      appliedAt: now,
      updatedAt: now,
    };

    // Create tracking transaction
    const tx: Transaction = {
      id: `tx-ipo-${appId}`,
      accountId,
      relatedIPOApplicationId: appId,
      type: 'IPO_ALLOCATION_BLOCKED',
      amount: totalAmount,
      description: `${companyName} IPO Application (${lotsApplied} Lots)`,
      date: now,
      createdAt: now,
    };

    set((s) => ({
      applications: [application, ...s.applications],
      transactions: [tx, ...s.transactions],
    }));

    get().saveToStorage();
    return { success: true, application };
  },

  updateApplicationStatus: (applicationId, newStatus, lotsAllotted = 0, note) => {
    const state = get();
    const app = state.applications.find((a) => a.id === applicationId);
    if (!app) return;

    const account = state.accounts.find((a) => a.id === app.accountId);
    const now = new Date().toISOString();
    const ipo = state.liveIPOs.find((i) => i.id === app.ipoId) || { lotSize: 1 };
    const lotSize = ipo.lotSize || 1;

    let updatedBlocked = 0;
    let updatedAllottedAmount = 0;
    let updatedReleasedAmount = 0;
    const newTransactions: Transaction[] = [];

    // Calculate Settlement
    if (newStatus === 'FULLY_ALLOTTED') {
      const settlement = calculateAllotmentSettlement(app.applicationAmount, app.applicationPrice, lotSize, app.lotsApplied);
      updatedAllottedAmount = settlement.allottedAmount;
      updatedReleasedAmount = settlement.releasedAmount;
      updatedBlocked = 0;

      // Actual bank balance debited for allotted amount:
      if (account) {
        newTransactions.push({
          id: `tx-allot-${app.id}-${Date.now()}`,
          accountId: account.id,
          relatedIPOApplicationId: app.id,
          type: 'IPO_ALLOTMENT_INVESTED',
          amount: updatedAllottedAmount,
          description: `${app.companyName} IPO Allotment Debited (${app.lotsApplied} Lots)`,
          date: now,
          createdAt: now,
        });
      }
    } else if (newStatus === 'PARTIALLY_ALLOTTED') {
      const settlement = calculateAllotmentSettlement(app.applicationAmount, app.applicationPrice, lotSize, lotsAllotted);
      updatedAllottedAmount = settlement.allottedAmount;
      updatedReleasedAmount = settlement.releasedAmount;
      updatedBlocked = 0;

      if (account) {
        // Debit the used amount
        newTransactions.push({
          id: `tx-allot-part-${app.id}-${Date.now()}`,
          accountId: account.id,
          relatedIPOApplicationId: app.id,
          type: 'IPO_ALLOTMENT_INVESTED',
          amount: updatedAllottedAmount,
          description: `${app.companyName} Partial Allotment Debited (${lotsAllotted}/${app.lotsApplied} Lots)`,
          date: now,
          createdAt: now,
        });

        // Audit release record
        newTransactions.push({
          id: `tx-release-part-${app.id}-${Date.now()}`,
          accountId: account.id,
          relatedIPOApplicationId: app.id,
          type: 'IPO_RELEASED',
          amount: updatedReleasedAmount,
          description: `${app.companyName} Unused Funds Released`,
          date: now,
          createdAt: now,
        });
      }
    } else if (newStatus === 'NOT_ALLOTTED' || newStatus === 'CANCELLED') {
      updatedAllottedAmount = 0;
      updatedReleasedAmount = app.applicationAmount;
      updatedBlocked = 0;

      if (account) {
        newTransactions.push({
          id: `tx-release-${app.id}-${Date.now()}`,
          accountId: account.id,
          relatedIPOApplicationId: app.id,
          type: 'IPO_RELEASED',
          amount: updatedReleasedAmount,
          description: `${app.companyName} IPO Funds Unblocked (${newStatus === 'CANCELLED' ? 'Cancelled' : 'Not Allotted'})`,
          date: now,
          createdAt: now,
        });
      }
    } else {
      // Ongoing active state (e.g. MANDATE_ACCEPTED, ALLOTMENT_PENDING)
      updatedBlocked = app.applicationAmount;
    }

    // Update timeline
    const updatedTimeline = [...app.timeline];
    updatedTimeline.push({
      title: `Status: ${newStatus.replace(/_/g, ' ')}`,
      timestamp: now,
      note: note || (newStatus === 'FULLY_ALLOTTED' ? `Allotted ${app.lotsApplied} lots` : newStatus === 'PARTIALLY_ALLOTTED' ? `Allotted ${lotsAllotted} of ${app.lotsApplied} lots. Released ₹${updatedReleasedAmount.toLocaleString('en-IN')}` : newStatus === 'NOT_ALLOTTED' ? 'No lots allotted. Blocked funds released' : undefined),
      status: 'completed',
    });

    set((s) => {
      // Update account balance if allotment occurred
      const updatedAccounts = s.accounts.map((acc) => {
        if (acc.id === app.accountId && updatedAllottedAmount > 0) {
          return { ...acc, balance: acc.balance - updatedAllottedAmount, updatedAt: now };
        }
        return acc;
      });

      const updatedApps = s.applications.map((a) => {
        if (a.id === applicationId) {
          return {
            ...a,
            status: newStatus,
            lotsAllotted: newStatus === 'FULLY_ALLOTTED' ? a.lotsApplied : lotsAllotted,
            allottedAmount: updatedAllottedAmount,
            releasedAmount: updatedReleasedAmount,
            blockedAmount: updatedBlocked,
            timeline: updatedTimeline,
            updatedAt: now,
          };
        }
        return a;
      });

      return {
        accounts: updatedAccounts,
        applications: updatedApps,
        transactions: [...newTransactions, ...s.transactions],
      };
    });

    get().saveToStorage();
  },

  updateApplicationDematAccount: (applicationId, dematAccountId) => {
    const now = new Date().toISOString();
    set((state) => {
      const targetDemat = state.accounts.find((a) => a.id === dematAccountId);
      const dematName = targetDemat?.name || 'Selected Demat';

      return {
        applications: state.applications.map((app) => {
          if (app.id === applicationId) {
            const updatedTimeline = [...app.timeline];
            updatedTimeline.push({
              title: 'Demat Account Changed',
              timestamp: now,
              note: `Beneficiary Demat updated to ${dematName}`,
              status: 'completed',
            });

            return {
              ...app,
              dematAccountId,
              timeline: updatedTimeline,
              updatedAt: now,
            };
          }
          return app;
        }),
      };
    });
    get().saveToStorage();
  },

  deleteApplication: (applicationId) => {
    set((state) => ({
      applications: state.applications.filter((a) => a.id !== applicationId),
      transactions: state.transactions.filter((t) => t.relatedIPOApplicationId !== applicationId),
    }));
    get().saveToStorage();
  },

  addInvestment: (invData) => {
    const id = `inv-${Date.now()}`;
    const now = new Date().toISOString();
    const inv: Investment = {
      ...invData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({ investments: [inv, ...s.investments] }));
    get().saveToStorage();
  },

  updateInvestment: (id, updates) => {
    set((s) => ({
      investments: s.investments.map((i) =>
        i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
      ),
    }));
    get().saveToStorage();
  },

  deleteInvestment: (id) => {
    set((s) => ({ investments: s.investments.filter((i) => i.id !== id) }));
    get().saveToStorage();
  },

  createSnapshot: (title, notes) => {
    const state = get();
    const summary = calculateMoneySummary(state.accounts, state.applications, state.allocations, state.investments);
    const now = new Date().toISOString();
    const snapshot: Snapshot = {
      id: `snap-${Date.now()}`,
      title: title || `Snapshot ${new Date().toLocaleDateString('en-IN')}`,
      date: now,
      totalMoney: summary.totalTrackedMoney,
      availableMoney: summary.availableMoney,
      blockedMoney: summary.blockedMoney,
      investedMoney: summary.investedMoney,
      breakdown: { ...summary.byAccountType },
      notes: notes || '',
      createdAt: now,
    };

    set((s) => ({ snapshots: [snapshot, ...s.snapshots] }));
    get().saveToStorage();
    return snapshot;
  },

  deleteSnapshot: (id) => {
    set((s) => ({ snapshots: s.snapshots.filter((snap) => snap.id !== id) }));
    get().saveToStorage();
  },

  addReminder: (reminderData) => {
    const id = `rem-${Date.now()}`;
    const rem: Reminder = {
      ...reminderData,
      id,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ reminders: [rem, ...s.reminders] }));
    get().saveToStorage();
  },

  toggleReminder: (id) => {
    set((s) => ({
      reminders: s.reminders.map((r) => (r.id === id ? { ...r, isCompleted: !r.isCompleted } : r)),
    }));
    get().saveToStorage();
  },

  deleteReminder: (id) => {
    set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) }));
    get().saveToStorage();
  },

  fetchLiveIPOs: async (forceRefresh = false) => {
    set({ isIPORefreshing: true });
    try {
      const { ipos: fetchedIPOs, lastUpdated, source } = await defaultIPOProvider.refreshIPOData();
      if (fetchedIPOs && Array.isArray(fetchedIPOs) && fetchedIPOs.length > 0) {
        set((state) => {
          // Auto-heal and cross-verify existing applications against live verified IPO data
          const updatedApps = state.applications.map((app) => {
            const matched = fetchedIPOs.find(
              (i) => i.id === app.ipoId || i.symbol.toUpperCase() === (app.symbol || '').toUpperCase()
            );
            if (!matched) return app;

            // Check if lot size or company name was corrected in live market feed
            const updatedCompanyName = matched.companyName || app.companyName;
            return {
              ...app,
              companyName: updatedCompanyName,
              symbol: matched.symbol || app.symbol,
            };
          });

          return {
            liveIPOs: fetchedIPOs,
            applications: updatedApps,
            lastIPORefresh: lastUpdated || new Date().toISOString(),
            ipoProviderSource: source || 'Verified Exchange Feed',
          };
        });
      }
    } catch (e) {
      console.error('Failed to fetch live IPO data:', e);
    } finally {
      set({ isIPORefreshing: false });
      get().saveToStorage();
    }
  },

  setPin: (pin) => {
    set({ pin, isLocked: false });
    get().saveToStorage();
  },

  unlockWithPin: (enteredPin) => {
    const state = get();
    if (state.pin === enteredPin) {
      set({ isLocked: false, lastActivityTime: Date.now() });
      return true;
    }
    return false;
  },

  lockApp: () => {
    const state = get();
    if (state.pin) {
      set({ isLocked: true });
    }
  },

  setAutoLockDuration: (autoLockDuration) => {
    set({ autoLockDuration });
    get().saveToStorage();
  },

  recordUserActivity: () => {
    const state = get();
    if (!state.pin || state.autoLockDuration <= 0 || state.isLocked) return;
    const now = Date.now();
    if (now - state.lastActivityTime > state.autoLockDuration * 60 * 1000) {
      set({ isLocked: true });
    } else if (now - state.lastActivityTime > 30000) {
      set({ lastActivityTime: now });
    }
  },

  completeOnboarding: () => {
    set({ hasCompletedOnboarding: true });
    get().saveToStorage();
  },

  exportDataJSON: () => {
    const state = get();
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      accounts: state.accounts,
      transactions: state.transactions,
      allocations: state.allocations,
      applications: state.applications,
      investments: state.investments,
      snapshots: state.snapshots,
      reminders: state.reminders,
    };
    return JSON.stringify(backup, null, 2);
  },

  exportTransactionsCSV: () => {
    const { transactions, accounts } = get();
    const headers = ['ID', 'Date', 'Account', 'Type', 'Amount', 'Description', 'Related Account', 'Related IPO Application'];
    
    const rows = transactions.map((t) => {
      const acc = accounts.find((a) => a.id === t.accountId);
      const relAcc = accounts.find((a) => a.id === t.relatedAccountId);
      return [
        t.id,
        t.date,
        acc ? `"${acc.name.replace(/"/g, '""')}"` : t.accountId,
        t.type,
        t.amount,
        `"${t.description.replace(/"/g, '""')}"`,
        relAcc ? `"${relAcc.name.replace(/"/g, '""')}"` : (t.relatedAccountId || ''),
        t.relatedIPOApplicationId || '',
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  importDataJSON: (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed.accounts) || !Array.isArray(parsed.transactions)) {
        return { success: false, error: 'Invalid backup file format: missing accounts or transactions.' };
      }

      set({
        accounts: parsed.accounts,
        transactions: parsed.transactions,
        allocations: parsed.allocations || [],
        applications: parsed.applications || [],
        investments: parsed.investments || [],
        snapshots: parsed.snapshots || [],
        reminders: parsed.reminders || [],
      });

      get().saveToStorage();
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Malformed JSON in backup file.' };
    }
  },

  resetAllData: () => {
    set({
      accounts: DEFAULT_ACCOUNTS,
      transactions: DEFAULT_TRANSACTIONS,
      allocations: [],
      applications: DEFAULT_APPLICATIONS,
      investments: DEFAULT_INVESTMENTS,
      snapshots: [],
      reminders: [],
      pin: null,
      isLocked: false,
    });
    get().saveToStorage();
  },
}));
