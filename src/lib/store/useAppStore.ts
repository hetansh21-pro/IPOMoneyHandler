'use client';

import { create } from 'zustand';
import {
  Account,
  Transaction,
  TransactionType,
  Allocation,
  IPOApplication,
  Investment,
  Snapshot,
  Reminder,
  IPO,
  ApplicationStatus,
  TimelineEvent,
  AccountType,
  ParsedSmsTransaction,
  AutoSyncNotification,
  FamilyMember,
} from '../types/finance';
import { parseBankSms } from '../finance/smsParser';
import {
  calculateAccountBalance,
  calculateIPOAmount,
  calculateAllotmentSettlement,
  calculateMoneySummary,
  getAccountAvailableBalance,
} from '../finance/ledger';
import { PUBLIC_INDIAN_IPOS, defaultIPOProvider } from '../ipo/provider';
import { fetchMultipleLiveStockQuotes } from '../market/priceFetcher';
import { executeRegisteredBackHandlers } from '../navigation/backNavigation';
import { hashPinSync, verifyPinSync, sanitizeImportPayload } from '../utils/formatters';

const STORAGE_KEY = 'ipo_money_handler_v1';

// Clean starter family members
export const DEFAULT_FAMILY_MEMBERS: FamilyMember[] = [
  { id: 'self', name: 'Me (Primary)', relation: 'Self', isDefault: true, avatarColor: '#0284c7', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'fam_dad', name: 'Dad', relation: 'Father', avatarColor: '#059669', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'fam_mom', name: 'Mom', relation: 'Mother', avatarColor: '#db2777', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'fam_bro', name: 'Brother', relation: 'Brother', avatarColor: '#7c3aed', createdAt: '2026-01-01T00:00:00.000Z' },
];

// Clean empty starter data for fresh installations
const DEFAULT_ACCOUNTS: Account[] = [];
const DEFAULT_TRANSACTIONS: Transaction[] = [];
const DEFAULT_APPLICATIONS: IPOApplication[] = [];
const DEFAULT_INVESTMENTS: Investment[] = [];

export interface AppState {
  isHydrated: boolean;
  familyMembers: FamilyMember[];
  activeMemberId: string | 'all';
  isFamilyModalOpen: boolean;
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
  themeMode: 'system' | 'light' | 'dark';
  isPrivacyMode: boolean;
  pin: string | null;
  isLocked: boolean;
  autoLockDuration: number; // in minutes (0 = immediately, -1 = never)
  lastActivityTime: number;
  hasCompletedOnboarding: boolean;
  activeTab: 'home' | 'accounts' | 'ipos' | 'transactions' | 'holdings' | 'more';
  tabHistory: ('home' | 'accounts' | 'ipos' | 'transactions' | 'holdings' | 'more')[];
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
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
  togglePrivacyMode: () => void;
  setActiveTab: (tab: 'home' | 'accounts' | 'ipos' | 'transactions' | 'holdings' | 'more') => void;
  setActiveIpoSubTab: (tab: 'LIVE' | 'MY_APPLICATIONS') => void;
  setActiveAccountFilter: (filter: 'ALL' | 'BANK' | 'DEMAT' | 'CASH') => void;
  setSearchQuery: (query: string) => void;
  handleBackAction: () => boolean;
  setQuickActionOpen: (
    open: boolean,
    action?: 'menu' | 'add_money' | 'remove_money' | 'transfer' | 'add_account' | 'add_investment',
    accountId?: string | null
  ) => void;
  setSelectedAccountDetailId: (id: string | null) => void;
  setSelectedIPODetailId: (id: string | null) => void;
  setSelectedAppDetailId: (id: string | null) => void;

  // Family Profile operations
  setActiveMemberId: (id: string | 'all') => void;
  addFamilyMember: (member: Omit<FamilyMember, 'id' | 'createdAt'>) => FamilyMember;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;
  deleteFamilyMember: (id: string) => void;
  setIsFamilyModalOpen: (open: boolean) => void;

  // Account operations
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balance'> & { initialBalance: number }) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  reorderAccounts: (accounts: Account[]) => void;
  addMoney: (accountId: string, amount: number, description: string, date?: string) => void;
  removeMoney: (accountId: string, amount: number, description: string, date?: string) => boolean;
  transferMoney: (fromAccountId: string, toAccountId: string, amount: number, description: string, date?: string) => boolean;
  deleteTransaction: (id: string) => void;

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
    memberId?: string;
  }) => { success: boolean; error?: string; application?: IPOApplication };
  updateApplicationStatus: (
    applicationId: string,
    newStatus: ApplicationStatus,
    lotsAllotted?: number,
    note?: string
  ) => void;
  updateApplicationDematAccount: (applicationId: string, dematAccountId: string) => void;
  deleteApplication: (applicationId: string) => void;

  // Investments & Live Market P&L
  isRefreshingPrices: boolean;
  lastPricesRefreshTime: string | null;
  addInvestment: (inv: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addMultipleInvestments: (invs: Array<Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  updateInvestment: (id: string, updates: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  sellInvestment: (params: {
    investmentId: string;
    quantityToSell: number;
    sellingPrice: number;
    creditedAccountId: string;
    notes?: string;
    date?: string;
  }) => { success: boolean; error?: string; proceeds?: number };
  refreshHoldingsPrices: () => Promise<{ success: boolean; updatedCount: number }>;

  // SMS Sync & Automatic Real-Time Engine
  isAutoSmsSyncEnabled: boolean;
  processedSmsFingerprints: string[];
  dismissedSmsFingerprints: string[];
  pendingScannedSms: ParsedSmsTransaction[];
  isSmsReviewPopupOpen: boolean;
  lastSmsScanTimestamp: number;
  lastAutoSyncedItem: AutoSyncNotification | null;
  dismissAutoSyncNotification: () => void;
  toggleAutoSmsSync: (enabled?: boolean) => void;
  openSmsReviewPopup: () => void;
  closeSmsReviewPopup: () => void;
  addPendingScannedSms: (items: ParsedSmsTransaction[] | ParsedSmsTransaction) => { addedCount: number };
  updatePendingScannedItem: (id: string, updates: Partial<ParsedSmsTransaction>) => void;
  removePendingScannedItem: (id: string) => void;
  clearAllPendingScannedItems: () => void;
  confirmPendingScannedItems: (ids?: string[]) => { confirmedCount: number };
  checkAndFetchNewSmsOnOpen: () => Promise<void>;
  autoProcessIncomingSms: (sms: {
    address: string;
    body: string;
    date?: number;
    source?: string;
    packageName?: string;
  }) => {
    processed: boolean;
    duplicate: boolean;
    message?: string;
    transaction?: Transaction;
  };
  syncSmsTransactions: (parsedItems: ParsedSmsTransaction[]) => { importedCount: number };

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

  // Backup / Reset & History Management
  exportDataJSON: () => string;
  exportTransactionsCSV: () => string;
  importDataJSON: (jsonString: string) => { success: boolean; error?: string };
  clearTransactionHistory: (preserveBalances?: boolean) => void;
  clearIPOApplicationHistory: () => void;
  clearAllHistory: () => void;
  resetAllData: () => void;
}

export function applyThemeToDOM(mode: 'system' | 'light' | 'dark') {
  if (typeof window === 'undefined') return;
  try {
    let resolvedDark = false;
    if (mode === 'dark') {
      resolvedDark = true;
    } else if (mode === 'light') {
      resolvedDark = false;
    } else {
      // 'system': accurately detect OS / Android system dark theme
      resolvedDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    if (resolvedDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }

    // Sync Capacitor native status bar asynchronously without blocking UI
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        import('@capacitor/core').then(async ({ Capacitor }) => {
          if (Capacitor.isNativePlatform()) {
            try {
              const { StatusBar, Style } = await import('@capacitor/status-bar');
              await StatusBar.setStyle({ style: resolvedDark ? Style.Dark : Style.Light });
              await StatusBar.setOverlaysWebView({ overlay: true });
            } catch {}
          }
        }).catch(() => {});
      }
    }, 40);
  } catch (e) {
    console.error('Error applying theme to DOM:', e);
  }
}

const getInitialThemeMode = (): 'system' | 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem('ipo_money_handler_v1');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && (parsed.themeMode === 'dark' || parsed.themeMode === 'light' || parsed.themeMode === 'system')) {
        return parsed.themeMode;
      }
    }
  } catch {}
  return 'system';
};

// Session helpers to prevent hydration glitch when refreshing non-home tabs
const getInitialSessionTab = (): AppState['activeTab'] => {
  if (typeof window === 'undefined') return 'home';
  try {
    const isExistingSession = sessionStorage.getItem('ipo_active_session') === '1';
    if (isExistingSession) {
      const saved = sessionStorage.getItem('ipo_session_tab') as AppState['activeTab'];
      const validTabs: AppState['activeTab'][] = ['home', 'accounts', 'ipos', 'transactions', 'holdings', 'more'];
      if (saved && validTabs.includes(saved)) {
        return saved;
      }
    }
  } catch {}
  return 'home';
};

const getInitialSessionIpoSubTab = (): 'LIVE' | 'MY_APPLICATIONS' => {
  if (typeof window === 'undefined') return 'LIVE';
  try {
    const isExistingSession = sessionStorage.getItem('ipo_active_session') === '1';
    if (isExistingSession) {
      const saved = sessionStorage.getItem('ipo_session_iposubtab') as 'LIVE' | 'MY_APPLICATIONS';
      if (saved === 'LIVE' || saved === 'MY_APPLICATIONS') {
        return saved;
      }
    }
  } catch {}
  return 'LIVE';
};

const getInitialSessionAccFilter = (): 'ALL' | 'BANK' | 'DEMAT' | 'CASH' => {
  if (typeof window === 'undefined') return 'ALL';
  try {
    const isExistingSession = sessionStorage.getItem('ipo_active_session') === '1';
    if (isExistingSession) {
      const saved = sessionStorage.getItem('ipo_session_accfilter') as 'ALL' | 'BANK' | 'DEMAT' | 'CASH';
      if (saved === 'ALL' || saved === 'BANK' || saved === 'DEMAT' || saved === 'CASH') {
        return saved;
      }
    }
  } catch {}
  return 'ALL';
};

export const useAppStore = create<AppState>((set, get) => ({
  isHydrated: false,
  themeMode: getInitialThemeMode(),
  isPrivacyMode: false,
  familyMembers: DEFAULT_FAMILY_MEMBERS,
  activeMemberId: 'all',
  isFamilyModalOpen: false,
  accounts: DEFAULT_ACCOUNTS,
  transactions: DEFAULT_TRANSACTIONS,
  allocations: [],
  applications: DEFAULT_APPLICATIONS,
  investments: DEFAULT_INVESTMENTS,
  snapshots: [],
  reminders: [],
  liveIPOs: PUBLIC_INDIAN_IPOS,
  lastIPORefresh: '2026-09-20T00:00:00.000Z',
  isIPORefreshing: false,
  ipoProviderSource: 'NSE / BSE Public Filings',

  isRefreshingPrices: false,
  lastPricesRefreshTime: null,

  pin: null,
  isLocked: false,
  autoLockDuration: -1, // Never by default
  lastActivityTime: 0,
  hasCompletedOnboarding: true,
  activeTab: 'home',
  tabHistory: [],
  activeIpoSubTab: 'LIVE',
  activeAccountFilter: 'ALL',
  searchQuery: '',

  isAutoSmsSyncEnabled: true,
  processedSmsFingerprints: [],
  dismissedSmsFingerprints: [],
  pendingScannedSms: [],
  isSmsReviewPopupOpen: false,
  lastSmsScanTimestamp: 0,
  lastAutoSyncedItem: null,

  quickActionOpen: false,
  quickActionType: 'menu',
  quickActionAccountId: null,
  selectedAccountDetailId: null,
  selectedIPODetailId: null,
  selectedAppDetailId: null,

  init: () => {
    if (typeof window === 'undefined') return;
    if (get().isHydrated) return;
    try {
      // Determine initial tab: If this is an existing session reload/refresh, restore current tab
      const initialTab = getInitialSessionTab();
      const initialIpoSubTab = getInitialSessionIpoSubTab();
      const initialAccountFilter = getInitialSessionAccFilter();

      try {
        const isExistingSession = sessionStorage.getItem('ipo_active_session') === '1';
        if (!isExistingSession) {
          // Cold start / fresh app open -> Mark session active and default to 'home'
          sessionStorage.setItem('ipo_active_session', '1');
          sessionStorage.setItem('ipo_session_tab', 'home');
          sessionStorage.setItem('ipo_session_iposubtab', 'LIVE');
          sessionStorage.setItem('ipo_session_accfilter', 'ALL');
        }
      } catch {}

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const theme: 'system' | 'light' | 'dark' = (parsed.themeMode === 'dark' || parsed.themeMode === 'light' || parsed.themeMode === 'system') ? parsed.themeMode : 'system';
        applyThemeToDOM(theme);
        set({
          themeMode: theme,
          familyMembers: parsed.familyMembers && parsed.familyMembers.length > 0 ? parsed.familyMembers : DEFAULT_FAMILY_MEMBERS,
          activeMemberId: parsed.activeMemberId || 'all',
          accounts: parsed.accounts || [],
          transactions: (parsed.transactions || []).filter(
            (t: Transaction) => t.amount > 0 || !t.description?.startsWith('Initial balance')
          ),
          allocations: parsed.allocations || [],
          applications: parsed.applications || [],
          investments: parsed.investments || [],
          snapshots: parsed.snapshots || [],
          reminders: parsed.reminders || [],
          liveIPOs: PUBLIC_INDIAN_IPOS,
          lastIPORefresh: new Date().toISOString(),
          lastPricesRefreshTime: parsed.lastPricesRefreshTime || null,
          pin: parsed.pin || null,
          isLocked: !!parsed.pin, // Lock if PIN exists on fresh boot
          autoLockDuration: parsed.autoLockDuration ?? -1,
          hasCompletedOnboarding: true,
          isAutoSmsSyncEnabled: parsed.isAutoSmsSyncEnabled !== false,
          processedSmsFingerprints: parsed.processedSmsFingerprints || [],
          dismissedSmsFingerprints: parsed.dismissedSmsFingerprints || [],
          pendingScannedSms: parsed.pendingScannedSms || [],
          isSmsReviewPopupOpen: (parsed.pendingScannedSms && parsed.pendingScannedSms.length > 0) || false,
          lastSmsScanTimestamp: parsed.lastSmsScanTimestamp || 0,
          lastAutoSyncedItem: null,
          activeTab: initialTab,
          tabHistory: [],
          activeIpoSubTab: initialIpoSubTab,
          activeAccountFilter: initialAccountFilter,
          isHydrated: true,
        });

        // Setup dynamic system theme preference listener
        if (typeof window !== 'undefined' && window.matchMedia) {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleSysThemeChange = () => {
            if (get().themeMode === 'system') {
              applyThemeToDOM('system');
            }
          };
          mediaQuery.removeEventListener?.('change', handleSysThemeChange);
          mediaQuery.addEventListener?.('change', handleSysThemeChange);
        }

        // Trigger background live IPO and price refresh on load
        setTimeout(() => {
          get().fetchLiveIPOs().catch(() => {});
        }, 500);

        if (parsed.investments && parsed.investments.length > 0) {
          setTimeout(() => {
            get().refreshHoldingsPrices().catch(() => {});
          }, 1000);
        }
      } else {
        applyThemeToDOM('system');
        set({
          themeMode: 'system',
          activeTab: initialTab,
          activeIpoSubTab: initialIpoSubTab,
          activeAccountFilter: initialAccountFilter,
          isHydrated: true,
        });
      }
    } catch (e) {
      console.error('Failed to load local storage:', e);
      applyThemeToDOM('system');
      set({ isHydrated: true });
    }
  },

  setThemeMode: (themeMode) => {
    applyThemeToDOM(themeMode);
    set({ themeMode });
    get().saveToStorage();
  },

  togglePrivacyMode: () => {
    set((s) => ({ isPrivacyMode: !s.isPrivacyMode }));
  },

  setActiveMemberId: (activeMemberId) => {
    set({ activeMemberId });
    get().saveToStorage();
  },

  addFamilyMember: (member) => {
    const newMember: FamilyMember = {
      ...member,
      id: `fam_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      familyMembers: [...s.familyMembers, newMember],
    }));
    get().saveToStorage();
    return newMember;
  },

  updateFamilyMember: (id, updates) => {
    set((s) => ({
      familyMembers: s.familyMembers.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
    get().saveToStorage();
  },

  deleteFamilyMember: (id) => {
    if (id === 'self') return; // Cannot delete self
    set((s) => {
      const nextMembers = s.familyMembers.filter((m) => m.id !== id);
      const nextActive = s.activeMemberId === id ? 'all' : s.activeMemberId;
      const nextAccounts = s.accounts.map((a) => (a.memberId === id ? { ...a, memberId: 'self' } : a));
      const nextApps = s.applications.map((app) => (app.memberId === id ? { ...app, memberId: 'self' } : app));
      const nextInvs = s.investments.map((inv) => (inv.memberId === id ? { ...inv, memberId: 'self' } : inv));
      return {
        familyMembers: nextMembers,
        activeMemberId: nextActive,
        accounts: nextAccounts,
        applications: nextApps,
        investments: nextInvs,
      };
    });
    get().saveToStorage();
  },

  setIsFamilyModalOpen: (isFamilyModalOpen) => {
    set({ isFamilyModalOpen });
  },

  saveToStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const state = get();
      const payload = {
        themeMode: state.themeMode,
        familyMembers: state.familyMembers,
        activeMemberId: state.activeMemberId,
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
        isAutoSmsSyncEnabled: state.isAutoSmsSyncEnabled,
        processedSmsFingerprints: (state.processedSmsFingerprints || []).slice(0, 500),
        dismissedSmsFingerprints: (state.dismissedSmsFingerprints || []).slice(0, 1000),
        pendingScannedSms: state.pendingScannedSms || [],
        lastSmsScanTimestamp: state.lastSmsScanTimestamp || 0,
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  },

  setActiveTab: (activeTab) => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('ipo_session_tab', activeTab);
      } catch {}
    }
    set({
      activeTab,
      selectedAccountDetailId: null,
      selectedIPODetailId: null,
      selectedAppDetailId: null,
      quickActionOpen: false,
      tabHistory: [],
    });
    get().saveToStorage();
  },

  handleBackAction: () => {
    // 1. Check registered high-priority UI handlers (modals, sheets, dialogs)
    if (executeRegisteredBackHandlers()) {
      return true;
    }

    const state = get();

    // 2. Check quick action modal
    if (state.quickActionOpen) {
      set({ quickActionOpen: false });
      return true;
    }

    // 3. Check selected detail views
    if (state.selectedAccountDetailId) {
      set({ selectedAccountDetailId: null });
      return true;
    }
    if (state.selectedIPODetailId) {
      set({ selectedIPODetailId: null });
      return true;
    }
    if (state.selectedAppDetailId) {
      set({ selectedAppDetailId: null });
      return true;
    }

    // 4. Check active search query
    if (state.searchQuery) {
      set({ searchQuery: '' });
      return true;
    }

    // 5. If on any tab other than 'home', go DIRECTLY to 'home'
    if (state.activeTab !== 'home') {
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('ipo_session_tab', 'home');
        } catch {}
      }
      set({ activeTab: 'home', tabHistory: [] });
      return true;
    }

    // Root home screen with no overlays -> allow exit confirmation dialog to show
    return false;
  },

  setActiveIpoSubTab: (activeIpoSubTab) => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('ipo_session_iposubtab', activeIpoSubTab);
      } catch {}
    }
    set({ activeIpoSubTab });
    get().saveToStorage();
  },
  setActiveAccountFilter: (activeAccountFilter) => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('ipo_session_accfilter', activeAccountFilter);
      } catch {}
    }
    set({ activeAccountFilter });
    get().saveToStorage();
  },
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

    const initialTx: Transaction | null =
      accountData.initialBalance > 0
        ? {
            id: `tx-${Date.now()}`,
            accountId: id,
            type: 'MONEY_ADDED',
            amount: accountData.initialBalance,
            description: `Initial balance for ${accountData.name}`,
            date: now,
            createdAt: now,
          }
        : null;

    set((state) => ({
      accounts: [...state.accounts, newAccount],
      transactions: initialTx ? [initialTx, ...state.transactions] : state.transactions,
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

  reorderAccounts: (reorderedAccounts) => {
    set({ accounts: reorderedAccounts });
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

  deleteTransaction: (id) => {
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    get().saveToStorage();
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

  applyForIPO: ({ ipoId, companyName, symbol, accountId, dematAccountId, lotsApplied, applicationPrice, lotSize, customTotalAmount, notes, memberId }) => {
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
    const assignedMemberId = memberId || (state.activeMemberId === 'all' ? (account.memberId || 'self') : state.activeMemberId);

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
      memberId: assignedMemberId,
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
      memberId: assignedMemberId,
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

      // Auto-create or update Demat Investment holding on allotment
      let updatedInvestments = [...s.investments];
      const allottedLots = newStatus === 'FULLY_ALLOTTED' ? app.lotsApplied : lotsAllotted;
      const totalAllottedShares = allottedLots * lotSize;

      if ((newStatus === 'FULLY_ALLOTTED' || newStatus === 'PARTIALLY_ALLOTTED') && totalAllottedShares > 0) {
        const existingInvIndex = updatedInvestments.findIndex(
          (inv) => inv.ipoApplicationId === app.id || (inv.symbol && inv.symbol.toUpperCase() === (app.symbol || '').toUpperCase())
        );

        if (existingInvIndex >= 0) {
          const existing = updatedInvestments[existingInvIndex];
          updatedInvestments[existingInvIndex] = {
            ...existing,
            quantity: totalAllottedShares,
            avgPrice: app.applicationPrice,
            isIpoAllotted: true,
            ipoApplicationId: app.id,
            updatedAt: now,
          };
        } else {
          const newInv: Investment = {
            id: `inv-ipo-${app.id}`,
            accountId: app.dematAccountId,
            name: app.companyName,
            symbol: (app.symbol || app.companyName).toUpperCase().trim(),
            quantity: totalAllottedShares,
            avgPrice: app.applicationPrice,
            currentPrice: app.applicationPrice,
            isIpoAllotted: true,
            ipoApplicationId: app.id,
            createdAt: now,
            updatedAt: now,
          };
          updatedInvestments = [newInv, ...updatedInvestments];
        }
      }

      return {
        accounts: updatedAccounts,
        applications: updatedApps,
        transactions: [...newTransactions, ...s.transactions],
        investments: updatedInvestments,
      };
    });

    get().saveToStorage();

    // Trigger price fetch for newly allotted investment in the background
    if (newStatus === 'FULLY_ALLOTTED' || newStatus === 'PARTIALLY_ALLOTTED') {
      setTimeout(() => {
        get().refreshHoldingsPrices().catch(() => {});
      }, 500);
    }
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
    // Auto-fetch price for newly added stock
    setTimeout(() => {
      get().refreshHoldingsPrices().catch(() => {});
    }, 500);
  },

  addMultipleInvestments: (invsData) => {
    if (!invsData || invsData.length === 0) return;
    const now = new Date().toISOString();
    const newItems: Investment[] = invsData.map((data, index) => ({
      ...data,
      id: `inv-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    }));
    set((s) => ({ investments: [...newItems, ...s.investments] }));
    get().saveToStorage();
    // Auto-refresh prices for all imported holdings
    setTimeout(() => {
      get().refreshHoldingsPrices().catch(() => {});
    }, 600);
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

  sellInvestment: ({ investmentId, quantityToSell, sellingPrice, creditedAccountId, notes, date }) => {
    const state = get();
    const inv = state.investments.find((i) => i.id === investmentId);
    if (!inv) return { success: false, error: 'Stock holding not found.' };

    const targetAccount = state.accounts.find((a) => a.id === creditedAccountId);
    if (!targetAccount) return { success: false, error: 'Please select an account to receive the sale proceeds.' };

    if (quantityToSell <= 0 || quantityToSell > inv.quantity) {
      return { success: false, error: `Invalid quantity. You currently own ${inv.quantity} shares.` };
    }

    if (sellingPrice <= 0) {
      return { success: false, error: 'Selling price must be greater than ₹0.' };
    }

    const proceeds = Math.round(quantityToSell * sellingPrice * 100) / 100;
    const pnl = Math.round((sellingPrice - inv.avgPrice) * quantityToSell * 100) / 100;
    const pnlSign = pnl >= 0 ? `+₹${pnl.toLocaleString('en-IN')}` : `-₹${Math.abs(pnl).toLocaleString('en-IN')}`;
    const now = date || new Date().toISOString();

    const tx: Transaction = {
      id: `tx-sale-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      accountId: creditedAccountId,
      type: 'INVESTMENT_SALE',
      amount: proceeds,
      description: `Sold ${quantityToSell} shares of ${inv.symbol} @ ₹${sellingPrice.toLocaleString('en-IN')} (${pnlSign})`,
      date: now,
      createdAt: now,
    };

    set((s) => {
      // 1. Credit target account balance with proceeds
      const updatedAccounts = s.accounts.map((acc) => {
        if (acc.id === creditedAccountId) {
          return {
            ...acc,
            balance: acc.balance + proceeds,
            updatedAt: now,
          };
        }
        return acc;
      });

      // 2. Update or remove holding
      let updatedInvestments: Investment[];
      if (quantityToSell >= inv.quantity) {
        updatedInvestments = s.investments.filter((i) => i.id !== investmentId);
      } else {
        updatedInvestments = s.investments.map((i) => {
          if (i.id === investmentId) {
            return {
              ...i,
              quantity: i.quantity - quantityToSell,
              updatedAt: now,
            };
          }
          return i;
        });
      }

      return {
        accounts: updatedAccounts,
        investments: updatedInvestments,
        transactions: [tx, ...s.transactions],
      };
    });

    get().saveToStorage();
    return { success: true, proceeds };
  },

  refreshHoldingsPrices: async () => {
    const state = get();
    if (!state.investments || state.investments.length === 0) {
      return { success: true, updatedCount: 0 };
    }

    set({ isRefreshingPrices: true });
    try {
      const symbols = state.investments.map((inv) => inv.symbol);
      const quotes = await fetchMultipleLiveStockQuotes(symbols);
      const updatedKeys = Object.keys(quotes);

      if (updatedKeys.length > 0) {
        const now = new Date().toISOString();
        set((s) => ({
          investments: s.investments.map((inv) => {
            const sym = inv.symbol.toUpperCase().trim();
            const cleanSym = sym.replace(/\.NS$|\.BO$/, '');
            const quote =
              quotes[sym] ||
              quotes[cleanSym] ||
              Object.values(quotes).find(
                (q) =>
                  q.symbol.toUpperCase() === sym ||
                  q.symbol.toUpperCase() === cleanSym ||
                  (inv.name && q.name && q.name.toUpperCase().includes(inv.name.toUpperCase()))
              );

            if (!quote || quote.price <= 0) return inv;

            return {
              ...inv,
              currentPrice: quote.price,
              dayChange: quote.change,
              dayChangePercent: quote.changePercent,
              lastPriceUpdatedAt: quote.lastUpdated || now,
              updatedAt: now,
            };
          }),
          lastPricesRefreshTime: now,
        }));
        get().saveToStorage();
      }
      return { success: true, updatedCount: updatedKeys.length };
    } catch (e) {
      console.error('Failed to refresh live stock prices:', e);
      return { success: false, updatedCount: 0 };
    } finally {
      set({ isRefreshingPrices: false });
    }
  },

  syncSmsTransactions: (parsedItems) => {
    const state = get();
    const now = new Date().toISOString();
    let importedCount = 0;
    const newTransactions: Transaction[] = [];
    const updatedAccounts = [...state.accounts];
    let updatedApplications = [...state.applications];

    for (const item of parsedItems) {
      const targetAccId = item.suggestedAccountId;
      if (!targetAccId) continue;
      const accountIndex = updatedAccounts.findIndex((a) => a.id === targetAccId);
      if (accountIndex === -1) continue;

      const account = updatedAccounts[accountIndex];
      const txId = `tx-sms-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      if (item.type === 'DEBIT') {
        newTransactions.push({
          id: txId,
          accountId: account.id,
          type: 'EXPENSE',
          amount: item.amount,
          description: item.merchantOrSender ? `Debit: ${item.merchantOrSender}` : (item.sender || 'Bank Debit SMS'),
          date: item.date || now,
          createdAt: now,
        });
        updatedAccounts[accountIndex] = {
          ...account,
          balance: account.balance - item.amount,
          updatedAt: now,
        };
        importedCount++;
      } else if (item.type === 'CREDIT') {
        newTransactions.push({
          id: txId,
          accountId: account.id,
          type: 'INCOME',
          amount: item.amount,
          description: item.merchantOrSender ? `Credit: ${item.merchantOrSender}` : (item.sender || 'Bank Credit SMS'),
          date: item.date || now,
          createdAt: now,
        });
        updatedAccounts[accountIndex] = {
          ...account,
          balance: account.balance + item.amount,
          updatedAt: now,
        };
        importedCount++;
      } else if (item.type === 'IPO_BLOCKED') {
        const extractedName = (item.ipoName || item.merchantOrSender || '').toUpperCase();
        const matchedIPO = state.liveIPOs.find((ipo) => {
          const compName = ipo.companyName.toUpperCase();
          const sym = ipo.symbol.toUpperCase();
          if (extractedName && (compName.includes(extractedName) || extractedName.includes(compName) || extractedName.includes(sym))) {
            return true;
          }
          const words = compName.split(/\s+/).filter(w => w.length >= 4 && !['LIMITED', 'LTD', 'INDIA', 'TECHNOLOGIES'].includes(w));
          return words.some(w => item.rawText.toUpperCase().includes(w));
        });

        const finalCompanyName = matchedIPO ? matchedIPO.companyName : (item.ipoName || 'IPO Application');
        const finalSymbol = matchedIPO ? matchedIPO.symbol : (item.ipoName ? item.ipoName.split(' ')[0] : 'IPO');
        const ipoId = matchedIPO ? matchedIPO.id : `ipo-auto-${Date.now()}`;
        const lotSize = matchedIPO?.lotSize || 1;
        const price = matchedIPO?.priceHigh || (item.amount / lotSize);
        const lots = Math.max(1, Math.round(item.amount / (price * lotSize)));

        newTransactions.push({
          id: txId,
          accountId: account.id,
          type: 'IPO_ALLOCATION_BLOCKED',
          amount: item.amount,
          description: `IPO Mandate Blocked: ${finalCompanyName}`,
          date: item.date || now,
          createdAt: now,
        });

        const existingAppIdx = updatedApplications.findIndex(
          (app) => (app.ipoId === ipoId || app.companyName.toUpperCase() === finalCompanyName.toUpperCase()) && app.accountId === account.id
        );

        if (existingAppIdx >= 0) {
          const ex = updatedApplications[existingAppIdx];
          updatedApplications[existingAppIdx] = {
            ...ex,
            status: 'FUNDS_BLOCKED',
            blockedAmount: item.amount,
            applicationAmount: item.amount,
            lotsApplied: lots,
            updatedAt: now,
          };
        } else {
          const defaultDemat = state.accounts.find((a) => a.type === 'demat' || a.type === 'investment');
          const newApp: IPOApplication = {
            id: `app-sms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            ipoId,
            companyName: finalCompanyName,
            symbol: finalSymbol,
            accountId: account.id,
            dematAccountId: defaultDemat?.id,
            status: 'FUNDS_BLOCKED',
            lotsApplied: lots,
            lotsAllotted: 0,
            applicationPrice: price,
            applicationAmount: item.amount,
            blockedAmount: item.amount,
            allottedAmount: 0,
            releasedAmount: 0,
            timeline: [
              {
                title: 'Mandate Created & Blocked',
                timestamp: now,
                note: `Amount ₹${item.amount} blocked via Bank SMS`,
                status: 'completed',
              },
            ],
            appliedAt: now,
            updatedAt: now,
            notes: `Synced from Mandate SMS: ${item.rawText.slice(0, 80)}`,
          };
          updatedApplications = [newApp, ...updatedApplications];
        }
        importedCount++;
      } else if (item.type === 'IPO_RELEASED') {
        const extractedName = (item.ipoName || item.merchantOrSender || '').toUpperCase();
        newTransactions.push({
          id: txId,
          accountId: account.id,
          type: 'IPO_RELEASED',
          amount: item.amount,
          description: `IPO Mandate Released: ${item.ipoName || item.merchantOrSender || 'ASBA/UPI'}`,
          date: item.date || now,
          createdAt: now,
        });

        const activeAppIdx = updatedApplications.findIndex(
          (app) => {
            if (app.accountId !== account.id) return false;
            if (['NOT_ALLOTTED', 'CANCELLED', 'FULLY_ALLOTTED'].includes(app.status)) return false;
            const comp = app.companyName.toUpperCase();
            if (extractedName && (comp.includes(extractedName) || extractedName.includes(comp))) return true;
            return Math.abs(app.blockedAmount - item.amount) < 1;
          }
        );
        if (activeAppIdx >= 0) {
          const app = updatedApplications[activeAppIdx];
          updatedApplications[activeAppIdx] = {
            ...app,
            status: 'NOT_ALLOTTED',
            blockedAmount: 0,
            updatedAt: now,
          };
        }
        importedCount++;
      }
    }

    if (importedCount > 0) {
      set({
        accounts: updatedAccounts,
        applications: updatedApplications,
        transactions: [...newTransactions, ...state.transactions],
      });
      get().saveToStorage();
    }

    return { importedCount };
  },

  dismissAutoSyncNotification: () => {
    set({ lastAutoSyncedItem: null });
  },

  toggleAutoSmsSync: (enabled) => {
    set((s) => ({
      isAutoSmsSyncEnabled: enabled !== undefined ? enabled : !s.isAutoSmsSyncEnabled,
    }));
    get().saveToStorage();
  },

  openSmsReviewPopup: () => {
    set({ isSmsReviewPopupOpen: true });
  },

  closeSmsReviewPopup: () => {
    set({ isSmsReviewPopupOpen: false });
  },

  addPendingScannedSms: (incoming) => {
    const state = get();
    const list = Array.isArray(incoming) ? incoming : [incoming];
    if (list.length === 0) return { addedCount: 0 };

    let existingPending = [...(state.pendingScannedSms || [])];
    const processedFps = new Set(state.processedSmsFingerprints || []);
    const dismissedFps = new Set(state.dismissedSmsFingerprints || []);
    const newlyAdded: ParsedSmsTransaction[] = [];

    for (const item of list) {
      if (!item || item.amount <= 0) continue;

      // 1. Generate fingerprint from Ref number or Amount+Type+Account+TimeBucket
      const refMatch = item.rawText.match(/(?:ref(?:\s+no)?|rrn|utr|txn(?:\s+id)?|upi\s+ref|urn)\s*[:#-]?\s*([A-Za-z0-9]{6,25})/i);
      const refNo = (item.mandateRef || (refMatch ? refMatch[1] : '')).toUpperCase();
      const itemTime = new Date(item.date).getTime() || Date.now();
      const timeBucket = Math.floor(itemTime / (5 * 60 * 1000)); // 5-minute bucket
      const amountStr = item.amount.toFixed(2);
      const typeStr = item.type;
      const accIdentifier = item.accountNumber || (item.bankName ? item.bankName.slice(0, 8).toUpperCase() : (item.sender ? item.sender.slice(-6).toUpperCase() : 'ACC'));

      const fp = refNo
        ? `REF:${refNo}:${amountStr}:${typeStr}`
        : `FP:${typeStr}:${amountStr}:${accIdentifier}:${timeBucket}`;

      // Skip if already processed in ledger OR dismissed previously by user (never show deleted messages again)
      if (processedFps.has(fp) || dismissedFps.has(fp)) continue;

      // Check if already recorded in transactions
      const alreadyInTx = state.transactions.some((tx) => {
        if (Math.abs(tx.amount - item.amount) > 0.01) return false;
        const txTime = new Date(tx.date).getTime();
        const isClose = Math.abs(txTime - itemTime) < 5 * 60 * 1000;
        if (!isClose) return false;
        if (item.type === 'DEBIT' && tx.type === 'EXPENSE') return true;
        if (item.type === 'CREDIT' && tx.type === 'INCOME') return true;
        if (item.type === 'IPO_BLOCKED' && tx.type === 'IPO_ALLOCATION_BLOCKED') return true;
        if (item.type === 'IPO_RELEASED' && tx.type === 'IPO_RELEASED') return true;
        return false;
      });
      if (alreadyInTx) continue;

      // Check duplicate in existing pending list -> merge if found
      const dupIdxExisting = existingPending.findIndex((p) => {
        if (p.id === item.id) return true;
        if (p.rawText.trim() === item.rawText.trim()) return true;
        if (refNo && p.mandateRef && p.mandateRef.toUpperCase() === refNo) return true;
        if (Math.abs(p.amount - item.amount) < 0.01 && p.type === item.type) {
          const pTime = new Date(p.date).getTime();
          if (Math.abs(pTime - itemTime) < 5 * 60 * 1000) {
            if (
              (p.accountNumber && item.accountNumber && p.accountNumber === item.accountNumber) ||
              (p.suggestedAccountId && item.suggestedAccountId && p.suggestedAccountId === item.suggestedAccountId) ||
              (p.bankName && item.bankName && p.bankName === item.bankName)
            ) {
              return true;
            }
          }
        }
        return false;
      });

      if (dupIdxExisting >= 0) {
        const existing = existingPending[dupIdxExisting];
        existingPending[dupIdxExisting] = {
          ...existing,
          source: existing.source !== item.source ? 'merged' : existing.source,
          bankName: existing.bankName || item.bankName,
          accountNumber: existing.accountNumber || item.accountNumber,
          ipoName: existing.ipoName || item.ipoName,
          merchantOrSender: existing.merchantOrSender || item.merchantOrSender,
          mandateRef: existing.mandateRef || item.mandateRef,
          availableBalance: existing.availableBalance ?? item.availableBalance,
          suggestedAccountId: existing.suggestedAccountId || item.suggestedAccountId,
          suggestedAccountName: existing.suggestedAccountName || item.suggestedAccountName,
        };
        continue;
      }

      // Check duplicate in newly added batch -> merge if found
      const dupIdxNew = newlyAdded.findIndex((p) => {
        if (p.id === item.id) return true;
        if (p.rawText.trim() === item.rawText.trim()) return true;
        if (refNo && p.mandateRef && p.mandateRef.toUpperCase() === refNo) return true;
        if (Math.abs(p.amount - item.amount) < 0.01 && p.type === item.type) {
          const pTime = new Date(p.date).getTime();
          if (Math.abs(pTime - itemTime) < 5 * 60 * 1000) {
            return true;
          }
        }
        return false;
      });

      if (dupIdxNew >= 0) {
        const existing = newlyAdded[dupIdxNew];
        newlyAdded[dupIdxNew] = {
          ...existing,
          source: existing.source !== item.source ? 'merged' : existing.source,
          bankName: existing.bankName || item.bankName,
          accountNumber: existing.accountNumber || item.accountNumber,
          ipoName: existing.ipoName || item.ipoName,
          merchantOrSender: existing.merchantOrSender || item.merchantOrSender,
          mandateRef: existing.mandateRef || item.mandateRef,
          availableBalance: existing.availableBalance ?? item.availableBalance,
          suggestedAccountId: existing.suggestedAccountId || item.suggestedAccountId,
          suggestedAccountName: existing.suggestedAccountName || item.suggestedAccountName,
        };
        continue;
      }

      // Match bank account if not yet set
      let targetAccId = item.suggestedAccountId;
      let targetAccName = item.suggestedAccountName;
      if (!targetAccId && state.accounts.length > 0) {
        // Match by account number suffix
        if (item.accountNumber) {
          const cleanNum = item.accountNumber.replace(/\D/g, '');
          const matched = state.accounts.find(
            (a) => (a.accountNumber && a.accountNumber.replace(/\D/g, '').endsWith(cleanNum)) ||
                   (a.notes && a.notes.replace(/\D/g, '').endsWith(cleanNum)) ||
                   a.name.replace(/\D/g, '').endsWith(cleanNum)
          );
          if (matched) {
            targetAccId = matched.id;
            targetAccName = matched.name;
          }
        }
        // Match by Bank Name keywords
        if (!targetAccId && item.bankName) {
          const bUpper = item.bankName.toUpperCase();
          const matched = state.accounts.find(
            (a) => a.name.toUpperCase().includes(bUpper) || (a.notes && a.notes.toUpperCase().includes(bUpper))
          );
          if (matched) {
            targetAccId = matched.id;
            targetAccName = matched.name;
          }
        }
        // Fallback
        if (!targetAccId) {
          const firstBank = state.accounts.find((a) => a.type === 'bank' || a.type === 'wallet') || state.accounts[0];
          if (firstBank) {
            targetAccId = firstBank.id;
            targetAccName = firstBank.name;
          }
        }
      }

      const uniqueItem: ParsedSmsTransaction = {
        ...item,
        id: item.id || `scanned_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        suggestedAccountId: targetAccId,
        suggestedAccountName: targetAccName,
        selected: true,
      };

      newlyAdded.push(uniqueItem);
    }

    if (newlyAdded.length > 0 || existingPending.length !== (state.pendingScannedSms || []).length) {
      const updatedPending = [...newlyAdded, ...existingPending];
      set({
        pendingScannedSms: updatedPending,
        isSmsReviewPopupOpen: true,
      });
      get().saveToStorage();

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 60, 40]);
        } catch {}
      }
    }

    return { addedCount: newlyAdded.length };
  },

  updatePendingScannedItem: (id, updates) => {
    set((s) => ({
      pendingScannedSms: s.pendingScannedSms.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
    get().saveToStorage();
  },

  removePendingScannedItem: (id) => {
    const itemToRemove = get().pendingScannedSms.find((item) => item.id === id);
    const newDismissedFps = [...(get().dismissedSmsFingerprints || [])];
    const newProcessedFps = [...(get().processedSmsFingerprints || [])];
    if (itemToRemove) {
      const refMatch = itemToRemove.rawText.match(/(?:ref(?:\s+no)?|rrn|utr|txn(?:\s+id)?|upi\s+ref|urn)\s*[:#-]?\s*([A-Za-z0-9]{6,25})/i);
      const refNo = (itemToRemove.mandateRef || (refMatch ? refMatch[1] : '')).toUpperCase();
      const itemTime = new Date(itemToRemove.date).getTime() || Date.now();
      const timeBucket = Math.floor(itemTime / (5 * 60 * 1000));
      const fp = refNo
        ? `REF:${refNo}:${itemToRemove.amount.toFixed(2)}:${itemToRemove.type}`
        : `FP:${itemToRemove.type}:${itemToRemove.amount.toFixed(2)}:${itemToRemove.accountNumber || (itemToRemove.bankName ? itemToRemove.bankName.slice(0, 8).toUpperCase() : 'ACC')}:${timeBucket}`;
      
      if (!newDismissedFps.includes(fp)) newDismissedFps.push(fp);
      if (!newProcessedFps.includes(fp)) newProcessedFps.push(fp);
    }

    set((s) => {
      const remaining = s.pendingScannedSms.filter((item) => item.id !== id);
      return {
        pendingScannedSms: remaining,
        isSmsReviewPopupOpen: remaining.length > 0 && s.isSmsReviewPopupOpen,
        dismissedSmsFingerprints: newDismissedFps.slice(-1000),
        processedSmsFingerprints: newProcessedFps.slice(-500),
      };
    });
    get().saveToStorage();
  },

  clearAllPendingScannedItems: () => {
    const newDismissedFps = [...(get().dismissedSmsFingerprints || [])];
    const newProcessedFps = [...(get().processedSmsFingerprints || [])];
    for (const item of get().pendingScannedSms) {
      const refMatch = item.rawText.match(/(?:ref(?:\s+no)?|rrn|utr|txn(?:\s+id)?|upi\s+ref|urn)\s*[:#-]?\s*([A-Za-z0-9]{6,25})/i);
      const refNo = (item.mandateRef || (refMatch ? refMatch[1] : '')).toUpperCase();
      const itemTime = new Date(item.date).getTime() || Date.now();
      const timeBucket = Math.floor(itemTime / (5 * 60 * 1000));
      const fp = refNo
        ? `REF:${refNo}:${item.amount.toFixed(2)}:${item.type}`
        : `FP:${item.type}:${item.amount.toFixed(2)}:${item.accountNumber || (item.bankName ? item.bankName.slice(0, 8).toUpperCase() : 'ACC')}:${timeBucket}`;
      
      if (!newDismissedFps.includes(fp)) newDismissedFps.push(fp);
      if (!newProcessedFps.includes(fp)) newProcessedFps.push(fp);
    }

    set({
      pendingScannedSms: [],
      isSmsReviewPopupOpen: false,
      dismissedSmsFingerprints: newDismissedFps.slice(-1000),
      processedSmsFingerprints: newProcessedFps.slice(-500),
    });
    get().saveToStorage();
  },

  confirmPendingScannedItems: (idsToConfirm) => {
    const state = get();
    const pending = state.pendingScannedSms || [];
    if (pending.length === 0) return { confirmedCount: 0 };

    const targetIds = idsToConfirm && idsToConfirm.length > 0
      ? new Set(idsToConfirm)
      : new Set(pending.filter((p) => p.selected).map((p) => p.id));

    const itemsToProcess = pending.filter((p) => targetIds.has(p.id));
    if (itemsToProcess.length === 0) return { confirmedCount: 0 };

    let currentAccounts = [...state.accounts];
    let currentApplications = [...state.applications];
    let newTransactions: Transaction[] = [];
    let newFps: string[] = [...(state.processedSmsFingerprints || [])];
    let newDismissedFps: string[] = [...(state.dismissedSmsFingerprints || [])];

    for (const item of itemsToProcess) {
      let targetAcc = currentAccounts.find((a) => a.id === item.suggestedAccountId);
      if (!targetAcc) {
        targetAcc = currentAccounts.find((a) => a.type === "bank" || a.type === "wallet") || currentAccounts[0];
      }
      if (!targetAcc) continue;

      const txId = `tx-sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const nowIso = item.date || new Date().toISOString();
      let txType: TransactionType = "EXPENSE";
      let txDesc = "";
      let updatedBalance = targetAcc.balance;

      if (item.type === "DEBIT") {
        txType = "EXPENSE";
        txDesc = item.merchantOrSender ? `Debit: ${item.merchantOrSender}` : `Bank Debit (${item.sender || "SMS"})`;
        updatedBalance = targetAcc.balance - item.amount;
      } else if (item.type === "CREDIT") {
        txType = "INCOME";
        txDesc = item.merchantOrSender ? `Credit: ${item.merchantOrSender}` : `Bank Credit (${item.sender || "SMS"})`;
        updatedBalance = targetAcc.balance + item.amount;
      } else if (item.type === "IPO_BLOCKED") {
        txType = "IPO_ALLOCATION_BLOCKED";
        const extractedName = (item.ipoName || item.merchantOrSender || "").toUpperCase();
        const rawBodyUpper = item.rawText.toUpperCase();

        const matchedIPO = state.liveIPOs.find((ipo) => {
          const compName = ipo.companyName.toUpperCase();
          const sym = ipo.symbol.toUpperCase();
          if (extractedName && (compName.includes(extractedName) || extractedName.includes(compName) || extractedName.includes(sym))) {
            return true;
          }
          const words = compName.split(/\s+/).filter((w) => w.length >= 4 && !["LIMITED", "LTD", "INDIA", "TECHNOLOGIES"].includes(w));
          return words.some((w) => rawBodyUpper.includes(w));
        });

        const finalCompanyName = matchedIPO ? matchedIPO.companyName : (item.ipoName || "IPO Application");
        const finalSymbol = matchedIPO ? matchedIPO.symbol : (item.ipoName ? item.ipoName.split(" ")[0] : "IPO");
        const ipoId = matchedIPO ? matchedIPO.id : `ipo-auto-${Date.now()}`;
        const lotSize = matchedIPO?.lotSize || 1;
        const price = matchedIPO?.priceHigh || (item.amount / lotSize);
        const lots = Math.max(1, Math.round(item.amount / (price * lotSize)));

        txDesc = `IPO Mandate Blocked: ${finalCompanyName}`;

        const existingAppIdx = currentApplications.findIndex(
          (app) => (app.ipoId === ipoId || app.companyName.toUpperCase() === finalCompanyName.toUpperCase()) && app.accountId === targetAcc.id
        );

        if (existingAppIdx >= 0) {
          currentApplications[existingAppIdx] = {
            ...currentApplications[existingAppIdx],
            status: "FUNDS_BLOCKED",
            blockedAmount: item.amount,
            applicationAmount: item.amount,
            lotsApplied: lots,
            updatedAt: nowIso,
          };
        } else {
          const defaultDemat = currentAccounts.find((a) => a.type === "demat" || a.type === "investment");
          const newApp: IPOApplication = {
            id: `app-sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            ipoId,
            companyName: finalCompanyName,
            symbol: finalSymbol,
            accountId: targetAcc.id,
            dematAccountId: defaultDemat?.id,
            memberId: targetAcc.memberId || (state.activeMemberId !== 'all' ? state.activeMemberId : 'self'),
            status: "FUNDS_BLOCKED",
            lotsApplied: lots,
            lotsAllotted: 0,
            applicationPrice: price,
            applicationAmount: item.amount,
            blockedAmount: item.amount,
            allottedAmount: 0,
            releasedAmount: 0,
            timeline: [
              {
                title: "Mandate Confirmed & Blocked",
                timestamp: nowIso,
                note: `Amount ₹${item.amount.toLocaleString("en-IN")} blocked via SMS/Notification`,
                status: "completed",
              },
            ],
            appliedAt: nowIso,
            updatedAt: nowIso,
            notes: `Confirmed from Scanned SMS: ${item.rawText.slice(0, 80)}`,
          };
          currentApplications = [newApp, ...currentApplications];
        }
      } else if (item.type === "IPO_RELEASED") {
        txType = "IPO_RELEASED";
        const extractedName = (item.ipoName || item.merchantOrSender || "").toUpperCase();
        const rawBodyUpper = item.rawText.toUpperCase();

        const activeAppIdx = currentApplications.findIndex((app) => {
          if (app.accountId !== targetAcc.id) return false;
          if (["NOT_ALLOTTED", "CANCELLED", "FULLY_ALLOTTED"].includes(app.status)) return false;
          const compUpper = app.companyName.toUpperCase();
          if (extractedName && (compUpper.includes(extractedName) || extractedName.includes(compUpper))) return true;
          const words = compUpper.split(/\s+/).filter((w) => w.length >= 4);
          if (words.some((w) => rawBodyUpper.includes(w))) return true;
          return Math.abs(app.blockedAmount - item.amount) < 1;
        });

        if (activeAppIdx >= 0) {
          const app = currentApplications[activeAppIdx];
          txDesc = `IPO Mandate Released: ${app.companyName}`;
          currentApplications[activeAppIdx] = {
            ...app,
            status: "NOT_ALLOTTED",
            blockedAmount: 0,
            updatedAt: nowIso,
          };
        } else {
          txDesc = `IPO Mandate Released: ${item.ipoName || "ASBA/UPI"}`;
        }
      }

      // Balance update if available from SMS
      if (item.availableBalance && item.availableBalance > 0 && item.type !== "IPO_BLOCKED" && item.type !== "IPO_RELEASED") {
        updatedBalance = item.availableBalance;
      }

      currentAccounts = currentAccounts.map((a) =>
        a.id === targetAcc.id ? { ...a, balance: updatedBalance, updatedAt: nowIso } : a
      );

      newTransactions.push({
        id: txId,
        accountId: targetAcc.id,
        memberId: targetAcc.memberId || (state.activeMemberId !== 'all' ? state.activeMemberId : 'self'),
        type: txType,
        amount: item.amount,
        description: txDesc,
        date: nowIso,
        createdAt: nowIso,
      });

      // Add fingerprint
      const refMatch = item.rawText.match(/(?:ref(?:\s+no)?|rrn|utr|txn(?:\s+id)?|upi\s+ref)\s*[:#-]?\s*([A-Za-z0-9]{6,25})/i);
      const refNo = (item.mandateRef || (refMatch ? refMatch[1] : "")).toUpperCase();
      const itemTime = new Date(item.date).getTime() || Date.now();
      const timeBucket = Math.floor(itemTime / (5 * 60 * 1000));
      const fp = refNo
        ? `REF:${refNo}:${item.amount.toFixed(2)}:${item.type}`
        : `FP:${item.type}:${item.amount.toFixed(2)}:${item.accountNumber || "ACC"}:${timeBucket}`;
      newFps.push(fp);
      if (!newDismissedFps.includes(fp)) newDismissedFps.push(fp);
    }

    const remainingPending = pending.filter((p) => !targetIds.has(p.id));

    set({
      accounts: currentAccounts,
      applications: currentApplications,
      transactions: [...newTransactions, ...state.transactions],
      processedSmsFingerprints: newFps.slice(-500),
      dismissedSmsFingerprints: newDismissedFps.slice(-1000),
      pendingScannedSms: remainingPending,
      isSmsReviewPopupOpen: remainingPending.length > 0,
    });

    get().saveToStorage();

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([50, 80, 50]);
      } catch {}
    }

    return { confirmedCount: itemsToProcess.length };
  },

  checkAndFetchNewSmsOnOpen: async () => {
    const state = get();
    // Always open review popup on app startup if any unconfirmed items are waiting
    if (state.pendingScannedSms && state.pendingScannedSms.length > 0) {
      set({ isSmsReviewPopupOpen: true });
    }

    if (typeof window === "undefined" || !state.isAutoSmsSyncEnabled) return;

    try {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { fetchLiveSmsSince } = await import("@/lib/native/smsPlugin");
      const sinceTimestamp = state.lastSmsScanTimestamp || (Date.now() - 24 * 60 * 60 * 1000);
      const res = await fetchLiveSmsSince(sinceTimestamp, state.accounts);

      if (res.success && res.transactions.length > 0) {
        get().addPendingScannedSms(res.transactions);
      }
      set({ lastSmsScanTimestamp: Date.now() });
      get().saveToStorage();
    } catch (e) {
      console.warn("Auto SMS fetch on open failed:", e);
    }
  },


  autoProcessIncomingSms: ({ address, body, date, source }) => {
    const state = get();
    if (!body || !state.isAutoSmsSyncEnabled) {
      return { processed: false, duplicate: false, message: 'Auto-sync is disabled or empty message' };
    }

    const nowIso = date ? new Date(date).toISOString() : new Date().toISOString();
    const parsed = parseBankSms(body, address, nowIso, state.accounts);
    if (!parsed || parsed.amount <= 0) {
      return { processed: false, duplicate: false, message: 'Non-financial message' };
    }

    // 1. Generate unique deterministic fingerprint for deduplication
    const refMatch = body.match(/(?:ref(?:\s+no)?|rrn|utr|txn(?:\s+id)?|upi\s+ref)\s*[:#-]?\s*([A-Za-z0-9]{6,25})/i);
    const refNo = refMatch ? refMatch[1].toUpperCase() : '';

    const timeMs = date || Date.now();
    const timeBucket = Math.floor(timeMs / (3 * 60 * 1000)); // 3-minute bucket
    const amountStr = parsed.amount.toFixed(2);
    const typeStr = parsed.type;
    const accIdentifier = parsed.accountNumber || (address ? address.slice(-6).toUpperCase() : 'ACC');

    const fingerprint = refNo
      ? `REF:${refNo}:${amountStr}:${typeStr}`
      : `FP:${typeStr}:${amountStr}:${accIdentifier}:${timeBucket}`;

    // 2. Deduplication check: fingerprint list
    const existingFp = state.processedSmsFingerprints || [];
    if (existingFp.includes(fingerprint)) {
      return { processed: false, duplicate: true, message: 'Duplicate transaction ignored' };
    }

    // 3. Deduplication check: existing transactions within 4 minutes
    const isDuplicateTx = state.transactions.some((tx) => {
      if (Math.abs(tx.amount - parsed.amount) > 0.01) return false;
      const txTime = new Date(tx.date).getTime();
      const isCloseTime = Math.abs(txTime - timeMs) < 4 * 60 * 1000;
      if (!isCloseTime) return false;

      if (parsed.type === 'DEBIT' && tx.type === 'EXPENSE') return true;
      if (parsed.type === 'CREDIT' && tx.type === 'INCOME') return true;
      if (parsed.type === 'IPO_BLOCKED' && tx.type === 'IPO_ALLOCATION_BLOCKED') return true;
      if (parsed.type === 'IPO_RELEASED' && tx.type === 'IPO_RELEASED') return true;
      return false;
    });

    if (isDuplicateTx) {
      set((s) => ({
        processedSmsFingerprints: [fingerprint, ...(s.processedSmsFingerprints || []).slice(0, 500)],
      }));
      get().saveToStorage();
      return { processed: false, duplicate: true, message: 'Duplicate transaction ignored' };
    }

    // 4. Find matching bank account
    let targetAccount = state.accounts.find((a) => a.id === parsed.suggestedAccountId);
    if (!targetAccount && parsed.accountNumber) {
      targetAccount = state.accounts.find(
        (a) => a.accountNumber && a.accountNumber.replace(/\D/g, '').endsWith(parsed.accountNumber!)
      );
    }
    if (!targetAccount) {
      targetAccount = state.accounts.find((a) => a.type === 'bank' || a.type === 'wallet') || state.accounts[0];
    }

    if (!targetAccount) {
      return { processed: false, duplicate: false, message: 'No accounts available to sync' };
    }

    // 5. Process according to message type
    const txId = `tx-auto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    let txType: TransactionType = 'EXPENSE';
    let txDescription = '';
    let updatedBalance = targetAccount.balance;
    let updatedApplications = [...state.applications];

    if (parsed.type === 'DEBIT') {
      txType = 'EXPENSE';
      txDescription = parsed.merchantOrSender ? `Debit: ${parsed.merchantOrSender}` : `Bank Debit (${address || 'SMS'})`;
      updatedBalance = targetAccount.balance - parsed.amount;
    } else if (parsed.type === 'CREDIT') {
      txType = 'INCOME';
      txDescription = parsed.merchantOrSender ? `Credit: ${parsed.merchantOrSender}` : `Bank Credit (${address || 'SMS'})`;
      updatedBalance = targetAccount.balance + parsed.amount;
    } else if (parsed.type === 'IPO_BLOCKED') {
      txType = 'IPO_ALLOCATION_BLOCKED';
      
      // Match or find IPO in live list
      const extractedName = (parsed.ipoName || parsed.merchantOrSender || '').toUpperCase();
      const rawBodyUpper = body.toUpperCase();
      
      const matchedIPO = state.liveIPOs.find((ipo) => {
        const compName = ipo.companyName.toUpperCase();
        const sym = ipo.symbol.toUpperCase();
        if (extractedName && (compName.includes(extractedName) || extractedName.includes(compName) || extractedName.includes(sym))) {
          return true;
        }
        const words = compName.split(/\s+/).filter(w => w.length >= 4 && !['LIMITED', 'LTD', 'INDIA', 'TECHNOLOGIES'].includes(w));
        return words.some(w => rawBodyUpper.includes(w));
      });

      const finalCompanyName = matchedIPO ? matchedIPO.companyName : (parsed.ipoName || 'IPO Application');
      const finalSymbol = matchedIPO ? matchedIPO.symbol : (parsed.ipoName ? parsed.ipoName.split(' ')[0] : 'IPO');
      const ipoId = matchedIPO ? matchedIPO.id : `ipo-auto-${Date.now()}`;
      const lotSize = matchedIPO?.lotSize || 1;
      const price = matchedIPO?.priceHigh || (parsed.amount / lotSize);
      const lots = Math.max(1, Math.round(parsed.amount / (price * lotSize)));

      txDescription = `IPO Mandate Blocked: ${finalCompanyName}`;

      // Check if application already exists
      const existingAppIndex = updatedApplications.findIndex(
        (app) => (app.ipoId === ipoId || app.companyName.toUpperCase() === finalCompanyName.toUpperCase()) && app.accountId === targetAccount.id
      );

      if (existingAppIndex >= 0) {
        const existing = updatedApplications[existingAppIndex];
        updatedApplications[existingAppIndex] = {
          ...existing,
          status: 'FUNDS_BLOCKED',
          blockedAmount: parsed.amount,
          applicationAmount: parsed.amount,
          lotsApplied: lots,
          updatedAt: nowIso,
        };
      } else {
        const defaultDemat = state.accounts.find((a) => a.type === 'demat' || a.type === 'investment');
        const newApp: IPOApplication = {
          id: `app-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ipoId,
          companyName: finalCompanyName,
          symbol: finalSymbol,
          accountId: targetAccount.id,
          dematAccountId: defaultDemat?.id,
          status: 'FUNDS_BLOCKED',
          lotsApplied: lots,
          lotsAllotted: 0,
          applicationPrice: price,
          applicationAmount: parsed.amount,
          blockedAmount: parsed.amount,
          allottedAmount: 0,
          releasedAmount: 0,
          timeline: [
            {
              title: 'Mandate Created & Blocked',
              timestamp: nowIso,
              note: `Amount ₹${parsed.amount} blocked via Auto-Sync SMS`,
              status: 'completed',
            },
          ],
          appliedAt: nowIso,
          updatedAt: nowIso,
          notes: `Auto-applied from Mandate SMS: ${body.slice(0, 80)}`,
        };
        updatedApplications = [newApp, ...updatedApplications];
      }
    } else if (parsed.type === 'IPO_RELEASED') {
      txType = 'IPO_RELEASED';
      const extractedName = (parsed.ipoName || parsed.merchantOrSender || '').toUpperCase();
      const rawBodyUpper = body.toUpperCase();

      const activeAppIndex = updatedApplications.findIndex((app) => {
        if (app.accountId !== targetAccount.id) return false;
        if (['NOT_ALLOTTED', 'CANCELLED', 'FULLY_ALLOTTED'].includes(app.status)) return false;
        const compUpper = app.companyName.toUpperCase();
        if (extractedName && (compUpper.includes(extractedName) || extractedName.includes(compUpper))) return true;
        const words = compUpper.split(/\s+/).filter(w => w.length >= 4);
        if (words.some(w => rawBodyUpper.includes(w))) return true;
        return Math.abs(app.blockedAmount - parsed.amount) < 1;
      });

      if (activeAppIndex >= 0) {
        const app = updatedApplications[activeAppIndex];
        txDescription = `IPO Mandate Released: ${app.companyName}`;
        updatedApplications[activeAppIndex] = {
          ...app,
          status: 'NOT_ALLOTTED',
          blockedAmount: 0,
          updatedAt: nowIso,
        };
      } else {
        txDescription = `IPO Mandate Released: ${parsed.ipoName || 'ASBA/UPI'}`;
      }
    }

    // If bank provided an exact verified available balance in the SMS/alert, sync it
    if (parsed.availableBalance && parsed.availableBalance > 0 && parsed.type !== 'IPO_BLOCKED' && parsed.type !== 'IPO_RELEASED') {
      updatedBalance = parsed.availableBalance;
    }

    const newTx: Transaction = {
      id: txId,
      accountId: targetAccount.id,
      type: txType,
      amount: parsed.amount,
      description: txDescription,
      date: nowIso,
      createdAt: nowIso,
    };

    const notifItem: AutoSyncNotification = {
      id: `notif-${Date.now()}`,
      title:
        parsed.type === 'DEBIT'
          ? 'Auto-Synced: Bank Debited'
          : parsed.type === 'CREDIT'
          ? 'Auto-Synced: Bank Credited'
          : parsed.type === 'IPO_BLOCKED'
          ? 'Auto-Synced: IPO Mandate Blocked'
          : 'Auto-Synced: IPO Mandate Released',
      description: `${txDescription} • ${targetAccount.name}`,
      type: parsed.type,
      amount: parsed.amount,
      accountName: targetAccount.name,
      timestamp: nowIso,
      availableBalance: updatedBalance,
    };

    set((s) => ({
      accounts: s.accounts.map((a) =>
        a.id === targetAccount!.id ? { ...a, balance: updatedBalance, updatedAt: nowIso } : a
      ),
      applications: updatedApplications,
      transactions: [newTx, ...s.transactions],
      processedSmsFingerprints: [fingerprint, ...(s.processedSmsFingerprints || []).slice(0, 500)],
      lastAutoSyncedItem: notifItem,
    }));

    get().saveToStorage();

    // Haptic confirmation alert on device
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch {}
    }

    return { processed: true, duplicate: false, transaction: newTx };
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

  setPin: (rawPin) => {
    const hashed = rawPin ? (rawPin.startsWith('v2_') ? rawPin : hashPinSync(rawPin)) : null;
    set({ pin: hashed, isLocked: false });
    get().saveToStorage();
  },

  unlockWithPin: (enteredPin) => {
    const state = get();
    if (verifyPinSync(enteredPin, state.pin)) {
      // Auto-upgrade legacy plaintext PIN to salted hash
      const safeHash = hashPinSync(enteredPin);
      set({ pin: safeHash, isLocked: false, lastActivityTime: Date.now() });
      get().saveToStorage();
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
      const sanitization = sanitizeImportPayload(parsed);
      if (!sanitization.isValid || !sanitization.sanitized) {
        return { success: false, error: sanitization.error || 'Invalid or unsafe backup file format.' };
      }

      const safe = sanitization.sanitized;
      set({
        accounts: safe.accounts,
        transactions: safe.transactions,
        allocations: safe.allocations || [],
        applications: safe.applications || [],
        investments: safe.investments || [],
        snapshots: safe.snapshots || [],
        reminders: safe.reminders || [],
      });

      get().saveToStorage();
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Malformed JSON in backup file.' };
    }
  },

  clearTransactionHistory: (preserveBalances: boolean = true) => {
    const currentAccounts = get().accounts;
    const currentTransactions = get().transactions;

    const updatedAccounts = currentAccounts.map((acc) => {
      if (preserveBalances) {
        const computedBal = calculateAccountBalance(acc, currentTransactions);
        return { ...acc, initialBalance: computedBal };
      }
      return acc;
    });

    set({
      accounts: updatedAccounts,
      transactions: [],
    });
    get().saveToStorage();
  },

  clearIPOApplicationHistory: () => {
    set({
      applications: [],
      allocations: [],
    });
    get().saveToStorage();
  },

  clearAllHistory: () => {
    const currentAccounts = get().accounts;
    const currentTransactions = get().transactions;

    const updatedAccounts = currentAccounts.map((acc) => {
      const computedBal = calculateAccountBalance(acc, currentTransactions);
      return { ...acc, initialBalance: computedBal };
    });

    set({
      accounts: updatedAccounts,
      transactions: [],
      applications: [],
      allocations: [],
      snapshots: [],
      pendingScannedSms: [],
    });
    get().saveToStorage();
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
