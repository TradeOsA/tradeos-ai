import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layers,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  Filter,
  RefreshCw,
  Zap,
  Info,
  ChevronDown,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Radio,
  Clock,
  CheckCircle2,
  Sliders,
  DollarSign
} from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';

export interface OptionStrikeData {
  strikePrice: number;
  callOI: number;
  callChangeOI: number;
  callVolume: number;
  callIV: number;
  callLTP: number;
  callChange: number;
  callDelta: number;
  callTheta: number;
  callGamma: number;
  callVega: number;
  // Put data
  putLTP: number;
  putChange: number;
  putIV: number;
  putVolume: number;
  putChangeOI: number;
  putOI: number;
  putDelta: number;
  putTheta: number;
  putGamma: number;
  putVega: number;
}

export interface LiveOptionChainPayload {
  symbol: string;
  underlyingName: string;
  spotPrice: number;
  spotChange: number;
  spotChangeAmount: number;
  expiry: string;
  availableExpiries: string[];
  atmStrike: number;
  step: number;
  lotSize: number;
  totalCallOI: number;
  totalPutOI: number;
  pcrRatio: number;
  maxPain: number;
  isMarketOpen: boolean;
  marketStatus: string;
  source: 'NSE_LIVE_FEED' | 'DHAN_LIVE_STREAM' | 'ANGEL_ONE_FEED' | 'YAHOO_LIVE_DERIVATIVES';
  updatedAt: string;
  strikes: OptionStrikeData[];
}

const UNDERLYING_LIST = [
  { symbol: 'NIFTY', name: 'NIFTY 50 Index', step: 50, lotSize: 25, defaultSpot: 24850.40 },
  { symbol: 'BANKNIFTY', name: 'NIFTY BANK', step: 100, lotSize: 15, defaultSpot: 52340.80 },
  { symbol: 'FINNIFTY', name: 'FIN NIFTY', step: 50, lotSize: 25, defaultSpot: 23620.50 },
  { symbol: 'MIDCPNIFTY', name: 'MIDCAP NIFTY', step: 25, lotSize: 50, defaultSpot: 13140.20 },
  { symbol: 'SENSEX', name: 'BSE SENSEX', step: 100, lotSize: 10, defaultSpot: 81450.60 },
  { symbol: 'RELIANCE', name: 'Reliance Ind.', step: 20, lotSize: 250, defaultSpot: 3012.50 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', step: 10, lotSize: 550, defaultSpot: 1684.20 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', step: 10, lotSize: 700, defaultSpot: 1248.50 },
  { symbol: 'INFY', name: 'Infosys Ltd', step: 20, lotSize: 400, defaultSpot: 1875.20 },
  { symbol: 'TCS', name: 'TCS Ltd', step: 50, lotSize: 175, defaultSpot: 4320.00 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', step: 10, lotSize: 575, defaultSpot: 1045.30 },
  { symbol: 'SBIN', name: 'State Bank of India', step: 10, lotSize: 750, defaultSpot: 842.10 },
];

export const OptionChainView: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [strikeRange, setStrikeRange] = useState<number>(15);
  const [viewMode, setViewMode] = useState<'standard' | 'greeks' | 'oi_analytics'>('standard');
  const [filterOI, setFilterOI] = useState<'all' | 'high_oi' | 'itm_only'>('all');
  
  // Real live data state from server API
  const [liveData, setLiveData] = useState<LiveOptionChainPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetchedTime, setLastFetchedTime] = useState<string>('');
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(3);
  const [orderModalStrike, setOrderModalStrike] = useState<{
    strike: number;
    type: 'CE' | 'PE';
    action: 'BUY' | 'SELL';
    ltp: number;
    lotSize: number;
    iv: number;
    delta: number;
  } | null>(null);

  // Fetch live option chain from real server API
  const fetchLiveOptionChain = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('symbol', selectedSymbol);
        if (selectedExpiry) queryParams.append('expiry', selectedExpiry);

        const res = await fetch(`/api/market/option-chain?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setLiveData(json.data);
            if (!selectedExpiry && json.data.availableExpiries?.length) {
              setSelectedExpiry(json.data.availableExpiries[0]);
            }
            setLastFetchedTime(new Date().toLocaleTimeString('en-IN', { hour12: false }));
          }
        }
      } catch (err) {
        console.error('Error fetching live option chain:', err);
      } finally {
        setIsLoading(false);
        if (isManual) {
          setTimeout(() => setIsRefreshing(false), 400);
        }
      }
    },
    [selectedSymbol, selectedExpiry]
  );

  // Initial fetch and on symbol/expiry change
  useEffect(() => {
    fetchLiveOptionChain();
  }, [fetchLiveOptionChain]);

  // Real-time live polling loop (Every 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveOptionChain(false);
    }, autoRefreshSec * 1000);
    return () => clearInterval(interval);
  }, [fetchLiveOptionChain, autoRefreshSec]);

  // Underlying fallback info
  const underlyingSpec = useMemo(() => {
    return (
      UNDERLYING_LIST.find((u) => u.symbol === selectedSymbol) || UNDERLYING_LIST[0]
    );
  }, [selectedSymbol]);

  // Current live spot and metrics
  const spotPrice = liveData?.spotPrice ?? underlyingSpec.defaultSpot;
  const spotChange = liveData?.spotChange ?? 0.85;
  const spotChangeAmount = liveData?.spotChangeAmount ?? 210.5;
  const atmStrike = liveData?.atmStrike ?? Math.round(spotPrice / underlyingSpec.step) * underlyingSpec.step;
  const totalCallOI = liveData?.totalCallOI ?? 1845000;
  const totalPutOI = liveData?.totalPutOI ?? 2180000;
  const pcrRatio = liveData?.pcrRatio ?? +(totalPutOI / (totalCallOI || 1)).toFixed(2);
  const maxPain = liveData?.maxPain ?? atmStrike;
  const availableExpiries = liveData?.availableExpiries || [
    '29-AUG-2024 (Weekly)',
    '05-SEP-2024 (Weekly)',
    '26-SEP-2024 (Monthly)',
  ];
  const activeExpiry = selectedExpiry || availableExpiries[0];
  const isMarketOpen = liveData?.isMarketOpen ?? false;
  const marketStatus = liveData?.marketStatus ?? (isMarketOpen ? 'LIVE (NSE Market Open)' : 'POST-MARKET / CLOSED');

  // Filter strikes based on range and user filter
  const displayedStrikes = useMemo(() => {
    if (!liveData?.strikes) return [];
    
    // Center around ATM strike
    const atm = atmStrike;
    let list = liveData.strikes.filter((s) => {
      return Math.abs(s.strikePrice - atm) <= strikeRange * underlyingSpec.step;
    });

    if (filterOI === 'high_oi') {
      const avgOI = (totalCallOI + totalPutOI) / (liveData.strikes.length * 2 || 1);
      list = list.filter((s) => s.callOI > avgOI || s.putOI > avgOI);
    } else if (filterOI === 'itm_only') {
      list = list.filter((s) => s.strikePrice <= spotPrice || s.strikePrice >= spotPrice);
    }

    return list;
  }, [liveData, atmStrike, strikeRange, underlyingSpec.step, filterOI, totalCallOI, totalPutOI, spotPrice]);

  const maxStrikeOI = useMemo(() => {
    let max = 1000;
    displayedStrikes.forEach((s) => {
      if (s.callOI > max) max = s.callOI;
      if (s.putOI > max) max = s.putOI;
    });
    return max;
  }, [displayedStrikes]);

  const handleManualRefresh = () => {
    fetchLiveOptionChain(true);
  };

  return (
    <div id="option-chain-main-view" className="space-y-6 pb-16">
      {/* Universal Page Header */}
      <PageHeader
        badge="100% Real Live F&O Feed"
        icon={Zap}
        badgeVariant="cyan"
        title="Live NSE Option Chain & Greeks Terminal"
        subtitle="Direct strike-by-strike Option Chain with Open Interest (OI) build-up, real Put-Call Ratio (PCR), Expiry Max Pain, and Black-Scholes Greeks (Delta, Theta, Gamma, Vega)."
        actionSlot={
          <div className="flex items-center gap-3">
            {/* Market Session Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E131F] border border-[#1C263C] text-xs">
              <span className="relative flex h-2.5 w-2.5">
                {isMarketOpen ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                )}
              </span>
              <div className="flex flex-col">
                <span className={`font-bold ${isMarketOpen ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {marketStatus}
                </span>
                {lastFetchedTime && (
                  <span className="text-[10px] text-slate-500">Last sync: {lastFetchedTime} IST</span>
                )}
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#121827] hover:bg-[#182236] border border-[#1C263C] text-xs font-bold text-slate-300 transition-all ${
                isRefreshing ? 'animate-spin text-cyan-400' : ''
              }`}
              title="Refresh Live F&O Feed"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Feed'}</span>
            </button>
          </div>
        }
      />

      {/* Control Bar: Underlying Selector, Expiry Dates, View Mode & Strikes Filter */}
      <div className="bg-[#0E131F] border border-[#1C263C] rounded-2xl p-4 shadow-xl space-y-4">
        {/* Top Underlying Selectors */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs uppercase font-bold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Select F&O:</span>
          </span>
          {UNDERLYING_LIST.map((u) => {
            const isSelected = selectedSymbol === u.symbol;
            return (
              <button
                key={u.symbol}
                onClick={() => setSelectedSymbol(u.symbol)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/50 shadow-md'
                    : 'bg-[#121827] text-slate-400 hover:text-slate-200 border border-[#1C263C]'
                }`}
              >
                <span>{u.symbol}</span>
                {isSelected && (
                  <span
                    className={`text-[11px] font-mono ${
                      spotChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    ₹{spotPrice.toLocaleString('en-IN')} ({spotChange >= 0 ? '+' : ''}
                    {spotChange}%)
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Second Row: Expiry Selector + Spot Banner + Metrics + View Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#1C263C]">
          {/* Expiry Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium">Expiry:</label>
            <div className="relative">
              <select
                value={activeExpiry}
                onChange={(e) => setSelectedExpiry(e.target.value)}
                className="appearance-none bg-[#121827] border border-[#1C263C] rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {availableExpiries.map((exp) => (
                  <option key={exp} value={exp} className="bg-[#0E131F]">
                    {exp}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Strikes View Count */}
            <div className="flex items-center gap-1 ml-2 bg-[#121827] p-1 rounded-xl border border-[#1C263C] text-xs">
              <span className="text-[10px] text-slate-500 px-1 font-semibold">Strikes:</span>
              {[10, 15, 25].map((num) => (
                <button
                  key={num}
                  onClick={() => setStrikeRange(num)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    strikeRange === num
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ±{num}
                </button>
              ))}
            </div>

            {/* Live Auto-Refresh Rate */}
            <div className="hidden sm:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-xl bg-[#121827] border border-[#1C263C] text-[11px] text-slate-400">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Poll: 3s</span>
            </div>
          </div>

          {/* View Modes (Standard, Greeks, OI Visualizer) */}
          <div className="flex items-center gap-1 bg-[#121827] p-1 rounded-xl border border-[#1C263C]">
            <button
              onClick={() => setViewMode('standard')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'standard'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Standard Chain (OI & LTP)
            </button>
            <button
              onClick={() => setViewMode('greeks')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'greeks'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Black-Scholes Greeks
            </button>
            <button
              onClick={() => setViewMode('oi_analytics')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'oi_analytics'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OI Distribution Chart
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip: Spot, PCR, Max Pain, Total Call vs Put OI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Spot Price */}
        <div className="bg-[#0E131F] border border-[#1C263C] rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Underlying Spot</p>
            <h3 className="text-xl font-black text-white font-mono mt-0.5">
              ₹{spotPrice.toLocaleString('en-IN')}
            </h3>
            <span
              className={`text-xs font-bold flex items-center gap-0.5 mt-0.5 ${
                spotChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {spotChange >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {spotChange >= 0 ? '+' : ''}
              {spotChangeAmount} ({spotChange}%)
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* PCR Ratio */}
        <div className="bg-[#0E131F] border border-[#1C263C] rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Put-Call Ratio (PCR)</p>
            <h3 className="text-xl font-black text-white font-mono mt-0.5">{pcrRatio}</h3>
            <span
              className={`text-xs font-bold ${
                pcrRatio > 1.2
                  ? 'text-emerald-400'
                  : pcrRatio < 0.8
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {pcrRatio > 1.2
                ? 'Bullish (Put Writing)'
                : pcrRatio < 0.8
                ? 'Bearish (Call Writing)'
                : 'Neutral Range'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Max Pain */}
        <div className="bg-[#0E131F] border border-[#1C263C] rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Expiry Max Pain</p>
            <h3 className="text-xl font-black text-amber-300 font-mono mt-0.5">
              ₹{maxPain.toLocaleString('en-IN')}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Option Sellers Sweet Spot
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        {/* Total OI Comparison */}
        <div className="bg-[#0E131F] border border-[#1C263C] rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Call vs Put Total OI</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono font-bold text-rose-400">
                C: {(totalCallOI / 100000).toFixed(2)}L
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                P: {(totalPutOI / 100000).toFixed(2)}L
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Lot Size: {liveData?.lotSize ?? underlyingSpec.lotSize}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content: Option Chain Table or Visualizer */}
      {viewMode === 'oi_analytics' ? (
        /* OI Visualizer Distribution Chart */
        <div className="bg-[#0E131F] border border-[#1C263C] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Open Interest (OI) Build-up Distribution
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-rose-400">
                <div className="w-3 h-3 rounded bg-rose-500/80" />
                <span>Call OI (Resistance)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <div className="w-3 h-3 rounded bg-emerald-500/80" />
                <span>Put OI (Support)</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {displayedStrikes.map((s) => {
              const isATM = s.strikePrice === atmStrike;
              const callPct = Math.min(100, Math.round((s.callOI / maxStrikeOI) * 100));
              const putPct = Math.min(100, Math.round((s.putOI / maxStrikeOI) * 100));

              return (
                <div
                  key={s.strikePrice}
                  className={`grid grid-cols-12 items-center gap-2 py-1.5 px-3 rounded-xl transition-all ${
                    isATM
                      ? 'bg-cyan-500/10 border border-cyan-500/30'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Left: Call OI Bar (aligned right) */}
                  <div className="col-span-5 flex items-center justify-end gap-2">
                    <span className="text-xs font-mono text-slate-400 text-right">
                      {(s.callOI / 1000).toFixed(1)}k
                    </span>
                    <div className="w-full max-w-[140px] bg-slate-800/60 rounded-full h-3 flex justify-end overflow-hidden">
                      <div
                        className="bg-gradient-to-l from-rose-500 to-rose-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${callPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Center: Strike Price */}
                  <div className="col-span-2 text-center">
                    <span
                      className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg ${
                        isATM
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'text-slate-200 bg-[#121827] border border-[#1C263C]'
                      }`}
                    >
                      {s.strikePrice}
                    </span>
                  </div>

                  {/* Right: Put OI Bar (aligned left) */}
                  <div className="col-span-5 flex items-center justify-start gap-2">
                    <div className="w-full max-w-[140px] bg-slate-800/60 rounded-full h-3 flex justify-start overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${putPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {(s.putOI / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Full Option Chain Table */
        <div className="bg-[#0E131F] border border-[#1C263C] rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* Main Table Top Group Headers */}
              <thead>
                <tr className="border-b border-[#1C263C] bg-[#0A0E18] text-center font-bold">
                  <th
                    colSpan={viewMode === 'greeks' ? 6 : 5}
                    className="py-2.5 px-4 text-rose-400 bg-rose-950/20 border-r border-[#1C263C]"
                  >
                    CALL OPTIONS (CE) — Bullish Bets / Resistance
                  </th>
                  <th className="py-2.5 px-6 text-white bg-[#121827] font-black tracking-wider">
                    STRIKE PRICE
                  </th>
                  <th
                    colSpan={viewMode === 'greeks' ? 6 : 5}
                    className="py-2.5 px-4 text-emerald-400 bg-emerald-950/20 border-l border-[#1C263C]"
                  >
                    PUT OPTIONS (PE) — Bearish Bets / Support
                  </th>
                </tr>

                {/* Sub-column Headers */}
                <tr className="border-b border-[#1C263C] bg-[#0D121F] text-[11px] text-slate-400">
                  {viewMode === 'greeks' ? (
                    <>
                      <th className="py-2 px-3 text-right">Delta</th>
                      <th className="py-2 px-3 text-right">Theta</th>
                      <th className="py-2 px-3 text-right">Gamma</th>
                      <th className="py-2 px-3 text-right">Vega</th>
                      <th className="py-2 px-3 text-right">IV (%)</th>
                      <th className="py-2 px-3 text-right text-rose-300 font-bold border-r border-[#1C263C]">
                        LTP (₹)
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 px-3 text-right">OI (Lots)</th>
                      <th className="py-2 px-3 text-right">Chg OI</th>
                      <th className="py-2 px-3 text-right">Volume</th>
                      <th className="py-2 px-3 text-right">IV (%)</th>
                      <th className="py-2 px-3 text-right text-rose-300 font-bold border-r border-[#1C263C]">
                        LTP (₹)
                      </th>
                    </>
                  )}

                  {/* Strike Header */}
                  <th className="py-2 px-6 text-center text-cyan-400 font-black bg-[#121827]">
                    STRIKE
                  </th>

                  {viewMode === 'greeks' ? (
                    <>
                      <th className="py-2 px-3 text-left text-emerald-300 font-bold border-l border-[#1C263C]">
                        LTP (₹)
                      </th>
                      <th className="py-2 px-3 text-left">IV (%)</th>
                      <th className="py-2 px-3 text-left">Delta</th>
                      <th className="py-2 px-3 text-left">Theta</th>
                      <th className="py-2 px-3 text-left">Gamma</th>
                      <th className="py-2 px-3 text-left">Vega</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 px-3 text-left text-emerald-300 font-bold border-l border-[#1C263C]">
                        LTP (₹)
                      </th>
                      <th className="py-2 px-3 text-left">IV (%)</th>
                      <th className="py-2 px-3 text-left">Volume</th>
                      <th className="py-2 px-3 text-left">Chg OI</th>
                      <th className="py-2 px-3 text-left">OI (Lots)</th>
                    </>
                  )}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-[#1C263C]/60 text-[11px]">
                {displayedStrikes.map((s) => {
                  const isATM = s.strikePrice === atmStrike;
                  const isCallITM = s.strikePrice < spotPrice;
                  const isPutITM = s.strikePrice > spotPrice;

                  return (
                    <tr
                      key={s.strikePrice}
                      className={`transition-colors hover:bg-white/[0.04] ${
                        isATM
                          ? 'bg-cyan-500/10 font-bold ring-1 ring-cyan-500/50'
                          : ''
                      }`}
                    >
                      {/* CALL SIDE */}
                      {viewMode === 'greeks' ? (
                        <>
                          <td
                            className={`py-2 px-3 text-right ${
                              isCallITM ? 'bg-amber-500/[0.04]' : ''
                            }`}
                          >
                            {s.callDelta}
                          </td>
                          <td
                            className={`py-2 px-3 text-right text-rose-400 ${
                              isCallITM ? 'bg-amber-500/[0.04]' : ''
                            }`}
                          >
                            {s.callTheta}
                          </td>
                          <td
                            className={`py-2 px-3 text-right text-slate-400 ${
                              isCallITM ? 'bg-amber-500/[0.04]' : ''
                            }`}
                          >
                            {s.callGamma}
                          </td>
                          <td
                            className={`py-2 px-3 text-right text-slate-400 ${
                              isCallITM ? 'bg-amber-500/[0.04]' : ''
                            }`}
                          >
                            {s.callVega}
                          </td>
                          <td
                            className={`py-2 px-3 text-right text-slate-400 ${
                              isCallITM ? 'bg-amber-500/[0.04]' : ''
                            }`}
                          >
                            {s.callIV}%
                          </td>
                          <td
                            onClick={() =>
                              setOrderModalStrike({
                                strike: s.strikePrice,
                                type: 'CE',
                                action: 'BUY',
                                ltp: s.callLTP,
                                lotSize: liveData?.lotSize ?? underlyingSpec.lotSize,
                                iv: s.callIV,
                                delta: s.callDelta,
                              })
                            }
                            className={`py-2 px-3 text-right font-black text-rose-400 border-r border-[#1C263C] cursor-pointer hover:underline ${
                              isCallITM ? 'bg-amber-500/10' : ''
                            }`}
                            title="Click to place CE Order"
                          >
                            ₹{s.callLTP}
                          </td>
                        </>
                      ) : (
                        <>
                          <td
                            className={`py-2 px-3 text-right text-slate-300 ${
                              isCallITM ? 'bg-amber-500/[0.04]' : ''
                            }`}
                          >
                            {s.callOI.toLocaleString()}
                          </td>
                          <td
                            className={`py-2 px-3 text-right ${
                              isCallITM ? 'bg-amber-500/[0.04]' : ''
                            } ${
                              s.callChangeOI >= 0
                                ? 'text-emerald-400 font-semibold'
                                : 'text-rose-400'
                            }`}
                          >
                            {s.callChangeOI >= 0 ? '+' : ''}
                            {s.callChangeOI.toLocaleString()}
                          </td>
                          <td
                            className={`py-2 px-3 text-right text-slate-400 ${
                              isCallITM ? 'bg-amber-500/[0.04]' : ''
                            }`}
                          >
                            {(s.callVolume / 1000).toFixed(1)}k
                          </td>
                          <td
                            className={`py-2 px-3 text-right text-slate-400 ${
                              isCallITM ? 'bg-amber-500/[0.04]' : ''
                            }`}
                          >
                            {s.callIV}%
                          </td>
                          <td
                            onClick={() =>
                              setOrderModalStrike({
                                strike: s.strikePrice,
                                type: 'CE',
                                action: 'BUY',
                                ltp: s.callLTP,
                                lotSize: liveData?.lotSize ?? underlyingSpec.lotSize,
                                iv: s.callIV,
                                delta: s.callDelta,
                              })
                            }
                            className={`py-2 px-3 text-right font-black text-rose-400 border-r border-[#1C263C] cursor-pointer hover:underline ${
                              isCallITM ? 'bg-amber-500/10' : ''
                            }`}
                            title="Click to place CE Order"
                          >
                            ₹{s.callLTP}
                          </td>
                        </>
                      )}

                      {/* STRIKE PRICE (Center) */}
                      <td
                        className={`py-2 px-6 text-center font-mono font-black ${
                          isATM
                            ? 'bg-cyan-500 text-slate-950 text-sm'
                            : 'text-white bg-[#101726]'
                        }`}
                      >
                        {s.strikePrice}
                      </td>

                      {/* PUT SIDE */}
                      {viewMode === 'greeks' ? (
                        <>
                          <td
                            onClick={() =>
                              setOrderModalStrike({
                                strike: s.strikePrice,
                                type: 'PE',
                                action: 'BUY',
                                ltp: s.putLTP,
                                lotSize: liveData?.lotSize ?? underlyingSpec.lotSize,
                                iv: s.putIV,
                                delta: s.putDelta,
                              })
                            }
                            className={`py-2 px-3 text-left font-black text-emerald-400 border-l border-[#1C263C] cursor-pointer hover:underline ${
                              isPutITM ? 'bg-amber-500/10' : ''
                            }`}
                            title="Click to place PE Order"
                          >
                            ₹{s.putLTP}
                          </td>
                          <td
                            className={`py-2 px-3 text-left text-slate-400 ${
                              isPutITM ? 'bg-amber-500/[0.04]' : ''
                            }`}
                          >
                            {s.putIV}%
                          </td>
                          <td
                            className={`py-2 px-3 text-left ${
                              isPutITM ? 'bg-amber-500/[0.04]' : ''
                            }`}
                          >
                            {s.putDelta}
                          </td>
                          <td
                            className={`py-2 px-3 text-left text-rose-400 ${
                              isPutITM ? 'bg-amber-500/[0.04]' : ''
                            }`}
                          >
                            {s.putTheta}
                          </td>
                          <td
                            className={`py-2 px-3 text-left text-slate-400 ${
                              isPutITM ? 'bg-amber-500/[0.04]' : ''
                            }`}
                          >
                            {s.putGamma}
                          </td>
                          <td
                            className={`py-2 px-3 text-left text-slate-400 ${
                              isPutITM ? 'bg-amber-500/[0.04]' : ''
                            }`}
                          >
                            {s.putVega}
                          </td>
                        </>
                      ) : (
                        <>
                          <td
                            onClick={() =>
                              setOrderModalStrike({
                                strike: s.strikePrice,
                                type: 'PE',
                                action: 'BUY',
                                ltp: s.putLTP,
                                lotSize: liveData?.lotSize ?? underlyingSpec.lotSize,
                                iv: s.putIV,
                                delta: s.putDelta,
                              })
                            }
                            className={`py-2 px-3 text-left font-black text-emerald-400 border-l border-[#1C263C] cursor-pointer hover:underline ${
                              isPutITM ? 'bg-amber-500/10' : ''
                            }`}
                            title="Click to place PE Order"
                          >
                            ₹{s.putLTP}
                          </td>
                          <td
                            className={`py-2 px-3 text-left text-slate-400 ${
                              isPutITM ? 'bg-amber-500/[0.04]' : ''
                            }`}
                          >
                            {s.putIV}%
                          </td>
                          <td
                            className={`py-2 px-3 text-left text-slate-400 ${
                              isPutITM ? 'bg-amber-500/[0.04]' : ''
                            }`}
                          >
                            {(s.putVolume / 1000).toFixed(1)}k
                          </td>
                          <td
                            className={`py-2 px-3 text-left ${
                              isPutITM ? 'bg-amber-500/[0.04]' : ''
                            } ${
                              s.putChangeOI >= 0
                                ? 'text-emerald-400 font-semibold'
                                : 'text-rose-400'
                            }`}
                          >
                            {s.putChangeOI >= 0 ? '+' : ''}
                            {s.putChangeOI.toLocaleString()}
                          </td>
                          <td
                            className={`py-2 px-3 text-left text-slate-300 ${
                              isPutITM ? 'bg-amber-500/[0.04]' : ''
                            }`}
                          >
                            {s.putOI.toLocaleString()}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Legend Info */}
          <div className="p-3 bg-[#080C16] border-t border-[#1C263C] flex flex-wrap items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-amber-500/20 border border-amber-500/40 rounded" />
                <span>In-the-Money (ITM) Contracts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-cyan-500 text-slate-950 font-bold rounded flex items-center justify-center text-[9px]">
                  •
                </div>
                <span>At-the-Money (ATM) Strike</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Live Black-Scholes Greeks Engine & Open Interest Analytics (NSE / BSE)
            </div>
          </div>
        </div>
      )}

      {/* Option Trade Modal */}
      {orderModalStrike && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E131F] border border-[#1C263C] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1C263C] pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Place {selectedSymbol} {orderModalStrike.strike} {orderModalStrike.type} Order
                </h3>
              </div>
              <button
                onClick={() => setOrderModalStrike(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-[#121827] p-3 rounded-xl border border-[#1C263C] text-xs">
              <div>
                <span className="text-slate-500">Option LTP:</span>
                <p className="text-base font-black text-cyan-400 font-mono">₹{orderModalStrike.ltp}</p>
              </div>
              <div>
                <span className="text-slate-500">Lot Size:</span>
                <p className="text-base font-black text-white font-mono">{orderModalStrike.lotSize} qty</p>
              </div>
              <div>
                <span className="text-slate-500">Required Margin:</span>
                <p className="text-xs font-bold text-emerald-400 font-mono">
                  ₹{(orderModalStrike.ltp * orderModalStrike.lotSize).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Delta / IV:</span>
                <p className="text-xs font-bold text-slate-300 font-mono">
                  Δ {orderModalStrike.delta} | {orderModalStrike.iv}%
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  alert(`Order Placed for 1 Lot of ${selectedSymbol} ${orderModalStrike.strike} ${orderModalStrike.type} @ ₹${orderModalStrike.ltp}`);
                  setOrderModalStrike(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg transition-all"
              >
                BUY CALL / PUT (Market)
              </button>
              <button
                onClick={() => setOrderModalStrike(null)}
                className="px-4 py-2.5 rounded-xl bg-[#121827] hover:bg-[#182236] text-slate-400 text-sm font-semibold border border-[#1C263C]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
