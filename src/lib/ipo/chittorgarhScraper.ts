/**
 * Chittorgarh Live IPO Table Scraper & Normalizer Engine
 * Directly fetches and extracts tabular data from Chittorgarh IPO Dashboard and reports
 */

export interface ScrapedChittorgarhIPO {
  companyName: string;
  symbol: string;
  category: 'MAINBOARD' | 'SME';
  exchange: string;
  priceLow: number;
  priceHigh: number;
  lotSize: number;
  openDate: string;
  closeDate: string;
  allotmentDate?: string;
  listingDate?: string;
  issueSize?: string;
  freshIssue?: string;
  offerForSale?: string;
  subscriptionTotal?: number;
  qibSub?: number;
  niiSub?: number;
  retailSub?: number;
  gmp?: number;
  status: 'OPEN' | 'UPCOMING' | 'CLOSED' | 'LISTED';
}

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
};

/**
 * Converts Chittorgarh dates (e.g. "25-Sep-2026", "Sep 25, 2026", "25-09-2026", "25 Sep") to ISO YYYY-MM-DD
 */
export function normalizeChittorgarhDate(raw: string, fallbackYear = 2026): string {
  if (!raw) return '';
  const clean = raw.replace(/<[^>]*>/g, '').trim().toLowerCase();
  if (!clean || clean === '-' || clean === 'n/a' || clean === 'tba') return '';

  // Case 1: 25-sep-2026 or 25-09-2026 or 25/09/2026
  const dmyMatch = clean.match(/(\d{1,2})[-/\s]+([a-z]+|\d{1,2})[-/\s]*(\d{2,4})?/i);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const monthPart = dmyMatch[2].toLowerCase();
    let year = dmyMatch[3] ? (dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3]) : `${fallbackYear}`;

    let month = '01';
    if (MONTH_MAP[monthPart]) {
      month = MONTH_MAP[monthPart];
    } else if (/^\d+$/.test(monthPart)) {
      month = monthPart.padStart(2, '0');
    }

    return `${year}-${month}-${day}`;
  }

  // Case 2: Sep 25, 2026
  const mdyMatch = clean.match(/([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{2,4})?/i);
  if (mdyMatch) {
    const monthPart = mdyMatch[1].toLowerCase();
    const day = mdyMatch[2].padStart(2, '0');
    const year = mdyMatch[3] ? (mdyMatch[3].length === 2 ? `20${mdyMatch[3]}` : mdyMatch[3]) : `${fallbackYear}`;
    const month = MONTH_MAP[monthPart] || '01';
    return `${year}-${month}-${day}`;
  }

  return clean;
}

/**
 * Parses price range like "₹258 to ₹272", "258 - 272", "405", "Rs 98 to 103"
 */
export function parseChittorgarhPrice(raw: string): { low: number; high: number } {
  if (!raw) return { low: 0, high: 0 };
  const text = raw.replace(/<[^>]*>/g, '').replace(/[₹,Rs.]/gi, '').trim();
  
  const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:-|to|\/)\s*(\d+(?:\.\d+)?)/i);
  if (rangeMatch) {
    const p1 = parseFloat(rangeMatch[1]);
    const p2 = parseFloat(rangeMatch[2]);
    return {
      low: Math.min(p1, p2),
      high: Math.max(p1, p2),
    };
  }

  const singleMatch = text.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1]);
    return { low: val, high: val };
  }

  return { low: 0, high: 0 };
}

/**
 * Parses HTML table rows & Next.js stream paragraphs from Chittorgarh pages
 */
export function parseChittorgarhHTMLTables(html: string): ScrapedChittorgarhIPO[] {
  const results: ScrapedChittorgarhIPO[] = [];
  if (!html) return results;

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Extract from Next.js Stream and Paragraph link blocks (e.g. "The current mainboard active IPOs are...", "The current active SME IPOs are...", "The upcoming SME IPOs...")
  const streamPattern = /<p>([\s\S]*?(?:The upcoming|The current active|The current mainboard active|The current active SME|The upcoming mainboard|The upcoming SME|IPOs closing today|IPO listing today)[\s\S]*?)<\/p>/gi;
  let pMatch;
  while ((pMatch = streamPattern.exec(html)) !== null) {
    const pText = pMatch[1];
    const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*title=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let lMatch;

    const isUpcomingSection = /upcoming/i.test(pText);
    const isClosingTodaySection = /closing today/i.test(pText);
    const isListingTodaySection = /listing today/i.test(pText);
    const isMainboardSection = /mainboard/i.test(pText);

    while ((lMatch = linkRegex.exec(pText)) !== null) {
      const href = lMatch[1];
      const title = lMatch[2] || lMatch[3];
      const companyName = title.replace(/\bIPO\b/gi, '').replace(/\bSME\b/gi, '').replace(/\s+/g, ' ').trim();
      if (!companyName || /broker|guide|report|demat|contact/i.test(companyName)) continue;

      const symbol = companyName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      const isSME = /sme/i.test(href) || /sme/i.test(title) || (!isMainboardSection && !/mainboard/i.test(href));
      const category: 'MAINBOARD' | 'SME' = isSME ? 'SME' : 'MAINBOARD';

      let status: 'OPEN' | 'UPCOMING' | 'CLOSED' | 'LISTED' = 'OPEN';
      if (isListingTodaySection) status = 'LISTED';
      else if (isClosingTodaySection) status = 'OPEN';
      else if (isUpcomingSection) status = 'UPCOMING';

      if (!results.some((r) => r.companyName.toLowerCase() === companyName.toLowerCase())) {
        results.push({
          companyName,
          symbol,
          category,
          exchange: category === 'SME' ? 'BSE/NSE SME' : 'NSE, BSE',
          priceLow: category === 'SME' ? 95 : 150,
          priceHigh: category === 'SME' ? 100 : 160,
          lotSize: category === 'SME' ? 1200 : 50,
          openDate: todayStr,
          closeDate: todayStr,
          status,
        });
      }
    }
  }

  // 2. Extract standard table rows <tr>...</tr>
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    if (!rowHtml.includes('<td')) continue;

    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      const cellText = cellMatch[1]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(cellText);
    }

    if (cells.length < 4) continue;

    const rawName = cells[0];
    if (!rawName || /company|issuer|name|draft|rbi|sebi/i.test(rawName)) continue;

    const isSME = /sme|bse\s*sme|nse\s*sme|emerge/i.test(rowHtml) || /sme/i.test(rawName);
    const category: 'MAINBOARD' | 'SME' = isSME ? 'SME' : 'MAINBOARD';

    const companyName = rawName
      .replace(/\bIPO\b/gi, '')
      .replace(/\bSME\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const symbol = companyName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);

    let openDate = '';
    let closeDate = '';
    let listingDate = '';
    let priceLow = 0;
    let priceHigh = 0;
    let lotSize = isSME ? 1200 : 50;
    let issueSize = '';
    let subscriptionTotal: number | undefined = undefined;

    for (let i = 1; i < cells.length; i++) {
      const c = cells[i];

      if (/\d+/.test(c) && (c.includes('₹') || c.includes('to') || c.includes('-') || i === 3)) {
        const prices = parseChittorgarhPrice(c);
        if (prices.high > 0 && priceHigh === 0) {
          priceLow = prices.low;
          priceHigh = prices.high;
        }
      }

      const dateVal = normalizeChittorgarhDate(c);
      if (dateVal && dateVal.includes('-') && dateVal.length >= 8) {
        if (!openDate) {
          openDate = dateVal;
        } else if (!closeDate) {
          closeDate = dateVal;
        } else if (!listingDate) {
          listingDate = dateVal;
        }
      }

      if (/cr|crore/i.test(c)) {
        issueSize = c.startsWith('₹') ? c : `₹${c}`;
      }

      if (/^\d{2,5}$/.test(c.trim())) {
        const num = parseInt(c.trim());
        if (num >= 10 && num <= 10000 && lotSize === (isSME ? 1200 : 50)) {
          lotSize = num;
        }
      }

      if (/(?:\d+\.\d+|\d+)x?/i.test(c) && /times|sub/i.test(rowHtml)) {
        const subMatch = c.match(/(\d+(?:\.\d+)?)/);
        if (subMatch && !subscriptionTotal) {
          const val = parseFloat(subMatch[1]);
          if (val > 0 && val < 2000) {
            subscriptionTotal = val;
          }
        }
      }
    }

    if (companyName && priceHigh > 0) {
      let status: 'OPEN' | 'UPCOMING' | 'CLOSED' | 'LISTED' = 'OPEN';

      if (closeDate && closeDate < todayStr) {
        status = listingDate && listingDate <= todayStr ? 'LISTED' : 'CLOSED';
      } else if (openDate && openDate > todayStr) {
        status = 'UPCOMING';
      }

      const existingIndex = results.findIndex((r) => r.companyName.toLowerCase() === companyName.toLowerCase());
      if (existingIndex >= 0) {
        results[existingIndex] = {
          ...results[existingIndex],
          priceLow: priceLow || results[existingIndex].priceLow,
          priceHigh: priceHigh || results[existingIndex].priceHigh,
          lotSize: lotSize || results[existingIndex].lotSize,
          openDate: openDate || results[existingIndex].openDate,
          closeDate: closeDate || results[existingIndex].closeDate,
          listingDate: listingDate || results[existingIndex].listingDate,
          issueSize: issueSize || results[existingIndex].issueSize,
          subscriptionTotal: subscriptionTotal || results[existingIndex].subscriptionTotal,
          status,
        };
      } else {
        results.push({
          companyName,
          symbol: symbol || 'IPO',
          category,
          exchange: isSME ? 'BSE/NSE SME' : 'NSE / BSE',
          priceLow: priceLow || priceHigh,
          priceHigh,
          lotSize,
          openDate: openDate || todayStr,
          closeDate: closeDate || todayStr,
          listingDate,
          issueSize,
          subscriptionTotal,
          status,
        });
      }
    }
  }

  return results;
}

/**
 * Fetches and compares Chittorgarh live data
 */
export async function fetchLiveChittorgarhData(): Promise<ScrapedChittorgarhIPO[]> {
  const urls = [
    'https://www.chittorgarh.com/ipo/ipo_dashboard.asp',
    'https://www.chittorgarh.com/report/ipo-in-india-list-main-board-sme/82/mainboard/',
    'https://www.chittorgarh.com/report/ipo-in-india-list-main-board-sme/82/sme/',
  ];

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  const allScraped: ScrapedChittorgarhIPO[] = [];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const html = await res.text();
        const parsed = parseChittorgarhHTMLTables(html);
        allScraped.push(...parsed);
      }
    } catch {
      // Continue to next URL
    }
  }

  return allScraped;
}
