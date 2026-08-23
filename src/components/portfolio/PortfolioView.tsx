import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { defaultPortfolioHoldings } from '../../data/mockData';
import { PortfolioHolding, MarketCategory } from '../../types';
import { PageHeader } from '../layout/PageHeader';

interface PortfolioViewProps {
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ onBack, onNavigateTab }) => {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(defaultPortfolioHoldings);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Holding Form State
  const [symbol, setSymbol] = useState('SOL');
  const [name, setName] = useState('Solana');
  const [category, setCategory] = useState<MarketCategory>('Crypto');
  const [amount, setAmount] = useState(25);
  const [avgBuyPrice, setAvgBuyPrice] = useState(140);
  const [currentPrice, setCurrentPrice] = useState(185);

  const totalPortfolioValue = holdings.reduce(
    (acc, h) => acc + h.amount * h.currentPrice,
    0
  );
  const totalCostBasis = holdings.reduce(
    (acc, h) => acc + h.amount * h.avgBuyPrice,
    0
  );
  const totalUnrealizedPnL = totalPortfolioValue - totalCostBasis;
  const totalReturnPercent =
    totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0;

  const handleAddHolding = (e: React.FormEvent) => {
    e.preventDefault();
    const newH: PortfolioHolding = {
      id: `h-${Date.now()}`,
      symbol: symbol.toUpperCase(),
      name,
      category,
      amount: Number(amount),
      avgBuyPrice: Number(avgBuyPrice),
      currentPrice: Number(currentPrice),
      allocationPercent: 10,
    };
    setHoldings([...holdings, newH]);
    setShowAddModal(false);
  };

  const handleDeleteHolding = (id: string) => {
    setHoldings(holdings.filter((h) => h.id !== id));
  };

  // Color palette for asset allocation donut
  const colors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto animate-fade-in">
      {/* Universal Page Header with Breadcrumbs */}
      <PageHeader
        title="Portfolio & Capital Allocation"
        subtitle="Monitor multi-asset exposure, distribution across Crypto, Equities, Forex, and Commodities, and analyze unrealized yield."
        badge={`$${totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} Net Worth`}
        badgeVariant="emerald"
        icon={PieChart}
        breadcrumbs={[{ label: 'Terminal', tab: 'dashboard' }, { label: 'Portfolio', tab: 'portfolio' }]}
        onBack={onBack}
        onNavigateTab={onNavigateTab}
        actionSlot={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Holding</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0E131F] rounded-xl p-4.5 border border-[#1C263C] space-y-1 shadow-sm">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Portfolio Net Worth</span>
          <div className="text-2xl sm:text-3xl font-bold text-white mono-numbers">
            ${totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400">Total invested: ${totalCostBasis.toLocaleString()}</span>
        </div>

        <div className="bg-[#0E131F] rounded-xl p-4.5 border border-[#1C263C] space-y-1 shadow-sm">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Unrealized P&L</span>
          <div className={`text-2xl sm:text-3xl font-bold mono-numbers ${totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <span className={`text-xs font-bold ${totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalUnrealizedPnL >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}% ROI
          </span>
        </div>

        <div className="bg-[#0E131F] rounded-xl p-4.5 border border-[#1C263C] space-y-1 shadow-sm">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Asset Diversification</span>
          <div className="text-2xl sm:text-3xl font-bold text-indigo-400 mono-numbers">
            {holdings.length} Positions
          </div>
          <span className="text-xs text-slate-400">Multi-asset portfolio</span>
        </div>
      </div>

      {/* Allocation Visual & Holdings Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Allocation Bars */}
        <div className="lg:col-span-4 bg-[#0E131F] rounded-xl p-5 border border-[#1C263C] space-y-3.5 shadow-sm">
          <h3 className="font-bold text-sm text-white">Asset Allocation Breakdown</h3>

          {/* Allocation Stack Bar */}
          <div className="w-full h-3.5 rounded-lg bg-[#121827] flex overflow-hidden border border-[#1C263C]">
            {holdings.map((h, i) => {
              const val = h.amount * h.currentPrice;
              const pct = totalPortfolioValue > 0 ? (val / totalPortfolioValue) * 100 : 0;
              return (
                <div
                  key={h.id}
                  style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }}
                  title={`${h.symbol}: ${pct.toFixed(1)}%`}
                ></div>
              );
            })}
          </div>

          <div className="space-y-2.5 pt-1">
            {holdings.map((h, i) => {
              const val = h.amount * h.currentPrice;
              const pct = totalPortfolioValue > 0 ? (val / totalPortfolioValue) * 100 : 0;
              return (
                <div key={h.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: colors[i % colors.length] }}
                    ></span>
                    <span className="font-semibold text-white">{h.symbol}</span>
                    <span className="text-slate-500 text-[10px]">{h.category}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-slate-200 font-bold">${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="text-slate-400 text-[10px] ml-1.5">({pct.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Holdings Table */}
        <div className="lg:col-span-8 bg-[#0E131F] rounded-xl p-5 border border-[#1C263C] space-y-3.5 shadow-sm">
          <h3 className="font-bold text-sm text-white">Open Asset Holdings</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#121827] text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-[#1C263C]">
                <tr>
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Holding Units</th>
                  <th className="py-2.5 px-3">Avg Buy</th>
                  <th className="py-2.5 px-3">Current Price</th>
                  <th className="py-2.5 px-3">Total Value</th>
                  <th className="py-2.5 px-3">Unrealized P&L</th>
                  <th className="py-2.5 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C263C]/50">
                {holdings.map((h) => {
                  const val = h.amount * h.currentPrice;
                  const cost = h.amount * h.avgBuyPrice;
                  const pnl = val - cost;
                  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;

                  return (
                    <tr key={h.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{h.symbol}</span>
                          <span className="text-[10px] text-slate-500 font-normal">{h.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 mono-numbers font-medium text-slate-200">
                        {h.amount}
                      </td>
                      <td className="py-3 px-3 mono-numbers text-slate-400">
                        ${h.avgBuyPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 mono-numbers font-semibold text-white">
                        ${h.currentPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 mono-numbers font-bold text-white">
                        ${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 mono-numbers font-bold">
                        <span className={pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {pnl >= 0 ? '+' : ''}${pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({pnlPct.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleDeleteHolding(h.id)}
                          className="p-1 rounded-md text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal to add holding */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="relative w-full max-w-md bg-[#0E131F] border border-[#1C263C] rounded-xl p-5 shadow-2xl space-y-4 text-slate-200">
            <h3 className="text-sm font-bold text-white">Add Asset Holding</h3>
            <form onSubmit={handleAddHolding} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Symbol</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white uppercase focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white mono-numbers focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Avg Price ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={avgBuyPrice}
                    onChange={(e) => setAvgBuyPrice(Number(e.target.value))}
                    className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white mono-numbers focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Current ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(Number(e.target.value))}
                    className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white mono-numbers focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm cursor-pointer"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
