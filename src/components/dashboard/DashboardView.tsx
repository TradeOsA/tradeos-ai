import React from 'react';
import { AdvancedTradingChart } from './AdvancedTradingChart';
import { WatchlistWidget } from './WatchlistWidget';
import { MarketHeatmapWidget } from './MarketHeatmapWidget';
import { FearGreedGaugeWidget } from './FearGreedGaugeWidget';
import { CryptoDominanceWidget } from './CryptoDominanceWidget';
import { EconomicCalendarWidget } from './EconomicCalendarWidget';
import { AIMarketDigestCard } from './AIMarketDigestCard';
import { DailyChecklistCard } from './DailyChecklistCard';
import { PageHeader } from '../layout/PageHeader';
import {
  MarketAsset,
  EconomicEvent,
  MarketNewsItem,
  UserProfile,
  Trade,
  FearGreedData,
} from '../../types';
import {
  ShieldCheck,
  TrendingUp,
  Target,
  Sparkles,
  Zap,
  ArrowUpRight,
  BarChart3,
  LayoutDashboard,
  PlusCircle,
  MessageCircle,
  Radar,
  Wallet,
  IndianRupee,
  CreditCard,
  QrCode,
  Flame,
  Info,
} from 'lucide-react';

interface DashboardViewProps {
  user: UserProfile;
  assets: MarketAsset[];
  selectedAsset: MarketAsset;
  onSelectAsset: (asset: MarketAsset) => void;
  economicEvents: EconomicEvent[];
  news: MarketNewsItem[];
  fearGreedData: FearGreedData;
  trades: Trade[];
  disciplineScore: number;
  onChecklistChange: (score: number) => void;
  setActiveTab: (tab: string) => void;
  onOpenNewTradeWithAsset: (asset: MarketAsset) => void;
  onSendToAIReviewFromChart: (symbol: string, currentPrice: number) => void;
  onOpenShareModal?: () => void;
  onOpenInstallModal?: () => void;
  onOpenPricing?: () => void;
  onOpenKillSwitch?: () => void;
  selectedMarketSegment?: 'ALL' | 'INDIAN' | 'CRYPTO' | 'FOREX';
  onSelectMarketSegment?: (segment: 'ALL' | 'INDIAN' | 'CRYPTO' | 'FOREX') => void;
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  assets,
  selectedAsset,
  onSelectAsset,
  economicEvents,
  news,
  fearGreedData,
  trades,
  disciplineScore,
  onChecklistChange,
  setActiveTab,
  onOpenNewTradeWithAsset,
  onSendToAIReviewFromChart,
  onOpenShareModal,
  onOpenInstallModal,
  onOpenPricing,
  onOpenKillSwitch,
  selectedMarketSegment = 'ALL',
  onSelectMarketSegment,
  onBack,
}) => {
  // Filter assets based on active market segment
  const filteredAssets = React.useMemo(() => {
    if (selectedMarketSegment === 'INDIAN') {
      return assets.filter(
        (a) =>
          a.category === 'Indian Stocks / F&O' ||
          a.symbol.includes('NIFTY') ||
          a.symbol.includes('BANKNIFTY') ||
          a.symbol.includes('RELIANCE') ||
          a.symbol.includes('HDFCBANK') ||
          a.symbol.includes('INFY') ||
          a.symbol.includes('TCS') ||
          a.symbol.includes('TATAMOTORS') ||
          a.symbol.includes('SENSEX')
      );
    }
    if (selectedMarketSegment === 'CRYPTO') {
      return assets.filter(
        (a) =>
          a.category === 'Crypto' ||
          a.symbol.includes('BTC') ||
          a.symbol.includes('ETH') ||
          a.symbol.includes('SOL') ||
          a.symbol.includes('BNB') ||
          a.symbol.includes('XRP') ||
          a.symbol.includes('DOGE')
      );
    }
    if (selectedMarketSegment === 'FOREX') {
      return assets.filter(
        (a) =>
          a.category === 'Forex' ||
          a.category === 'Commodities' ||
          a.symbol.includes('EUR') ||
          a.symbol.includes('GBP') ||
          a.symbol.includes('XAU') ||
          a.symbol.includes('JPY') ||
          a.symbol.includes('USD')
      );
    }
    return assets;
  }, [assets, selectedMarketSegment]);

  // Quick stats calculation
  const closedTrades = trades.filter((t) => t.status !== 'OPEN');
  const wins = closedTrades.filter((t) => t.status === 'WIN').length;
  const winRate = closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0;
  const netPnL = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);

  const handleToggleFavorite = (symbol: string) => {
    const target = assets.find((a) => a.symbol === symbol);
    if (target) {
      target.isFavorite = !target.isFavorite;
    }
  };

  return (
    <div id="dashboard-view-main" className="space-y-6 pb-16">
      {/* Universal Page Header */}
      <PageHeader
        title="Live Market Terminal"
        subtitle="Real-time multi-asset workstation with interactive candlestick engine, liquidity heatmaps, macroeconomic catalyst stream, and daily discipline gates."
        badge="Live Connected • 16ms"
        badgeVariant="emerald"
        icon={LayoutDashboard}
        breadcrumbs={[]}
        showBackButton={false}
        showHomeButton={false}
        onNavigateTab={setActiveTab}
        actionSlot={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct Emergency Kill Switch Button */}
            {onOpenKillSwitch && (
              <button
                onClick={onOpenKillSwitch}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 group"
                title="EMERGENCY KILL SWITCH: Liquidate open positions & cancel orders"
              >
                <Flame className="w-3.5 h-3.5 text-rose-400 group-hover:animate-bounce" />
                <span className="hidden sm:inline">Emergency Kill Switch</span>
                <span className="sm:hidden">Kill</span>
              </button>
            )}

            {/* Direct Plan / Payment Button */}
            {onOpenPricing && (
              <button
                onClick={onOpenPricing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm group"
                title="View Plans, UPI QR Code & Pricing"
              >
                <CreditCard className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                <span>Pricing / VIP</span>
              </button>
            )}

            {/* 1-Click WhatsApp Share Modal / Trigger */}
            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Share TradeOS on WhatsApp with Friends"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}

            <button
              onClick={() => onOpenNewTradeWithAsset(selectedAsset)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-md active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Log {selectedAsset.symbol}</span>
            </button>
            <button
              onClick={() => onSendToAIReviewFromChart(selectedAsset.symbol, selectedAsset.price)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Audit</span>
            </button>
          </div>
        }
      />

      {/* Institutional Performance KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Discipline Score */}
        <div className="p-4 rounded-xl bg-[#0E131F] border border-[#1C263C] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Discipline Rating
              </span>
              <span className="text-xl font-black text-white mono-numbers">
                {disciplineScore}%
              </span>
            </div>
          </div>
          <div className="w-16 bg-[#161F30] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${disciplineScore}%` }}
            />
          </div>
        </div>

        {/* Win Rate */}
        <div className="p-4 rounded-xl bg-[#0E131F] border border-[#1C263C] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Win Rate (Closed)
              </span>
              <span className="text-xl font-black text-white mono-numbers">
                {winRate}% <span className="text-xs text-slate-400 font-normal">({wins}/{closedTrades.length})</span>
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            {closedTrades.length} Trades
          </span>
        </div>

        {/* Net Journal PnL */}
        <div className="p-4 rounded-xl bg-[#0E131F] border border-[#1C263C] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                trades.length === 0
                  ? 'bg-[#161F30] border border-[#232F46] text-slate-400'
                  : netPnL >= 0
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Realized Net P&L
              </span>
              <span
                className={`text-xl font-black mono-numbers ${
                  trades.length === 0
                    ? 'text-slate-300'
                    : netPnL >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {trades.length === 0 ? '$0.00' : `${netPnL >= 0 ? '+' : ''}$${netPnL.toLocaleString()}`}
              </span>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              trades.length === 0
                ? 'bg-[#161F30] text-slate-400 border-[#232F46]'
                : netPnL >= 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {trades.length === 0 ? 'Ready' : netPnL >= 0 ? 'Profitable' : 'Drawdown'}
          </span>
        </div>
      </div>

      {/* Primary Chart & Watchlist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AdvancedTradingChart
            asset={selectedAsset}
            onOpenQuickTrade={() => onOpenNewTradeWithAsset(selectedAsset)}
            onSendToAIReview={onSendToAIReviewFromChart}
          />
        </div>
        <div className="lg:col-span-1">
          <WatchlistWidget
            assets={filteredAssets}
            selectedAsset={selectedAsset}
            onSelectAsset={onSelectAsset}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      </div>

      {/* Market Heatmap & Crypto Dominance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MarketHeatmapWidget assets={filteredAssets} onSelectAsset={onSelectAsset} />
        </div>
        <div className="lg:col-span-1">
          <CryptoDominanceWidget />
        </div>
      </div>

      {/* Macro & AI Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIMarketDigestCard news={news} selectedAsset={selectedAsset} />
        <EconomicCalendarWidget events={economicEvents} />
      </div>

      {/* Sentiment & Discipline Checklist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FearGreedGaugeWidget data={fearGreedData} />
        <DailyChecklistCard onChecklistChange={onChecklistChange} />
      </div>

      {/* High-Impact Workflow Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        <div
          onClick={() => setActiveTab('scanner')}
          className="p-4 rounded-xl bg-[#0E131F] border border-[#1C263C] hover:border-emerald-500/40 transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Radar className="w-3.5 h-3.5" />
              <span>Breakout Radar</span>
            </span>
            <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Algorithmic Signals
            </h4>
            <p className="text-xs text-slate-400">Volume surge 3x, RSI oversold & EMA cross.</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0 ml-3" />
        </div>

        <div
          onClick={() => setActiveTab('paper-trading')}
          className="p-4 rounded-xl bg-[#0E131F] border border-[#1C263C] hover:border-indigo-500/40 transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              <span>Paper Trading</span>
            </span>
            <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
              $10,000 Demo Practice
            </h4>
            <p className="text-xs text-slate-400">Live ticking PnL, realistic orders and zero risk.</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0 ml-3" />
        </div>

        <div
          onClick={() => setActiveTab('risk-center')}
          className="p-4 rounded-xl bg-[#0E131F] border border-[#1C263C] hover:border-emerald-500/40 transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Risk Center</span>
            </span>
            <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Position Sizing Matrix
            </h4>
            <p className="text-xs text-slate-400">8 financial calculators to protect capital.</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0 ml-3" />
        </div>

        <div
          onClick={() => setActiveTab('tax')}
          className="p-4 rounded-xl bg-[#0E131F] border border-[#1C263C] hover:border-amber-500/40 transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Crypto Tax & TDS</span>
            </span>
            <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
              30% Tax + 1% TDS
            </h4>
            <p className="text-xs text-slate-400">Section 115BBH and 194S automated calculations.</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0 ml-3" />
        </div>
      </div>

      {/* Membership & Instant UPI Payment Card */}
      {onOpenPricing && (
        <div
          onClick={onOpenPricing}
          className="p-4 sm:p-5 rounded-xl bg-[#0E131F] border border-[#1C263C] hover:border-emerald-500/30 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold bg-white/[0.06] text-slate-200 border border-white/10 px-2 py-0.5 rounded">
                    Trader Upgrade & Access
                  </span>
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Instant UPI QR Active</span>
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                  Unlock Unlimited AI Vision Audits, Live Scanners & Cloud Sync
                </h3>
                <p className="text-xs text-slate-400 max-w-xl">
                  Get full lifetime institutional access with direct UPI QR payment, official GST receipt, and priority support.
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenPricing();
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer shrink-0 text-center"
            >
              View Plans & Pay with UPI →
            </button>
          </div>
        </div>
      )}

      {/* Non-intrusive Regulatory & Compliance Disclaimer */}
      <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#1A2338] flex items-center justify-between gap-3 text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong className="text-slate-300">Regulatory Disclaimer:</strong> TradeosAi is an Analytics & Execution Routing Interface tool, <span className="text-amber-400 font-semibold">NOT a SEBI-registered advisory</span> or financial advisor. All analytics are for educational and disciplined execution purposes only.
          </span>
        </div>
        <span className="hidden md:inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider shrink-0">
          Compliant Interface
        </span>
      </div>
    </div>
  );
};
