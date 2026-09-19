export * from '../types/finance';

export interface IPOFilterOptions {
  status?: 'OPEN' | 'UPCOMING' | 'CLOSED' | 'LISTED';
  category?: 'MAINBOARD' | 'SME' | 'ALL';
  searchQuery?: string;
}

export interface IPODataProvider {
  name: string;
  sourceUrl: string;
  getOpenIPOs(): Promise<import('../types/finance').IPO[]>;
  getUpcomingIPOs(): Promise<import('../types/finance').IPO[]>;
  getClosedIPOs(): Promise<import('../types/finance').IPO[]>;
  getListedIPOs(): Promise<import('../types/finance').IPO[]>;
  getAllIPOs(): Promise<import('../types/finance').IPO[]>;
  getIPOById(id: string): Promise<import('../types/finance').IPO | null>;
  refreshIPOData(): Promise<{ ipos: import('../types/finance').IPO[]; lastUpdated: string; source: string }>;
}
