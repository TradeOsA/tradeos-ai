import React, { useState } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Tag,
  Trash2,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  Pencil,
  Share2,
  Trophy,
} from 'lucide-react';
import { Trade } from '../../types';
import { formatAssetPrice, getAssetCurrencySymbol } from '../../utils/currencyUtils';

interface TradeDetailModalProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleteTrade: (id: string) => void;
  onAnalyzeWithAI: (trade: Trade) => void;
  onCloseTradeStatus: (tradeId: string, exitPrice: number, status: 'WIN' | 'LOSS' | 'BREAKEVEN') => void;
  onEditTrade?: (trade: Trade) => void;
  onOpenStoryCard?: (trade: Trade) => void;
}

export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({
  trade,
  isOpen,
  onClose,
  onDeleteTrade,
  onAnalyzeWithAI,
  onCloseTradeStatus,
  onEditTrade,
  onOpenStoryCard,
}) => {
  const [closeExitPrice, setCloseExitPrice] = useState<number>(0);
  const [closeStatus, setCloseStatus] = useState<'WIN' | 'LOSS' | 'BREAKEVEN'>('WIN');
  const [showCloseForm, setShowCloseForm] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !trade) return null;

  const isWin = trade.status === 'WIN';
  const isLoss = trade.status === 'LOSS';
  const isBE = trade.status === 'BREAKEVEN';
  const isOpenTrade = trade.status === 'OPEN';

  const currencySymbol = getAssetCurrencySymbol(trade.symbol, trade.market);

  const handleExecuteClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (closeExitPrice > 0) {
      onCloseTradeStatus(trade.id, closeExitPrice, closeStatus);
      setShowCloseForm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#121722] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-slate-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                trade.direction === 'LONG'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
              }`}
            >
              {trade.direction === 'LONG' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">{trade.symbol}</h2>
                <span
                  className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md ${
                    trade.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {trade.direction}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                  {trade.market}
                </span>
              </div>
              <span className="text-xs text-slate-400">{trade.strategy}</span>
            </div>
          </div>

          <span
            className={`text-xs font-black uppercase px-3 py-1 rounded-xl ${
              isWin
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : isLoss
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : isBE
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse'
            }`}
          >
            {trade.status}
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-[#0E121B] border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Entry Price</span>
            <div className="text-sm font-bold text-white mono-numbers">{currencySymbol}{trade.entryPrice.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#0E121B] border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Stop Loss</span>
            <div className="text-sm font-bold text-rose-400 mono-numbers">{currencySymbol}{trade.stopLoss.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#0E121B] border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Target Price</span>
            <div className="text-sm font-bold text-emerald-400 mono-numbers">{currencySymbol}{trade.targetPrice.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#0E121B] border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Risk : Reward</span>
            <div className="text-sm font-bold text-emerald-400 mono-numbers">1:{trade.riskRewardRatio}</div>
          </div>
        </div>

        {/* PnL & Position Value */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#0E121B] border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Net P&L</span>
            <div className={`text-xl font-black mono-numbers ${trade.pnl && trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trade.pnl !== undefined ? `${trade.pnl >= 0 ? '+' : ''}${currencySymbol}${trade.pnl.toLocaleString()} (${trade.pnlPercent?.toFixed(2)}%)` : 'Active Position'}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#0E121B] border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Position Size</span>
            <div className="text-sm font-bold text-white mono-numbers">{currencySymbol}{trade.positionSizeUsd.toLocaleString()} ({trade.quantity} Units)</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#0E121B] border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Emotions</span>
            <div className="text-xs font-semibold text-slate-300">
              Before: <strong>{trade.emotionBefore}</strong>
              {trade.emotionAfter && (
                <div>After: <strong>{trade.emotionAfter}</strong></div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="p-4 rounded-2xl bg-[#0E121B] border border-white/5 space-y-2">
          <span className="text-xs font-bold text-slate-300 block uppercase">Trade Thesis & Journal Notes</span>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
            {trade.notes || 'No pre-trade notes logged.'}
          </p>
          {trade.exitNotes && (
            <div className="pt-2 border-t border-white/5">
              <span className="text-xs font-bold text-emerald-400 block uppercase">Exit Review</span>
              <p className="text-xs text-slate-300 mt-1">{trade.exitNotes}</p>
            </div>
          )}
        </div>

        {/* Screenshot if available */}
        {trade.screenshotUrl && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase">Attached Chart Analysis</span>
            <div className="rounded-2xl overflow-hidden border border-white/10 max-h-60">
              <img src={trade.screenshotUrl} alt="Chart" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Tags */}
        {trade.tags && trade.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {trade.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-md bg-white/5 text-slate-400 text-[10px] font-semibold">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Close Position Subform */}
        {isOpenTrade && showCloseForm && (
          <form onSubmit={handleExecuteClose} className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
            <h4 className="text-xs font-bold text-indigo-300 uppercase">Close Active Position</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Exit Price ({currencySymbol})</label>
                <input
                  type="number"
                  step="any"
                  value={closeExitPrice || ''}
                  onChange={(e) => setCloseExitPrice(Number(e.target.value))}
                  placeholder="e.g. 68500"
                  className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Outcome</label>
                <select
                  value={closeStatus}
                  onChange={(e: any) => setCloseStatus(e.target.value)}
                  className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="WIN">Win</option>
                  <option value="LOSS">Loss</option>
                  <option value="BREAKEVEN">Breakeven</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCloseForm(false)}
                className="px-3 py-1.5 text-xs text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow"
              >
                Confirm Close
              </button>
            </div>
          </form>
        )}

        {/* Bottom Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-white/10 flex-wrap gap-2">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 p-1 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <span className="text-xs text-rose-300 font-bold px-2">Delete permanently?</span>
              <button
                onClick={() => {
                  onDeleteTrade(trade.id);
                  setShowDeleteConfirm(false);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-black text-xs transition-all active:scale-95 cursor-pointer shadow-md"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold p-2 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Entry</span>
            </button>
          )}

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {onOpenStoryCard && (
              <button
                onClick={() => {
                  onOpenStoryCard(trade);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all cursor-pointer active:scale-95"
                title="Generate Instagram / WhatsApp Story Card"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Story Card</span>
              </button>
            )}

            {onEditTrade && (
              <button
                onClick={() => {
                  onEditTrade(trade);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Trade</span>
              </button>
            )}

            {isOpenTrade && !showCloseForm && (
              <button
                onClick={() => setShowCloseForm(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close Trade
              </button>
            )}

            <button
              onClick={() => {
                onAnalyzeWithAI(trade);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Audit with AI Review</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
