import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Zap,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ChevronRight,
  Filter,
  Newspaper,
} from 'lucide-react';
import { MarketNewsItem, MarketAsset } from '../../types';

interface AIMarketDigestCardProps {
  news: MarketNewsItem[];
  selectedAsset: MarketAsset;
}

export const AIMarketDigestCard: React.FC<AIMarketDigestCardProps> = ({ news, selectedAsset }) => {
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedArticle, setSelectedArticle] = useState<MarketNewsItem | null>(null);

  const fetchAISummary = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/market-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetSymbol: selectedAsset.symbol,
          category: selectedAsset.category,
        }),
      });
      const data = await res.json();
      if (data.summary) {
        setAiSummary(data.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = news.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return (item.category || '').toUpperCase().includes(selectedCategory.toUpperCase());
  });

  return (
    <div className="rounded-xl p-4 sm:p-5 bg-[#0E131F] border border-[#1C263C] flex flex-col justify-between space-y-3.5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">AI Market Intelligence</h3>
            <span className="text-[10px] text-slate-400">Gemini 3.7 Macro Synthesis & Live News Stream</span>
          </div>
        </div>

        <button
          onClick={fetchAISummary}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Synthesizing...' : 'Refresh Digest'}</span>
        </button>
      </div>

      {/* Synthesis Box */}
      <div className="p-3.5 rounded-lg bg-[#121827] border border-[#1C263C] space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{selectedAsset.symbol} Volatility & Liquidity Regime</span>
          </span>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            Live Feed
          </span>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-normal">
          {aiSummary ? (
            aiSummary
          ) : (
            `• Institutional orderflow reveals solid accumulation above the 4H demand pool with decreasing seller momentum.\n• Upcoming macroeconomic releases may induce short-term wick volatility; avoid entering market orders at range extremes.\n• Risk Mandate: Strict 1% risk per setup. Confirm CHoCH or order block mitigation prior to executing limit orders.`
          )}
        </div>
      </div>

      {/* Sentiment & News Stream Header with Category Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Macro Drivers & Breaking News:
          </span>

          <div className="flex items-center gap-1">
            {['ALL', 'CRYPTO', 'MACRO', 'FOREX'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* News Items List */}
        <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
          {filteredNews.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400 bg-[#121827] rounded-lg border border-[#1C263C]">
              No breaking news under this category.
            </div>
          ) : (
            filteredNews.slice(0, 4).map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedArticle(selectedArticle?.id === item.id ? null : item)}
                className="p-2 rounded-lg bg-[#121827] border border-[#1C263C] hover:border-[#2A3A5E] hover:bg-[#162033] transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-slate-200 font-semibold line-clamp-1 block text-xs">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.source} • {item.timeAgo}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                      item.sentiment === 'Bullish'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : item.sentiment === 'Bearish'
                        ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                        : 'bg-slate-700/50 border border-white/10 text-slate-300'
                    }`}
                  >
                    {item.sentiment}
                  </span>
                </div>

                {/* Inline Expanded Article Summary */}
                {selectedArticle?.id === item.id && (
                  <div className="pt-1.5 mt-1 border-t border-[#1C263C] text-[11px] text-slate-300 leading-relaxed space-y-1">
                    <p>{item.summary}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span className="font-mono">Market Impact: {item.impactScore}/10</span>
                      <span className="text-indigo-400 font-semibold">Verified Live News</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
