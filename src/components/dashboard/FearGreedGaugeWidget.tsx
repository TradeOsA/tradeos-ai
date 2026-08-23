import React from 'react';
import { Gauge, TrendingUp, Info, Activity } from 'lucide-react';
import { FearGreedData } from '../../types';

interface FearGreedGaugeWidgetProps {
  data: FearGreedData;
}

export const FearGreedGaugeWidget: React.FC<FearGreedGaugeWidgetProps> = ({ data }) => {
  // Value 0-100 to rotation angle (-90deg to +90deg)
  const angle = (data.value / 100) * 180 - 90;

  const getSentimentDetails = (sentiment: string) => {
    switch (sentiment) {
      case 'Extreme Fear':
        return { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', desc: 'Market participants are deeply fearful. Historically associated with capitulation bottoms.' };
      case 'Fear':
        return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', desc: 'Cautious sentiment with reduced leverage and protective put hedging.' };
      case 'Greed':
        return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', desc: 'Bullish expansion with heightened retail optimism. Watch for liquidity sweeps at key resistance.' };
      case 'Extreme Greed':
        return { color: 'text-emerald-300', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', desc: 'High speculative euphoria and elevated funding rates. Strict capital protection advised.' };
      default:
        return { color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/30', desc: 'Balanced equilibrium between buyers and sellers.' };
    }
  };

  const details = getSentimentDetails(data.sentiment);

  return (
    <div className="rounded-xl p-4 sm:p-5 bg-[#0E131F] border border-[#1C263C] flex flex-col space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">Fear & Greed Index</h3>
            <span className="text-[10px] text-slate-400">Multi-factor market sentiment gauge</span>
          </div>
        </div>

        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${details.bg} ${details.color} ${details.border}`}>
          {data.sentiment}
        </span>
      </div>

      {/* Speedometer Arc Graphic */}
      <div className="relative flex flex-col items-center justify-center pt-2 pb-1">
        <svg viewBox="0 0 200 110" className="w-44 sm:w-52 overflow-visible">
          {/* Gradient Arc Definition */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="35%" stopColor="#F59E0B" />
              <stop offset="65%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#05F292" />
            </linearGradient>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Active Gradient Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (data.value / 100) * 251.2}
            className="transition-all duration-700 ease-out"
          />

          {/* Center Pivot Point */}
          <circle cx="100" cy="100" r="7" fill="#10B981" />
          <circle cx="100" cy="100" r="3" fill="#FFFFFF" />

          {/* Needle */}
          <g transform={`rotate(${angle}, 100, 100)`} className="transition-transform duration-700 ease-out">
            <line x1="100" y1="100" x2="100" y2="35" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            <polygon points="100,28 97,38 103,38" fill="#FFFFFF" />
          </g>
        </svg>

        {/* Digital Score Display */}
        <div className="text-center -mt-3">
          <div className="text-2xl sm:text-3xl font-black text-white mono-numbers tracking-tight font-mono">
            {data.value}
            <span className="text-xs text-slate-400 font-normal ml-1">/ 100</span>
          </div>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${details.color}`}>
            {data.sentiment}
          </span>
        </div>
      </div>

      {/* Historical Benchmarks */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#1C263C] text-center text-xs">
        <div className="p-2 rounded-lg bg-[#121827] border border-[#1C263C]">
          <span className="text-[10px] text-slate-400 block">Yesterday</span>
          <span className="font-mono font-bold text-slate-200">{data.yesterdayValue}</span>
        </div>
        <div className="p-2 rounded-lg bg-[#121827] border border-[#1C263C]">
          <span className="text-[10px] text-slate-400 block">Last Week</span>
          <span className="font-mono font-bold text-slate-200">{data.lastWeekValue}</span>
        </div>
        <div className="p-2 rounded-lg bg-[#121827] border border-[#1C263C]">
          <span className="text-[10px] text-slate-400 block">Last Month</span>
          <span className="font-mono font-bold text-slate-200">{data.lastMonthValue}</span>
        </div>
      </div>
    </div>
  );
};
