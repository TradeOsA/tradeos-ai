import {
  BreakoutSignal,
  AutoTradeConfig,
  AutoTradeLogItem,
  PaperTradingAccount,
  PaperPosition,
  PaperPendingOrder,
  TrailingStopLossConfig,
} from '../types';

export const AUTO_TRADE_CONFIG_KEY = 'tradeos_autotrade_config_v1';
export const AUTO_TRADE_LOGS_KEY = 'tradeos_autotrade_logs_v1';

// In-Memory & Persistent Asset Cooldown Tracker
// Ensures no rapid duplicate re-entry or 10x trade loop on the same symbol
const symbolExecutionCooldownMap = new Map<string, number>();
const symbolClosedCooldownMap = new Map<string, number>();

export function recordSymbolTradeExecuted(symbol: string) {
  symbolExecutionCooldownMap.set(symbol, Date.now());
}

export function recordSymbolTradeClosed(symbol: string) {
  symbolClosedCooldownMap.set(symbol, Date.now());
}

export function getSymbolCooldownRemainingSeconds(symbol: string, cooldownMinutes: number = 10): number {
  const now = Date.now();
  const cooldownMs = Math.max(1, cooldownMinutes) * 60 * 1000;
  
  const lastExec = symbolExecutionCooldownMap.get(symbol) || 0;
  const lastClosed = symbolClosedCooldownMap.get(symbol) || 0;
  
  const mostRecentActivity = Math.max(lastExec, lastClosed);
  if (mostRecentActivity === 0) return 0;
  
  const elapsed = now - mostRecentActivity;
  if (elapsed < cooldownMs) {
    return Math.ceil((cooldownMs - elapsed) / 1000);
  }
  return 0;
}

export function formatTradeDuration(openedTimestamp?: number, closedTimestamp?: number): string {
  if (!openedTimestamp) return '< 1m';
  const end = closedTimestamp || Date.now();
  const diffSec = Math.max(1, Math.round((end - openedTimestamp) / 1000));
  
  if (diffSec < 60) return `${diffSec}s`;
  const mins = Math.floor(diffSec / 60);
  const remSec = diffSec % 60;
  if (mins < 60) return `${mins}m ${remSec > 0 ? `${remSec}s` : ''}`.trim();
  const hours = Math.floor(mins / 60);
  const remMin = mins % 60;
  return `${hours}h ${remMin}m`;
}

export const DEFAULT_AUTO_TRADE_CONFIG: AutoTradeConfig = {
  isEnabled: false,
  executionMode: 'SMART_SMC',
  minConfidenceScore: 85,
  minRiskReward: 2.0,
  allowedGrades: ['A+', 'A'],
  maxOpenPositions: 15,
  sizingMode: 'FIXED_MARGIN',
  fixedMarginAmount: 100,
  riskPercentBalance: 2,
  defaultLeverage: 10,
  autoMoveSlToBreakeven: true,
  enableTrailingStop: false,
  trailingDistancePercent: 1.5,
  soundAlertOnExecution: true,
  targetCategories: ['Crypto', 'Forex', 'Stocks', 'Commodities'],
  cooldownMinutesPerAsset: 10,
  antiFakeoutStrict: true,
  respectIndianMarketHours: true,
};

export interface AutoTradeEvaluationResult {
  eligible: boolean;
  isExecuted?: boolean;
  rejectionReason?: string;
  orderType?: 'MARKET' | 'LIMIT';
  newPosition?: PaperPosition;
  newPendingOrder?: PaperPendingOrder;
  logItem?: AutoTradeLogItem;
  updatedAccount?: PaperTradingAccount;
}

export interface IndianMarketSessionInfo {
  isOpen: boolean;
  status: 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'WEEKEND';
  currentIstTime: string;
  currentIstDate: string;
  sessionRange: string;
  reason: string;
  nextOpenMessage?: string;
}

/**
 * Calculates current Indian Market (NSE / BSE / F&O) session status in IST (UTC+5:30)
 * Normal Trading Hours: Monday to Friday, 09:15 AM to 03:30 PM IST
 * Pre-Market: 09:00 AM to 09:15 AM IST
 * Weekends (Sat/Sun): Closed
 */
export function getIndianMarketSessionInfo(date: Date = new Date()): IndianMarketSessionInfo {
  // Convert current time to IST (UTC + 5:30)
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 3600000 * 5.5);

  const day = istDate.getDay(); // 0 = Sun, 6 = Sat
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const currentIstTime = istDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }) + ' IST';

  const currentIstDate = istDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // 1. Weekend Check: Saturday & Sunday
  if (day === 0 || day === 6) {
    const isSat = day === 6;
    return {
      isOpen: false,
      status: 'WEEKEND',
      currentIstTime,
      currentIstDate,
      sessionRange: '09:15 AM - 03:30 PM IST (Mon-Fri)',
      reason: `NSE/BSE Indian Market is closed on ${isSat ? 'Saturday' : 'Sunday'}.`,
      nextOpenMessage: 'Market opens Monday at 09:15 AM IST.',
    };
  }

  // 2. Pre-Market Session: 09:00 AM - 09:15 AM IST (540 to 555 mins)
  const preMarketStart = 9 * 60; // 09:00 AM = 540 mins
  const regularMarketOpen = 9 * 60 + 15; // 09:15 AM = 555 mins
  const regularMarketClose = 15 * 60 + 30; // 03:30 PM = 930 mins

  if (totalMinutes >= preMarketStart && totalMinutes < regularMarketOpen) {
    return {
      isOpen: false,
      status: 'PRE_MARKET',
      currentIstTime,
      currentIstDate,
      sessionRange: '09:15 AM - 03:30 PM IST',
      reason: 'NSE/BSE is currently in Pre-Market session (09:00 - 09:15 AM IST). Regular orders execute from 09:15 AM IST.',
      nextOpenMessage: 'Regular order execution begins at 09:15 AM IST.',
    };
  }

  // 3. Regular Active Session: 09:15 AM to 03:30 PM IST
  if (totalMinutes >= regularMarketOpen && totalMinutes < regularMarketClose) {
    return {
      isOpen: true,
      status: 'OPEN',
      currentIstTime,
      currentIstDate,
      sessionRange: '09:15 AM - 03:30 PM IST',
      reason: 'NSE/BSE Indian Market is LIVE (09:15 AM - 03:30 PM IST).',
    };
  }

  // 4. Closed Session (Before 09:00 AM or After 03:30 PM IST)
  const isBeforeOpen = totalMinutes < regularMarketOpen;
  return {
    isOpen: false,
    status: 'CLOSED',
    currentIstTime,
    currentIstDate,
    sessionRange: '09:15 AM - 03:30 PM IST',
    reason: isBeforeOpen
      ? `NSE/BSE Indian Market is closed before opening (Opens at 09:15 AM IST, Current: ${currentIstTime}).`
      : `NSE/BSE Indian Market closed for the day at 03:30 PM IST (Current: ${currentIstTime}).`,
    nextOpenMessage: isBeforeOpen
      ? 'Trading opens today at 09:15 AM IST.'
      : day === 5
      ? 'Trading re-opens Monday at 09:15 AM IST.'
      : 'Trading re-opens tomorrow at 09:15 AM IST.',
  };
}

export function isIndianSymbolCategory(symbol: string, category?: string): boolean {
  const upper = symbol.toUpperCase();
  return (
    upper.includes('^NSE') ||
    upper.includes('^BSE') ||
    upper.includes('NIFTY') ||
    upper.includes('SENSEX') ||
    upper.includes('BANKNIFTY') ||
    upper.includes('.NS') ||
    upper.includes('.BO') ||
    upper.includes('RELIANCE') ||
    upper.includes('HDFCBANK') ||
    upper.includes('TATA') ||
    upper.includes('INFY') ||
    upper.includes(' CE') ||
    upper.includes(' PE') ||
    category === 'Indian Stocks / F&O' ||
    upper === 'USD/INR'
  );
}

export interface UnifiedMarketSessionStatus {
  isOpen: boolean;
  status: 'OPEN' | 'CLOSED' | 'WEEKEND' | 'PRE_MARKET';
  reason: string;
  nextOpenMessage?: string;
  marketName: string;
}

/**
 * Universal Market Session Validator across all assets & segments (Indian NSE/BSE, US Equities, Forex, Commodities, Crypto).
 */
export function getUnifiedMarketSessionStatus(
  symbol: string,
  category?: string,
  now: Date = new Date()
): UnifiedMarketSessionStatus {
  const upper = (symbol || '').toUpperCase();
  const cat = category || '';

  // 1. Crypto: 24/7 Always Open
  if (
    cat === 'Crypto' ||
    upper.includes('BTC') ||
    upper.includes('ETH') ||
    upper.includes('SOL') ||
    upper.includes('BNB') ||
    upper.includes('XRP') ||
    upper.includes('USDT')
  ) {
    return {
      isOpen: true,
      status: 'OPEN',
      reason: 'Crypto markets trade 24/7/365 without closing.',
      marketName: 'Global Crypto 24/7',
    };
  }

  // 2. Indian Market: 09:15 AM - 03:30 PM IST Mon-Fri
  if (isIndianSymbolCategory(symbol, category)) {
    const indian = getIndianMarketSessionInfo(now);
    return {
      isOpen: indian.isOpen,
      status: indian.status,
      reason: indian.reason,
      nextOpenMessage: indian.nextOpenMessage,
      marketName: 'NSE / BSE India',
    };
  }

  // 3. Forex: 24/5 Mon-Fri, closed weekends
  if (cat === 'Forex' || upper.includes('/') || upper.includes('USD/')) {
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const etDate = new Date(utc - 3600000 * 4);
    const day = etDate.getDay();
    const hours = etDate.getHours();
    const minutes = etDate.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    if (day === 6) {
      return {
        isOpen: false,
        status: 'WEEKEND',
        reason: 'Forex market is closed on weekends (reopens Sunday 5:00 PM EST).',
        nextOpenMessage: 'Sunday 5:00 PM EST',
        marketName: 'Global Forex 24/5',
      };
    }
    if (day === 0 && totalMinutes < 17 * 60) {
      return {
        isOpen: false,
        status: 'CLOSED',
        reason: 'Forex market opens Sunday at 5:00 PM EST (2:30 AM IST Mon).',
        nextOpenMessage: 'Sunday 5:00 PM EST',
        marketName: 'Global Forex 24/5',
      };
    }
    if (day === 5 && totalMinutes >= 17 * 60) {
      return {
        isOpen: false,
        status: 'CLOSED',
        reason: 'Forex market closed Friday at 5:00 PM EST for the weekend.',
        nextOpenMessage: 'Sunday 5:00 PM EST',
        marketName: 'Global Forex 24/5',
      };
    }

    return {
      isOpen: true,
      status: 'OPEN',
      reason: 'Global Forex market is active 24/5.',
      marketName: 'Global Forex 24/5',
    };
  }

  // 4. Commodities & Futures
  if (
    cat === 'Commodities' ||
    cat === 'Futures' ||
    upper.includes('XAU') ||
    upper.includes('USOIL') ||
    upper.includes('ES1!') ||
    upper.includes('NQ1!')
  ) {
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const etDate = new Date(utc - 3600000 * 4);
    const day = etDate.getDay();
    const hours = etDate.getHours();
    const minutes = etDate.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    if (day === 6) {
      return {
        isOpen: false,
        status: 'WEEKEND',
        reason: 'Commodity & Futures markets are closed on Saturday.',
        nextOpenMessage: 'Sunday 6:00 PM EST',
        marketName: 'Commodities & Futures',
      };
    }
    if (day === 0 && totalMinutes < 18 * 60) {
      return {
        isOpen: false,
        status: 'CLOSED',
        reason: 'Commodity & Futures markets reopen Sunday at 6:00 PM EST.',
        nextOpenMessage: 'Sunday 6:00 PM EST',
        marketName: 'Commodities & Futures',
      };
    }
    if (day === 5 && totalMinutes >= 17 * 60) {
      return {
        isOpen: false,
        status: 'CLOSED',
        reason: 'Commodity markets closed Friday at 5:00 PM EST for the weekend.',
        nextOpenMessage: 'Sunday 6:00 PM EST',
        marketName: 'Commodities & Futures',
      };
    }

    return {
      isOpen: true,
      status: 'OPEN',
      reason: 'Commodity/Futures trading session is active.',
      marketName: 'Commodities & Futures',
    };
  }

  // 5. US Stocks / Equities
  if (
    cat === 'Stocks' ||
    upper.includes('^GSPC') ||
    upper.includes('NVDA') ||
    upper.includes('AAPL') ||
    upper.includes('TSLA') ||
    upper.includes('QQQ')
  ) {
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const etDate = new Date(utc - 3600000 * 4);
    const day = etDate.getDay();
    const hours = etDate.getHours();
    const minutes = etDate.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    if (day === 0 || day === 6) {
      return {
        isOpen: false,
        status: 'WEEKEND',
        reason: 'US Stock Market (NYSE/NASDAQ) is closed on weekends.',
        nextOpenMessage: 'Monday 09:30 AM EST',
        marketName: 'US Equities (NYSE/NASDAQ)',
      };
    }

    if (totalMinutes >= 570 && totalMinutes < 960) {
      return {
        isOpen: true,
        status: 'OPEN',
        reason: 'US Stock Market is LIVE (09:30 AM - 04:00 PM EST).',
        marketName: 'US Equities (NYSE/NASDAQ)',
      };
    }

    return {
      isOpen: false,
      status: 'CLOSED',
      reason: 'US Stock Market is closed outside 09:30 AM - 04:00 PM EST.',
      nextOpenMessage: '09:30 AM EST',
      marketName: 'US Equities (NYSE/NASDAQ)',
    };
  }

  return {
    isOpen: true,
    status: 'OPEN',
    reason: 'Market is open for trading.',
    marketName: 'Global Markets',
  };
}

/**
 * Institutional Asset-Class Quantity & Lot Size Normalizer
 * Ensures quantities are mathematically realistic and aligned with real broker lot rules
 */
export function normalizeQuantityByAsset(
  symbol: string,
  category: string,
  rawQty: number,
  entryPrice: number
): number {
  if (rawQty <= 0 || isNaN(rawQty) || entryPrice <= 0) return 0.01;

  const upperSym = symbol.toUpperCase();

  // 1. INDIAN EQUITIES & INDICES (NSE / BSE / F&O)
  if (isIndianSymbolCategory(symbol, category)) {
    if (upperSym.includes('BANKNIFTY') || upperSym.includes('NSEBANK')) {
      // Bank Nifty standard lot = 15
      const lots = Math.max(1, Math.round(rawQty / 15));
      return lots * 15;
    }
    if (upperSym.includes('NIFTY') || upperSym.includes('NSEI')) {
      // Nifty 50 standard lot = 25
      const lots = Math.max(1, Math.round(rawQty / 25));
      return lots * 25;
    }
    if (upperSym.includes('SENSEX') || upperSym.includes('BSESN')) {
      // Sensex standard lot = 10
      const lots = Math.max(1, Math.round(rawQty / 10));
      return lots * 10;
    }
    // Indian stock shares: Whole integer shares (e.g. 10 shares, not 4.2 shares)
    return Math.max(1, Math.round(rawQty));
  }

  // 2. CRYPTO
  if (category === 'Crypto' || upperSym.includes('/USDT') || upperSym.includes('BTC') || upperSym.includes('ETH')) {
    if (upperSym.includes('BTC')) {
      // BTC: min 0.001 BTC, round to 3 decimals (e.g. 0.015 BTC)
      return Math.max(0.001, Number(rawQty.toFixed(3)));
    }
    if (upperSym.includes('ETH')) {
      // ETH: min 0.01 ETH, round to 2 decimals (e.g. 0.45 ETH)
      return Math.max(0.01, Number(rawQty.toFixed(2)));
    }
    if (upperSym.includes('SOL') || upperSym.includes('BNB')) {
      // SOL, BNB: min 0.1 unit, round to 1 decimal (e.g. 5.5 SOL)
      return Math.max(0.1, Number(rawQty.toFixed(1)));
    }
    if (upperSym.includes('XRP') || upperSym.includes('DOGE') || upperSym.includes('ADA')) {
      // Low price crypto: round to whole integers (e.g. 150 XRP)
      return Math.max(10, Math.round(rawQty));
    }
    return Math.max(0.01, Number(rawQty.toFixed(2)));
  }

  // 3. US EQUITIES & ETFS (NVDA, AAPL, TSLA, SPY, QQQ)
  if (category === 'Stocks' || category === 'Futures') {
    // Whole shares or clean fractional shares (min 1 share or 0.1 for high value)
    if (entryPrice > 500) {
      return Math.max(0.1, Number(rawQty.toFixed(1)));
    }
    return Math.max(1, Math.round(rawQty));
  }

  // 4. FOREX (EUR/USD, GBP/USD, USD/JPY, AUD/USD)
  if (category === 'Forex' || upperSym.includes('/') && (upperSym.includes('EUR') || upperSym.includes('USD') || upperSym.includes('GBP') || upperSym.includes('JPY'))) {
    // Forex Standard Lots: 1.0 Lot = 100k units, 0.10 Mini = 10k, 0.01 Micro = 1k
    // In our paper engine, rawQty is currency units or contract fraction
    if (rawQty > 100) {
      // Standard units (e.g. 10,000 or 5,000 units)
      return Math.max(1000, Math.round(rawQty / 1000) * 1000);
    }
    // Lot representation (e.g. 0.05, 0.10, 1.00 lots)
    return Math.max(0.01, Number(rawQty.toFixed(2)));
  }

  // 5. COMMODITIES (Gold XAU/USD, Crude Oil)
  if (category === 'Commodities' || upperSym.includes('XAU') || upperSym.includes('GOLD') || upperSym.includes('OIL')) {
    if (upperSym.includes('XAU') || upperSym.includes('GOLD')) {
      // Gold Ounces: min 0.10 oz, step 0.05 oz (e.g. 0.50 oz or 1.00 oz)
      return Math.max(0.05, Number(rawQty.toFixed(2)));
    }
    if (upperSym.includes('OIL')) {
      // Crude Oil Barrels: min 5 bbl
      return Math.max(5, Math.round(rawQty));
    }
  }

  return Math.max(0.01, Number(rawQty.toFixed(2)));
}

/**
 * Institutional Technical Stop Loss & Target Formulator
 * Calculates realistic stop loss strictly behind market structure (Order block / Sweep extremes)
 * Enforces minimum volatility buffer so natural market bid-ask jitter cannot trigger premature stop-outs
 */
export function calculateRealisticStopLossAndTargets(
  symbol: string,
  category: string,
  direction: 'LONG' | 'SHORT',
  entryPrice: number,
  suggestedSL?: number,
  suggestedTP?: number,
  tp1?: number,
  tp2?: number,
  tp3?: number
): {
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  takeProfit: number;
  riskDistance: number;
  riskReward: number;
  riskPercent: number;
} {
  const isLong = direction === 'LONG';
  const upperSym = symbol.toUpperCase();
  const isIndian = isIndianSymbolCategory(symbol, category);

  // Baseline Asset Class Structural Volatility Minimum Percentages
  // (Prevents unrealistic 0.05% micro stop-losses that trigger in 8 seconds)
  let minRiskPct = 0.015; // 1.5% default
  let defaultRiskPct = 0.018; // 1.8% default

  if (isIndian) {
    if (upperSym.includes('BANKNIFTY') || upperSym.includes('NSEBANK')) {
      minRiskPct = 0.009; // 0.9% ~450 pts
      defaultRiskPct = 0.012; // 1.2% ~600 pts
    } else if (upperSym.includes('NIFTY') || upperSym.includes('NSEI')) {
      minRiskPct = 0.008; // 0.8% ~195 pts
      defaultRiskPct = 0.011; // 1.1% ~270 pts
    } else {
      minRiskPct = 0.012; // 1.2% Indian Stocks
      defaultRiskPct = 0.018; // 1.8%
    }
  } else if (category === 'Crypto') {
    if (upperSym.includes('BTC')) {
      minRiskPct = 0.014; // 1.4%
      defaultRiskPct = 0.020; // 2.0%
    } else if (upperSym.includes('ETH')) {
      minRiskPct = 0.016; // 1.6%
      defaultRiskPct = 0.022; // 2.2%
    } else {
      minRiskPct = 0.022; // 2.2% Altcoins
      defaultRiskPct = 0.030; // 3.0%
    }
  } else if (category === 'Forex') {
    minRiskPct = 0.004; // 40 pips (0.4%)
    defaultRiskPct = 0.006; // 60 pips (0.6%)
  } else if (category === 'Commodities') {
    minRiskPct = 0.009; // 0.9% Gold/Oil
    defaultRiskPct = 0.014; // 1.4%
  } else if (category === 'Stocks') {
    minRiskPct = 0.012; // 1.2% Equities
    defaultRiskPct = 0.018; // 1.8%
  }

  let finalSL = suggestedSL && suggestedSL > 0 ? suggestedSL : 0;

  // Validate SL has adequate buffer and is on the correct side of Entry
  if (isLong) {
    const slDistPct = finalSL > 0 && finalSL < entryPrice ? (entryPrice - finalSL) / entryPrice : 0;
    if (!finalSL || finalSL >= entryPrice || slDistPct < minRiskPct || slDistPct > 0.08) {
      finalSL = Number((entryPrice * (1 - defaultRiskPct)).toFixed(entryPrice < 2 ? 4 : 2));
    }
  } else {
    const slDistPct = finalSL > 0 && finalSL > entryPrice ? (finalSL - entryPrice) / entryPrice : 0;
    if (!finalSL || finalSL <= entryPrice || slDistPct < minRiskPct || slDistPct > 0.08) {
      finalSL = Number((entryPrice * (1 + defaultRiskPct)).toFixed(entryPrice < 2 ? 4 : 2));
    }
  }

  const riskDistance = Math.abs(entryPrice - finalSL);
  const riskPercent = Number(((riskDistance / entryPrice) * 100).toFixed(2));

  // Multi-Target Geometry (TP1 = 1:1.8, TP2 = 1:2.85, TP3 = 1:4.2)
  const calculatedTp1 = isLong
    ? Number((entryPrice + riskDistance * 1.8).toFixed(entryPrice < 2 ? 4 : 2))
    : Number((entryPrice - riskDistance * 1.8).toFixed(entryPrice < 2 ? 4 : 2));

  const calculatedTp2 = isLong
    ? Number((entryPrice + riskDistance * 2.85).toFixed(entryPrice < 2 ? 4 : 2))
    : Number((entryPrice - riskDistance * 2.85).toFixed(entryPrice < 2 ? 4 : 2));

  const calculatedTp3 = isLong
    ? Number((entryPrice + riskDistance * 4.2).toFixed(entryPrice < 2 ? 4 : 2))
    : Number((entryPrice - riskDistance * 4.2).toFixed(entryPrice < 2 ? 4 : 2));

  // Ensure suggested TP meets minimum 1:1.8 Risk-Reward
  let finalTp2 = suggestedTP && suggestedTP > 0 ? suggestedTP : calculatedTp2;
  const tpDist = Math.abs(finalTp2 - entryPrice);
  if (tpDist / (riskDistance || 1) < 1.8) {
    finalTp2 = calculatedTp2;
  }

  const finalTp1 = tp1 && tp1 > 0 ? tp1 : calculatedTp1;
  const finalTp3 = tp3 && tp3 > 0 ? tp3 : calculatedTp3;
  const finalMainTP = finalTp2;

  const rewardDistance = Math.abs(finalMainTP - entryPrice);
  const calculatedRR = riskDistance > 0 ? Number((rewardDistance / riskDistance).toFixed(2)) : 2.85;

  return {
    stopLoss: finalSL,
    tp1: finalTp1,
    tp2: finalTp2,
    tp3: finalTp3,
    takeProfit: finalMainTP,
    riskDistance,
    riskReward: calculatedRR,
    riskPercent,
  };
}

/**
 * Institutional Auto-Trading Evaluation & Execution Logic
 * Evaluates a Breakout Signal against quantitative filters, risk limits, and sizing parameters.
 */
export function evaluateAndExecuteSignal(
  signal: BreakoutSignal,
  config: AutoTradeConfig,
  account: PaperTradingAccount,
  livePriceOverride?: number,
  suppressSkippedLogs: boolean = false
): AutoTradeEvaluationResult {
  const now = new Date();
  const timestampStr = now.toLocaleTimeString();
  const livePrice = livePriceOverride && livePriceOverride > 0 ? livePriceOverride : signal.price;

  const normalizedDirection: 'LONG' | 'SHORT' =
    signal.direction === 'BEARISH' ? 'SHORT' : 'LONG';
  const isLong = normalizedDirection === 'LONG';

  // 1. Check Master Switch
  if (!config.isEnabled) {
    return {
      eligible: false,
      isExecuted: false,
      rejectionReason: 'Auto-Trade Engine is currently PAUSED by user',
    };
  }

  // 2. Check Category Whitelist
  if (config.targetCategories && !config.targetCategories.includes(signal.category)) {
    return {
      eligible: false,
      isExecuted: false,
      rejectionReason: `Category ${signal.category} not in allowed target markets`,
    };
  }

  // 2.5 Check Indian Market (NSE / BSE / F&O) Working Hours (09:15 AM - 03:30 PM IST Mon-Fri)
  if (isIndianSymbolCategory(signal.symbol, signal.category) && config.respectIndianMarketHours !== false) {
    const indianSession = getIndianMarketSessionInfo();
    if (!indianSession.isOpen) {
      return {
        eligible: false,
        isExecuted: false,
        rejectionReason: `[Indian Market Working Hours] NSE/BSE is closed outside 09:15 AM - 03:30 PM IST (Current: ${indianSession.currentIstTime}). ${indianSession.reason}`,
      };
    }
  }

  // 3. Check Confidence Score / Anti-Fakeout Score Threshold
  const signalScore = signal.antiFakeoutScore || signal.confidenceScore || 0;
  if (signalScore < config.minConfidenceScore) {
    return {
      eligible: false,
      isExecuted: false,
      rejectionReason: `Confidence score (${signalScore}%) is below required threshold (${config.minConfidenceScore}%)`,
    };
  }

  // 4. Check Setup Grade Filter
  if (signal.setupGrade && !config.allowedGrades.includes(signal.setupGrade)) {
    return {
      eligible: false,
      isExecuted: false,
      rejectionReason: `Setup Grade ${signal.setupGrade} is not in permitted grades (${config.allowedGrades.join(', ')})`,
    };
  }

  // 5. Check Active Positions & Pending Limit Orders Count (Max Concurrent Limit)
  const currentPositions = account.positions || [];
  const currentPending = account.pendingOrders || [];
  const totalActive = currentPositions.length + currentPending.length;

  if (totalActive >= config.maxOpenPositions) {
    return {
      eligible: false,
      isExecuted: false,
      rejectionReason: `Max concurrent positions limit reached (${totalActive}/${config.maxOpenPositions})`,
    };
  }

  // 6. Check Duplicate Exposure (Already open in this asset - PREVENTS 10X DUPLICATE TRADES)
  const alreadyInPosition = currentPositions.some((p) => p.symbol === signal.symbol);
  const alreadyInPending = currentPending.some((o) => o.symbol === signal.symbol);

  if (alreadyInPosition || alreadyInPending) {
    return {
      eligible: false,
      isExecuted: false,
      rejectionReason: `Already holding active trade or pending limit order for ${signal.symbol}`,
    };
  }

  // 7. Check Mandatory Asset Cooldown Time (Prevents rapid repeat executions after close or open)
  const cooldownMinutes = config.cooldownMinutesPerAsset || 10;
  const cooldownRemainingSec = getSymbolCooldownRemainingSeconds(signal.symbol, cooldownMinutes);
  if (cooldownRemainingSec > 0) {
    return {
      eligible: false,
      isExecuted: false,
      rejectionReason: `Asset is in mandatory institutional cooldown (${cooldownRemainingSec}s remaining of ${cooldownMinutes}m) to prevent overtrading & duplicate loops`,
    };
  }

  // Also verify recent closed history to prevent repeat entry if recently closed
  const recentHistory = (account.history || []).filter((h) => h.symbol === signal.symbol);
  if (recentHistory.length > 0) {
    const lastClosed = recentHistory[0];
    if (lastClosed.closedAtTimestamp) {
      const msSinceClose = Date.now() - lastClosed.closedAtTimestamp;
      if (msSinceClose < cooldownMinutes * 60 * 1000) {
        const rem = Math.ceil((cooldownMinutes * 60 * 1000 - msSinceClose) / 1000);
        return {
          eligible: false,
          isExecuted: false,
          rejectionReason: `Recent closed trade on ${signal.symbol} is within ${cooldownMinutes}m cooldown (${rem}s remaining)`,
        };
      }
    }
  }

  // 8. Determine Execution Order Type & Target Entry Price
  let decidedOrderType: 'MARKET' | 'LIMIT' = 'MARKET';
  let targetEntryPrice = livePrice;

  if (config.executionMode === 'INSTANT_MARKET') {
    decidedOrderType = 'MARKET';
    targetEntryPrice = livePrice;
  } else if (config.executionMode === 'LIMIT_PULLBACK') {
    decidedOrderType = 'LIMIT';
    targetEntryPrice = signal.suggestedEntry > 0 ? signal.suggestedEntry : livePrice;
  } else {
    // SMART_SMC mode:
    // If signal explicitly says WAIT_FOR_RETEST or LIMIT_READY or has entryZone, use LIMIT order at Order Block / FVG.
    // If signal says CONFIRMED_EXPANSION or price is already right in entry zone, execute MARKET.
    if (
      (signal.executionStatus === 'WAIT_FOR_RETEST' || signal.executionStatus === 'LIMIT_READY') &&
      signal.suggestedEntry > 0 &&
      Math.abs(signal.suggestedEntry - livePrice) / livePrice > 0.002
    ) {
      decidedOrderType = 'LIMIT';
      targetEntryPrice = signal.suggestedEntry;
    } else {
      decidedOrderType = 'MARKET';
      targetEntryPrice = livePrice;
    }
  }

  // 8. Calculate Realistic Technical Stop Loss & Multi-Take Profit Targets
  const slMath = calculateRealisticStopLossAndTargets(
    signal.symbol,
    signal.category,
    normalizedDirection,
    targetEntryPrice,
    signal.suggestedSL,
    signal.suggestedTP,
    signal.tp1,
    signal.tp2,
    signal.tp3
  );

  // 9. Check Risk-to-Reward Minimum
  if (slMath.riskReward < config.minRiskReward) {
    return {
      eligible: false,
      isExecuted: false,
      rejectionReason: `Risk-to-Reward (1:${slMath.riskReward}) is below required minimum (1:${config.minRiskReward})`,
    };
  }

  const leverage = config.defaultLeverage || 10;

  // 10. Position Sizing & Margin Calculation (Risk % vs Fixed Margin)
  let marginToUse = 0;
  let computedQuantity = 0;

  if (config.sizingMode === 'RISK_PERCENT') {
    // Risk-based position sizing: Sized so that hitting SL loses exactly riskPercentBalance% of account
    const accountEquity = account.equity || account.balance || 10000;
    const maxLossUsd = (accountEquity * config.riskPercentBalance) / 100;
    const riskPerUnit = slMath.riskDistance;

    if (riskPerUnit > 0) {
      const idealQuantity = maxLossUsd / riskPerUnit;
      const normalizedQty = normalizeQuantityByAsset(signal.symbol, signal.category, idealQuantity, targetEntryPrice);
      computedQuantity = normalizedQty;
      marginToUse = Number(((computedQuantity * targetEntryPrice) / leverage).toFixed(2));

      // Safety check if calculated margin exceeds available free collateral
      if (marginToUse > account.freeCollateral * 0.95) {
        marginToUse = Number((account.freeCollateral * 0.90).toFixed(2));
        computedQuantity = normalizeQuantityByAsset(
          signal.symbol,
          signal.category,
          (marginToUse * leverage) / targetEntryPrice,
          targetEntryPrice
        );
      }
    }
  } else {
    // Fixed Margin Mode: uses exact fixed dollar margin (e.g. $100)
    marginToUse = Math.min(config.fixedMarginAmount, account.freeCollateral * 0.95);
    const totalExposureUsd = marginToUse * leverage;
    const rawQty = targetEntryPrice > 0 ? totalExposureUsd / targetEntryPrice : 1;
    computedQuantity = normalizeQuantityByAsset(signal.symbol, signal.category, rawQty, targetEntryPrice);
  }

  marginToUse = Math.max(10, Number(marginToUse.toFixed(2)));

  if (marginToUse > account.freeCollateral || account.freeCollateral < 10) {
    return {
      eligible: false,
      isExecuted: false,
      rejectionReason: `Insufficient free collateral ($${account.freeCollateral.toFixed(2)}) for required margin ($${marginToUse.toFixed(2)})`,
    };
  }

  const mmr = 0.005; // 0.5% maintenance margin
  const liquidationPrice = isLong
    ? Math.max(0, Number((targetEntryPrice * (1 - 1 / leverage + mmr)).toFixed(targetEntryPrice < 2 ? 4 : 2)))
    : Number((targetEntryPrice * (1 + 1 / leverage - mmr)).toFixed(targetEntryPrice < 2 ? 4 : 2));

  // Trailing Stop Loss Configuration
  let tslConfig: TrailingStopLossConfig | undefined = undefined;
  if (config.enableTrailingStop && config.trailingDistancePercent > 0) {
    const trailDist = Number(((targetEntryPrice * config.trailingDistancePercent) / 100).toFixed(2));
    const initialStop = isLong
      ? Number((targetEntryPrice - trailDist).toFixed(2))
      : Number((targetEntryPrice + trailDist).toFixed(2));

    tslConfig = {
      enabled: true,
      trailDistance: trailDist,
      trailDistancePercent: config.trailingDistancePercent,
      peakPrice: targetEntryPrice,
      activeStopPrice: initialStop,
    };
  }

  const baseLog: Omit<AutoTradeLogItem, 'status' | 'executionLogicSummary'> = {
    id: `autolog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: timestampStr,
    symbol: signal.symbol,
    category: signal.category,
    direction: normalizedDirection,
    orderType: decidedOrderType,
    entryPrice: targetEntryPrice,
    stopLoss: slMath.stopLoss,
    takeProfit: slMath.takeProfit,
    tp1: slMath.tp1,
    tp2: slMath.tp2,
    tp3: slMath.tp3,
    quantity: computedQuantity,
    marginUsed: marginToUse,
    leverage,
    signalType: signal.type,
    confidenceScore: signalScore,
    setupGrade: signal.setupGrade || 'A',
    invalidationReason: signal.invalidationReason || 'Below 15m Order Block / Invalidation Zone',
    riskReward: slMath.riskReward,
  };

  // 11. Create Order and Update Account
  if (decidedOrderType === 'MARKET') {
    recordSymbolTradeExecuted(signal.symbol);
    const newPosition: PaperPosition = {
      id: `pos-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      symbol: signal.symbol,
      category: signal.category,
      direction: normalizedDirection,
      entryPrice: targetEntryPrice,
      currentPrice: livePrice,
      quantity: computedQuantity,
      initialQuantity: computedQuantity,
      leverage,
      marginUsed: marginToUse,
      liquidationPrice,
      stopLoss: slMath.stopLoss,
      takeProfit: slMath.takeProfit,
      tp1: slMath.tp1,
      tp2: slMath.tp2,
      tp3: slMath.tp3,
      trailingStopLoss: tslConfig,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      openedAt: timestampStr,
      openedAtTimestamp: Date.now(),
      lastUpdatedAt: timestampStr,
      orderType: 'MARKET',
      signalType: `🤖 Auto: ${signal.type}`,
      isAutoTrade: true,
      autoTradeConfidence: signalScore,
      autoTradeGrade: signal.setupGrade || 'A',
      autoTradeReason: signal.triggerMetric || signal.invalidationReason || 'Multi-timeframe SMC Breakout',
    };

    const updatedAccount: PaperTradingAccount = {
      ...account,
      marginUsed: Number((account.marginUsed + marginToUse).toFixed(2)),
      freeCollateral: Number((account.freeCollateral - marginToUse).toFixed(2)),
      positions: [newPosition, ...account.positions],
    };

    const isIndian = isIndianSymbolCategory(signal.symbol, signal.category);
    const curr = isIndian ? '₹' : '$';

    const finalLog: AutoTradeLogItem = {
      ...baseLog,
      orderType: 'MARKET',
      status: 'FILLED',
      positionId: newPosition.id,
      executionLogicSummary: `Instant Market Fill [${normalizedDirection}]: ${computedQuantity} ${signal.symbol} @ ${curr}${targetEntryPrice.toLocaleString()} | Margin: ${curr}${marginToUse} (${leverage}x) | Stop Loss: ${curr}${slMath.stopLoss.toLocaleString()} (${slMath.riskPercent}% risk) | Take Profit: ${curr}${slMath.takeProfit.toLocaleString()} (R:R 1:${slMath.riskReward})`,
    };

    return {
      eligible: true,
      isExecuted: true,
      orderType: 'MARKET',
      newPosition,
      logItem: finalLog,
      updatedAccount,
    };
  } else {
    // LIMIT Order Queued
    const newPendingOrder: PaperPendingOrder = {
      id: `limit-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      symbol: signal.symbol,
      category: signal.category,
      direction: normalizedDirection,
      orderType: 'LIMIT',
      limitPrice: targetEntryPrice,
      currentPriceAtPlacement: livePrice,
      quantity: computedQuantity,
      leverage,
      marginRequired: marginToUse,
      liquidationPrice,
      stopLoss: slMath.stopLoss,
      takeProfit: slMath.takeProfit,
      tp1: slMath.tp1,
      tp2: slMath.tp2,
      tp3: slMath.tp3,
      trailingStopLoss: tslConfig,
      status: 'PENDING',
      placedAt: timestampStr,
      signalType: `🤖 Auto Limit: ${signal.type}`,
      isAutoTrade: true,
      autoTradeConfidence: signalScore,
      autoTradeGrade: signal.setupGrade || 'A',
    };

    const updatedAccount: PaperTradingAccount = {
      ...account,
      marginUsed: Number((account.marginUsed + marginToUse).toFixed(2)),
      freeCollateral: Number((account.freeCollateral - marginToUse).toFixed(2)),
      pendingOrders: [newPendingOrder, ...(account.pendingOrders || [])],
    };

    const isIndian = isIndianSymbolCategory(signal.symbol, signal.category);
    const curr = isIndian ? '₹' : '$';

    const finalLog: AutoTradeLogItem = {
      ...baseLog,
      orderType: 'LIMIT',
      status: 'LIMIT_QUEUED',
      positionId: newPendingOrder.id,
      executionLogicSummary: `SMC Pullback Limit Queued [${normalizedDirection}]: ${computedQuantity} ${signal.symbol} @ Order Block (${curr}${targetEntryPrice.toLocaleString()}) | Margin: ${curr}${marginToUse} (${leverage}x) | SL: ${curr}${slMath.stopLoss.toLocaleString()} | TP: ${curr}${slMath.takeProfit.toLocaleString()} (R:R 1:${slMath.riskReward})`,
    };

    return {
      eligible: true,
      isExecuted: true,
      orderType: 'LIMIT',
      newPendingOrder,
      logItem: finalLog,
      updatedAccount,
    };
  }
}
