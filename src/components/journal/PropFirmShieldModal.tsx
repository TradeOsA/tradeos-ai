import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Award,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Layers,
  Sparkles,
  Zap,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info
} from 'lucide-react';
import { Trade } from '../../types';

interface PropFirmShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
}

export interface PropFirmConfig {
  name: string;
  accountSize: number;
  phase: 'Phase 1' | 'Phase 2' | 'Funded Master';
  dailyLossLimitPercent: number;
  maxTotalLossPercent: number;
  profitTargetPercent: number;
  minTradingDays: number;
}

const DEFAULT_CONFIG: PropFirmConfig = {
  name: 'FTMO Challenge',
  accountSize: 100000,
  phase: 'Phase 1',
  dailyLossLimitPercent: 5.0,
  maxTotalLossPercent: 10.0,
  profitTargetPercent: 10.0,
  minTradingDays: 4,
};

const PRESETS: Record<string, PropFirmConfig> = {
  FTMO_100K: {
    name: 'FTMO 100K Challenge',
    accountSize: 100000,
    phase: 'Phase 1',
    dailyLossLimitPercent: 5.0,
    maxTotalLossPercent: 10.0,
    profitTargetPercent: 10.0,
    minTradingDays: 4,
  },
  FTMO_50K: {
    name: 'FTMO 50K Challenge',
    accountSize: 50000,
    phase: 'Phase 1',
    dailyLossLimitPercent: 5.0,
    maxTotalLossPercent: 10.0,
    profitTargetPercent: 10.0,
    minTradingDays: 4,
  },
  FUNDED_NEXT_100K: {
    name: 'FundedNext Stellar 100K',
    accountSize: 100000,
    phase: 'Phase 1',
    dailyLossLimitPercent: 5.0,
    maxTotalLossPercent: 10.0,
    profitTargetPercent: 8.0,
    minTradingDays: 5,
  },
  APEX_50K: {
    name: 'Apex Trader Funding 50K',
    accountSize: 50000,
    phase: 'Phase 1',
    dailyLossLimitPercent: 4.0,
    maxTotalLossPercent: 5.0,
    profitTargetPercent: 6.0,
    minTradingDays: 1,
  },
  TOPSTEP_50K: {
    name: 'Topstep 50K Trading Combine',
    accountSize: 50000,
    phase: 'Phase 1',
    dailyLossLimitPercent: 2.0,
    maxTotalLossPercent: 4.0,
    profitTargetPercent: 6.0,
    minTradingDays: 2,
  },
};

const STORAGE_KEY = 'tradeos_prop_firm_config_v1';

export const PropFirmShieldModal: React.FC<PropFirmShieldModalProps> = ({
  isOpen,
  onClose,
  trades,
}) => {
  const [config, setConfig] = useState<PropFirmConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load prop firm config', e);
    }
    return DEFAULT_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save prop firm config', e);
    }
  }, [config]);

  if (!isOpen) return null;

  // Realized calculations from current trades
  const netPnL = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const currentBalance = config.accountSize + netPnL;

  // Today's PnL calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTrades = trades.filter((t) => t.openDate.startsWith(todayStr));
  const todayPnL = todayTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);

  // Limits
  const maxDailyLossUsd = (config.accountSize * config.dailyLossLimitPercent) / 100;
  const maxTotalLossUsd = (config.accountSize * config.maxTotalLossPercent) / 100;
  const targetProfitUsd = (config.accountSize * config.profitTargetPercent) / 100;

  // Drawdown tracking
  const currentDailyDrawdownUsd = todayPnL < 0 ? Math.abs(todayPnL) : 0;
  const currentDailyDrawdownPercent = (currentDailyDrawdownUsd / config.accountSize) * 100;
  const dailyLossBufferUsd = Math.max(0, maxDailyLossUsd - currentDailyDrawdownUsd);

  const currentTotalDrawdownUsd = netPnL < 0 ? Math.abs(netPnL) : 0;
  const currentTotalDrawdownPercent = (currentTotalDrawdownUsd / config.accountSize) * 100;
  const totalLossBufferUsd = Math.max(0, maxTotalLossUsd - currentTotalDrawdownUsd);

  // Profit target progress
  const profitProgressPercent = Math.min(100, Math.max(0, (netPnL / targetProfitUsd) * 100));

  // Determine Shield Status
  let statusBadge = {
    title: 'ACCOUNT SAFE',
    desc: 'Risk parameters healthy. You are well within both daily and overall drawdown limits.',
    color: 'emerald',
    icon: ShieldCheck,
  };

  if (currentDailyDrawdownUsd >= maxDailyLossUsd || currentTotalDrawdownUsd >= maxTotalLossUsd) {
    statusBadge = {
      title: 'RULE BREACHED',
      desc: 'Drawdown limit has been exceeded! Stop trading immediately on this account.',
      color: 'rose',
      icon: ShieldAlert,
    };
  } else if (
    currentDailyDrawdownUsd >= maxDailyLossUsd * 0.75 ||
    currentTotalDrawdownUsd >= maxTotalLossUsd * 0.75
  ) {
    statusBadge = {
      title: 'CRITICAL RISK DANGER',
      desc: 'You have consumed over 75% of your allowed drawdown. Extreme risk caution required.',
      color: 'rose',
      icon: AlertTriangle,
    };
  } else if (
    currentDailyDrawdownUsd >= maxDailyLossUsd * 0.5 ||
    currentTotalDrawdownUsd >= maxTotalLossUsd * 0.5
  ) {
    statusBadge = {
      title: 'CAUTION ZONE',
      desc: 'You have consumed 50% of your daily buffer. Reduce position size on next trade.',
      color: 'amber',
      icon: AlertTriangle,
    };
  } else if (netPnL >= targetProfitUsd) {
    statusBadge = {
      title: 'TARGET PASSED! 🏆',
      desc: `Congratulations! You have hit the +$${targetProfitUsd.toLocaleString()} profit target for ${config.phase}.`,
      color: 'emerald',
      icon: Award,
    };
  }

  // Recommended next trade max risk
  const safeNextTradeRiskUsd = Math.min(dailyLossBufferUsd * 0.35, config.accountSize * 0.01);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0B0F19] border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0E1321]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Prop Firm & Funded Account Shield</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                  Rule Protector
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live evaluation drawdown monitor, profit target tracking, and circuit breaker shield.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Preset Quick Bar */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Select Prop Firm Preset:
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setConfig(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    config.name === preset.name
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                      : 'bg-[#0E1321] text-slate-400 border-white/5 hover:text-white hover:border-white/15'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Status Alert Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
              statusBadge.color === 'emerald'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : statusBadge.color === 'amber'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <statusBadge.icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-xs font-black uppercase tracking-wider">{statusBadge.title}</div>
              <div className="text-xs text-slate-300">{statusBadge.desc}</div>
            </div>
          </div>

          {/* Account Balance & Target KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#0E1321] border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Starting Capital</span>
              <div className="text-base font-black text-white mono-numbers">
                ${config.accountSize.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">{config.phase}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E1321] border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Current Equity</span>
              <div className="text-base font-black text-white mono-numbers">
                ${Math.round(currentBalance).toLocaleString()}
              </div>
              <span
                className={`text-[10px] font-bold ${
                  netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {netPnL >= 0 ? '+' : ''}${Math.round(netPnL).toLocaleString()} P&L
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E1321] border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Profit Target</span>
              <div className="text-base font-black text-emerald-400 mono-numbers">
                +${targetProfitUsd.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">{config.profitTargetPercent}% target</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E1321] border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Safe Next Trade Risk</span>
              <div className="text-base font-black text-indigo-400 mono-numbers">
                ${Math.round(safeNextTradeRiskUsd).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">Max recommended SL</span>
            </div>
          </div>

          {/* Progress Meters */}
          <div className="space-y-4">
            {/* 1. Daily Loss Limit Meter */}
            <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span>Today's Daily Drawdown Monitor</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Max: -${maxDailyLossUsd.toLocaleString()} / {config.dailyLossLimitPercent}%)
                  </span>
                </span>
                <span className="font-mono text-slate-300">
                  Buffer Left:{' '}
                  <span className="text-emerald-400 font-bold">
                    ${Math.round(dailyLossBufferUsd).toLocaleString()}
                  </span>
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10">
                <div
                  className={`h-full rounded-full transition-all ${
                    currentDailyDrawdownPercent > config.dailyLossLimitPercent * 0.8
                      ? 'bg-rose-500'
                      : currentDailyDrawdownPercent > config.dailyLossLimitPercent * 0.5
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (currentDailyDrawdownUsd / maxDailyLossUsd) * 100
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 Loss</span>
                <span>
                  Used: -${Math.round(currentDailyDrawdownUsd).toLocaleString()} (
                  {((currentDailyDrawdownUsd / maxDailyLossUsd) * 100).toFixed(1)}%)
                </span>
                <span>Max: -${maxDailyLossUsd.toLocaleString()}</span>
              </div>
            </div>

            {/* 2. Total Drawdown Limit Meter */}
            <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span>Maximum Overall Drawdown</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Max: -${maxTotalLossUsd.toLocaleString()} / {config.maxTotalLossPercent}%)
                  </span>
                </span>
                <span className="font-mono text-slate-300">
                  Buffer Left:{' '}
                  <span className="text-emerald-400 font-bold">
                    ${Math.round(totalLossBufferUsd).toLocaleString()}
                  </span>
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10">
                <div
                  className={`h-full rounded-full transition-all ${
                    currentTotalDrawdownPercent > config.maxTotalLossPercent * 0.8
                      ? 'bg-rose-500'
                      : 'bg-indigo-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (currentTotalDrawdownUsd / maxTotalLossUsd) * 100
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 Drawdown</span>
                <span>Used: -${Math.round(currentTotalDrawdownUsd).toLocaleString()}</span>
                <span>Max: -${maxTotalLossUsd.toLocaleString()}</span>
              </div>
            </div>

            {/* 3. Profit Target Progress */}
            <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span>Target Progress</span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    ({profitProgressPercent.toFixed(1)}% Completed)
                  </span>
                </span>
                <span className="font-mono text-slate-300">
                  Remaining:{' '}
                  <span className="text-emerald-400 font-bold">
                    +${Math.max(0, targetProfitUsd - netPnL).toLocaleString()}
                  </span>
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                  style={{ width: `${profitProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>$0</span>
                <span>Current: +${Math.max(0, netPnL).toLocaleString()}</span>
                <span>Target: +${targetProfitUsd.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Custom Settings Config Accordion */}
          <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/5 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Customize Account Rule Parameters:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Account Capital ($)</label>
                <input
                  type="number"
                  value={config.accountSize}
                  onChange={(e) =>
                    setConfig({ ...config, accountSize: Math.max(1000, parseFloat(e.target.value) || 10000) })
                  }
                  className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Max Daily Loss (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={config.dailyLossLimitPercent}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      dailyLossLimitPercent: Math.max(0.5, parseFloat(e.target.value) || 5),
                    })
                  }
                  className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Max Total Loss (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={config.maxTotalLossPercent}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      maxTotalLossPercent: Math.max(1, parseFloat(e.target.value) || 10),
                    })
                  }
                  className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Profit Target (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={config.profitTargetPercent}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      profitTargetPercent: Math.max(1, parseFloat(e.target.value) || 10),
                    })
                  }
                  className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#0E1321]">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>Rules are tracked automatically against all trades logged in your journal.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer active:scale-95"
          >
            Close Shield
          </button>
        </div>
      </div>
    </div>
  );
};
