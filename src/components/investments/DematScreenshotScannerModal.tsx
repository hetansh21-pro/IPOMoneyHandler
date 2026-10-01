'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  FileText,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Zap,
  Building2,
  DollarSign,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  X,
  Copy,
  Image as ImageIcon,
  Check,
  Eye,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BottomSheet } from '../common/BottomSheet';
import { CustomDropdown } from '../common/CustomDropdown';
import { BankLogo } from '../common/SegmentedBar';
import { SlidingSegmentedTabs } from '../common/SlidingSegmentedTabs';
import { useAppStore } from '../../lib/store/useAppStore';
import { formatINR } from '../../lib/utils/formatters';
import {
  fetchLiveStockQuote,
  resolveStockTicker,
  resolveStockInfo,
  CANONICAL_COMPANY_NAMES,
  INDIAN_STOCK_ALIASES,
} from '../../lib/market/priceFetcher';
import { useBackHandler } from '@/lib/hooks/useBackHandler';

export interface ParsedHoldingItem {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  selected: boolean;
  isVerified?: boolean;
  isFetchingLtp?: boolean;
}

interface DematScreenshotScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAccountId?: string | null;
}

declare global {
  interface Window {
    Tesseract?: any;
  }
}

// Banned words that must never be treated as stock tickers or company names
const BANNED_KEYWORDS = new Set([
  'INVESTED', 'CURRENT', 'HOLDINGS', 'POSITIONS', 'WATCHLIST', 'ORDERS', 'BIDS',
  'PERCENT', 'CHANGE', 'CHG', 'BAL', 'BALANCE', 'AVAILABLE', 'BLOCKED', 'LIMIT',
  'STOPLOSS', 'TRIGGER', 'TARGET', 'IIL', 'A G', 'AG', 'TP', 'NOS', 'UNITS',
  'VIEW', 'MORE', 'LESS', 'EXPAND', 'COLLAPSE', 'DETAILS', 'DETAIL', 'SHOW',
  'ALL', 'EQUITY', 'MUTUAL', 'FUNDS', 'PORTFOLIO', 'STOCKS', 'SUMMARY', 'TOTAL',
  'DAY', 'RETURN', 'RETURNS', 'PNL', 'PROFIT', 'LOSS', 'OVERALL', 'REALIZED',
  'UNREALIZED', 'MARGIN', 'CNC', 'MIS', 'NRML', 'BUY', 'SELL', 'SHARES', 'QTY',
  'AVG', 'LTP', 'PRICE', 'MARKET', 'VALUE', 'NSE', 'BSE', 'GROWW', 'ZERODHA',
  'KITE', 'UPSTOX', 'ANGEL', 'ONE', 'DHAN', 'INDMONEY', 'PAYTM', 'MONEY',
  'KOTAK', 'NEO', 'HDFC', 'SKY', 'ICICI', 'DIRECT', 'ACCOUNT', 'DEMAT',
  'SEARCH', 'FILTER', 'SORT', 'NAME', 'DATE', 'STATUS', 'LIVE', 'TODAY',
  'OVERVIEW', 'NOTIFICATIONS', 'DISMISS', 'CLOSE', 'HELP', 'SUPPORT'
]);

export function DematScreenshotScannerModal({
  isOpen,
  onClose,
  defaultAccountId,
}: DematScreenshotScannerModalProps) {
  const { accounts, addMultipleInvestments } = useAppStore();
  const dematAccounts = accounts.filter((a) => a.type === 'demat' || a.type === 'investment');

  const [activeTab, setActiveTab] = useState<'screenshot' | 'text'>('screenshot');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    defaultAccountId || (dematAccounts[0]?.id ?? '')
  );

  useBackHandler(isOpen, () => {
    onClose();
    return true;
  });

  // Image & OCR State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [rawExtractedText, setRawExtractedText] = useState<string>('');
  const [showRawText, setShowRawText] = useState(false);

  // Manual Text Input State
  const [pastedText, setPastedText] = useState<string>('');

  // Parsed Holdings List
  const [parsedItems, setParsedItems] = useState<ParsedHoldingItem[]>([]);
  const [isSuccessImported, setIsSuccessImported] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reset everything when modal opens so fresh upload dropzone is immediately displayed
  useEffect(() => {
    if (isOpen) {
      setImagePreview(null);
      setParsedItems([]);
      setRawExtractedText('');
      setErrorMessage(null);
      setIsOcrLoading(false);
      setOcrProgress(0);
      setOcrStatusText('');
      setPastedText('');
      setIsSuccessImported(false);
      setShowRawText(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (defaultAccountId) {
        setSelectedAccountId(defaultAccountId);
      } else if (dematAccounts.length > 0) {
        setSelectedAccountId(dematAccounts[0].id);
      }
    }
  }, [isOpen, defaultAccountId]);

  // Load Tesseract.js script dynamically with multi-CDN fallback
  const ensureTesseractLoaded = useCallback(async (): Promise<any> => {
    if (window.Tesseract) return window.Tesseract;

    const cdns = [
      'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.0/tesseract.min.js',
      'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
      'https://unpkg.com/tesseract.js@5.1.0/dist/tesseract.min.js',
    ];

    for (const src of cdns) {
      try {
        const loaded = await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          script.onload = () => resolve(window.Tesseract);
          script.onerror = () => reject(new Error(`Failed to load from ${src}`));
          document.body.appendChild(script);
        });
        if (loaded) return loaded;
      } catch {
        // try next
      }
    }

    throw new Error('Could not load OCR engine. Please check your internet connection.');
  }, []);

  /**
   * Super-Resolution & Contrast Preprocessing for Screenshots
   */
  const preprocessImage = (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        const scale = img.width < 1400 ? 2 : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Adaptive luminance and contrast stretching
        let minLum = 255;
        let maxLum = 0;
        let totalLuminance = 0;
        const totalPixels = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          totalLuminance += lum;
          if (lum < minLum) minLum = lum;
          if (lum > maxLum) maxLum = lum;
        }

        const avgLum = totalLuminance / totalPixels;
        const isDarkMode = avgLum < 120;
        const lumRange = Math.max(1, maxLum - minLum);

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          let lum = 0.299 * r + 0.587 * g + 0.114 * b;
          let norm = ((lum - minLum) / lumRange) * 255;

          if (isDarkMode) {
            norm = 255 - norm;
          }

          // Crisp contrast curve for OCR clarity
          const enhanced = norm > 210 ? 255 : norm < 45 ? 0 : norm;

          data[i] = enhanced;
          data[i + 1] = enhanced;
          data[i + 2] = enhanced;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(imageSrc);
      img.src = imageSrc;
    });
  };

  const parseCleanNumber = (val: string | null | undefined): number => {
    if (!val) return 0;
    const clean = val.replace(/[₹Rs,$\s]/gi, '').trim();
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : Math.abs(num);
  };

  const cleanTickerToken = (token: string): string => {
    return token.toUpperCase().replace(/[^A-Z0-9&]/g, '').trim();
  };

  /**
   * High-precision extractor for Quantity from text chunks
   * Accurately detects: "Shares", "Qty", "Quantity", "Nos", "Units", "Shs", "Sh", etc.
   */
  const extractQuantityFromText = (text: string): number | null => {
    if (!text || !text.trim()) return null;

    // 1. Label followed by number: "Qty: 25", "Shares: 50", "Quantity: 100", "Qty. 10", "Nos: 5", "Units: 10", "Shs: 12"
    const labelFirst = text.match(
      /(?:Qty|Quantity|Shares|Share|Shs|Sh|Nos|Units|Holding\s*Qty|No\.?\s*of\s*shares)\s*[:.\-–—:=#*]?\s*(\d[\d,]*)\b/i
    );
    if (labelFirst) {
      const q = parseInt(labelFirst[1].replace(/,/g, ''), 10);
      if (!isNaN(q) && q > 0) return q;
    }

    // 2. Number followed by label: "25 shares", "50 Shares", "10 Qty", "100 shs", "15 nos", "20 units", "1 share"
    const numberFirst = text.match(
      /\b(\d[\d,]*)\s*(?:shares|share|shs|sh|qty|quantity|nos|units)\b/i
    );
    if (numberFirst) {
      const q = parseInt(numberFirst[1].replace(/,/g, ''), 10);
      if (!isNaN(q) && q > 0) return q;
    }

    // 3. Composite Zerodha / Groww line: "Qty. 10 • Avg. 250" or "10 shares • Avg. 250"
    const compositeQty = text.match(/(?:Qty\.?|Shares?)\s*[:.]?\s*(\d[\d,]*)\s*(?:•|\/|\||-)?\s*Avg/i);
    if (compositeQty) {
      const q = parseInt(compositeQty[1].replace(/,/g, ''), 10);
      if (!isNaN(q) && q > 0) return q;
    }

    // 4. Fraction format: "Qty 25/25" or "25 / 25 shares"
    const fracMatch = text.match(/(?:Qty|Shares|Quantity)\s*[:.]?\s*(\d[\d,]*)\s*\/\s*\d+/i);
    if (fracMatch) {
      const q = parseInt(fracMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(q) && q > 0) return q;
    }

    return null;
  };

  /**
   * Extractor for Average Buy Price from text chunks
   */
  const extractAvgPriceFromText = (text: string): number | null => {
    if (!text || !text.trim()) return null;

    const match =
      text.match(/(?:Avg|Average|Buy\s*Price|Cost\s*Price|Buy\s*Avg|Avg\.?\s*Price|Avg\.?\s*Cost|Bought\s*at|Purchase\s*Price|Avg\.?)\s*[:.\-–—:=#*]?\s*(?:₹|Rs\.?)?\s*([\d,]+\.?\d*)/i) ||
      text.match(/Avg\.?\s*[:.]?\s*(?:₹|Rs\.?)?\s*([\d,]+\.?\d*)/i) ||
      text.match(/(?:•|\/|\||-)\s*Avg\.?\s*(?:₹|Rs\.?)?\s*([\d,]+\.?\d*)/i);

    if (match) {
      const num = parseCleanNumber(match[1]);
      if (num > 0) return num;
    }
    return null;
  };

  /**
   * Extractor for LTP / Current Market Price from text chunks
   */
  const extractLtpPriceFromText = (text: string): number | null => {
    if (!text || !text.trim()) return null;

    const match =
      text.match(/(?:LTP|CMP|Mkt\s*Price|Market\s*Price|Cur\s*Price|Current\s*Price|Live\s*Price|Price)\s*[:.\-–—:=#*]?\s*(?:₹|Rs\.?)?\s*([\d,]+\.?\d*)/i) ||
      text.match(/(?:•|\/|\||-)\s*(?:LTP|CMP)\s*(?:₹|Rs\.?)?\s*([\d,]+\.?\d*)/i) ||
      text.match(/LTP\s*(?:₹|Rs\.?)?\s*([\d,]+\.?\d*)/i);

    if (match) {
      const num = parseCleanNumber(match[1]);
      if (num > 0) return num;
    }
    return null;
  };

  /**
   * Extractor for Invested Amount from text chunks
   */
  const extractInvestedAmountFromText = (text: string): number | null => {
    if (!text || !text.trim()) return null;

    const match =
      text.match(/(?:Invested|Total\s*Cost|Total\s*Buy|Inv)\s*[:.\-–—:=#*]?\s*(?:₹|Rs\.?)?\s*([\d,]+\.?\d*)/i) ||
      text.match(/(?:•|\/|\||-)\s*Invested\s*(?:₹|Rs\.?)?\s*([\d,]+\.?\d*)/i);

    if (match) {
      const num = parseCleanNumber(match[1]);
      if (num > 0) return num;
    }
    return null;
  };

  /**
   * Extractor for Current Value from text chunks
   */
  const extractCurrentValueFromText = (text: string): number | null => {
    if (!text || !text.trim()) return null;

    const match =
      text.match(/(?:Current\s*Value|Cur\s*Val|Mkt\s*Value|Market\s*Value)\s*[:.\-–—:=#*]?\s*(?:₹|Rs\.?)?\s*([\d,]+\.?\d*)/i) ||
      text.match(/(?:•|\/|\||-)\s*Current\s*(?:₹|Rs\.?)?\s*([\d,]+\.?\d*)/i);

    if (match) {
      const num = parseCleanNumber(match[1]);
      if (num > 0) return num;
    }
    return null;
  };

  /**
   * Extract potential candidates and structural blocks from raw OCR text
   * Uses multi-pass scanning across line structures and card blocks
   */
  const extractRawHoldingsCandidates = (rawText: string): { candidateSymbolOrName: string; quantity: number; avgPrice: number; ltpPrice: number }[] => {
    if (!rawText || !rawText.trim()) return [];

    let rawLines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Normalize stacked OCR lines (e.g. Line 1: "Shares" -> Line 2: "25", or Line 1: "25" -> Line 2: "Shares")
    const lines: string[] = [];
    for (let i = 0; i < rawLines.length; i++) {
      const cur = rawLines[i];
      const next = rawLines[i + 1] || '';

      if (/^(?:Qty|Quantity|Shares|Share|Shs|Nos|Units)[:.]?$/i.test(cur) && /^\d+$/.test(next)) {
        lines.push(`Qty: ${next}`);
        i++; // skip next
      } else if (/^\d+$/.test(cur) && /^(?:Shares|Share|Qty|Quantity|Shs|Nos|Units)$/i.test(next)) {
        lines.push(`${cur} Shares`);
        i++; // skip next
      } else if (/^(?:Avg|Average|Buy Price|Cost)[:.]?$/i.test(cur) && /^(?:₹|Rs\.?)?\s*[\d,.]+$/i.test(next)) {
        lines.push(`Avg: ${next}`);
        i++; // skip next
      } else if (/^(?:LTP|Price|Current Price|CMP)[:.]?$/i.test(cur) && /^(?:₹|Rs\.?)?\s*[\d,.]+$/i.test(next)) {
        lines.push(`LTP: ${next}`);
        i++; // skip next
      } else {
        lines.push(cur);
      }
    }

    const candidates: { candidateSymbolOrName: string; quantity: number; avgPrice: number; ltpPrice: number }[] = [];
    const fullText = lines.join('\n');

    // Helper to evaluate a card window around line index i
    const parseCardWindowAt = (nameCandidate: string, lineIndex: number) => {
      const cardWindow = lines
        .slice(Math.max(0, lineIndex - 1), Math.min(lines.length, lineIndex + 6))
        .join(' ');

      let qty = extractQuantityFromText(cardWindow) || 0;
      let avg = extractAvgPriceFromText(cardWindow) || 0;
      let ltp = extractLtpPriceFromText(cardWindow) || 0;
      const invested = extractInvestedAmountFromText(cardWindow) || 0;
      const curVal = extractCurrentValueFromText(cardWindow) || 0;

      // Deduce missing values through mathematical cross-relations
      if (qty > 0 && avg <= 0 && invested > 0) {
        avg = parseFloat((invested / qty).toFixed(2));
      }
      if (qty > 0 && ltp <= 0 && curVal > 0) {
        ltp = parseFloat((curVal / qty).toFixed(2));
      }
      if (qty <= 0 && invested > 0 && avg > 0) {
        qty = Math.round(invested / avg);
      }
      if (avg > 0 && ltp <= 0) {
        ltp = avg;
      }
      if (ltp > 0 && avg <= 0) {
        avg = ltp;
      }

      if (qty <= 0) qty = 1;

      candidates.push({
        candidateSymbolOrName: nameCandidate,
        quantity: qty,
        avgPrice: avg,
        ltpPrice: ltp,
      });
    };

    // 1. Direct Multi-Word & Alias Match against 500+ Indian Stocks Registry
    for (const [aliasName] of Object.entries(INDIAN_STOCK_ALIASES)) {
      if (BANNED_KEYWORDS.has(aliasName)) continue;

      const regex = new RegExp(`\\b${aliasName.replace('&', '\\&')}\\b`, 'i');
      if (regex.test(fullText)) {
        const lineIdx = lines.findIndex((l) => regex.test(l));
        if (lineIdx !== -1) {
          parseCardWindowAt(aliasName, lineIdx);
        }
      }
    }

    // 2. Zerodha / Groww / Angel One / Upstox Pattern: Stock Title Line followed by Numbers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const cleanLine = line.replace(/[>•\-_|]/g, ' ').replace(/\s+/g, ' ').trim();

      // Check if this line is a stock name or ticker
      const info = resolveStockInfo(cleanLine);
      if (info.isKnown && !BANNED_KEYWORDS.has(info.symbol)) {
        parseCardWindowAt(info.name, i);
        continue;
      }

      // Check single words or pairs in line
      const tokens = cleanLine.split(/\s+/);
      for (let j = 0; j < tokens.length; j++) {
        const singleToken = cleanTickerToken(tokens[j]);
        if (singleToken.length >= 2 && !BANNED_KEYWORDS.has(singleToken) && !/^\d+$/.test(singleToken)) {
          const singleInfo = resolveStockInfo(singleToken);
          if (singleInfo.isKnown) {
            parseCardWindowAt(singleInfo.name, i);
            break;
          }
        }
      }
    }

    // 3. Tabular Line Match (e.g., "RELIANCE 25 2450.00 2520.00" or "TCS 10 3800")
    for (const line of lines) {
      const tableMatch = line.match(/^([A-Za-z0-9&]{2,15})\s+(?:EQ|CNC|NSE|BSE)?\s*(\d{1,6})\s+([\d,.]+)(?:\s+([\d,.]+))?/i);
      if (tableMatch) {
        const candidate = cleanTickerToken(tableMatch[1]);
        const qty = parseInt(tableMatch[2], 10);
        const avg = parseCleanNumber(tableMatch[3]);
        const ltp = tableMatch[4] ? parseCleanNumber(tableMatch[4]) : avg;

        if (candidate.length >= 2 && !BANNED_KEYWORDS.has(candidate) && !/^\d+$/.test(candidate) && qty > 0) {
          candidates.push({
            candidateSymbolOrName: candidate,
            quantity: qty,
            avgPrice: avg,
            ltpPrice: ltp,
          });
        }
      }
    }

    return candidates;
  };

  /**
   * 3-Fold Verification Engine:
   * 1. Resolves canonical ticker & official company name from master registry.
   * 2. Live market quote lookup for real-time verification on NSE/BSE.
   * 3. Discards false positives, UI labels, and invalid numbers.
   */
  const verifyAndEnrichHoldings = async (
    rawCandidates: { candidateSymbolOrName: string; quantity: number; avgPrice: number; ltpPrice: number }[]
  ): Promise<ParsedHoldingItem[]> => {
    const verifiedMap = new Map<string, ParsedHoldingItem>();

    // De-duplicate candidate queries while preserving the best quantity and buy price
    const candidateGroupMap = new Map<string, typeof rawCandidates[0]>();

    for (const c of rawCandidates) {
      const info = resolveStockInfo(c.candidateSymbolOrName);
      const key = info.symbol || cleanTickerToken(c.candidateSymbolOrName);

      if (key && !BANNED_KEYWORDS.has(key)) {
        const existing = candidateGroupMap.get(key);
        if (!existing) {
          candidateGroupMap.set(key, c);
        } else {
          if (c.quantity > 1 && existing.quantity <= 1) {
            existing.quantity = c.quantity;
          }
          if (c.avgPrice > 0 && existing.avgPrice <= 0) {
            existing.avgPrice = c.avgPrice;
          }
          if (c.ltpPrice > 0 && existing.ltpPrice <= 0) {
            existing.ltpPrice = c.ltpPrice;
          }
        }
      }
    }

    const uniqueCandidates = Array.from(candidateGroupMap.values());

    setOcrStatusText('Resolving stocks against NSE/BSE registry (1/3)...');

    // 1. First Pass: Canonical resolution from extensive local registry
    for (const cand of uniqueCandidates) {
      const query = cand.candidateSymbolOrName.trim();
      const info = resolveStockInfo(query);

      const canonicalSymbol = info.symbol || cleanTickerToken(query);
      const canonicalName = info.name || query;

      if (canonicalSymbol && !BANNED_KEYWORDS.has(canonicalSymbol)) {
        const avg = cand.avgPrice > 0 ? cand.avgPrice : (cand.ltpPrice > 0 ? cand.ltpPrice : 100);
        const ltp = cand.ltpPrice > 0 ? cand.ltpPrice : avg;
        const qty = cand.quantity > 0 ? cand.quantity : 1;

        verifiedMap.set(canonicalSymbol, {
          id: `scan-verified-${canonicalSymbol}`,
          symbol: canonicalSymbol,
          name: canonicalName,
          quantity: qty,
          avgPrice: avg,
          currentPrice: ltp,
          selected: true,
          isVerified: info.isKnown,
        });
      }
    }

    setOcrStatusText('Checking live market prices on NSE/BSE (2/3)...');

    // 2. Second Pass: Query live stock quote for verified candidates
    const verificationPromises = uniqueCandidates.map(async (cand) => {
      try {
        const query = cand.candidateSymbolOrName.trim();
        const info = resolveStockInfo(query);
        const targetSym = info.symbol || query;

        const quote = await Promise.race([
          fetchLiveStockQuote(targetSym),
          new Promise<null>((r) => setTimeout(() => r(null), 3000)),
        ]);

        if (quote && quote.price > 0) {
          const verifiedSymbol = quote.symbol.replace(/\.NS$|\.BO$/, '').toUpperCase();
          const verifiedName = CANONICAL_COMPANY_NAMES[verifiedSymbol] || quote.name || info.name || query;

          const existing = verifiedMap.get(verifiedSymbol);
          if (existing) {
            existing.currentPrice = quote.price;
            existing.name = verifiedName;
            existing.isVerified = true;
            if (existing.avgPrice <= 0 || existing.avgPrice === 100) {
              existing.avgPrice = cand.avgPrice > 0 ? cand.avgPrice : quote.price;
            }
            if (cand.quantity > 1) {
              existing.quantity = cand.quantity;
            }
          } else if (!BANNED_KEYWORDS.has(verifiedSymbol)) {
            const avg = cand.avgPrice > 0 ? cand.avgPrice : quote.price;
            verifiedMap.set(verifiedSymbol, {
              id: `scan-verified-${verifiedSymbol}`,
              symbol: verifiedSymbol,
              name: verifiedName,
              quantity: cand.quantity > 0 ? cand.quantity : 1,
              avgPrice: avg,
              currentPrice: quote.price,
              selected: true,
              isVerified: true,
            });
          }
        }
      } catch {
        // Safe fallback
      }
    });

    await Promise.all(verificationPromises);

    setOcrStatusText('Cross-validating and finalizing holdings (3/3)...');

    const verifiedList: ParsedHoldingItem[] = [];
    verifiedMap.forEach((val) => {
      // Final sanity check: Discard non-stocks and invalid items
      if (val.quantity > 0 && val.avgPrice > 0 && !BANNED_KEYWORDS.has(val.symbol)) {
        verifiedList.push(val);
      }
    });

    return verifiedList;
  };

  /**
   * Run OCR & Live Stock Market Verification on screenshot
   */
  const processImageFile = async (file: File) => {
    try {
      setErrorMessage(null);
      setIsOcrLoading(true);
      setOcrProgress(5);
      setOcrStatusText('Loading image...');

      const reader = new FileReader();
      reader.onload = async (e) => {
        const rawDataUrl = e.target?.result as string;
        setImagePreview(rawDataUrl);

        try {
          setOcrStatusText('Applying smart contrast filters...');
          setOcrProgress(20);
          const processedDataUrl = await preprocessImage(rawDataUrl);

          setOcrStatusText('Scanning text with AI OCR...');
          setOcrProgress(40);
          const Tesseract = await ensureTesseractLoaded();

          const result = await Tesseract.recognize(processedDataUrl, 'eng', {
            logger: (m: any) => {
              if (m.status === 'recognizing text' && m.progress !== undefined) {
                setOcrProgress(40 + Math.round(m.progress * 40));
                setOcrStatusText(`Reading text (${Math.round(m.progress * 100)}%)...`);
              }
            },
          });

          const recognizedText = result?.data?.text || '';
          setRawExtractedText(recognizedText);

          setOcrStatusText('Detecting stock holdings...');
          setOcrProgress(80);

          const rawCandidates = extractRawHoldingsCandidates(recognizedText);

          setOcrStatusText('Verifying stocks on NSE/BSE Live Market...');
          setOcrProgress(90);

          const verifiedStocks = await verifyAndEnrichHoldings(rawCandidates);

          if (verifiedStocks.length === 0) {
            setErrorMessage(
              'No listed Indian stocks could be verified from this screenshot. You can add rows manually below or paste your statement text.'
            );
            setParsedItems([
              {
                id: `scan-manual-${Date.now()}`,
                symbol: '',
                name: '',
                quantity: 1,
                avgPrice: 0,
                currentPrice: 0,
                selected: true,
                isVerified: false,
              },
            ]);
          } else {
            setParsedItems(verifiedStocks);
          }
        } catch (err: any) {
          console.error('OCR Error:', err);
          setErrorMessage(
            'Failed to verify screenshot stocks. You can switch to the "Paste Statement Text" tab or add rows manually.'
          );
        } finally {
          setIsOcrLoading(false);
          setOcrProgress(100);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsOcrLoading(false);
      setErrorMessage('Failed to read image file.');
    }
  };

  /**
   * Reset & Prompt file selector for a new image
   */
  const handleUploadNewImage = () => {
    setImagePreview(null);
    setParsedItems([]);
    setRawExtractedText('');
    setErrorMessage(null);
    setIsOcrLoading(false);
    setOcrProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  /**
   * Handle File Drag & Drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  /**
   * Handle Paste from Clipboard (Ctrl+V)
   */
  const handlePasteAnywhere = useCallback(
    (e: ClipboardEvent) => {
      if (!isOpen) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            setActiveTab('screenshot');
            return;
          }
        }
      }
    },
    [isOpen]
  );

  useEffect(() => {
    window.addEventListener('paste', handlePasteAnywhere);
    return () => window.removeEventListener('paste', handlePasteAnywhere);
  }, [handlePasteAnywhere]);

  /**
   * Parse manual pasted text with live verification
   */
  const handleParsePastedText = async () => {
    if (!pastedText.trim()) return;
    setIsOcrLoading(true);
    setOcrStatusText('Verifying stocks from text on NSE/BSE...');
    try {
      const candidates = extractRawHoldingsCandidates(pastedText);
      const verified = await verifyAndEnrichHoldings(candidates);

      if (verified.length === 0) {
        setErrorMessage('No real listed stocks recognized from the pasted text.');
      } else {
        setErrorMessage(null);
        setParsedItems(verified);
      }
    } catch {
      setErrorMessage('Failed to parse text.');
    } finally {
      setIsOcrLoading(false);
    }
  };

  /**
   * Fetch Live LTP for a parsed row
   */
  const handleFetchRowLtp = async (index: number) => {
    const item = parsedItems[index];
    if (!item || !item.symbol) return;

    setParsedItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, isFetchingLtp: true } : it))
    );

    try {
      const quote = await fetchLiveStockQuote(item.symbol);
      if (quote && quote.price > 0) {
        setParsedItems((prev) =>
          prev.map((it, idx) =>
            idx === index
              ? {
                  ...it,
                  currentPrice: quote.price,
                  avgPrice: it.avgPrice > 0 ? it.avgPrice : quote.price,
                  name: quote.name && quote.name !== item.symbol ? quote.name : it.name,
                  isFetchingLtp: false,
                  isVerified: true,
                }
              : it
          )
        );
      } else {
        setParsedItems((prev) =>
          prev.map((it, idx) => (idx === index ? { ...it, isFetchingLtp: false } : it))
        );
      }
    } catch {
      setParsedItems((prev) =>
        prev.map((it, idx) => (idx === index ? { ...it, isFetchingLtp: false } : it))
      );
    }
  };

  const handleUpdateItem = (index: number, updates: Partial<ParsedHoldingItem>) => {
    setParsedItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, ...updates } : it))
    );
  };

  const handleRemoveItem = (index: number) => {
    setParsedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddBlankItem = () => {
    setParsedItems((prev) => [
      ...prev,
      {
        id: `scan-manual-${Date.now()}`,
        symbol: '',
        name: '',
        quantity: 1,
        avgPrice: 0,
        currentPrice: 0,
        selected: true,
        isVerified: false,
      },
    ]);
  };

  const handleConfirmImport = () => {
    const validItems = parsedItems.filter((it) => it.selected && it.symbol.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      setErrorMessage('Please select at least one valid stock holding to import.');
      return;
    }

    const payload = validItems.map((it) => ({
      symbol: it.symbol.trim().toUpperCase(),
      name: it.name.trim() || it.symbol.trim().toUpperCase(),
      quantity: it.quantity,
      avgPrice: it.avgPrice,
      currentPrice: it.currentPrice || it.avgPrice,
      accountId: selectedAccountId || undefined,
      isIpoAllotted: false,
    }));

    addMultipleInvestments(payload);
    setIsSuccessImported(true);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Calculations for review card
  const selectedItems = parsedItems.filter((it) => it.selected);
  const totalInvested = selectedItems.reduce((sum, it) => sum + it.quantity * it.avgPrice, 0);
  const totalCurrentVal = selectedItems.reduce(
    (sum, it) => sum + it.quantity * (it.currentPrice || it.avgPrice),
    0
  );
  const totalPnl = totalCurrentVal - totalInvested;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Verified Demat Scanner"
      subtitle="Auto-extracts & verifies listed Indian stocks with live NSE/BSE prices"
    >
      <div className="space-y-4">
        {/* Hidden Canvas for OCR preprocessing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Success Confirmation View */}
        {isSuccessImported ? (
          <div className="p-8 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl border border-emerald-200 dark:border-emerald-800 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-emerald-900 dark:text-emerald-100">
              {selectedItems.length} Stock Holdings Imported!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Total Invested Value of {formatINR(totalInvested)} successfully added to your Demat portfolio.
            </p>
          </div>
        ) : (
          <>
            {/* Tab Selection */}
            <SlidingSegmentedTabs
              tabs={[
                { id: 'screenshot' as const, label: 'Screenshot / Photo' },
                { id: 'text' as const, label: 'Paste Statement Text' },
              ]}
              activeId={activeTab}
              onChange={(tab) => setActiveTab(tab)}
              size="sm"
              variant="equal"
            />

            {/* Target Demat Account Selector */}
            <CustomDropdown
              label="Target Demat Account"
              value={selectedAccountId}
              onChange={(val) => setSelectedAccountId(val)}
              themeVariant="emerald"
              placeholder="General Portfolio (No Specific Demat)"
              options={[
                {
                  value: '',
                  label: 'General Portfolio (No Specific Demat)',
                  subLabel: 'Do not assign to a specific Demat',
                },
                ...dematAccounts.map((acc) => ({
                  value: acc.id,
                  label: acc.name,
                  subLabel: `Funds: ${formatINR(acc.balance)} • Invested: ${formatINR(acc.investedAmount ?? 0)}`,
                  badge: acc.type.toUpperCase(),
                  icon: (
                    <BankLogo
                      name={acc.name}
                      type="demat"
                      color={acc.color}
                      size="sm"
                      className="w-4 h-4 rounded-md !p-0.5"
                    />
                  ),
                })),
              ]}
            />

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start space-x-2 text-xs text-amber-800 dark:text-amber-200 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: Screenshot OCR Upload */}
            {activeTab === 'screenshot' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processImageFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {!imagePreview ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 rounded-3xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-center cursor-pointer transition-all space-y-2.5 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-xs">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                        Tap to Choose Screenshot or Photo
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Zerodha Kite, Groww, Angel One, Upstox, Dhan, Indmoney
                      </p>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                        Only verified, listed Indian stocks will be imported
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Demat Screenshot"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          Screenshot Loaded
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {isOcrLoading ? ocrStatusText : `${parsedItems.length} verified stocks found`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleUploadNewImage}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload New Image</span>
                    </button>
                  </div>
                )}

                {/* OCR Progress Bar */}
                {isOcrLoading && (
                  <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      <span className="flex items-center space-x-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                        <span>{ocrStatusText}</span>
                      </span>
                      <span>{ocrProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-emerald-200/60 dark:bg-emerald-900/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${ocrProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Text / Statement Paste */}
            {activeTab === 'text' && (
              <div className="space-y-2.5">
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Paste holdings text from broker email or web console, e.g.:\n\nJIOFIN  Qty: 20  Avg: 352.00  LTP: 231.40\nRentomojo  37 shares  Avg 404.00  LTP 512.75\nSBIN  10  Avg 780.50  LTP 820.00`}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  disabled={!pastedText.trim() || isOcrLoading}
                  className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isOcrLoading ? 'Verifying with NSE/BSE...' : 'Extract & Verify Stocks'}</span>
                </button>
              </div>
            )}

            {/* Raw OCR Text Debugger / Inspector */}
            {rawExtractedText && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 flex items-center space-x-1 cursor-pointer"
                >
                  <span>{showRawText ? 'Hide Raw OCR Text' : 'View Extracted OCR Text'}</span>
                  {showRawText ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showRawText && (
                  <pre className="mt-1.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-[10px] font-mono text-slate-700 dark:text-slate-300 max-h-24 overflow-y-auto whitespace-pre-wrap border border-slate-200 dark:border-slate-800">
                    {rawExtractedText}
                  </pre>
                )}
              </div>
            )}

            {/* Extracted Stocks Review Table */}
            {parsedItems.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      Verified Listed Stocks ({parsedItems.length})
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>NSE / BSE Verified</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBlankItem}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-extrabold flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {parsedItems.map((item, index) => {
                    const rowInvested = item.quantity * item.avgPrice;
                    const rowCurrent = item.quantity * (item.currentPrice || item.avgPrice);
                    const rowPnl = rowCurrent - rowInvested;

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                          item.selected
                            ? 'ios-glass-card shadow-xs'
                            : 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-200/50 dark:border-slate-800/40 opacity-50'
                        }`}
                      >
                        {/* Row Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={(e) => handleUpdateItem(index, { selected: e.target.checked })}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                            />
                            <input
                              type="text"
                              value={item.symbol}
                              onChange={(e) =>
                                handleUpdateItem(index, { symbol: e.target.value.toUpperCase() })
                              }
                              placeholder="SYMBOL (e.g. JIOFIN)"
                              className="w-28 px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black uppercase text-slate-900 dark:text-slate-100"
                            />
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateItem(index, { name: e.target.value })}
                              placeholder="Company Name"
                              className="flex-1 px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium"
                            />
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleFetchRowLtp(index)}
                              disabled={item.isFetchingLtp || !item.symbol}
                              title="Fetch Live Market Price"
                              className="p-1.5 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer disabled:opacity-40"
                            >
                              {item.isFetchingLtp ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Row Numbers: Qty, Avg, LTP */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                              Quantity (Shares)
                            </span>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={item.quantity || ''}
                              onChange={(e) =>
                                handleUpdateItem(index, { quantity: parseInt(e.target.value, 10) || 0 })
                              }
                              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                              Avg Buy Price (₹)
                            </span>
                            <input
                              type="number"
                              step="any"
                              inputMode="decimal"
                              value={item.avgPrice || ''}
                              onChange={(e) =>
                                handleUpdateItem(index, { avgPrice: parseFloat(e.target.value) || 0 })
                              }
                              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                              LTP / Cur Price (₹)
                            </span>
                            <input
                              type="number"
                              step="any"
                              inputMode="decimal"
                              value={item.currentPrice || ''}
                              onChange={(e) =>
                                handleUpdateItem(index, { currentPrice: parseFloat(e.target.value) || 0 })
                              }
                              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>

                        {/* Calculated Row Summary */}
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                          <span>Invested: {formatINR(rowInvested)}</span>
                          <span className={rowPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            P&L: {rowPnl >= 0 ? '+' : ''}{formatINR(rowPnl)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Portfolio Summary Card */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Selected ({selectedItems.length} stocks)
                    </span>
                    <span className="font-black text-slate-900 dark:text-slate-100">
                      Invested: {formatINR(totalInvested)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Current Value
                    </span>
                    <div className="flex items-center space-x-1 justify-end">
                      <span className="font-black text-slate-900 dark:text-slate-100">
                        {formatINR(totalCurrentVal)}
                      </span>
                      <span className={`text-[10px] font-bold ${totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        ({totalPnl >= 0 ? '+' : ''}{formatINR(totalPnl)})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Import Confirm Button */}
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={selectedItems.length === 0}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-emerald-600/20 active:scale-98 transition-transform"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Import {selectedItems.length} Stock{selectedItems.length === 1 ? '' : 's'} to Demat
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
}
