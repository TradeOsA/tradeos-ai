import React, { useState } from 'react';
import {
  Sliders,
  Zap,
  ShieldCheck,
  Brain,
  Layers,
  Flame,
  Volume2,
  VolumeX,
  CheckCircle2,
  X,
  Info,
  DollarSign,
  Percent,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AutoTradeConfig, AutoTradeExecutionMode, MarketCategory } from '../../types';
import { DEFAULT_AUTO_TRADE_CONFIG } from '../../services/autoTrader';

interface AutoTradeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoTradeConfig;
  onSaveConfig: (updated: AutoTradeConfig) => void;
  freeCollateral: number;
}

export const AutoTradeConfigModal: React.FC<AutoTradeConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  freeCollateral,
}) => {
  const [form, setForm] = useState<AutoTradeConfig>({ ...config });
  const [activeTab, setActiveTab] = useState<'LOGIC' | 'RISK' | 'MANAGEMENT' | 'MARKETS'>('LOGIC');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(form);
    onClose();
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_AUTO_TRADE_CONFIG });
  };

  const toggleCategory = (cat: MarketCategory) => {
    const current = form.targetCategories || [];
    if (current.includes(cat)) {
      if (current.length === 1) return; // keep at least one
      setForm({ ...form, targetCategories: current.filter((c) => c !== cat) });
    } else {
      setForm({ ...form, targetCategories: [...current, cat] });
    }
  };

  const toggleGrade = (grade: 'A+' | 'A' | 'B') => {
    const current = form.allowedGrades || [];
    if (current.includes(grade)) {
      if (current.length === 1) return;
      setForm({ ...form, allowedGrades: current.filter((g) => g !== grade) });
    } else {
      setForm({ ...form, allowedGrades: [...current, grade] });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0B101D] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0F1626] border-b border-[#1C263C] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5 fill-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base sm:text-lg">
                  Sentinel Auto-Trader Logic & Risk Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Quantitative SL/TP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automate paper trade executions directly from bot alerts with mathematical precision.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1A2234] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master ON/OFF Hero Banner */}
        <div className="p-4 bg-gradient-to-r from-[#0F1B2B] via-[#0E2024] to-[#0F1B2B] border-b border-[#1C263C] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                form.isEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
              }`}
            />
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-300">
                Auto-Trade Master Engine Status
              </div>
              <div className="text-sm font-bold text-white">
                {form.isEnabled ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> ACTIVE — Automatically executing qualified signals
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> PAUSED — Signals will not execute automatically
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm({ ...form, isEnabled: !form.isEnabled })}
              className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                form.isEnabled
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              <Zap className={`w-4 h-4 ${form.isEnabled ? 'fill-slate-950 animate-bounce' : ''}`} />
              <span>{form.isEnabled ? 'AUTO-TRADER IS ON' : 'TURN AUTO-TRADER ON'}</span>
            </button>
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="px-5 pt-3 bg-[#0B101D] border-b border-[#1C263C] flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'LOGIC', label: '1. Execution Logic', icon: Brain },
            { id: 'RISK', label: '2. Risk & Sizing', icon: DollarSign },
            { id: 'MANAGEMENT', label: '3. SL / TP Rules', icon: ShieldCheck },
            { id: 'MARKETS', label: '4. Filter & Markets', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-400 text-emerald-400 bg-[#121A2D]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-slate-300 text-xs">
          {/* TAB 1: EXECUTION LOGIC */}
          {activeTab === 'LOGIC' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-white block mb-2">
                  Select Execution Algorithm Mode:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Smart SMC */}
                  <div
                    onClick={() => setForm({ ...form, executionMode: 'SMART_SMC' })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      form.executionMode === 'SMART_SMC'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-md'
                        : 'bg-[#121827] border-[#1C263C] hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Smart SMC (Pro)
                      </span>
                      {form.executionMode === 'SMART_SMC' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Automatically detects Order Block retests (places Limit in Demand zone) vs Confirmed Breakout Expansion (Market fill).
                    </p>
                  </div>

                  {/* Instant Market */}
                  <div
                    onClick={() => setForm({ ...form, executionMode: 'INSTANT_MARKET' })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      form.executionMode === 'INSTANT_MARKET'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-md'
                        : 'bg-[#121827] border-[#1C263C] hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-teal-300 text-xs flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-teal-400" /> Instant Market
                      </span>
                      {form.executionMode === 'INSTANT_MARKET' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Executes immediately at live market price the instant a signal passes confidence filters. Zero delay.
                    </p>
                  </div>

                  {/* Limit Pullback Only */}
                  <div
                    onClick={() => setForm({ ...form, executionMode: 'LIMIT_PULLBACK' })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      form.executionMode === 'LIMIT_PULLBACK'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-md'
                        : 'bg-[#121827] border-[#1C263C] hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" /> Limit Retest Only
                      </span>
                      {form.executionMode === 'LIMIT_PULLBACK' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Always waits for pullback. Places limit orders strictly inside Fair Value Gaps and Order Block discount pockets.
                    </p>
                  </div>
                </div>
              </div>

              {/* Confidence Score Threshold Slider */}
              <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Minimum Anti-Fakeout Confidence Score:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Alerts with lower confidence will be filtered out to prevent whipsaws.
                    </span>
                  </div>
                  <span className="text-base font-black text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                    {form.minConfidenceScore}%+
                  </span>
                </div>
                <input
                  type="range"
                  min="75"
                  max="95"
                  step="1"
                  value={form.minConfidenceScore}
                  onChange={(e) => setForm({ ...form, minConfidenceScore: Number(e.target.value) })}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>75% (More Trades)</span>
                  <span className="text-emerald-400 font-bold">85% (Balanced Recommended)</span>
                  <span>95% (Elite Grade A+ Only)</span>
                </div>
              </div>

              {/* Minimum Risk to Reward */}
              <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Minimum Mathematical Risk-to-Reward (R:R):
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Only take setups where target profit is at least X times the potential loss.
                    </span>
                  </div>
                  <span className="text-sm font-black text-teal-300 font-mono">
                    1:{form.minRiskReward.toFixed(1)}
                  </span>
                </div>
                <div className="flex gap-2">
                  {[1.5, 2.0, 2.5, 3.0].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setForm({ ...form, minRiskReward: ratio })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        form.minRiskReward === ratio
                          ? 'bg-teal-500 text-slate-950 font-black'
                          : 'bg-[#1A2234] text-slate-400 hover:text-white'
                      }`}
                    >
                      1:{ratio.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RISK & SIZING */}
          {activeTab === 'RISK' && (
            <div className="space-y-5">
              {/* Sizing Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white block">Position Sizing Method:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, sizingMode: 'FIXED_MARGIN' })}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer text-left transition-all ${
                      form.sizingMode === 'FIXED_MARGIN'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                        : 'bg-[#121827] border-[#1C263C] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="font-bold text-xs">Fixed Margin per Trade</div>
                      <div className="text-[10px] text-slate-400">e.g. Always allocate $100 per auto-trade</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, sizingMode: 'PERCENT_BALANCE' })}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer text-left transition-all ${
                      form.sizingMode === 'PERCENT_BALANCE'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                        : 'bg-[#121827] border-[#1C263C] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Percent className="w-5 h-5 text-teal-400" />
                    <div>
                      <div className="font-bold text-xs">% of Free Collateral</div>
                      <div className="text-[10px] text-slate-400">e.g. 2% of available account balance</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Sizing Amount */}
              {form.sizingMode === 'FIXED_MARGIN' ? (
                <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] space-y-2">
                  <label className="text-xs font-bold text-white block">Fixed Margin Amount (USDT):</label>
                  <div className="flex gap-2">
                    {[50, 100, 250, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setForm({ ...form, fixedMarginAmount: amt })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          form.fixedMarginAmount === amt
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-[#1A2234] text-slate-300 hover:text-white'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="10"
                    max={freeCollateral || 10000}
                    value={form.fixedMarginAmount}
                    onChange={(e) => setForm({ ...form, fixedMarginAmount: Number(e.target.value) })}
                    className="w-full mt-2 px-3 py-2 bg-[#0A0E17] border border-[#1C263C] rounded-lg text-white font-mono text-xs"
                    placeholder="Custom Margin ($)"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] space-y-2">
                  <label className="text-xs font-bold text-white block">% Risk of Free Collateral:</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 5, 10].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setForm({ ...form, riskPercentBalance: pct })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          form.riskPercentBalance === pct
                            ? 'bg-teal-500 text-slate-950 font-black'
                            : 'bg-[#1A2234] text-slate-300 hover:text-white'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Leverage Slider */}
              <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Default Leverage Multiplier:</span>
                    <span className="text-[11px] text-slate-400">
                      Multiplies purchasing power while keeping Stop Loss strictly defined.
                    </span>
                  </div>
                  <span className="text-base font-black text-amber-400 px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/30 font-mono">
                    {form.defaultLeverage}x
                  </span>
                </div>
                <div className="flex gap-2">
                  {[2, 5, 10, 15, 20].map((lev) => (
                    <button
                      key={lev}
                      type="button"
                      onClick={() => setForm({ ...form, defaultLeverage: lev })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        form.defaultLeverage === lev
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-[#1A2234] text-slate-300 hover:text-white'
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Open Positions */}
              <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Max Concurrent Active Positions:</span>
                    <span className="text-[11px] text-slate-400">
                      System scales execution capacity across all markets without latency or lag.
                    </span>
                  </div>
                  <span className="text-sm font-black text-indigo-400 px-3 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/30 font-mono">
                    {form.maxOpenPositions} Max Trades
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {[3, 5, 10, 15, 20, 30, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setForm({ ...form, maxOpenPositions: num })}
                      className={`flex-1 min-w-[40px] py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        form.maxOpenPositions === num
                          ? 'bg-indigo-500 text-white font-black shadow-md shadow-indigo-500/20'
                          : 'bg-[#1A2234] text-slate-300 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">Custom Limit:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.maxOpenPositions}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                      setForm({ ...form, maxOpenPositions: val });
                    }}
                    className="w-24 px-3 py-1.5 bg-[#0A0E17] border border-[#1C263C] focus:border-indigo-500 rounded-lg text-white font-mono text-xs text-center"
                    placeholder="1 - 100"
                  />
                  <span className="text-[10px] text-emerald-400 font-medium">
                    ⚡ Zero-lag async engine supports up to 100 simultaneous trades safely
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Once this limit is reached, any new alerts will be held in queue until a position hits TP or closes.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: SL / TP MANAGEMENT */}
          {activeTab === 'MANAGEMENT' && (
            <div className="space-y-4">
              {/* Auto Move SL to Breakeven */}
              <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Auto-Move SL to Breakeven (Zero-Risk Runner)
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    When price reaches TP1 (Take Profit 1), system automatically modifies Stop Loss to exact entry price. A winning trade can NEVER become a losing trade!
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.autoMoveSlToBreakeven}
                  onChange={(e) => setForm({ ...form, autoMoveSlToBreakeven: e.target.checked })}
                  className="w-5 h-5 accent-emerald-400 cursor-pointer shrink-0"
                />
              </div>

              {/* Trailing Stop Loss */}
              <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-teal-400" /> Trailing Stop Loss Automation
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Rides long runners by trailing stop loss at a fixed percentage below the high watermark.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.enableTrailingStop}
                    onChange={(e) => setForm({ ...form, enableTrailingStop: e.target.checked })}
                    className="w-5 h-5 accent-teal-400 cursor-pointer shrink-0"
                  />
                </div>

                {form.enableTrailingStop && (
                  <div className="pt-2 border-t border-[#1C263C] flex items-center justify-between">
                    <span className="text-xs text-slate-300">Trailing Distance (%):</span>
                    <div className="flex gap-1.5">
                      {[1.0, 1.5, 2.0, 3.0].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setForm({ ...form, trailingDistancePercent: d })}
                          className={`px-2.5 py-1 rounded text-xs font-bold ${
                            form.trailingDistancePercent === d
                              ? 'bg-teal-500 text-slate-950 font-black'
                              : 'bg-[#1A2234] text-slate-400'
                          }`}
                        >
                          {d}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sound Alerts */}
              <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    {form.soundAlertOnExecution ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    )}
                    Sound & Audio Confirmation on Auto-Execution
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Play audio chime whenever a trade is auto-executed into your portfolio.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.soundAlertOnExecution}
                  onChange={(e) => setForm({ ...form, soundAlertOnExecution: e.target.checked })}
                  className="w-5 h-5 accent-emerald-400 cursor-pointer shrink-0"
                />
              </div>
            </div>
          )}

          {/* TAB 4: FILTERS & MARKETS */}
          {activeTab === 'MARKETS' && (
            <div className="space-y-5">
              {/* Allowed Grades */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white block">Allowed Setup Grades:</label>
                <div className="flex gap-2">
                  {(['A+', 'A', 'B'] as const).map((grade) => {
                    const isSelected = form.allowedGrades.includes(grade);
                    return (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => toggleGrade(grade)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-[#121827] border-[#1C263C] text-slate-500'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>Grade {grade}</span>
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Grade A+ setups have 3x+ volume surge, 4H trend alignment, and zero macro hazard.
                </span>
              </div>

              {/* Target Categories */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white block">Target Market Sectors:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Crypto', 'Forex', 'Stocks', 'Commodities'] as MarketCategory[]).map((cat) => {
                    const isSelected = form.targetCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                            : 'bg-[#121827] border-[#1C263C] text-slate-500'
                        }`}
                      >
                        <span>{cat}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Asset Cooldown */}
              <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Asset Cooldown Period:</span>
                  <span className="text-xs font-black text-white font-mono">{form.cooldownMinutesPerAsset} Minutes</span>
                </div>
                <div className="flex gap-2">
                  {[5, 10, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setForm({ ...form, cooldownMinutesPerAsset: mins })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        form.cooldownMinutesPerAsset === mins
                          ? 'bg-teal-500 text-slate-950 font-black'
                          : 'bg-[#1A2234] text-slate-300 hover:text-white'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Prevents multiple auto-entries on the exact same asset in quick succession.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-[#0F1626] border-t border-[#1C263C] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1A2234] text-xs font-bold transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#121827] hover:bg-[#1A2234] border border-[#1C263C] text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply & Save Auto-Trader Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
