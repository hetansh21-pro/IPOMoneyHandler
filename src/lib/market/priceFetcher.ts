'use client';

export interface StockQuote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  lastUpdated: string;
  currency: string;
  source?: string;
}

// Extensive alias dictionary for Indian stocks and common informal symbols
export const INDIAN_STOCK_ALIASES: Record<string, string> = {
  // Top Banking & Financials
  SBI: 'SBIN.NS',
  SBIN: 'SBIN.NS',
  'STATE BANK OF INDIA': 'SBIN.NS',
  'STATE BANK': 'SBIN.NS',
  HDFC: 'HDFCBANK.NS',
  'HDFC BANK': 'HDFCBANK.NS',
  HDFCBANK: 'HDFCBANK.NS',
  ICICI: 'ICICIBANK.NS',
  'ICICI BANK': 'ICICIBANK.NS',
  ICICIBANK: 'ICICIBANK.NS',
  KOTAK: 'KOTAKBANK.NS',
  'KOTAK BANK': 'KOTAKBANK.NS',
  KOTAKBANK: 'KOTAKBANK.NS',
  AXIS: 'AXISBANK.NS',
  'AXIS BANK': 'AXISBANK.NS',
  AXISBANK: 'AXISBANK.NS',
  INDUSIND: 'INDUSINDBK.NS',
  'INDUSIND BANK': 'INDUSINDBK.NS',
  INDUSINDBK: 'INDUSINDBK.NS',
  BAJAJFINANCE: 'BAJFINANCE.NS',
  'BAJAJ FINANCE': 'BAJFINANCE.NS',
  BAJFINANCE: 'BAJFINANCE.NS',
  BAJAJFINSV: 'BAJAJFINSV.NS',
  'BAJAJ FINSERV': 'BAJAJFINSV.NS',
  BAJAJHLDNG: 'BAJAJHLDNG.NS',
  BAJAJHOUSING: 'BAJAJHFL.NS',
  'BAJAJ HOUSING': 'BAJAJHFL.NS',
  BAJAJHFL: 'BAJAJHFL.NS',
  JIOFIN: 'JIOFIN.NS',
  'JIO FINANCIAL': 'JIOFIN.NS',
  JFSL: 'JIOFIN.NS',
  PFC: 'PFC.NS',
  REC: 'RECLTD.NS',
  RECLTD: 'RECLTD.NS',
  IREDA: 'IREDA.NS',
  IRFC: 'IRFC.NS',
  'INDIAN RAILWAY FINANCE': 'IRFC.NS',
  YESBANK: 'YESBANK.NS',
  'YES BANK': 'YESBANK.NS',
  PNB: 'PNB.NS',
  'PUNJAB NATIONAL BANK': 'PNB.NS',
  BANKBARODA: 'BANKBARODA.NS',
  'BANK OF BARODA': 'BANKBARODA.NS',
  CANBK: 'CANBK.NS',
  'CANARA BANK': 'CANBK.NS',
  UNIONBANK: 'UNIONBANK.NS',
  'UNION BANK': 'UNIONBANK.NS',
  INDIANB: 'INDIANB.NS',
  'INDIAN BANK': 'INDIANB.NS',
  IDFCFIRSTB: 'IDFCFIRSTB.NS',
  'IDFC FIRST BANK': 'IDFCFIRSTB.NS',
  'IDFC FIRST': 'IDFCFIRSTB.NS',
  FEDERALBNK: 'FEDERALBNK.NS',
  'FEDERAL BANK': 'FEDERALBNK.NS',
  AUBANK: 'AUBANK.NS',
  'AU SMALL FINANCE': 'AUBANK.NS',
  BANDHANBNK: 'BANDHANBNK.NS',
  'BANDHAN BANK': 'BANDHANBNK.NS',
  MANBA: 'MANBA.NS',
  'MANBA FINANCE': 'MANBA.NS',
  NORTHARC: 'NORTHARC.NS',
  'NORTHERN ARC': 'NORTHARC.NS',

  // Tech & IT
  TCS: 'TCS.NS',
  'TATA CONSULTANCY': 'TCS.NS',
  'TATA CONSULTANCY SERVICES': 'TCS.NS',
  INFY: 'INFY.NS',
  INFOSYS: 'INFY.NS',
  'INFOSYS LIMITED': 'INFY.NS',
  WIPRO: 'WIPRO.NS',
  'WIPRO LIMITED': 'WIPRO.NS',
  HCLTECH: 'HCLTECH.NS',
  'HCL TECH': 'HCLTECH.NS',
  'HCL TECHNOLOGIES': 'HCLTECH.NS',
  TECHM: 'TECHM.NS',
  'TECH MAHINDRA': 'TECHM.NS',
  LTIM: 'LTIM.NS',
  'LTIMINDTREE': 'LTIM.NS',
  KPITTECH: 'KPITTECH.NS',
  'KPIT TECH': 'KPITTECH.NS',
  PERSISTENT: 'PERSISTENT.NS',
  'PERSISTENT SYSTEMS': 'PERSISTENT.NS',
  COFORGE: 'COFORGE.NS',
  TATAELXSI: 'TATAELXSI.NS',
  'TATA ELXSI': 'TATAELXSI.NS',
  MPHASIS: 'MPHASIS.NS',
  CYIENT: 'CYIENT.NS',
  ORCL: 'OFSS.NS',
  OFSS: 'OFSS.NS',
  'ORACLE FINANCIAL': 'OFSS.NS',

  // Conglomerates, Energy & Auto
  RELIANCE: 'RELIANCE.NS',
  RIL: 'RELIANCE.NS',
  'RELIANCE IND': 'RELIANCE.NS',
  'RELIANCE INDUSTRIES': 'RELIANCE.NS',
  TATAMOTORS: 'TATAMOTORS.NS',
  'TATA MOTORS': 'TATAMOTORS.NS',
  'TATA MOTOR': 'TATAMOTORS.NS',
  TATASTEEL: 'TATASTEEL.NS',
  'TATA STEEL': 'TATASTEEL.NS',
  TATAPOWER: 'TATAPOWER.NS',
  'TATA POWER': 'TATAPOWER.NS',
  TATACONSUM: 'TATACONSUM.NS',
  'TATA CONSUMER': 'TATACONSUM.NS',
  'TATA CONSUMER PRODUCTS': 'TATACONSUM.NS',
  TITAN: 'TITAN.NS',
  'TITAN COMPANY': 'TITAN.NS',
  LT: 'LT.NS',
  'L&T': 'LT.NS',
  'LARSEN': 'LT.NS',
  'LARSEN & TOUBRO': 'LT.NS',
  MM: 'M&M.NS',
  'M&M': 'M&M.NS',
  'MAHINDRA': 'M&M.NS',
  'MAHINDRA & MAHINDRA': 'M&M.NS',
  MARUTI: 'MARUTI.NS',
  'MARUTI SUZUKI': 'MARUTI.NS',
  HYUNDAI: 'HYUNDAI.NS',
  BAJAJ_AUTO: 'BAJAJ-AUTO.NS',
  'BAJAJ AUTO': 'BAJAJ-AUTO.NS',
  'BAJAJ-AUTO': 'BAJAJ-AUTO.NS',
  EICHERMOT: 'EICHERMOT.NS',
  'EICHER MOTORS': 'EICHERMOT.NS',
  'ROYAL ENFIELD': 'EICHERMOT.NS',
  HEROMOTOCO: 'HEROMOTOCO.NS',
  'HERO MOTOCORP': 'HEROMOTOCO.NS',
  TVSMOTOR: 'TVSMOTOR.NS',
  'TVS MOTOR': 'TVSMOTOR.NS',
  BHARATFORG: 'BHARATFORG.NS',
  'BHARAT FORGE': 'BHARATFORG.NS',
  SONACOMS: 'SONACOMS.NS',
  MOTHERSON: 'MOTHERSON.NS',
  'SAMVARDHANA MOTHERSON': 'MOTHERSON.NS',
  OLAELEC: 'OLAELEC.NS',
  'OLA ELECTRIC': 'OLAELEC.NS',

  // Power, Energy, Metals & Mining
  ONGC: 'ONGC.NS',
  'OIL AND NATURAL GAS': 'ONGC.NS',
  NTPC: 'NTPC.NS',
  'NTPC GREEN': 'NTPCGREEN.NS',
  POWERGRID: 'POWERGRID.NS',
  'POWER GRID': 'POWERGRID.NS',
  COALINDIA: 'COALINDIA.NS',
  'COAL INDIA': 'COALINDIA.NS',
  IOC: 'IOC.NS',
  'INDIAN OIL': 'IOC.NS',
  BPCL: 'BPCL.NS',
  'BHARAT PETROLEUM': 'BPCL.NS',
  HPCL: 'HINDPETRO.NS',
  HINDPETRO: 'HINDPETRO.NS',
  'HINDUSTAN PETROLEUM': 'HINDPETRO.NS',
  GAIL: 'GAIL.NS',
  'GAIL INDIA': 'GAIL.NS',
  PETRONET: 'PETRONET.NS',
  OIL: 'OIL.NS',
  'OIL INDIA': 'OIL.NS',
  ADANIENT: 'ADANIENT.NS',
  'ADANI ENT': 'ADANIENT.NS',
  'ADANI ENTERPRISES': 'ADANIENT.NS',
  ADANIPORTS: 'ADANIPORTS.NS',
  'ADANI PORTS': 'ADANIPORTS.NS',
  ADANIGREEN: 'ADANIGREEN.NS',
  'ADANI GREEN': 'ADANIGREEN.NS',
  ADANIPOWER: 'ADANIPOWER.NS',
  'ADANI POWER': 'ADANIPOWER.NS',
  ADANIENSOL: 'ADANIENSOL.NS',
  'ADANI ENERGY': 'ADANIENSOL.NS',
  ATGL: 'ATGL.NS',
  'ADANI TOTAL GAS': 'ATGL.NS',
  NHPC: 'NHPC.NS',
  SJVN: 'SJVN.NS',
  SUZLON: 'SUZLON.NS',
  'SUZLON ENERGY': 'SUZLON.NS',
  PREMIERENE: 'PREMIERENE.NS',
  'PREMIER ENERGIES': 'PREMIERENE.NS',
  JSWSTEEL: 'JSWSTEEL.NS',
  'JSW STEEL': 'JSWSTEEL.NS',
  SAIL: 'SAIL.NS',
  'STEEL AUTHORITY': 'SAIL.NS',
  JINDALSTEL: 'JINDALSTEL.NS',
  'JINDAL STEEL': 'JINDALSTEL.NS',
  HINDALCO: 'HINDALCO.NS',
  VEDL: 'VEDL.NS',
  'VEDANTA': 'VEDL.NS',
  NMDC: 'NMDC.NS',
  NATIONALUM: 'NATIONALUM.NS',
  NALCO: 'NATIONALUM.NS',

  // Consumer, FMCG & Telecom
  ITC: 'ITC.NS',
  'ITC LIMITED': 'ITC.NS',
  'ITC LTD': 'ITC.NS',
  HINDUNILVR: 'HINDUNILVR.NS',
  HUL: 'HINDUNILVR.NS',
  'HINDUSTAN UNILEVER': 'HINDUNILVR.NS',
  NESTLEIND: 'NESTLEIND.NS',
  'NESTLE': 'NESTLEIND.NS',
  'NESTLE INDIA': 'NESTLEIND.NS',
  BRITANNIA: 'BRITANNIA.NS',
  'BRITANNIA IND': 'BRITANNIA.NS',
  DABUR: 'DABUR.NS',
  'DABUR INDIA': 'DABUR.NS',
  MARICO: 'MARICO.NS',
  ASIANPAINT: 'ASIANPAINT.NS',
  'ASIAN PAINTS': 'ASIANPAINT.NS',
  BERGEPAINT: 'BERGEPAINT.NS',
  'BERGER PAINTS': 'BERGEPAINT.NS',
  BHARTIARTL: 'BHARTIARTL.NS',
  'BHARTI AIRTEL': 'BHARTIARTL.NS',
  AIRTEL: 'BHARTIARTL.NS',
  IDEA: 'IDEA.NS',
  'VODAFONE IDEA': 'IDEA.NS',
  'VI': 'IDEA.NS',

  // Pharma & Healthcare
  SUNPHARMA: 'SUNPHARMA.NS',
  'SUN PHARMA': 'SUNPHARMA.NS',
  DRREDDY: 'DRREDDY.NS',
  "DR REDDY'S": 'DRREDDY.NS',
  CIPLA: 'CIPLA.NS',
  APOLLOHOSP: 'APOLLOHOSP.NS',
  'APOLLO HOSPITALS': 'APOLLOHOSP.NS',
  MANKIND: 'MANKIND.NS',
  'MANKIND PHARMA': 'MANKIND.NS',
  LUPIN: 'LUPIN.NS',
  AUROPHARMA: 'AUROPHARMA.NS',
  DIVISLAB: 'DIVISLAB.NS',
  "DIVI'S LAB": 'DIVISLAB.NS',
  TORNTPHARM: 'TORNTPHARM.NS',
  'TORRENT PHARMA': 'TORNTPHARM.NS',
  ZYDUSLIFE: 'ZYDUSLIFE.NS',
  'ZYDUS LIFESCIENCES': 'ZYDUSLIFE.NS',
  BIOCON: 'BIOCON.NS',
  GLENMARK: 'GLENMARK.NS',
  ALKEM: 'ALKEM.NS',
  AKUMS: 'AKUMS.NS',
  'AKUMS DRUGS': 'AKUMS.NS',
  EMCURE: 'EMCURE.NS',
  'EMCURE PHARMA': 'EMCURE.NS',

  // Defense, Aerospace & Railways
  HAL: 'HAL.NS',
  'HINDUSTAN AERONAUTICS': 'HAL.NS',
  BEL: 'BEL.NS',
  'BHARAT ELECTRONICS': 'BEL.NS',
  BHEL: 'BHEL.NS',
  MAZDOCK: 'MAZDOCK.NS',
  'MAZAGON DOCK': 'MAZDOCK.NS',
  COCHINSHIP: 'COCHINSHIP.NS',
  'COCHIN SHIPYARD': 'COCHINSHIP.NS',
  GRSE: 'GRSE.NS',
  BDL: 'BDL.NS',
  'BHARAT DYNAMICS': 'BDL.NS',
  RVNL: 'RVNL.NS',
  'RAIL VIKAS NIGAM': 'RVNL.NS',
  IRCON: 'IRCON.NS',
  RITES: 'RITES.NS',
  RAILTEL: 'RAILTEL.NS',
  TITAGARH: 'TITAGARH.NS',
  'TITAGARH RAIL': 'TITAGARH.NS',
  JUPITERWAG: 'JUPITERWAG.NS',

  // Retail, Consumer, Paints & Cables
  TRENT: 'TRENT.NS',
  'TRENT LIMITED': 'TRENT.NS',
  DMART: 'DMART.NS',
  'AVENUE SUPERMARTS': 'DMART.NS',
  VBL: 'VBL.NS',
  'VARUN BEVERAGES': 'VBL.NS',
  PIDILITIND: 'PIDILITIND.NS',
  PIDILITE: 'PIDILITIND.NS',
  HAVELLS: 'HAVELLS.NS',
  'HAVELLS INDIA': 'HAVELLS.NS',
  POLYCAB: 'POLYCAB.NS',
  'POLYCAB INDIA': 'POLYCAB.NS',
  KEI: 'KEI.NS',
  'KEI INDUSTRIES': 'KEI.NS',
  DIXON: 'DIXON.NS',
  'DIXON TECH': 'DIXON.NS',
  VOLTAS: 'VOLTAS.NS',
  BLUESTARCO: 'BLUESTARCO.NS',
  CROMPTON: 'CROMPTON.NS',
  WHIRLPOOL: 'WHIRLPOOL.NS',
  KALYANKJIL: 'KALYANKJIL.NS',
  'KALYAN JEWELLERS': 'KALYANKJIL.NS',
  PAGEIND: 'PAGEIND.NS',
  'PAGE INDUSTRIES': 'PAGEIND.NS',
  BATAINDIA: 'BATAINDIA.NS',
  JUBLFOOD: 'JUBLFOOD.NS',
  'JUBILANT FOODWORKS': 'JUBLFOOD.NS',
  DEVYANI: 'DEVYANI.NS',

  // New-Age / Tech Consumer & Exchanges
  ZOMATO: 'ZOMATO.NS',
  SWIGGY: 'SWIGGY.NS',
  PAYTM: 'PAYTM.NS',
  'ONE97': 'PAYTM.NS',
  'ONE97 COMMUNICATIONS': 'PAYTM.NS',
  NYKAA: 'NYKAA.NS',
  'FSN E-COMMERCE': 'NYKAA.NS',
  POLICYBZR: 'POLICYBZR.NS',
  'PB FINTECH': 'POLICYBZR.NS',
  DELHIVERY: 'DELHIVERY.NS',
  FIRSTCRY: 'FIRSTCRY.NS',
  HONASA: 'HONASA.NS',
  'MAMAEARTH': 'HONASA.NS',
  IRCTC: 'IRCTC.NS',
  BSE: 'BSE.NS',
  'BSE LIMITED': 'BSE.NS',
  CDSL: 'CDSL.NS',
  MCX: 'MCX.NS',
  ANGELONE: 'ANGELONE.NS',
  'ANGEL ONE': 'ANGELONE.NS',
  EDELWEISS: 'EDELWEISS.NS',
  MOTILALOFS: 'MOTILALOFS.NS',
  'MOTILAL OSWAL': 'MOTILALOFS.NS',
  KRN: 'KRN.NS',
  'KRN HEAT': 'KRN.NS',
  ARKADE: 'ARKADE.NS',
  'ARKADE DEVELOPERS': 'ARKADE.NS',
  ECOS: 'ECOS.NS',
  'ECOS MOBILITY': 'ECOS.NS',
  ORIENTTECH: 'ORIENTTECH.NS',
  'ORIENT TECHNOLOGIES': 'ORIENTTECH.NS',
  INTERARCH: 'INTERARCH.NS',
  SANSTAR: 'SANSTAR.NS',
  BANSALWIRE: 'BANSALWIRE.NS',
  KROSS: 'KROSS.NS',
  TOLINS: 'TOLINS.NS',
};

// Canonical official corporate name mapping
export const CANONICAL_COMPANY_NAMES: Record<string, string> = {
  SBIN: 'State Bank of India',
  HDFCBANK: 'HDFC Bank Limited',
  ICICIBANK: 'ICICI Bank Limited',
  KOTAKBANK: 'Kotak Mahindra Bank Ltd',
  AXISBANK: 'Axis Bank Limited',
  INDUSINDBK: 'IndusInd Bank Limited',
  BAJFINANCE: 'Bajaj Finance Limited',
  BAJAJFINSV: 'Bajaj Finserv Limited',
  BAJAJHFL: 'Bajaj Housing Finance Ltd',
  JIOFIN: 'Jio Financial Services Ltd',
  PFC: 'Power Finance Corporation',
  RECLTD: 'REC Limited',
  IREDA: 'Indian Renewable Energy Dev Agency',
  IRFC: 'Indian Railway Finance Corp',
  YESBANK: 'Yes Bank Limited',
  PNB: 'Punjab National Bank',
  BANKBARODA: 'Bank of Baroda',
  CANBK: 'Canara Bank',
  UNIONBANK: 'Union Bank of India',
  INDIANB: 'Indian Bank',
  IDFCFIRSTB: 'IDFC First Bank Limited',
  FEDERALBNK: 'The Federal Bank Limited',
  AUBANK: 'AU Small Finance Bank',
  BANDHANBNK: 'Bandhan Bank Limited',
  MANBA: 'Manba Finance Limited',
  NORTHARC: 'Northern Arc Capital Limited',

  TCS: 'Tata Consultancy Services Ltd',
  INFY: 'Infosys Limited',
  WIPRO: 'Wipro Limited',
  HCLTECH: 'HCL Technologies Limited',
  TECHM: 'Tech Mahindra Limited',
  LTIM: 'LTIMindtree Limited',
  KPITTECH: 'KPIT Technologies Limited',
  PERSISTENT: 'Persistent Systems Limited',
  COFORGE: 'Coforge Limited',
  TATAELXSI: 'Tata Elxsi Limited',

  RELIANCE: 'Reliance Industries Limited',
  TATAMOTORS: 'Tata Motors Limited',
  TATASTEEL: 'Tata Steel Limited',
  TATAPOWER: 'Tata Power Company Ltd',
  TATACONSUM: 'Tata Consumer Products Ltd',
  TITAN: 'Titan Company Limited',
  LT: 'Larsen & Toubro Limited',
  'M&M': 'Mahindra & Mahindra Limited',
  MARUTI: 'Maruti Suzuki India Limited',
  HYUNDAI: 'Hyundai Motor India Limited',
  'BAJAJ-AUTO': 'Bajaj Auto Limited',
  EICHERMOT: 'Eicher Motors Limited',
  HEROMOTOCO: 'Hero MotoCorp Limited',
  TVSMOTOR: 'TVS Motor Company Limited',
  BHARATFORG: 'Bharat Forge Limited',
  MOTHERSON: 'Samvardhana Motherson Int Ltd',
  OLAELEC: 'Ola Electric Mobility Ltd',

  ONGC: 'Oil & Natural Gas Corp Ltd',
  NTPC: 'NTPC Limited',
  POWERGRID: 'Power Grid Corp of India',
  COALINDIA: 'Coal India Limited',
  IOC: 'Indian Oil Corporation Ltd',
  BPCL: 'Bharat Petroleum Corp Ltd',
  HINDPETRO: 'Hindustan Petroleum Corp Ltd',
  GAIL: 'GAIL (India) Limited',
  ADANIENT: 'Adani Enterprises Limited',
  ADANIPORTS: 'Adani Ports & SEZ Limited',
  ADANIGREEN: 'Adani Green Energy Limited',
  ADANIPOWER: 'Adani Power Limited',
  ADANIENSOL: 'Adani Energy Solutions Ltd',
  SUZLON: 'Suzlon Energy Limited',
  PREMIERENE: 'Premier Energies Limited',
  JSWSTEEL: 'JSW Steel Limited',
  SAIL: 'Steel Authority of India Ltd',
  JINDALSTEL: 'Jindal Steel & Power Ltd',
  HINDALCO: 'Hindalco Industries Limited',
  VEDL: 'Vedanta Limited',
  NMDC: 'NMDC Limited',

  ITC: 'ITC Limited',
  HINDUNILVR: 'Hindustan Unilever Limited',
  NESTLEIND: 'Nestle India Limited',
  BRITANNIA: 'Britannia Industries Ltd',
  DABUR: 'Dabur India Limited',
  MARICO: 'Marico Limited',
  ASIANPAINT: 'Asian Paints Limited',
  BERGEPAINT: 'Berger Paints India Ltd',
  BHARTIARTL: 'Bharti Airtel Limited',
  IDEA: 'Vodafone Idea Limited',

  SUNPHARMA: 'Sun Pharmaceutical Ind Ltd',
  DRREDDY: "Dr. Reddy's Laboratories Ltd",
  CIPLA: 'Cipla Limited',
  APOLLOHOSP: 'Apollo Hospitals Enterprise',
  MANKIND: 'Mankind Pharma Limited',
  LUPIN: 'Lupin Limited',
  DIVISLAB: "Divi's Laboratories Limited",
  ZYDUSLIFE: 'Zydus Lifesciences Limited',

  HAL: 'Hindustan Aeronautics Limited',
  BEL: 'Bharat Electronics Limited',
  BHEL: 'Bharat Heavy Electricals Ltd',
  MAZDOCK: 'Mazagon Dock Shipbuilders Ltd',
  COCHINSHIP: 'Cochin Shipyard Limited',
  RVNL: 'Rail Vikas Nigam Limited',
  IRCON: 'Ircon International Limited',
  RAILTEL: 'RailTel Corporation of India',
  TITAGARH: 'Titagarh Rail Systems Ltd',

  TRENT: 'Trent Limited',
  DMART: 'Avenue Supermarts Limited',
  VBL: 'Varun Beverages Limited',
  PIDILITIND: 'Pidilite Industries Limited',
  HAVELLS: 'Havells India Limited',
  POLYCAB: 'Polycab India Limited',
  DIXON: 'Dixon Technologies Limited',
  KALYANKJIL: 'Kalyan Jewellers India Ltd',

  ZOMATO: 'Zomato Limited',
  SWIGGY: 'Swiggy Limited',
  PAYTM: 'One97 Communications Ltd (Paytm)',
  NYKAA: 'FSN E-Commerce Ventures (Nykaa)',
  POLICYBZR: 'PB Fintech Ltd (Policybazaar)',
  DELHIVERY: 'Delhivery Limited',
  IRCTC: 'Indian Railway Catering & Tourism',
  BSE: 'BSE Limited',
  CDSL: 'Central Depository Services Ltd',
  MCX: 'Multi Commodity Exchange Ltd',
  ANGELONE: 'Angel One Limited',
  KRN: 'KRN Heat Exchanger & Refrig Ltd',
  ARKADE: 'Arkade Developers Limited',
  ECOS: 'ECOS (India) Mobility & Hosp Ltd',
  ORIENTTECH: 'Orient Technologies Limited',
  INTERARCH: 'Interarch Building Products Ltd',
};

export function resolveStockTicker(input: string): string {
  const clean = input.trim().toUpperCase();
  if (INDIAN_STOCK_ALIASES[clean]) {
    return INDIAN_STOCK_ALIASES[clean];
  }
  const stripped = clean.replace(/[^A-Z0-9&]/g, '');
  if (INDIAN_STOCK_ALIASES[stripped]) {
    return INDIAN_STOCK_ALIASES[stripped];
  }
  if (clean.endsWith('.NS') || clean.endsWith('.BO')) {
    return clean;
  }
  return `${stripped}.NS`;
}

export function resolveStockInfo(input: string): { symbol: string; name: string; isKnown: boolean } {
  const clean = input.trim().toUpperCase();
  const stripped = clean.replace(/[^A-Z0-9&]/g, '');

  let targetTicker = INDIAN_STOCK_ALIASES[clean] || INDIAN_STOCK_ALIASES[stripped];
  let isKnown = !!targetTicker;

  if (!targetTicker) {
    if (clean.endsWith('.NS') || clean.endsWith('.BO')) {
      targetTicker = clean;
    } else if (stripped.length >= 2 && stripped.length <= 15) {
      targetTicker = `${stripped}.NS`;
    }
  }

  const baseSymbol = targetTicker ? targetTicker.replace(/\.NS$|\.BO$/, '').toUpperCase() : stripped;
  const canonicalName = CANONICAL_COMPANY_NAMES[baseSymbol] || input.trim();
  if (CANONICAL_COMPANY_NAMES[baseSymbol]) {
    isKnown = true;
  }

  return {
    symbol: baseSymbol,
    name: canonicalName,
    isKnown,
  };
}

/**
 * Fetch helper with CORS proxy fallback
 */
async function fetchWithFallback(url: string, timeoutMs = 5000): Promise<any | null> {
  // 1. Direct fetch
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // direct fetch failed (likely CORS on web browser)
  }

  // 2. CORS Proxy 1: corsproxy.io
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(proxyUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // next proxy
  }

  // 3. CORS Proxy 2: api.allorigins.win
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(proxyUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fail
  }

  return null;
}

/**
 * Searches Yahoo Finance search endpoint to resolve ambiguous stock/company names
 */
export async function searchTickerSymbol(query: string): Promise<string | null> {
  const directAlias = resolveStockTicker(query);
  if (directAlias && directAlias !== `${query.toUpperCase()}.NS`) {
    return directAlias;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=5&newsCount=0`;
    const data = await fetchWithFallback(url, 4000);
    if (data && data.quotes) {
      const quotes = data.quotes;
      const indian = quotes.find(
        (q: any) =>
          typeof q.symbol === 'string' &&
          (q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO'))
      );
      if (indian?.symbol) return indian.symbol;
      if (quotes[0]?.symbol) return quotes[0].symbol;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Direct & Proxy quote fetcher from Yahoo Chart API
 */
async function fetchDirectYahooQuote(ticker: string, originalSymbol: string): Promise<StockQuote | null> {
  const baseUrls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`,
  ];

  for (const url of baseUrls) {
    try {
      const data = await fetchWithFallback(url, 5000);
      if (data) {
        const result = data?.chart?.result?.[0];
        if (result && result.meta) {
          const meta = result.meta;
          const currentPrice = meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0;
          const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? currentPrice;
          const change = currentPrice - previousClose;
          const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

          if (currentPrice > 0) {
            return {
              symbol: originalSymbol,
              name: meta.shortName || meta.longName || originalSymbol,
              price: Math.round(currentPrice * 100) / 100,
              change: Math.round(change * 100) / 100,
              changePercent: Math.round(changePercent * 100) / 100,
              previousClose: Math.round(previousClose * 100) / 100,
              lastUpdated: new Date().toISOString(),
              currency: meta.currency || 'INR',
              source: ticker.includes('.BO') ? 'BSE' : 'NSE',
            };
          }
        }
      }
    } catch {
      // try next
    }
  }

  return null;
}

/**
 * Fetch live stock quote for a single symbol scanning across NSE, BSE, Aliases, and search resolvers
 */
export async function fetchLiveStockQuote(rawSymbol: string): Promise<StockQuote | null> {
  if (!rawSymbol || !rawSymbol.trim()) return null;
  const originalSymbol = rawSymbol.trim().toUpperCase();

  // 1. Check alias resolution first (e.g. SBI -> SBIN.NS)
  const resolvedTicker = resolveStockTicker(originalSymbol);
  const quoteFromAlias = await fetchDirectYahooQuote(resolvedTicker, originalSymbol);
  if (quoteFromAlias) return quoteFromAlias;

  const baseSymbol = originalSymbol.replace(/\.NS$|\.BO$/, '');

  // 2. Direct fetch from NSE (.NS)
  const nseQuote = await fetchDirectYahooQuote(`${baseSymbol}.NS`, originalSymbol);
  if (nseQuote) return nseQuote;

  // 3. Direct fetch from BSE (.BO)
  const bseQuote = await fetchDirectYahooQuote(`${baseSymbol}.BO`, originalSymbol);
  if (bseQuote) return bseQuote;

  // 4. Try exact symbol
  if (rawSymbol.includes('.')) {
    const exactQuote = await fetchDirectYahooQuote(rawSymbol.trim().toUpperCase(), originalSymbol);
    if (exactQuote) return exactQuote;
  }

  // 5. Try searching query for company names (e.g. Tata Motors)
  try {
    const foundTicker = await searchTickerSymbol(rawSymbol);
    if (foundTicker) {
      const resolvedQuote = await fetchDirectYahooQuote(foundTicker, originalSymbol);
      if (resolvedQuote) return resolvedQuote;
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Batch fetch live stock quotes for all symbols in portfolio
 */
export async function fetchMultipleLiveStockQuotes(symbols: string[]): Promise<Record<string, StockQuote>> {
  const uniqueSymbols = Array.from(
    new Set(symbols.map((s) => s.trim().toUpperCase()))
  ).filter(Boolean);

  if (uniqueSymbols.length === 0) return {};
  const results: Record<string, StockQuote> = {};

  const scanPromises = uniqueSymbols.map(async (sym) => {
    try {
      const quote = await fetchLiveStockQuote(sym);
      if (quote) {
        results[sym] = quote;
        results[sym.replace(/\.NS$|\.BO$/, '')] = quote;
      }
    } catch {
      // ignore
    }
  });

  await Promise.all(scanPromises);
  return results;
}
