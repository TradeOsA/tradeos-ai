import React, { useState, useEffect } from 'react';
import {
  X,
  Pencil,
  Save,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Activity,
  Tag,
  FileText,
  Layers,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Trade, TradeDirection, TradeStatus, MarketCategory, TradingStrategy, EmotionBefore } from '../../types';
import { getAssetCurrencySymbol } from '../../utils/currencyUtils';

interface EditTradeModalProps {
  isOpen: boolean;
  trade: Trade | null;
  onClose: () => void;
  onSave: (updatedTrade: Trade) => void;
  onDelete?: (tradeId: string) => void;
}

const STRATEGIES: TradingStrategy[] = [
  'Breakout / Expansion',
  'Support & Resistance Bounce',
  'Order Block / Smart Money (SMC)',
  'Fair Value Gap (FVG)',
  'Trend Following / Pullback',
  'Mean Reversion / Range',
  'Scalp Momentum',
  'Swing Structure',
  'Liquidity Sweep',
];

const MARKETS: MarketCategory[] = ['Crypto', 'Stocks', 'Forex', 'Futures', 'Commodities'];
const STATUSES: TradeStatus[] = ['OPEN', 'WIN', 'LOSS', 'BREAKEVEN'];
const EMOTIONS: EmotionBefore[] = [
  'Disciplined',
  'Confident',
  'Neutral',
  'Fearful',
  'Greedy',
  'FOMO',
  'Rushed',
  'Revenge-Prone',
];

export const EditTradeModal: React.FC<EditTradeModalProps> = ({
  isOpen,
  trade,
  onClose,
  onSave,
  onDelete,
}) => {
  const [symbol, setSymbol] = useState('');
  const [market, setMarket] = useState<MarketCategory>('Crypto');
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [status, setStatus] = useState<TradeStatus>('OPEN');
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [exitPrice, setExitPrice] = useState<number | undefined>(undefined);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [positionSizeUsd, setPositionSizeUsd] = useState<number>(1000);
  const [strategy, setStrategy] = useState<TradingStrategy>('Breakout / Expansion');
  const [emotionBefore, setEmotionBefore] = useState<EmotionBefore>('Disciplined');
  const [notes, setNotes] = useState('');
  const [fees, setFees] = useState<number>(0);
  const [tagsInput, setTagsInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currencySymbol = getAssetCurrencySymbol(symbol, market);

  // Sync state when trade changes
  useEffect(() => {
    if (trade) {
      setShowDeleteConfirm(false);
      setSymbol(trade.symbol);
      setMarket(trade.market);
      setDirection(trade.direction);
      setStatus(trade.status);
      setEntryPrice(trade.entryPrice);
      setExitPrice(trade.exitPrice);
      setStopLoss(trade.stopLoss || 0);
      setTargetPrice(trade.targetPrice || 0);
      setQuantity(trade.quantity || 1);
      setPositionSizeUsd(trade.positionSizeUsd || 1000);
      setStrategy(trade.strategy);
      setEmotionBefore(trade.emotionBefore);
      setNotes(trade.notes || '');
      setFees(trade.fees || 0);
      setTagsInput((trade.tags || []).join(', '));
    }
  }, [trade, isOpen]);

  if (!isOpen || !trade) return null;

  // Auto-calculated metrics
  const riskPerUnit = Math.abs(entryPrice - stopLoss);
  const rewardPerUnit = Math.abs(targetPrice - entryPrice);
  const computedRR =
    riskPerUnit > 0 ? Number((rewardPerUnit / riskPerUnit).toFixed(2)) : trade.riskRewardRatio || 2.0;

  // Computed PnL
  const calculatePnL = () => {
    if (status === 'OPEN' || exitPrice === undefined || exitPrice === 0) {
      return { pnl: trade.pnl, pnlPercent: trade.pnlPercent };
    }
    const rawPnL =
      direction === 'LONG'
        ? (exitPrice - entryPrice) * quantity - fees
        : (entryPrice - exitPrice) * quantity - fees;
    const pnlPct = positionSizeUsd > 0 ? (rawPnL / positionSizeUsd) * 100 : 0;
    return {
      pnl: Number(rawPnL.toFixed(2)),
      pnlPercent: Number(pnlPct.toFixed(2)),
    };
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || entryPrice <= 0) return;

    const { pnl, pnlPercent } = calculatePnL();
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updatedTrade: Trade = {
      ...trade,
      symbol: symbol.toUpperCase().trim(),
      market,
      direction,
      status,
      entryPrice: Number(entryPrice),
      exitPrice: exitPrice ? Number(exitPrice) : undefined,
      stopLoss: Number(stopLoss),
      targetPrice: Number(targetPrice),
      quantity: Number(quantity),
      positionSizeUsd: Number(positionSizeUsd),
      strategy,
      emotionBefore,
      notes,
      fees: Number(fees),
      tags: parsedTags,
      riskRewardRatio: computedRR,
      pnl,
      pnlPercent,
      closeDate:
        status !== 'OPEN' && !trade.closeDate ? new Date().toISOString() : trade.closeDate,
    };

    onSave(updatedTrade);
    onClose();
  };

  return (
    <div
      id="edit-trade-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="glass-panel rounded-2xl sm:rounded-3xl border border-white/10 w-full max-w-2xl bg-[#0B0F19] text-white shadow-2xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/[0.08] bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Trade Editor
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-mono truncate max-w-[100px] sm:max-w-none">
                  ID: {trade.id}
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-white truncate">Edit Trade Position</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
            aria-label="Close trade edit modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form
          onSubmit={handleFormSubmit}
          className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto overscroll-contain flex-1"
        >
          {/* Row 1: Primary Required Fields (Asset Symbol, Market Class) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Asset Symbol */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Asset Symbol <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. BTC/USDT, NVDA, EUR/USD"
                  className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 uppercase transition-all min-h-[42px]"
                />
              </div>
            </div>

            {/* Market Category */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Market Class
              </label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value as MarketCategory)}
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer transition-all min-h-[42px]"
              >
                {MARKETS.map((m) => (
                  <option key={m} value={m} className="bg-[#0B0F19]">
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Side / Direction & Status Toggle Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Side (LONG / SHORT) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Side / Direction <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('LONG')}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer min-h-[42px] active:scale-95 ${
                    direction === 'LONG'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/10'
                      : 'bg-[#0E1321] text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>LONG (Buy)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SHORT')}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer min-h-[42px] active:scale-95 ${
                    direction === 'SHORT'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-md shadow-rose-500/10'
                      : 'bg-[#0E1321] text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  <span>SHORT (Sell)</span>
                </button>
              </div>
            </div>

            {/* Position Status */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Trade Status <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {STATUSES.map((st) => {
                  let activeClass = 'bg-slate-700 text-white border-slate-600 shadow-sm';
                  if (st === 'OPEN') activeClass = 'bg-indigo-500/25 text-indigo-300 border-indigo-500/50 shadow-sm shadow-indigo-500/10';
                  if (st === 'WIN') activeClass = 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/10';
                  if (st === 'LOSS') activeClass = 'bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-500/10';
                  if (st === 'BREAKEVEN') activeClass = 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/10';

                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center min-h-[42px] flex items-center justify-center active:scale-95 ${
                        status === st
                          ? activeClass
                          : 'bg-[#0E1321] text-slate-400 border-white/5 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 3: Entry Price, Exit Price, Stop Loss, Target Price */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Execution & Price Levels
              </span>
              <span className="text-xs text-emerald-400 font-mono font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                R:R 1:{computedRR}
              </span>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Entry Price */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Entry Price ({currencySymbol}) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={entryPrice || ''}
                  onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-[#0E1321] border border-emerald-500/30 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400 min-h-[40px]"
                />
              </div>

              {/* Exit Price */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Exit Price ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={exitPrice ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExitPrice(val === '' ? undefined : parseFloat(val));
                  }}
                  placeholder="Leave blank if open"
                  className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 min-h-[40px]"
                />
              </div>

              {/* Stop Loss */}
              <div>
                <label className="block text-[11px] font-bold text-rose-300 mb-1">
                  Stop Loss ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={stopLoss || ''}
                  onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-[#0E1321] border border-rose-500/30 rounded-xl px-3 py-2 text-sm font-mono text-rose-300 focus:outline-none focus:border-rose-400 min-h-[40px]"
                />
              </div>

              {/* Target Price */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-300 mb-1">
                  Target Price ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={targetPrice || ''}
                  onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-[#0E1321] border border-emerald-500/30 rounded-xl px-3 py-2 text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-400 min-h-[40px]"
                />
              </div>
            </div>

            {/* Position Size & Quantity */}
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Position Size ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={positionSizeUsd || ''}
                  onChange={(e) => setPositionSizeUsd(parseFloat(e.target.value) || 0)}
                  placeholder="1000"
                  className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 min-h-[38px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Quantity / Units
                </label>
                <input
                  type="number"
                  step="any"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  placeholder="1.0"
                  className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 min-h-[38px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Trading Fees ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={fees || ''}
                  onChange={(e) => setFees(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 min-h-[38px]"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Strategy & Emotional State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Trading Strategy Setup
              </label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as TradingStrategy)}
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer min-h-[40px]"
              >
                {STRATEGIES.map((s) => (
                  <option key={s} value={s} className="bg-[#0B0F19]">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Psychological State
              </label>
              <select
                value={emotionBefore}
                onChange={(e) => setEmotionBefore(e.target.value as EmotionBefore)}
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer min-h-[40px]"
              >
                {EMOTIONS.map((em) => (
                  <option key={em} value={em} className="bg-[#0B0F19]">
                    {em}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Tags & Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Breakout, High-Volume, NY-Session, A+ Setup"
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 min-h-[38px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Trade Thesis & Execution Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Document your setup thesis, invalidation reasons, and execution reflections..."
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex flex-col xs:flex-row items-center justify-between gap-2.5 pt-3 sm:pt-4 border-t border-white/[0.08] shrink-0">
            {onDelete ? (
              showDeleteConfirm ? (
                <div className="w-full xs:w-auto flex items-center gap-2 p-1 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                  <span className="text-xs text-rose-300 font-bold px-2">Delete trade?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(trade.id);
                      setShowDeleteConfirm(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-black text-xs transition-all active:scale-95 cursor-pointer shadow-md"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full xs:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-bold transition-all cursor-pointer min-h-[42px]"
                  title="Permanently delete this trade from journal"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Delete Trade</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 w-full xs:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full xs:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer text-center min-h-[42px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full xs:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 min-h-[42px]"
              >
                <Save className="w-4 h-4" />
                <span>Save Trade Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
