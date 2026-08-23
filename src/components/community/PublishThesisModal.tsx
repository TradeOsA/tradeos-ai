import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Clipboard,
  Link as LinkIcon,
  Layers,
  Compass,
  Maximize2,
  AlertCircle
} from 'lucide-react';
import { CommunityPost, MarketCategory, TradeDirection } from '../../types';

interface PublishThesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (newPost: CommunityPost) => void;
  currentUserName: string;
  currentUserAvatar: string;
}

const PRESET_TAGS = [
  'PriceAction',
  'Breakout',
  'SMC',
  'LiveSetup',
  'Educational',
  'Setup',
  'FVG',
  'OrderBlock',
  'LiquiditySweep',
  'Fibonacci',
  'SwingTrade',
  'DayTrade'
];

const TIMEFRAMES = ['5m', '15m', '1H', '4H', '1D', '1W', '4H / 15m', '1D / 1H'];
const MARKETS: MarketCategory[] = ['Crypto', 'Stocks', 'Forex', 'Futures', 'Commodities'];

const SAMPLE_CHART_PRESETS = [
  {
    name: 'Crypto SMC Breakout',
    url: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1000&auto=format&fit=crop&q=80'
  },
  {
    name: 'Institutional Liquidity Sweep',
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1000&auto=format&fit=crop&q=80'
  },
  {
    name: 'Equity Trend Breakdown',
    url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1000&auto=format&fit=crop&q=80'
  },
  {
    name: 'Intraday Candle Range',
    url: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1000&auto=format&fit=crop&q=80'
  }
];

export const PublishThesisModal: React.FC<PublishThesisModalProps> = ({
  isOpen,
  onClose,
  onPublish,
  currentUserName,
  currentUserAvatar
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [market, setMarket] = useState<MarketCategory>('Crypto');
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [timeframe, setTimeframe] = useState('4H');
  const [postType, setPostType] = useState<'Live Setup' | 'Educational' | 'Trade Recap'>('Live Setup');
  const [title, setTitle] = useState('');
  const [thesis, setThesis] = useState('');
  const [riskRewardRatio, setRiskRewardRatio] = useState('1:2.5');
  const [selectedTags, setSelectedTags] = useState<string[]>(['PriceAction', 'LiveSetup']);
  const [customTagInput, setCustomTagInput] = useState('');

  // Image Upload State
  const [uploadMode, setUploadMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [chartUrl, setChartUrl] = useState<string>(
    'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1000&auto=format&fit=crop&q=80'
  );
  const [isDragging, setIsDragging] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [uploadSource, setUploadSource] = useState<string>('Preset');
  const [pasteNotification, setPasteNotification] = useState<string | null>(null);

  // Listen for Clipboard Paste (Ctrl+V / Cmd+V) anywhere inside the modal
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept if user is typing into text fields unless clipboard has an image file
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // 1. Check for image files in clipboardData
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              processFile(file, 'Clipboard Paste');
              return;
            }
          }
        }
      }

      // 2. Check for image URL in text paste when not in another input
      if (!isInput && e.clipboardData) {
        const text = e.clipboardData.getData('text');
        if (
          text &&
          (text.startsWith('http://') || text.startsWith('https://')) &&
          (text.match(/\.(jpeg|jpg|gif|png|webp)/i) ||
            text.includes('tradingview.com') ||
            text.includes('unsplash.com') ||
            text.includes('imgur.com'))
        ) {
          e.preventDefault();
          setChartUrl(text.trim());
          setUploadSource('Pasted URL');
          showToast('Image URL captured from clipboard');
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setPasteNotification(msg);
    setTimeout(() => setPasteNotification(null), 3000);
  };

  const processFile = (file: File, sourceName = 'File Upload') => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setChartUrl(event.target.result as string);
        setUploadSource(sourceName);
        showToast(
          sourceName === 'Clipboard Paste'
            ? '✓ Screenshot pasted from clipboard!'
            : '✓ Chart image loaded successfully!'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], 'Drag & Drop');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], 'File Picker');
    }
  };

  // Direct URL submission
  const handleApplyUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInputValue.trim()) return;
    setChartUrl(urlInputValue.trim());
    setUploadSource('Direct URL');
    showToast('Chart URL applied successfully');
    setUrlInputValue('');
  };

  // Toggle Preset Tag
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Add Custom Tag
  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = customTagInput.replace(/^#/, '').trim();
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags([...selectedTags, clean]);
      setCustomTagInput('');
    }
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !symbol.trim()) return;

    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      authorName: currentUserName,
      authorBadge: 'DISCIPLINED TRADER',
      authorAvatar: currentUserAvatar,
      timeAgo: 'Just now',
      title: title.trim(),
      symbol: symbol.toUpperCase().trim(),
      market,
      direction,
      timeframe,
      entryPrice: 0,
      stopLoss: 0,
      targetPrice: 0,
      riskRewardRatio: riskRewardRatio.trim() || '1:2.5',
      postType,
      thesis: thesis.trim(),
      chartUrl: chartUrl || undefined,
      likes: 1,
      isLiked: true,
      commentsCount: 0,
      comments: [],
      tags: selectedTags.length > 0 ? selectedTags : ['PriceAction', 'LiveSetup'],
      createdAt: 'Just now'
    };

    onPublish(newPost);
    onClose();
  };

  return (
    <div
      id="publish-thesis-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="glass-panel rounded-2xl sm:rounded-3xl border border-white/10 w-full max-w-2xl bg-[#0B0F19] text-white shadow-2xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/[0.08] bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Idea Hub Thesis
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  Interactive Chart Sharing
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">Publish Trade Thesis & Chart</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Close publish modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Toast when Clipboard Screenshot is captured */}
        {pasteNotification && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-2 text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{pasteNotification}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-5 overflow-y-auto overscroll-contain flex-1"
        >
          {/* Section 1: Chart Screenshot Multi-Method Attachment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chart Screenshot Attachment</span>
              </label>

              {/* Upload Method Switcher */}
              <div className="flex items-center bg-[#0E1321] p-0.5 rounded-xl border border-white/10 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setUploadMode('upload')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    uploadMode === 'upload'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  File / Paste (Ctrl+V)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    uploadMode === 'url'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Image URL
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('presets')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    uploadMode === 'presets'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Presets
                </button>
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />

            {/* If a chart is already attached: Show Live Thumbnail Preview with Replace / Remove */}
            {chartUrl ? (
              <div className="relative group rounded-2xl overflow-hidden border border-white/15 bg-[#0E1321] shadow-lg">
                <img
                  src={chartUrl}
                  alt="Chart preview"
                  className="w-full h-48 sm:h-56 object-cover object-center transition-transform group-hover:scale-101 duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/40 flex flex-col justify-between p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>{uploadSource || 'Chart Attached'}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setChartUrl('')}
                      className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 backdrop-blur-md transition-colors cursor-pointer"
                      title="Remove chart screenshot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-[11px] text-slate-300 font-mono hidden sm:block">
                      💡 Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Ctrl+V</kbd> to replace anytime
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                      >
                        Replace File
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* No Chart Attached: Render Selected Upload Mode */
              <>
                {uploadMode === 'upload' && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-500/10 scale-99'
                        : 'border-white/15 bg-[#0E1321]/60 hover:border-emerald-500/50 hover:bg-[#0E1321]'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2.5">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-white mb-1">
                      Drag & Drop chart, <span className="text-emerald-400 underline">Browse files</span>, or Paste (<kbd className="px-1 py-0.2 rounded bg-white/10 text-[10px]">Ctrl+V</kbd>)
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Supports high-resolution TradingView snapshots, Snipping Tool captures, PNG, JPG, or WebP
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300 font-mono">
                      <Clipboard className="w-3 h-3 text-indigo-400" />
                      <span>Direct clipboard paste active</span>
                    </div>
                  </div>
                )}

                {uploadMode === 'url' && (
                  <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/10 space-y-2.5">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Paste TradingView snapshot or Direct Image URL:
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          placeholder="https://www.tradingview.com/x/... or https://..."
                          value={urlInputValue}
                          onChange={(e) => setUrlInputValue(e.target.value)}
                          className="w-full bg-[#0B0F19] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyUrl()}
                        disabled={!urlInputValue.trim()}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-slate-950 font-black text-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        Load Chart
                      </button>
                    </div>
                  </div>
                )}

                {uploadMode === 'presets' && (
                  <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/10 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Select a Sample Analysis Chart Preset:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SAMPLE_CHART_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setChartUrl(p.url);
                            setUploadSource(p.name);
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-[#0B0F19] hover:bg-white/5 border border-white/5 hover:border-emerald-500/40 text-left transition-all cursor-pointer group"
                        >
                          <img
                            src={p.url}
                            alt={p.name}
                            className="w-12 h-10 rounded-lg object-cover ring-1 ring-white/10 shrink-0"
                          />
                          <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white truncate">
                            {p.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Section 2: Structured Trading Parameters */}
          <div className="space-y-3.5 pt-1">
            <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Trade Parameters</span>
              </span>
              <div className="flex items-center gap-1">
                {(['Live Setup', 'Educational', 'Trade Recap'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPostType(type)}
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
                      postType === type
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-white/5 text-slate-400 border-transparent hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 1: Asset Ticker & Market */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Asset / Ticker <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. BTC/USDT, NIFTY 50, NVDA, EUR/USD"
                  className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Market Class
                </label>
                <select
                  value={market}
                  onChange={(e) => setMarket(e.target.value as MarketCategory)}
                  className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {MARKETS.map((m) => (
                    <option key={m} value={m} className="bg-[#0B0F19]">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Direction Toggle, Timeframe, Risk-to-Reward */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Direction Toggle */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Trade Direction
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDirection('LONG')}
                    className={`flex items-center justify-center gap-1 py-2 rounded-xl font-black text-xs border transition-all cursor-pointer ${
                      direction === 'LONG'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm shadow-emerald-500/20'
                        : 'bg-[#0E1321] text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>LONG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('SHORT')}
                    className={`flex items-center justify-center gap-1 py-2 rounded-xl font-black text-xs border transition-all cursor-pointer ${
                      direction === 'SHORT'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm shadow-rose-500/20'
                        : 'bg-[#0E1321] text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>SHORT</span>
                  </button>
                </div>
              </div>

              {/* Timeframe */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Timeframe
                </label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
                >
                  {TIMEFRAMES.map((tf) => (
                    <option key={tf} value={tf} className="bg-[#0B0F19]">
                      {tf}
                    </option>
                  ))}
                </select>
              </div>

              {/* Risk:Reward Ratio */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Risk-to-Reward (R:R)
                </label>
                <input
                  type="text"
                  value={riskRewardRatio}
                  onChange={(e) => setRiskRewardRatio(e.target.value)}
                  placeholder="e.g. 1:2.5, 1:3.0"
                  className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Title & Detailed Analysis */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Setup Headline / Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 4H Bullish FVG Fill & Higher Low Liquidity Sweep"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Technical Analysis Breakdown & Rationale <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={thesis}
                onChange={(e) => setThesis(e.target.value)}
                placeholder="Explain the technical catalyst, entry trigger, invalidation / stop loss reason, and target liquidity pool..."
                className="w-full bg-[#0E1321] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 4: Selectable Tags & Custom Tag Input */}
          <div className="space-y-2 pt-1">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Categorization Tags
            </label>

            {/* Selectable Tag Chips */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-[#0E1321] text-slate-400 border-white/5 hover:text-slate-200 hover:border-white/15'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                    <span>#{tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add custom tag (e.g. InvertedHammer, NiftyExpiry)..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={handleAddCustomTag}
                className="flex-1 bg-[#0E1321] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                disabled={!customTagInput.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tag</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] shrink-0">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
              <span>Selected tags:</span>
              <strong className="text-emerald-400">{selectedTags.length}</strong>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Publish Trade Thesis</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
