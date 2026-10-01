import { ParsedSmsTransaction, SmsMessageType, Account } from '../types/finance';

/**
 * Ultra-precise offline regex parser for Indian Bank SMS, Push Notifications, UPI Mandates, and ASBA IPO Blocks
 */

export interface BankMeta {
  key: string;
  name: string; // Canonical display name e.g. "HDFC Bank", "State Bank of India"
  shortName: string; // e.g. "HDFC", "SBI", "ICICI"
  keywords: string[]; // text patterns & sender headers
  packageNames?: string[];
}

export const KNOWN_INDIAN_BANKS: BankMeta[] = [
  {
    key: 'sbi',
    name: 'State Bank of India',
    shortName: 'SBI',
    keywords: ['sbi', 'sbin', 'sbiinb', 'sbipsg', 'sbipay', 'sbmsms', 'sbicrd', 'sbicard', 'state bank of india', 'state bank', 'sbiupi'],
    packageNames: ['com.sbi.lotusintouch', 'com.sbi.upi'],
  },
  {
    key: 'hdfc',
    name: 'HDFC Bank',
    shortName: 'HDFC',
    keywords: ['hdfc', 'hdfcbk', 'hdfccc', 'hdfcam', 'hdfclt', 'hdfc bank'],
    packageNames: ['com.hdfcbank.android', 'com.snapwork.hdfc'],
  },
  {
    key: 'icici',
    name: 'ICICI Bank',
    shortName: 'ICICI',
    keywords: ['icici', 'icicib', 'icicip', 'icicic', 'icicit', 'icici bank', 'imobile', 'icicidirect'],
    packageNames: ['com.csam.icici.bank.imobile', 'com.icici.direct'],
  },
  {
    key: 'axis',
    name: 'Axis Bank',
    shortName: 'Axis',
    keywords: ['axis', 'axisbk', 'axisin', 'axismb', 'axis bank', 'axis pay'],
    packageNames: ['com.axis.mobile', 'com.upi.axispay'],
  },
  {
    key: 'kotak',
    name: 'Kotak Mahindra Bank',
    shortName: 'Kotak',
    keywords: ['kotak', 'kotakb', 'kmbl', 'kmb', 'kotak mahindra', 'kotak 811', 'kotak neo'],
    packageNames: ['com.msf.kbank.mobile', 'com.kotak.neo'],
  },
  {
    key: 'pnb',
    name: 'Punjab National Bank',
    shortName: 'PNB',
    keywords: ['pnb', 'pnbsms', 'punjab national', 'punjab national bank'],
    packageNames: ['com.pnb.pnbone'],
  },
  {
    key: 'bob',
    name: 'Bank of Baroda',
    shortName: 'Bank of Baroda',
    keywords: ['bob', 'bobtxn', 'bobbnk', 'bank of baroda', 'baroda'],
    packageNames: ['com.bankofbaroda.mconnect', 'com.bob.upi'],
  },
  {
    key: 'canara',
    name: 'Canara Bank',
    shortName: 'Canara',
    keywords: ['canara', 'canbnk', 'cnrb', 'canara bank'],
    packageNames: ['com.canarabank.mobility', 'com.canarabank.canaraupi'],
  },
  {
    key: 'union',
    name: 'Union Bank of India',
    shortName: 'Union Bank',
    keywords: ['union', 'unionb', 'ubin', 'union bank of india', 'union bank'],
    packageNames: ['com.infrasofttech.uboi'],
  },
  {
    key: 'idfc',
    name: 'IDFC FIRST Bank',
    shortName: 'IDFC FIRST',
    keywords: ['idfc', 'idfcft', 'idfcfb', 'idfcbk', 'idfc first', 'idfc first bank', 'idfcfirst'],
    packageNames: ['com.idfcfirstbank.optimus'],
  },
  {
    key: 'indusind',
    name: 'IndusInd Bank',
    shortName: 'IndusInd',
    keywords: ['indus', 'indusb', 'indusind', 'indusind bank'],
    packageNames: ['com.indusind.moba'],
  },
  {
    key: 'federal',
    name: 'Federal Bank',
    shortName: 'Federal Bank',
    keywords: ['federal', 'fedbnk', 'fedbk', 'federal bank', 'fedmobile'],
    packageNames: ['fedmobile.federalbank.co.in'],
  },
  {
    key: 'yes',
    name: 'Yes Bank',
    shortName: 'Yes Bank',
    keywords: ['yes', 'yesbnk', 'yesbk', 'yes bank'],
    packageNames: ['com.yesbank'],
  },
  {
    key: 'rbl',
    name: 'RBL Bank',
    shortName: 'RBL',
    keywords: ['rbl', 'rblbnk', 'ratnakar', 'rbl bank'],
    packageNames: ['com.rblbank.mobank'],
  },
  {
    key: 'bandhan',
    name: 'Bandhan Bank',
    shortName: 'Bandhan',
    keywords: ['bandhan', 'bndhan', 'bandhan bank'],
    packageNames: ['com.bandhan.mBank'],
  },
  {
    key: 'aubank',
    name: 'AU Small Finance Bank',
    shortName: 'AU Bank',
    keywords: ['au bank', 'aubank', 'ausfb', 'au small finance', 'au0101'],
    packageNames: ['com.aubank.au0101'],
  },
  {
    key: 'equitas',
    name: 'Equitas Small Finance Bank',
    shortName: 'Equitas',
    keywords: ['equitas', 'equtas', 'equitas bank'],
  },
  {
    key: 'ujjivan',
    name: 'Ujjivan Small Finance Bank',
    shortName: 'Ujjivan',
    keywords: ['ujjivan', 'ujjvn', 'ujjivan bank'],
  },
  {
    key: 'boi',
    name: 'Bank of India',
    shortName: 'BOI',
    keywords: ['boi', 'boitxn', 'bank of india'],
    packageNames: ['com.bankofindia.boi'],
  },
  {
    key: 'cbi',
    name: 'Central Bank of India',
    shortName: 'Central Bank',
    keywords: ['cbi', 'central bank', 'central bank of india'],
  },
  {
    key: 'iob',
    name: 'Indian Overseas Bank',
    shortName: 'IOB',
    keywords: ['iob', 'indian overseas bank', 'iobsms'],
  },
  {
    key: 'uco',
    name: 'UCO Bank',
    shortName: 'UCO Bank',
    keywords: ['uco', 'ucobank', 'uco bank'],
  },
  {
    key: 'paytm',
    name: 'Paytm Payments Bank',
    shortName: 'Paytm',
    keywords: ['paytm', 'pytm', 'paytmb', 'paytm payments bank', 'paytm bank'],
    packageNames: ['net.one97.paytm'],
  },
  {
    key: 'airtel',
    name: 'Airtel Payments Bank',
    shortName: 'Airtel Bank',
    keywords: ['airtel', 'artl', 'airtel payments', 'airtel money', 'airtel bank'],
    packageNames: ['com.myairtelapp'],
  },
  {
    key: 'ippb',
    name: 'India Post Payments Bank',
    shortName: 'IPPB',
    keywords: ['ippb', 'indiapost', 'india post', 'post bank'],
    packageNames: ['com.fss.ippb'],
  },
  {
    key: 'jupiter',
    name: 'Jupiter',
    shortName: 'Jupiter',
    keywords: ['jupiter', 'jupiter money'],
    packageNames: ['money.jupiter'],
  },
  {
    key: 'fimoney',
    name: 'Fi Money',
    shortName: 'Fi Money',
    keywords: ['fi money', 'fimoney', 'epicl'],
    packageNames: ['co.fi.money'],
  },
  {
    key: 'gpay',
    name: 'Google Pay',
    shortName: 'Google Pay',
    keywords: ['gpay', 'google pay', 'googlepay', 'google'],
    packageNames: ['com.google.android.apps.nbu.paisa.user'],
  },
  {
    key: 'phonepe',
    name: 'PhonePe',
    shortName: 'PhonePe',
    keywords: ['phonepe', 'phnpe', 'phone pe'],
    packageNames: ['com.phonepe.app'],
  },
  {
    key: 'cred',
    name: 'CRED',
    shortName: 'CRED',
    keywords: ['cred', 'dreamplug'],
    packageNames: ['com.dreamplug.androidapp'],
  },
  {
    key: 'bhim',
    name: 'BHIM UPI',
    shortName: 'BHIM',
    keywords: ['bhim', 'bhim upi', 'npci'],
    packageNames: ['in.org.npci.upiapp'],
  },
  {
    key: 'navi',
    name: 'Navi UPI',
    shortName: 'Navi',
    keywords: ['navi', 'navi upi'],
    packageNames: ['com.naviapp'],
  },
  {
    key: 'slice',
    name: 'Slice',
    shortName: 'Slice',
    keywords: ['slice', 'slicepay'],
    packageNames: ['indwin.c3.shareapp'],
  },
  {
    key: 'zerodha',
    name: 'Zerodha',
    shortName: 'Zerodha',
    keywords: ['zerodha', 'kite'],
    packageNames: ['com.zerodha.kite3'],
  },
  {
    key: 'groww',
    name: 'Groww',
    shortName: 'Groww',
    keywords: ['groww'],
    packageNames: ['com.nextbillion.groww'],
  },
  {
    key: 'angelone',
    name: 'Angel One',
    shortName: 'Angel One',
    keywords: ['angel', 'angel one', 'angelone', 'angelbroking'],
    packageNames: ['com.msf.angelmobile'],
  },
  {
    key: 'upstox',
    name: 'Upstox',
    shortName: 'Upstox',
    keywords: ['upstox', 'rksv'],
    packageNames: ['in.upstox.app'],
  },
  {
    key: 'dhan',
    name: 'Dhan',
    shortName: 'Dhan',
    keywords: ['dhan', 'raise'],
    packageNames: ['com.dhan.live'],
  },
  {
    key: '5paisa',
    name: '5Paisa',
    shortName: '5Paisa',
    keywords: ['5paisa'],
    packageNames: ['com.fivepaisa.trade'],
  },
];

const AMOUNT_REGEX = /(?:rs\.?|inr|amt|inr\.|\u20B9|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i;
const AMOUNT_FALLBACK_REGEX = /(?:debited|credited|blocked|unblocked|refunded|spent|paid|received|sent|transferred|withdrawn|deposited|mandate|lien)\s*(?:for|by|of)?\s*(?:rs\.?|inr|\u20B9|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i;
const AMOUNT_STANDALONE = /(?:^|\s)(?:rs\.?|inr|\u20B9|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i;
const ACCOUNT_REGEX = /(?:a\/c|acct|account|card|ending|ac|a\/c\s+no|ac\s+no)\s*(?:no\.?)?\s*[*XxNn-]*([0-9]{3,6})/i;
const AVAIL_BAL_REGEX = /(?:bal|avl bal|avail bal|available balance|balance is|bal:|total bal|total balance)\s*(?:is)?\s*(?:rs\.?|inr|\u20B9|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i;
const REF_REGEX = /(?:ref(?:\s+no)?|rrn|utr|txn(?:\s+id)?|upi\s+ref|urn)\s*[:#-]?\s*([A-Za-z0-9]{6,25})/i;

// Mandate & IPO Keywords
const MANDATE_INDICATORS = /(?:mandate|asba|lien|autopay|ipo|allotment|public\s+issue|bid)/i;
const RELEASE_INDICATORS = /(?:unblock|unblocked|release|released|revoke|revoked|cancel|cancelled|canceled|expired|reject|rejected|decline|declined)/i;
const BLOCK_INDICATORS = /(?:block|blocked|create|created|request received|requested|authorize|authorized|approve|approved|register|registered|marked|place|placed|accept|accepted|apply|applied|initiate|initiated|schedule|scheduled|set|hold|lien marked|funds blocked|amount blocked|success|successful)/i;

const IPO_COMPANY_PATTERNS = [
  /(?:towards|for|in|from|of)\s+([A-Za-z0-9\s&.-]+?)(?:\s+ipo|\s+ltd|\s+limited|\s+pvt|\s+public\s+issue|\s+application|\s+mandate|\s+on\s+a\/c|\s+ref|\s+urn|\s+txn|\.)/i,
  /(?:towards|for|from|in)\s+([A-Za-z0-9\s&.-]{3,40}?)(?:\s+for\s+(?:rs\.?|inr|₹)|\s+of\s+(?:rs\.?|inr|₹)|\s+on\s+a\/c|\s+ref|\.|\,)/i,
];

function cleanAmount(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Detect the exact Bank or Financial App from sender header, notification package, or message body
 */
export function detectBankInfo(sender: string = '', rawText: string = '', packageName?: string): {
  bankName: string;
  shortName: string;
  matchedBankMeta?: BankMeta;
} {
  const senderUpper = sender.toUpperCase();
  const textLower = rawText.toLowerCase();
  const pkgLower = (packageName || '').toLowerCase();

  // 1. Match by Notification Package Name
  if (pkgLower) {
    const pkgMatch = KNOWN_INDIAN_BANKS.find(
      (b) => b.packageNames && b.packageNames.some((p) => pkgLower.includes(p.toLowerCase()))
    );
    if (pkgMatch) {
      return { bankName: pkgMatch.name, shortName: pkgMatch.shortName, matchedBankMeta: pkgMatch };
    }
  }

  // 2. Match by SMS Sender Header (e.g. "VK-HDFCBK", "AX-SBIINB", "BW-ICICIB", "JM-KOTAKB")
  if (senderUpper) {
    for (const bank of KNOWN_INDIAN_BANKS) {
      for (const kw of bank.keywords) {
        const kwUpper = kw.toUpperCase();
        if (senderUpper.includes(kwUpper)) {
          return { bankName: bank.name, shortName: bank.shortName, matchedBankMeta: bank };
        }
      }
    }
  }

  // 3. Match by Message Body Keywords (e.g. "in your HDFC Bank A/c", "SBI UPI:", "Axis Bank Alert")
  for (const bank of KNOWN_INDIAN_BANKS) {
    for (const kw of bank.keywords) {
      if (textLower.includes(kw.toLowerCase())) {
        return { bankName: bank.name, shortName: bank.shortName, matchedBankMeta: bank };
      }
    }
  }

  // Fallback if not recognized
  const fallbackName = sender ? sender.replace(/^[A-Z]{2}-/i, '') : 'Bank Account';
  return { bankName: fallbackName, shortName: fallbackName };
}

/**
 * Main parser: transforms raw SMS text / Push Notifications into verified ParsedSmsTransaction objects
 */
export function parseBankSms(
  rawText: string,
  sender: string = '',
  dateStr?: string,
  existingAccounts: Account[] = [],
  options?: { source?: 'sms' | 'notification' | 'merged'; packageName?: string }
): ParsedSmsTransaction | null {
  const text = rawText.trim();
  if (!text) return null;

  const lower = text.toLowerCase();

  // 1. Determine Message Type with strict Mandate priority
  let type: SmsMessageType | null = null;
  const hasMandateOrIPO = MANDATE_INDICATORS.test(text);

  // Check Mandate Release / Revoke
  if (hasMandateOrIPO && RELEASE_INDICATORS.test(text)) {
    type = 'IPO_RELEASED';
  }
  // Check Mandate / IPO Block
  else if (
    (hasMandateOrIPO && (BLOCK_INDICATORS.test(text) || lower.includes('mandate') || lower.includes('lien') || lower.includes('asba'))) ||
    lower.includes('amount blocked') ||
    lower.includes('funds blocked') ||
    lower.includes('lien marked') ||
    lower.includes('mandate request') ||
    lower.includes('mandate created')
  ) {
    type = 'IPO_BLOCKED';
  }
  // General Credit
  else if (
    !hasMandateOrIPO &&
    (lower.includes('credited') ||
      lower.includes('deposited') ||
      lower.includes('received from') ||
      lower.includes('received in') ||
      lower.includes('received via') ||
      lower.includes('credited by') ||
      lower.includes('credited with') ||
      lower.includes('cashback') ||
      lower.includes('refund'))
  ) {
    type = 'CREDIT';
  }
  // General Debit
  else if (
    !hasMandateOrIPO &&
    (lower.includes('debited') ||
      lower.includes('spent') ||
      lower.includes('withdrawn') ||
      lower.includes('paid to') ||
      lower.includes('paid via') ||
      lower.includes('paid at') ||
      lower.includes('paid ') ||
      lower.includes('sent to') ||
      lower.includes('transferred to') ||
      lower.includes('vpa') ||
      lower.includes('pos txn'))
  ) {
    type = 'DEBIT';
  }
  // Balance Query
  else if (lower.includes('avail bal') || lower.includes('available balance') || lower.includes('balance is')) {
    type = 'BALANCE_UPDATE';
  }

  // Fallback check
  if (!type) {
    if (lower.includes('credited') || lower.includes('received')) {
      type = 'CREDIT';
    } else if (lower.includes('debited') || lower.includes('spent') || lower.includes('paid')) {
      type = 'DEBIT';
    } else {
      return null; // Not a recognized financial transaction
    }
  }

  // 2. Extract Amount
  let amount = 0;
  const amtMatch = text.match(AMOUNT_REGEX) || text.match(AMOUNT_FALLBACK_REGEX) || text.match(AMOUNT_STANDALONE);
  if (amtMatch && amtMatch[1]) {
    amount = cleanAmount(amtMatch[1]);
  }

  if (amount <= 0 && type !== 'BALANCE_UPDATE') {
    return null;
  }

  // 3. Extract Account Number
  let accountNumber = '';
  const acctMatch = text.match(ACCOUNT_REGEX);
  if (acctMatch && acctMatch[1]) {
    accountNumber = acctMatch[1];
  }

  // 4. Extract Reference / UTR / URN / UPI Ref
  let mandateRef = '';
  const refMatch = text.match(REF_REGEX);
  if (refMatch && refMatch[1]) {
    mandateRef = refMatch[1].trim().toUpperCase();
  }

  // 5. Extract Available Balance
  let availableBalance: number | undefined;
  const balMatch = text.match(AVAIL_BAL_REGEX);
  if (balMatch && balMatch[1]) {
    const parsedBal = cleanAmount(balMatch[1]);
    if (parsedBal > 0) {
      availableBalance = parsedBal;
    }
  }

  // 6. Extract IPO Company or Merchant Name
  let merchantOrSender = '';
  let ipoName = '';

  if (type === 'IPO_BLOCKED' || type === 'IPO_RELEASED') {
    for (const pattern of IPO_COMPANY_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim();
        if (!candidate.match(/^(rs|inr|the|your|a\/c|account|bank|upi|mandate)$/i)) {
          ipoName = candidate.toUpperCase();
          break;
        }
      }
    }
    if (!ipoName) {
      const nearIpoMatch = text.match(/([A-Za-z0-9\s&.-]{3,30})\s+IPO/i);
      if (nearIpoMatch && nearIpoMatch[1]) {
        ipoName = nearIpoMatch[1].trim().toUpperCase();
      } else {
        ipoName = 'IPO Mandate';
      }
    }
    merchantOrSender = ipoName;
  } else {
    const infoMatch = text.match(/(?:to|vpa|info|trf to|at|ref|from)\s+([A-Za-z0-9@._\s-]+?)(?:\s+on|\s+avl|\s+bal|\s+ref|\.|\,)/i);
    if (infoMatch && infoMatch[1]) {
      merchantOrSender = infoMatch[1].trim();
    } else {
      merchantOrSender = type === 'CREDIT' ? 'Direct Credit' : 'Payment / Purchase';
    }
  }

  // 7. Detect Bank Name & Short Name
  const bankInfo = detectBankInfo(sender, text, options?.packageName);
  const detectedBankName = bankInfo.bankName;

  // 8. Smart Multi-Bank Account Matching from user's added accounts
  let suggestedAccountId: string | undefined;
  let suggestedAccountName: string | undefined;

  if (existingAccounts.length > 0) {
    // 1st Priority: Match by exact Account Number suffix (last 3-6 digits)
    if (accountNumber) {
      const cleanNum = accountNumber.replace(/\D/g, '');
      const numMatch = existingAccounts.find((acc) => {
        const aNum = (acc.accountNumber || '').replace(/\D/g, '');
        const aNotes = (acc.notes || '').replace(/\D/g, '');
        const aName = acc.name.replace(/\D/g, '');
        return (aNum && aNum.endsWith(cleanNum)) || (aNotes && aNotes.endsWith(cleanNum)) || (aName && aName.endsWith(cleanNum));
      });
      if (numMatch) {
        suggestedAccountId = numMatch.id;
        suggestedAccountName = numMatch.name;
      }
    }

    // 2nd Priority: Match by Detected Bank Name & Aliases
    if (!suggestedAccountId && bankInfo.matchedBankMeta) {
      const bankMeta = bankInfo.matchedBankMeta;
      const bankMatch = existingAccounts.find((acc) => {
        const accNameUpper = acc.name.toUpperCase();
        const accNotesUpper = (acc.notes || '').toUpperCase();
        return bankMeta.keywords.some(
          (kw) => accNameUpper.includes(kw.toUpperCase()) || accNotesUpper.includes(kw.toUpperCase())
        );
      });
      if (bankMatch) {
        suggestedAccountId = bankMatch.id;
        suggestedAccountName = bankMatch.name;
      }
    }

    // 3rd Priority: Fallback to first active Bank or Wallet account
    if (!suggestedAccountId) {
      const firstBank = existingAccounts.find((a) => a.type === 'bank' || a.type === 'wallet') || existingAccounts[0];
      if (firstBank) {
        suggestedAccountId = firstBank.id;
        suggestedAccountName = firstBank.name;
      }
    }
  }

  const id = `sms_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const date = dateStr || new Date().toISOString();
  const source = options?.source || (sender.startsWith('com.') ? 'notification' : 'sms');

  return {
    id,
    rawText: text,
    sender,
    date,
    type,
    amount,
    bankName: detectedBankName,
    source,
    accountNumber: accountNumber ? `XX${accountNumber}` : undefined,
    merchantOrSender,
    availableBalance,
    ipoName: ipoName || undefined,
    mandateRef: mandateRef || undefined,
    suggestedAccountId,
    suggestedAccountName,
    selected: true,
  };
}

/**
 * Smart deduplicator & comparator: compares all messages across SMS and Notifications,
 * merges duplicate alerts into ONE clean entry with the richest details.
 */
export function deduplicateParsedSms(items: ParsedSmsTransaction[]): ParsedSmsTransaction[] {
  const uniqueItems: ParsedSmsTransaction[] = [];

  for (const item of items) {
    if (!item || item.amount <= 0) continue;

    const itemTime = new Date(item.date).getTime() || Date.now();
    const refNo = (item.mandateRef || '').toUpperCase();

    // Check against items already in the unique list
    const duplicateIndex = uniqueItems.findIndex((u) => {
      // 1. Identical raw text
      if (u.rawText.trim() === item.rawText.trim()) return true;

      // 2. Same non-empty Reference / UTR / URN / UPI Ref
      if (refNo && u.mandateRef && u.mandateRef.toUpperCase() === refNo) return true;

      // 3. Same Amount + Same Type + Same Bank/Account within a 5-minute time window
      const uTime = new Date(u.date).getTime() || 0;
      const isCloseTime = Math.abs(uTime - itemTime) < 5 * 60 * 1000;
      if (
        isCloseTime &&
        Math.abs(u.amount - item.amount) < 0.01 &&
        u.type === item.type
      ) {
        // Same account number or matched account or same bank
        if (
          (u.accountNumber && item.accountNumber && u.accountNumber === item.accountNumber) ||
          (u.suggestedAccountId && item.suggestedAccountId && u.suggestedAccountId === item.suggestedAccountId) ||
          (u.bankName && item.bankName && u.bankName === item.bankName)
        ) {
          return true;
        }
      }

      // 4. Same Amount + Same IPO Name for Mandates within 5 minutes
      if (
        isCloseTime &&
        item.type === 'IPO_BLOCKED' &&
        u.type === 'IPO_BLOCKED' &&
        Math.abs(u.amount - item.amount) < 0.01 &&
        item.ipoName &&
        u.ipoName &&
        (u.ipoName.includes(item.ipoName) || item.ipoName.includes(u.ipoName))
      ) {
        return true;
      }

      return false;
    });

    if (duplicateIndex >= 0) {
      // Merge into existing item to preserve the richest details from both SMS and Notification!
      const existing = uniqueItems[duplicateIndex];
      uniqueItems[duplicateIndex] = {
        ...existing,
        // Mark as merged if sources differ
        source: existing.source !== item.source ? 'merged' : existing.source,
        // Preserve richest details
        bankName: existing.bankName || item.bankName,
        accountNumber: existing.accountNumber || item.accountNumber,
        ipoName: existing.ipoName || item.ipoName,
        merchantOrSender: existing.merchantOrSender || item.merchantOrSender,
        mandateRef: existing.mandateRef || item.mandateRef,
        availableBalance: existing.availableBalance ?? item.availableBalance,
        suggestedAccountId: existing.suggestedAccountId || item.suggestedAccountId,
        suggestedAccountName: existing.suggestedAccountName || item.suggestedAccountName,
      };
    } else {
      uniqueItems.push(item);
    }
  }

  return uniqueItems;
}

export function parseMultipleSms(
  smsList: Array<{ body: string; address?: string; date?: number | string; source?: 'sms' | 'notification'; packageName?: string }>,
  existingAccounts: Account[] = []
): ParsedSmsTransaction[] {
  const parsedList: ParsedSmsTransaction[] = [];
  const seenTexts = new Set<string>();

  for (const item of smsList) {
    const raw = item.body || '';
    if (!raw || seenTexts.has(raw)) continue;
    seenTexts.add(raw);

    const dateStr = item.date
      ? typeof item.date === 'number'
        ? new Date(item.date).toISOString()
        : item.date
      : undefined;

    const parsed = parseBankSms(
      raw,
      item.address || '',
      dateStr,
      existingAccounts,
      { source: item.source, packageName: item.packageName }
    );
    if (parsed) {
      parsedList.push(parsed);
    }
  }

  return deduplicateParsedSms(parsedList);
}
