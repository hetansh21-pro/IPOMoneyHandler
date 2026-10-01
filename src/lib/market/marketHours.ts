/**
 * Indian Stock Market (NSE / BSE) & IPO Bidding Real-Time Timings Engine
 * All calculations strictly run in Indian Standard Time (IST, UTC+5:30).
 */

export interface IndianMarketState {
  status: 'OPEN' | 'CLOSED' | 'PRE_OPEN' | 'POST_CLOSE' | 'WEEKEND';
  statusLabel: string;
  subLabel: string;
  isTradingActive: boolean;
  timeRemaining: string;
  istTimeString: string;
  istDateString: string;
  currentHourIST: number;
  currentMinuteIST: number;
}

export interface IPORealtimeTiming {
  status: 'OPEN' | 'UPCOMING' | 'CLOSED' | 'LISTED';
  badgeText: string;
  badgeVariant: 'emerald' | 'amber' | 'slate' | 'blue';
  detailTimingText: string;
  isBiddingWindowOpenNow: boolean;
  biddingCutoffCountdown?: string;
  daysRemainingOrAgo?: number;
}

// Convert any system date/time to precise IST (Asia/Kolkata UTC+5:30) components
export function getNowIST(): {
  dateObj: Date;
  istDateStr: string; // YYYY-MM-DD
  istTimeStr: string; // HH:MM AM/PM
  hour: number;       // 0-23
  minute: number;     // 0-59
  second: number;     // 0-59
  dayOfWeek: number;  // 0 (Sun) - 6 (Sat)
} {
  const now = new Date();
  // Format to IST using Intl
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(now);
  const findVal = (type: string) => parts.find((p) => p.type === type)?.value || '';

  const yr = findVal('year');
  const mo = findVal('month');
  const da = findVal('day');
  const hr = parseInt(findVal('hour'), 10) || 0;
  const min = parseInt(findVal('minute'), 10) || 0;
  const sec = parseInt(findVal('second'), 10) || 0;

  // Day of week
  const istDateObj = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const dayOfWeek = istDateObj.getDay();

  const istDateStr = `${yr}-${mo}-${da}`;
  
  const displayHr = hr % 12 === 0 ? 12 : hr % 12;
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const istTimeStr = `${displayHr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} ${ampm} IST`;

  return {
    dateObj: istDateObj,
    istDateStr,
    istTimeStr,
    hour: hr,
    minute: min,
    second: sec,
    dayOfWeek,
  };
}

/**
 * Real-time Indian Stock Market Status (NSE / BSE: 9:15 AM to 3:30 PM IST)
 */
export function getIndianMarketStatus(): IndianMarketState {
  const ist = getNowIST();
  const totalMinutes = ist.hour * 60 + ist.minute;

  const isWeekend = ist.dayOfWeek === 0 || ist.dayOfWeek === 6; // Sunday = 0, Saturday = 6

  if (isWeekend) {
    const nextOpenDay = ist.dayOfWeek === 6 ? 'Monday' : 'Tomorrow';
    return {
      status: 'WEEKEND',
      statusLabel: 'Market Closed (Weekend)',
      subLabel: `Opens ${nextOpenDay} at 9:15 AM IST`,
      isTradingActive: false,
      timeRemaining: `Opens ${nextOpenDay} 9:15 AM`,
      istTimeString: ist.istTimeStr,
      istDateString: ist.istDateStr,
      currentHourIST: ist.hour,
      currentMinuteIST: ist.minute,
    };
  }

  // Pre-Open session: 9:00 AM (540m) to 9:08 AM (548m)
  if (totalMinutes >= 540 && totalMinutes < 548) {
    return {
      status: 'PRE_OPEN',
      statusLabel: 'Pre-Open Session',
      subLabel: 'Market opens in ' + (555 - totalMinutes) + ' mins at 9:15 AM',
      isTradingActive: false,
      timeRemaining: `${555 - totalMinutes}m to 9:15 AM`,
      istTimeString: ist.istTimeStr,
      istDateString: ist.istDateStr,
      currentHourIST: ist.hour,
      currentMinuteIST: ist.minute,
    };
  }

  // Live Trading Hours: 9:15 AM (555m) to 3:30 PM (930m)
  if (totalMinutes >= 555 && totalMinutes < 930) {
    const minsLeft = 930 - totalMinutes;
    const hrs = Math.floor(minsLeft / 60);
    const mins = minsLeft % 60;
    const timeRemaining = hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`;

    return {
      status: 'OPEN',
      statusLabel: 'Live Market Open',
      subLabel: `NSE / BSE active • Closes in ${timeRemaining} (3:30 PM)`,
      isTradingActive: true,
      timeRemaining: `Closes in ${timeRemaining}`,
      istTimeString: ist.istTimeStr,
      istDateString: ist.istDateStr,
      currentHourIST: ist.hour,
      currentMinuteIST: ist.minute,
    };
  }

  // Post-Market closing session: 3:30 PM (930m) to 4:00 PM (960m)
  if (totalMinutes >= 930 && totalMinutes < 960) {
    return {
      status: 'POST_CLOSE',
      statusLabel: 'Market Closed',
      subLabel: 'Post-market closing session • Opens tomorrow 9:15 AM',
      isTradingActive: false,
      timeRemaining: 'Opens tomorrow 9:15 AM',
      istTimeString: ist.istTimeStr,
      istDateString: ist.istDateStr,
      currentHourIST: ist.hour,
      currentMinuteIST: ist.minute,
    };
  }

  // Before 9:00 AM (Morning)
  if (totalMinutes < 555) {
    const minsToOpen = 555 - totalMinutes;
    const hrs = Math.floor(minsToOpen / 60);
    const mins = minsToOpen % 60;
    const timeText = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

    return {
      status: 'CLOSED',
      statusLabel: 'Market Closed',
      subLabel: `Opens today at 9:15 AM IST (in ${timeText})`,
      isTradingActive: false,
      timeRemaining: `Opens in ${timeText}`,
      istTimeString: ist.istTimeStr,
      istDateString: ist.istDateStr,
      currentHourIST: ist.hour,
      currentMinuteIST: ist.minute,
    };
  }

  // After 4:00 PM (Evening)
  const nextDay = ist.dayOfWeek === 5 ? 'Monday' : 'tomorrow';
  return {
    status: 'CLOSED',
    statusLabel: 'Market Closed',
    subLabel: `Opens ${nextDay} at 9:15 AM IST`,
    isTradingActive: false,
    timeRemaining: `Opens ${nextDay} 9:15 AM`,
    istTimeString: ist.istTimeStr,
    istDateString: ist.istDateStr,
    currentHourIST: ist.hour,
    currentMinuteIST: ist.minute,
  };
}

/**
 * Real-time IPO Bidding & Date Lifecycle Calculator
 * (IPO Bidding cutoff is 10:00 AM to 5:00 PM IST on open dates)
 */
export function getRealtimeIPOTiming(ipo: {
  openDate: string;
  closeDate: string;
  allotmentDate?: string;
  listingDate?: string;
  status?: string;
}): IPORealtimeTiming {
  const ist = getNowIST();
  const today = ist.istDateStr;
  const currentTotalMins = ist.hour * 60 + ist.minute;

  const openDate = ipo.openDate || today;
  const closeDate = ipo.closeDate || openDate;
  const allotmentDate = ipo.allotmentDate || closeDate;
  const listingDate = ipo.listingDate || allotmentDate;

  // Bidding daily window is 10:00 AM (600m) to 5:00 PM (1020m) IST
  const isWithinDailyBiddingHours = currentTotalMins >= 600 && currentTotalMins < 1020 && ist.dayOfWeek !== 0 && ist.dayOfWeek !== 6;

  const formatFriendlyDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return dStr;
    }
  };

  // 1. UPCOMING IPO
  if (today < openDate) {
    const diffDays = Math.ceil((new Date(openDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
    const badgeText = diffDays === 1 ? 'Opens Tomorrow' : `Opens in ${diffDays} Days`;

    return {
      status: 'UPCOMING',
      badgeText,
      badgeVariant: 'blue',
      detailTimingText: `Opens on ${formatFriendlyDate(openDate)} at 10:00 AM IST`,
      isBiddingWindowOpenNow: false,
      daysRemainingOrAgo: diffDays,
    };
  }

  // 2. CLOSING TODAY (Last Day of Bidding)
  if (today === closeDate) {
    if (currentTotalMins >= 1020) {
      // Past 5:00 PM IST on closing date -> Bidding is officially closed!
      return {
        status: 'CLOSED',
        badgeText: 'Closed',
        badgeVariant: 'slate',
        detailTimingText: `Bidding closed at 5:00 PM IST • Allotment: ${formatFriendlyDate(allotmentDate)}`,
        isBiddingWindowOpenNow: false,
      };
    }

    if (currentTotalMins < 600) {
      // Morning before 10:00 AM on closing date
      return {
        status: 'OPEN',
        badgeText: 'Closing Today',
        badgeVariant: 'amber',
        detailTimingText: `Bidding window opens at 10:00 AM IST • Closes strictly at 5:00 PM IST`,
        isBiddingWindowOpenNow: false,
      };
    }

    // Between 10:00 AM and 5:00 PM on closing date
    const minsLeft = 1020 - currentTotalMins;
    const hrs = Math.floor(minsLeft / 60);
    const mins = minsLeft % 60;
    const countdown = hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`;

    return {
      status: 'OPEN',
      badgeText: 'Closing Today',
      badgeVariant: 'amber',
      detailTimingText: `Bidding open now • UPI Mandate authorization closes strictly at 5:00 PM IST (${countdown})`,
      isBiddingWindowOpenNow: true,
      biddingCutoffCountdown: countdown,
    };
  }

  // 3. OPEN / LIVE BIDDING (Multi-day active issue)
  if (today >= openDate && today < closeDate) {
    if (isWithinDailyBiddingHours) {
      return {
        status: 'OPEN',
        badgeText: 'Open',
        badgeVariant: 'emerald',
        detailTimingText: `Bidding active today till 5:00 PM IST • Closes ${formatFriendlyDate(closeDate)}`,
        isBiddingWindowOpenNow: true,
      };
    }

    return {
      status: 'OPEN',
      badgeText: 'Open',
      badgeVariant: 'emerald',
      detailTimingText: `Active issue • Bidding window: 10:00 AM – 5:00 PM IST (Closes ${formatFriendlyDate(closeDate)})`,
      isBiddingWindowOpenNow: false,
    };
  }

  // 4. LISTED IPO
  if (today >= listingDate) {
    return {
      status: 'LISTED',
      badgeText: 'Listed on Exchanges',
      badgeVariant: 'slate',
      detailTimingText: `Listed on ${formatFriendlyDate(listingDate)} • Trading live on NSE/BSE`,
      isBiddingWindowOpenNow: false,
    };
  }

  // 5. CLOSED / AWAITING ALLOTMENT OR LISTING
  const diffToAllot = Math.ceil((new Date(allotmentDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
  let allotText = `Allotment: ${formatFriendlyDate(allotmentDate)}`;
  if (today === allotmentDate) {
    allotText = 'Allotment Expected Today';
  } else if (diffToAllot > 0) {
    allotText = `Allotment in ${diffToAllot} day${diffToAllot === 1 ? '' : 's'} (${formatFriendlyDate(allotmentDate)})`;
  }

  return {
    status: 'CLOSED',
    badgeText: 'Closed • Awaiting Allotment',
    badgeVariant: 'slate',
    detailTimingText: `Closed on ${formatFriendlyDate(closeDate)} • ${allotText} • Listing: ${formatFriendlyDate(listingDate)}`,
    isBiddingWindowOpenNow: false,
  };
}
