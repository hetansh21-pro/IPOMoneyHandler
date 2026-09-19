export type AccountType = 'bank' | 'cash' | 'demat' | 'wallet' | 'investment' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  balance: number; // Current nominal balance (cash/funds on record)
  investedAmount?: number; // Current equity/stock holdings value for Demat/Investment accounts
  currency: string; // Default 'INR'
  notes?: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'MONEY_ADDED'
  | 'MONEY_REMOVED'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'IPO_ALLOCATION_BLOCKED'
  | 'IPO_RELEASED'
  | 'IPO_ALLOTMENT_INVESTED'
  | 'INVESTMENT_PURCHASE'
  | 'INVESTMENT_SALE'
  | 'EXPENSE'
  | 'INCOME'
  | 'OTHER';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  relatedAccountId?: string;
  relatedIPOApplicationId?: string;
  createdAt: string;
}

export type AllocationCategory = 'PERSONAL' | 'IPO' | 'TRADING' | 'FREE' | 'EMERGENCY' | 'CUSTOM';

export interface Allocation {
  id: string;
  accountId: string;
  category: AllocationCategory;
  label: string;
  amount: number;
  type: 'GENERAL' | 'IPO_BLOCKED';
  relatedIPOApplicationId?: string;
  createdAt: string;
  updatedAt: string;
}

export type IPOStatus = 'OPEN' | 'UPCOMING' | 'CLOSED' | 'LISTED';
export type IPOCategory = 'MAINBOARD' | 'SME';

export interface IPOSubscriptionInfo {
  qib?: number;
  nii?: number;
  retail?: number;
  total?: number;
  asOf?: string;
}

export interface IPO {
  id: string;
  externalId?: string;
  companyName: string;
  symbol: string;
  exchange: string;
  status: IPOStatus;
  category: IPOCategory;
  openDate: string;
  closeDate: string;
  listingDate?: string;
  allotmentDate?: string;
  priceLow: number;
  priceHigh: number;
  lotSize: number;
  minimumInvestment: number;
  issueSize?: string;
  subscriptionData?: IPOSubscriptionInfo;
  gmp?: number; // Grey Market Premium
  source: string;
  lastUpdated: string;
}

export type ApplicationStatus =
  | 'INTERESTED'
  | 'APPLICATION_STARTED'
  | 'APPLIED'
  | 'MANDATE_PENDING'
  | 'MANDATE_ACCEPTED'
  | 'FUNDS_BLOCKED'
  | 'ALLOTMENT_PENDING'
  | 'FULLY_ALLOTTED'
  | 'PARTIALLY_ALLOTTED'
  | 'NOT_ALLOTTED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface TimelineEvent {
  title: string;
  timestamp: string;
  note?: string;
  status: 'completed' | 'current' | 'upcoming';
}

export interface IPOApplication {
  id: string;
  ipoId: string;
  companyName: string;
  symbol: string;
  accountId: string; // Virtual bank account used for mandate/fund block
  dematAccountId?: string; // Virtual Demat account where shares are received
  lotsApplied: number;
  lotsAllotted: number;
  applicationPrice: number;
  applicationAmount: number;
  blockedAmount: number;
  allottedAmount: number;
  releasedAmount: number;
  status: ApplicationStatus;
  notes?: string;
  timeline: TimelineEvent[];
  appliedAt: string;
  updatedAt: string;
}

export interface Investment {
  id: string;
  accountId?: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Snapshot {
  id: string;
  title: string;
  date: string;
  totalMoney: number;
  availableMoney: number;
  blockedMoney: number;
  investedMoney: number;
  breakdown: Record<string, number>;
  notes?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  type: 'IPO_OPEN' | 'IPO_CLOSE' | 'ALLOTMENT' | 'LISTING' | 'CUSTOM';
  date: string;
  ipoId?: string;
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface MoneySummary {
  totalTrackedMoney: number;
  availableMoney: number;
  blockedMoney: number;
  investedMoney: number;
  byAccountType: Record<AccountType, number>;
  byAccount: Record<string, { total: number; available: number; blocked: number }>;
}
