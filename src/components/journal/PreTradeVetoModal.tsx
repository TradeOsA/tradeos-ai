import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
  DollarSign,
  Layers,
  HeartPulse
} from 'lucide-react';
import { Trade, MarketCategory, TradeDirection, TradingStrategy } from '../../types';

interface PreTradeVetoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogApprovedTrade: (trade: Trade) => void;
  todayPnL: number;
  maxDailyLossUsd: number;
  defaultRiskPercent: number;
  accountBalance: number;
}

export const PreTradeVetoModal: React.FC<PreTradeVetoModalProps> = ({
  isOpen,
  onClose,
  onLogApprovedTrade,
  todayPnL,
  maxDailyLossUsd,
  defaultRiskPercent,
  accountBalance,
}) => {
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [market, setMarket] = useState<MarketCategory>('Crypto');
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [entryPrice, setEntryPrice] = useState(65400);
  const [stopLoss, setStopLoss] = useState(64500);
  const [targetPrice, setTargetPrice] = useState(68200);
  const [quantity, setQuantity] = useState(0.25);
  const [strategy, setStrategy] = useState<TradingStrategy>('Order Block / Smart Money (SMC)');
  const [emotion, setEmotion] = useState('Disciplined');
  const [setupNotes, setSetupNotes] = useState('4H Bullish FVG Retest after liquidity sweep');
  const [hasCheckedNews, setHasCheckedNews] = useState(true);
  const [hasWaitedForConfirmation, setHasWaitedForConfirmation] = useState(true);

  if (!isOpen) return null;

  // Real-time calculations
  const priceRiskPerUnit = Math.abs(entryPrice - stopLoss);
  const priceRewardPerUnit = Math.abs(targetPrice - entryPrice);
  const totalRiskUsd = priceRiskPerUnit * quantity;
  const totalRewardUsd = priceRewardPerUnit * quantity;
  const riskPercent = accountBalance > 0 ? (totalRiskUsd / accountBalance) * 100 : 0;
  const riskRewardRatio = priceRiskPerUnit > 0 ? priceRewardPerUnit / priceRiskPerUnit : 0;
  const positionSizeUsd = entryPrice * quantity;

  // Evaluation Rules
  const isRrValid = riskRewardRatio >= 1.5;
  const isRiskSizeSafe = riskPercent <= defaultRiskPercent * 1.5;
  const isNotRevengeEmotional = emotion !== 'Revenge Trading' && emotion !== 'FOMO / Impatient';
  const isDailyLimitSafe = Math.abs(Math.min(0, todayPnL)) + totalRiskUsd <= maxDailyLossUsd;

  const ruleFailures: string[] = [];
  if (!isRrValid) ruleFailures.push(`R:R Ratio is only 1:${riskRewardRatio.toFixed(2)} (Minimum required is 1:1.50)`);
  if (!isRiskSizeSafe) ruleFailures.push(`Risk is ${riskPercent.toFixed(2)}% ($${totalRiskUsd.toFixed(2)}), exceeding your ${defaultRiskPercent}% limit`);
  if (!isDailyLimitSafe) ruleFailures.push(`If stopped out, total daily loss will exceed your $${maxDailyLossUsd} maximum limit!`);
  if (!isNotRevengeEmotional) ruleFailures.push(`Emotional state '${emotion}' carries high risk of impulsive trading.`);
  if (!hasCheckedNews) ruleFailures.push('Economic calendar high-impact events not verified.');
  if (!hasWaitedForConfirmation) ruleFailures.push('Candle close confirmation trigger was skipped.');

  // Final Verdict
  let verdict: 'APPROVED' | 'CAUTION' | 'VETO_BLOCKED' = 'APPROVED';
  if (!isNotRevengeEmotional || !isDailyLimitSafe || totalRiskUsd > maxDailyLossUsd * 0.8) {
    verdict = 'VETO_BLOCKED';
  } else if (!isRrValid || !isRiskSizeSafe || !hasCheckedNews || !hasWaitedForConfirmation) {
    verdict = 'CAUTION';
  }

  const handleExecute = () => {
    const newTrade: Trade = {
      id: `tr-${Date.now()}`,
      symbol,
      market,
      direction,
      entryPrice,
      stopLoss,
      targetPrice,
      quantity,
      positionSizeUsd,
      leverage: 1,
      riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
      status: 'OPEN',
      strategy,
      notes: `[Pre-Trade Veto: ${verdict}] ${setupNotes}`,
      emotionBefore: emotion as any,
      openDate: new Date().toISOString(),
      fees: 2.50,
      tags: ['Pre-Trade Veto', verdict, strategy],
    };

    onLogApprovedTrade(newTrade);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0B0F19] border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0E1321]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Pre-Trade AI "Veto" & Discipline Gatekeeper</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                  Pre-Flight Check
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                15-second risk & psychology clearance before clicking submit on your broker.
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Input Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Direction</label>
              <div className="flex bg-[#0E1321] p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setDirection('LONG')}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    direction === 'LONG'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Long
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SHORT')}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    direction === 'SHORT'
                      ? 'bg-rose-500 text-white font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Short
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Market</label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value as any)}
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
              >
                <option value="Crypto">Crypto</option>
                <option value="Stocks">Stocks</option>
                <option value="Forex">Forex</option>
                <option value="Futures">Futures</option>
                <option value="Commodities">Commodities</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Quantity / Size</label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0.0001, parseFloat(e.target.value) || 1))}
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Entry Price</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Stop Loss (Hard SL)</label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs text-rose-300 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Take Profit Target</label>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Current Emotion</label>
              <select
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
              >
                <option value="Disciplined">Disciplined & Calm</option>
                <option value="Confident">Confident</option>
                <option value="Neutral">Neutral</option>
                <option value="FOMO / Impatient">FOMO / Impatient</option>
                <option value="Revenge Trading">Revenge / Frustrated</option>
              </select>
            </div>
          </div>

          {/* Metric Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#0E1321] border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Risk:Reward Ratio</span>
              <div
                className={`text-lg font-black mono-numbers ${
                  isRrValid ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                1 : {riskRewardRatio.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400">
                {isRrValid ? '✅ Target > 1:1.5' : '❌ Below minimum 1:1.5'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E1321] border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Dollar Risk ($)</span>
              <div className="text-lg font-black text-rose-400 mono-numbers">
                -${Math.round(totalRiskUsd).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">{riskPercent.toFixed(2)}% of capital</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E1321] border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Dollar Target ($)</span>
              <div className="text-lg font-black text-emerald-400 mono-numbers">
                +${Math.round(totalRewardUsd).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">Potential gain</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E1321] border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Position Value</span>
              <div className="text-lg font-black text-white mono-numbers">
                ${Math.round(positionSizeUsd).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">{market} Asset</span>
            </div>
          </div>

          {/* Discipline Rule Checkboxes */}
          <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/5 space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Discipline Gatekeeper Checkpoints:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-[#0B0F19] border border-white/5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCheckedNews}
                  onChange={(e) => setHasCheckedNews(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                />
                <span>Economic calendar news release checked (&gt;15 min away)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-[#0B0F19] border border-white/5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasWaitedForConfirmation}
                  onChange={(e) => setHasWaitedForConfirmation(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                />
                <span>Candle close confirmation trigger respected</span>
              </label>
            </div>
          </div>

          {/* AI Verdict Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
              verdict === 'APPROVED'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : verdict === 'CAUTION'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {verdict === 'APPROVED' ? (
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : verdict === 'CAUTION' ? (
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            )}

            <div className="space-y-1">
              <div className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <span>
                  {verdict === 'APPROVED'
                    ? 'TRADE APPROVED ✅ — DISCIPLINE VERIFIED'
                    : verdict === 'CAUTION'
                    ? 'CAUTION ADVISORY ⚠️ — RISK WARNING'
                    : 'VETO BLOCKED 🚫 — DISCIPLINE HAZARD'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {verdict === 'APPROVED'
                  ? 'Setup meets required Risk:Reward (1:' +
                    riskRewardRatio.toFixed(2) +
                    '), position sizing is within limits, and psychology state is disciplined.'
                  : verdict === 'CAUTION'
                  ? 'Some parameters are sub-optimal. Review warnings before placing this trade.'
                  : 'Critical discipline rules violated! Placing this order risks serious drawdown or emotional revenge trading.'}
              </p>
              {ruleFailures.length > 0 && (
                <ul className="text-[11px] text-rose-300/90 list-disc list-inside space-y-0.5 pt-1">
                  {ruleFailures.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#0E1321]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleExecute}
            disabled={verdict === 'VETO_BLOCKED'}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              verdict === 'APPROVED'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95'
                : verdict === 'CAUTION'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{verdict === 'VETO_BLOCKED' ? 'Blocked by Gatekeeper' : 'Log Approved Trade Plan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
