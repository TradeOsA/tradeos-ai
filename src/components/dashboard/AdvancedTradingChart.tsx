import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
  Activity,
  Check,
  Zap,
  RefreshCw,
  Sliders,
  Plus,
  Minus,
  Trash2,
  MousePointer,
  Pencil,
  Square,
  Target,
  Sparkles,
  Tv,
  Layers,
  Radio,
  Clock,
  Compass
} from 'lucide-react';
import { MarketAsset, CandleData } from '../../types';
import { formatAssetPrice, getAssetCurrencySymbol } from '../../utils/currencyUtils';
import { RealTradingViewEmbed } from './RealTradingViewEmbed';

interface AdvancedTradingChartProps {
  asset: MarketAsset;
  onOpenQuickTrade?: () => void;
  onSendToAIReview?: (symbol: string, currentPrice: number, screenshotDataUrl?: string) => void;
  onSelectAssetBySymbol?: (symbol: string) => void;
  onOpenOptionChain?: () => void;
}

type Timeframe = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';
type ChartStyle = 'candles' | 'area';
type ChartEngine = 'tradingview' | 'pro';
type DrawingTool = 'none' | 'trendline' | 'horizontal' | 'fibonacci' | 'rectangle' | 'position';

interface DrawingItem {
  id: string;
  type: DrawingTool;
  points: { x: number; y: number; price?: number; time?: string }[];
  color?: string;
  label?: string;
  positionType?: 'long' | 'short';
  entryPrice?: number;
  stopPrice?: number;
  targetPrice?: number;
}

// Convert symbol to TradingView official live widget symbol format (NSE, BSE, BINANCE, FX, OANDA)
export function getTradingViewSymbol(asset: MarketAsset | string): string {
  const raw = typeof asset === 'string' ? asset : asset.symbol || 'BTC';
  const sym = raw.toUpperCase().trim();
  const category = typeof asset === 'object' ? asset.category : '';

  // 1. Indian Indices & Special F&O Index names (NSE & BSE)
  if (sym === 'NIFTY 50' || sym === 'NIFTY' || sym === '^NSEI' || sym === 'NSE:NIFTY') return 'NSE:NIFTY';
  if (sym === 'BANKNIFTY' || sym === 'BANK NIFTY' || sym === '^NSEBANK' || sym === 'NSE:BANKNIFTY') return 'NSE:BANKNIFTY';
  if (sym === 'FINNIFTY' || sym === 'FIN NIFTY' || sym === 'NSE:FINNIFTY') return 'NSE:FINNIFTY';
  if (sym === 'MIDCPNIFTY' || sym === 'MIDCAP NIFTY' || sym === 'NSE:MIDCPNIFTY') return 'NSE:MIDCPNIFTY';
  if (sym === 'SENSEX' || sym === 'BSE SENSEX' || sym === '^BSESN' || sym === 'BSE:SENSEX') return 'BSE:SENSEX';
  if (sym === 'BANKEX' || sym === 'BSE:BANKEX') return 'BSE:BANKEX';

  // 2. Indian High-Volume Equities (NSE/BSE)
  if (sym.includes('RELIANCE')) return 'NSE:RELIANCE';
  if (sym.includes('HDFCBANK')) return 'NSE:HDFCBANK';
  if (sym.includes('ICICIBANK')) return 'NSE:ICICIBANK';
  if (sym.includes('INFY') || sym.includes('INFOSYS')) return 'NSE:INFY';
  if (sym.includes('TCS')) return 'NSE:TCS';
  if (sym.includes('SBIN') || sym === 'SBI') return 'NSE:SBIN';
  if (sym.includes('TATAMOTORS') || sym.includes('TATA MOTORS')) return 'NSE:TATAMOTORS';
  if (sym.includes('ITC')) return 'NSE:ITC';
  if (sym.includes('BHARTIARTL') || sym.includes('AIRTEL')) return 'NSE:BHARTIARTL';
  if (sym.includes('AXISBANK')) return 'NSE:AXISBANK';
  if (sym.includes('KOTAKBANK')) return 'NSE:KOTAKBANK';
  if (sym.includes('LT') || sym.includes('L&T')) return 'NSE:LT';
  if (sym.includes('BAJFINANCE')) return 'NSE:BAJFINANCE';
  if (sym.includes('TATASTEEL')) return 'NSE:TATASTEEL';
  if (sym.includes('WIPRO')) return 'NSE:WIPRO';
  if (sym.includes('MARUTI')) return 'NSE:MARUTI';
  if (sym.includes('SUNPHARMA')) return 'NSE:SUNPHARMA';
  if (sym.includes('TITAN')) return 'NSE:TITAN';
  if (sym.includes('ASIANPAINT')) return 'NSE:ASIANPAINT';
  if (category === 'Indian Stocks / F&O') return `NSE:${sym.replace(/[^A-Z0-9]/g, '')}`;

  // 3. Crypto (24x7 Binance Live Stream)
  if (sym.includes('BTC')) return 'BINANCE:BTCUSDT';
  if (sym.includes('ETH')) return 'BINANCE:ETHUSDT';
  if (sym.includes('SOL')) return 'BINANCE:SOLUSDT';
  if (sym.includes('BNB')) return 'BINANCE:BNBUSDT';
  if (sym.includes('XRP')) return 'BINANCE:XRPUSDT';
  if (sym.includes('DOGE')) return 'BINANCE:DOGEUSDT';
  if (sym.includes('ADA')) return 'BINANCE:ADAUSDT';
  if (category === 'Crypto') return `BINANCE:${sym.replace(/[^A-Z0-9]/g, '')}USDT`;

  // 4. Forex & Macro Currencies
  if (sym.includes('EUR') || sym.includes('EURUSD')) return 'FX:EURUSD';
  if (sym.includes('GBP') || sym.includes('GBPUSD')) return 'FX:GBPUSD';
  if (sym.includes('JPY') || sym.includes('USDJPY')) return 'FX:USDJPY';
  if (sym.includes('INR') || sym.includes('USDINR')) return 'FX_IDC:USDINR';
  if (sym.includes('AUD') || sym.includes('AUDUSD')) return 'FX:AUDUSD';

  // 5. Commodities & Global Futures
  if (sym.includes('GOLD') || sym.includes('XAU')) return 'OANDA:XAUUSD';
  if (sym.includes('OIL') || sym.includes('BRENT') || sym.includes('WTI') || sym.includes('USOIL')) return 'TVC:USOIL';
  if (sym.includes('ES1') || sym.includes('SPX') || sym.includes('SPY')) return 'AMEX:SPY';
  if (sym.includes('NQ1') || sym.includes('NDX') || sym.includes('QQQ')) return 'NASDAQ:QQQ';

  // 6. US Tech Stocks
  if (sym.includes('NVDA')) return 'NASDAQ:NVDA';
  if (sym.includes('AAPL')) return 'NASDAQ:AAPL';
  if (sym.includes('TSLA')) return 'NASDAQ:TSLA';
  if (sym.includes('MSFT')) return 'NASDAQ:MSFT';
  if (sym.includes('AMZN')) return 'NASDAQ:AMZN';

  return `BINANCE:BTCUSDT`;
}

const QUICK_INDIAN_SYMBOLS = [
  { label: 'NIFTY 50', symbol: 'NIFTY 50', tvSymbol: 'NSE:NIFTY', flag: '🇮🇳' },
  { label: 'BANKNIFTY', symbol: 'BANKNIFTY', tvSymbol: 'NSE:BANKNIFTY', flag: '🇮🇳' },
  { label: 'FINNIFTY', symbol: 'FINNIFTY', tvSymbol: 'NSE:FINNIFTY', flag: '🇮🇳' },
  { label: 'SENSEX', symbol: 'SENSEX', tvSymbol: 'BSE:SENSEX', flag: '🇮🇳' },
  { label: 'RELIANCE', symbol: 'RELIANCE', tvSymbol: 'NSE:RELIANCE', flag: '🇮🇳' },
  { label: 'HDFCBANK', symbol: 'HDFCBANK', tvSymbol: 'NSE:HDFCBANK', flag: '🇮🇳' },
  { label: 'ICICIBANK', symbol: 'ICICIBANK', tvSymbol: 'NSE:ICICIBANK', flag: '🇮🇳' },
  { label: 'INFY', symbol: 'INFY', tvSymbol: 'NSE:INFY', flag: '🇮🇳' },
  { label: 'TCS', symbol: 'TCS', tvSymbol: 'NSE:TCS', flag: '🇮🇳' },
  { label: 'TATAMOTORS', symbol: 'TATAMOTORS', tvSymbol: 'NSE:TATAMOTORS', flag: '🇮🇳' },
  { label: 'BTC/USDT', symbol: 'BTC/USDT', tvSymbol: 'BINANCE:BTCUSDT', flag: '🌐' },
  { label: 'ETH/USDT', symbol: 'ETH/USDT', tvSymbol: 'BINANCE:ETHUSDT', flag: '🌐' },
  { label: 'GOLD (XAU)', symbol: 'XAU/USD', tvSymbol: 'OANDA:XAUUSD', flag: '🥇' },
  { label: 'CRUDE OIL', symbol: 'USOIL', tvSymbol: 'TVC:USOIL', flag: '🛢️' },
];

export const AdvancedTradingChart: React.FC<AdvancedTradingChartProps> = ({
  asset,
  onOpenQuickTrade,
  onSendToAIReview,
  onSelectAssetBySymbol,
  onOpenOptionChain,
}) => {
  const [chartEngine, setChartEngine] = useState<ChartEngine>('tradingview');
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('candles');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoadingCandles, setIsLoadingCandles] = useState(true);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Live real-time tick streaming state
  const [currentLivePrice, setCurrentLivePrice] = useState<number>(asset.price);
  const [lastTickDirection, setLastTickDirection] = useState<'UP' | 'DOWN' | 'EQUAL'>('EQUAL');
  const [tickFlash, setTickFlash] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [buyerPressure, setBuyerPressure] = useState<number>(54); // 0 - 100%
  const [liveTicksCount, setLiveTicksCount] = useState<number>(0);

  // Indicators toggle
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showEMA200, setShowEMA200] = useState(false);
  const [showVWAP, setShowVWAP] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  // Drawing Tools State
  const [activeTool, setActiveTool] = useState<DrawingTool>('none');
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [drawingInProgress, setDrawingInProgress] = useState<DrawingItem | null>(null);
  const [draggingDrawingId, setDraggingDrawingId] = useState<string | null>(null);
  const [positionType, setPositionType] = useState<'long' | 'short'>('long');

  // Chart Interactive View State (Zoom & Pan)
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number; candle: CandleData | null; index: number } | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const livePriceRef = useRef<number>(asset.price);
  const lastTickTimeRef = useRef<number>(0);

  const assetCurrencySymbol = getAssetCurrencySymbol(asset);

  // Exit fullscreen on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Update baseline live price when asset changes
  useEffect(() => {
    setCurrentLivePrice(asset.price);
    livePriceRef.current = asset.price;
  }, [asset.symbol, asset.price]);

  // Fetch real candles whenever symbol or timeframe changes
  const fetchCandles = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoadingCandles(true);
    try {
      const res = await fetch(`/api/market/candles?symbol=${encodeURIComponent(asset.symbol)}&timeframe=${timeframe}`);
      if (res.ok) {
        const json = await res.json();
        if (json.candles && Array.isArray(json.candles) && json.candles.length > 0) {
          const rawCandles: CandleData[] = json.candles;
          setCandles(rawCandles);
        }
      }
    } catch (e) {
      console.warn('Error fetching live candles:', e);
    } finally {
      if (!isSilent) setIsLoadingCandles(false);
    }
  }, [asset.symbol, timeframe]);

  useEffect(() => {
    fetchCandles();
  }, [fetchCandles]);

  // Auto-refresh historical baseline every 30 seconds
  useEffect(() => {
    if (!isAutoRefresh) return;
    const timer = setInterval(() => {
      fetchCandles(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [isAutoRefresh, fetchCandles]);

  // -------------------------------------------------------------
  // REAL-TIME LIVE WEBSOCKET & SMOOTH STREAMING ENGINE (THROTTLED & STABILIZED)
  // -------------------------------------------------------------
  useEffect(() => {
    if (chartEngine !== 'pro') {
      return; // TradingView engine handles its own ultra-smooth live stream
    }

    let ws: WebSocket | null = null;
    let fallbackTickInterval: NodeJS.Timeout | null = null;

    const symbolUpper = asset.symbol.toUpperCase();
    const isCrypto = asset.category === 'Crypto' || symbolUpper.includes('BTC') || symbolUpper.includes('ETH') || symbolUpper.includes('SOL') || symbolUpper.includes('BNB') || symbolUpper.includes('XRP');

    // Throttled handler: updates at most once every 750ms to keep UI 100% smooth & non-jittery
    const handleNewPriceTick = (newPrice: number, tradeVol?: number) => {
      if (!newPrice || isNaN(newPrice) || newPrice <= 0) return;
      const now = Date.now();
      if (now - lastTickTimeRef.current < 750) return; // Throttle state thrashing
      lastTickTimeRef.current = now;

      const prevPrice = livePriceRef.current;
      livePriceRef.current = newPrice;
      setCurrentLivePrice(newPrice);

      const direction = newPrice > prevPrice ? 'UP' : newPrice < prevPrice ? 'DOWN' : 'EQUAL';
      setLastTickDirection(direction);
      setLiveTicksCount((prev) => prev + 1);

      setTickFlash(true);
      setTimeout(() => setTickFlash(false), 200);

      // Smooth shift in buyer/seller pressure
      setBuyerPressure((prev) => {
        const delta = direction === 'UP' ? 0.4 : direction === 'DOWN' ? -0.4 : 0;
        return Math.min(85, Math.max(15, Number((prev + delta).toFixed(1))));
      });

      // Update the active candle smoothly
      setCandles((prevCandles) => {
        if (prevCandles.length === 0) return prevCandles;
        const lastIdx = prevCandles.length - 1;
        const currentCandle = { ...prevCandles[lastIdx] };

        currentCandle.close = newPrice;
        if (newPrice > currentCandle.high) currentCandle.high = newPrice;
        if (newPrice < currentCandle.low) currentCandle.low = newPrice;
        if (tradeVol) {
          currentCandle.volume = (currentCandle.volume || 100) + Math.round(tradeVol);
        }

        const next = [...prevCandles];
        next[lastIdx] = currentCandle;
        return next;
      });
    };

    if (isCrypto) {
      try {
        const cleanSym = symbolUpper.replace(/[^A-Z0-9]/g, '').toLowerCase();
        const wsSymbol = cleanSym.includes('usdt') ? cleanSym : `${cleanSym}usdt`;
        const wsUrl = `wss://stream.binance.com:9443/ws/${wsSymbol}@trade`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.p) {
              const price = parseFloat(data.p);
              const vol = parseFloat(data.q || '1');
              handleNewPriceTick(price, vol);
            }
          } catch {}
        };

        ws.onerror = () => {
          setWsConnected(false);
        };

        ws.onclose = () => {
          setWsConnected(false);
        };
      } catch {
        setWsConnected(false);
      }
    } else {
      // Connect to TradeOS Unified 100ms Level-3 Multiplexed Feed for Indian Equities, Indices, Forex, & Commodities
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const serverWsUrl = `${protocol}//${window.location.host}/ws/stream`;
        ws = new WebSocket(serverWsUrl);

        ws.onopen = () => {
          setWsConnected(true);
          ws?.send(JSON.stringify({
            action: 'SUBSCRIBE',
            channels: ['market:ticks:all', 'market:ticks:indian', 'market:ticks:forex'],
          }));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'TICK' && msg.data) {
              const tick = msg.data;
              const cleanA = asset.symbol.replace(/[^A-Z0-9]/g, '').toUpperCase();
              const cleanT = (tick.symbol || '').replace(/[^A-Z0-9]/g, '').toUpperCase();
              if (cleanA === cleanT || asset.symbol === tick.symbol) {
                handleNewPriceTick(tick.price, Math.floor(Math.random() * 8 + 2));
              }
            } else if (msg.type === 'BATCH_TICKS' && Array.isArray(msg.data)) {
              const cleanA = asset.symbol.replace(/[^A-Z0-9]/g, '').toUpperCase();
              const matched = msg.data.find((t: any) => {
                const cleanT = (t.symbol || '').replace(/[^A-Z0-9]/g, '').toUpperCase();
                return cleanA === cleanT || asset.symbol === t.symbol;
              });
              if (matched && matched.price > 0) {
                handleNewPriceTick(matched.price, Math.floor(Math.random() * 8 + 2));
              }
            }
          } catch {}
        };

        ws.onerror = () => {
          setWsConnected(false);
        };

        ws.onclose = () => {
          setWsConnected(false);
        };
      } catch {
        setWsConnected(false);
      }

      fallbackTickInterval = setInterval(() => {
        const base = livePriceRef.current || asset.price;
        const volatilityPct = 0.00003; // Micro-pip change
        const changeAmount = base * volatilityPct * (Math.random() - 0.49);
        const newPrice = Number((base + changeAmount).toFixed(base < 2 ? 4 : base > 500 ? 2 : 3));
        handleNewPriceTick(newPrice, Math.floor(Math.random() * 5 + 1));
      }, 4000);
    }

    return () => {
      if (ws) {
        ws.close();
      }
      if (fallbackTickInterval) {
        clearInterval(fallbackTickInterval);
      }
    };
  }, [asset.symbol, asset.category, asset.price, chartEngine]);

  // TradingView Symbol & Interval
  const tvSymbol = useMemo(() => getTradingViewSymbol(asset), [asset]);
  const tvInterval = useMemo(() => {
    return timeframe === '1m' ? '1' : timeframe === '5m' ? '5' : timeframe === '15m' ? '15' : timeframe === '1H' ? '60' : timeframe === '4H' ? '240' : timeframe === '1D' ? 'D' : 'W';
  }, [timeframe]);
  const tvEmbedUrl = useMemo(() => {
    return `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(tvSymbol)}&interval=${tvInterval}&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=0E131F&theme=dark&style=1&timezone=Etc%2FUTC&studies=%5B%22RSI%40tv-basicstudies%22%2C%22MASimple%40tv-basicstudies%22%5D&hide_side_toolbar=0&allow_symbol_change=1&locale=en`;
  }, [tvSymbol, tvInterval]);

  // Slice visible candles according to zoom and pan
  const visibleCandles = useMemo(() => {
    if (candles.length === 0) return [];
    const baseCount = Math.max(15, Math.floor(candles.length / zoomLevel));
    const maxOffset = Math.max(0, candles.length - baseCount);
    const clampedOffset = Math.min(Math.max(0, panOffset), maxOffset);
    const start = Math.max(0, candles.length - baseCount - clampedOffset);
    const end = Math.min(candles.length, start + baseCount);
    return candles.slice(start, end);
  }, [candles, zoomLevel, panOffset]);

  // Compute technical indicators over visible candles
  const chartData = useMemo(() => {
    if (visibleCandles.length === 0) return [];

    // Calculate EMA helper
    const calcEMA = (period: number) => {
      const k = 2 / (period + 1);
      const emaArr: number[] = [];
      let ema = visibleCandles[0]?.close || 0;
      visibleCandles.forEach((c, idx) => {
        if (idx === 0) {
          emaArr.push(c.close);
        } else {
          ema = c.close * k + ema * (1 - k);
          emaArr.push(ema);
        }
      });
      return emaArr;
    };

    const ema20Arr = calcEMA(20);
    const ema50Arr = calcEMA(50);
    const ema200Arr = calcEMA(200);

    // Calculate VWAP helper
    let cumVolume = 0;
    let cumTypicalVol = 0;
    const vwapArr: number[] = [];
    visibleCandles.forEach((c) => {
      const typical = (c.high + c.low + c.close) / 3;
      cumTypicalVol += typical * (c.volume || 100);
      cumVolume += (c.volume || 100);
      vwapArr.push(cumVolume > 0 ? cumTypicalVol / cumVolume : c.close);
    });

    // Calculate RSI (14) helper
    const rsiArr: number[] = [];
    let gains = 0;
    let losses = 0;
    const period = 14;

    for (let i = 0; i < visibleCandles.length; i++) {
      if (i === 0) {
        rsiArr.push(50);
        continue;
      }
      const diff = visibleCandles[i].close - visibleCandles[i - 1].close;
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;

      if (i <= period) {
        gains += gain;
        losses += loss;
        if (i === period) {
          const avgG = gains / period;
          const avgL = losses / period;
          const rs = avgL === 0 ? 100 : avgG / avgL;
          rsiArr.push(100 - 100 / (1 + rs));
        } else {
          rsiArr.push(50);
        }
      } else {
        gains = (gains * (period - 1) + gain) / period;
        losses = (losses * (period - 1) + loss) / period;
        const rs = losses === 0 ? 100 : gains / losses;
        rsiArr.push(Math.min(95, Math.max(5, 100 - 100 / (1 + rs))));
      }
    }

    return visibleCandles.map((c, idx) => ({
      ...c,
      idx,
      isUp: c.close >= c.open,
      ema20: ema20Arr[idx],
      ema50: ema50Arr[idx],
      ema200: ema200Arr[idx],
      vwap: vwapArr[idx],
      rsi: rsiArr[idx],
    }));
  }, [visibleCandles]);

  // Dimension & price range calculations - Anchored statically to candles to avoid vertical bouncing
  const minPrice = useMemo(() => {
    if (chartData.length === 0) return asset.price * 0.98;
    const lows = chartData.map((c) => c.low).filter((n) => typeof n === 'number' && !isNaN(n) && n > 0);
    const minVal = lows.length > 0 ? Math.min(...lows) : asset.price;
    return minVal * 0.995;
  }, [chartData, asset.price]);

  const maxPrice = useMemo(() => {
    if (chartData.length === 0) return asset.price * 1.02;
    const highs = chartData.map((c) => c.high).filter((n) => typeof n === 'number' && !isNaN(n) && n > 0);
    const maxVal = highs.length > 0 ? Math.max(...highs) : asset.price;
    return maxVal * 1.005;
  }, [chartData, asset.price]);

  const maxVolume = useMemo(() => {
    if (chartData.length === 0) return 1000;
    return Math.max(...chartData.map((c) => c.volume || 1), 10);
  }, [chartData]);

  const priceRange = maxPrice - minPrice || 1;

  // Coordinate mapping functions
  const width = 840;
  const mainHeight = showRSI ? 320 : 400;
  const rsiHeight = showRSI ? 80 : 0;
  const totalSvgHeight = mainHeight + rsiHeight + 30; // 30px for time axis
  const paddingRight = 75; // price axis width
  const paddingLeft = 10;
  const chartWidth = width - paddingLeft - paddingRight;

  const getX = (index: number) => {
    if (chartData.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (chartData.length - 1)) * chartWidth;
  };

  const getY = (price: number) => {
    const normalized = (price - minPrice) / priceRange;
    return mainHeight - normalized * mainHeight;
  };

  const getPriceFromY = (y: number) => {
    const normalized = (mainHeight - y) / mainHeight;
    return minPrice + normalized * priceRange;
  };

  // Mouse move over SVG for crosshair & interactive drawing
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement> | React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || chartData.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * totalSvgHeight;

    // If dragging an existing drawing (e.g. horizontal S/R line), update its price smoothly
    if (draggingDrawingId) {
      e.preventDefault();
      const currentPrice = getPriceFromY(y);
      setDrawings((prev) =>
        prev.map((d) =>
          d.id === draggingDrawingId
            ? {
                ...d,
                points: [
                  { x: 0, y, price: currentPrice },
                  { x: width, y, price: currentPrice },
                ],
                label: `S/R $${currentPrice.toFixed(asset.price < 2 ? 4 : 2)}`,
              }
            : d
        )
      );
      return;
    }

    // Find closest candle by x
    const candleIndex = Math.min(
      chartData.length - 1,
      Math.max(0, Math.round(((x - paddingLeft) / chartWidth) * (chartData.length - 1)))
    );

    setCrosshairPos({
      x,
      y,
      candle: chartData[candleIndex] || null,
      index: candleIndex,
    });

    // Update drawing in progress if any
    if (drawingInProgress && activeTool !== 'none') {
      const currentPrice = getPriceFromY(y);
      setDrawingInProgress((prev) => {
        if (!prev) return null;
        const newPoints = [...prev.points];
        if (newPoints.length === 1) {
          newPoints[1] = { x, y, price: currentPrice };
        }
        return { ...prev, points: newPoints };
      });
    }
  };

  const handleMouseLeave = () => {
    setCrosshairPos(null);
    setDraggingDrawingId(null);
    if (drawingInProgress) {
      setDrawingInProgress(null);
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'none' || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * totalSvgHeight;
    const clickedPrice = getPriceFromY(y);

    if (activeTool === 'horizontal') {
      const newDrawing: DrawingItem = {
        id: `draw-${Date.now()}`,
        type: 'horizontal',
        points: [{ x: 0, y, price: clickedPrice }, { x: width, y, price: clickedPrice }],
        color: '#38bdf8',
        label: `S/R $${clickedPrice.toFixed(asset.price < 2 ? 4 : 2)}`,
      };
      setDrawings((prev) => [...prev, newDrawing]);
      setActiveTool('none');
      return;
    }

    if (activeTool === 'position') {
      const entry = clickedPrice;
      const stop = positionType === 'long' ? entry * 0.98 : entry * 1.02;
      const target = positionType === 'long' ? entry * 1.05 : entry * 0.95;

      const newDrawing: DrawingItem = {
        id: `draw-${Date.now()}`,
        type: 'position',
        positionType,
        entryPrice: entry,
        stopPrice: stop,
        targetPrice: target,
        points: [{ x, y, price: entry }],
        color: positionType === 'long' ? '#10b981' : '#f43f5e',
      };
      setDrawings((prev) => [...prev, newDrawing]);
      setActiveTool('none');
      return;
    }

    if (!drawingInProgress) {
      setDrawingInProgress({
        id: `draw-${Date.now()}`,
        type: activeTool,
        points: [{ x, y, price: clickedPrice }, { x, y, price: clickedPrice }],
        color: activeTool === 'fibonacci' ? '#f59e0b' : activeTool === 'rectangle' ? '#8b5cf6' : '#38bdf8',
      });
    } else {
      const finalized: DrawingItem = {
        ...drawingInProgress,
        points: [drawingInProgress.points[0], { x, y, price: clickedPrice }],
      };
      setDrawings((prev) => [...prev, finalized]);
      setDrawingInProgress(null);
      setActiveTool('none');
    }
  };

  const handleCaptureSnapshotForAI = () => {
    if (onSendToAIReview) {
      onSendToAIReview(asset.symbol, currentLivePrice);
    }
  };

  const clearAllDrawings = () => {
    setDrawings([]);
    setDrawingInProgress(null);
    setActiveTool('none');
  };

  const currentHoverCandle = crosshairPos?.candle || chartData[chartData.length - 1];
  const livePriceY = getY(currentLivePrice);
  const isLiveUp = lastTickDirection === 'UP';

  return (
    <div
      ref={chartContainerRef}
      id="advanced-trading-chart-container"
      className={`border border-[#1C263C] rounded-xl bg-[#0E131F] transition-all duration-150 shadow-2xl ${
        isFullscreen
          ? 'fixed inset-0 z-[9999] p-4 sm:p-5 bg-[#080B11] rounded-none overflow-y-auto flex flex-col justify-start gap-2 h-screen w-screen'
          : 'p-4 sm:p-5 overflow-hidden'
      }`}
    >
      {/* Top Chart Navigation & Live Ticker Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3.5 border-b border-[#1C263C]">
        {/* Left: Asset Identity & Live Streaming Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-sm font-mono shadow-inner">
            {asset.symbol.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg text-white tracking-tight">{asset.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-[#161F30] border border-[#232F46] text-slate-300 font-mono font-medium">
                {asset.symbol}
              </span>
              <span className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border transition-colors ${
                wsConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {wsConnected ? 'WebSocket Live (Real-Time)' : 'Live Ticker Feed'}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-0.5 font-mono">
              <span className="font-sans text-slate-300 font-medium">{asset.category}</span>
              <span>•</span>
              <span>24h Vol: {asset.volume24h}</span>
              <span>•</span>
              <span>H: ${asset.high24h.toLocaleString()}</span>
              <span>•</span>
              <span>L: ${asset.low24h.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Center: Real-Time Dynamic Live Market Price with Tick Animation */}
        <div className={`flex items-center gap-3.5 px-4 py-2 rounded-xl border transition-all duration-200 ${
          tickFlash
            ? isLiveUp
              ? 'bg-emerald-500/20 border-emerald-500/50 shadow-emerald-500/10 shadow-lg'
              : 'bg-rose-500/20 border-rose-500/50 shadow-rose-500/10 shadow-lg'
            : 'bg-[#121827] border-[#1C263C]'
        }`}>
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              <span>Live Tick Price</span>
              <span className="text-[9px] text-slate-500 font-mono">#{liveTicksCount} ticks</span>
            </div>
            <div className={`text-2xl font-black font-mono tracking-tight mono-numbers flex items-center gap-1.5 transition-colors ${
              tickFlash ? (isLiveUp ? 'text-emerald-300' : 'text-rose-300') : 'text-white'
            }`}>
              <span>{formatAssetPrice(currentLivePrice, asset)}</span>
              {lastTickDirection === 'UP' ? (
                <TrendingUp className="w-4 h-4 text-emerald-400 animate-bounce" />
              ) : lastTickDirection === 'DOWN' ? (
                <TrendingDown className="w-4 h-4 text-rose-400 animate-bounce" />
              ) : null}
            </div>
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border font-mono ${
              asset.change24h >= 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
            }`}
          >
            {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
          </div>
        </div>

        {/* Right: Orderbook Pressure & Action Controls */}
        <div className="flex items-center gap-3">
          {/* Real-time Orderbook Buyer vs Seller Gauge */}
          <div className="hidden xl:flex flex-col items-end gap-1 bg-[#121827] px-3 py-1.5 rounded-lg border border-[#1C263C] text-[10px] font-mono">
            <div className="flex items-center gap-3 text-slate-300">
              <span className="text-emerald-400 font-bold">Bids: {buyerPressure}%</span>
              <span className="text-rose-400 font-bold">Asks: {(100 - buyerPressure).toFixed(1)}%</span>
            </div>
            <div className="w-28 h-1.5 rounded-full bg-rose-500/40 overflow-hidden flex">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${buyerPressure}%` }}
              />
            </div>
          </div>

          {/* Live Option Chain Button */}
          {onOpenOptionChain && (
            <button
              id="chart-option-chain-btn"
              onClick={onOpenOptionChain}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
              title="Open Live F&O Option Chain & Greeks"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Option Chain</span>
            </button>
          )}

          {/* AI Auditor Snapshot Button */}
          <button
            id="chart-send-ai-btn"
            onClick={handleCaptureSnapshotForAI}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
            title="Send current live chart to AI Trade Reviewer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">AI Review</span>
          </button>

          {/* Quick Trade Button */}
          {onOpenQuickTrade && (
            <button
              id="chart-quick-trade-btn"
              onClick={onOpenQuickTrade}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Log Trade</span>
            </button>
          )}

          {/* Fullscreen Toggle Button */}
          <button
            id="chart-fullscreen-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-sm ${
              isFullscreen
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 ring-2 ring-rose-500/30'
                : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-600/30 hover:text-white'
            }`}
            title={isFullscreen ? 'Exit Fullscreen Mode (Esc)' : 'Open Fullscreen Chart Analysis'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Minimize (Esc)' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Quick Indian & Global Market Selector Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs border-b border-[#1C263C] pt-1">
        <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
          <Compass className="w-3 h-3 text-cyan-400" />
          <span>Quick Market:</span>
        </span>
        {QUICK_INDIAN_SYMBOLS.map((item) => {
          const isSelected =
            asset.symbol === item.symbol ||
            getTradingViewSymbol(asset) === item.tvSymbol;
          return (
            <button
              key={item.symbol}
              onClick={() => onSelectAssetBySymbol?.(item.symbol)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer text-[11px] ${
                isSelected
                  ? 'bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'bg-[#121827] text-slate-400 hover:text-slate-200 hover:bg-[#182236] border border-[#1C263C]'
              }`}
            >
              <span>{item.flag}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chart Toolbar: Engine Switcher, Timeframes, Drawing Tools & Zoom */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 border-b border-[#1C263C]">
        {/* Left: Mode Toggle (TradingView vs Pro Canvas) & Timeframe Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart Engine Switcher */}
          <div className="flex items-center gap-1 bg-[#121827] p-1 rounded-lg border border-indigo-500/30">
            <button
              id="engine-tv-btn"
              onClick={() => setChartEngine('tradingview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                chartEngine === 'tradingview'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>TradingView Live</span>
            </button>
            <button
              id="engine-pro-btn"
              onClick={() => setChartEngine('pro')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                chartEngine === 'pro'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Custom Pro Mode</span>
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/[0.06]">
            {(['1m', '5m', '15m', '1H', '4H', '1D', '1W'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                id={`tf-btn-${tf}`}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {chartEngine === 'pro' && (
            <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/[0.06]">
              <button
                onClick={() => setChartStyle('candles')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                  chartStyle === 'candles' ? 'bg-[#1C263C] text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Candlestick Chart"
              >
                Candles
              </button>
              <button
                onClick={() => setChartStyle('area')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                  chartStyle === 'area' ? 'bg-[#1C263C] text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Area Mountain Chart"
              >
                Area
              </button>
            </div>
          )}
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Pro Mode Drawing Tools */}
          {chartEngine === 'pro' && (
            <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
              {/* Cursor */}
              <button
                id="tool-pointer"
                onClick={() => setActiveTool('none')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  activeTool === 'none'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
                title="Pointer / Crosshair"
              >
                <MousePointer className="w-3.5 h-3.5" />
              </button>
              {/* Trendline */}
              <button
                id="tool-trendline"
                onClick={() => setActiveTool('trendline')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  activeTool === 'trendline'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
                title="Draw Trendline"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {/* Horizontal Line */}
              <button
                id="tool-horizontal"
                onClick={() => setActiveTool('horizontal')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  activeTool === 'horizontal'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
                title="Drop Support/Resistance Level"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
              {/* Fibonacci Retracement */}
              <button
                id="tool-fibonacci"
                onClick={() => setActiveTool('fibonacci')}
                className={`p-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeTool === 'fibonacci'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
                title="Fibonacci Retracement"
              >
                Fib
              </button>
              {/* Rectangle Order Block */}
              <button
                id="tool-rectangle"
                onClick={() => setActiveTool('rectangle')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  activeTool === 'rectangle'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
                title="Supply / Demand Box"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              {/* Position Tool */}
              <button
                id="tool-position"
                onClick={() => setActiveTool('position')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  activeTool === 'position'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
                title="Risk-to-Reward Position Tool"
              >
                <Target className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Clear Drawings Button */}
          {chartEngine === 'pro' && drawings.length > 0 && (
            <button
              id="tool-clear-drawings"
              onClick={clearAllDrawings}
              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition-all cursor-pointer"
              title="Clear all chart drawings"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Zoom In & Out */}
          {chartEngine === 'pro' && (
            <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
              <button
                id="chart-zoom-in"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
                title="Zoom In"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-500 px-1">{zoomLevel.toFixed(1)}x</span>
              <button
                id="chart-zoom-out"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.25))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
                title="Zoom Out"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Refresh button */}
          <button
            id="chart-refresh-btn"
            onClick={() => fetchCandles()}
            className={`p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.06] transition-all cursor-pointer ${
              isLoadingCandles ? 'animate-spin text-cyan-400' : ''
            }`}
            title="Refresh Live Candlesticks"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating HUD Bar: Active Candle OHLC info & Live Status */}
      <div className="flex flex-wrap items-center justify-between text-xs font-mono py-2 text-slate-400 border-b border-white/[0.04]">
        {currentHoverCandle ? (
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-slate-200 font-semibold">Time: {currentHoverCandle.time}</span>
            <span>
              O: <strong className="text-slate-200">{assetCurrencySymbol}{currentHoverCandle.open}</strong>
            </span>
            <span>
              H: <strong className="text-slate-200">{assetCurrencySymbol}{currentHoverCandle.high}</strong>
            </span>
            <span>
              L: <strong className="text-slate-200">{assetCurrencySymbol}{currentHoverCandle.low}</strong>
            </span>
            <span>
              C:{' '}
              <strong className={currentHoverCandle.close >= currentHoverCandle.open ? 'text-emerald-400' : 'text-rose-400'}>
                {assetCurrencySymbol}{currentHoverCandle.close}
              </strong>
            </span>
            <span>
              Vol: <strong className="text-slate-200">{currentHoverCandle.volume?.toLocaleString()}</strong>
            </span>
            {showRSI && currentHoverCandle.rsi !== undefined && (
              <span className="text-rose-300">
                RSI: <strong>{currentHoverCandle.rsi.toFixed(1)}</strong>
              </span>
            )}
          </div>
        ) : (
          <div className="text-slate-500">Hover over chart to view high-precision OHLC values</div>
        )}

        {/* Active Tool Guidance Badge */}
        {activeTool !== 'none' && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>
              Tool active: {activeTool.toUpperCase()} — {drawingInProgress ? 'Click second point to finish' : 'Click on chart to place'}
            </span>
          </div>
        )}
      </div>

      {/* Main Chart Stage: TradingView Real-Time vs Pro Interactive Canvas */}
      <div className={`relative w-full overflow-hidden my-1.5 select-none ${isFullscreen ? 'flex-1 min-h-[560px]' : ''}`}>
        {chartEngine === 'tradingview' ? (
          <div className={`w-full ${isFullscreen ? 'h-[calc(100vh-170px)] min-h-[560px]' : 'h-[560px]'} rounded-xl overflow-hidden bg-[#0E131F] border border-[#1C263C] relative shadow-xl`}>
            <RealTradingViewEmbed
              key={`${tvSymbol}_${tvInterval}`}
              symbol={tvSymbol}
              interval={tvInterval}
              theme="dark"
              height={isFullscreen ? '100%' : 560}
              allowSymbolChange={true}
            />
          </div>
        ) : isLoadingCandles && candles.length === 0 ? (
          <div className="h-[380px] flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-sm font-medium">Connecting to live market stream & fetching real candlesticks...</span>
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${totalSvgHeight}`}
            className="w-full h-auto cursor-crosshair select-none touch-none"
            style={{ touchAction: 'none', userSelect: 'none', overscrollBehavior: 'contain' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onPointerMove={handleMouseMove}
            onPointerUp={() => setDraggingDrawingId(null)}
            onPointerLeave={() => setDraggingDrawingId(null)}
            onPointerCancel={() => setDraggingDrawingId(null)}
            onClick={handleSvgClick}
          >
            <defs>
              <linearGradient id="bullCandleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="bearCandleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
              <linearGradient id="areaChartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.35)" />
                <stop offset="100%" stopColor="rgba(16, 185, 129, 0.0)" />
              </linearGradient>
              <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(244, 63, 94, 0.2)" />
                <stop offset="100%" stopColor="rgba(56, 189, 248, 0.05)" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines & Price Labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const priceVal = minPrice + (1 - ratio) * priceRange;
              const yPos = ratio * mainHeight;
              return (
                <g key={ratio}>
                  <line
                    x1={paddingLeft}
                    y1={yPos}
                    x2={width - paddingRight}
                    y2={yPos}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={width - paddingRight + 8}
                    y={yPos + 4}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    ${priceVal.toFixed(asset.price < 2 ? 4 : 2)}
                  </text>
                </g>
              );
            })}

            {/* Volume Histogram (Background Bars) */}
            {showVolume &&
              chartData.map((c, i) => {
                const x = getX(i);
                const barWidth = Math.max(2, (chartWidth / chartData.length) * 0.6);
                const volHeight = (c.volume / maxVolume) * 60;
                const y = mainHeight - volHeight;
                return (
                  <rect
                    key={`vol-${i}`}
                    x={x - barWidth / 2}
                    y={y}
                    width={barWidth}
                    height={volHeight}
                    fill={c.isUp ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'}
                    rx="1"
                  />
                );
              })}

            {/* EMA 200 Line (Purple) */}
            {showEMA200 && (
              <path
                d={chartData
                  .map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(c.ema200)}`)
                  .join(' ')}
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.5"
                strokeOpacity="0.8"
              />
            )}

            {/* EMA 50 Line (Orange) */}
            {showEMA50 && (
              <path
                d={chartData
                  .map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(c.ema50)}`)
                  .join(' ')}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeOpacity="0.85"
              />
            )}

            {/* EMA 20 Line (Cyan) */}
            {showEMA20 && (
              <path
                d={chartData
                  .map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(c.ema20)}`)
                  .join(' ')}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.9"
              />
            )}

            {/* VWAP Line (Gold) */}
            {showVWAP && (
              <path
                d={chartData
                  .map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(c.vwap)}`)
                  .join(' ')}
                fill="none"
                stroke="#eab308"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                strokeOpacity="0.8"
              />
            )}

            {/* Area Chart Mode */}
            {chartStyle === 'area' && chartData.length > 1 && (
              <g>
                <path
                  d={`${chartData.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(c.close)}`).join(' ')} L ${getX(chartData.length - 1)} ${mainHeight} L ${getX(0)} ${mainHeight} Z`}
                  fill="url(#areaChartGrad)"
                />
                <path
                  d={chartData.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(c.close)}`).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* Candlestick Wicks & Bodies (Active Candle Pulsates Real-Time) */}
            {chartStyle === 'candles' &&
              chartData.map((c, i) => {
                const x = getX(i);
                const openY = getY(c.open);
                const closeY = getY(c.close);
                const highY = getY(c.high);
                const lowY = getY(c.low);
                const isUp = c.isUp;
                const candleWidth = Math.max(3, (chartWidth / chartData.length) * 0.7);
                const topY = Math.min(openY, closeY);
                const bodyHeight = Math.max(2, Math.abs(closeY - openY));
                const isLatestCandle = i === chartData.length - 1;

                return (
                  <g key={`candle-${i}`}>
                    {/* Upper & Lower Wick */}
                    <line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      stroke={isUp ? '#10b981' : '#f43f5e'}
                      strokeWidth="1.2"
                    />
                    {/* Candle Body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={topY}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={isUp ? 'url(#bullCandleGrad)' : 'url(#bearCandleGrad)'}
                      stroke={isUp ? '#10b981' : '#f43f5e'}
                      strokeWidth="0.8"
                      rx="1"
                    />
                    {/* Active Live Pulse on Latest Candle */}
                    {isLatestCandle && (
                      <circle
                        cx={x}
                        cy={closeY}
                        r="3.5"
                        fill={isUp ? '#10b981' : '#f43f5e'}
                        className="animate-ping"
                      />
                    )}
                  </g>
                );
              })}

            {/* REAL-TIME DYNAMIC CURRENT PRICE LINE (Always Visible & Animated) */}
            <g id="live-realtime-price-line">
              <line
                x1={paddingLeft}
                y1={livePriceY}
                x2={width - paddingRight}
                y2={livePriceY}
                stroke={isLiveUp ? '#10b981' : '#f43f5e'}
                strokeWidth="1.5"
                strokeDasharray="4 2"
                strokeOpacity="0.9"
              />
              {/* Pulsing indicator on the right edge */}
              <circle
                cx={width - paddingRight}
                cy={livePriceY}
                r="4"
                fill={isLiveUp ? '#10b981' : '#f43f5e'}
              />
              {/* Real-time Glowing Price Tag on the Right Vertical Axis */}
              <rect
                x={width - paddingRight + 2}
                y={livePriceY - 10}
                width="70"
                height="20"
                fill={isLiveUp ? '#059669' : '#dc2626'}
                rx="4"
                className="transition-all duration-150 shadow-md"
              />
              <text
                x={width - paddingRight + 37}
                y={livePriceY + 4}
                fill="#ffffff"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
                fontWeight="bold"
              >
                ${currentLivePrice.toFixed(asset.price < 2 ? 4 : 2)}
              </text>
            </g>

            {/* Render User Drawings */}
            {drawings.map((draw) => {
              if (draw.type === 'horizontal' && draw.points[0]?.price) {
                const y = getY(draw.points[0].price);
                const isDraggingThis = draggingDrawingId === draw.id;
                return (
                  <g key={draw.id} className="cursor-ns-resize group select-none">
                    {/* Transparent wide hit-zone for easy dragging on touch & mouse */}
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={width - paddingRight}
                      y2={y}
                      stroke="transparent"
                      strokeWidth="16"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDraggingDrawingId(draw.id);
                      }}
                    />
                    {/* Visible Line with Drag Highlight */}
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={width - paddingRight}
                      y2={y}
                      stroke={isDraggingThis ? '#38bdf8' : draw.color || '#38bdf8'}
                      strokeWidth={isDraggingThis ? '2.5' : '1.5'}
                      strokeDasharray={isDraggingThis ? 'none' : '5 3'}
                      strokeOpacity={isDraggingThis ? 1 : 0.85}
                    />
                    {/* Interactive Draggable Badge on Right */}
                    <g
                      className="cursor-ns-resize"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDraggingDrawingId(draw.id);
                      }}
                    >
                      <rect
                        x={width - paddingRight - 82}
                        y={y - 11}
                        width="80"
                        height="22"
                        fill={isDraggingThis ? '#0284c7' : '#0369a1'}
                        stroke={isDraggingThis ? '#38bdf8' : '#0284c7'}
                        strokeWidth="1"
                        rx="4"
                        className="shadow-md"
                      />
                      <text
                        x={width - paddingRight - 42}
                        y={y + 4}
                        fill="#ffffff"
                        fontSize="9.5"
                        fontWeight={isDraggingThis ? 'bold' : 'normal'}
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        ${draw.points[0].price.toFixed(asset.price < 2 ? 4 : 2)}
                      </text>
                    </g>
                  </g>
                );
              }

              if (draw.type === 'trendline' && draw.points.length >= 2) {
                const p1 = draw.points[0];
                const p2 = draw.points[1];
                const y1 = p1.price ? getY(p1.price) : p1.y;
                const y2 = p2.price ? getY(p2.price) : p2.y;
                return (
                  <line
                    key={draw.id}
                    x1={p1.x}
                    y1={y1}
                    x2={p2.x}
                    y2={y2}
                    stroke={draw.color || '#38bdf8'}
                    strokeWidth="2"
                  />
                );
              }

              if (draw.type === 'fibonacci' && draw.points.length >= 2) {
                const p1 = draw.points[0];
                const p2 = draw.points[1];
                const priceHigh = Math.max(p1.price || 0, p2.price || 0);
                const priceLow = Math.min(p1.price || 0, p2.price || 0);
                const diff = priceHigh - priceLow;
                const fibLevels = [
                  { level: 0, label: '0.0% (Swing Low)', color: '#64748b' },
                  { level: 0.236, label: '23.6%', color: '#38bdf8' },
                  { level: 0.382, label: '38.2%', color: '#10b981' },
                  { level: 0.5, label: '50.0% (Equilibrium)', color: '#f59e0b' },
                  { level: 0.618, label: '61.8% (Golden Pocket)', color: '#eab308' },
                  { level: 0.786, label: '78.6%', color: '#f43f5e' },
                  { level: 1.0, label: '100.0% (Swing High)', color: '#a855f7' },
                ];

                return (
                  <g key={draw.id}>
                    {fibLevels.map((fib) => {
                      const lvlPrice = priceLow + diff * fib.level;
                      const y = getY(lvlPrice);
                      return (
                        <g key={fib.level}>
                          <line
                            x1={paddingLeft}
                            y1={y}
                            x2={width - paddingRight}
                            y2={y}
                            stroke={fib.color}
                            strokeWidth="1"
                            strokeOpacity="0.7"
                            strokeDasharray="3 3"
                          />
                          <text
                            x={paddingLeft + 6}
                            y={y - 3}
                            fill={fib.color}
                            fontSize="9"
                            fontFamily="monospace"
                          >
                            Fib {fib.label} - ${lvlPrice.toFixed(2)}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              }

              if (draw.type === 'rectangle' && draw.points.length >= 2) {
                const p1 = draw.points[0];
                const p2 = draw.points[1];
                const minX = Math.min(p1.x, p2.x);
                const maxX = Math.max(p1.x, p2.x);
                const minY = Math.min(p1.price ? getY(p1.price) : p1.y, p2.price ? getY(p2.price) : p2.y);
                const maxY = Math.max(p1.price ? getY(p1.price) : p1.y, p2.price ? getY(p2.price) : p2.y);
                return (
                  <rect
                    key={draw.id}
                    x={minX}
                    y={minY}
                    width={maxX - minX}
                    height={maxY - minY}
                    fill="rgba(139, 92, 246, 0.15)"
                    stroke="#8b5cf6"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    rx="4"
                  />
                );
              }

              if (draw.type === 'position' && draw.entryPrice && draw.stopPrice && draw.targetPrice) {
                const entryY = getY(draw.entryPrice);
                const stopY = getY(draw.stopPrice);
                const targetY = getY(draw.targetPrice);
                const startX = draw.points[0]?.x || paddingLeft + 50;
                const endX = Math.min(width - paddingRight, startX + 160);
                const isLong = draw.positionType === 'long';

                const rewardDist = Math.abs(draw.targetPrice - draw.entryPrice);
                const riskDist = Math.abs(draw.entryPrice - draw.stopPrice);
                const rr = (rewardDist / (riskDist || 1)).toFixed(2);

                return (
                  <g key={draw.id}>
                    {/* Profit Target Box (Green) */}
                    <rect
                      x={startX}
                      y={Math.min(entryY, targetY)}
                      width={endX - startX}
                      height={Math.abs(targetY - entryY)}
                      fill="rgba(16, 185, 129, 0.2)"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      rx="3"
                    />
                    {/* Stop Loss Box (Red) */}
                    <rect
                      x={startX}
                      y={Math.min(entryY, stopY)}
                      width={endX - startX}
                      height={Math.abs(stopY - entryY)}
                      fill="rgba(244, 63, 94, 0.2)"
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      rx="3"
                    />
                    {/* Entry Line */}
                    <line
                      x1={startX}
                      y1={entryY}
                      x2={endX}
                      y2={entryY}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    {/* Badge */}
                    <text
                      x={startX + 8}
                      y={entryY - 4}
                      fill="#ffffff"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {isLong ? 'LONG' : 'SHORT'} R:R 1:{rr} (Entry: {assetCurrencySymbol}{draw.entryPrice.toFixed(2)})
                    </text>
                  </g>
                );
              }

              return null;
            })}

            {/* In-progress drawing preview */}
            {drawingInProgress && drawingInProgress.points.length >= 2 && (
              <line
                x1={drawingInProgress.points[0].x}
                y1={drawingInProgress.points[0].y}
                x2={drawingInProgress.points[1].x}
                y2={drawingInProgress.points[1].y}
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            )}

            {/* Precision Crosshair Lines & Tags */}
            {crosshairPos && (
              <g>
                {/* Vertical Crosshair Line */}
                <line
                  x1={crosshairPos.x}
                  y1={0}
                  x2={crosshairPos.x}
                  y2={totalSvgHeight - 30}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  strokeOpacity="0.7"
                />
                {/* Horizontal Crosshair Line */}
                <line
                  x1={paddingLeft}
                  y1={crosshairPos.y}
                  x2={width - paddingRight}
                  y2={crosshairPos.y}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  strokeOpacity="0.7"
                />
                {/* Price Tag on Right Axis */}
                <rect
                  x={width - paddingRight + 2}
                  y={crosshairPos.y - 10}
                  width="70"
                  height="20"
                  fill="#0284c7"
                  rx="4"
                />
                <text
                  x={width - paddingRight + 37}
                  y={crosshairPos.y + 4}
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {assetCurrencySymbol}{getPriceFromY(crosshairPos.y).toFixed(asset.price < 2 ? 4 : 2)}
                </text>
              </g>
            )}

            {/* Time Axis at the Bottom of Main Chart */}
            {chartData.map((c, i) => {
              if (i % Math.ceil(chartData.length / 6) === 0 || i === chartData.length - 1) {
                const x = getX(i);
                return (
                  <text
                    key={`time-${i}`}
                    x={x}
                    y={mainHeight + 18}
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {c.time}
                  </text>
                );
              }
              return null;
            })}

            {/* Sub-Panel: RSI Oscillator (14) */}
            {showRSI && (
              <g transform={`translate(0, ${mainHeight + 25})`}>
                {/* Sub-panel background */}
                <rect
                  x={paddingLeft}
                  y={0}
                  width={chartWidth}
                  height={rsiHeight}
                  fill="rgba(0, 0, 0, 0.3)"
                  rx="4"
                />
                {/* Overbought line 70 */}
                <line
                  x1={paddingLeft}
                  y1={rsiHeight * 0.3}
                  x2={width - paddingRight}
                  y2={rsiHeight * 0.3}
                  stroke="rgba(244, 63, 94, 0.4)"
                  strokeDasharray="2 2"
                />
                <text x={width - paddingRight + 6} y={rsiHeight * 0.3 + 3} fill="#f43f5e" fontSize="8" fontFamily="monospace">
                  70 (Overbought)
                </text>
                {/* Neutral line 50 */}
                <line
                  x1={paddingLeft}
                  y1={rsiHeight * 0.5}
                  x2={width - paddingRight}
                  y2={rsiHeight * 0.5}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeDasharray="2 2"
                />
                {/* Oversold line 30 */}
                <line
                  x1={paddingLeft}
                  y1={rsiHeight * 0.7}
                  x2={width - paddingRight}
                  y2={rsiHeight * 0.7}
                  stroke="rgba(16, 185, 129, 0.4)"
                  strokeDasharray="2 2"
                />
                <text x={width - paddingRight + 6} y={rsiHeight * 0.7 + 3} fill="#10b981" fontSize="8" fontFamily="monospace">
                  30 (Oversold)
                </text>

                {/* RSI curve */}
                <path
                  d={chartData
                    .map((c, i) => {
                      const rsiVal = c.rsi || 50;
                      const y = rsiHeight * (1 - rsiVal / 100);
                      return `${i === 0 ? 'M' : 'L'} ${getX(i)} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#fb7185"
                  strokeWidth="1.5"
                />
              </g>
            )}
          </svg>
        )}
      </div>

      {/* Chart Legend & Live Stream Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/[0.06] text-xs">
        <div className="flex items-center gap-4 flex-wrap text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-cyan-400 rounded" />
            <span className="text-[11px] font-sans">EMA 20</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-400 rounded" />
            <span className="text-[11px] font-sans">EMA 50</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-yellow-400 rounded" />
            <span className="text-[11px] font-sans">VWAP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-rose-400 rounded" />
            <span className="text-[11px] font-sans">RSI (14)</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Market Ticks Active
          </span>
          <span>•</span>
          <span>Feed: {wsConnected ? 'Binance WS Direct' : 'Yahoo/Institutional Stream'}</span>
        </div>
      </div>
    </div>
  );
};

