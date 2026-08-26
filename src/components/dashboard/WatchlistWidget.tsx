import React, { useState } from 'react';
import { Star, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { MarketAsset } from '../../types';
import { formatAssetPrice } from '../../utils/currencyUtils';

interface WatchlistWidgetProps {
  assets: MarketAsset[];
  selectedAsset: MarketAsset | null;
  onSelectAsset: (asset: MarketAsset) => void;
  onToggleFavorite: (symbol: string) => void;
}

export const WatchlistWidget: React.FC<WatchlistWidgetProps> = ({
  assets,
  selectedAsset,
  onSelectAsset,
  onToggleFavorite,
}) => {
  const [filter, setFilter] = useState<'All' | 'Indian / F&O' | 'Crypto' | 'Stocks' | 'Forex' | 'Favorites'>('All');

  const filteredAssets = assets.filter((item) => {
    if (filter === 'Favorites') return item.isFavorite;
    if (filter === 'All') return true;
    if (filter === 'Indian / F&O') {
      return (
        item.category === 'Indian Stocks / F&O' ||
        item.symbol.includes('NIFTY') ||
        item.symbol.includes('SENSEX') ||
        item.symbol.includes('RELIANCE') ||
        item.symbol.includes('HDFC') ||
        item.symbol.includes('ICICI') ||
        item.symbol.includes('INFY') ||
        item.symbol.includes('TCS') ||
        item.symbol.includes('TATA') ||
        item.symbol.includes('SBIN')
      );
    }
    if (filter === 'Stocks') {
      return item.category === 'Stocks' || item.category === 'Indian Stocks / F&O';
    }
    return item.category === filter;
  });

  return (
    <div className="rounded-xl p-4 sm:p-5 bg-[#0E131F] border border-[#1C263C] flex flex-col space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">Market Watchlist</h3>
            <span className="text-[10px] text-slate-400">Live ticks & volume overview</span>
          </div>
        </div>

        <span className="text-[10px] font-mono text-slate-400">
          {filteredAssets.length} Assets
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-[#121827] p-1 rounded-lg border border-[#1C263C] text-[10px] overflow-x-auto scrollbar-none">
        {(['All', 'Indian / F&O', 'Crypto', 'Stocks', 'Forex', 'Favorites'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              filter === tab
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Watchlist Asset Rows */}
      <div className="space-y-1.5 overflow-y-auto max-h-[380px] pr-1">
        {filteredAssets.map((asset) => {
          const isSelected = selectedAsset?.symbol === asset.symbol;
          const isPositive = asset.change24h >= 0;

          return (
            <div
              key={asset.symbol}
              onClick={() => onSelectAsset(asset)}
              className={`p-2.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-[#161F30] border-emerald-500/50 shadow-sm'
                  : 'bg-[#121827] hover:bg-[#182236] border-[#1C263C]'
              }`}
            >
              {/* Star & Symbol */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(asset.symbol);
                  }}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    asset.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-600 hover:text-slate-300'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${asset.isFavorite ? 'fill-amber-400' : ''}`} />
                </button>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs">{asset.symbol}</span>
                    <span className="text-[9px] text-slate-400 font-mono uppercase">{asset.category}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[100px]">{asset.name}</span>
                </div>
              </div>

              {/* Sparkline Visual */}
              <div className="hidden sm:block w-16 h-6">
                <svg viewBox="0 0 70 24" className="w-full h-full overflow-visible">
                  <path
                    d={`M 0 ${24 - (asset.sparkline[0] / Math.max(...asset.sparkline)) * 20} ${asset.sparkline
                      .map((val, i) => `L ${i * 11.5} ${24 - (val / Math.max(...asset.sparkline)) * 20}`)
                      .join(' ')}`}
                    fill="none"
                    stroke={isPositive ? '#10B981' : '#F43F5E'}
                    strokeWidth="1.75"
                  />
                </svg>
              </div>

              {/* Price & Change */}
              <div className="text-right">
                <div className="font-bold text-white text-xs mono-numbers font-mono">
                  {formatAssetPrice(asset.price, asset)}
                </div>
                <div
                  className={`text-[10px] font-bold font-mono inline-flex items-center gap-0.5 ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

