import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Upload,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Smile,
  Frown,
  CheckCircle,
  Tag,
  Sparkles
} from 'lucide-react';
import {
  Trade,
  MarketCategory,
  TradeDirection,
  TradeStatus,
  TradingStrategy,
  EmotionBefore,
  EmotionAfter,
} from '../../types';

interface NewTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTrade: (trade: Trade) => void;
  initialDraft?: Partial<Trade> | null;
}

export const NewTradeModal: React.FC<NewTradeModalProps> = ({
  isOpen,
  onClose,
  onSaveTrade,
  initialDraft,
}) => {
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [market, setMarket] = useState<MarketCategory>('Crypto');
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [entryPrice, setEntryPrice] = useState<number>(68000);
  const [exitPrice, setExitPrice] = useState<number | undefined>(undefined);
  const [stopLoss, setStopLoss] = useState<number>(66800);
  const [targetPrice, setTargetPrice] = useState<number>(71000);
  const [quantity, setQuantity] = useState<number>(0.25);
  const [leverage, setLeverage] = useState<number>(1);
  const [fees, setFees] = useState<number>(5.0);
  const [status, setStatus] = useState<TradeStatus>('OPEN');
  const [strategy, setStrategy] = useState<TradingStrategy>('Order Block / Smart Money (SMC)');
  const [notes, setNotes] = useState('');
  const [exitNotes, setExitNotes] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [emotionBefore, setEmotionBefore] = useState<EmotionBefore>('Disciplined');
  const [emotionAfter, setEmotionAfter] = useState<EmotionAfter | undefined>(undefined);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['SMC', 'Discipline']);

  useEffect(() => {
    if (initialDraft) {
      if (initialDraft.symbol) setSymbol(initialDraft.symbol);
      if (initialDraft.direction) setDirection(initialDraft.direction);
      if (initialDraft.entryPrice) setEntryPrice(initialDraft.entryPrice);
      if (initialDraft.stopLoss) setStopLoss(initialDraft.stopLoss);
      if (initialDraft.targetPrice) setTargetPrice(initialDraft.targetPrice);
      if (initialDraft.quantity) setQuantity(initialDraft.quantity);
      if (initialDraft.leverage) setLeverage(initialDraft.leverage);
    }
  }, [initialDraft]);

  if (!isOpen) return null;

  const strategies: TradingStrategy[] = [
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

  const emotionsBeforeList: EmotionBefore[] = [
    'Confident',
    'Disciplined',
    'Neutral',
    'Fearful',
    'Greedy',
    'FOMO',
    'Rushed',
    'Revenge-Prone',
  ];

  const emotionsAfterList: EmotionAfter[] = [
    'Satisfied',
    'Disciplined',
    'Relieved',
    'Regretful',
    'Frustrated',
    'Angry',
    'Neutral',
  ];

  // Calculate position value and R:R
  const positionSizeUsd = entryPrice * quantity;
  const riskDist = Math.abs(entryPrice - stopLoss);
  const rewardDist = Math.abs(targetPrice - entryPrice);
  const riskRewardRatio = riskDist > 0 ? Number((rewardDist / riskDist).toFixed(2)) : 1;

  // Auto compute PnL if closed
  let computedPnL: number | undefined = undefined;
  let computedPnLPercent: number | undefined = undefined;
  if (exitPrice !== undefined && status !== 'OPEN') {
    computedPnL =
      direction === 'LONG'
        ? (exitPrice - entryPrice) * quantity - fees
        : (entryPrice - exitPrice) * quantity - fees;
    computedPnLPercent = positionSizeUsd > 0 ? (computedPnL / positionSizeUsd) * 100 : 0;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((x) => x !== t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrade: Trade = {
      id: `tr-${Date.now()}`,
      symbol: symbol.toUpperCase(),
      market,
      direction,
      entryPrice,
      exitPrice: status !== 'OPEN' ? exitPrice : undefined,
      stopLoss,
      targetPrice,
      quantity,
      positionSizeUsd,
      leverage,
      pnl: computedPnL,
      pnlPercent: computedPnLPercent,
      riskRewardRatio,
      status,
      strategy,
      notes,
      exitNotes: status !== 'OPEN' ? exitNotes : undefined,
      screenshotUrl: screenshotUrl || undefined,
      emotionBefore,
      emotionAfter: status !== 'OPEN' ? emotionAfter : undefined,
      openDate: new Date().toISOString(),
      closeDate: status !== 'OPEN' ? new Date().toISOString() : undefined,
      fees,
      tags,
    };
    onSaveTrade(newTrade);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#121722] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-slate-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Log New Trade Execution</h2>
              <p className="text-xs text-slate-400">Record structured parameters, thesis, risk ratio, and emotional state</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Symbol, Market, Direction, Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Asset Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g. BTC/USDT, NVDA"
                className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white uppercase font-bold focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Market</label>
              <select
                value={market}
                onChange={(e: any) => setMarket(e.target.value)}
                className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
              >
                <option value="Crypto">Crypto</option>
                <option value="Stocks">Stocks</option>
                <option value="Forex">Forex</option>
                <option value="Futures">Futures</option>
                <option value="Commodities">Commodities</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Direction</label>
              <div className="grid grid-cols-2 gap-1 bg-[#0E121B] p-0.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setDirection('LONG')}
                  className={`py-1.5 rounded-lg text-xs font-bold ${
                    direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  LONG
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SHORT')}
                  className={`py-1.5 rounded-lg text-xs font-bold ${
                    direction === 'SHORT' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400'
                  }`}
                >
                  SHORT
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
              >
                <option value="OPEN">Open Position</option>
                <option value="WIN">Closed - Win</option>
                <option value="LOSS">Closed - Loss</option>
                <option value="BREAKEVEN">Closed - Breakeven</option>
              </select>
            </div>
          </div>

          {/* Row 2: Entry, Stop Loss, Target, Quantity */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Entry Price ($)</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white mono-numbers focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Stop Loss ($)</label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3 py-2 text-xs text-rose-400 mono-numbers focus:border-rose-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Take Target ($)</label>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3 py-2 text-xs text-emerald-400 mono-numbers focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Quantity (Units)</label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white mono-numbers focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Row 3 (Conditional for Closed Trades): Exit Price & Fees */}
          {status !== 'OPEN' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Exit Price ($)</label>
                <input
                  type="number"
                  step="any"
                  value={exitPrice || ''}
                  onChange={(e) => setExitPrice(Number(e.target.value))}
                  placeholder="Actual Exit Price"
                  className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white mono-numbers"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Commission & Fees ($)</label>
                <input
                  type="number"
                  step="any"
                  value={fees}
                  onChange={(e) => setFees(Number(e.target.value))}
                  className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white mono-numbers"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Calculated Net P&L</label>
                <div className={`text-sm font-black mono-numbers py-2 ${computedPnL && computedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {computedPnL !== undefined ? `${computedPnL >= 0 ? '+' : ''}$${computedPnL.toFixed(2)} (${computedPnLPercent?.toFixed(2)}%)` : '—'}
                </div>
              </div>
            </div>
          )}

          {/* Strategy & Emotion Before */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Trading Strategy</label>
              <select
                value={strategy}
                onChange={(e: any) => setStrategy(e.target.value)}
                className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
              >
                {strategies.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Emotion BEFORE Entering</label>
              <select
                value={emotionBefore}
                onChange={(e: any) => setEmotionBefore(e.target.value)}
                className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
              >
                {emotionsBeforeList.map((em) => (
                  <option key={em} value={em}>{em}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Trade Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Pre-Trade Thesis & Invalidation Rules</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why did you take this setup? What was the liquidity sweep or market structure trigger?"
              className="w-full bg-[#0E121B] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            ></textarea>
          </div>

          {/* Screenshot Upload / Paste */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Chart Screenshot (URL or Image Upload)</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Paste Image URL (or upload below)"
                value={screenshotUrl}
                onChange={(e) => setScreenshotUrl(e.target.value)}
                className="flex-1 bg-[#0E121B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
              <label className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-slate-300 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            {screenshotUrl && (
              <div className="mt-2 relative rounded-xl overflow-hidden border border-white/10 h-28 max-w-xs">
                <img src={screenshotUrl} alt="Trade chart" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setScreenshotUrl('')}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Custom Tags</label>
            <div className="flex items-center gap-2 mb-1.5">
              <input
                type="text"
                placeholder="Add tag (e.g. 4H-OB, London-Open)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="bg-[#0E121B] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] flex items-center gap-1 font-semibold"
                >
                  #{t}
                  <button type="button" onClick={() => handleRemoveTag(t)}>
                    <X className="w-2.5 h-2.5 hover:text-white" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Calculated R:R Bar */}
          <div className="p-3 rounded-2xl bg-[#0E121B] border border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Risk:Reward Ratio: <strong className="text-emerald-400 mono-numbers">1:{riskRewardRatio}</strong>
            </span>
            <span className="text-slate-400">
              Notional Position: <strong className="text-white mono-numbers">${positionSizeUsd.toLocaleString()}</strong>
            </span>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              Save to Trading Journal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
