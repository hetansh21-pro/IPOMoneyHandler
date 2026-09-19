import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats numbers in standard Indian Rupee format (e.g. ₹5,00,000 or ₹29,500)
 */
export function formatINR(amount: number, includeDecimals?: boolean): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Auto-detect decimal paise (point-to-point) if not an exact whole number
  const shouldShowDecimals = includeDecimals !== undefined ? includeDecimals : absAmount % 1 !== 0;
  
  const parts = shouldShowDecimals ? absAmount.toFixed(2).split('.') : Math.round(absAmount).toString().split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian number grouping: last 3 digits, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const result = `${isNegative ? '-' : ''}₹${formattedInteger}${shouldShowDecimals && decimalPart ? '.' + decimalPart : ''}`;
  return result;
}

/**
 * Compact Indian currency formatting (e.g. ₹5.50 L, ₹12.50 Cr, ₹45.2 K)
 */
export function formatCompactINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)} K`;
  }
  return `${sign}₹${abs.toFixed(0)}`;
}

/**
 * Formats standard readable date string (e.g. '18 Sep 2026')
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats date range (e.g. '18 Sep → 22 Sep')
 */
export function formatDateRange(startStr?: string, endStr?: string): string {
  if (!startStr) return 'N/A';
  const start = formatDate(startStr).replace(/\s\d{4}$/, '');
  if (!endStr) return start;
  const end = formatDate(endStr);
  return `${start} → ${end}`;
}

/**
 * Returns a concise, clean brand/short name for bank & demat accounts
 * (e.g. "HDFC Bank (Primary)" -> "HDFC", "Zerodha Demat" -> "Zerodha")
 */
export function getShortAccountName(name?: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  // Common Bank & Broker Brand Short Names
  if (lower.includes('hdfc')) return 'HDFC';
  if (lower.includes('zerodha') || lower.includes('kite')) return 'Zerodha';
  if (lower.includes('state bank') || lower.includes('sbi')) return 'SBI';
  if (lower.includes('icici')) return 'ICICI';
  if (lower.includes('kotak')) return 'Kotak';
  if (lower.includes('axis')) return 'Axis';
  if (lower.includes('groww')) return 'Groww';
  if (lower.includes('angel')) return 'Angel One';
  if (lower.includes('upstox')) return 'Upstox';
  if (lower.includes('dhan')) return 'Dhan';
  if (lower.includes('indmoney') || lower.includes('ind money')) return 'INDmoney';
  if (lower.includes('paytm')) return 'Paytm';
  if (lower.includes('punjab national') || lower.includes('pnb')) return 'PNB';
  if (lower.includes('bank of baroda') || lower.includes('bob')) return 'BOB';
  if (lower.includes('canara')) return 'Canara';
  if (lower.includes('union bank') || lower.includes('union')) return 'Union';
  if (lower.includes('indusind')) return 'IndusInd';
  if (lower.includes('idfc')) return 'IDFC';
  if (lower.includes('federal')) return 'Federal';
  if (lower.includes('yes bank')) return 'Yes Bank';
  if (lower.includes('motilal') || lower.includes('mosl')) return 'Motilal';
  if (lower.includes('5paisa')) return '5Paisa';
  if (lower.includes('fyers')) return 'Fyers';
  if (lower.includes('iifl')) return 'IIFL';
  if (lower.includes('alice blue')) return 'Alice Blue';
  if (lower.includes('nuvama') || lower.includes('edelweiss')) return 'Nuvama';
  if (lower.includes('bajaj')) return 'Bajaj';
  if (lower.includes('shriram')) return 'Shriram';
  if (lower.includes('bandhan')) return 'Bandhan';
  if (lower.includes('rbl')) return 'RBL';
  if (lower.includes('jupiter')) return 'Jupiter';
  if (lower.includes('fi money') || lower.includes('fi bank')) return 'Fi';
  if (lower.includes('slice')) return 'Slice';

  // Generic clean-up: Remove parentheses content like (Primary), (1234), etc.
  let clean = trimmed.replace(/\s*\([^)]*\)/g, '');
  // Remove trailing details like - 1234
  clean = clean.replace(/\s*[-–—]\s*.*$/, '');
  // Remove common suffixes
  clean = clean.replace(/\b(bank|demat|broker|account|acc|savings|current|trading|securities|sec|broking)\b/gi, '').trim();

  // If result is non-empty, return it, otherwise return first word of original
  if (clean.length > 0) {
    return clean.split(/\s+/).slice(0, 2).join(' ');
  }
  return trimmed.split(/\s+/)[0] || trimmed;
}

/**
 * Formats time with AM/PM (e.g. '10:32 AM')
 */
export function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}


