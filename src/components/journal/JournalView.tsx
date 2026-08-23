import React, { useState } from 'react';
import {
  BookOpenCheck,
  Plus,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  PieChart,
  Calendar,
  Sparkles,
  BarChart2,
  ChevronRight,
  Smile,
  ShieldCheck,
  Pencil,
  Zap,
  Award,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Printer,
  FileText,
  Trash2,
  RotateCcw,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Trade, MarketCategory, TradeStatus, TradingStrategy } from '../../types';
import { PageHeader } from '../layout/PageHeader';
import { EditTradeModal } from './EditTradeModal';
import { BrokerCsvImportModal } from './BrokerCsvImportModal';
import { PropFirmShieldModal } from './PropFirmShieldModal';
import { PreTradeVetoModal } from './PreTradeVetoModal';
import { ExecutiveReportModal } from './ExecutiveReportModal';
import { BrokerSyncModal } from '../broker/BrokerSyncModal';
import { useCurrency } from '../../context/CurrencyContext';

interface JournalViewProps {
  trades: Trade[];
  onOpenNewTradeModal: () => void;
  onSelectTrade: (trade: Trade) => void;
  onAnalyzeTradeWithAI: (trade: Trade) => void;
  onUpdateTrade?: (updatedTrade: Trade) => void;
  onDeleteTrade?: (tradeId: string) => void;
  onClearAllTrades?: () => void;
  onLoadSampleTrades?: () => void;
  onImportTrades?: (importedTrades: Trade[]) => void;
  onSaveNewTrade?: (newTrade: Trade) => void;
  accountBalance?: number;
  maxDailyLossUsd?: number;
  defaultRiskPercent?: number;
  userName?: string;
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  trades,
  onOpenNewTradeModal,
  onSelectTrade,
  onAnalyzeTradeWithAI,
  onUpdateTrade,
  onDeleteTrade,
  onClearAllTrades,
  onLoadSampleTrades,
  onImportTrades,
  onSaveNewTrade,
  accountBalance = 25000,
  maxDailyLossUsd = 500,
  defaultRiskPercent = 1.0,
  userName = 'Trader',
  onBack,
  onNavigateTab,
}) => {
  const { formatCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  const [filterMarket, setFilterMarket] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterStrategy, setFilterStrategy] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'log' | 'analytics' | 'psychology'>('log');
  
  // Modals state
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isPropFirmModalOpen, setIsPropFirmModalOpen] = useState(false);
  const [isPreTradeVetoModalOpen, setIsPreTradeVetoModalOpen] = useState(false);
  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered trades
  const filteredTrades = trades.filter((t) => {
    const matchesSearch =
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(search.toLowerCase())) ||
      (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())));
    const matchesMarket = filterMarket === 'All' || t.market === filterMarket;
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchesStrategy = filterStrategy === 'All' || t.strategy === filterStrategy;

    return matchesSearch && matchesMarket && matchesStatus && matchesStrategy;
  });

  // Analytics Computation
  const closedTrades = trades.filter((t) => t.status !== 'OPEN');
  const winningTrades = closedTrades.filter((t) => t.status === 'WIN');
  const losingTrades = closedTrades.filter((t) => t.status === 'LOSS');
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  const totalGains = winningTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const totalLosses = Math.abs(losingTrades.reduce((acc, t) => acc + (t.pnl || 0), 0));
  const profitFactor = totalLosses > 0 ? (totalGains / totalLosses).toFixed(2) : totalGains > 0 ? '∞' : '0.00';

  const avgWin = winningTrades.length > 0 ? totalGains / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
  const expectancy =
    closedTrades.length > 0
      ? (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss
      : 0;

  const netPnL = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);

  // Build Equity Curve Points
  let runningEquity = 25000;
  const equityPoints: { date: string; equity: number }[] = [{ date: 'Start', equity: runningEquity }];
  trades
    .slice()
    .reverse()
    .forEach((t) => {
      if (t.pnl !== undefined) {
        runningEquity += t.pnl;
        equityPoints.push({
          date: t.openDate.split('T')[0],
          equity: runningEquity,
        });
      }
    });

  // SVG dimensions for equity curve
  const chartWidth = 700;
  const chartHeight = 180;
  const equities = equityPoints.map((p) => p.equity);
  const minEquity = Math.min(...equities, 20000);
  const maxEquity = Math.max(...equities, 30000);
  const equityRange = maxEquity - minEquity || 1;

  const equityPolyline = equityPoints
    .map((p, i) => {
      const x = 20 + i * ((chartWidth - 40) / Math.max(1, equityPoints.length - 1));
      const y = chartHeight - 20 - ((p.equity - minEquity) / equityRange) * (chartHeight - 40);
      return `${x},${y}`;
    })
    .join(' ');

  // Strategy performance breakdown
  const strategyStats: Record<string, { trades: number; wins: number; pnl: number }> = {};
  trades.forEach((t) => {
    if (!strategyStats[t.strategy]) {
      strategyStats[t.strategy] = { trades: 0, wins: 0, pnl: 0 };
    }
    strategyStats[t.strategy].trades += 1;
    if (t.status === 'WIN') strategyStats[t.strategy].wins += 1;
    if (t.pnl) strategyStats[t.strategy].pnl += t.pnl;
  });

  // Emotional performance breakdown
  const emotionStats: Record<string, { count: number; pnl: number }> = {};
  trades.forEach((t) => {
    const emo = t.emotionBefore || 'Neutral';
    if (!emotionStats[emo]) emotionStats[emo] = { count: 0, pnl: 0 };
    emotionStats[emo].count += 1;
    if (t.pnl) emotionStats[emo].pnl += t.pnl;
  });

  const exportCSV = () => {
    const headers = ['Symbol', 'Market', 'Direction', 'Status', 'EntryPrice', 'ExitPrice', 'PnL', 'Strategy', 'Emotion', 'OpenDate'];
    const rows = trades.map((t) => [
      t.symbol,
      t.market,
      t.direction,
      t.status,
      t.entryPrice,
      t.exitPrice || '',
      t.pnl || 0,
      `"${t.strategy}"`,
      t.emotionBefore,
      t.openDate,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradeos_journal_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Universal Page Header with Breadcrumbs */}
      <PageHeader
        title="Trading Journal & Analytics"
        subtitle="Detailed execution performance tracking, emotional discipline metrics, equity curve analytics, and strategy optimization."
        badge={`${trades.length} Trades Recorded`}
        badgeVariant="emerald"
        icon={BookOpenCheck}
        breadcrumbs={[{ label: 'Trade Journal', tab: 'journal' }]}
        onBack={onBack}
        onNavigateTab={onNavigateTab}
        actionSlot={
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setIsBrokerModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all cursor-pointer active:scale-95 shadow-md"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Direct Broker API Sync</span>
            </button>
            <button
              onClick={() => setIsPreTradeVetoModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-xs font-bold text-indigo-300 transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pre-Trade Veto</span>
            </button>
            <button
              onClick={() => setIsPropFirmModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-bold text-amber-300 transition-all cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Prop Firm Shield</span>
            </button>
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121827] hover:bg-[#1A2234] border border-[#1C263C] text-xs font-bold text-slate-300 transition-all cursor-pointer active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import Broker CSV</span>
            </button>
            <button
              onClick={() => setIsExecutiveReportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-xs font-bold text-purple-300 transition-all cursor-pointer active:scale-95"
              title="Generate printable PDF performance audit report"
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>Audit PDF</span>
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121827] hover:bg-[#1A2234] border border-[#1C263C] text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            {trades.length > 0 && onClearAllTrades && (
              <button
                onClick={() => setIsClearConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold text-rose-300 transition-all cursor-pointer active:scale-95"
                title="Clear all trades and start completely fresh"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear All</span>
              </button>
            )}
            {trades.length === 0 && onLoadSampleTrades && (
              <button
                onClick={onLoadSampleTrades}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-xs font-bold text-indigo-300 transition-all cursor-pointer active:scale-95"
                title="Load sample demo trades for preview"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Load Sample Demo</span>
              </button>
            )}
            <button
              onClick={onOpenNewTradeModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Trade</span>
            </button>
          </div>
        }
      />

      {/* KPI Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl p-3.5 bg-[#0E131F] border border-[#1C263C] space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Logged</span>
          <div className="text-xl font-bold text-white mono-numbers">{trades.length}</div>
          <span className="text-[10px] text-slate-400">{closedTrades.length} Closed</span>
        </div>

        <div className="rounded-xl p-3.5 bg-[#0E131F] border border-[#1C263C] space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Win Rate</span>
          <div className="text-xl font-bold text-emerald-400 mono-numbers">{winRate.toFixed(1)}%</div>
          <span className="text-[10px] text-slate-400">{winningTrades.length}W / {losingTrades.length}L</span>
        </div>

        <div className="rounded-xl p-3.5 bg-[#0E131F] border border-[#1C263C] space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Profit Factor</span>
          <div className="text-xl font-bold text-indigo-400 mono-numbers">{profitFactor}</div>
          <span className="text-[10px] text-slate-400">&gt; 1.5 is healthy</span>
        </div>

        <div className="rounded-xl p-3.5 bg-[#0E131F] border border-[#1C263C] space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Avg Win / Loss</span>
          <div className="text-sm font-bold text-white mono-numbers">
            <span className="text-emerald-400">+{formatCurrency(Math.round(avgWin))}</span> / <span className="text-rose-400">-{formatCurrency(Math.round(avgLoss))}</span>
          </div>
          <span className="text-[10px] text-slate-400">Ratio: {(avgLoss > 0 ? avgWin / avgLoss : 0).toFixed(2)}x</span>
        </div>

        <div className="rounded-xl p-3.5 bg-[#0E131F] border border-[#1C263C] space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Trade Expectancy</span>
          <div className={`text-xl font-bold mono-numbers ${expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(expectancy)}
          </div>
          <span className="text-[10px] text-slate-400">Expected return/trade</span>
        </div>

        <div className="rounded-xl p-3.5 bg-[#0E131F] border border-[#1C263C] space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Net Realized P&L</span>
          <div className={`text-xl font-bold mono-numbers ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netPnL >= 0 ? '+' : ''}{formatCurrency(netPnL)}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold">Account Growth</span>
        </div>
      </div>

      {/* Equity Curve SVG Chart */}
      <div className="rounded-xl p-4 bg-[#0E131F] border border-[#1C263C] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Cumulative Account Equity Curve</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Current Equity: <strong className="text-white">{formatCurrency(runningEquity)}</strong>
          </span>
        </div>

        <div className="w-full h-44 bg-[#121827] rounded-lg p-2 relative overflow-hidden border border-[#1C263C]">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
            <defs>
              <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area */}
            <polygon
              points={`20,${chartHeight - 20} ${equityPolyline} ${chartWidth - 20},${chartHeight - 20}`}
              fill="url(#eqGrad)"
            />

            {/* Line */}
            <polyline
              points={equityPolyline}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points */}
            {equityPoints.map((p, i) => {
              const x = 20 + i * ((chartWidth - 40) / Math.max(1, equityPoints.length - 1));
              const y = chartHeight - 20 - ((p.equity - minEquity) / equityRange) * (chartHeight - 40);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3.5"
                  className="fill-emerald-400 stroke-[#121827] stroke-2"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Tabs: Log Table vs. Strategy Breakdown vs Psychology */}
      <div className="flex items-center gap-2 border-b border-[#1C263C] pb-2.5">
        <button
          onClick={() => setActiveTab('log')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'log' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          Trade Log History ({filteredTrades.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'analytics' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          Strategy Breakdown
        </button>
        <button
          onClick={() => setActiveTab('psychology')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'psychology' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          Emotion & Psychometrics
        </button>
      </div>

      {/* Tab 1: Trade Log with Filters */}
      {activeTab === 'log' && (
        <div className="space-y-3">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search symbol, tags, thesis..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#121827] border border-[#1C263C] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500"
              />
            </div>

            <select
              value={filterMarket}
              onChange={(e) => setFilterMarket(e.target.value)}
              className="bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
            >
              <option value="All">All Asset Markets</option>
              <option value="Crypto">Crypto</option>
              <option value="Stocks">Stocks</option>
              <option value="Forex">Forex</option>
              <option value="Futures">Futures</option>
              <option value="Commodities">Commodities</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
            >
              <option value="All">All Trade Statuses</option>
              <option value="OPEN">Open Positions</option>
              <option value="WIN">Closed Wins</option>
              <option value="LOSS">Closed Losses</option>
              <option value="BREAKEVEN">Breakeven</option>
            </select>

            <select
              value={filterStrategy}
              onChange={(e) => setFilterStrategy(e.target.value)}
              className="bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
            >
              <option value="All">All Strategies</option>
              {Object.keys(strategyStats).map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Trade Table */}
          <div className="rounded-xl overflow-hidden border border-[#1C263C] bg-[#0E131F]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#121827] text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-[#1C263C]">
                  <tr>
                    <th className="py-2.5 px-4">Asset</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Entry</th>
                    <th className="py-2.5 px-3">Exit</th>
                    <th className="py-2.5 px-3">R:R</th>
                    <th className="py-2.5 px-3">Net P&L</th>
                    <th className="py-2.5 px-3">Strategy</th>
                    <th className="py-2.5 px-3">Emotion</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C263C]">
                  {filteredTrades.map((trade) => {
                    const isWin = trade.status === 'WIN';
                    const isLoss = trade.status === 'LOSS';
                    const isOpenTrade = trade.status === 'OPEN';

                    return (
                      <tr
                        key={trade.id}
                        onClick={() => onSelectTrade(trade)}
                        className="hover:bg-[#121827] transition-colors cursor-pointer"
                      >
                        <td className="py-2.5 px-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span>{trade.symbol}</span>
                            <span className="text-[9px] px-1 py-0.5 rounded bg-[#121827] border border-[#1C263C] text-slate-400 font-normal">
                              {trade.market}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-bold text-[11px] ${
                              trade.direction === 'LONG' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {trade.direction}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isWin
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isLoss
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : isOpenTrade
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {trade.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 mono-numbers font-medium text-slate-200">
                          {formatCurrency(trade.entryPrice)}
                        </td>
                        <td className="py-2.5 px-3 mono-numbers text-slate-400">
                          {trade.exitPrice ? formatCurrency(trade.exitPrice) : '—'}
                        </td>
                        <td className="py-2.5 px-3 mono-numbers font-semibold text-emerald-400">
                          1:{trade.riskRewardRatio}
                        </td>
                        <td className="py-2.5 px-3 mono-numbers font-bold">
                          {trade.pnl !== undefined ? (
                            <span className={trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                            </span>
                          ) : (
                            <span className="text-slate-500">Live</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 max-w-[140px] truncate">
                          {trade.strategy}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#121827] border border-[#1C263C]">
                            {trade.emotionBefore}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`edit-trade-btn-${trade.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTradeToEdit(trade);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 rounded bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer active:scale-95"
                              title="Edit Trade"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`ai-review-trade-btn-${trade.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAnalyzeTradeWithAI(trade);
                              }}
                              className="p-1.5 rounded bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer active:scale-95"
                              title="AI Trade Review"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            {onDeleteTrade && (
                              <button
                                id={`delete-trade-btn-${trade.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTradeToDelete(trade);
                                }}
                                className="p-1.5 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer active:scale-95"
                                title="Delete Trade"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile-Friendly Trade Cards (Visible on Small Screens) */}
              <div className="md:hidden divide-y divide-[#1C263C]">
                {filteredTrades.map((trade) => {
                  const isWin = trade.status === 'WIN';
                  const isLoss = trade.status === 'LOSS';
                  const isOpenTrade = trade.status === 'OPEN';

                  return (
                    <div
                      key={`mob-${trade.id}`}
                      onClick={() => onSelectTrade(trade)}
                      className="p-4 space-y-3 bg-[#0E131F] hover:bg-[#121827] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-white">{trade.symbol}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              trade.direction === 'LONG'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {trade.direction}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#121827] border border-[#1C263C] text-slate-400">
                            {trade.market}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isWin
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isLoss
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : isOpenTrade
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {trade.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-[#121827] border border-[#1C263C] text-center">
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Entry</div>
                          <div className="text-xs font-bold text-white mono-numbers">{formatCurrency(trade.entryPrice)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Exit</div>
                          <div className="text-xs font-bold text-slate-300 mono-numbers">{trade.exitPrice ? formatCurrency(trade.exitPrice) : '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Net P&L</div>
                          <div className="text-xs font-black mono-numbers">
                            {trade.pnl !== undefined ? (
                              <span className={trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                              </span>
                            ) : (
                              <span className="text-slate-500">Live</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {trade.strategy}
                        </div>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setTradeToEdit(trade);
                              setIsEditModalOpen(true);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => onAnalyzeTradeWithAI(trade)}
                            className="p-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer"
                            title="AI Review"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteTrade && (
                            <button
                              onClick={() => setTradeToDelete(trade)}
                              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                              title="Delete Trade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredTrades.length === 0 && (
                <div className="py-14 px-6 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-lg bg-[#121827] border border-[#1C263C] flex items-center justify-center text-slate-400">
                    <BookOpenCheck className="w-6 h-6 text-slate-400" />
                  </div>
                  {trades.length === 0 ? (
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h4 className="text-base font-bold text-white">Trading Journal is Blank & Ready</h4>
                      <p className="text-xs text-slate-400">
                        No trade history or old PnL found. Start tracking your live positions, win-rates, and risk-reward metrics from scratch!
                      </p>
                      <div className="flex items-center justify-center gap-2.5 pt-2">
                        <button
                          onClick={onOpenNewTradeModal}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Log Your First Trade</span>
                        </button>
                        {onLoadSampleTrades && (
                          <button
                            onClick={onLoadSampleTrades}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#121827] hover:bg-[#1A2234] text-slate-200 border border-[#1C263C] font-bold text-xs transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4 text-slate-400" />
                            <span>Load Sample Demo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h4 className="text-base font-bold text-white">No Trades Matching Filters</h4>
                      <p className="text-xs text-slate-400">
                        Try resetting your search query, market selector, or trade status filters.
                      </p>
                      <button
                        onClick={() => {
                          setSearch('');
                          setFilterMarket('All');
                          setFilterStatus('All');
                          setFilterStrategy('All');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#121827] hover:bg-[#1A2234] text-slate-200 border border-[#1C263C] text-xs font-bold transition-all cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Strategy Breakdown */}
      {activeTab === 'analytics' && (
        <div className="rounded-xl p-5 bg-[#0E131F] border border-[#1C263C] space-y-4">
          <h3 className="font-bold text-base text-white">Strategy Profitability Matrix</h3>
          <div className="space-y-2.5">
            {Object.entries(strategyStats).map(([strat, stat]) => {
              const stratWinRate = stat.trades > 0 ? (stat.wins / stat.trades) * 100 : 0;
              return (
                <div key={strat} className="p-3.5 rounded-lg bg-[#121827] border border-[#1C263C] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{strat}</span>
                    <span className={`font-bold mono-numbers text-sm ${stat.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stat.pnl >= 0 ? '+' : ''}{formatCurrency(stat.pnl)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Win Rate: <strong className="text-slate-200">{stratWinRate.toFixed(1)}%</strong> ({stat.wins}/{stat.trades})</span>
                    <span>Total Trades: {stat.trades}</span>
                  </div>
                  <div className="w-full bg-[#0E131F] h-2 rounded-full overflow-hidden border border-[#1C263C]">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${stratWinRate}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Emotion Breakdown */}
      {activeTab === 'psychology' && (
        <div className="rounded-xl p-5 bg-[#0E131F] border border-[#1C263C] space-y-3">
          <h3 className="font-bold text-base text-white">Emotional State Correlation Analysis</h3>
          <p className="text-xs text-slate-400">
            Compare profitability when entering under discipline vs. emotional states like FOMO or fear.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {Object.entries(emotionStats).map(([emotion, stat]) => (
              <div key={emotion} className="p-3.5 rounded-lg bg-[#121827] border border-[#1C263C] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{emotion}</span>
                  <span className="text-xs text-slate-400">{stat.count} trades</span>
                </div>
                <div className={`text-xl font-bold mono-numbers ${stat.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stat.pnl >= 0 ? '+' : ''}{formatCurrency(stat.pnl)}
                </div>
                <p className="text-[11px] text-slate-400">
                  {emotion === 'Disciplined' ? 'Highest expectancy baseline' : 'Heightened drawdown risk'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Trade Modal */}
      <EditTradeModal
        isOpen={isEditModalOpen}
        trade={tradeToEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setTradeToEdit(null);
        }}
        onSave={(updatedTrade) => {
          if (onUpdateTrade) {
            onUpdateTrade(updatedTrade);
          }
        }}
        onDelete={onDeleteTrade}
      />

      {/* Direct Broker API Sync Modal */}
      <BrokerSyncModal
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
        onImportTrades={(syncedTrades) => {
          if (onImportTrades) {
            onImportTrades(syncedTrades);
          }
        }}
      />

      {/* Universal Broker CSV & Statement Importer Modal */}
      <BrokerCsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportTrades={(importedTrades) => {
          if (onImportTrades) {
            onImportTrades(importedTrades);
          }
        }}
      />

      {/* Prop Firm & Funded Account Shield Tracker */}
      <PropFirmShieldModal
        isOpen={isPropFirmModalOpen}
        onClose={() => setIsPropFirmModalOpen(false)}
        trades={trades}
      />

      {/* Pre-Trade AI Veto & Discipline Gatekeeper */}
      <PreTradeVetoModal
        isOpen={isPreTradeVetoModalOpen}
        onClose={() => setIsPreTradeVetoModalOpen(false)}
        onLogApprovedTrade={(newTrade) => {
          if (onSaveNewTrade) {
            onSaveNewTrade(newTrade);
          }
        }}
        todayPnL={trades
          .filter((t) => t.openDate.startsWith(new Date().toISOString().split('T')[0]))
          .reduce((acc, t) => acc + (t.pnl || 0), 0)}
        maxDailyLossUsd={maxDailyLossUsd}
        defaultRiskPercent={defaultRiskPercent}
        accountBalance={accountBalance}
      />

      {/* Executive PDF & Printable Performance Report Modal */}
      <ExecutiveReportModal
        isOpen={isExecutiveReportOpen}
        onClose={() => setIsExecutiveReportOpen(false)}
        trades={trades}
        userName={userName}
      />

      {/* In-App Single Trade Deletion Confirmation Modal */}
      {tradeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#0E1321] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Delete Trade Entry?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to delete the trade for <strong className="text-white">{tradeToDelete.symbol}</strong> ({tradeToDelete.direction})? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setTradeToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteTrade) {
                    onDeleteTrade(tradeToDelete.id);
                    showToast(`Trade for ${tradeToDelete.symbol} deleted successfully.`);
                  }
                  setTradeToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all active:scale-95 shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Clear All Trades Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0E1321] border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">Reset Journal & Clear All Trades?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will delete all <strong className="text-rose-400">{trades.length} recorded trades</strong> and reset your performance stats (Win-Rate, P&L, Equity Curve) back to a completely clean slate (0 trades).
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={() => setIsClearConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onClearAllTrades) {
                    onClearAllTrades();
                    showToast('Trading Journal cleared successfully. You are now at 0 trades.');
                  }
                  setIsClearConfirmOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-xs transition-all active:scale-95 shadow-lg shadow-rose-500/25 cursor-pointer"
              >
                Yes, Reset All to 0
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
