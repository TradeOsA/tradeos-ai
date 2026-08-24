import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  Play,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Sliders,
  DollarSign,
  PlusCircle,
  XCircle,
  CheckCircle2,
  Clock,
  Zap,
  Info,
  Edit3,
  Flame,
  Layers,
  ChevronRight,
  X,
  Target,
  ShieldAlert,
  ArrowRightLeft,
  Activity,
  Check,
  Trash2,
  ListFilter,
  CheckCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, doc, setDoc, onSnapshot } from '../../lib/firebase';
import {
  MarketAsset,
  PaperPosition,
  PaperPendingOrder,
  PaperTradeHistoryItem,
  PaperTradingAccount,
  TradeDirection,
  TrailingStopLossConfig,
  AutoTradeConfig,
  AutoTradeLogItem,
  BreakoutSignal,
  BrokerConnection,
} from '../../types';
import { PageHeader } from '../layout/PageHeader';
import { useCurrency } from '../../context/CurrencyContext';
import { isIndianMarketAsset, formatAssetPrice } from '../../utils/currencyUtils';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import { AutoTradeConfigModal } from './AutoTradeConfigModal';
import { AutoTradeLogModal } from './AutoTradeLogModal';
import { LiveBrokerToolbar } from './LiveBrokerToolbar';
import { IndianOptionsChainDrawer, OptionContractSelection } from './IndianOptionsChainDrawer';
import { BrokerSyncModal } from '../broker/BrokerSyncModal';
import {
  evaluateAndExecuteSignal,
  AUTO_TRADE_CONFIG_KEY,
  AUTO_TRADE_LOGS_KEY,
  DEFAULT_AUTO_TRADE_CONFIG,
  recordSymbolTradeClosed,
  recordSymbolTradeExecuted,
  getSymbolCooldownRemainingSeconds,
  formatTradeDuration,
  getIndianMarketSessionInfo,
} from '../../services/autoTrader';
import { generateInstitutionalSignals } from '../scanner/BreakoutRadarView';

interface PaperTradingViewProps {
  assets: MarketAsset[];
  selectedAsset: MarketAsset;
  onSelectAsset: (asset: MarketAsset) => void;
  onNavigateTab: (tab: string) => void;
  onBack?: () => void;
  onOpenBrokerSync?: () => void;
}

const STORAGE_KEY = 'tradeos_paper_account_v2';

const DEFAULT_BROKER_LIST: BrokerConnection[] = [
  {
    id: 'b-delta',
    provider: 'delta',
    name: 'Delta Exchange (India F&O & Perpetuals)',
    category: 'Global Crypto',
    isConnected: true,
    apiKey: 'delta_live_fno_key_v2',
    clientId: 'DELTA-IND-99420',
    lastSyncedAt: 'Just now',
    syncedTradesCount: 194,
    autoSyncEnabled: true,
    status: 'CONNECTED',
    latencyMs: 4,
    accountName: 'Delta F&O & Futures Margin Vault',
    availableMargin: 38450,
  },
  {
    id: 'b-dhan',
    provider: 'dhan',
    name: 'Dhan HQ SuperFast API v2',
    category: 'Indian Stocks / F&O',
    isConnected: true,
    apiKey: 'dhan_live_api_9921',
    clientId: '1100294821',
    lastSyncedAt: 'Just now',
    syncedTradesCount: 142,
    autoSyncEnabled: true,
    status: 'CONNECTED',
    latencyMs: 8,
    accountName: 'Dhan Trading Account',
    availableMargin: 245000,
  },
  {
    id: 'b-zerodha',
    provider: 'zerodha',
    name: 'Zerodha Kite Connect v3',
    category: 'Indian Stocks / F&O',
    isConnected: false,
    apiKey: 'kite_live_key',
    clientId: 'ZR8821',
    syncedTradesCount: 0,
    autoSyncEnabled: false,
    status: 'DISCONNECTED',
    latencyMs: 9,
    accountName: 'Zerodha Kite Account',
    availableMargin: 180000,
  },
  {
    id: 'b-binance',
    provider: 'binance',
    name: 'Binance Futures & Spot API v3',
    category: 'Global Crypto',
    isConnected: false,
    apiKey: 'binance_live_key',
    syncedTradesCount: 0,
    autoSyncEnabled: false,
    status: 'DISCONNECTED',
    latencyMs: 12,
    accountName: 'Binance VIP Vault',
    availableMargin: 12850,
  },
];

// 3 Default High-Conviction Active Running Trades (Ensures zero blank screens across remixes)
const defaultActivePositions: PaperPosition[] = [
  {
    id: 'pos-live-btc-auto-01',
    symbol: 'BTC/USDT',
    category: 'Crypto',
    direction: 'LONG',
    entryPrice: 67200,
    currentPrice: 67850,
    quantity: 0.15,
    leverage: 10,
    marginUsed: 1008,
    liquidationPrice: 60480,
    stopLoss: 65400,
    takeProfit: 71500,
    tp1: 69200,
    tp2: 71500,
    unrealizedPnL: 97.5,
    unrealizedPnLPercent: 9.67,
    openedAt: '2h ago',
    openedAtTimestamp: Date.now() - 7200000,
    signalType: 'Institutional Liquidity Sweep + 4H Demand Rebound',
    orderType: 'MARKET',
    isAutoTrade: true,
    autoTradeConfidence: 94,
    autoTradeGrade: 'A+',
    autoTradeReason: 'Price swept sell-side liquidity at Asian low before printing 15m CHoCH break upwards.',
  },
  {
    id: 'pos-live-eth-auto-02',
    symbol: 'ETH/USDT',
    category: 'Crypto',
    direction: 'LONG',
    entryPrice: 3480,
    currentPrice: 3540,
    quantity: 1.5,
    leverage: 10,
    marginUsed: 522,
    liquidationPrice: 3132,
    stopLoss: 3380,
    takeProfit: 3750,
    tp1: 3620,
    tp2: 3750,
    unrealizedPnL: 90.0,
    unrealizedPnLPercent: 17.24,
    openedAt: '1h 30m ago',
    openedAtTimestamp: Date.now() - 5400000,
    signalType: 'Fair Value Gap Mitigation + Volume Surge',
    orderType: 'MARKET',
    isAutoTrade: true,
    autoTradeConfidence: 89,
    autoTradeGrade: 'A',
    autoTradeReason: 'Bullish engulfing candle with FVG mitigation above 1H support level.',
  },
  {
    id: 'pos-live-sol-auto-03',
    symbol: 'SOL/USDT',
    category: 'Crypto',
    direction: 'LONG',
    entryPrice: 178.5,
    currentPrice: 184.2,
    quantity: 10,
    leverage: 10,
    marginUsed: 178.5,
    liquidationPrice: 160.65,
    stopLoss: 172.0,
    takeProfit: 195.0,
    tp1: 188.0,
    tp2: 195.0,
    unrealizedPnL: 57.0,
    unrealizedPnLPercent: 31.93,
    openedAt: '45m ago',
    openedAtTimestamp: Date.now() - 2700000,
    signalType: 'Trendline Breakout & Retest',
    orderType: 'MARKET',
    isAutoTrade: true,
    autoTradeConfidence: 91,
    autoTradeGrade: 'A+',
    autoTradeReason: 'High volume ascending triangle breakout confirmed with RSI momentum divergence.',
  },
];

const defaultAccount: PaperTradingAccount = {
  balance: 10000,
  initialBalance: 10000,
  equity: 10000,
  marginUsed: 0,
  freeCollateral: 10000,
  realizedPnL: 0,
  unrealizedPnL: 0,
  positions: defaultActivePositions,
  pendingOrders: [],
  history: [],
};

export const PaperTradingView: React.FC<PaperTradingViewProps> = ({
  assets,
  selectedAsset,
  onSelectAsset,
  onNavigateTab,
  onBack,
  onOpenBrokerSync,
}) => {
  const { formatCurrency, convertFromUsd, config: currencyConfig } = useCurrency();

  // Dual Currency (USDT & ₹ INR) Helpers
  const INR_PER_USD = 87.5;
  const formatINRValue = (usdVal: number, showSign = false): string => {
    if (isNaN(usdVal) || usdVal === 0) return '₹0';
    const inr = Math.round(usdVal * INR_PER_USD);
    const sign = inr > 0 && showSign ? '+' : '';
    return `${sign}₹${inr.toLocaleString('en-IN')}`;
  };

  const isIndianAsset = (assetOrSymbol?: string | MarketAsset | null): boolean => {
    return isIndianMarketAsset(assetOrSymbol);
  };

  const formatCurrencyForAsset = (
    val: number,
    symbolOrAsset?: string | MarketAsset | null,
    showSign = false,
    forcedDecimals?: number
  ): string => {
    return formatAssetPrice(val, symbolOrAsset, {
      showPlusSign: showSign,
      decimals: forcedDecimals,
    });
  };

  // -------------------------------------------------------------
  // LIVE BROKER API & TERMINAL MODE SWITCHER
  // -------------------------------------------------------------
  const [tradingMode, setTradingMode] = useState<'PRACTICE' | 'LIVE_BROKER'>(() => {
    try {
      const saved = localStorage.getItem('tradeos_terminal_mode');
      if (saved === 'LIVE_BROKER' || saved === 'PRACTICE') return saved;
    } catch {}
    return 'PRACTICE';
  });

  const [connectedBrokers, setConnectedBrokers] = useState<BrokerConnection[]>(() => {
    try {
      const saved = localStorage.getItem('tradeos_connected_brokers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_BROKER_LIST;
  });

  const [activeBroker, setActiveBroker] = useState<BrokerConnection | null>(() => {
    return DEFAULT_BROKER_LIST.find((b) => b.isConnected) || DEFAULT_BROKER_LIST[0];
  });

  const [isBrokerSyncModalOpen, setIsBrokerSyncModalOpen] = useState<boolean>(false);
  const [isOptionsChainOpen, setIsOptionsChainOpen] = useState<boolean>(false);
  const [selectedOptionContract, setSelectedOptionContract] = useState<OptionContractSelection | null>(null);
  const [marketSegmentTab, setMarketSegmentTab] = useState<'ALL' | 'CRYPTO' | 'FOREX' | 'COMMODITIES' | 'INDIAN_FNO'>('ALL');
  const [isExecutingLiveOrder, setIsExecutingLiveOrder] = useState<boolean>(false);

  const handleChangeTradingMode = (mode: 'PRACTICE' | 'LIVE_BROKER') => {
    setTradingMode(mode);
    try {
      localStorage.setItem('tradeos_terminal_mode', mode);
    } catch {}
    showToast(
      'info',
      mode === 'LIVE_BROKER'
        ? `⚡ Live Broker API Mode Activated (${activeBroker?.name || 'Exchange Bridge Active'})`
        : '🛡️ Switched to Practice Virtual Simulator ($10,000 Demo Capital)'
    );
  };

  const handleSelectBroker = (broker: BrokerConnection) => {
    setActiveBroker(broker);
    setConnectedBrokers((prev) =>
      prev.map((b) => (b.id === broker.id ? { ...b, isConnected: true, status: 'CONNECTED' } : b))
    );
    showToast('success', `🟢 Connected to ${broker.name} (${broker.latencyMs || 4}ms Latency • 0 Lag)`);
  };

  const handleTriggerOpenBrokerSync = () => {
    if (onOpenBrokerSync) {
      onOpenBrokerSync();
    } else {
      setIsBrokerSyncModalOpen(true);
    }
  };

  const [account, setAccount] = useState<PaperTradingAccount>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('tradeos_paper_account_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedPositions = Array.isArray(parsed.positions) && parsed.positions.length > 0 ? parsed.positions : defaultActivePositions;
        const rawHistory: PaperTradeHistoryItem[] = Array.isArray(parsed.history) ? parsed.history : [];
        
        // Sanitize and backfill history items
        const sanitizedHistory: PaperTradeHistoryItem[] = rawHistory.map((h) => {
          const isAuto = Boolean(h.isAutoTrade || h.signalType?.includes('Auto') || h.signalType?.includes('Breakout') || h.id?.includes('auto'));
          const realized = Number(h.realizedPnL) || 0;
          return {
            ...h,
            isAutoTrade: isAuto,
            outcomeVerdict: h.outcomeVerdict || (realized > 0 ? 'RIGHT_TRADE' : realized < 0 ? 'WRONG_TRADE' : 'BREAKEVEN'),
            openedAt: h.openedAt || '12:00:00 PM',
            closedAt: h.closedAt || '12:05:00 PM',
            duration: h.duration || (h.openedAtTimestamp && h.closedAtTimestamp ? formatTradeDuration(h.openedAtTimestamp, h.closedAtTimestamp) : '3m 20s'),
            exitReasonDetail: h.exitReasonDetail || (h.reason === 'TAKE_PROFIT' ? `🎯 Take profit target filled at $${h.exitPrice.toLocaleString()}` : h.reason === 'STOP_LOSS' ? `🛑 Stop loss triggered at $${h.exitPrice.toLocaleString()}` : h.reason === 'LIQUIDATED' ? `💥 Liquidation price breached` : `✋ Position closed at $${h.exitPrice.toLocaleString()}`),
          };
        });

        const histRealizedPnL = Number(sanitizedHistory.reduce((sum, h) => sum + (Number(h.realizedPnL) || 0), 0).toFixed(2));
        const initBal = Number(parsed.initialBalance) || 10000;
        const actualBal = Number((initBal + histRealizedPnL).toFixed(2));
        return {
          ...defaultAccount,
          ...parsed,
          initialBalance: initBal,
          balance: actualBal,
          realizedPnL: histRealizedPnL,
          pendingOrders: parsed.pendingOrders || [],
          positions: savedPositions,
          history: sanitizedHistory,
        };
      }
    } catch {}
    return defaultAccount;
  });

  // Tab View for Right Panel: Positions vs Pending Limit Orders vs History
  const [activePositionsTab, setActivePositionsTab] = useState<'POSITIONS' | 'PENDING_ORDERS' | 'HISTORY'>('POSITIONS');

  // History Filter: All, Right Trades (Wins), Wrong Trades (Losses), Auto-Trades, Manual Trades
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'RIGHT' | 'WRONG' | 'AUTO' | 'MANUAL'>('ALL');

  // Order Entry State
  const [sizingMode, setSizingMode] = useState<'QUANTITY' | 'MARGIN'>('QUANTITY');
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState<number>(selectedAsset.price);
  const [leverage, setLeverage] = useState<number>(10);

  // Quantity and Margin states
  const [quantityInput, setQuantityInput] = useState<number>(0.1);
  const [marginInput, setMarginInput] = useState<number>(500);

  // SL & TP Inputs
  const [stopLossPrice, setStopLossPrice] = useState<number>(
    direction === 'LONG'
      ? Number((selectedAsset.price * 0.97).toFixed(2))
      : Number((selectedAsset.price * 1.03).toFixed(2))
  );
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(
    direction === 'LONG'
      ? Number((selectedAsset.price * 1.06).toFixed(2))
      : Number((selectedAsset.price * 0.94).toFixed(2))
  );

  // Trailing Stop Loss State
  const [isTrailingEnabled, setIsTrailingEnabled] = useState<boolean>(false);
  const [trailingDistanceInput, setTrailingDistanceInput] = useState<number>(
    Number((selectedAsset.price * 0.02).toFixed(2))
  );

  // Order Confirmation Prompt Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState<boolean>(false);
  const [isResetDemoModalOpen, setIsResetDemoModalOpen] = useState<boolean>(false);

  // Order Update / Edit Position Modal
  const [editingPosition, setEditingPosition] = useState<PaperPosition | null>(null);
  const [editSL, setEditSL] = useState<number>(0);
  const [editTP, setEditTP] = useState<number>(0);
  const [editTrailingEnabled, setEditTrailingEnabled] = useState<boolean>(false);
  const [editTrailingDistance, setEditTrailingDistance] = useState<number>(0);
  const [partialCloseQty, setPartialCloseQty] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // -------------------------------------------------------------
  // SENTINEL AUTO-TRADER STATE & RISK AUTOMATION
  // -------------------------------------------------------------
  const [autoTradeConfig, setAutoTradeConfig] = useState<AutoTradeConfig>(() => {
    try {
      const saved = localStorage.getItem(AUTO_TRADE_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const maxPos = parsed.maxOpenPositions && parsed.maxOpenPositions > 3 ? parsed.maxOpenPositions : 15;
        return { ...DEFAULT_AUTO_TRADE_CONFIG, ...parsed, maxOpenPositions: maxPos };
      }
    } catch {}
    return DEFAULT_AUTO_TRADE_CONFIG;
  });

  const [autoTradeLogs, setAutoTradeLogs] = useState<AutoTradeLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(AUTO_TRADE_LOGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [isAutoConfigModalOpen, setIsAutoConfigModalOpen] = useState<boolean>(false);
  const [isAutoLogModalOpen, setIsAutoLogModalOpen] = useState<boolean>(false);
  const [positionSourceFilter, setPositionSourceFilter] = useState<'ALL' | 'AUTO' | 'MANUAL'>('ALL');

  // Audio Chime on Auto-Execution
  const playAutoTradeChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  // Sync Auto-Trade Config & Logs with Server Disk & Firestore
  useEffect(() => {
    // 1. Fetch from server disk
    fetch('/api/paper/autotrade-config')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.config) {
          const maxPos = data.config.maxOpenPositions && data.config.maxOpenPositions > 3 ? data.config.maxOpenPositions : 15;
          setAutoTradeConfig((prev) => ({ ...prev, ...data.config, maxOpenPositions: prev.maxOpenPositions || maxPos }));
        }
      })
      .catch(() => {});

    fetch('/api/paper/autotrade-logs')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.logs) && data.logs.length > 0) {
          setAutoTradeLogs(data.logs);
        }
      })
      .catch(() => {});

    // 2. Realtime listener from Firestore
    try {
      const unsubConfig = onSnapshot(
        doc(db, 'system_state', 'autotrade_config'),
        (snap) => {
          if (snap.exists()) {
            const cloudConfig = snap.data() as AutoTradeConfig;
            setAutoTradeConfig((prev) => {
              const maxPos = cloudConfig.maxOpenPositions && cloudConfig.maxOpenPositions >= 5 ? cloudConfig.maxOpenPositions : (prev.maxOpenPositions || 15);
              return { ...prev, ...cloudConfig, maxOpenPositions: maxPos };
            });
          }
        },
        (err) => {
          console.warn('[PaperTrading] autotrade_config snapshot info:', err?.message || err);
        }
      );
      const unsubLogs = onSnapshot(
        doc(db, 'system_state', 'autotrade_logs'),
        (snap) => {
          if (snap.exists()) {
            const cloudData = snap.data();
            if (cloudData && Array.isArray(cloudData.logs) && cloudData.logs.length > 0) {
              setAutoTradeLogs(cloudData.logs);
            }
          }
        },
        (err) => {
          console.warn('[PaperTrading] autotrade_logs snapshot info:', err?.message || err);
        }
      );
      return () => {
        try {
          unsubConfig();
        } catch {}
        try {
          unsubLogs();
        } catch {}
      };
    } catch {}
  }, []);

  const handleSaveAutoTradeConfig = (updated: AutoTradeConfig) => {
    setAutoTradeConfig(updated);
    try {
      localStorage.setItem(AUTO_TRADE_CONFIG_KEY, JSON.stringify(updated));
    } catch {}
    fetch('/api/paper/autotrade-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});
    try {
      setDoc(doc(db, 'system_state', 'autotrade_config'), {
        ...updated,
        updatedAt: new Date().toISOString(),
      }, { merge: true }).catch(() => {});
    } catch {}
    showToast('success', `⚡ Sentinel Auto-Trader settings updated (${updated.isEnabled ? 'ON' : 'PAUSED'})`);
  };

  const handleClearAutoTradeLogs = () => {
    setAutoTradeLogs([]);
    try {
      localStorage.removeItem(AUTO_TRADE_LOGS_KEY);
    } catch {}
    fetch('/api/paper/autotrade-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: [] }),
    }).catch(() => {});
    try {
      setDoc(doc(db, 'system_state', 'autotrade_logs'), { logs: [], updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    } catch {}
    showToast('info', 'Auto-trade audit logs cleared.');
  };

  // -------------------------------------------------------------
  // EMERGENCY PANIC CLOSE ALL AUTO-TRADES
  // -------------------------------------------------------------
  const handlePanicCloseAllAutoTrades = () => {
    const autoPositions = account.positions.filter((p) => p.isAutoTrade);
    const autoPending = (account.pendingOrders || []).filter((o) => o.isAutoTrade);

    if (autoPositions.length === 0 && autoPending.length === 0) {
      showToast('info', 'No active auto-trade positions or pending orders found.');
      return;
    }

    setAccount((prev) => {
      let freedMargin = 0;
      let totalRealizedFromClose = 0;
      const newHistory: PaperTradeHistoryItem[] = [];

      for (const pos of autoPositions) {
        const asset = assets.find((a) => a.symbol === pos.symbol);
        const exitPrice = asset ? asset.price : pos.currentPrice;
        const diff = pos.direction === 'LONG' ? exitPrice - pos.entryPrice : pos.entryPrice - exitPrice;
        const realized = Number((diff * pos.quantity).toFixed(2));
        const realizedPct = Number(((realized / (pos.marginUsed || 1)) * 100).toFixed(2));

        freedMargin += pos.marginUsed;
        totalRealizedFromClose += realized;

        recordSymbolTradeClosed(pos.symbol);
        newHistory.unshift({
          id: `hist-panic-${Date.now()}-${pos.id}`,
          symbol: pos.symbol,
          category: pos.category,
          direction: pos.direction,
          entryPrice: pos.entryPrice,
          exitPrice: exitPrice,
          quantity: pos.quantity,
          leverage: pos.leverage,
          marginUsed: pos.marginUsed,
          realizedPnL: realized,
          realizedPnLPercent: realizedPct,
          reason: 'MANUAL_CLOSE',
          exitReasonDetail: '🚨 Emergency Panic Close by Trader',
          openedAt: pos.openedAt,
          closedAt: new Date().toLocaleTimeString(),
          openedAtTimestamp: pos.openedAtTimestamp || Date.now() - 60000,
          closedAtTimestamp: Date.now(),
          duration: formatTradeDuration(pos.openedAtTimestamp, Date.now()),
          outcomeVerdict: realized > 0 ? 'RIGHT_TRADE' : (realized < 0 ? 'WRONG_TRADE' : 'BREAKEVEN'),
          inrRealizedPnL: Number((realized * INR_PER_USD).toFixed(2)),
          signalType: pos.signalType || 'Sentinel Auto-Trader Emergency Close',
          isAutoTrade: true,
          autoTradeConfidence: pos.autoTradeConfidence,
          autoTradeGrade: pos.autoTradeGrade,
          autoTradeReason: pos.autoTradeReason,
        });
      }

      // Refund pending auto orders margin
      for (const order of autoPending) {
        freedMargin += order.marginRequired || 0;
      }

      const remainingPositions = prev.positions.filter((p) => !p.isAutoTrade);
      const remainingPending = (prev.pendingOrders || []).filter((o) => !o.isAutoTrade);

      return {
        ...prev,
        balance: Number((prev.balance + totalRealizedFromClose).toFixed(2)),
        realizedPnL: Number((prev.realizedPnL + totalRealizedFromClose).toFixed(2)),
        marginUsed: Number(Math.max(0, prev.marginUsed - freedMargin).toFixed(2)),
        freeCollateral: Number((prev.freeCollateral + freedMargin + totalRealizedFromClose).toFixed(2)),
        positions: remainingPositions,
        pendingOrders: remainingPending,
        history: [...newHistory, ...prev.history],
      };
    });

    showToast(
      'success',
      `🛑 Closed ${autoPositions.length} auto positions & cancelled ${autoPending.length} auto limit orders.`
    );
  };

  // -------------------------------------------------------------
  // PERSISTENCE ENGINE: MULTI-REMIX CLOUD DISK + FIRESTORE + LOCAL STORAGE SYNC
  // -------------------------------------------------------------
  useEffect(() => {
    // 1. Load from server disk state on boot to ensure nothing is lost during remix
    fetch('/api/paper/account')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.account) {
          setAccount((prev) => {
            const serverPositions: PaperPosition[] = data.account.positions || [];
            const serverPending: PaperPendingOrder[] = data.account.pendingOrders || [];
            const serverHistory: PaperTradeHistoryItem[] = data.account.history || [];

            // Merge running positions so no trade is ever lost
            const currentPosIds = new Set(prev.positions.map((p) => p.id));
            const mergedPositions = [
              ...prev.positions,
              ...serverPositions.filter((p) => !currentPosIds.has(p.id)),
            ];

            // Merge pending orders
            const currentPendingIds = new Set((prev.pendingOrders || []).map((o) => o.id));
            const mergedPending = [
              ...(prev.pendingOrders || []),
              ...serverPending.filter((o) => !currentPendingIds.has(o.id)),
            ];

            // Check if user locally cleared history
            const localSaved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('tradeos_paper_account_v1');
            let mergedHistory = [...prev.history];
            if (localSaved) {
              try {
                const parsed = JSON.parse(localSaved);
                if (Array.isArray(parsed.history) && parsed.history.length === 0) {
                  mergedHistory = [];
                } else if (serverHistory.length > 0) {
                  const currentHistIds = new Set(prev.history.map((h) => h.id));
                  mergedHistory = [
                    ...prev.history,
                    ...serverHistory.filter((h) => !currentHistIds.has(h.id)),
                  ];
                }
              } catch {}
            } else if (serverHistory.length > 0) {
              const currentHistIds = new Set(prev.history.map((h) => h.id));
              mergedHistory = [
                ...prev.history,
                ...serverHistory.filter((h) => !currentHistIds.has(h.id)),
              ];
            }

            const calculatedRealized = Number(mergedHistory.reduce((sum, h) => sum + (Number(h.realizedPnL) || 0), 0).toFixed(2));
            const initBal = prev.initialBalance || 10000;
            const newBal = Number((initBal + calculatedRealized).toFixed(2));

            return {
              ...prev,
              balance: newBal,
              realizedPnL: calculatedRealized,
              positions: mergedPositions.length > 0 ? mergedPositions : defaultActivePositions,
              pendingOrders: mergedPending,
              history: mergedHistory,
            };
          });
        }
      })
      .catch((err) => {
        console.warn('[PaperTrading] Could not fetch server backup:', err);
      });

    // 2. Realtime listener from Firestore system_state
    try {
      const unsub = onSnapshot(
        doc(db, 'system_state', 'live_paper_account'),
        (snapshot) => {
          if (snapshot.exists()) {
            const cloudState = snapshot.data() as Partial<PaperTradingAccount>;
            if (cloudState && Array.isArray(cloudState.positions)) {
              setAccount((prev) => {
                const cloudPositions = cloudState.positions || [];
                const currIds = new Set(prev.positions.map((p) => p.id));
                const merged = [
                  ...prev.positions,
                  ...cloudPositions.filter((p) => !currIds.has(p.id)),
                ];
                const cloudHistory = Array.isArray(cloudState.history) ? cloudState.history : [];
                const localSaved = localStorage.getItem(STORAGE_KEY);
                let finalHistory = prev.history;
                if (localSaved) {
                  try {
                    const parsed = JSON.parse(localSaved);
                    if (Array.isArray(parsed.history) && parsed.history.length === 0 && cloudHistory.length === 0) {
                      finalHistory = [];
                    }
                  } catch {}
                }
                const calculatedRealized = Number(finalHistory.reduce((sum, h) => sum + (Number(h.realizedPnL) || 0), 0).toFixed(2));
                const initBal = prev.initialBalance || 10000;
                const newBal = Number((initBal + calculatedRealized).toFixed(2));

                return {
                  ...prev,
                  balance: newBal,
                  realizedPnL: calculatedRealized,
                  positions: merged.length > 0 ? merged : prev.positions,
                  pendingOrders: cloudState.pendingOrders ?? prev.pendingOrders,
                  history: finalHistory,
                };
              });
            }
          }
        },
        (err) => {
          console.warn('[PaperTrading] live_paper_account snapshot info:', err?.message || err);
        }
      );
      return () => {
        try {
          unsub();
        } catch {}
      };
    } catch (err) {
      console.warn('[PaperTrading] Firestore listener initialization:', err);
    }
  }, []);

  // Continuous Auto-Save to localStorage, Server Disk, and Firestore
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    } catch {}

    const timer = setTimeout(() => {
      // 1. Post to Server Disk
      fetch('/api/paper/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      }).catch(() => {});

      // 2. Save to Firestore
      try {
        setDoc(doc(db, 'system_state', 'live_paper_account'), {
          balance: account.balance,
          initialBalance: account.initialBalance,
          equity: account.equity,
          marginUsed: account.marginUsed,
          freeCollateral: account.freeCollateral,
          realizedPnL: account.realizedPnL,
          unrealizedPnL: account.unrealizedPnL,
          positions: account.positions,
          pendingOrders: account.pendingOrders,
          history: account.history.slice(0, 50),
          updatedAt: new Date().toISOString(),
        }, { merge: true }).catch(() => {});
      } catch {}
    }, 600);

    return () => clearTimeout(timer);
  }, [account]);

  // Determine Unit Name for Asset
  const getUnitName = (asset: MarketAsset) => {
    if (asset.category === 'Crypto') return 'Coins / Units';
    if (asset.category === 'Stocks') return 'Shares / Units';
    if (asset.category === 'Forex') return 'Lots (100k)';
    if (asset.category === 'Commodities' || asset.category === 'Futures') return 'Lots / Contracts';
    return 'Units';
  };

  const getUnitShort = (asset: MarketAsset) => {
    const symbolClean = asset.symbol.split('/')[0].split('.')[0];
    if (asset.category === 'Crypto') return symbolClean;
    if (asset.category === 'Stocks') return 'Shares';
    if (asset.category === 'Forex') return 'Lots';
    if (asset.category === 'Commodities' || asset.category === 'Futures') return 'Contracts';
    return 'Units';
  };

  // Execution Price based on Order Type
  const currentExecPrice = orderType === 'MARKET' ? selectedAsset.price : limitPrice;

  // Initialize/Sync prices & quantities when asset or direction changes
  useEffect(() => {
    setLimitPrice(selectedAsset.price);
    const defaultQty = selectedAsset.price > 1000 ? 0.1 : selectedAsset.price > 100 ? 5 : 50;
    setQuantityInput(defaultQty);

    const totalVal = defaultQty * selectedAsset.price;
    const reqMargin = Number((totalVal / leverage).toFixed(2));
    setMarginInput(Math.min(reqMargin, Math.max(10, Math.round(account.freeCollateral * 0.25))));

    const slDiff = selectedAsset.price * 0.025;
    const tpDiff = selectedAsset.price * 0.055;

    if (direction === 'LONG') {
      setStopLossPrice(Number((selectedAsset.price - slDiff).toFixed(2)));
      setTakeProfitPrice(Number((selectedAsset.price + tpDiff).toFixed(2)));
    } else {
      setStopLossPrice(Number((selectedAsset.price + slDiff).toFixed(2)));
      setTakeProfitPrice(Number((selectedAsset.price - tpDiff).toFixed(2)));
    }

    setTrailingDistanceInput(Number((selectedAsset.price * 0.02).toFixed(2)));
  }, [selectedAsset.symbol, direction]);

  // Sizing sync handlers
  const handleQuantityChange = (qty: number) => {
    const validQty = Math.max(0.0001, qty);
    setQuantityInput(validQty);
    const totalVal = validQty * currentExecPrice;
    setMarginInput(Number((totalVal / leverage).toFixed(2)));
  };

  const handleMarginChange = (margin: number) => {
    const validMargin = Math.max(1, margin);
    setMarginInput(validMargin);
    const totalExposure = validMargin * leverage;
    const computedQty = currentExecPrice > 0 ? totalExposure / currentExecPrice : 0.1;
    setQuantityInput(Number(computedQty.toFixed(4)));
  };

  const handleApplyMarginPercent = (pct: number) => {
    const targetMargin = Math.max(10, Math.round(account.freeCollateral * pct));
    handleMarginChange(targetMargin);
  };

  // Active Computed Calculations
  const activeQuantity = sizingMode === 'QUANTITY' ? quantityInput : (marginInput * leverage) / (currentExecPrice || 1);
  const totalPositionSizeUsd = activeQuantity * currentExecPrice;
  const computedMarginRequired = Number((totalPositionSizeUsd / leverage).toFixed(2));

  // Liquidation Price calculation
  const mmr = 0.005; // 0.5% maintenance margin
  const liquidationPrice =
    direction === 'LONG'
      ? Math.max(0, currentExecPrice * (1 - 1 / leverage + mmr))
      : currentExecPrice * (1 + 1 / leverage - mmr);

  // Profit/Loss Projections
  const isLong = direction === 'LONG';
  const slDistancePoints = stopLossPrice ? Math.abs(currentExecPrice - stopLossPrice) : 0;
  const slDistancePercent = currentExecPrice > 0 ? (slDistancePoints / currentExecPrice) * 100 : 0;
  const maxLossUsd = stopLossPrice
    ? Math.abs(isLong ? currentExecPrice - stopLossPrice : stopLossPrice - currentExecPrice) * activeQuantity
    : computedMarginRequired;
  const maxLossPercentOnMargin = computedMarginRequired > 0 ? (maxLossUsd / computedMarginRequired) * 100 : 0;

  const tpDistancePoints = takeProfitPrice ? Math.abs(takeProfitPrice - currentExecPrice) : 0;
  const tpDistancePercent = currentExecPrice > 0 ? (tpDistancePoints / currentExecPrice) * 100 : 0;
  const maxProfitUsd = takeProfitPrice
    ? Math.abs(isLong ? takeProfitPrice - currentExecPrice : currentExecPrice - takeProfitPrice) * activeQuantity
    : 0;
  const maxProfitPercentOnMargin = computedMarginRequired > 0 ? (maxProfitUsd / computedMarginRequired) * 100 : 0;

  const calculatedRRRatio =
    slDistancePoints > 0 ? Number((tpDistancePoints / slDistancePoints).toFixed(2)) : 2.0;

  const handleApplyRiskRewardPreset = (ratio: number) => {
    const slDistance = selectedAsset.price * 0.02;
    const tpDistance = slDistance * ratio;

    if (direction === 'LONG') {
      setStopLossPrice(Number((selectedAsset.price - slDistance).toFixed(2)));
      setTakeProfitPrice(Number((selectedAsset.price + tpDistance).toFixed(2)));
    } else {
      setStopLossPrice(Number((selectedAsset.price + slDistance).toFixed(2)));
      setTakeProfitPrice(Number((selectedAsset.price - tpDistance).toFixed(2)));
    }
  };

  // -------------------------------------------------------------
  // REAL-TIME 1-SECOND TICKER: POSITIONS MARK + PENDING LIMIT TRIGGER
  // -------------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      setAccount((prev) => {
        let totalUnrealized = 0;
        let totalMargin = 0;
        const closedPositionsThisTick: PaperTradeHistoryItem[] = [];
        const remainingPositions: PaperPosition[] = [];
        const remainingPending: PaperPendingOrder[] = [];
        const triggeredPositionsFromLimit: PaperPosition[] = [];

        // 1. Evaluate Pending Limit Orders
        for (const order of prev.pendingOrders || []) {
          const asset = assets.find((a) => a.symbol === order.symbol);
          const livePrice = asset ? asset.price : order.limitPrice;

          const isTriggered =
            order.direction === 'LONG'
              ? livePrice <= order.limitPrice
              : livePrice >= order.limitPrice;

          if (isTriggered) {
            // Trailing SL config for triggered order
            let tslConfig: TrailingStopLossConfig | undefined = order.trailingStopLoss;
            if (tslConfig?.enabled && tslConfig.trailDistance > 0) {
              const initialStop =
                order.direction === 'LONG'
                  ? Number((order.limitPrice - tslConfig.trailDistance).toFixed(2))
                  : Number((order.limitPrice + tslConfig.trailDistance).toFixed(2));
              tslConfig = {
                ...tslConfig,
                peakPrice: order.limitPrice,
                activeStopPrice: initialStop,
              };
            }

            const newPos: PaperPosition = {
              id: `paper-pos-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              symbol: order.symbol,
              category: order.category,
              direction: order.direction,
              entryPrice: order.limitPrice,
              currentPrice: livePrice,
              quantity: order.quantity,
              initialQuantity: order.quantity,
              leverage: order.leverage,
              marginUsed: order.marginRequired,
              liquidationPrice: order.liquidationPrice,
              stopLoss: order.stopLoss,
              takeProfit: order.takeProfit,
              trailingStopLoss: tslConfig,
              unrealizedPnL: 0,
              unrealizedPnLPercent: 0,
              openedAt: new Date().toLocaleTimeString(),
              openedAtTimestamp: Date.now(),
              lastUpdatedAt: new Date().toLocaleTimeString(),
              orderType: 'LIMIT',
              signalType: order.signalType || 'Limit Order Triggered',
            };

            triggeredPositionsFromLimit.push(newPos);
            showToast(
              'success',
              `🎯 Limit Order Filled: ${order.direction} ${order.quantity} ${order.symbol} @ $${order.limitPrice.toLocaleString()}!`
            );
            try {
              confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
            } catch {}
          } else {
            remainingPending.push(order);
          }
        }

        // 2. Evaluate Active Running Positions
        for (const pos of [...prev.positions, ...triggeredPositionsFromLimit]) {
          const asset = assets.find((a) => a.symbol === pos.symbol);
          const livePrice = asset ? asset.price : pos.currentPrice;

          // 1. Check Take Profit Hit
          const isTPHit =
            pos.takeProfit &&
            (pos.direction === 'LONG' ? livePrice >= pos.takeProfit : livePrice <= pos.takeProfit);

          if (isTPHit) {
            const diff = pos.direction === 'LONG' ? pos.takeProfit! - pos.entryPrice : pos.entryPrice - pos.takeProfit!;
            const realized = Number((diff * pos.quantity).toFixed(2));
            const realizedPct = Number(((realized / pos.marginUsed) * 100).toFixed(2));
            const isInd = isIndianAsset(pos.symbol);

            recordSymbolTradeClosed(pos.symbol);
            closedPositionsThisTick.push({
              id: `hist-tp-${Date.now()}-${pos.id}`,
              symbol: pos.symbol,
              category: pos.category,
              direction: pos.direction,
              entryPrice: pos.entryPrice,
              exitPrice: pos.takeProfit!,
              quantity: pos.quantity,
              leverage: pos.leverage,
              marginUsed: pos.marginUsed,
              realizedPnL: realized,
              realizedPnLPercent: realizedPct,
              reason: 'TAKE_PROFIT',
              exitReasonDetail: `🎯 Take Profit Target Triggered at ${formatCurrencyForAsset(pos.takeProfit!, pos.symbol)} (Target Hit)`,
              openedAt: pos.openedAt,
              closedAt: new Date().toLocaleTimeString(),
              openedAtTimestamp: pos.openedAtTimestamp || Date.now() - 60000,
              closedAtTimestamp: Date.now(),
              duration: formatTradeDuration(pos.openedAtTimestamp, Date.now()),
              outcomeVerdict: 'RIGHT_TRADE',
              inrRealizedPnL: isInd ? realized : Number((realized * INR_PER_USD).toFixed(2)),
              signalType: pos.signalType || 'Breakout SMC / Manual',
              isAutoTrade: Boolean(pos.isAutoTrade),
              autoTradeConfidence: pos.autoTradeConfidence,
              autoTradeGrade: pos.autoTradeGrade,
              autoTradeReason: pos.autoTradeReason,
            });
            continue;
          }

          // 2. Trailing Stop Loss Evaluation
          let updatedTrailing = pos.trailingStopLoss;
          if (updatedTrailing?.enabled) {
            let peak = updatedTrailing.peakPrice;
            let activeStop = updatedTrailing.activeStopPrice;

            if (pos.direction === 'LONG') {
              if (livePrice > peak) {
                peak = livePrice;
                activeStop = Number((peak - updatedTrailing.trailDistance).toFixed(2));
              }
              if (livePrice <= activeStop) {
                const diff = activeStop - pos.entryPrice;
                const realized = Number((diff * pos.quantity).toFixed(2));
                const realizedPct = Number(((realized / pos.marginUsed) * 100).toFixed(2));
                const isInd = isIndianAsset(pos.symbol);

                recordSymbolTradeClosed(pos.symbol);
                closedPositionsThisTick.push({
                  id: `hist-tsl-${Date.now()}-${pos.id}`,
                  symbol: pos.symbol,
                  category: pos.category,
                  direction: pos.direction,
                  entryPrice: pos.entryPrice,
                  exitPrice: activeStop,
                  quantity: pos.quantity,
                  leverage: pos.leverage,
                  marginUsed: pos.marginUsed,
                  realizedPnL: realized,
                  realizedPnLPercent: realizedPct,
                  reason: 'TRAILING_STOP',
                  exitReasonDetail: `⚡ Trailing Stop Triggered at ${formatCurrencyForAsset(activeStop, pos.symbol)} (Locked Profit)`,
                  openedAt: pos.openedAt,
                  closedAt: new Date().toLocaleTimeString(),
                  openedAtTimestamp: pos.openedAtTimestamp || Date.now() - 60000,
                  closedAtTimestamp: Date.now(),
                  duration: formatTradeDuration(pos.openedAtTimestamp, Date.now()),
                  outcomeVerdict: realized > 0 ? 'RIGHT_TRADE' : (realized < 0 ? 'WRONG_TRADE' : 'BREAKEVEN'),
                  inrRealizedPnL: isInd ? realized : Number((realized * INR_PER_USD).toFixed(2)),
                  signalType: pos.signalType || 'Breakout SMC / Manual',
                  isAutoTrade: Boolean(pos.isAutoTrade),
                  autoTradeConfidence: pos.autoTradeConfidence,
                  autoTradeGrade: pos.autoTradeGrade,
                  autoTradeReason: pos.autoTradeReason,
                });
                continue;
              }
            } else {
              // SHORT
              if (livePrice < peak) {
                peak = livePrice;
                activeStop = Number((peak + updatedTrailing.trailDistance).toFixed(2));
              }
              if (livePrice >= activeStop) {
                const diff = pos.entryPrice - activeStop;
                const realized = Number((diff * pos.quantity).toFixed(2));
                const realizedPct = Number(((realized / pos.marginUsed) * 100).toFixed(2));
                const isInd = isIndianAsset(pos.symbol);

                recordSymbolTradeClosed(pos.symbol);
                closedPositionsThisTick.push({
                  id: `hist-tsl-${Date.now()}-${pos.id}`,
                  symbol: pos.symbol,
                  category: pos.category,
                  direction: pos.direction,
                  entryPrice: pos.entryPrice,
                  exitPrice: activeStop,
                  quantity: pos.quantity,
                  leverage: pos.leverage,
                  marginUsed: pos.marginUsed,
                  realizedPnL: realized,
                  realizedPnLPercent: realizedPct,
                  reason: 'TRAILING_STOP',
                  exitReasonDetail: `⚡ Trailing Stop Triggered at ${formatCurrencyForAsset(activeStop, pos.symbol)} (Locked Profit)`,
                  openedAt: pos.openedAt,
                  closedAt: new Date().toLocaleTimeString(),
                  openedAtTimestamp: pos.openedAtTimestamp || Date.now() - 60000,
                  closedAtTimestamp: Date.now(),
                  duration: formatTradeDuration(pos.openedAtTimestamp, Date.now()),
                  outcomeVerdict: realized > 0 ? 'RIGHT_TRADE' : (realized < 0 ? 'WRONG_TRADE' : 'BREAKEVEN'),
                  inrRealizedPnL: isInd ? realized : Number((realized * INR_PER_USD).toFixed(2)),
                  signalType: pos.signalType || 'Breakout SMC / Manual',
                  isAutoTrade: Boolean(pos.isAutoTrade),
                  autoTradeConfidence: pos.autoTradeConfidence,
                  autoTradeGrade: pos.autoTradeGrade,
                  autoTradeReason: pos.autoTradeReason,
                });
                continue;
              }
            }

            updatedTrailing = {
              ...updatedTrailing,
              peakPrice: peak,
              activeStopPrice: activeStop,
            };
          }

          // 3. Check Auto-Move SL to Breakeven on TP1 Hit (Requires genuine +1.2% expansion and at least 25s elapsed)
          let currentStopLoss = pos.stopLoss;
          let isSlAtBreakeven = pos.slMovedToBreakeven;

          if (pos.isAutoTrade && autoTradeConfig.autoMoveSlToBreakeven && !isSlAtBreakeven && pos.tp1) {
            const isTP1Hit = pos.direction === 'LONG' ? livePrice >= pos.tp1 : livePrice <= pos.tp1;
            const elapsedSinceOpen = Date.now() - (pos.openedAtTimestamp || 0);
            const profitPct = pos.direction === 'LONG'
              ? ((livePrice - pos.entryPrice) / pos.entryPrice) * 100
              : ((pos.entryPrice - livePrice) / pos.entryPrice) * 100;

            if (isTP1Hit && profitPct >= 1.2 && elapsedSinceOpen >= 25000) {
              currentStopLoss = pos.direction === 'LONG'
                ? Number((pos.entryPrice * 1.0015).toFixed(pos.entryPrice < 2 ? 4 : 2))
                : Number((pos.entryPrice * 0.9985).toFixed(pos.entryPrice < 2 ? 4 : 2));
              isSlAtBreakeven = true;
              showToast(
                'success',
                `🛡️ [Auto-Trader] Stop Loss moved to BREAKEVEN (${formatCurrencyForAsset(pos.entryPrice, pos.symbol)}) for ${pos.symbol} (TP1 Reached — Risk-Free Runner!)`
              );
            }
          }

          // 4. Check Standard Stop Loss Hit (Executes FIRST before liquidation to strictly protect account)
          const isSLHit =
            currentStopLoss &&
            (pos.direction === 'LONG' ? livePrice <= currentStopLoss : livePrice >= currentStopLoss);

          if (isSLHit) {
            const diff = pos.direction === 'LONG' ? currentStopLoss! - pos.entryPrice : pos.entryPrice - currentStopLoss!;
            const realized = Number((diff * pos.quantity).toFixed(2));
            const realizedPct = Number(((realized / pos.marginUsed) * 100).toFixed(2));
            const isInd = isIndianAsset(pos.symbol);

            recordSymbolTradeClosed(pos.symbol);
            closedPositionsThisTick.push({
              id: `hist-sl-${Date.now()}-${pos.id}`,
              symbol: pos.symbol,
              category: pos.category,
              direction: pos.direction,
              entryPrice: pos.entryPrice,
              exitPrice: currentStopLoss!,
              quantity: pos.quantity,
              leverage: pos.leverage,
              marginUsed: pos.marginUsed,
              realizedPnL: realized,
              realizedPnLPercent: realizedPct,
              reason: 'STOP_LOSS',
              exitReasonDetail: `🛑 Stop Loss Triggered at ${formatCurrencyForAsset(currentStopLoss!, pos.symbol)} (${realized < 0 ? 'Risk Protection Cut' : 'Breakeven Exit'})`,
              openedAt: pos.openedAt,
              closedAt: new Date().toLocaleTimeString(),
              openedAtTimestamp: pos.openedAtTimestamp || Date.now() - 60000,
              closedAtTimestamp: Date.now(),
              duration: formatTradeDuration(pos.openedAtTimestamp, Date.now()),
              outcomeVerdict: realized > 0 ? 'RIGHT_TRADE' : (realized < 0 ? 'WRONG_TRADE' : 'BREAKEVEN'),
              inrRealizedPnL: isInd ? realized : Number((realized * INR_PER_USD).toFixed(2)),
              signalType: pos.signalType || 'Breakout SMC / Manual',
              isAutoTrade: Boolean(pos.isAutoTrade),
              autoTradeConfidence: pos.autoTradeConfidence,
              autoTradeGrade: pos.autoTradeGrade,
              autoTradeReason: pos.autoTradeReason,
            });
            continue;
          }

          // 5. Check Liquidation (Safety fallback if no SL or extreme gap)
          const isLiquidated =
            pos.direction === 'LONG'
              ? livePrice <= pos.liquidationPrice
              : livePrice >= pos.liquidationPrice;

          if (isLiquidated) {
            const isInd = isIndianAsset(pos.symbol);
            recordSymbolTradeClosed(pos.symbol);
            closedPositionsThisTick.push({
              id: `hist-liq-${Date.now()}-${pos.id}`,
              symbol: pos.symbol,
              category: pos.category,
              direction: pos.direction,
              entryPrice: pos.entryPrice,
              exitPrice: pos.liquidationPrice,
              quantity: pos.quantity,
              leverage: pos.leverage,
              marginUsed: pos.marginUsed,
              realizedPnL: -pos.marginUsed,
              realizedPnLPercent: -100,
              reason: 'LIQUIDATED',
              exitReasonDetail: `💥 Liquidation Triggered: Price breached margin liquidation boundary (${formatCurrencyForAsset(pos.liquidationPrice, pos.symbol)})`,
              openedAt: pos.openedAt,
              closedAt: new Date().toLocaleTimeString(),
              openedAtTimestamp: pos.openedAtTimestamp || Date.now() - 60000,
              closedAtTimestamp: Date.now(),
              duration: formatTradeDuration(pos.openedAtTimestamp, Date.now()),
              outcomeVerdict: 'WRONG_TRADE',
              inrRealizedPnL: isInd ? -pos.marginUsed : -Number((pos.marginUsed * INR_PER_USD).toFixed(2)),
              signalType: pos.signalType || 'Breakout SMC / Manual',
              isAutoTrade: Boolean(pos.isAutoTrade),
              autoTradeConfidence: pos.autoTradeConfidence,
              autoTradeGrade: pos.autoTradeGrade,
              autoTradeReason: pos.autoTradeReason,
            });
            continue;
          }

          // Position Active
          const diff = pos.direction === 'LONG' ? livePrice - pos.entryPrice : pos.entryPrice - livePrice;
          const uPnL = diff * pos.quantity;
          const uPnLPercent = (uPnL / (pos.marginUsed || 1)) * 100;

          totalUnrealized += uPnL;
          totalMargin += pos.marginUsed;

          remainingPositions.push({
            ...pos,
            currentPrice: livePrice,
            stopLoss: currentStopLoss,
            slMovedToBreakeven: isSlAtBreakeven,
            trailingStopLoss: updatedTrailing,
            unrealizedPnL: Number(uPnL.toFixed(2)),
            unrealizedPnLPercent: Number(uPnLPercent.toFixed(2)),
          });
        }

        // Add margin from remaining pending orders
        const pendingMargin = remainingPending.reduce((sum, o) => sum + (o.marginRequired || 0), 0);
        totalMargin += pendingMargin;

        // Aggregate realized changes
        let addedRealizedPnL = 0;
        closedPositionsThisTick.forEach((item) => {
          addedRealizedPnL += item.realizedPnL;
        });

        const newBalance = Number((prev.balance + addedRealizedPnL).toFixed(2));
        const newRealizedTotal = Number((prev.realizedPnL + addedRealizedPnL).toFixed(2));
        const newEquity = Number((newBalance + totalUnrealized).toFixed(2));
        const freeColl = Number((newEquity - totalMargin).toFixed(2));

        return {
          ...prev,
          balance: newBalance,
          realizedPnL: newRealizedTotal,
          positions: remainingPositions,
          pendingOrders: remainingPending,
          unrealizedPnL: Number(totalUnrealized.toFixed(2)),
          equity: newEquity,
          marginUsed: Number(totalMargin.toFixed(2)),
          freeCollateral: freeColl,
          history: [...closedPositionsThisTick, ...prev.history],
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [assets, autoTradeConfig.autoMoveSlToBreakeven]);

  // -------------------------------------------------------------
  // AUTONOMOUS SENTINEL AUTO-TRADE EXECUTION ENGINE
  // -------------------------------------------------------------
  const lastAutoEvalTimeRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!autoTradeConfig.isEnabled) return;

    const autoTradeInterval = setInterval(() => {
      // Generate current institutional signals across market assets
      const freshSignals = generateInstitutionalSignals(assets);
      const now = Date.now();
      const newLogsToAppend: AutoTradeLogItem[] = [];

      setAccount((currentAccount) => {
        let updatedAcc = { ...currentAccount };
        let anyExecuted = false;

        // Sort signals by anti-fakeout confidence score descending (best institutional setups first)
        const sortedSignals = [...freshSignals].sort((a, b) => (b.antiFakeoutScore || 0) - (a.antiFakeoutScore || 0));

        for (const signal of sortedSignals) {
          // If we already filled a trade in this cycle, wait for next tick to avoid lag/freezing
          if (anyExecuted) break;

          // Check minimum confidence threshold
          if (signal.antiFakeoutScore < autoTradeConfig.minConfidenceScore) continue;

          // Check asset cooldown (default 10 minutes)
          const cooldownRemaining = getSymbolCooldownRemainingSeconds(signal.symbol, autoTradeConfig.cooldownMinutesPerAsset || 10);
          if (cooldownRemaining > 0) continue;

          // Throttle evaluations for the same symbol
          const lastEval = lastAutoEvalTimeRef.current.get(signal.symbol) || 0;
          if (now - lastEval < 10000) continue;
          lastAutoEvalTimeRef.current.set(signal.symbol, now);

          const asset = assets.find((a) => a.symbol === signal.symbol);
          const livePrice = asset ? asset.price : signal.price;

          const evalResult = evaluateAndExecuteSignal(
            signal,
            autoTradeConfig,
            updatedAcc,
            livePrice
          );

          if (evalResult.isExecuted) {
            recordSymbolTradeExecuted(signal.symbol);
            updatedAcc = evalResult.updatedAccount;
            anyExecuted = true;

            if (evalResult.logItem) {
              newLogsToAppend.push(evalResult.logItem);
            }

            if (autoTradeConfig.soundAlertOnExecution) {
              playAutoTradeChime();
            }

            if (evalResult.newPosition) {
              const formattedSL = formatCurrencyForAsset(evalResult.newPosition.stopLoss || signal.suggestedSL, signal.symbol);
              const formattedTP = formatCurrencyForAsset(evalResult.newPosition.takeProfit || signal.suggestedTP, signal.symbol);
              showToast(
                'success',
                `⚡ [Auto-Trader] MARKET FILLED: ${signal.direction} ${signal.symbol} (Score: ${signal.antiFakeoutScore}%, SL: ${formattedSL}, TP: ${formattedTP})`
              );
              try {
                confetti({ particleCount: 25, spread: 45, origin: { y: 0.8 } });
              } catch {}
            } else if (evalResult.newPendingOrder) {
              const formattedLimit = formatCurrencyForAsset(evalResult.newPendingOrder.limitPrice, signal.symbol);
              showToast(
                'info',
                `🎯 [Auto-Trader] LIMIT QUEUED: ${signal.direction} ${signal.symbol} @ ${formattedLimit} (Waiting for Pullback to Order Block)`
              );
            }
          }
        }

        if (newLogsToAppend.length > 0) {
          setAutoTradeLogs((prevLogs) => {
            const updated = [...newLogsToAppend, ...prevLogs].slice(0, 150);
            try {
              localStorage.setItem(AUTO_TRADE_LOGS_KEY, JSON.stringify(updated));
            } catch {}
            fetch('/api/paper/autotrade-logs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ logs: updated }),
            }).catch(() => {});
            return updated;
          });
        }

        return anyExecuted ? updatedAcc : currentAccount;
      });
    }, 5000);

    return () => clearInterval(autoTradeInterval);
  }, [assets, autoTradeConfig]);

  // -------------------------------------------------------------
  // ORDER EXECUTION & CONFIRMATION HANDLERS
  // -------------------------------------------------------------
  const handleOpenOrderConfirmation = () => {
    if (computedMarginRequired <= 0) {
      showToast('error', 'Please enter a valid quantity or margin amount.');
      return;
    }

    if (computedMarginRequired > account.freeCollateral) {
      showToast(
        'error',
        `Required margin ($${computedMarginRequired.toFixed(2)}) exceeds free collateral ($${account.freeCollateral.toFixed(2)})`
      );
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const handleConfirmExecuteMarket = async () => {
    setIsConfirmModalOpen(false);
    if (computedMarginRequired <= 0 || computedMarginRequired > account.freeCollateral) return;

    const effectiveSymbol = selectedOptionContract ? selectedOptionContract.contractSymbol : selectedAsset.symbol;
    const effectivePrice = selectedOptionContract ? selectedOptionContract.premiumInr : selectedAsset.price;
    const effectiveCategory = selectedOptionContract ? 'Indian Stocks / F&O' : selectedAsset.category;
    const effectiveCurrency = isIndianAsset(effectiveSymbol) ? 'INR' : 'USDT';

    let tslConfig: TrailingStopLossConfig | undefined = undefined;
    if (isTrailingEnabled && trailingDistanceInput > 0) {
      const initialStop =
        direction === 'LONG'
          ? Number((effectivePrice - trailingDistanceInput).toFixed(2))
          : Number((effectivePrice + trailingDistanceInput).toFixed(2));

      tslConfig = {
        enabled: true,
        trailDistance: trailingDistanceInput,
        peakPrice: effectivePrice,
        activeStopPrice: initialStop,
      };
    }

    if (tradingMode === 'LIVE_BROKER' && activeBroker) {
      setIsExecutingLiveOrder(true);
      try {
        const response = await fetch('/api/broker/execute-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brokerId: activeBroker.provider,
            symbol: effectiveSymbol,
            direction,
            orderType: 'MARKET',
            quantity: Number(activeQuantity.toFixed(4)),
            leverage,
            price: effectivePrice,
            stopLoss: stopLossPrice,
            takeProfit: takeProfitPrice,
            trailingStopLoss: tslConfig,
            currency: effectiveCurrency,
            isOptionContract: Boolean(selectedOptionContract),
            optionType: selectedOptionContract?.optionType,
            strikePrice: selectedOptionContract?.strikePrice,
            expiryDate: selectedOptionContract?.expiryDate,
            lotSize: selectedOptionContract?.lotSize,
          }),
        });
        const data = await response.json();
        if (data.success && data.position) {
          const livePos: PaperPosition = {
            ...data.position,
            isLiveBrokerTrade: true,
            brokerProvider: activeBroker.provider,
            brokerOrderId: data.order?.brokerOrderId || `ORD-${Date.now()}`,
            currency: effectiveCurrency,
          };
          setAccount((prev) => ({
            ...prev,
            marginUsed: Number((prev.marginUsed + computedMarginRequired).toFixed(2)),
            freeCollateral: Number((prev.freeCollateral - computedMarginRequired).toFixed(2)),
            positions: [livePos, ...prev.positions],
          }));

          const priceLabel = effectiveCurrency === 'INR' ? `₹${effectivePrice.toLocaleString()}` : `$${effectivePrice.toLocaleString()}`;
          showToast(
            'success',
            `🟢 [${activeBroker.name}] Order Filled: ${direction} ${livePos.quantity} ${effectiveSymbol} @ ${priceLabel} (${data.executionLatencyMs || activeBroker.latencyMs || 4}ms 0-Lag Execution)`
          );
          setActivePositionsTab('POSITIONS');
          try {
            confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
          } catch {}
          return;
        }
      } catch (err) {
        console.warn('Live broker execution failed, falling back to local engine:', err);
      } finally {
        setIsExecutingLiveOrder(false);
      }
    }

    const newPosition: PaperPosition = {
      id: `paper-${Date.now()}`,
      symbol: effectiveSymbol,
      category: effectiveCategory,
      direction,
      entryPrice: effectivePrice,
      currentPrice: effectivePrice,
      quantity: Number(activeQuantity.toFixed(4)),
      initialQuantity: Number(activeQuantity.toFixed(4)),
      leverage,
      marginUsed: Number(computedMarginRequired.toFixed(2)),
      liquidationPrice: Number(liquidationPrice.toFixed(2)),
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      trailingStopLoss: tslConfig,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      openedAt: new Date().toLocaleTimeString(),
      openedAtTimestamp: Date.now(),
      lastUpdatedAt: new Date().toLocaleTimeString(),
      orderType: 'MARKET',
      signalType: selectedOptionContract ? `Options ${selectedOptionContract.optionType} Trade` : 'Manual Market Order',
      isLiveBrokerTrade: false,
      currency: effectiveCurrency,
      isOptionContract: Boolean(selectedOptionContract),
      optionType: selectedOptionContract?.optionType,
      strikePrice: selectedOptionContract?.strikePrice,
      expiryDate: selectedOptionContract?.expiryDate,
      lotSize: selectedOptionContract?.lotSize,
    };

    setAccount((prev) => ({
      ...prev,
      marginUsed: Number((prev.marginUsed + computedMarginRequired).toFixed(2)),
      freeCollateral: Number((prev.freeCollateral - computedMarginRequired).toFixed(2)),
      positions: [newPosition, ...prev.positions],
    }));

    const priceLabel = effectiveCurrency === 'INR' ? `₹${effectivePrice.toLocaleString()}` : `$${effectivePrice.toLocaleString()}`;
    showToast(
      'success',
      `⚡ Market Order Executed: ${direction} ${newPosition.quantity} ${effectiveSymbol} @ ${priceLabel}`
    );

    setActivePositionsTab('POSITIONS');

    try {
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
    } catch {}
  };

  const handleConfirmPlaceLimit = async (targetLimitPrice: number) => {
    setIsConfirmModalOpen(false);
    if (computedMarginRequired <= 0 || computedMarginRequired > account.freeCollateral) return;

    const effectiveSymbol = selectedOptionContract ? selectedOptionContract.contractSymbol : selectedAsset.symbol;
    const effectiveCategory = selectedOptionContract ? 'Indian Stocks / F&O' : selectedAsset.category;
    const effectiveCurrency = isIndianAsset(effectiveSymbol) ? 'INR' : 'USDT';

    let tslConfig: TrailingStopLossConfig | undefined = undefined;
    if (isTrailingEnabled && trailingDistanceInput > 0) {
      const initialStop =
        direction === 'LONG'
          ? Number((targetLimitPrice - trailingDistanceInput).toFixed(2))
          : Number((targetLimitPrice + trailingDistanceInput).toFixed(2));

      tslConfig = {
        enabled: true,
        trailDistance: trailingDistanceInput,
        peakPrice: targetLimitPrice,
        activeStopPrice: initialStop,
      };
    }

    const newPendingOrder: PaperPendingOrder = {
      id: `limit-${Date.now()}`,
      symbol: effectiveSymbol,
      category: effectiveCategory,
      direction,
      orderType: 'LIMIT',
      limitPrice: targetLimitPrice,
      currentPriceAtPlacement: selectedOptionContract ? selectedOptionContract.premiumInr : selectedAsset.price,
      quantity: Number(activeQuantity.toFixed(4)),
      leverage,
      marginRequired: Number(computedMarginRequired.toFixed(2)),
      liquidationPrice: Number(liquidationPrice.toFixed(2)),
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      trailingStopLoss: tslConfig,
      status: 'PENDING',
      placedAt: new Date().toLocaleTimeString(),
      signalType: 'Limit Order SMC Setup',
      isLiveBrokerTrade: tradingMode === 'LIVE_BROKER',
      brokerProvider: tradingMode === 'LIVE_BROKER' ? activeBroker?.provider : undefined,
    };

    setAccount((prev) => ({
      ...prev,
      marginUsed: Number((prev.marginUsed + computedMarginRequired).toFixed(2)),
      freeCollateral: Number((prev.freeCollateral - computedMarginRequired).toFixed(2)),
      pendingOrders: [newPendingOrder, ...(prev.pendingOrders || [])],
    }));

    const priceLabel = effectiveCurrency === 'INR' ? `₹${targetLimitPrice.toLocaleString()}` : `$${targetLimitPrice.toLocaleString()}`;
    showToast(
      'info',
      `📌 Limit Order Placed: ${direction} ${newPendingOrder.quantity} ${effectiveSymbol} @ ${priceLabel} (Pending Trigger)`
    );

    setActivePositionsTab('PENDING_ORDERS');
  };

  const handleCancelPendingOrder = (orderId: string) => {
    const order = (account.pendingOrders || []).find((o) => o.id === orderId);
    if (!order) return;

    setAccount((prev) => {
      const remainingPending = (prev.pendingOrders || []).filter((o) => o.id !== orderId);
      const freedMargin = order.marginRequired || 0;
      return {
        ...prev,
        marginUsed: Number(Math.max(0, prev.marginUsed - freedMargin).toFixed(2)),
        freeCollateral: Number((prev.freeCollateral + freedMargin).toFixed(2)),
        pendingOrders: remainingPending,
      };
    });

    showToast('info', `Cancelled limit order for ${order.symbol}. Margin refunded.`);
  };

  const handleFillPendingOrderAsMarket = (orderId: string) => {
    const order = (account.pendingOrders || []).find((o) => o.id === orderId);
    if (!order) return;

    const asset = assets.find((a) => a.symbol === order.symbol);
    const fillPrice = asset ? asset.price : order.limitPrice;

    let tslConfig: TrailingStopLossConfig | undefined = order.trailingStopLoss;
    if (tslConfig?.enabled && tslConfig.trailDistance > 0) {
      const initialStop =
        order.direction === 'LONG'
          ? Number((fillPrice - tslConfig.trailDistance).toFixed(2))
          : Number((fillPrice + tslConfig.trailDistance).toFixed(2));
      tslConfig = {
        ...tslConfig,
        peakPrice: fillPrice,
        activeStopPrice: initialStop,
      };
    }

    const newPos: PaperPosition = {
      id: `paper-pos-${Date.now()}`,
      symbol: order.symbol,
      category: order.category,
      direction: order.direction,
      entryPrice: fillPrice,
      currentPrice: fillPrice,
      quantity: order.quantity,
      initialQuantity: order.quantity,
      leverage: order.leverage,
      marginUsed: order.marginRequired,
      liquidationPrice: order.liquidationPrice,
      stopLoss: order.stopLoss,
      takeProfit: order.takeProfit,
      trailingStopLoss: tslConfig,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      openedAt: new Date().toLocaleTimeString(),
      lastUpdatedAt: new Date().toLocaleTimeString(),
      orderType: 'MARKET',
      signalType: 'Instant Market Fill',
    };

    setAccount((prev) => ({
      ...prev,
      pendingOrders: (prev.pendingOrders || []).filter((o) => o.id !== orderId),
      positions: [newPos, ...prev.positions],
    }));

    showToast('success', `⚡ Filled ${order.symbol} immediately at market price $${fillPrice.toLocaleString()}!`);
    setActivePositionsTab('POSITIONS');
    try {
      confetti({ particleCount: 30, spread: 45, origin: { y: 0.8 } });
    } catch {}
  };

  // -------------------------------------------------------------
  // CLOSE POSITION HANDLERS (FULL & PARTIAL)
  // -------------------------------------------------------------
  const handleClosePosition = async (id: string, reason: 'MANUAL_CLOSE' | 'TAKE_PROFIT' | 'STOP_LOSS' = 'MANUAL_CLOSE') => {
    const pos = account.positions.find((p) => p.id === id);
    if (!pos) return;

    const realized = pos.unrealizedPnL;
    const realizedPct = pos.unrealizedPnLPercent;
    const isIndian = isIndianAsset(pos.symbol) || pos.currency === 'INR';

    if (pos.isLiveBrokerTrade) {
      try {
        fetch('/api/broker/close-position', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brokerId: pos.brokerProvider || activeBroker?.provider || 'delta',
            positionId: pos.id,
            symbol: pos.symbol,
            closeQuantity: pos.quantity,
          }),
        }).catch(() => {});
      } catch {}
    }

    if (pos.isAutoTrade) {
      recordSymbolTradeClosed(pos.symbol);
    }

    const priceLabel = isIndian ? `₹${pos.currentPrice.toLocaleString()}` : `$${pos.currentPrice.toLocaleString()}`;
    const historyItem: PaperTradeHistoryItem = {
      id: `hist-${Date.now()}`,
      symbol: pos.symbol,
      category: pos.category,
      direction: pos.direction,
      entryPrice: pos.entryPrice,
      exitPrice: pos.currentPrice,
      quantity: pos.quantity,
      leverage: pos.leverage,
      marginUsed: pos.marginUsed,
      realizedPnL: realized,
      realizedPnLPercent: realizedPct,
      reason: realized >= 0 ? 'TAKE_PROFIT' : 'MANUAL_CLOSE',
      exitReasonDetail: pos.isLiveBrokerTrade
        ? `⚡ Live Broker Exit (${pos.brokerProvider || 'API'}) @ ${priceLabel}`
        : `✋ Manual Position Close by Trader (${priceLabel})`,
      openedAt: pos.openedAt,
      closedAt: new Date().toLocaleTimeString(),
      openedAtTimestamp: pos.openedAtTimestamp || Date.now() - 60000,
      closedAtTimestamp: Date.now(),
      duration: formatTradeDuration(pos.openedAtTimestamp, Date.now()),
      outcomeVerdict: realized > 0 ? 'RIGHT_TRADE' : (realized < 0 ? 'WRONG_TRADE' : 'BREAKEVEN'),
      inrRealizedPnL: isIndian ? realized : Number((realized * INR_PER_USD).toFixed(2)),
      signalType: pos.signalType || 'Breakout SMC / Manual',
      orderType: pos.orderType || 'MARKET',
      isAutoTrade: Boolean(pos.isAutoTrade),
      autoTradeConfidence: pos.autoTradeConfidence,
      autoTradeGrade: pos.autoTradeGrade,
      autoTradeReason: pos.autoTradeReason,
    };

    setAccount((prev) => {
      const remainingPositions = prev.positions.filter((p) => p.id !== id);
      const newBalance = Number((prev.balance + realized).toFixed(2));
      const newRealizedPnL = Number((prev.realizedPnL + realized).toFixed(2));

      return {
        ...prev,
        balance: newBalance,
        realizedPnL: newRealizedPnL,
        positions: remainingPositions,
        history: [historyItem, ...prev.history],
      };
    });

    const pnlLabel = isIndian
      ? `${realized >= 0 ? '+' : ''}₹${realized.toLocaleString('en-IN')}`
      : `${realized >= 0 ? '+' : ''}$${realized.toLocaleString()} (${formatINRValue(realized, true)})`;

    showToast(
      realized >= 0 ? 'success' : 'info',
      `Closed ${pos.symbol} position with ${pnlLabel} P&L`
    );
  };

  const handleOpenEditModal = (pos: PaperPosition) => {
    setEditingPosition(pos);
    setEditSL(pos.stopLoss || (pos.direction === 'LONG' ? pos.entryPrice * 0.97 : pos.entryPrice * 1.03));
    setEditTP(pos.takeProfit || (pos.direction === 'LONG' ? pos.entryPrice * 1.06 : pos.entryPrice * 0.94));
    setEditTrailingEnabled(pos.trailingStopLoss?.enabled || false);
    setEditTrailingDistance(pos.trailingStopLoss?.trailDistance || Number((pos.entryPrice * 0.02).toFixed(2)));
    setPartialCloseQty(Number((pos.quantity * 0.5).toFixed(4)));
  };

  const handleSaveOrderUpdate = () => {
    if (!editingPosition) return;

    if (editingPosition.isLiveBrokerTrade) {
      try {
        fetch('/api/broker/modify-position', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brokerId: editingPosition.brokerProvider || activeBroker?.provider || 'delta',
            positionId: editingPosition.id,
            symbol: editingPosition.symbol,
            stopLoss: editSL > 0 ? editSL : undefined,
            takeProfit: editTP > 0 ? editTP : undefined,
            trailingStopLoss: editTrailingEnabled ? { enabled: true, trailDistance: editTrailingDistance } : undefined,
          }),
        }).catch(() => {});
      } catch {}
    }

    setAccount((prev) => {
      const updatedPositions = prev.positions.map((p) => {
        if (p.id !== editingPosition.id) return p;

        let updatedTsl: TrailingStopLossConfig | undefined = undefined;
        if (editTrailingEnabled && editTrailingDistance > 0) {
          const currentPeak = p.trailingStopLoss?.peakPrice || p.currentPrice;
          const activeStop =
            p.direction === 'LONG'
              ? Number((currentPeak - editTrailingDistance).toFixed(2))
              : Number((currentPeak + editTrailingDistance).toFixed(2));

          updatedTsl = {
            enabled: true,
            trailDistance: editTrailingDistance,
            peakPrice: currentPeak,
            activeStopPrice: activeStop,
          };
        }

        return {
          ...p,
          stopLoss: editSL > 0 ? Number(editSL.toFixed(2)) : undefined,
          takeProfit: editTP > 0 ? Number(editTP.toFixed(2)) : undefined,
          trailingStopLoss: updatedTsl,
          lastUpdatedAt: new Date().toLocaleTimeString(),
        };
      });

      return { ...prev, positions: updatedPositions };
    });

    showToast('success', `Updated SL/TP parameters for ${editingPosition.symbol}`);
    setEditingPosition(null);
  };

  const handleMoveSLToBreakeven = (pos: PaperPosition) => {
    setAccount((prev) => {
      const updated = prev.positions.map((p) => {
        if (p.id !== pos.id) return p;
        return {
          ...p,
          stopLoss: p.entryPrice,
          lastUpdatedAt: new Date().toLocaleTimeString(),
        };
      });
      return { ...prev, positions: updated };
    });
    showToast('success', `Stop Loss locked at entry price ($${pos.entryPrice.toLocaleString()}) for ${pos.symbol}`);
  };

  const handleExecutePartialClose = (closeFraction: number) => {
    if (!editingPosition) return;

    const qtyToClose = Number((editingPosition.quantity * closeFraction).toFixed(4));
    if (qtyToClose <= 0 || qtyToClose >= editingPosition.quantity) {
      handleClosePosition(editingPosition.id);
      setEditingPosition(null);
      return;
    }

    const proportion = qtyToClose / editingPosition.quantity;
    const realizedPortion = Number((editingPosition.unrealizedPnL * proportion).toFixed(2));
    const realizedPct = editingPosition.unrealizedPnLPercent;
    const marginReleased = Number((editingPosition.marginUsed * proportion).toFixed(2));

    const historyItem: PaperTradeHistoryItem = {
      id: `hist-partial-${Date.now()}`,
      symbol: editingPosition.symbol,
      category: editingPosition.category,
      direction: editingPosition.direction,
      entryPrice: editingPosition.entryPrice,
      exitPrice: editingPosition.currentPrice,
      quantity: qtyToClose,
      leverage: editingPosition.leverage,
      marginUsed: marginReleased,
      realizedPnL: realizedPortion,
      realizedPnLPercent: realizedPct,
      reason: 'PARTIAL_CLOSE',
      exitReasonDetail: `✂️ Partial Profit Take (${(closeFraction * 100).toFixed(0)}% position scale-out)`,
      openedAt: editingPosition.openedAt,
      closedAt: new Date().toLocaleTimeString(),
      openedAtTimestamp: editingPosition.openedAtTimestamp || Date.now() - 60000,
      closedAtTimestamp: Date.now(),
      duration: formatTradeDuration(editingPosition.openedAtTimestamp, Date.now()),
      outcomeVerdict: realizedPortion > 0 ? 'RIGHT_TRADE' : (realizedPortion < 0 ? 'WRONG_TRADE' : 'BREAKEVEN'),
      inrRealizedPnL: Number((realizedPortion * INR_PER_USD).toFixed(2)),
      signalType: editingPosition.signalType || 'Breakout SMC / Manual',
      isAutoTrade: Boolean(editingPosition.isAutoTrade),
      autoTradeConfidence: editingPosition.autoTradeConfidence,
      autoTradeGrade: editingPosition.autoTradeGrade,
      autoTradeReason: editingPosition.autoTradeReason,
    };

    setAccount((prev) => {
      const updatedPositions = prev.positions.map((p) => {
        if (p.id !== editingPosition.id) return p;
        const newQty = Number((p.quantity - qtyToClose).toFixed(4));
        const newMargin = Number((p.marginUsed - marginReleased).toFixed(2));
        return {
          ...p,
          quantity: newQty,
          marginUsed: newMargin,
          lastUpdatedAt: new Date().toLocaleTimeString(),
        };
      });

      const newBalance = Number((prev.balance + realizedPortion).toFixed(2));
      const newRealizedTotal = Number((prev.realizedPnL + realizedPortion).toFixed(2));

      return {
        ...prev,
        balance: newBalance,
        realizedPnL: newRealizedTotal,
        positions: updatedPositions,
        history: [historyItem, ...prev.history],
      };
    });

    showToast(
      'success',
      `Booked ${(closeFraction * 100).toFixed(0)}% partial profit (+${realizedPortion >= 0 ? '$' : '-$'}${Math.abs(realizedPortion)}) on ${editingPosition.symbol}!`
    );
    setEditingPosition(null);
  };

  const handleDeleteHistoryItem = (historyId: string) => {
    setAccount((prev) => {
      const newHistory = prev.history.filter((h) => h.id !== historyId);
      const newRealized = Number(newHistory.reduce((sum, h) => sum + (Number(h.realizedPnL) || 0), 0).toFixed(2));
      const initBal = prev.initialBalance || 10000;
      const newBalance = Number((initBal + newRealized).toFixed(2));
      const newEquity = Number((newBalance + prev.unrealizedPnL).toFixed(2));
      const newFreeCollateral = Number((newEquity - prev.marginUsed).toFixed(2));
      const updated: PaperTradingAccount = {
        ...prev,
        history: newHistory,
        realizedPnL: newRealized,
        balance: newBalance,
        equity: newEquity,
        freeCollateral: newFreeCollateral,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem('tradeos_paper_account_v1', JSON.stringify(updated));
      } catch {}
      fetch('/api/paper/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      try {
        setDoc(doc(db, 'system_state', 'live_paper_account'), updated, { merge: true }).catch(() => {});
      } catch {}
      return updated;
    });
    showToast('info', 'Deleted trade entry from history.');
  };

  const handleClearAllHistory = () => {
    setAccount((prev) => {
      const initBal = prev.initialBalance || 10000;
      const updated: PaperTradingAccount = {
        ...prev,
        history: [],
        realizedPnL: 0,
        balance: initBal,
        equity: initBal + prev.unrealizedPnL,
        freeCollateral: initBal + prev.unrealizedPnL - prev.marginUsed,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem('tradeos_paper_account_v1', JSON.stringify(updated));
      } catch {}
      fetch('/api/paper/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      try {
        setDoc(
          doc(db, 'system_state', 'live_paper_account'),
          { ...updated, history: [], realizedPnL: 0, balance: initBal, updatedAt: new Date().toISOString() },
          { merge: true }
        ).catch(() => {});
      } catch {}
      return updated;
    });
    setIsClearHistoryModalOpen(false);
    showToast('success', 'Practice trade history and Realized P&L cleared ($0.00).');
  };

  const handleConfirmClearAllHistory = () => {
    handleClearAllHistory();
  };

  const handleResetBalance = () => {
    setIsResetDemoModalOpen(true);
  };

  const handleConfirmResetBalance = () => {
    setAccount(defaultAccount);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAccount));
    } catch {}
    fetch('/api/paper/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultAccount),
    }).catch(() => {});
    try {
      setDoc(
        doc(db, 'system_state', 'live_paper_account'),
        { ...defaultAccount, updatedAt: new Date().toISOString() },
        { merge: true }
      ).catch(() => {});
    } catch {}
    setIsResetDemoModalOpen(false);
    showToast('info', 'Demo wallet reset to $10,000 capital.');
  };

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div id="paper-trading-main" className="space-y-6 pb-20 max-w-[1600px] mx-auto animate-fade-in relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2 animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/50'
              : 'bg-slate-900/90 text-slate-200 border-slate-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Info className="w-4 h-4 text-teal-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Virtual Practice & Paper Trading"
        subtitle="Zero-risk institutional simulator with Market & Limit Order execution, automatic pending order trigger, customizable lot sizing, live SL/TP P&L projections, and persistent cloud sync across remixes."
        badge="Zero Risk • $10,000 Demo Capital"
        badgeVariant="emerald"
        icon={Wallet}
        breadcrumbs={[
          { label: 'Terminal', tab: 'dashboard' },
          { label: 'Paper Trading', tab: 'paper-trading' },
        ]}
        onBack={onBack}
        onNavigateTab={onNavigateTab}
        actionSlot={
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Persistent Across Remixes</span>
            </span>
            <button
              onClick={handleResetBalance}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121827] hover:bg-[#1A2234] text-slate-300 border border-[#1C263C] text-xs font-bold transition-all cursor-pointer"
              title="Reset Virtual Wallet to $10,000"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo ($10K)</span>
            </button>
          </div>
        }
      />

      {/* Unified Live Broker vs Practice Mode Toolbar */}
      <LiveBrokerToolbar
        tradingMode={tradingMode}
        onChangeTradingMode={handleChangeTradingMode}
        connectedBrokers={connectedBrokers}
        activeBroker={activeBroker}
        onSelectBroker={handleSelectBroker}
        onOpenBrokerSync={handleTriggerOpenBrokerSync}
        isIndianAsset={selectedAsset.category === 'Indian Stocks / F&O'}
      />

      {/* Sentinel Auto-Trader Master Hero Ribbon */}
      {(() => {
        const autoPositions = account.positions.filter((p) => Boolean(p.isAutoTrade || p.id?.includes('auto')));
        const autoPending = (account.pendingOrders || []).filter((o) => Boolean(o.isAutoTrade || o.id?.includes('auto')));
        const autoHistory = account.history.filter((h) => Boolean(h.isAutoTrade || h.signalType?.includes('Auto') || h.signalType?.includes('Breakout') || h.id?.includes('auto')));
        const autoWinCount = autoHistory.filter(
          (h) => h.outcomeVerdict === 'RIGHT_TRADE' || (h.realizedPnL || 0) > 0
        ).length;
        const autoWinRate = autoHistory.length > 0 ? Math.round((autoWinCount / autoHistory.length) * 100) : 100;
        const autoNetPnL = autoHistory.reduce((sum, h) => sum + (h.realizedPnL || 0), 0);

        return (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0C1527] via-[#0D1D24] to-[#0C1527] border border-emerald-500/40 shadow-xl space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                    autoTradeConfig.isEnabled
                      ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800 border border-slate-700 text-slate-400'
                  }`}
                >
                  <Zap className={`w-5 h-5 ${autoTradeConfig.isEnabled ? 'fill-emerald-400 animate-pulse' : ''}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-base sm:text-lg tracking-tight">
                      Sentinel Auto-Trade Execution Engine
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        autoTradeConfig.isEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-700 text-slate-400 border border-slate-600'
                      }`}
                    >
                      {autoTradeConfig.isEnabled ? '🟢 ACTIVE AUTOMATION' : '⚪ PAUSED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Auto-executes Breakout Radar alerts with quantitative SL/TP risk management & anti-fakeout filters.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSaveAutoTradeConfig({ ...autoTradeConfig, isEnabled: !autoTradeConfig.isEnabled })
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                    autoTradeConfig.isEnabled
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                      : 'bg-[#1A2338] hover:bg-[#232F4A] text-slate-200 border border-[#2D3C5E]'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${autoTradeConfig.isEnabled ? 'fill-slate-950' : ''}`} />
                  <span>{autoTradeConfig.isEnabled ? 'AUTO-TRADER ON' : 'TURN AUTO-TRADER ON'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAutoConfigModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-[#121827] hover:bg-[#1A2234] border border-[#1C263C] text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  title="Configure auto-trader filters, position sizing, and leverage"
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Config & Risk</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAutoLogModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-[#121827] hover:bg-[#1A2234] border border-[#1C263C] text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  title="View transparent decision log of all auto-evaluated signals"
                >
                  <ListFilter className="w-3.5 h-3.5 text-teal-400" />
                  <span>Audit Log ({autoTradeLogs.length})</span>
                </button>

                {(autoPositions.length > 0 || autoPending.length > 0) && (
                  <button
                    type="button"
                    onClick={handlePanicCloseAllAutoTrades}
                    className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    title="Instantly close all automated positions"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Emergency Close Auto ({autoPositions.length + autoPending.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1C263C]/80 text-xs">
              <div className="p-2.5 rounded-xl bg-[#0A0E17]/80 border border-[#1A2234] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Execution Mode</span>
                  <span className="font-bold text-white">
                    {autoTradeConfig.executionMode === 'SMART_SMC'
                      ? '🧠 Smart SMC (OB + FVG)'
                      : autoTradeConfig.executionMode === 'INSTANT_MARKET'
                      ? '⚡ Instant Market Fill'
                      : '🎯 Limit Retest Only'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  {autoTradeConfig.minConfidenceScore}%+ Score
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0A0E17]/80 border border-[#1A2234] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Active Auto Trades</span>
                  <span className="font-bold text-teal-300 font-mono">
                    {autoPositions.length} Open • {autoPending.length} Pending
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Max {autoTradeConfig.maxOpenPositions}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0A0E17]/80 border border-[#1A2234] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Auto-Trade Win Rate</span>
                  <span className="font-black text-emerald-400 font-mono">
                    {autoWinRate}% ({autoWinCount}/{autoHistory.length} Won)
                  </span>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="p-2.5 rounded-xl bg-[#0A0E17]/80 border border-[#1A2234] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Auto Realized PnL</span>
                  <span
                    className={`font-black font-mono ${
                      autoNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {autoNetPnL >= 0 ? '+' : ''}${autoNetPnL.toFixed(2)} ({formatINRValue(autoNetPnL, true)})
                  </span>
                </div>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Account Balance & Collateral Strip with Dual Currency ($ USDT & ₹ INR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Net Equity */}
        <div className="p-4 rounded-xl bg-[#0E131F] border border-[#1C263C] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Virtual Equity
            </span>
            <div className="text-2xl font-bold text-white mono-numbers mt-0.5">
              ${account.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-bold text-teal-400 font-mono mt-0.5">
              {formatINRValue(account.equity)}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Balance: ${account.balance.toLocaleString()} ({formatINRValue(account.balance)})
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Free Collateral */}
        <div className="p-4 rounded-xl bg-[#0E131F] border border-[#1C263C] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Free Collateral
            </span>
            <div className="text-2xl font-bold text-slate-200 mono-numbers mt-0.5">
              ${account.freeCollateral.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-bold text-indigo-300 font-mono mt-0.5">
              {formatINRValue(account.freeCollateral)}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Margin In-Use: ${account.marginUsed.toLocaleString()} ({formatINRValue(account.marginUsed)})
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Unrealized PnL */}
        <div className="p-4 rounded-xl bg-[#0E131F] border border-[#1C263C] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Live Unrealized P&L
            </span>
            <div
              className={`text-2xl font-bold mono-numbers mt-0.5 ${
                account.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {account.unrealizedPnL >= 0 ? '+' : ''}
              ${account.unrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div
              className={`text-[11px] font-bold font-mono mt-0.5 ${
                account.unrealizedPnL >= 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {formatINRValue(account.unrealizedPnL, true)}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {account.positions.length} Active • {(account.pendingOrders || []).length} Pending
            </span>
          </div>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
              account.unrealizedPnL >= 0
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Realized Cumulative PnL */}
        <div className="p-4 rounded-xl bg-[#0E131F] border border-[#1C263C] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Realized Practice P&L
            </span>
            {(() => {
              const histPnL = account.history.length > 0
                ? account.history.reduce((sum, h) => sum + (Number(h.realizedPnL) || 0), 0)
                : 0;
              return (
                <>
                  <div
                    className={`text-2xl font-bold mono-numbers mt-0.5 ${
                      histPnL > 0 ? 'text-emerald-400' : histPnL < 0 ? 'text-rose-400' : 'text-slate-300'
                    }`}
                  >
                    {histPnL > 0 ? '+' : ''}${histPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div
                    className={`text-[11px] font-bold font-mono mt-0.5 ${
                      histPnL > 0 ? 'text-emerald-300' : histPnL < 0 ? 'text-rose-300' : 'text-slate-400'
                    }`}
                  >
                    {histPnL === 0 ? '₹0' : formatINRValue(histPnL, true)}
                  </div>
                </>
              );
            })()}
            <span className="text-[10px] text-slate-500 block mt-0.5">{account.history.length} Closed Practice Trades</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Trading Area: Order Form & Active Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Instant Order Placement Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0E131F] p-5 rounded-xl border border-[#1C263C] space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C263C]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-base text-white">
                {tradingMode === 'LIVE_BROKER' ? `⚡ ${activeBroker?.name || 'Live Broker'} Terminal` : 'Place Virtual Order'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {tradingMode === 'LIVE_BROKER' && (
                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>LIVE BROKER ROUTE</span>
                </span>
              )}
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                {isIndianAsset(selectedAsset) ? `Live: ₹${selectedAsset.price.toLocaleString('en-IN')}` : `Live: $${selectedAsset.price.toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Market Segment Fast Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
            {[
              { id: 'ALL', label: 'All Markets' },
              { id: 'CRYPTO', label: '🪙 Crypto' },
              { id: 'FOREX', label: '💱 Forex' },
              { id: 'COMMODITIES', label: '🥇 Commodities' },
              { id: 'INDIAN_FNO', label: '🇮🇳 Indian F&O' },
            ].map((seg) => (
              <button
                key={seg.id}
                type="button"
                onClick={() => {
                  setMarketSegmentTab(seg.id as any);
                  if (seg.id === 'INDIAN_FNO') {
                    const indianAsset = assets.find((a) => isIndianAsset(a));
                    if (indianAsset) onSelectAsset(indianAsset);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  marketSegmentTab === seg.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black'
                    : 'bg-[#121827] text-slate-400 hover:text-slate-200 border border-[#1C263C]'
                }`}
              >
                {seg.label}
              </button>
            ))}
          </div>

          {/* Asset & Category Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Asset
              </label>
              <span className="text-[10px] font-bold text-teal-400">{selectedAsset.category}</span>
            </div>
            <select
              value={selectedAsset.symbol}
              onChange={(e) => {
                const found = assets.find((a) => a.symbol === e.target.value);
                if (found) {
                  onSelectAsset(found);
                  setSelectedOptionContract(null);
                }
              }}
              className="w-full px-3 py-2.5 rounded-lg bg-[#121827] border border-[#1C263C] text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {assets
                .filter((a) => {
                  if (marketSegmentTab === 'CRYPTO') return a.category === 'Crypto';
                  if (marketSegmentTab === 'FOREX') return a.category === 'Forex';
                  if (marketSegmentTab === 'COMMODITIES') return a.category === 'Commodities';
                  if (marketSegmentTab === 'INDIAN_FNO') return isIndianAsset(a);
                  return true;
                })
                .map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.symbol} — {a.name} ({isIndianAsset(a) ? `₹${a.price.toLocaleString('en-IN')}` : `$${a.price.toLocaleString()}`}) [{a.category}]
                  </option>
                ))}
            </select>
          </div>

          {/* Indian Market Working Hours & Options Chain Trigger */}
          {isIndianAsset(selectedAsset) && (() => {
            const indSession = getIndianMarketSessionInfo();
            return (
              <div className="p-3 rounded-xl bg-gradient-to-r from-teal-950/40 via-[#0E1B2C] to-indigo-950/40 border border-teal-500/30 space-y-2.5">
                {/* Working Hours Badge */}
                <div className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                  indSession.isOpen ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      <strong className="text-white">NSE/BSE Hours:</strong> 09:15 AM - 03:30 PM IST
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    indSession.isOpen ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                  }`}>
                    {indSession.isOpen ? '● LIVE' : '● CLOSED (AMO)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-teal-400" />
                    <span>Indian F&O Option Chain (NSE/BSE)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOptionsChainOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <span>Open Option Chain (CE / PE)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {selectedOptionContract ? (
                  <div className="p-2.5 rounded-lg bg-[#0E131F] border border-teal-500/40 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-teal-400 uppercase font-black tracking-wider block">
                        Active Selected Option Strike
                      </span>
                      <span className="font-bold text-white">
                        {selectedOptionContract.contractSymbol} ({selectedOptionContract.optionType})
                      </span>
                      <div className="text-[11px] font-mono text-emerald-400 font-bold">
                        Premium: ₹{selectedOptionContract.premiumInr} • 1 Lot = {selectedOptionContract.lotSize} Qty
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOptionContract(null)}
                      className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-all cursor-pointer"
                      title="Clear Option Strike & Revert to Underlying"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Click &apos;Open Option Chain&apos; to trade NIFTY / BANKNIFTY In-The-Money (ITM), At-The-Money (ATM), or Out-Of-The-Money (OTM) Calls & Puts with real Greeks (Delta, Theta, Gamma, IV).
                  </p>
                )}
              </div>
            );
          })()}

          {/* ORDER TYPE SELECTOR: MARKET vs LIMIT */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Order Type (मार्केट या लिमिट ऑर्डर)
              </label>
              <span className="text-[10px] font-bold text-amber-400">
                {orderType === 'MARKET' ? '⚡ Instant Execution' : '🎯 Target Trigger'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#121827] border border-[#1C263C]">
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  orderType === 'MARKET'
                    ? 'bg-teal-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Market Order</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderType('LIMIT');
                  if (limitPrice === selectedAsset.price) {
                    const offset = direction === 'LONG' ? -0.5 : 0.5;
                    setLimitPrice(Number((selectedAsset.price * (1 + offset / 100)).toFixed(2)));
                  }
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  orderType === 'LIMIT'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Limit Order</span>
              </button>
            </div>
          </div>

          {/* Limit Price Input if Limit Order is Selected */}
          {orderType === 'LIMIT' && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Target Limit Price ($):</span>
                </span>
                <span className="font-mono text-amber-200 text-[11px]">
                  Live: ${selectedAsset.price.toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0E131F] border border-amber-500/50 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                  placeholder="Enter target limit price"
                />
                <span className="absolute right-3 top-2 text-xs font-mono font-bold text-slate-400">
                  USD
                </span>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
                <span className="text-[10px] text-slate-400 font-bold shrink-0">Presets:</span>
                {[-1.0, -0.5, -0.2, 0, 0.2, 0.5, 1.0].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      const newP = Number((selectedAsset.price * (1 + pct / 100)).toFixed(2));
                      setLimitPrice(newP);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0E131F] text-slate-300 hover:text-white border border-[#1C263C] cursor-pointer shrink-0"
                  >
                    {pct === 0 ? 'Market' : `${pct > 0 ? '+' : ''}${pct}%`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Direction Buttons (Long vs Short) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDirection('LONG')}
              className={`py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                direction === 'LONG'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                  : 'bg-[#121827] text-slate-400 hover:text-white border border-[#1C263C]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>▲ BUY / LONG</span>
            </button>
            <button
              onClick={() => setDirection('SHORT')}
              className={`py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                direction === 'SHORT'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-black'
                  : 'bg-[#121827] text-slate-400 hover:text-white border border-[#1C263C]'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>▼ SELL / SHORT</span>
            </button>
          </div>

          {/* SIZING INPUT: QUANTITY vs MARGIN TOGGLE */}
          <div className="p-3.5 rounded-xl bg-[#121827] border border-[#1C263C] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>Trade Sizing & Position Volume</span>
              </span>

              {/* Sizing Mode Pill Switch */}
              <div className="flex p-0.5 rounded-lg bg-[#0E131F] border border-[#1C263C]">
                <button
                  type="button"
                  onClick={() => setSizingMode('QUANTITY')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    sizingMode === 'QUANTITY'
                      ? 'bg-teal-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  By Quantity ({getUnitShort(selectedAsset)})
                </button>
                <button
                  type="button"
                  onClick={() => setSizingMode('MARGIN')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    sizingMode === 'MARGIN'
                      ? 'bg-teal-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  By Margin ({currencyConfig.symbol})
                </button>
              </div>
            </div>

            {/* Quantity Input Field */}
            {sizingMode === 'QUANTITY' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">
                    Enter Quantity ({getUnitName(selectedAsset)}):
                  </span>
                  <span className="font-mono text-teal-300 font-bold">
                    Value: ${totalPositionSizeUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.0001"
                    value={quantityInput}
                    onChange={(e) => handleQuantityChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0E131F] border border-[#1C263C] text-sm font-mono font-bold text-white focus:border-teal-500 focus:outline-none"
                    placeholder="e.g. 0.25 BTC, 50 Shares"
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono font-bold text-slate-400">
                    {getUnitShort(selectedAsset)}
                  </span>
                </div>

                {/* Quick Quantity Chips */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                  <span className="text-[10px] text-slate-500 shrink-0 font-bold">Quick Qty:</span>
                  {(selectedAsset.price > 1000
                    ? [0.05, 0.1, 0.25, 0.5, 1.0, 2.0]
                    : selectedAsset.price > 100
                    ? [1, 5, 10, 25, 50, 100]
                    : [10, 50, 100, 250, 500, 1000]
                  ).map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => handleQuantityChange(qty)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
                        quantityInput === qty
                          ? 'bg-teal-500 text-slate-950'
                          : 'bg-[#0E131F] text-slate-300 hover:text-white border border-[#1C263C]'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Margin Input Field */
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">Margin Collateral ({currencyConfig.symbol}):</span>
                  <span className="font-mono text-teal-300 font-bold">
                    Qty: {activeQuantity.toFixed(4)} {getUnitShort(selectedAsset)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    value={marginInput}
                    onChange={(e) => handleMarginChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0E131F] border border-[#1C263C] text-sm font-mono font-bold text-white focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyMarginPercent(0.25)}
                    className="px-2.5 py-2 rounded bg-[#0E131F] border border-[#1C263C] text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyMarginPercent(0.5)}
                    className="px-2.5 py-2 rounded bg-[#0E131F] border border-[#1C263C] text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyMarginPercent(1.0)}
                    className="px-2.5 py-2 rounded bg-[#0E131F] border border-[#1C263C] text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                  >
                    MAX
                  </button>
                </div>
              </div>
            )}

            {/* Leverage Slider */}
            <div className="pt-2 border-t border-[#1C263C]/60">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 font-bold">Leverage Multiplier</span>
                <span className="font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {leverage}x
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={leverage}
                onChange={(e) => {
                  const newLev = Number(e.target.value);
                  setLeverage(newLev);
                  const totalVal = activeQuantity * currentExecPrice;
                  setMarginInput(Number((totalVal / newLev).toFixed(2)));
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                <span>1x (Spot)</span>
                <span>10x</span>
                <span>20x</span>
                <span>50x (Max)</span>
              </div>
            </div>
          </div>

          {/* SL & TP SETTINGS WITH LIVE P&L PREVIEW */}
          <div className="space-y-3 p-3.5 rounded-xl bg-[#121827] border border-[#1C263C]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Stop Loss & Target Calculator</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  calculatedRRRatio >= 2.0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : calculatedRRRatio >= 1.5
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                R:R 1 : {calculatedRRRatio}
              </span>
            </div>

            {/* SL & TP Input Fields */}
            <div className="grid grid-cols-2 gap-3">
              {/* Stop Loss */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="font-bold text-rose-400 uppercase flex items-center gap-1">
                    <span>Stop Loss</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    -{slDistancePoints.toFixed(1)} pts ({slDistancePercent.toFixed(1)}%)
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-lg bg-[#0E131F] border border-rose-500/30 focus:border-rose-500 text-xs font-mono font-bold text-rose-400 focus:outline-none"
                />
                <div className="text-[10px] font-bold text-rose-400/90 font-mono bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 flex justify-between">
                  <span>Max Loss:</span>
                  <span>
                    -{formatCurrency(maxLossUsd)} (-{maxLossPercentOnMargin.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Take Profit */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="font-bold text-emerald-400 uppercase flex items-center gap-1">
                    <span>Take Profit</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    +{tpDistancePoints.toFixed(1)} pts ({tpDistancePercent.toFixed(1)}%)
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-lg bg-[#0E131F] border border-emerald-500/30 focus:border-emerald-500 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                />
                <div className="text-[10px] font-bold text-emerald-400/90 font-mono bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex justify-between">
                  <span>Max Profit:</span>
                  <span>
                    +{formatCurrency(maxProfitUsd)} (+{maxProfitPercentOnMargin.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick R:R Preset Buttons */}
            <div className="flex items-center justify-between pt-1 border-t border-[#1C263C]/60 text-[10px]">
              <span className="text-slate-400 font-bold">Auto-Set R:R:</span>
              <div className="flex items-center gap-1.5">
                {[1.5, 2.0, 3.0, 4.0].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => handleApplyRiskRewardPreset(ratio)}
                    className="px-2 py-1 rounded bg-[#0E131F] hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 border border-[#1C263C] font-mono font-bold transition-all cursor-pointer"
                  >
                    1:{ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Trailing Stop Loss Toggle */}
            <div className="pt-2 border-t border-[#1C263C]/60 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Trailing Stop Loss (TSL)</span>
                    <span className="text-[10px] text-slate-400">
                      Trails SL upward automatically as price moves in profit
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isTrailingEnabled}
                  onChange={(e) => setIsTrailingEnabled(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              {isTrailingEnabled && (
                <div className="p-2.5 rounded-lg bg-[#0E131F] border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-300 font-bold">Trailing Step Distance ($):</span>
                    <span className="text-white font-mono font-bold">${trailingDistanceInput}</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={trailingDistanceInput}
                    onChange={(e) => setTrailingDistanceInput(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded bg-[#121827] border border-[#1C263C] text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                    placeholder="e.g. 500"
                  />
                  <div className="text-[10px] text-slate-400">
                    If {direction === 'LONG' ? 'price rallies, SL will follow' : 'price drops, SL will trail down'}{' '}
                    by exactly ${trailingDistanceInput.toLocaleString()} behind the peak price.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Box with Dual Currency */}
          <div className="p-3.5 rounded-xl bg-[#121827] border border-[#1C263C] space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Required Margin (Collateral):</span>
              <strong className="text-white font-mono">
                ${computedMarginRequired.toFixed(2)} ({formatINRValue(computedMarginRequired)})
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Total Position Exposure:</span>
              <strong className="text-teal-300 font-mono">
                {activeQuantity.toFixed(4)} {getUnitShort(selectedAsset)} (${totalPositionSizeUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} • {formatINRValue(totalPositionSizeUsd)})
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Est. Liquidation Price:</span>
              <strong className="text-rose-400 font-mono font-bold">
                ${liquidationPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          {/* Primary Action Button: Prompts Confirmation Dialog */}
          <button
            onClick={handleOpenOrderConfirmation}
            className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
              orderType === 'LIMIT'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                : direction === 'LONG'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-500/20'
            }`}
          >
            {orderType === 'LIMIT' ? <Target className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span className="font-black text-sm">
              {orderType === 'LIMIT'
                ? `Review & Place Limit ${direction} (@ $${limitPrice.toLocaleString()})`
                : `Review & Execute Market ${direction} (${activeQuantity.toFixed(2)} ${getUnitShort(selectedAsset)})`}
            </span>
          </button>
        </div>

        {/* Right Column: Positions, Pending Orders & History (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Navigation Tabs */}
          <div className="p-1.5 rounded-xl bg-[#0E131F] border border-[#1C263C] flex items-center justify-between gap-1 shadow-md">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActivePositionsTab('POSITIONS')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activePositionsTab === 'POSITIONS'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#121827]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open Positions ({account.positions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePositionsTab('PENDING_ORDERS')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activePositionsTab === 'PENDING_ORDERS'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#121827]'
                }`}
              >
                <Target className="w-4 h-4" />
                <span>Pending Limit Orders ({(account.pendingOrders || []).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePositionsTab('HISTORY')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activePositionsTab === 'HISTORY'
                    ? 'bg-teal-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#121827]'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Closed History ({account.history.length})</span>
              </button>
            </div>

            <span className="hidden sm:flex text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded font-bold items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>1s Realtime Mark</span>
            </span>
          </div>

          {/* 1. ACTIVE RUNNING POSITIONS VIEW */}
          {activePositionsTab === 'POSITIONS' && (
            <div className="p-5 rounded-xl bg-[#0E131F] border border-[#1C263C] space-y-4 shadow-lg animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1C263C]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-base text-white">
                    Active Virtual Positions ({account.positions.length})
                  </h3>
                </div>

                {/* Sub Filter: ALL vs AUTO vs MANUAL */}
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#121827] border border-[#1C263C] text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPositionSourceFilter('ALL')}
                    className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                      positionSourceFilter === 'ALL'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({account.positions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPositionSourceFilter('AUTO')}
                    className={`px-2.5 py-1 rounded cursor-pointer transition-all flex items-center gap-1 ${
                      positionSourceFilter === 'AUTO'
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>Auto ({account.positions.filter((p) => p.isAutoTrade).length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPositionSourceFilter('MANUAL')}
                    className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                      positionSourceFilter === 'MANUAL'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Manual ({account.positions.filter((p) => !p.isAutoTrade).length})
                  </button>
                </div>
              </div>

              {(() => {
                const filteredPositions = account.positions.filter((p) => {
                  if (positionSourceFilter === 'AUTO') return p.isAutoTrade;
                  if (positionSourceFilter === 'MANUAL') return !p.isAutoTrade;
                  return true;
                });

                if (filteredPositions.length === 0) {
                  return (
                    <div className="text-center py-12 space-y-3 border border-dashed border-[#1C263C] rounded-xl bg-[#121827]/40">
                      <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-slate-300">
                        {positionSourceFilter === 'AUTO'
                          ? 'No Automated Positions Running'
                          : 'No Open Virtual Positions'}
                      </div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        {positionSourceFilter === 'AUTO'
                          ? 'When the Sentinel Auto-Trader is enabled, signals matching your score criteria will execute and appear here automatically.'
                          : 'Select your market asset, choose Market or Limit Order on the left to execute demo trades.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filteredPositions.map((pos) => (
                      <div
                        key={pos.id}
                        className={`p-4 rounded-xl bg-[#121827] border transition-all space-y-3 shadow-md ${
                          pos.isAutoTrade
                            ? 'border-emerald-500/40 hover:border-emerald-400/60 shadow-emerald-500/5'
                            : 'border-[#1C263C] hover:border-slate-600'
                        }`}
                      >
                        {/* Header Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-black uppercase ${
                                pos.direction === 'LONG'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {pos.direction} {pos.leverage}x
                            </span>
                            <div>
                              <div className="font-bold text-white text-sm flex flex-wrap items-center gap-2">
                                <span>{pos.symbol}</span>
                                <span className="text-xs font-mono text-teal-300 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                                  Qty: {pos.quantity}
                                </span>
                                {pos.isLiveBrokerTrade && (
                                  <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                    <span>⚡ LIVE BROKER ({pos.brokerProvider?.toUpperCase() || 'DIRECT'})</span>
                                  </span>
                                )}
                                {pos.isAutoTrade ? (
                                  <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Zap className="w-2.5 h-2.5 fill-emerald-300" />
                                    <span>AUTO-TRADER ({pos.confidenceScore || 85}% Conf)</span>
                                  </span>
                                ) : (
                                  pos.orderType && (
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                      {pos.orderType}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Live P&L Display (Dual Currency USD + ₹ INR, or pure ₹ INR for Indian Market) */}
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Unrealized P&L</span>
                            {isIndianAsset(pos.symbol) || pos.currency === 'INR' ? (
                              <div
                                className={`text-base font-black mono-numbers leading-tight ${
                                  pos.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {pos.unrealizedPnL >= 0 ? '+' : ''}₹{pos.unrealizedPnL.toLocaleString('en-IN')} (
                                {pos.unrealizedPnLPercent >= 0 ? '+' : ''}
                                {pos.unrealizedPnLPercent}%)
                              </div>
                            ) : (
                              <>
                                <div
                                  className={`text-base font-black mono-numbers leading-tight ${
                                    pos.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {pos.unrealizedPnL >= 0 ? '+' : ''}${pos.unrealizedPnL.toFixed(2)} (
                                  {pos.unrealizedPnLPercent >= 0 ? '+' : ''}
                                  {pos.unrealizedPnLPercent}%)
                                </div>
                                <div
                                  className={`text-[11px] font-bold font-mono ${
                                    pos.unrealizedPnL >= 0 ? 'text-emerald-300' : 'text-rose-300'
                                  }`}
                                >
                                  {formatINRValue(pos.unrealizedPnL, true)}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Price & Level Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1C263C]/60 text-[11px]">
                          <div className="p-2 rounded-lg bg-[#0E131F] border border-[#1C263C]">
                            <span className="text-slate-500 block text-[10px]">Entry Price</span>
                            <span className="text-white font-mono font-bold block">
                              {isIndianAsset(pos.symbol) || pos.currency === 'INR'
                                ? `₹${pos.entryPrice.toLocaleString('en-IN')}`
                                : `$${pos.entryPrice.toLocaleString()}`}
                            </span>
                            {!(isIndianAsset(pos.symbol) || pos.currency === 'INR') && (
                              <span className="text-[10px] text-slate-400 font-mono">{formatINRValue(pos.entryPrice)}</span>
                            )}
                          </div>
                          <div className="p-2 rounded-lg bg-[#0E131F] border border-[#1C263C]">
                            <span className="text-slate-500 block text-[10px]">Mark Price</span>
                            <span className="text-teal-300 font-mono font-bold block">
                              {isIndianAsset(pos.symbol) || pos.currency === 'INR'
                                ? `₹${pos.currentPrice.toLocaleString('en-IN')}`
                                : `$${pos.currentPrice.toLocaleString()}`}
                            </span>
                            {!(isIndianAsset(pos.symbol) || pos.currency === 'INR') && (
                              <span className="text-[10px] text-slate-400 font-mono">{formatINRValue(pos.currentPrice)}</span>
                            )}
                          </div>
                          <div className="p-2 rounded-lg bg-[#0E131F] border border-[#1C263C]">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 block text-[10px]">Stop Loss</span>
                              {pos.slMovedToBreakeven && (
                                <span className="text-[9px] font-black text-emerald-400 uppercase font-mono">
                                  🛡️ BREAKEVEN
                                </span>
                              )}
                            </div>
                            <span className="text-rose-400 font-mono font-bold block">
                              {pos.stopLoss
                                ? (isIndianAsset(pos.symbol) || pos.currency === 'INR'
                                    ? `₹${pos.stopLoss.toLocaleString('en-IN')}`
                                    : `$${pos.stopLoss.toLocaleString()}`)
                                : 'None'}
                            </span>
                            {pos.stopLoss && !(isIndianAsset(pos.symbol) || pos.currency === 'INR') && (
                              <span className="text-[10px] text-slate-400 font-mono">{formatINRValue(pos.stopLoss)}</span>
                            )}
                          </div>
                          <div className="p-2 rounded-lg bg-[#0E131F] border border-[#1C263C]">
                            <span className="text-slate-500 block text-[10px]">Take Profit</span>
                            <span className="text-emerald-400 font-mono font-bold block">
                              {pos.takeProfit
                                ? (isIndianAsset(pos.symbol) || pos.currency === 'INR'
                                    ? `₹${pos.takeProfit.toLocaleString('en-IN')}`
                                    : `$${pos.takeProfit.toLocaleString()}`)
                                : 'None'}
                            </span>
                            {pos.takeProfit && !(isIndianAsset(pos.symbol) || pos.currency === 'INR') && (
                              <span className="text-[10px] text-slate-400 font-mono">{formatINRValue(pos.takeProfit)}</span>
                            )}
                          </div>
                        </div>

                        {/* Trailing SL Banner if Active */}
                        {pos.trailingStopLoss?.enabled && (
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-amber-300 font-bold">
                              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                              <span>Trailing SL Active: ${pos.trailingStopLoss.activeStopPrice.toLocaleString()} ({formatINRValue(pos.trailingStopLoss.activeStopPrice)})</span>
                            </div>
                            <span className="text-[10px] text-amber-200/80 font-mono">
                              (Peak: ${pos.trailingStopLoss.peakPrice.toLocaleString()} • Trail: ${pos.trailingStopLoss.trailDistance})
                            </span>
                          </div>
                        )}

                        {/* Action Bar (Modify SL/TP, Breakeven, Close) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1C263C]/60">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(pos)}
                              className="px-3 py-1.5 rounded-lg bg-[#0E131F] hover:bg-teal-500/20 text-teal-300 hover:text-teal-200 text-xs font-bold transition-all cursor-pointer border border-teal-500/30 flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Modify SL / TP / TSL</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMoveSLToBreakeven(pos)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#0E131F] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 text-xs font-bold transition-all cursor-pointer border border-[#1C263C] flex items-center gap-1"
                              title="Move Stop Loss to exact entry price"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>SL to Breakeven</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleClosePosition(pos.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 border border-rose-500/30 flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Close Market</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 2. PENDING LIMIT ORDERS VIEW */}
          {activePositionsTab === 'PENDING_ORDERS' && (
            <div className="p-5 rounded-xl bg-[#0E131F] border border-[#1C263C] space-y-4 shadow-lg animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#1C263C]">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-base text-white">
                    Pending Limit Orders ({(account.pendingOrders || []).length})
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
                  🎯 Auto-Executes when Market Price reaches Target
                </span>
              </div>

              {(account.pendingOrders || []).length === 0 ? (
                <div className="text-center py-12 space-y-3 border border-dashed border-[#1C263C] rounded-xl bg-[#121827]/40">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-300">No Pending Limit Orders</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Select <strong>Limit Order</strong> on the left panel to queue pending entries at your preferred price.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(account.pendingOrders || []).map((order) => {
                    const asset = assets.find((a) => a.symbol === order.symbol);
                    const currentLive = asset ? asset.price : order.currentPriceAtPlacement;
                    const diffPct = currentLive > 0 ? ((order.limitPrice - currentLive) / currentLive) * 100 : 0;
                    const isLong = order.direction === 'LONG';

                    return (
                      <div
                        key={order.id}
                        className="p-4 rounded-xl bg-[#121827] border border-amber-500/30 hover:border-amber-500/60 transition-all space-y-3 shadow-md"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-black uppercase ${
                                isLong
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              LIMIT {order.direction} {order.leverage}x
                            </span>
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-2">
                                <span>{order.symbol}</span>
                                <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  Qty: {order.quantity}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Trigger Distance</span>
                            <div
                              className={`text-sm font-black font-mono ${
                                Math.abs(diffPct) < 0.5 ? 'text-amber-400 animate-pulse' : 'text-slate-300'
                              }`}
                            >
                              {diffPct >= 0 ? '+' : ''}{diffPct.toFixed(2)}% ({Math.abs(order.limitPrice - currentLive).toFixed(2)} pts)
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">Placed at {order.placedAt}</span>
                          </div>
                        </div>

                        {/* Price & Target Levels */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1C263C]/60 text-[11px]">
                          <div className="p-2 rounded-lg bg-[#0E131F] border border-[#1C263C]">
                            <span className="text-slate-500 block text-[10px]">Target Limit Price</span>
                            <span className="text-amber-400 font-mono font-bold block">${order.limitPrice.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{formatINRValue(order.limitPrice)}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-[#0E131F] border border-[#1C263C]">
                            <span className="text-slate-500 block text-[10px]">Current Live Price</span>
                            <span className="text-white font-mono font-bold block">${currentLive.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{formatINRValue(currentLive)}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-[#0E131F] border border-[#1C263C]">
                            <span className="text-slate-500 block text-[10px]">Reserved Margin</span>
                            <span className="text-teal-300 font-mono font-bold block">${order.marginRequired.toFixed(2)}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{formatINRValue(order.marginRequired)}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-[#0E131F] border border-[#1C263C]">
                            <span className="text-slate-500 block text-[10px]">Stop / Target SL/TP</span>
                            <span className="text-slate-300 font-mono font-bold block text-[10px]">
                              SL: {order.stopLoss ? `$${order.stopLoss.toLocaleString()}` : 'None'}
                            </span>
                            <span className="text-emerald-400 font-mono font-bold block text-[10px]">
                              TP: {order.takeProfit ? `$${order.takeProfit.toLocaleString()}` : 'None'}
                            </span>
                          </div>
                        </div>

                        {/* Actions for Pending Order */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1C263C]/60">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                            <span>Monitoring order book ticks...</span>
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleFillPendingOrderAsMarket(order.id)}
                              className="px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-slate-950 text-xs font-bold transition-all cursor-pointer border border-teal-500/30 flex items-center gap-1"
                              title="Instant fill at current live market price"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Fill Market Now</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCancelPendingOrder(order.id)}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold transition-all cursor-pointer border border-rose-500/20 flex items-center gap-1"
                              title="Cancel limit order and refund reserved collateral"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel Order</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. PAST CLOSED HISTORY & AUDIT VIEW */}
          {activePositionsTab === 'HISTORY' && (
            <div className="p-5 rounded-xl bg-[#0E131F] border border-[#1C263C] space-y-4 shadow-lg animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1C263C]">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Practice Trade History & Alert Audit ({account.history.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Track right vs wrong alert entries with dual USDT & ₹ INR realized PnL
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearAllHistory}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-[11px] font-bold border border-rose-500/20 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    title="Clear all closed trade records"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear History</span>
                  </button>
                </div>
              </div>

              {/* Right vs Wrong Trades Audit Stats Bar */}
              {(() => {
                const total = account.history.length;
                const rightCount = account.history.filter((h) => (h.realizedPnL || 0) > 0).length;
                const wrongCount = account.history.filter((h) => (h.realizedPnL || 0) < 0).length;
                const winRate = total > 0 ? ((rightCount / total) * 100).toFixed(1) : '0.0';
                const calculatedHistoryPnL = account.history.reduce((sum, h) => sum + (Number(h.realizedPnL) || 0), 0);
                const effectiveRealizedPnL = total > 0 ? calculatedHistoryPnL : 0;
                const totalInr = Math.round(effectiveRealizedPnL * INR_PER_USD);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-lg bg-[#121827] border border-[#1C263C]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Trades</span>
                      <span className="text-lg font-black text-white font-mono">{total}</span>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase block">✅ Right Trades (Win)</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-emerald-400 font-mono">{rightCount}</span>
                        <span className="text-[10px] font-bold text-emerald-300">({winRate}%)</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25">
                      <span className="text-[10px] text-rose-400 font-bold uppercase block">❌ Wrong Trades (Trap)</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-rose-400 font-mono">{wrongCount}</span>
                        <span className="text-[10px] font-bold text-rose-300">
                          ({total > 0 ? ((wrongCount / total) * 100).toFixed(1) : '0.0'}%)
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#121827] border border-[#1C263C]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Net Practice P&L</span>
                      <div
                        className={`text-base font-black font-mono leading-tight ${
                          total === 0
                            ? 'text-slate-300'
                            : effectiveRealizedPnL > 0
                            ? 'text-emerald-400'
                            : effectiveRealizedPnL < 0
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {total === 0 ? '$0.00' : `${effectiveRealizedPnL > 0 ? '+' : ''}$${effectiveRealizedPnL.toFixed(2)}`}
                      </div>
                      <div
                        className={`text-[10px] font-bold font-mono ${
                          total === 0
                            ? 'text-slate-400'
                            : totalInr > 0
                            ? 'text-emerald-300'
                            : totalInr < 0
                            ? 'text-rose-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {total === 0 ? '₹0' : formatINRValue(effectiveRealizedPnL, true)}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#121827] border border-[#1C263C] text-xs">
                <button
                  type="button"
                  onClick={() => setHistoryFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    historyFilter === 'ALL'
                      ? 'bg-teal-500 text-slate-950 shadow-sm font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  All Trades ({account.history.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('RIGHT')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    historyFilter === 'RIGHT'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                      : 'text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  <span>✅ Right Trades</span>
                  <span>({account.history.filter((h) => (h.realizedPnL || 0) > 0).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('WRONG')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    historyFilter === 'WRONG'
                      ? 'bg-rose-500 text-white shadow-sm font-black'
                      : 'text-rose-400 hover:bg-rose-500/10'
                  }`}
                >
                  <span>❌ Wrong Trades</span>
                  <span>({account.history.filter((h) => (h.realizedPnL || 0) < 0).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('AUTO')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    historyFilter === 'AUTO'
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                      : 'text-amber-400 hover:bg-amber-500/10'
                  }`}
                >
                  <span>🤖 Auto-Trades</span>
                  <span>({account.history.filter((h) => Boolean(h.isAutoTrade || h.signalType?.includes('Auto') || h.signalType?.includes('Breakout') || h.id?.includes('auto'))).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('MANUAL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    historyFilter === 'MANUAL'
                      ? 'bg-sky-500 text-slate-950 shadow-sm font-black'
                      : 'text-sky-400 hover:bg-sky-500/10'
                  }`}
                >
                  <span>👤 Manual</span>
                  <span>({account.history.filter((h) => !Boolean(h.isAutoTrade || h.signalType?.includes('Auto') || h.signalType?.includes('Breakout') || h.id?.includes('auto'))).length})</span>
                </button>
              </div>

              {/* History Items List */}
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {account.history
                  .filter((h) => {
                    const isAuto = Boolean(h.isAutoTrade || h.signalType?.includes('Auto') || h.signalType?.includes('Breakout') || h.id?.includes('auto'));
                    if (historyFilter === 'RIGHT') return (h.realizedPnL || 0) > 0;
                    if (historyFilter === 'WRONG') return (h.realizedPnL || 0) < 0;
                    if (historyFilter === 'AUTO') return isAuto;
                    if (historyFilter === 'MANUAL') return !isAuto;
                    return true;
                  })
                  .map((hist) => {
                    const isWin = (hist.realizedPnL || 0) > 0;
                    const isLoss = (hist.realizedPnL || 0) < 0;
                    const isAuto = Boolean(hist.isAutoTrade || hist.signalType?.includes('Auto') || hist.signalType?.includes('Breakout') || hist.id?.includes('auto'));
                    const priceDiff = hist.exitPrice - hist.entryPrice;
                    const priceDiffPct = hist.entryPrice > 0 ? (priceDiff / hist.entryPrice) * 100 : 0;
                    const isLongProfitable = hist.direction === 'LONG' ? priceDiff > 0 : priceDiff < 0;

                    return (
                      <div
                        key={hist.id}
                        className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                          isWin
                            ? 'bg-emerald-950/15 border-emerald-500/30 hover:border-emerald-500/50'
                            : isLoss
                            ? 'bg-rose-950/15 border-rose-500/30 hover:border-rose-500/50'
                            : 'bg-[#121827] border-[#1C263C] hover:border-slate-700'
                        }`}
                      >
                        {/* Top Header Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Win/Loss Status Icon */}
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                isWin
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : isLoss
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {isWin ? '✓' : isLoss ? '✗' : '—'}
                            </div>

                            {/* Symbol & Category */}
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-white text-sm tracking-tight">{hist.symbol}</span>
                              {hist.category && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                  {hist.category}
                                </span>
                              )}
                            </div>

                            {/* Direction & Leverage Badge */}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                hist.direction === 'LONG'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {hist.direction} {hist.leverage}x
                            </span>

                            {/* Order Type */}
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700 px-1.5 py-0.5 rounded">
                              {hist.orderType || 'MARKET'}
                            </span>

                            {/* Origin Source Badge */}
                            {isAuto ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5 fill-amber-300" />
                                <span>Auto-Trade {hist.autoTradeConfidence ? `(${hist.autoTradeConfidence}%)` : ''}</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/25">
                                👤 Manual Trade
                              </span>
                            )}
                          </div>

                          {/* Top Right: Realized PnL */}
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              {isIndianAsset(hist.symbol) ? (
                                <div
                                  className={`font-black font-mono text-base sm:text-lg leading-tight ${
                                    isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-300'
                                  }`}
                                >
                                  {isWin ? '+' : ''}₹{hist.realizedPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                                  <span className="text-xs">
                                    ({hist.realizedPnLPercent >= 0 ? '+' : ''}
                                    {hist.realizedPnLPercent}%)
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <div
                                    className={`font-black font-mono text-base sm:text-lg leading-tight ${
                                      isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-300'
                                    }`}
                                  >
                                    {isWin ? '+' : ''}${hist.realizedPnL.toFixed(2)}{' '}
                                    <span className="text-xs">
                                      ({hist.realizedPnLPercent >= 0 ? '+' : ''}
                                      {hist.realizedPnLPercent}%)
                                    </span>
                                  </div>
                                  <div
                                    className={`font-bold font-mono text-xs ${
                                      isWin ? 'text-emerald-300' : isLoss ? 'text-rose-300' : 'text-slate-400'
                                    }`}
                                  >
                                    {formatINRValue(hist.realizedPnL, true)}
                                  </div>
                                </>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteHistoryItem(hist.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 hover:text-rose-200 transition-all cursor-pointer active:scale-95"
                              title="Delete this closed trade record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Middle Row: Price Track & Exact Execution Times */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#0A0E17]/90 border border-[#1A2234] text-xs">
                          {/* Price Track */}
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Execution Prices</span>
                            <div className="font-mono text-slate-200 flex items-center gap-1.5">
                              <span className="text-slate-300 font-bold">
                                {formatCurrencyForAsset(hist.entryPrice, hist.symbol)}
                              </span>
                              <span className="text-slate-500">➔</span>
                              <span className={`font-bold ${isLongProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatCurrencyForAsset(hist.exitPrice, hist.symbol)}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              Move: {priceDiff >= 0 ? '+' : ''}{formatCurrencyForAsset(priceDiff, hist.symbol)} ({priceDiffPct >= 0 ? '+' : ''}{priceDiffPct.toFixed(2)}%)
                            </div>
                          </div>

                          {/* Exact Timestamps & Duration */}
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Timing & Duration</span>
                            <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>Entry: {hist.openedAt || '12:00 PM'}</span>
                              <span className="text-slate-500">➔</span>
                              <span>Exit: {hist.closedAt || '12:05 PM'}</span>
                            </div>
                            <div className="text-[10px] font-mono text-teal-400 font-bold">
                              ⏱️ Held Duration: {hist.duration || '3m 15s'}
                            </div>
                          </div>

                          {/* Position Sizing & Margin */}
                          <div className="space-y-0.5 sm:col-span-2 lg:col-span-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Position Sizing</span>
                            <div className="font-mono text-slate-300 text-[11px]">
                              Qty: <span className="font-bold text-white">{hist.quantity}</span> • Margin:{' '}
                              <span className="font-bold text-amber-300">
                                {formatCurrencyForAsset(
                                  hist.marginUsed || ((hist.quantity * hist.entryPrice) / (hist.leverage || 10)),
                                  hist.symbol
                                )}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Size: {formatCurrencyForAsset((hist.quantity || 1) * (hist.entryPrice || 1), hist.symbol)}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row: Exit Reason & Signal Logic Audit */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Detailed Exit Reason Badge */}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                hist.reason === 'TAKE_PROFIT'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : hist.reason === 'TRAILING_STOP'
                                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                  : hist.reason === 'STOP_LOSS'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : hist.reason === 'LIQUIDATED'
                                  ? 'bg-red-600/30 text-red-200 border border-red-500/50'
                                  : hist.reason === 'PARTIAL_CLOSE'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {hist.reason === 'TAKE_PROFIT'
                                ? '🎯 TAKE PROFIT TARGET HIT'
                                : hist.reason === 'TRAILING_STOP'
                                ? '⚡ TRAILING STOP PROFIT LOCK'
                                : hist.reason === 'STOP_LOSS'
                                ? '🛑 STOP LOSS RISK CUT'
                                : hist.reason === 'LIQUIDATED'
                                ? '💥 LIQUIDATION MARGIN BREACH'
                                : hist.reason === 'PARTIAL_CLOSE'
                                ? '✂️ PARTIAL 50% TAKE PROFIT'
                                : '✋ MANUAL CLOSE'}
                            </span>

                            {/* Exit Reason Detail String */}
                            <span className="text-[11px] text-slate-400">
                              {hist.exitReasonDetail || hist.reason}
                            </span>
                          </div>

                          {/* Strategy / Signal Type */}
                          {hist.signalType && (
                            <span className="text-[10px] text-slate-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                              Logic: {hist.signalType}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODAL 1: ORDER TYPE & EXECUTION CONFIRMATION MODAL
      ------------------------------------------------------------- */}
      <OrderConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        asset={selectedAsset}
        direction={direction}
        orderType={orderType}
        setOrderType={setOrderType}
        limitPrice={limitPrice}
        setLimitPrice={setLimitPrice}
        activeQuantity={activeQuantity}
        unitShort={getUnitShort(selectedAsset)}
        totalPositionSizeUsd={totalPositionSizeUsd}
        leverage={leverage}
        computedMarginRequired={computedMarginRequired}
        freeCollateral={account.freeCollateral}
        liquidationPrice={liquidationPrice}
        stopLossPrice={stopLossPrice}
        takeProfitPrice={takeProfitPrice}
        maxLossUsd={maxLossUsd}
        maxProfitUsd={maxProfitUsd}
        maxLossPercentOnMargin={maxLossPercentOnMargin}
        maxProfitPercentOnMargin={maxProfitPercentOnMargin}
        calculatedRRRatio={calculatedRRRatio}
        isTrailingEnabled={isTrailingEnabled}
        trailingDistanceInput={trailingDistanceInput}
        onConfirmExecuteMarket={handleConfirmExecuteMarket}
        onConfirmPlaceLimit={handleConfirmPlaceLimit}
        inrPerUsd={INR_PER_USD}
      />

      {/* -------------------------------------------------------------
          MODAL 2: EDIT / MODIFY ACTIVE POSITION (SL, TP, TSL, PARTIAL CLOSE)
      ------------------------------------------------------------- */}
      {editingPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#0E131F] border border-[#1C263C] rounded-2xl shadow-2xl overflow-hidden flex flex-col space-y-4 p-5 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1C263C]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Modify Active Order</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        editingPosition.direction === 'LONG'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {editingPosition.direction} {editingPosition.symbol}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Entry: ${editingPosition.entryPrice.toLocaleString()} • Mark: ${editingPosition.currentPrice.toLocaleString()} • Qty: {editingPosition.quantity}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingPosition(null)}
                className="p-1.5 rounded-lg bg-[#121827] text-slate-400 hover:text-white border border-[#1C263C] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setEditSL(editingPosition.entryPrice)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Move SL to Breakeven (${editingPosition.entryPrice.toLocaleString()})</span>
              </button>
            </div>

            {/* Stop Loss & Take Profit Fields with live math */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-rose-400 block">Stop Loss Price ($)</label>
                <input
                  type="number"
                  step="any"
                  value={editSL}
                  onChange={(e) => setEditSL(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#121827] border border-rose-500/30 text-xs font-mono font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                />
                <div className="text-[10px] text-slate-400 font-mono">
                  {editSL > 0 && (
                    <span>
                      Est Loss:{' '}
                      {formatCurrency(
                        Math.abs(editingPosition.entryPrice - editSL) * editingPosition.quantity
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-400 block">Take Profit Price ($)</label>
                <input
                  type="number"
                  step="any"
                  value={editTP}
                  onChange={(e) => setEditTP(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#121827] border border-emerald-500/30 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <div className="text-[10px] text-slate-400 font-mono">
                  {editTP > 0 && (
                    <span>
                      Est Profit:{' '}
                      +{formatCurrency(
                        Math.abs(editTP - editingPosition.entryPrice) * editingPosition.quantity
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Trailing Stop Loss in Modal */}
            <div className="p-3 rounded-xl bg-[#121827] border border-[#1C263C] space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Trailing Stop Loss (TSL)</span>
                </div>
                <input
                  type="checkbox"
                  checked={editTrailingEnabled}
                  onChange={(e) => setEditTrailingEnabled(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              {editTrailingEnabled && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-slate-300 block">Trailing Distance Step ($):</span>
                  <input
                    type="number"
                    step="any"
                    value={editTrailingDistance}
                    onChange={(e) => setEditTrailingDistance(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#0E131F] border border-amber-500/30 text-xs font-mono font-bold text-amber-300"
                  />
                </div>
              )}
            </div>

            {/* Partial Profit Close Action */}
            <div className="p-3 rounded-xl bg-[#121827] border border-[#1C263C] space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Book Partial Profit & Close Scale-Out:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleExecutePartialClose(0.25)}
                  className="py-1.5 rounded-lg bg-[#0E131F] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-[#1C263C] text-xs font-bold transition-all cursor-pointer"
                >
                  Close 25%
                </button>
                <button
                  type="button"
                  onClick={() => handleExecutePartialClose(0.5)}
                  className="py-1.5 rounded-lg bg-[#0E131F] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-[#1C263C] text-xs font-bold transition-all cursor-pointer"
                >
                  Close 50%
                </button>
                <button
                  type="button"
                  onClick={() => handleExecutePartialClose(0.75)}
                  className="py-1.5 rounded-lg bg-[#0E131F] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-[#1C263C] text-xs font-bold transition-all cursor-pointer"
                >
                  Close 75%
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1C263C]">
              <button
                type="button"
                onClick={() => setEditingPosition(null)}
                className="px-4 py-2 rounded-xl bg-[#121827] hover:bg-[#1A2234] text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOrderUpdate}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save & Update Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 3: SENTINEL AUTO-TRADER CONFIGURATION MODAL
      ------------------------------------------------------------- */}
      <AutoTradeConfigModal
        isOpen={isAutoConfigModalOpen}
        onClose={() => setIsAutoConfigModalOpen(false)}
        config={autoTradeConfig}
        onSaveConfig={handleSaveAutoTradeConfig}
        freeCollateral={account.freeCollateral}
      />

      {/* -------------------------------------------------------------
          MODAL 4: SENTINEL AUTO-TRADE AUDIT TRAIL LOG MODAL
      ------------------------------------------------------------- */}
      <AutoTradeLogModal
        isOpen={isAutoLogModalOpen}
        onClose={() => setIsAutoLogModalOpen(false)}
        logs={autoTradeLogs}
        onClearLogs={handleClearAutoTradeLogs}
      />

      {/* -------------------------------------------------------------
          MODAL 5: CLEAR TRADE HISTORY CONFIRMATION MODAL
      ------------------------------------------------------------- */}
      {isClearHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#0E1321] border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">Clear Practice Trade History?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will delete all <strong className="text-rose-400">{account.history.length} closed trade history records</strong> and reset your practice audit log to a clean state.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsClearHistoryModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAllHistory}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-xs transition-all active:scale-95 shadow-lg shadow-rose-500/25 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Clear All History</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 6: RESET DEMO WALLET CONFIRMATION MODAL
      ------------------------------------------------------------- */}
      {isResetDemoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#0E1321] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <RotateCcw className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">Reset Demo Capital to $10,000?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will reset your paper trading balance back to initial $10,000 capital and reset all active running positions.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsResetDemoModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetBalance}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs transition-all active:scale-95 shadow-lg shadow-amber-500/25 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Yes, Reset to $10K</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 7: INDIAN F&O OPTION CHAIN SELECTION DRAWER
      ------------------------------------------------------------- */}
      <IndianOptionsChainDrawer
        isOpen={isOptionsChainOpen}
        onClose={() => setIsOptionsChainOpen(false)}
        underlyingAsset={selectedAsset}
        onSelectContract={(contract) => {
          setSelectedOptionContract(contract);
          setIsOptionsChainOpen(false);
          showToast(
            'success',
            `🎯 Loaded Option: ${contract.contractSymbol} (${contract.optionType}) @ ₹${contract.premiumInr}`
          );
        }}
      />

      {/* -------------------------------------------------------------
          MODAL 8: BROKER API KEYS & LIVE ACCOUNT SYNC MODAL
      ------------------------------------------------------------- */}
      {isBrokerSyncModalOpen && (
        <BrokerSyncModal
          isOpen={isBrokerSyncModalOpen}
          onClose={() => setIsBrokerSyncModalOpen(false)}
          onBrokersUpdated={(updatedList) => {
            setConnectedBrokers(updatedList);
            const primary = updatedList.find((b) => b.isConnected);
            if (primary) setActiveBroker(primary);
          }}
        />
      )}
    </div>
  );
};
