import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MarketAsset } from '../../types';
import { formatAssetPrice } from '../../utils/currencyUtils';

interface LiveTickerMarqueeProps {
  assets: MarketAsset[];
  onSelectAsset: (asset: MarketAsset) => void;
}

export const LiveTickerMarquee: React.FC<LiveTickerMarqueeProps> = ({
  assets,
  onSelectAsset,
}) => {
  const tickerItems = assets && assets.length > 0 ? assets : [];

  return (
    <div className="w-full bg-[#080B11] border-b border-[#1C263C] overflow-hidden select-none py-1.5 px-3 z-30 flex items-center">
      {/* Live Badge */}
      <div className="shrink-0 flex items-center gap-2 pr-3.5 border-r border-[#1C263C] mr-3 z-10 bg-[#080B11]">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-bold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>LIVE MARKETS</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">24H TICKER</span>
      </div>

      {/* Marquee Track */}
      <div className="relative overflow-hidden w-full flex items-center">
        <div className="animate-marquee flex items-center gap-5 whitespace-nowrap">
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => {
            const isPositive = item.change24h >= 0;
            return (
              <button
                key={`${item.symbol}-${idx}`}
                onClick={() => onSelectAsset(item)}
                className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer text-xs group shrink-0"
              >
                <span className="font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                  {item.symbol}
                </span>
                <span className="font-mono text-slate-300 text-[11px]">
                  {formatAssetPrice(item.price, item)}
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                    isPositive
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-rose-400 bg-rose-500/10'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  {isPositive ? '+' : ''}
                  {item.change24h.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

