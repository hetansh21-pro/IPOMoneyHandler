'use client';

import React, { useState } from 'react';
import { formatINR } from '@/lib/utils/formatters';

interface SegmentItem {
  label: string;
  amount: number;
  color: string;
  count?: number;
  onClick?: () => void;
}

interface SegmentedBarProps {
  segments: SegmentItem[];
  total: number;
}

export function SegmentedBar({ segments, total }: SegmentedBarProps) {
  const safeTotal = total > 0 ? total : 1;

  return (
    <div className="space-y-3">
      {/* Segmented multi-color bar */}
      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full flex overflow-hidden p-0.5 gap-0.5 border border-slate-200/60 dark:border-slate-700/60">
        {segments.map((seg, idx) => {
          const percentage = Math.max(0, Math.min(100, (seg.amount / safeTotal) * 100));
          if (percentage <= 0) return null;
          return (
            <div
              key={idx}
              style={{ width: `${percentage}%`, backgroundColor: seg.color }}
              className="h-full rounded-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              title={`${seg.label}: ${formatINR(seg.amount)} (${percentage.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Category Pills */}
      <div className="grid grid-cols-2 gap-2">
        {segments.map((seg, idx) => (
          <button
            key={idx}
            onClick={seg.onClick}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors text-left group"
          >
            <div className="flex items-center space-x-2 truncate min-w-0 pr-1">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white truncate">
                {seg.label}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 ml-1 flex-shrink-0">
              {formatINR(seg.amount)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

import { Building2, Coins, LineChart, Wallet } from 'lucide-react';
import { AccountType } from '@/lib/types/finance';

export function getAccountLogoSrc(name: string, type?: AccountType): string | null {
  const n = name.toLowerCase().replace(/[^a-z0-9]/g, ' ');

  // 1. Demat / Broker app checks (first priority for specific broker keywords or if type is demat/investment)
  if (n.includes('zerodha coin') || (type === 'demat' && n.includes('coin'))) return '/brokers/zerodhacoin.png';
  if (n.includes('zerodha') || n.includes('kite')) return '/brokers/zerodha.png';
  if (n.includes('groww')) return '/brokers/groww.png';
  if (n.includes('angel arq') || n.includes('arq')) return '/brokers/angelarq.png';
  if (n.includes('angel one') || n.includes('angelone') || n.includes('angel broking') || n.includes('angel')) return '/brokers/angelone.png';
  if (n.includes('upstox')) return '/brokers/upstox.png';
  if (n.includes('indmoney') || n.includes('ind money')) return '/brokers/indmoney.png';
  if (n.includes('icici direct') || n.includes('icicidirect') || (type === 'demat' && n.includes('icici'))) return '/brokers/icicidirect.png';
  if (n.includes('dhan')) return '/brokers/dhan.png';
  if (n.includes('kotak neo') || n.includes('kotakneo') || (type === 'demat' && n.includes('kotak'))) return '/brokers/kotakneo.png';
  if (n.includes('hdfc sec') || n.includes('hdfc securities') || n.includes('investright') || (type === 'demat' && n.includes('hdfc'))) return '/brokers/hdfcsec.png';
  if (n.includes('paytm money') || n.includes('paytmmoney')) return '/brokers/paytmmoney.png';
  if (n.includes('riise')) return '/brokers/riise.png';
  if (n.includes('mirae') || n.includes('mirae asset')) return '/brokers/miraeasset.png';
  if (n.includes('share market') || n.includes('share.market') || n.includes('sharemarket')) return '/brokers/sharemarket.png';
  if (n.includes('univest')) return '/brokers/univest.png';
  if (n.includes('fyers')) return '/brokers/fyers.png';
  if (n.includes('iifl wealth') || n.includes('360 one') || n.includes('360one')) return '/brokers/360one.png';
  if (n.includes('iifl')) return '/brokers/iifl.png';
  if (n.includes('sbi sec') || n.includes('sbi securities') || n.includes('sbisec') || (type === 'demat' && n.includes('sbi'))) return '/brokers/sbisec.png';
  if (n.includes('5paisa') || n.includes('5 paisa') || n.includes('five paisa') || n.includes('fivepaisa')) return '/brokers/5paisa.png';
  if (n.includes('axis direct') || n.includes('axisdirect') || (type === 'demat' && n.includes('axis'))) return '/brokers/axisdirect.png';
  if (n.includes('motilal') || n.includes('mosl')) return '/brokers/motilaloswal.png';
  if (n.includes('alice blue') || n.includes('aliceblue')) return '/brokers/aliceblue.png';
  if (n.includes('edelweiss') || n.includes('nuvama')) return '/brokers/edelweiss.png';
  if (n.includes('bajaj sec') || n.includes('bajaj securities') || n.includes('bajaj financial securities') || n.includes('bajaj broking') || n.includes('bfsl')) return '/brokers/bajajsec.png';
  if (n.includes('anand rathi') || n.includes('anandrathi')) return '/brokers/anandrathi.png';
  if (n.includes('samco')) return '/brokers/samco.png';
  if (n.includes('sharekhan')) return '/brokers/sharekhan.png';
  if (n.includes('alchemy')) return '/brokers/alchemy.png';
  if (n.includes('ventura')) return '/brokers/ventura.png';
  if (n.includes('tradejini') || n.includes('trade jini')) return '/brokers/tradejini.png';
  if (n.includes('stoxkart') || n.includes('stox kart')) return '/brokers/stoxkart.png';
  if (n.includes('metastock') || n.includes('meta stock')) return '/brokers/metastock.png';
  if (n.includes('ibkr') || n.includes('interactive brokers')) return '/brokers/ibkr.png';
  if (n.includes('webull')) return '/brokers/webull.png';
  if (n.includes('pocket option') || n.includes('pocketoption')) return '/brokers/pocketoption.png';
  if (n.includes('binance')) return '/brokers/binance.png';
  if (n.includes('etoro')) return '/brokers/etoro.png';
  if (n.includes('octafx') || n.includes('octa fx')) return '/brokers/octafx.png';
  if (n.includes('xm')) return '/brokers/xm.png';
  if (n.includes('global money') || n.includes('globalmoney')) return '/brokers/globalmoney.png';

  // 2. Bank Checks
  if (n.includes('hdfc')) return '/banks/hdfc.png';
  if (n.includes('sbi') || n.includes('state bank')) return '/banks/sbi.png';
  if (n.includes('icici')) return '/banks/icici.png';
  if (n.includes('axis')) return '/banks/axis.png';
  if (n.includes('kotak')) return '/banks/kotak.png';
  if (n.includes('pnb') || n.includes('punjab national')) return '/banks/pnb.png';
  if (n.includes('baroda') || n.includes('bob')) return '/banks/bob.png';
  if (n.includes('canara')) return '/banks/canara.png';
  if (n.includes('union')) return '/banks/union.png';
  if (n.includes('indian bank')) return '/banks/indian.png';
  if (n.includes('central bank') || n.includes('cbi')) return '/banks/cbi.png';
  if (n.includes('overseas') || n.includes('iob')) return '/banks/iob.png';
  if (n.includes('uco')) return '/banks/uco.png';
  if (n.includes('maharashtra') || n.includes('bom')) return '/banks/bom.png';
  if (n.includes('punjab and sind') || n.includes('punjab & sind') || n.includes('psb')) return '/banks/psb.png';
  if (n.includes('allahabad')) return '/banks/allahabad.png';
  if (n.includes('bank of india') || n.includes('boi')) return '/banks/boi.png';
  if (n.includes('idbi')) return '/banks/idbi.png';
  if (n.includes('yes bank') || n.includes('yes')) return '/banks/yes.png';
  if (n.includes('indusind')) return '/banks/indusind.png';
  if (n.includes('idfc')) return '/banks/idfc.png';
  if (n.includes('federal')) return '/banks/federal.png';
  if (n.includes('rbl')) return '/banks/rbl.png';
  if (n.includes('bandhan')) return '/banks/bandhan.png';
  if (n.includes('au small') || n.includes('au bank') || n.includes('au sfb')) return '/banks/au.png';
  if (n.includes('equitas')) return '/banks/equitas.png';
  if (n.includes('ujjivan')) return '/banks/ujjivan.png';
  if (n.includes('fincare')) return '/banks/fincare.png';
  if (n.includes('esaf')) return '/banks/esaf.png';
  if (n.includes('city union') || n.includes('cub')) return '/banks/cub.png';
  if (n.includes('karur vysya') || n.includes('kvb')) return '/banks/kvb.png';
  if (n.includes('south indian') || n.includes('sib')) return '/banks/sib.png';
  if (n.includes('csb')) return '/banks/csb.png';
  if (n.includes('jana')) return '/banks/jana.png';
  if (n.includes('dcb')) return '/banks/dcb.png';
  if (n.includes('karnataka')) return '/banks/karnataka.png';
  if (n.includes('tamilnad') || n.includes('tmb')) return '/banks/tmb.png';
  if (n.includes('lakshmi') || n.includes('lvb')) return '/banks/lvb.png';
  if (n.includes('jammu') || n.includes('kashmir') || n.includes('jkb')) return '/banks/jkb.png';
  if (n.includes('dbs')) return '/banks/dbs.png';
  if (n.includes('standard chartered') || n.includes('scb')) return '/banks/scb.png';
  if (n.includes('citi')) return '/banks/citi.png';
  if (n.includes('hsbc')) return '/banks/hsbc.png';
  if (n.includes('barclays')) return '/banks/barclays.png';
  if (n.includes('bnp')) return '/banks/bnp.png';
  if (n.includes('bank of america') || n.includes('boa')) return '/banks/boa.png';
  if (n.includes('vijaya')) return '/banks/vijaya.png';
  if (n.includes('oriental') || n.includes('obc')) return '/banks/obc.png';
  if (n.includes('united bank')) return '/banks/united.png';
  if (n.includes('syndicate')) return '/banks/syndicate.png';
  if (n.includes('andhra')) return '/banks/andhra.png';
  if (n.includes('corporation')) return '/banks/corporation.png';
  if (n.includes('dena')) return '/banks/dena.png';
  if (n.includes('northeast')) return '/banks/northeast.png';

  return null;
}

export function getBankLogoSrc(name: string): string | null {
  return getAccountLogoSrc(name, 'bank');
}

export function GrowwLogoSvg({ className = 'w-full h-full' }: { className?: string }) {
  const clipId = React.useId ? `groww-clip-${React.useId().replace(/[:]/g, '')}` : 'groww-circle-clip';
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`rounded-full overflow-hidden ${className}`}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {/* Top Indigo / Blue circle background */}
        <circle cx="50" cy="50" r="50" fill="#4B65F6" />
        {/* Bottom Mint / Teal ascending trend */}
        <path
          d="M-5 65L34 52L52 58L105 28V105H-5V65Z"
          fill="#00D09C"
        />
      </g>
    </svg>
  );
}

export function KiteLogoSvg({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Upper facet */}
      <polygon points="36,16 88,16 60,50" fill="#FF5722" />
      {/* Left body facet */}
      <polygon points="12,50 36,16 60,50 36,84" fill="#EA3B28" />
      {/* Lower facet */}
      <polygon points="36,84 88,84 60,50" fill="#D32F2F" />
    </svg>
  );
}

export function SBILogoSvg({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* SBI Blue Circle */}
      <circle cx="50" cy="50" r="46" fill="#0072CE" />
      {/* Keyhole Center Circle */}
      <circle cx="50" cy="48" r="11" fill="white" />
      {/* Keyhole Vertical Stem */}
      <rect x="46.5" y="48" width="7" height="38" fill="white" />
    </svg>
  );
}

export function DhanLogoSvg({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="22" fill="#00A868" />
      <text
        x="50%"
        y="68%"
        textAnchor="middle"
        fill="white"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="54px"
      >
        ध
      </text>
    </svg>
  );
}

export function HDFCLogoSvg({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer red brackets */}
      <path
        d="M12 12H44V26H26V44H12V12ZM56 12H88V44H74V26H56V12ZM12 56H26V74H44V88H12V56ZM74 56H88V88H56V74H74V56Z"
        fill="#ED1C24"
      />
      {/* Center blue square */}
      <rect x="36" y="36" width="28" height="28" fill="#004C8F" />
    </svg>
  );
}

export interface BankLogoProps {
  name: string;
  type?: AccountType;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BankLogo({
  name,
  type = 'bank',
  color,
  size = 'md',
  className = '',
}: BankLogoProps) {
  const [imgError, setImgError] = useState(false);
  const n = name.toLowerCase();

  const sizeClasses = {
    sm: 'w-7 h-7 min-w-[28px] max-w-[28px] h-7 min-h-[28px] max-h-[28px] rounded-lg',
    md: 'w-11 h-11 min-w-[44px] max-w-[44px] h-11 min-h-[44px] max-h-[44px] rounded-2xl',
    lg: 'w-14 h-14 min-w-[56px] max-w-[56px] h-14 min-h-[56px] max-h-[56px] rounded-2xl',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  }[size];

  const containerBase = `${sizeClasses} bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden ${className}`;

  // Specific high-precision vector logos for Groww, Kite, SBI, Dhan, and HDFC
  if (n.includes('groww')) {
    return (
      <div className={`${containerBase} p-1.5`} title="Groww Demat Account">
        <GrowwLogoSvg className="w-full h-full object-contain" />
      </div>
    );
  }

  if (n.includes('zerodha') || n.includes('kite')) {
    return (
      <div className={`${containerBase} p-1.5`} title="Zerodha Kite Demat Account">
        <KiteLogoSvg className="w-full h-full object-contain" />
      </div>
    );
  }

  if (n.includes('hdfc')) {
    return (
      <div className={`${containerBase} p-2`} title="HDFC Bank">
        <HDFCLogoSvg className="w-full h-full object-contain" />
      </div>
    );
  }

  if (n.includes('dhan')) {
    return (
      <div className={`${containerBase} p-1.5`} title="Dhan Demat Account">
        <img
          src="/brokers/dhan.png"
          alt="Dhan"
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  if (n.includes('sbi') || n.includes('state bank')) {
    return (
      <div className={`${containerBase} p-1.5`} title="State Bank of India">
        <SBILogoSvg className="w-full h-full object-contain" />
      </div>
    );
  }

  // 1. Official Bank or Demat/Broker Logo (Clean white, square, centered)
  const logoUrl = getAccountLogoSrc(name, type);
  if (logoUrl && !imgError) {
    return (
      <div className={`${containerBase} p-1.5`} title={name}>
        <img
          src={logoUrl}
          alt={name}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // 2. Digital Wallets & Cash on Clean White Background
  if (n.includes('paytm')) {
    return (
      <div className={containerBase} title="Paytm Wallet">
        <span className="font-black text-[9px] text-[#002970] tracking-tighter">PAYTM</span>
      </div>
    );
  }

  if (n.includes('airtel')) {
    return (
      <div className={containerBase} title="Airtel Payments Bank">
        <span className="font-black text-[9px] text-[#e60000] tracking-tighter">AIRTEL</span>
      </div>
    );
  }

  if (n.includes('cash') || type === 'cash') {
    return (
      <div className={containerBase} title="Cash Account">
        <Coins className={`${iconSizes} text-amber-500`} />
      </div>
    );
  }

  // 3. Clean Fallbacks by Account Type on White Background with Centered Icon
  if (type === 'demat' || type === 'investment') {
    return (
      <div className={containerBase} title="Demat Account">
        <LineChart className={iconSizes} style={{ color: color || '#6366f1' }} />
      </div>
    );
  }

  if (type === 'wallet') {
    return (
      <div className={containerBase} title="Wallet Account">
        <Wallet className={iconSizes} style={{ color: color || '#0ea5e9' }} />
      </div>
    );
  }

  return (
    <div className={containerBase} title="Bank Account">
      <Building2 className={iconSizes} style={{ color: color || '#059669' }} />
    </div>
  );
}

