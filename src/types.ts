export type MarketCategory = 'Crypto' | 'Stocks' | 'Forex' | 'Futures' | 'Commodities' | 'Indian Stocks / F&O';

export type TradeDirection = 'LONG' | 'SHORT';
export type TradeStatus = 'OPEN' | 'WIN' | 'LOSS' | 'BREAKEVEN';

export type EmotionBefore = 'Confident' | 'Disciplined' | 'Neutral' | 'Fearful' | 'Greedy' | 'FOMO' | 'Rushed' | 'Revenge-Prone';
export type EmotionAfter = 'Satisfied' | 'Disciplined' | 'Relieved' | 'Regretful' | 'Frustrated' | 'Angry' | 'Neutral' | 'Reflective';

export type TradingStrategy =
  | 'Breakout / Expansion'
  | 'Support & Resistance Bounce'
  | 'Order Block / Smart Money (SMC)'
  | 'Fair Value Gap (FVG)'
  | 'Trend Following / Pullback'
  | 'Mean Reversion / Range'
  | 'Scalp Momentum'
  | 'Swing Structure'
  | 'Liquidity Sweep';

export interface Trade {
  id: string;
  symbol: string;
  market: MarketCategory;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  targetPrice: number;
  quantity: number;
  positionSizeUsd: number;
  leverage: number;
  pnl?: number;
  pnlPercent?: number;
  riskRewardRatio: number;
  status: TradeStatus;
  strategy: TradingStrategy;
  notes: string;
  exitNotes?: string;
  screenshotUrl?: string;
  emotionBefore: EmotionBefore;
  emotionAfter?: EmotionAfter;
  openDate: string; // ISO date
  closeDate?: string;
  fees: number;
  tags: string[];
}

export interface JournalAnalytics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  totalPnL: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
  avgRiskReward: number;
  expectancy: number;
  currentStreak: number;
  disciplineScore: number;
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi?: number;
}

export interface MarketAsset {
  symbol: string;
  name: string;
  category: MarketCategory;
  price: number;
  change24h: number;
  change24hAmount: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  marketCap?: string;
  sparkline: number[];
  candles: CandleData[];
  isFavorite?: boolean;
}

export interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  currency: string;
  title: string;
  impact: 'High' | 'Medium' | 'Low';
  actual?: string;
  forecast: string;
  previous: string;
  timestamp?: number;
  dateIso?: string;
  status?: 'RELEASED' | 'UPCOMING' | 'LIVE';
  outcome?: 'better' | 'worse' | 'inline';
  description?: string;
  assetImpact?: string;
  category?: 'Inflation' | 'Central Bank' | 'Employment' | 'Growth / GDP' | 'Sentiment / PMI' | 'Commodities';
}

export interface MarketNewsItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  category: string;
  summary: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  impactScore: number; // 1-10
  url?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'model';
  content: string;
  timestamp: string;
  topic?: string;
  suggestedQuestions?: string[];
}

export interface FearGreedData {
  value: number;
  sentiment: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  yesterdayValue: number;
  lastWeekValue: number;
  lastMonthValue: number;
}

export interface DetectedKeyLevels {
  detectedSymbol?: string;
  detectedTimeframe?: string;
  tradeBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL / RANGE';
  supportZone: string;
  resistanceZone: string;
  optimalEntry: string;
  invalidationSL: string;
  takeProfit1: string;
  takeProfit2: string;
  liquidityTarget?: string;
  keyLogicSummary: string;
}

export interface TradeReviewRubric {
  structureScore: number; // out of 25
  invalidationScore: number; // out of 25
  riskRewardScore: number; // out of 25
  disciplineScore: number; // out of 25
}

export interface TradeReviewAnalysis {
  scoreOutOf100: number;
  disciplineGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  overallVerdict: 'High Probability' | 'Moderate Risk' | 'High Risk / Poor R:R' | 'Invalid Setup';
  rubricBreakdown: TradeReviewRubric;
  keyLevels?: DetectedKeyLevels;
  detectedTrend: string;
  detectedSupportResistance: string;
  detectedMarketStructure: string;
  riskRewardAnalysis: string;
  calculatedRR?: string;
  detectedMistakes: string[];
  keyStrengths: string[];
  risksAndPitfalls: string[];
  actionableSuggestions: string[];
  disclaimer: string;
}

export type AITradeReviewAnalysis = TradeReviewAnalysis;

export interface LessonQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AcademyLesson {
  id: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  title: string;
  category: 'Price Action' | 'Risk Management' | 'Psychology' | 'Market Structure' | 'Indicators & Math';
  readTime: string;
  overview: string;
  keyPoints: string[];
  contentMarkdown: string;
  quiz: LessonQuiz[];
  isCompleted?: boolean;
}

export interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  category: MarketCategory;
  amount: number;
  avgBuyPrice: number;
  currentPrice: number;
  allocationPercent?: number;
}

export interface PortfolioTransaction {
  id: string;
  date: string;
  type: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAWAL';
  symbol?: string;
  amount: number;
  price?: number;
  totalUsd: number;
  notes?: string;
}

export interface DailyHabit {
  id: string;
  title: string;
  description: string;
  category: 'Discipline' | 'Analysis' | 'Risk' | 'Psychology' | 'discipline' | 'risk' | 'mindset' | 'study';
  completedDays: boolean[]; // 7 days of current week (Mon-Sun)
  streakDays?: number;
  completedToday?: boolean;
}

export interface TradingGoal {
  id: string;
  title: string;
  type: 'Daily' | 'Weekly' | 'Monthly';
  targetMetric: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  isCompleted: boolean;
  dueDate: string;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorBadge: string;
  authorAvatar: string;
  timeAgo: string;
  createdAt?: string;
  symbol: string;
  market: MarketCategory;
  direction: TradeDirection;
  title: string;
  thesis: string;
  timeframe: string;
  chartUrl?: string;
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  riskRewardRatio?: number | string;
  postType?: 'Live Setup' | 'Educational' | 'Trade Recap';
  likes: number;
  isLiked?: boolean;
  commentsCount: number;
  comments: {
    id: string;
    author: string;
    avatar: string;
    timeAgo: string;
    text: string;
  }[];
  tags: string[];
}

export type BrokerProviderId =
  | 'zerodha'
  | 'dhan'
  | 'angelone'
  | 'upstox'
  | 'fyers'
  | '5paisa'
  | 'aliceblue'
  | 'kotakneo'
  | 'shoonya'
  | 'delta'
  | 'binance'
  | 'bybit'
  | 'kucoin'
  | 'okx'
  | 'metatrader'
  | 'ctrader';

export interface BrokerConnection {
  id: string;
  provider: BrokerProviderId;
  name: string;
  category: 'Indian Stocks / F&O' | 'Global Crypto' | 'Forex & Prop Firm';
  isConnected: boolean;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  passphrase?: string;
  clientId?: string;
  appId?: string;
  totpSecret?: string;
  webhookSecret?: string;
  lastSyncedAt?: string;
  syncedTradesCount: number;
  autoSyncEnabled: boolean;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR';
  latencyMs?: number;
  accountName?: string;
  availableMargin?: number;
}

export interface TelegramAlertConfig {
  isEnabled: boolean;
  botToken?: string;
  chatId?: string;
  channelUsername?: string;
  alertOnBreakout: boolean;
  alertOnRiskDrawdown: boolean;
  alertOnMacroNews: boolean;
  alertOnJournalSync: boolean;
  lastAlertSentAt?: string;
  minConfidenceScore?: number;
  antiFakeoutFilter?: boolean;
  autoSendBreakouts?: boolean;
  minPriceJumpUsd?: number;
  respectIndianMarketHours?: boolean;
  segmentThrottling?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro / Institutional';
  primaryMarkets: MarketCategory[];
  accountBalance: number;
  defaultRiskPercent: number;
  maxDailyLossUsd: number;
  maxRiskPerTrade?: number;
  maxOpenTrades: number;
  theme: 'cyber-dark' | 'midnight-blue' | 'emerald-obsidian';
  soundEnabled: boolean;
  autoSaveCloud: boolean;
  subscriptionStatus?: 'FREE' | 'PRO' | 'ULTIMATE' | 'INSTITUTIONAL';
  subscriptionTier?: 'FREE' | 'PRO' | 'ULTIMATE' | 'INSTITUTIONAL';
  isPro?: boolean;
  subscriptionExpiresAt?: string;
  subscription?: {
    status: string;
    tier: string;
    gateway?: string;
    paymentId?: string;
    orderId?: string;
    amount?: number;
    currency?: string;
    activatedAt?: string;
    expiresAt?: string;
  };
}

export interface FounderProfile {
  name: string;
  role: string;
  location: string;
  hometown: string;
  experienceYears: string;
  education: string;
  lossesLearned: string;
  builtWith: string;
  bio: string;
  quote: string;
  photoUrl: string;
  badge: string;
  telegram?: string;
  twitter?: string;
  email?: string;
  updatedAt?: string;
}

export type QuizQuestion = LessonQuiz;
export type ChatMessage = AIChatMessage;
export type NewsArticle = MarketNewsItem;
export type CommunityTradeIdea = CommunityPost;
export type TradingHabit = DailyHabit;

// 1. Live Breakout Scanner & Signal Radar
export type BreakoutSignalType =
  | 'Resistance Breakout'
  | 'Support Breakdown'
  | 'Volume Surge (3x)'
  | 'RSI Oversold (Bounce)'
  | 'RSI Overbought (Exhaustion)'
  | 'EMA 20/50 Golden Cross'
  | 'EMA 20/50 Death Cross'
  | 'SMC Liquidity Sweep'
  | 'SMC Order Block Retest'
  | 'Fair Value Gap (FVG) Mitigation'
  | 'Judas Swing / Liquidity Trap Fade';

export type BreakoutExecutionStatus =
  | 'WAIT_FOR_RETEST'
  | 'LIMIT_READY'
  | 'LIQUIDITY_SWEPT_TRAP'
  | 'CONFIRMED_EXPANSION';

export interface BreakoutSignal {
  id: string;
  symbol: string;
  name: string;
  category: MarketCategory;
  type: BreakoutSignalType;
  direction: 'BULLISH' | 'BEARISH' | 'VOLATILITY';
  timeframe: '15m' | '1h' | '4h' | '1d';
  price: number;
  change24h: number;
  confidenceScore: number; // 0 - 100%
  triggerMetric: string;
  volumeMultiplier: number;
  suggestedEntry: number;
  entryZone?: string;
  suggestedSL: number;
  suggestedTP: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  riskReward: number;
  timestamp: string;
  isHot?: boolean;
  antiFakeoutScore?: number;
  antiFakeoutChecks?: {
    volumeSurge: boolean;
    trendAligned: boolean;
    structureConfirmed: boolean;
    macroClear: boolean;
  };
  invalidationReason?: string;
  setupGrade?: 'A+' | 'A' | 'B';
  // SMC & Liquidity Intelligence
  executionStatus?: BreakoutExecutionStatus;
  executionStatusLabel?: string;
  fomoTrapWarning?: string;
  htfBias?: string;
  antiTrapRule?: string;
  liquidityPools?: {
    bsl: number; // Buy-Side Liquidity (Stop hunt zone above high)
    ssl: number; // Sell-Side Liquidity (Stop hunt zone below low)
    fvgZone: string; // Fair Value Gap discount entry
    orderBlockZone: string; // Institutional Order Block zone
  };
}

// 2. Paper Trading / Virtual Practice Engine
export interface TrailingStopLossConfig {
  enabled: boolean;
  trailDistance: number; // in price points ($ or currency)
  trailDistancePercent?: number; // in %
  peakPrice: number; // Highest price reached (Long) or Lowest price (Short)
  activeStopPrice: number;
}

// ---------------- AUTOMATED TRADE EXECUTION ENGINE ----------------
export type AutoTradeExecutionMode = 'SMART_SMC' | 'INSTANT_MARKET' | 'LIMIT_PULLBACK';

export interface AutoTradeConfig {
  isEnabled: boolean;
  executionMode: AutoTradeExecutionMode;
  minConfidenceScore: number; // e.g. 85%
  minRiskReward: number; // e.g. 2.0
  allowedGrades: ('A+' | 'A' | 'B')[];
  maxOpenPositions: number; // e.g. 3 or 5 concurrent
  sizingMode: 'FIXED_MARGIN' | 'PERCENT_BALANCE' | 'RISK_PERCENT';
  fixedMarginAmount: number; // e.g. $100
  riskPercentBalance: number; // e.g. 2% or 5%
  defaultLeverage: number; // e.g. 10x
  autoMoveSlToBreakeven: boolean; // Auto-move SL to BE on TP1 hit
  enableTrailingStop: boolean;
  trailingDistancePercent: number; // e.g. 1.5%
  soundAlertOnExecution: boolean;
  targetCategories: MarketCategory[];
  cooldownMinutesPerAsset: number; // e.g. 15 min
  antiFakeoutStrict: boolean;
  respectIndianMarketHours?: boolean; // Restrict Indian Equities/F&O execution strictly to 09:15 AM - 03:30 PM IST (Mon-Fri)
}

export interface AutoTradeLogItem {
  id: string;
  timestamp: string;
  symbol: string;
  category?: MarketCategory;
  direction: TradeDirection;
  orderType: 'MARKET' | 'LIMIT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  quantity: number;
  marginUsed: number;
  leverage: number;
  signalType: string;
  confidenceScore: number;
  setupGrade: 'A+' | 'A' | 'B';
  status: 'FILLED' | 'LIMIT_QUEUED' | 'SKIPPED_FILTER';
  rejectionReason?: string;
  executionLogicSummary: string;
  invalidationReason?: string;
  riskReward: number;
  positionId?: string;
}

export interface PaperPendingOrder {
  id: string;
  symbol: string;
  category?: MarketCategory;
  direction: TradeDirection;
  orderType: 'LIMIT';
  limitPrice: number;
  currentPriceAtPlacement: number;
  quantity: number;
  leverage: number;
  marginRequired: number;
  liquidationPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  trailingStopLoss?: TrailingStopLossConfig;
  status: 'PENDING' | 'TRIGGERED' | 'CANCELLED';
  placedAt: string;
  notes?: string;
  signalType?: string;
  isAutoTrade?: boolean;
  autoTradeConfidence?: number;
  autoTradeGrade?: string;
  isLiveBrokerTrade?: boolean;
  brokerProvider?: string;
}

export interface PaperPosition {
  id: string;
  symbol: string;
  category?: MarketCategory;
  direction: TradeDirection;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  initialQuantity?: number;
  confidenceScore?: number;
  leverage: number;
  marginUsed: number;
  liquidationPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  slMovedToBreakeven?: boolean;
  trailingStopLoss?: TrailingStopLossConfig;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  openedAt: string;
  lastUpdatedAt?: string;
  notes?: string;
  signalType?: string;
  alertSource?: string;
  orderType?: 'MARKET' | 'LIMIT';
  isAutoTrade?: boolean;
  autoTradeConfidence?: number;
  autoTradeGrade?: string;
  autoTradeReason?: string;
  openedAtTimestamp?: number;
  isLiveBrokerTrade?: boolean;
  brokerProvider?: string;
  brokerOrderId?: string;
  currency?: 'USD' | 'INR' | 'USDT';
  isOptionContract?: boolean;
  optionType?: 'CE' | 'PE';
  strikePrice?: number;
  expiryDate?: string;
  lotSize?: number;
}

export interface PaperTradeHistoryItem {
  id: string;
  symbol: string;
  category?: MarketCategory;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  leverage: number;
  marginUsed?: number;
  realizedPnL: number;
  realizedPnLPercent: number;
  reason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP' | 'MANUAL_CLOSE' | 'PARTIAL_CLOSE' | 'LIQUIDATED';
  exitReasonDetail?: string;
  openedAt: string;
  closedAt: string;
  openedAtTimestamp?: number;
  closedAtTimestamp?: number;
  duration?: string;
  signalType?: string;
  alertSource?: string;
  outcomeVerdict?: 'RIGHT_TRADE' | 'WRONG_TRADE' | 'BREAKEVEN';
  inrRealizedPnL?: number;
  orderType?: 'MARKET' | 'LIMIT';
  isAutoTrade?: boolean;
  autoTradeConfidence?: number;
  autoTradeGrade?: string;
  autoTradeReason?: string;
  isLiveBrokerTrade?: boolean;
  brokerProvider?: string;
  brokerOrderId?: string;
  currency?: 'USD' | 'INR' | 'USDT';
  isOptionContract?: boolean;
  optionType?: 'CE' | 'PE';
  strikePrice?: number;
  lotSize?: number;
}

export interface PaperTradingAccount {
  balance: number;
  initialBalance: number;
  equity: number;
  marginUsed: number;
  freeCollateral: number;
  realizedPnL: number;
  unrealizedPnL: number;
  positions: PaperPosition[];
  pendingOrders?: PaperPendingOrder[];
  history: PaperTradeHistoryItem[];
}

// 3. Trader Tilt & Revenge-Trading Lock
export interface TiltLockState {
  isLocked: boolean;
  lockEndTime?: string; // ISO string
  consecutiveLosses: number;
  dailyDrawdownPercent: number;
  reason: 'CONSECUTIVE_LOSSES' | 'DAILY_DRAWDOWN_LIMIT' | 'REVENGE_VELOCITY' | 'MANUAL_LOCKOUT' | null;
  cooldownMinutesTotal: number;
}

// 4. Indian Crypto Tax & TDS Matrix
export interface CryptoTaxReport {
  financialYear: string;
  grossSalesTurnoverInr: number;
  grossPurchaseCostInr: number;
  netRealizedGainInr: number;
  totalTdsDeductedInr: number; // 1% under section 194S
  flatTax30PercentInr: number; // 30% under section 115BBH
  cess4PercentInr: number; // 4% Health & Education cess
  totalTaxPayableInr: number;
  inHandProfitInr: number;
  effectiveTaxRatePercent: number;
  usdtInrRate: number;
}

