import {
  Trade,
  AcademyLesson,
  PortfolioHolding,
  PortfolioTransaction,
  DailyHabit,
  TradingGoal,
  CommunityPost,
  UserProfile,
  MarketNewsItem,
  EconomicEvent,
  MarketAsset,
} from '../types';

export const initialUserProfile: UserProfile = {
  id: 'usr-101',
  name: 'SmartAi Trader',
  email: 'smartai.trader@tradeosai.in',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  experienceLevel: 'Intermediate',
  primaryMarkets: ['Crypto', 'Stocks', 'Futures'],
  accountBalance: 25000,
  defaultRiskPercent: 1.0,
  maxDailyLossUsd: 500,
  maxOpenTrades: 3,
  theme: 'cyber-dark',
  soundEnabled: true,
  autoSaveCloud: true,
};

export const sampleTrades: Trade[] = [
  {
    id: 'tr-01',
    symbol: 'BTC/USDT',
    market: 'Crypto',
    direction: 'LONG',
    entryPrice: 65400,
    exitPrice: 68200,
    stopLoss: 64200,
    targetPrice: 68500,
    quantity: 0.35,
    positionSizeUsd: 22890,
    leverage: 1,
    pnl: 980,
    pnlPercent: 4.28,
    riskRewardRatio: 2.58,
    status: 'WIN',
    strategy: 'Order Block / Smart Money (SMC)',
    notes: 'Clean 4H bullish order block retest following liquidity sweep under $64.5k. Waited for 15m bullish engulfing confirmation before entering.',
    exitNotes: 'Trimmed 80% at $68,000 liquidity pool, trailed rest until rejection wick.',
    screenshotUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
    emotionBefore: 'Disciplined',
    emotionAfter: 'Satisfied',
    openDate: '2026-08-14T09:30:00Z',
    closeDate: '2026-08-15T16:45:00Z',
    fees: 18.50,
    tags: ['4H-SMC', 'Liquidity Sweep', 'Patience']
  },
  {
    id: 'tr-02',
    symbol: 'NVDA',
    market: 'Stocks',
    direction: 'LONG',
    entryPrice: 124.50,
    exitPrice: 131.80,
    stopLoss: 121.00,
    targetPrice: 132.00,
    quantity: 120,
    positionSizeUsd: 14940,
    leverage: 1,
    pnl: 876,
    pnlPercent: 5.86,
    riskRewardRatio: 2.14,
    status: 'WIN',
    strategy: 'Breakout / Expansion',
    notes: 'Daily descending wedge breakout with above-average volume. Tech sector showing relative strength versus SPY.',
    exitNotes: 'Exited near resistance at previous ATH test.',
    screenshotUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800&auto=format&fit=crop&q=80',
    emotionBefore: 'Confident',
    emotionAfter: 'Disciplined',
    openDate: '2026-08-11T13:30:00Z',
    closeDate: '2026-08-13T19:50:00Z',
    fees: 4.20,
    tags: ['Breakout', 'Tech', 'Volume Spike']
  },
  {
    id: 'tr-03',
    symbol: 'EUR/USD',
    market: 'Forex',
    direction: 'SHORT',
    entryPrice: 1.0920,
    exitPrice: 1.0945,
    stopLoss: 1.0945,
    targetPrice: 1.0840,
    quantity: 100000,
    positionSizeUsd: 10920,
    leverage: 10,
    pnl: -250,
    pnlPercent: -2.29,
    riskRewardRatio: 3.20,
    status: 'LOSS',
    strategy: 'Fair Value Gap (FVG)',
    notes: 'Attempted short into 1H bearish FVG. Market pushed higher due to hawkish comments during London session.',
    exitNotes: 'Stop hit strictly as planned. No revenge trading. Respected initial plan.',
    emotionBefore: 'Neutral',
    emotionAfter: 'Disciplined',
    openDate: '2026-08-12T08:15:00Z',
    closeDate: '2026-08-12T11:20:00Z',
    fees: 7.00,
    tags: ['Forex', 'FVG', 'Strict Stop']
  },
  {
    id: 'tr-04',
    symbol: 'SOL/USDT',
    market: 'Crypto',
    direction: 'LONG',
    entryPrice: 162.00,
    exitPrice: 176.50,
    stopLoss: 156.00,
    targetPrice: 178.00,
    quantity: 45,
    positionSizeUsd: 7290,
    leverage: 1,
    pnl: 652.50,
    pnlPercent: 8.95,
    riskRewardRatio: 2.67,
    status: 'WIN',
    strategy: 'Trend Following / Pullback',
    notes: 'Golden cross on 1H EMA 20/50 pullback. Ecosystem DEX volume growing rapidly.',
    exitNotes: 'Closed position near major psychological level $175-$178.',
    screenshotUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&auto=format&fit=crop&q=80',
    emotionBefore: 'Disciplined',
    emotionAfter: 'Satisfied',
    openDate: '2026-08-08T14:00:00Z',
    closeDate: '2026-08-10T22:00:00Z',
    fees: 8.40,
    tags: ['Solana', 'EMA Pullback', 'Momentum']
  },
  {
    id: 'tr-05',
    symbol: 'ES1!',
    market: 'Futures',
    direction: 'SHORT',
    entryPrice: 5560.00,
    exitPrice: 5560.00,
    stopLoss: 5575.00,
    targetPrice: 5510.00,
    quantity: 1,
    positionSizeUsd: 27800,
    leverage: 5,
    pnl: 0,
    pnlPercent: 0,
    riskRewardRatio: 3.33,
    status: 'BREAKEVEN',
    strategy: 'Support & Resistance Bounce',
    notes: 'Rejection at key weekly resistance. Moved stop to breakeven after +1.5R move.',
    exitNotes: 'Price spiked to retest entry before dropping. Stopped out at exact BE.',
    emotionBefore: 'Neutral',
    emotionAfter: 'Neutral',
    openDate: '2026-08-06T13:45:00Z',
    closeDate: '2026-08-06T15:30:00Z',
    fees: 5.00,
    tags: ['Futures', 'BE Protection']
  },
  {
    id: 'tr-06',
    symbol: 'ETH/USDT',
    market: 'Crypto',
    direction: 'LONG',
    entryPrice: 3480.00,
    stopLoss: 3390.00,
    targetPrice: 3680.00,
    quantity: 2.5,
    positionSizeUsd: 8700,
    leverage: 1,
    riskRewardRatio: 2.22,
    status: 'OPEN',
    strategy: 'Liquidity Sweep',
    notes: 'Asian session low taken out. Strong 15m displacement upward back into the range.',
    emotionBefore: 'Disciplined',
    openDate: '2026-08-17T18:00:00Z',
    fees: 6.50,
    tags: ['ETH', 'Active', 'Asian Range Sweep']
  }
];

export const sampleAcademyLessons: AcademyLesson[] = [
  {
    id: 'les-01',
    level: 'Beginner',
    title: 'Anatomy of Price Action & Candlestick Secrets',
    category: 'Price Action',
    readTime: '6 min read',
    overview: 'Understand how buying and selling pressure creates candlestick bodies, wicks, and reveals true market intent.',
    keyPoints: [
      'Wicks represent price rejection and aggressive absorption.',
      'Candle body size indicates institutional conviction.',
      'Context matters more than isolated single-candle patterns.'
    ],
    contentMarkdown: `
### The Language of Candlesticks

Every candlestick represents a battle between buyers (bids) and sellers (asks) over a fixed duration of time.

#### 1. Real Body vs. Shadows (Wicks)
- **The Body**: Tells you who won the session and the net displacement of price.
- **The Upper Wick**: Shows where sellers absorbed buyers and pushed prices back down (supply rejection).
- **The Lower Wick**: Shows where buyers stepped in with aggressive liquidity (demand absorption).

#### 2. The 3 High-Probability Price Action Triggers
1. **The Pin Bar / Rejection Wick**: Indicates a liquidity raid and immediate rejection at key levels.
2. **The Engulfing Bar**: A momentum expansion candle that completely engulfs the prior candle's range, signaling shift in order flow.
3. **Inside Bar**: A period of market compression before a violent directional volatility expansion.

> **Key Takeaway**: Never trade a single candlestick in isolation. Always look for location (Key S/R) + Structure (Trend) + Momentum (Volume).
`,
    quiz: [
      {
        question: 'What does a long lower wick on a candlestick primarily signify?',
        options: [
          'Strong selling conviction throughout the session',
          'Aggressive buying absorption and rejection of lower prices',
          'Market is completely illiquid and untradable',
          'Guaranteed price explosion upward'
        ],
        correctIndex: 1,
        explanation: 'A long lower wick shows that sellers drove price down, but buyers stepped in with strong liquidity, rejecting lower prices before the close.'
      },
      {
        question: 'Why should single candlestick patterns not be traded in isolation?',
        options: [
          'They only work in forex markets',
          'Without higher timeframe context and key level confluence, win rates are random',
          'Candlestick charts are obsolete',
          'You need at least 50 indicators on screen'
        ],
        correctIndex: 1,
        explanation: 'Market structure, support/resistance context, and confluence are critical to separate high-probability setups from market noise.'
      }
    ]
  },
  {
    id: 'les-02',
    level: 'Beginner',
    title: 'The Golden Mathematics of Risk Management',
    category: 'Risk Management',
    readTime: '8 min read',
    overview: 'Master the 1% rule, position sizing formulas, and why risk-to-reward is the only math that keeps you profitable long-term.',
    keyPoints: [
      'Never risk more than 1-2% of total equity on any single idea.',
      'With a 1:2 Risk:Reward ratio, you can be wrong 60% of the time and still be net profitable.',
      'Position size must adapt to the stop loss distance, never the other way around.'
    ],
    contentMarkdown: `
### Position Sizing: The True Edge in Trading

Most failing traders blow accounts because of position sizing mistakes, not bad analysis.

#### The Fundamental Position Sizing Formula:
$$\\text{Position Size (Units)} = \\frac{\\text{Account Balance} \\times \\text{Risk \\%}}{|\\text{Entry Price} - \\text{Stop Loss Price}|}$$

#### The R:R Win-Rate Matrix
- **1:1 R:R**: Requires > 50% win rate to break even.
- **1:2 R:R**: Requires only **33.3%** win rate to break even.
- **1:3 R:R**: Requires only **25%** win rate to break even.

#### The 3 Sins of Amateur Risk:
1. **Widening Stop Losses**: Giving a losing trade "more room to breathe" leads to catastrophic drawdowns.
2. **Fixed Lot Sizing**: Trading the exact same size regardless of stop loss volatility.
3. **Revenge Trading**: Increasing size immediately after a loss to make back capital quickly.
`,
    quiz: [
      {
        question: 'If your account is $10,000 and you risk 1%, what is your maximum allowed loss on a trade?',
        options: ['$50', '$100', '$500', '$1,000'],
        correctIndex: 1,
        explanation: '1% of $10,000 = $100 maximum risk on the trade.'
      },
      {
        question: 'With a consistent 1:2 Risk-to-Reward ratio, what win rate is needed to break even?',
        options: ['50%', '40%', '33.3%', '25%'],
        correctIndex: 2,
        explanation: 'With 1:2 R:R, 1 win (+2R) offsets 2 losses (-2R). Hence a 33.3% win rate achieves breakeven before fees.'
      }
    ]
  },
  {
    id: 'les-03',
    level: 'Intermediate',
    title: 'Market Structure: BOS, CHoCH, and Swing Geometry',
    category: 'Market Structure',
    readTime: '7 min read',
    overview: 'Learn how to map higher highs, higher lows, Break of Structure (BOS), and Change of Character (CHoCH) like an institutional trader.',
    keyPoints: [
      'BOS (Break of Structure) confirms continuation of the prevailing trend.',
      'CHoCH (Change of Character) is the first structural warning of a potential trend reversal.',
      'Higher timeframe (4H/Daily) structure always supersedes lower timeframe noise.'
    ],
    contentMarkdown: `
### Decoding True Market Structure

Price moves in waves of expansion and retracement. Identifying structural swing points prevents getting caught on the wrong side of the order book.

#### 1. Bullish vs. Bearish Order Flow
- **Bullish Structure**: Series of Higher Highs (HH) and Higher Lows (HL).
- **Bearish Structure**: Series of Lower Lows (LL) and Lower Highs (LH).

#### 2. Break of Structure (BOS)
When price breaks beyond the most recent swing high (in an uptrend) or swing low (in a downtrend) with a solid candle body close. This confirms order flow continuation.

#### 3. Change of Character (CHoCH)
When price in an uptrend fails to make a higher high and instead breaks below the previous higher low (HL). This signifies institutional distribution and early reversal potential.
`,
    quiz: [
      {
        question: 'What is a Change of Character (CHoCH)?',
        options: [
          'When a trader changes their trading strategy',
          'The first break of the opposing swing point signaling potential reversal',
          'A sudden spike in news volume',
          'When indicators cross over'
        ],
        correctIndex: 1,
        explanation: 'CHoCH marks the transition from an established trend (e.g. Higher Lows) into an early shift in market regime.'
      }
    ]
  },
  {
    id: 'les-04',
    level: 'Advanced',
    title: 'Smart Money Concepts: Order Blocks & Liquidity Pools',
    category: 'Indicators & Math',
    readTime: '10 min read',
    overview: 'Uncover where institutional algorithms place resting orders, liquidity sweeps above equal highs/lows, and Fair Value Gaps (FVG).',
    keyPoints: [
      'Liquidity resides above clean equal highs (Buy-side) and below equal lows (Sell-side).',
      'Order Blocks are the origin candles of aggressive institutional displacement.',
      'Fair Value Gaps (FVG) represent 3-candle price imbalances that act as magnets for retests.'
    ],
    contentMarkdown: `
### Smart Money Concepts (SMC) & Liquidity Engineering

Institutional participants need massive counter-party liquidity to fill nine-figure positions without massive slippage.

#### 1. Where Does Liquidity Hide?
- **Buy-Side Liquidity (BSL)**: Stop losses of short sellers and breakout buy stops clustered above obvious double/triple tops.
- **Sell-Side Liquidity (SSL)**: Stop losses of long buyers clustered below obvious double bottoms.

#### 2. The Anatomy of an Order Block (OB)
An Order Block is the last opposite-colored candle before a violent displacement that creates a Break of Structure (BOS) and leaves behind a Fair Value Gap (FVG).

#### 3. The 3-Step SMC Setup:
1. **Liquidity Sweep**: Price sweeps above key highs or below key lows to trigger retail stops.
2. **Displacement & CHoCH**: Violent move in the opposite direction leaving an FVG.
3. **Discount Retest**: Entry on the return to the Order Block / FVG with stop loss tucked safely behind the sweep extreme.
`,
    quiz: [
      {
        question: 'What creates a Fair Value Gap (FVG)?',
        options: [
          'A slow consolidation range with low volume',
          'A violent 3-candle imbalance where candle 1 wick and candle 3 wick do not overlap',
          'A broker server glitch',
          'A holiday market closure'
        ],
        correctIndex: 1,
        explanation: 'An FVG occurs during rapid displacement when the wicks of candle 1 and candle 3 do not meet, leaving an unfilled price imbalance.'
      }
    ]
  },
  {
    id: 'les-05',
    level: 'Advanced',
    title: 'Trading Psychology: Conquering FOMO, Greed, and Revenge Trading',
    category: 'Psychology',
    readTime: '9 min read',
    overview: 'Master Mark Douglas style mindset frameworks. Learn why losing is an inherent business expense and how to build unshakeable discipline.',
    keyPoints: [
      'Accepting risk completely eliminates fear and hesitation.',
      'Outcomes of individual trades are random; your edge emerges over a large sample size.',
      'The best traders think in probabilities, not certainties.'
    ],
    contentMarkdown: `
### The Mental Edge: Why Psychology Dictates 80% of Performance

Technical analysis is simple; emotional regulation under financial stress is difficult.

#### The 4 Mental Traps:
1. **Fear of Missing Out (FOMO)**: Buying at the top of green candles because others are posting profits.
2. **Revenge Trading**: Immediate emotional need to win back money after taking a loss.
3. **Hesitation / Analysis Paralysis**: Fear of pulling the trigger due to previous losses.
4. **Moving Stop Losses**: Inability to accept being wrong on a single trade.

#### The "Casino Operator" Mindset
A casino does not panic when a gambler wins a hand of blackjack. The casino knows that over 10,000 hands, the mathematical edge guarantees profitability. Treat your strategy as the casino's rules.
`,
    quiz: [
      {
        question: 'How does an elite trader view an individual losing trade?',
        options: [
          'As personal failure and a reason to change strategies',
          'As an unavoidable operational cost of doing business within a statistical edge',
          'As proof the market is rigged against them',
          'As a signal to double down immediately'
        ],
        correctIndex: 1,
        explanation: 'Losing trades are normal statistical variance. A disciplined trader expects losses and manages their size so no single trade causes severe damage.'
      }
    ]
  }
];

export const samplePortfolioHoldings: PortfolioHolding[] = [
  {
    id: 'h-1',
    symbol: 'BTC',
    name: 'Bitcoin',
    category: 'Crypto',
    amount: 0.28,
    avgBuyPrice: 58400,
    currentPrice: 68420.50,
    allocationPercent: 44.5
  },
  {
    id: 'h-2',
    symbol: 'ETH',
    name: 'Ethereum',
    category: 'Crypto',
    amount: 2.2,
    avgBuyPrice: 3120,
    currentPrice: 3540.20,
    allocationPercent: 18.2
  },
  {
    id: 'h-3',
    symbol: 'NVDA',
    name: 'NVIDIA Corp',
    category: 'Stocks',
    amount: 45,
    avgBuyPrice: 118.00,
    currentPrice: 132.80,
    allocationPercent: 14.0
  },
  {
    id: 'h-4',
    symbol: 'SPY',
    name: 'S&P 500 ETF',
    category: 'Stocks',
    amount: 15,
    avgBuyPrice: 520.00,
    currentPrice: 548.90,
    allocationPercent: 19.3
  },
  {
    id: 'h-5',
    symbol: 'SOL',
    name: 'Solana',
    category: 'Crypto',
    amount: 10,
    avgBuyPrice: 145.00,
    currentPrice: 178.65,
    allocationPercent: 4.0
  }
];

export const sampleTransactions: PortfolioTransaction[] = [
  {
    id: 'tx-1',
    date: '2026-08-14',
    type: 'BUY',
    symbol: 'BTC',
    amount: 0.08,
    price: 64200,
    totalUsd: 5136,
    notes: 'Dollar cost average into 4H support'
  },
  {
    id: 'tx-2',
    date: '2026-08-10',
    type: 'BUY',
    symbol: 'NVDA',
    amount: 20,
    price: 122.50,
    totalUsd: 2450,
    notes: 'Added to breakout swing'
  },
  {
    id: 'tx-3',
    date: '2026-08-01',
    type: 'DEPOSIT',
    amount: 5000,
    totalUsd: 5000,
    notes: 'Monthly capital allocation deposit'
  }
];

export const sampleHabits: DailyHabit[] = [
  {
    id: 'hab-1',
    title: 'Pre-Market Economic Calendar & News Check',
    description: 'Verify all upcoming high-impact USD/EUR events before placing any trades.',
    category: 'Analysis',
    completedDays: [true, true, true, true, true, false, false]
  },
  {
    id: 'hab-2',
    title: 'Strict 1% Maximum Risk Per Trade',
    description: 'Calculate position size using the Risk Center before submitting every order.',
    category: 'Risk',
    completedDays: [true, true, true, true, true, true, true]
  },
  {
    id: 'hab-3',
    title: 'Complete Post-Trade Journal & Emotion Tagging',
    description: 'Record entry, exit, screenshot, and emotional state in TradeosAi Journal.',
    category: 'Discipline',
    completedDays: [true, true, true, false, true, false, false]
  },
  {
    id: 'hab-4',
    title: 'Daily Walk & Screen Break After 2 Consecutive Losses',
    description: 'Enforce circuit-breaker protocol to prevent emotional revenge trading.',
    category: 'Psychology',
    completedDays: [true, true, true, true, true, false, false]
  }
];

export const sampleGoals: TradingGoal[] = [
  {
    id: 'goal-1',
    title: 'Execute 20 consecutive trades with zero risk rule violations',
    type: 'Monthly',
    targetMetric: 'Disciplined Trades',
    currentValue: 16,
    targetValue: 20,
    unit: 'trades',
    isCompleted: false,
    dueDate: '2026-08-31'
  },
  {
    id: 'goal-2',
    title: 'Maintain Minimum Average 1:2.0 Risk-to-Reward Ratio',
    type: 'Weekly',
    targetMetric: 'Avg R:R',
    currentValue: 2.35,
    targetValue: 2.0,
    unit: 'R:R',
    isCompleted: true,
    dueDate: '2026-08-23'
  },
  {
    id: 'goal-3',
    title: 'Complete All 5 Learning Academy Core Modules',
    type: 'Monthly',
    targetMetric: 'Academy Lessons',
    currentValue: 4,
    targetValue: 5,
    unit: 'lessons',
    isCompleted: false,
    dueDate: '2026-08-30'
  }
];

export const sampleCommunityPosts: CommunityPost[] = [];

export const defaultChecklistItems = [
  { id: 'chk-1', text: 'Checked Economic Calendar for high-impact news releases', checked: true },
  { id: 'chk-2', text: 'Identified major daily/4H support, resistance, and liquidity zones', checked: true },
  { id: 'chk-3', text: 'Calculated exact position size (< 1-2% risk) in Risk Center', checked: true },
  { id: 'chk-4', text: 'Confirmed Risk:Reward ratio is at least 1:2.0', checked: true },
  { id: 'chk-5', text: 'Emotional Check: Calm, detached, not rushing or FOMO chasing', checked: false },
  { id: 'chk-6', text: 'Pre-set hard Stop Loss and Take Profit orders before submitting', checked: false }
];

export const defaultMarketAssets: MarketAsset[] = [
  // 1. Indian Market (NSE/BSE)
  {
    symbol: 'NIFTY 50',
    name: 'Nifty 50 Index (NSE)',
    category: 'Indian Stocks / F&O' as const,
    price: 24850.40,
    change24h: 0.85,
    change24hAmount: 209.50,
    high24h: 24920.00,
    low24h: 24680.00,
    volume24h: '₹42,850 Cr',
    sparkline: [24680, 24720, 24700, 24790, 24820, 24850.4],
    candles: [
      { time: '09:15', open: 24700, high: 24760, low: 24680, close: 24740, volume: 85000 },
      { time: '11:00', open: 24740, high: 24810, low: 24720, close: 24790, volume: 92000 },
      { time: '13:00', open: 24790, high: 24860, low: 24770, close: 24820, volume: 110000 },
      { time: '15:15', open: 24820, high: 24920, low: 24800, close: 24850.4, volume: 145000 },
    ],
    isFavorite: true,
  },
  {
    symbol: 'BANKNIFTY',
    name: 'Bank Nifty Index (NSE)',
    category: 'Indian Stocks / F&O' as const,
    price: 52340.80,
    change24h: 1.15,
    change24hAmount: 595.20,
    high24h: 52500.00,
    low24h: 51800.00,
    volume24h: '₹31,400 Cr',
    sparkline: [51800, 51950, 52100, 52050, 52280, 52340.8],
    candles: [
      { time: '09:15', open: 51850, high: 52000, low: 51800, close: 51980, volume: 45000 },
      { time: '11:00', open: 51980, high: 52150, low: 51920, close: 52100, volume: 55000 },
      { time: '13:00', open: 52100, high: 52300, low: 52040, close: 52250, volume: 68000 },
      { time: '15:15', open: 52250, high: 52500, low: 52180, close: 52340.8, volume: 95000 },
    ],
    isFavorite: true,
  },
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries (NSE)',
    category: 'Indian Stocks / F&O' as const,
    price: 3012.50,
    change24h: 1.45,
    change24hAmount: 43.10,
    high24h: 3030.00,
    low24h: 2975.00,
    volume24h: '₹2,480 Cr',
    sparkline: [2975, 2988, 2995, 3005, 3012.5],
    candles: [
      { time: '09:15', open: 2980, high: 2995, low: 2975, close: 2990, volume: 15000 },
      { time: '11:00', open: 2990, high: 3010, low: 2985, close: 3002, volume: 18000 },
      { time: '13:00', open: 3002, high: 3020, low: 2998, close: 3015, volume: 22000 },
      { time: '15:15', open: 3015, high: 3030, low: 3005, close: 3012.5, volume: 32000 },
    ],
    isFavorite: false,
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd (NSE)',
    category: 'Indian Stocks / F&O' as const,
    price: 1684.20,
    change24h: 0.92,
    change24hAmount: 15.40,
    high24h: 1695.00,
    low24h: 1668.00,
    volume24h: '₹3,150 Cr',
    sparkline: [1670, 1675, 1680, 1678, 1684.2],
    candles: [
      { time: '09:15', open: 1670, high: 1680, low: 1668, close: 1675, volume: 12000 },
      { time: '11:00', open: 1675, high: 1685, low: 1672, close: 1681, volume: 14000 },
      { time: '13:00', open: 1681, high: 1692, low: 1678, close: 1688, volume: 19000 },
      { time: '15:15', open: 1688, high: 1695, low: 1680, close: 1684.2, volume: 28000 },
    ],
    isFavorite: false,
  },
  {
    symbol: 'FINNIFTY',
    name: 'Fin Nifty Index (NSE)',
    category: 'Indian Stocks / F&O' as const,
    price: 23620.50,
    change24h: 0.95,
    change24hAmount: 222.10,
    high24h: 23750.00,
    low24h: 23480.00,
    volume24h: '₹18,200 Cr',
    sparkline: [23480, 23540, 23500, 23590, 23620.5],
    candles: [
      { time: '09:15', open: 23500, high: 23560, low: 23480, close: 23530, volume: 35000 },
      { time: '11:00', open: 23530, high: 23600, low: 23510, close: 23580, volume: 42000 },
      { time: '13:00', open: 23580, high: 23680, low: 23560, close: 23610, volume: 51000 },
      { time: '15:15', open: 23610, high: 23750, low: 23590, close: 23620.5, volume: 72000 },
    ],
    isFavorite: true,
  },
  {
    symbol: 'SENSEX',
    name: 'BSE Sensex Index',
    category: 'Indian Stocks / F&O' as const,
    price: 81450.60,
    change24h: 0.78,
    change24hAmount: 630.20,
    high24h: 81680.00,
    low24h: 80920.00,
    volume24h: '₹8,450 Cr',
    sparkline: [80920, 81100, 81050, 81320, 81450.6],
    candles: [
      { time: '09:15', open: 80950, high: 81180, low: 80920, close: 81100, volume: 22000 },
      { time: '11:00', open: 81100, high: 81280, low: 81020, close: 81220, volume: 28000 },
      { time: '13:00', open: 81220, high: 81450, low: 81180, close: 81380, volume: 34000 },
      { time: '15:15', open: 81380, high: 81680, low: 81300, close: 81450.6, volume: 46000 },
    ],
    isFavorite: true,
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Ltd (NSE)',
    category: 'Indian Stocks / F&O' as const,
    price: 1248.50,
    change24h: 1.25,
    change24hAmount: 15.40,
    high24h: 1258.00,
    low24h: 1230.00,
    volume24h: '₹2,180 Cr',
    sparkline: [1230, 1236, 1242, 1240, 1248.5],
    candles: [
      { time: '09:15', open: 1232, high: 1240, low: 1230, close: 1238, volume: 18000 },
      { time: '11:00', open: 1238, high: 1246, low: 1234, close: 1242, volume: 24000 },
      { time: '13:00', open: 1242, high: 1252, low: 1239, close: 1246, volume: 31000 },
      { time: '15:15', open: 1246, high: 1258, low: 1244, close: 1248.5, volume: 42000 },
    ],
    isFavorite: false,
  },
  {
    symbol: 'INFY',
    name: 'Infosys Ltd (NSE)',
    category: 'Indian Stocks / F&O' as const,
    price: 1875.20,
    change24h: 1.65,
    change24hAmount: 30.40,
    high24h: 1890.00,
    low24h: 1840.00,
    volume24h: '₹1,940 Cr',
    sparkline: [1840, 1852, 1860, 1868, 1875.2],
    candles: [
      { time: '09:15', open: 1845, high: 1860, low: 1840, close: 1855, volume: 16000 },
      { time: '11:00', open: 1855, high: 1872, low: 1850, close: 1865, volume: 21000 },
      { time: '13:00', open: 1865, high: 1882, low: 1860, close: 1872, volume: 29000 },
      { time: '15:15', open: 1872, high: 1890, low: 1868, close: 1875.2, volume: 38000 },
    ],
    isFavorite: false,
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services (NSE)',
    category: 'Indian Stocks / F&O' as const,
    price: 4320.00,
    change24h: 0.85,
    change24hAmount: 36.40,
    high24h: 4345.00,
    low24h: 4280.00,
    volume24h: '₹1,620 Cr',
    sparkline: [4280, 4295, 4305, 4312, 4320],
    candles: [
      { time: '09:15', open: 4285, high: 4305, low: 4280, close: 4298, volume: 11000 },
      { time: '11:00', open: 4298, high: 4320, low: 4292, close: 4310, volume: 15000 },
      { time: '13:00', open: 4310, high: 4335, low: 4305, close: 4318, volume: 21000 },
      { time: '15:15', open: 4318, high: 4345, low: 4310, close: 4320, volume: 28000 },
    ],
    isFavorite: false,
  },
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Ltd (NSE)',
    category: 'Indian Stocks / F&O' as const,
    price: 1045.30,
    change24h: 2.15,
    change24hAmount: 22.00,
    high24h: 1060.00,
    low24h: 1020.00,
    volume24h: '₹2,680 Cr',
    sparkline: [1020, 1028, 1035, 1040, 1045.3],
    candles: [
      { time: '09:15', open: 1022, high: 1035, low: 1020, close: 1030, volume: 24000 },
      { time: '11:00', open: 1030, high: 1045, low: 1028, close: 1038, volume: 31000 },
      { time: '13:00', open: 1038, high: 1052, low: 1034, close: 1042, volume: 39000 },
      { time: '15:15', open: 1042, high: 1060, low: 1038, close: 1045.3, volume: 55000 },
    ],
    isFavorite: false,
  },
  {
    symbol: 'SBIN',
    name: 'State Bank of India (NSE)',
    category: 'Indian Stocks / F&O' as const,
    price: 842.10,
    change24h: 1.45,
    change24hAmount: 12.00,
    high24h: 850.00,
    low24h: 828.00,
    volume24h: '₹2,420 Cr',
    sparkline: [828, 832, 838, 836, 842.1],
    candles: [
      { time: '09:15', open: 830, high: 838, low: 828, close: 835, volume: 29000 },
      { time: '11:00', open: 835, high: 844, low: 832, close: 839, volume: 36000 },
      { time: '13:00', open: 839, high: 848, low: 836, close: 841, volume: 44000 },
      { time: '15:15', open: 841, high: 850, low: 838, close: 842.1, volume: 61000 },
    ],
    isFavorite: false,
  },

  // 2. Crypto (24x7)
  {
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    category: 'Crypto' as const,
    price: 68420.50,
    change24h: 3.42,
    change24hAmount: 2265.10,
    high24h: 69150.00,
    low24h: 65890.00,
    volume24h: '$34.8B',
    marketCap: '$1.35T',
    sparkline: [65900, 66300, 65800, 66900, 67400, 67100, 68420],
    candles: [
      { time: '12:00', open: 66500, high: 67200, low: 66300, close: 67100, volume: 4200 },
      { time: '13:00', open: 67100, high: 67800, low: 66900, close: 67600, volume: 5100 },
      { time: '14:00', open: 67600, high: 68100, low: 67400, close: 67900, volume: 6300 },
      { time: '15:00', open: 67900, high: 68600, low: 67700, close: 68420.5, volume: 8200 }
    ],
    isFavorite: true,
  },
  {
    symbol: 'ETH/USDT',
    name: 'Ethereum',
    category: 'Crypto' as const,
    price: 3540.20,
    change24h: 2.18,
    change24hAmount: 75.50,
    high24h: 3590.00,
    low24h: 3420.00,
    volume24h: '$16.2B',
    marketCap: '$425B',
    sparkline: [3420, 3450, 3410, 3490, 3510, 3495, 3540],
    candles: [
      { time: '12:00', open: 3450, high: 3490, low: 3430, close: 3480, volume: 2200 },
      { time: '13:00', open: 3480, high: 3520, low: 3470, close: 3510, volume: 3100 },
      { time: '14:00', open: 3510, high: 3550, low: 3490, close: 3530, volume: 4400 },
      { time: '15:00', open: 3530, high: 3560, low: 3515, close: 3540.2, volume: 4900 }
    ],
    isFavorite: true,
  },
  {
    symbol: 'SOL/USDT',
    name: 'Solana',
    category: 'Crypto' as const,
    price: 178.65,
    change24h: 6.84,
    change24hAmount: 11.45,
    high24h: 182.50,
    low24h: 164.20,
    volume24h: '$5.4B',
    marketCap: '$82.8B',
    sparkline: [165, 168, 164, 172, 175, 173, 178.65],
    candles: [
      { time: '12:00', open: 168, high: 172, low: 167, close: 171, volume: 1500 },
      { time: '13:00', open: 171, high: 175, low: 170, close: 174, volume: 2100 },
      { time: '14:00', open: 174, high: 177, low: 173, close: 176, volume: 2600 },
      { time: '15:00', open: 176, high: 180, low: 175, close: 178.65, volume: 3200 }
    ],
    isFavorite: false,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp',
    category: 'Stocks' as const,
    price: 132.80,
    change24h: 4.15,
    change24hAmount: 5.30,
    high24h: 134.10,
    low24h: 126.90,
    volume24h: '$12.1B',
    marketCap: '$3.26T',
    sparkline: [127, 128, 129.5, 131, 130.2, 132.8],
    candles: [
      { time: '12:00', open: 128.5, high: 130.2, low: 128.0, close: 129.8, volume: 8000 },
      { time: '13:00', open: 129.8, high: 131.5, low: 129.4, close: 131.0, volume: 9200 },
      { time: '14:00', open: 131.0, high: 132.4, low: 130.5, close: 131.9, volume: 10400 },
      { time: '15:00', open: 131.9, high: 133.5, low: 131.4, close: 132.8, volume: 12500 }
    ],
    isFavorite: false,
  },
  {
    symbol: 'SPY',
    name: 'S&P 500 ETF Trust',
    category: 'Stocks' as const,
    price: 548.90,
    change24h: 0.82,
    change24hAmount: 4.46,
    high24h: 550.20,
    low24h: 543.10,
    volume24h: '$28.4B',
    marketCap: '$530B',
    sparkline: [544, 545, 544.5, 546.8, 547.2, 548.9],
    candles: [
      { time: '12:00', open: 545.2, high: 547.0, low: 544.8, close: 546.5, volume: 15000 },
      { time: '13:00', open: 546.5, high: 547.8, low: 546.0, close: 547.2, volume: 18000 },
      { time: '14:00', open: 547.2, high: 548.5, low: 546.8, close: 548.1, volume: 21000 },
      { time: '15:00', open: 548.1, high: 549.4, low: 547.8, close: 548.9, volume: 24000 }
    ],
    isFavorite: false,
  },

  // 3. Forex (MT4/MT5) & Commodities
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    category: 'Forex' as const,
    price: 1.0874,
    change24h: -0.22,
    change24hAmount: -0.0024,
    high24h: 1.0910,
    low24h: 1.0850,
    volume24h: '$120B',
    sparkline: [1.0898, 1.0905, 1.0880, 1.0870, 1.0882, 1.0874],
    candles: [
      { time: '12:00', open: 1.0895, high: 1.0902, low: 1.0888, close: 1.0890, volume: 12000 },
      { time: '13:00', open: 1.0890, high: 1.0898, low: 1.0880, close: 1.0882, volume: 14000 },
      { time: '14:00', open: 1.0882, high: 1.0888, low: 1.0872, close: 1.0878, volume: 16000 },
      { time: '15:00', open: 1.0878, high: 1.0884, low: 1.0870, close: 1.0874, volume: 19000 }
    ],
    isFavorite: true,
  },
  {
    symbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    category: 'Forex' as const,
    price: 1.2965,
    change24h: 0.35,
    change24hAmount: 0.0045,
    high24h: 1.3010,
    low24h: 1.2915,
    volume24h: '$84B',
    sparkline: [1.292, 1.294, 1.293, 1.295, 1.2965],
    candles: [
      { time: '12:00', open: 1.2930, high: 1.2950, low: 1.2925, close: 1.2942, volume: 9000 },
      { time: '13:00', open: 1.2942, high: 1.2970, low: 1.2938, close: 1.2955, volume: 11000 },
      { time: '14:00', open: 1.2955, high: 1.2980, low: 1.2948, close: 1.2960, volume: 13000 },
      { time: '15:00', open: 1.2960, high: 1.3010, low: 1.2950, close: 1.2965, volume: 16000 },
    ],
    isFavorite: false,
  },
  {
    symbol: 'XAU/USD',
    name: 'Spot Gold / USD (MT4/MT5)',
    category: 'Commodities' as const,
    price: 2514.80,
    change24h: 0.94,
    change24hAmount: 23.40,
    high24h: 2525.00,
    low24h: 2490.00,
    volume24h: '$45B',
    sparkline: [2492, 2501, 2498, 2510, 2514.8],
    candles: [
      { time: '12:00', open: 2495, high: 2505, low: 2492, close: 2502, volume: 14000 },
      { time: '13:00', open: 2502, high: 2512, low: 2499, close: 2508, volume: 17000 },
      { time: '14:00', open: 2508, high: 2518, low: 2504, close: 2512, volume: 21000 },
      { time: '15:00', open: 2512, high: 2525, low: 2508, close: 2514.8, volume: 29000 },
    ],
    isFavorite: true,
  }
];

export function createInitialEconomicEvents(): EconomicEvent[] {
  const now = new Date();
  const currentMs = now.getTime();

  const getEstTimestamp = (dayOffset: number, estHour: number, estMin: number = 0): number => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    const utcHour = (estHour + 4) % 24;
    d.setUTCHours(utcHour, estMin, 0, 0);
    return d.getTime();
  };

  const formatDateLabel = (dayOffset: number, targetDate: Date): string => {
    if (dayOffset === 0) return 'Today';
    if (dayOffset === 1) return 'Tomorrow';
    if (dayOffset === -1) return 'Yesterday';
    return targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getDateIso = (dayOffset: number): string => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    return d.toISOString().slice(0, 10);
  };

  const yestDate = new Date(now);
  yestDate.setDate(yestDate.getDate() - 1);
  const tomDate = new Date(now);
  tomDate.setDate(tomDate.getDate() + 1);

  const cpiTs = getEstTimestamp(0, 8, 30);
  const fomcTs = getEstTimestamp(0, 14, 0);

  const isCpiReleased = currentMs >= cpiTs;
  const isFomcReleased = currentMs >= fomcTs;

  return [
    {
      id: `ec-yest-1-${getDateIso(-1)}`,
      date: formatDateLabel(-1, yestDate),
      dateIso: getDateIso(-1),
      time: '08:15 EST',
      timestamp: getEstTimestamp(-1, 8, 15),
      currency: 'USD',
      title: 'ADP Non-Farm Employment Change',
      impact: 'High' as const,
      actual: '122K',
      forecast: '150K',
      previous: '155K',
      status: 'RELEASED' as const,
      outcome: 'worse' as const,
      category: 'Employment' as const,
      description: 'Private payroll expansion slowed down to 122K, reflecting a gentle cooling in labor demand.',
      assetImpact: 'Dovish for Fed rates; positive for Crypto & Equities.'
    },
    {
      id: `ec-today-1-${getDateIso(0)}`,
      date: formatDateLabel(0, now),
      dateIso: getDateIso(0),
      time: '08:30 EST',
      timestamp: cpiTs,
      currency: 'USD',
      title: 'Core CPI Consumer Price Index (MoM & YoY)',
      impact: 'High' as const,
      actual: isCpiReleased ? '0.2%' : undefined,
      forecast: '0.2%',
      previous: '0.3%',
      status: isCpiReleased ? 'RELEASED' as const : 'UPCOMING' as const,
      outcome: isCpiReleased ? 'inline' as const : undefined,
      category: 'Inflation' as const,
      description: 'Core inflation in line with consensus forecast.',
      assetImpact: isCpiReleased ? 'Confirmed rate cut runway; supported BTC accumulation.' : 'Major volatility catalyst at 08:30 EST.'
    },
    {
      id: `ec-today-2-${getDateIso(0)}`,
      date: formatDateLabel(0, now),
      dateIso: getDateIso(0),
      time: '14:00 EST',
      timestamp: fomcTs,
      currency: 'USD',
      title: 'Federal Reserve FOMC Interest Rate Decision & Statement',
      impact: 'High' as const,
      actual: isFomcReleased ? '5.25% - 5.50%' : undefined,
      forecast: '5.25% - 5.50%',
      previous: '5.50%',
      status: isFomcReleased ? 'RELEASED' as const : 'UPCOMING' as const,
      outcome: isFomcReleased ? 'better' as const : undefined,
      category: 'Central Bank' as const,
      description: 'Federal Open Market Committee interest rate decision.',
      assetImpact: isFomcReleased ? 'Federal Reserve signaled data-dependent easing.' : 'Volatile catalyst. Reduce margin risk.'
    },
    {
      id: `ec-tom-1-${getDateIso(1)}`,
      date: formatDateLabel(1, tomDate),
      dateIso: getDateIso(1),
      time: '08:30 EST',
      timestamp: getEstTimestamp(1, 8, 30),
      currency: 'USD',
      title: 'Initial Jobless Claims (Weekly)',
      impact: 'Medium' as const,
      forecast: '232K',
      previous: '235K',
      status: 'UPCOMING' as const,
      category: 'Employment' as const,
      description: 'Weekly initial jobless claims report.',
      assetImpact: 'Labor market indicator for macroeconomic trajectory.'
    },
    {
      id: `ec-tom-2-${getDateIso(1)}`,
      date: formatDateLabel(1, tomDate),
      dateIso: getDateIso(1),
      time: '09:45 EST',
      timestamp: getEstTimestamp(1, 9, 45),
      currency: 'EUR',
      title: 'European Central Bank (ECB) Refinancing Rate',
      impact: 'High' as const,
      forecast: '3.75%',
      previous: '3.75%',
      status: 'UPCOMING' as const,
      category: 'Central Bank' as const,
      description: 'ECB headline interest rate decision.',
      assetImpact: 'Key driver for EUR/USD and global yield curve.'
    }
  ];
}

export const defaultEconomicEvents: EconomicEvent[] = createInitialEconomicEvents();

export const defaultMarketNews = [
  {
    id: 'news-1',
    title: 'Bitcoin Consolidates Above $68K as Institutional Inflows Surge in Spot ETFs',
    source: 'Bloomberg Crypto',
    timeAgo: '18m ago',
    category: 'Crypto',
    summary: 'Net positive inflows into major spot ETFs continue for the 9th consecutive session, with open interest holding near all-time highs as traders position for quarterly options expiry.',
    sentiment: 'Bullish' as const,
    impactScore: 8
  },
  {
    id: 'news-2',
    title: 'Tech Rally Broadens Beyond Megacap Names Ahead of Key Semiconductor Earnings',
    source: 'Reuters Markets',
    timeAgo: '42m ago',
    category: 'Stocks',
    summary: 'S&P 500 and Nasdaq push higher with semiconductor suppliers and AI data center hardware providers showing strong volume expansion across multiple key technical breakouts.',
    sentiment: 'Bullish' as const,
    impactScore: 7
  },
  {
    id: 'news-3',
    title: 'Federal Reserve Officials Stress Data Dependency as Inflation Cools Toward 2% Target',
    source: 'Wall Street Journal',
    timeAgo: '1h ago',
    category: 'Macro',
    summary: 'Treasury yields soften across the 2-year and 10-year curve as futures market participants price in an 88% probability of an autumn interest rate adjustment.',
    sentiment: 'Neutral' as const,
    impactScore: 9
  }
];

// Convenience Aliases for all views
export const defaultUser = initialUserProfile;
export const defaultTrades = sampleTrades;
export const defaultAcademyLessons = sampleAcademyLessons;
export const defaultPortfolioHoldings = samplePortfolioHoldings;
export const defaultHabits = sampleHabits;
export const defaultGoals = sampleGoals;
export const defaultCommunityPosts = sampleCommunityPosts;

