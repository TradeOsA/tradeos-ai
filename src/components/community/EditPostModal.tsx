import React, { useState, useEffect, useRef } from 'react';
import { X, Pencil, Save, TrendingUp, TrendingDown, UploadCloud, Trash2, Image as ImageIcon } from 'lucide-react';
import { CommunityPost, MarketCategory, TradeDirection } from '../../types';

interface EditPostModalProps {
  isOpen: boolean;
  post: CommunityPost | null;
  onClose: () => void;
  onSave: (updatedPost: CommunityPost) => void;
}

const MARKETS: MarketCategory[] = ['Crypto', 'Stocks', 'Forex', 'Futures', 'Commodities'];
const TIMEFRAMES = ['5m', '15m', '1H', '4H', '1D', '1W', '4H / 15m', '1D / 1H'];

export const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  post,
  onClose,
  onSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [symbol, setSymbol] = useState('');
  const [market, setMarket] = useState<MarketCategory>('Crypto');
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [timeframe, setTimeframe] = useState('4H');
  const [postType, setPostType] = useState<'Live Setup' | 'Educational' | 'Trade Recap'>('Live Setup');
  const [thesis, setThesis] = useState('');
  const [riskRewardRatio, setRiskRewardRatio] = useState('1:2.5');
  const [tagsInput, setTagsInput] = useState('');
  const [chartUrl, setChartUrl] = useState<string>('');

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSymbol(post.symbol);
      setMarket(post.market || 'Crypto');
      setDirection(post.direction || 'LONG');
      setTimeframe(post.timeframe || '4H');
      setPostType(post.postType || 'Live Setup');
      setThesis(post.thesis || '');
      setRiskRewardRatio(String(post.riskRewardRatio || '1:2.5'));
      setTagsInput((post.tags || []).join(', '));
      setChartUrl(post.chartUrl || '');
    }
  }, [post, isOpen]);

  if (!isOpen || !post) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setChartUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !symbol.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    const updatedPost: CommunityPost = {
      ...post,
      title: title.trim(),
      symbol: symbol.toUpperCase().trim(),
      market,
      direction,
      timeframe,
      postType,
      thesis: thesis.trim(),
      riskRewardRatio,
      chartUrl: chartUrl || undefined,
      tags: parsedTags.length > 0 ? parsedTags : post.tags,
    };

    onSave(updatedPost);
    onClose();
  };

  return (
    <div
      id="edit-post-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="glass-panel rounded-2xl sm:rounded-3xl border border-white/10 w-full max-w-xl bg-[#0B0F19] text-white shadow-2xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/[0.08] bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                Author Management
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">Edit Trade Thesis & Chart</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Close edit post modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto overscroll-contain flex-1">
          {/* Chart Screenshot Section */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Attached Chart Screenshot
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            {chartUrl ? (
              <div className="relative group rounded-xl overflow-hidden border border-white/15 bg-[#0E1321]">
                <img
                  src={chartUrl}
                  alt="Chart preview"
                  className="w-full h-36 object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Change Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartUrl('')}
                    className="p-1.5 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-rose-300 transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-white/20 hover:border-emerald-500/50 rounded-xl p-4 text-center bg-[#0E1321]/60 hover:bg-[#0E1321] transition-all cursor-pointer flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white"
              >
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <span>Upload or replace chart screenshot</span>
              </button>
            )}
          </div>

          {/* Symbol & Market */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Asset / Ticker <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g. ETH/USDT, NVDA"
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Market Class
              </label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value as MarketCategory)}
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {MARKETS.map((m) => (
                  <option key={m} value={m} className="bg-[#0B0F19]">
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Direction & Timeframe */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Direction
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDirection('LONG')}
                  className={`flex items-center justify-center gap-1 py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    direction === 'LONG'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                      : 'bg-[#0E1321] text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>LONG</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SHORT')}
                  className={`flex items-center justify-center gap-1 py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    direction === 'SHORT'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                      : 'bg-[#0E1321] text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>SHORT</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
              >
                {TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf} className="bg-[#0B0F19]">
                    {tf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Thesis Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 4H Bullish FVG Fill & Liquidity Sweep"
              className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Thesis Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Technical Rationale & Invalidation
            </label>
            <textarea
              rows={4}
              required
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              placeholder="Detail your price action setup, risk parameters, and confirmation triggers..."
              className="w-full bg-[#0E1321] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />
          </div>

          {/* R:R & Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Risk-to-Reward (R:R)
              </label>
              <input
                type="text"
                value={riskRewardRatio}
                onChange={(e) => setRiskRewardRatio(e.target.value)}
                placeholder="1:2.5"
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-bold text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="SMC, FVG, Breakout, LiveSetup"
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-400 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Update Thesis</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
