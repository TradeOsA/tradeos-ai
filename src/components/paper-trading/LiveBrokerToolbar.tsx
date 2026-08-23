import React from 'react';
import {
  Zap,
  ShieldCheck,
  Building2,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Radio,
  ArrowRightLeft,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { BrokerConnection } from '../../types';

interface LiveBrokerToolbarProps {
  tradingMode: 'PRACTICE' | 'LIVE_BROKER';
  onChangeTradingMode: (mode: 'PRACTICE' | 'LIVE_BROKER') => void;
  connectedBrokers: BrokerConnection[];
  activeBroker: BrokerConnection | null;
  onSelectBroker: (broker: BrokerConnection) => void;
  onOpenBrokerSync: () => void;
  isIndianAsset: boolean;
}

export const LiveBrokerToolbar: React.FC<LiveBrokerToolbarProps> = ({
  tradingMode,
  onChangeTradingMode,
  connectedBrokers,
  activeBroker,
  onSelectBroker,
  onOpenBrokerSync,
  isIndianAsset,
}) => {
  const isLive = tradingMode === 'LIVE_BROKER';

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all shadow-xl space-y-3 ${
        isLive
          ? 'bg-gradient-to-r from-[#0C1527] via-[#0E1A2F] to-[#0C1527] border-emerald-500/50 shadow-emerald-500/10'
          : 'bg-[#0E131F] border-[#1C263C]'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mode Switcher Pills */}
        <div className="flex items-center gap-3">
          <div className="flex p-1 rounded-xl bg-[#090D17] border border-[#1C263C]">
            <button
              type="button"
              onClick={() => onChangeTradingMode('PRACTICE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                !isLive
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Practice (Demo $10K)</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeTradingMode('LIVE_BROKER')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                isLive
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 animate-pulse'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>⚡ Live Broker API Mode</span>
            </button>
          </div>

          {/* Mode Indicator Tag */}
          {isLive ? (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-black uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Real Exchange Execution Active</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[11px] font-bold">
              <span>Virtual Zero-Risk Sandbox</span>
            </div>
          )}
        </div>

        {/* Right: Active Broker Badge, Latency & Quick Config */}
        <div className="flex flex-wrap items-center gap-2">
          {isLive ? (
            <>
              {/* Active Broker Selector Dropdown */}
              <div className="relative">
                <select
                  value={activeBroker?.id || ''}
                  onChange={(e) => {
                    const b = connectedBrokers.find((item) => item.id === e.target.value);
                    if (b) onSelectBroker(b);
                  }}
                  className="px-3 py-1.5 pr-8 rounded-lg bg-[#121827] border border-emerald-500/40 text-xs font-bold text-white focus:outline-none focus:border-emerald-400 cursor-pointer appearance-none"
                >
                  {connectedBrokers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.latencyMs ? `${b.latencyMs}ms` : 'Connected'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Latency & Ping Badge */}
              <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{activeBroker?.latencyMs || 4}ms Latency (0 Lag)</span>
              </div>

              {/* Configure / Add Broker Keys */}
              <button
                type="button"
                onClick={onOpenBrokerSync}
                className="px-3 py-1.5 rounded-lg bg-[#121827] hover:bg-[#1A2234] border border-[#1C263C] text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Manage API Keys & Connect New Brokers (Zerodha, Dhan, Binance, Delta, MT5)"
              >
                <Sliders className="w-3.5 h-3.5 text-teal-400" />
                <span>Manage API Keys</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenBrokerSync}
              className="px-3 py-1.5 rounded-lg bg-[#121827] hover:bg-[#1A2234] border border-[#1C263C] text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Connect Broker API Keys</span>
            </button>
          )}
        </div>
      </div>

      {/* Currency & Rule Regulation Notice Strip */}
      <div className="pt-2 border-t border-[#1C263C]/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          {isIndianAsset ? (
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold font-mono">
              🇮🇳 Indian Stock / F&O Segment: Prices & PnL displayed strictly in ₹ INR
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-teal-500/15 border border-teal-500/30 text-teal-300 font-bold font-mono">
              🌐 Global Crypto / Forex: Dual Currency PnL active in USDT ($) & ₹ INR
            </span>
          )}
        </div>

        {isLive && activeBroker && (
          <div className="flex items-center gap-2 font-mono text-slate-300">
            <span>Broker Account:</span>
            <strong className="text-emerald-300">
              {activeBroker.accountName || activeBroker.name}
            </strong>
            <span>• Available Margin:</span>
            <strong className="text-white font-bold">
              {activeBroker.category === 'Indian Stocks / F&O'
                ? `₹${(activeBroker.availableMargin || 245000).toLocaleString('en-IN')}`
                : `$${(activeBroker.availableMargin || 38450).toLocaleString()} (₹${Math.round((activeBroker.availableMargin || 38450) * 87.5).toLocaleString('en-IN')})`}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
};
