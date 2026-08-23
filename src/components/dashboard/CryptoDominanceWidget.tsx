import React from 'react';
import { PieChart, TrendingUp, ShieldAlert, ArrowUpRight } from 'lucide-react';

export const CryptoDominanceWidget: React.FC = () => {
  const dominance = [
    { name: 'Bitcoin (BTC)', symbol: 'BTC.D', percent: 54.8, change: '+0.6%', color: 'bg-amber-500', barColor: 'from-amber-500 to-yellow-400' },
    { name: 'Ethereum (ETH)', symbol: 'ETH.D', percent: 17.2, change: '-0.3%', color: 'bg-indigo-500', barColor: 'from-indigo-500 to-blue-400' },
    { name: 'Solana (SOL)', symbol: 'SOL.D', percent: 4.8, change: '+0.4%', color: 'bg-emerald-500', barColor: 'from-emerald-500 to-teal-400' },
    { name: 'Stablecoins', symbol: 'STABLE.D', percent: 8.5, change: '-0.2%', color: 'bg-cyan-500', barColor: 'from-cyan-500 to-sky-400' },
    { name: 'Altcoins (Others)', symbol: 'OTHERS.D', percent: 14.7, change: '-0.5%', color: 'bg-purple-500', barColor: 'from-purple-500 to-pink-400' },
  ];

  return (
    <div className="rounded-xl p-4 sm:p-5 bg-[#0E131F] border border-[#1C263C] flex flex-col space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">Market Dominance</h3>
            <span className="text-[10px] text-slate-400">Capital concentration across crypto sectors</span>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
          Total Cap: $2.48T
        </span>
      </div>

      {/* Segmented Stacked Bar */}
      <div className="space-y-1.5">
        <div className="h-2.5 w-full rounded bg-[#121827] overflow-hidden flex p-0.5 border border-[#1C263C] gap-0.5">
          {dominance.map((item) => (
            <div
              key={item.symbol}
              className={`h-full rounded-sm bg-gradient-to-r ${item.barColor} transition-all duration-300`}
              style={{ width: `${item.percent}%` }}
              title={`${item.name}: ${item.percent}%`}
            />
          ))}
        </div>
      </div>

      {/* Dominance Breakdown List */}
      <div className="space-y-2 pt-1">
        {dominance.map((item) => (
          <div key={item.symbol} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="font-medium text-slate-300">{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-white mono-numbers">{item.percent}%</span>
              <span className={`text-[10px] font-mono font-bold ${item.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
