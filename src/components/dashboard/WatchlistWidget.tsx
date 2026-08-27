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
    <div className="rounded-xl p-3.5 sm:p-4 bg-[#101520] border border-[#1C2433] flex flex-col space-y-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Eye className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-white tracking-tight">Market Watchlist</h3>
            <span className="text-[9px] text-slate-400">Live ticks & volume overview</span>
          </div>
        </div>

        <span className="text-[9px] font-mono text-slate-400 bg-[#0D121C] border border-[#1C2433] px-1.5 py-0.5 rounded">
          {filteredAssets.length} Assets
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-[#0D121C] p-1 rounded-md border border-[#1C2433] text-[9px] overflow-x-auto scrollbar-none">
        {(['All', 'Indian / F&O', 'Crypto', 'Stocks', 'Forex', 'Favorites'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer whitespace-nowrap ${
              filter === tab
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Watchlist Asset Rows */}
      <div className="space-y-1 overflow-y-auto max-h-[380px] pr-0.5">
        {filteredAssets.map((asset) => {
          const isSelected = selectedAsset?.symbol === asset.symbol;
          const isPositive = asset.change24h >= 0;

          return (
            <div
              key={asset.symbol}
              onClick={() => onSelectAsset(asset)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-[#151C2B] border-blue-500/60 shadow-sm'
                  : 'bg-[#0D121C] hover:bg-[#151C2B] border-[#1C2433]'
              }`}
            >
              {/* Star & Symbol */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(asset.symbol);
                  }}
                  className={`p-0.5 rounded transition-colors cursor-pointer ${
                    asset.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-600 hover:text-slate-300'
                  }`}
                >
                  <Star className={`w-3 h-3 ${asset.isFavorite ? 'fill-amber-400' : ''}`} />
                </button>

                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-white text-xs">{asset.symbol}</span>
                    <span className="text-[8px] text-slate-500 font-mono uppercase">{asset.category}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[100px]">{asset.name}</span>
                </div>
              </div>

              {/* Sparkline Visual */}
              <div className="hidden sm:block w-14 h-5">
                <svg viewBox="0 0 70 24" className="w-full h-full overflow-visible">
                  <path
                    d={`M 0 ${24 - (asset.sparkline[0] / Math.max(...asset.sparkline)) * 20} ${asset.sparkline
                      .map((val, i) => `L ${i * 11.5} ${24 - (val / Math.max(...asset.sparkline)) * 20}`)
                      .join(' ')}`}
                    fill="none"
                    stroke={isPositive ? '#10B981' : '#F43F5E'}
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              {/* Price & Change */}
              <div className="text-right">
                <div className="font-bold text-white text-xs mono-numbers font-mono">
                  {formatAssetPrice(asset.price, asset)}
                </div>
                <div
                  className={`text-[9px] font-bold font-mono inline-flex items-center gap-0.5 ${
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

