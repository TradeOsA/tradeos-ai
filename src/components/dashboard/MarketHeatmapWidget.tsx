import React, { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { MarketAsset } from '../../types';
import { formatAssetPrice } from '../../utils/currencyUtils';

interface MarketHeatmapWidgetProps {
  assets: MarketAsset[];
  onSelectAsset: (asset: MarketAsset) => void;
}

export const MarketHeatmapWidget: React.FC<MarketHeatmapWidgetProps> = ({
  assets,
  onSelectAsset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Crypto' | 'Stocks' | 'Forex' | 'Commodities'>('All');

  const filteredAssets = assets.filter((item) => {
    if (selectedCategory === 'All') return true;
    return item.category === selectedCategory;
  });

  const getColorClass = (change: number) => {
    if (change >= 4) return 'bg-[#062419] border-emerald-500/50 text-emerald-300';
    if (change > 0) return 'bg-[#0B1C17] border-emerald-500/30 text-emerald-400';
    if (change > -2) return 'bg-[#220F13] border-rose-500/30 text-rose-300';
    return 'bg-[#2E0B13] border-rose-500/50 text-rose-200';
  };

  return (
    <div id="market-heatmap-widget" className="rounded-xl p-4 sm:p-5 bg-[#0E131F] border border-[#1C263C] flex flex-col space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">Market Momentum Heatmap</h3>
            <span className="text-[10px] text-slate-400">24h price momentum & volume density</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 bg-[#121827] p-1 rounded-lg border border-[#1C263C] text-[10px] overflow-x-auto">
          {(['All', 'Crypto', 'Stocks', 'Forex', 'Commodities'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 min-h-[200px]">
        {filteredAssets.map((asset) => {
          const isPositive = asset.change24h >= 0;

          return (
            <div
              key={asset.symbol}
              onClick={() => onSelectAsset(asset)}
              className={`relative p-3 rounded-lg border transition-colors cursor-pointer group flex flex-col justify-between overflow-hidden ${getColorClass(
                asset.change24h
              )} hover:border-white/40`}
            >
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-xs tracking-tight">
                  {asset.symbol}
                </span>
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-black/60 text-slate-300 font-mono">
                  {asset.category}
                </span>
              </div>

              {/* Bottom Row */}
              <div className="mt-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm sm:text-base font-black font-mono text-white mono-numbers">
                    {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
                  </span>
                  <span className="text-[11px] font-mono text-slate-300 mono-numbers">
                    {formatAssetPrice(asset.price, asset)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span className="truncate max-w-[90px]">{asset.name}</span>
                  <span className="font-mono text-slate-400">{asset.volume24h}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

