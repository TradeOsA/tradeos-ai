import React, { useState, useRef, useEffect } from 'react';
import {
  ScanLine,
  Upload,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Layers,
  BrainCircuit,
  Image as ImageIcon,
  Zap,
  Award,
  Target,
  BarChart2,
  Sliders,
  Copy,
  Check,
  Maximize2,
  Trash2,
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
  FileImage,
  RefreshCw,
} from 'lucide-react';
import { TradeReviewAnalysis, Trade } from '../../types';
import { PageHeader } from '../layout/PageHeader';

interface AITradeReviewViewProps {
  initialTradeToReview?: Trade | null;
  initialSymbol?: string;
  initialPrice?: number;
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
  onSaveToJournal?: (trade: Partial<Trade>) => void;
}

// Quick Sample Presets for instant 1-tap testing
const SAMPLE_PRESETS = [
  {
    name: 'BTC 15m Breakout',
    symbol: 'BTC/USDT',
    direction: 'LONG' as const,
    url: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800&auto=format&fit=crop&q=80',
    notes: 'Bullish order block mitigation with liquidity sweep below Asian low.',
  },
  {
    name: 'ETH 4H Supply FVG',
    symbol: 'ETH/USDT',
    direction: 'SHORT' as const,
    url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&auto=format&fit=crop&q=80',
    notes: 'Testing major 4H Fair Value Gap resistance with bearish divergence.',
  },
  {
    name: 'Gold SMC Liquidity',
    symbol: 'XAU/USD',
    direction: 'LONG' as const,
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
    notes: 'Change of Character (CHoCH) on 1H timeframe at structural demand.',
  },
];

export const AITradeReviewView: React.FC<AITradeReviewViewProps> = ({
  initialTradeToReview,
  initialSymbol,
  initialPrice,
  onBack,
  onNavigateTab,
  onSaveToJournal,
}) => {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(
    initialTradeToReview?.screenshotUrl || null
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tradeSymbol, setTradeSymbol] = useState(initialSymbol || initialTradeToReview?.symbol || 'BTC/USDT');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>(initialTradeToReview?.direction || 'LONG');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [entryPrice, setEntryPrice] = useState<number | string>(initialPrice || initialTradeToReview?.entryPrice || '');
  const [stopLoss, setStopLoss] = useState<number | string>(initialTradeToReview?.stopLoss || '');
  const [targetPrice, setTargetPrice] = useState<number | string>(initialTradeToReview?.targetPrice || '');
  const [strategy, setStrategy] = useState(initialTradeToReview?.strategy || 'Order Block / Smart Money (SMC)');
  const [userNotes, setUserNotes] = useState(initialTradeToReview?.notes || '');

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<TradeReviewAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLevels, setCopiedLevels] = useState(false);
  const [journalSaved, setJournalSaved] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Clipboard Paste listener (Ctrl+V directly on page)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          processFile(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (PNG, JPG, WEBP, or Screenshot).');
      return;
    }
    setErrorMsg(null);
    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleLoadSample = (sample: (typeof SAMPLE_PRESETS)[0]) => {
    setScreenshotUrl(sample.url);
    setFileName(`${sample.name}.png`);
    setFileSize('Sample Preset');
    setTradeSymbol(sample.symbol);
    setDirection(sample.direction);
    setUserNotes(sample.notes);
    setErrorMsg(null);
  };

  const handleClearImage = () => {
    setScreenshotUrl(null);
    setFileName(null);
    setFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRunAnalysis = async () => {
    if (!screenshotUrl) {
      setErrorMsg('Please upload or select a chart screenshot from your gallery first.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setJournalSaved(false);

    try {
      const payload = {
        symbol: tradeSymbol,
        direction,
        entryPrice: entryPrice ? Number(entryPrice) : undefined,
        stopLoss: stopLoss ? Number(stopLoss) : undefined,
        targetPrice: targetPrice ? Number(targetPrice) : undefined,
        strategy,
        notes: userNotes,
        imageBase64: screenshotUrl,
      };

      const res = await fetch('/api/ai/trade-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to audit chart image');
      }

      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        throw new Error('No analysis generated');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error executing AI audit');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLevels = () => {
    if (!analysis?.keyLevels) return;
    const l = analysis.keyLevels;
    const text = `📊 TradeOS AI Key Levels [${l.detectedSymbol || tradeSymbol} | ${l.tradeBias}]:
🟢 Support / Demand: ${l.supportZone}
🔴 Resistance / Supply: ${l.resistanceZone}
🎯 Optimal Entry: ${l.optimalEntry}
🛡️ Invalidation (SL): ${l.invalidationSL}
🏁 Take Profit 1: ${l.takeProfit1}
🚀 Take Profit 2: ${l.takeProfit2}
💡 Key Logic: ${l.keyLogicSummary}`;

    navigator.clipboard.writeText(text);
    setCopiedLevels(true);
    setTimeout(() => setCopiedLevels(false), 2500);
  };

  const handleSendToJournal = () => {
    if (onSaveToJournal && analysis) {
      onSaveToJournal({
        symbol: tradeSymbol,
        direction,
        entryPrice: typeof entryPrice === 'number' ? entryPrice : undefined,
        stopLoss: typeof stopLoss === 'number' ? stopLoss : undefined,
        targetPrice: typeof targetPrice === 'number' ? targetPrice : undefined,
        strategy,
        screenshotUrl: screenshotUrl || undefined,
        notes: `AI Audit Score: ${analysis.scoreOutOf100}/100 (${analysis.disciplineGrade})\n${analysis.keyLevels?.keyLogicSummary || analysis.detectedTrend}`,
      });
      setJournalSaved(true);
    }
  };

  return (
    <div id="ai-trade-review-view" className="space-y-6 pb-12">
      {/* Zoom Modal */}
      {previewZoom && screenshotUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewZoom(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={screenshotUrl}
              alt="Zoomed Chart"
              className="max-h-[85vh] w-auto rounded-xl object-contain border border-white/20 shadow-2xl"
            />
            <button
              onClick={() => setPreviewZoom(false)}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/80 text-white font-bold text-xs border border-white/20 hover:bg-white/20 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="AI Chart Auditor & Key Levels"
        subtitle="Upload a chart screenshot from your gallery or desktop. Gemini Multimodal Vision will automatically detect support, resistance, optimal entry, structural invalidation, and execution logic."
        badge="Multimodal Vision Engine"
        badgeVariant="cyan"
        icon={ScanLine}
        breadcrumbs={[{ label: 'Chart Auditor', tab: 'ai-review' }]}
        onBack={onBack}
        onNavigateTab={onNavigateTab}
        actionSlot={
          <button
            id="run-ai-review-btn"
            onClick={handleRunAnalysis}
            disabled={loading || !screenshotUrl}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Auditing Chart Vision...' : 'Audit Chart & Get Levels'}</span>
          </button>
        }
      />

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Upload & Controls on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Upload & Quick Inputs */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Upload Box */}
          <div className="rounded-xl p-5 bg-[#0E131F] border border-[#1C263C] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1C263C] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Upload Chart Screenshot</h3>
                  <p className="text-[10px] text-slate-400">Gallery, Camera, or Paste (Ctrl+V)</p>
                </div>
              </div>
              {screenshotUrl && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {/* Dropzone or Image Preview */}
            {!screenshotUrl ? (
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
                    : 'border-[#283654] hover:border-emerald-500/50 bg-[#121827] hover:bg-[#162033]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Click to Browse Gallery / Screenshot
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mb-3">
                  Drag and drop your trading chart here, or paste directly with <strong>Ctrl+V</strong>
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-emerald-300">
                  <FileImage className="w-3 h-3" />
                  <span>Supports TradingView, MT4/5, Mobile & Desktop Screenshots</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active Image Card */}
                <div className="relative rounded-xl overflow-hidden border border-[#1C263C] bg-[#121827] group">
                  <img
                    src={screenshotUrl}
                    alt="Chart preview"
                    className="w-full h-52 object-cover object-center"
                  />
                  {/* Floating Action Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(true)}
                      className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md cursor-pointer border border-white/20"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Zoom View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Change Image</span>
                    </button>
                  </div>
                  {/* Bottom Meta Bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-300 border-t border-white/10">
                    <span className="truncate max-w-[200px] font-mono">{fileName || 'Chart Image Uploaded'}</span>
                    <span className="font-mono text-emerald-400 font-bold">{fileSize || 'Active'}</span>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Quick Demo Sample Presets */}
            {!screenshotUrl && (
              <div className="space-y-2 pt-1 border-t border-[#1C263C]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Or Test Instantly with Sample Setups:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {SAMPLE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleLoadSample(preset)}
                      className="p-2 rounded-lg bg-[#121827] hover:bg-[#162033] border border-[#1C263C] hover:border-emerald-500/40 text-left transition-all text-[11px] cursor-pointer"
                    >
                      <span className="font-bold text-white block truncate">{preset.name}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">{preset.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Trade Direction & Symbol Bar */}
          <div className="rounded-xl p-4 bg-[#0E131F] border border-[#1C263C] space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Asset Symbol</label>
                <input
                  type="text"
                  value={tradeSymbol}
                  onChange={(e) => setTradeSymbol(e.target.value)}
                  placeholder="BTC/USDT, GOLD, NIFTY..."
                  className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white font-bold font-mono focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Trade Bias</label>
                <div className="grid grid-cols-2 gap-1 bg-[#121827] p-1 rounded-lg border border-[#1C263C]">
                  <button
                    type="button"
                    onClick={() => setDirection('LONG')}
                    className={`py-1 rounded text-xs font-black transition-all cursor-pointer ${
                      direction === 'LONG'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    LONG
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('SHORT')}
                    className={`py-1 rounded text-xs font-black transition-all cursor-pointer ${
                      direction === 'SHORT'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    SHORT
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible Advanced Parameters */}
            <div className="border-t border-[#1C263C] pt-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-white py-1 cursor-pointer"
              >
                <span>Optional: Custom Entry, SL & Target Prices</span>
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showAdvanced && (
                <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-mono">Entry Price ($)</label>
                      <input
                        type="number"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(e.target.value)}
                        placeholder="Auto"
                        className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-rose-400 mb-1 font-mono">Stop Loss ($)</label>
                      <input
                        type="number"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        placeholder="Auto"
                        className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-2 py-1.5 text-xs text-rose-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-emerald-400 mb-1 font-mono">Target ($)</label>
                      <input
                        type="number"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        placeholder="Auto"
                        className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-2 py-1.5 text-xs text-emerald-400 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Trader Notes / Context</label>
                    <textarea
                      rows={2}
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      placeholder="Optional notes or timeframe context..."
                      className="w-full bg-[#121827] border border-[#1C263C] rounded-lg p-2 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Execute Audit Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={loading || !screenshotUrl}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Analyzing Structure & Extracting Levels...' : 'Audit Chart & Calculate Levels'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Key Levels & Institutional Report */}
        <div className="lg:col-span-7 space-y-4">
          {analysis ? (
            <div className="rounded-xl p-5 sm:p-6 bg-[#0E131F] border border-[#1C263C] space-y-5 animate-in fade-in duration-300">
              {/* Header Verdict & Score */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C263C] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 uppercase">
                      Grade: {analysis.disciplineGrade}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {analysis.keyLevels?.detectedSymbol || tradeSymbol}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{analysis.overallVerdict}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2.5 rounded-xl bg-[#121827] border border-[#1C263C] text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Score</span>
                    <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                      <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                        {analysis.scoreOutOf100}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">/100</span>
                    </div>
                  </div>
                  {analysis.calculatedRR && (
                    <div className="px-4 py-2.5 rounded-xl bg-[#121827] border border-[#1C263C] text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">R:R Ratio</span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono block mt-0.5">
                        {analysis.calculatedRR}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ⭐ CORE HIGHLIGHT: EXACT KEY LEVELS MATRIX */}
              {analysis.keyLevels && (
                <div className="rounded-xl p-4 bg-[#121827] border-2 border-emerald-500/30 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-black text-white">Actionable Key Levels & Execution Matrix</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyLevels}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                      >
                        {copiedLevels ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLevels ? 'Copied!' : 'Copy Levels'}</span>
                      </button>
                      {onSaveToJournal && (
                        <button
                          type="button"
                          onClick={handleSendToJournal}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-[11px] font-bold text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/30"
                        >
                          <BookOpenCheck className="w-3.5 h-3.5" />
                          <span>{journalSaved ? 'Saved to Journal' : 'Save to Journal'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Level Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Optimal Entry */}
                    <div className="p-3 rounded-lg bg-[#0E131F] border border-emerald-500/25 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                          🎯 Recommended Entry Zone
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300">
                          Primary Trigger
                        </span>
                      </div>
                      <p className="text-xs font-black text-white font-mono">{analysis.keyLevels.optimalEntry}</p>
                    </div>

                    {/* Invalidation Stop Loss */}
                    <div className="p-3 rounded-lg bg-[#0E131F] border border-rose-500/25 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">
                          🛡️ Structural Invalidation (Stop Loss)
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300">
                          Hard Stop
                        </span>
                      </div>
                      <p className="text-xs font-black text-rose-300 font-mono">{analysis.keyLevels.invalidationSL}</p>
                    </div>

                    {/* Take Profit 1 */}
                    <div className="p-3 rounded-lg bg-[#0E131F] border border-[#1C263C] space-y-1">
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                        🏁 Take Profit 1 (Conservative)
                      </span>
                      <p className="text-xs font-black text-white font-mono">{analysis.keyLevels.takeProfit1}</p>
                    </div>

                    {/* Take Profit 2 */}
                    <div className="p-3 rounded-lg bg-[#0E131F] border border-[#1C263C] space-y-1">
                      <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider block">
                        🚀 Take Profit 2 (Extended Expansion)
                      </span>
                      <p className="text-xs font-black text-white font-mono">{analysis.keyLevels.takeProfit2}</p>
                    </div>

                    {/* Support Zone */}
                    <div className="p-3 rounded-lg bg-[#0E131F] border border-[#1C263C] space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        📦 Key Support / Demand Block
                      </span>
                      <p className="text-xs text-slate-200">{analysis.keyLevels.supportZone}</p>
                    </div>

                    {/* Resistance Zone */}
                    <div className="p-3 rounded-lg bg-[#0E131F] border border-[#1C263C] space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        🧱 Key Resistance / Supply FVG
                      </span>
                      <p className="text-xs text-slate-200">{analysis.keyLevels.resistanceZone}</p>
                    </div>
                  </div>

                  {/* Core Trading Logic Summary Box */}
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                    <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1.5">
                      <BrainCircuit className="w-3.5 h-3.5" />
                      Institutional Logic & Why These Levels Matter
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {analysis.keyLevels.keyLogicSummary}
                    </p>
                  </div>
                </div>
              )}

              {/* Rubric Score Breakdown */}
              {analysis.rubricBreakdown && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-400" />
                    Auditor Score Breakdown
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-lg bg-[#121827] border border-[#1C263C] space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Structure Alignment</span>
                      <span className="text-xs font-black text-emerald-400 block font-mono">
                        {analysis.rubricBreakdown.structureScore}/25
                      </span>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{ width: `${(analysis.rubricBreakdown.structureScore / 25) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#121827] border border-[#1C263C] space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Invalidation Quality</span>
                      <span className="text-xs font-black text-emerald-400 block font-mono">
                        {analysis.rubricBreakdown.invalidationScore}/25
                      </span>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{ width: `${(analysis.rubricBreakdown.invalidationScore / 25) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#121827] border border-[#1C263C] space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Risk:Reward Ratio</span>
                      <span className="text-xs font-black text-indigo-400 block font-mono">
                        {analysis.rubricBreakdown.riskRewardScore}/25
                      </span>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-400 h-full rounded-full"
                          style={{ width: `${(analysis.rubricBreakdown.riskRewardScore / 25) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#121827] border border-[#1C263C] space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Execution Discipline</span>
                      <span className="text-xs font-black text-amber-400 block font-mono">
                        {analysis.rubricBreakdown.disciplineScore}/25
                      </span>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{ width: `${(analysis.rubricBreakdown.disciplineScore / 25) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detected Market Dynamics: Trend & S/R */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-[#121827] border border-[#1C263C] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Trend & Directional Bias</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysis.detectedTrend}</p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#121827] border border-[#1C263C] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Market Structure (BOS / CHoCH)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysis.detectedMarketStructure}</p>
                </div>
              </div>

              {/* Detected Flaws / Mistakes to Avoid */}
              {analysis.detectedMistakes && analysis.detectedMistakes.length > 0 && (
                <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/25 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Execution Flaws & Pitfalls to Avoid</span>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {analysis.detectedMistakes.map((mistake, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actionable Educational Takeaways */}
              {analysis.actionableSuggestions && analysis.actionableSuggestions.length > 0 && (
                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Action Plan to Maximize Win Probability</span>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {analysis.actionableSuggestions.map((sugg, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{sugg}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="text-[10px] text-slate-500 text-center italic border-t border-[#1C263C] pt-3">
                {analysis.disclaimer}
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-8 bg-[#0E131F] border border-[#1C263C] flex flex-col items-center justify-center text-center space-y-4 min-h-[440px]">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-inner">
                <ScanLine className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h4 className="text-base font-bold text-white">No Active Chart Audit Yet</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload a screenshot of any chart from your <strong>gallery, camera, or paste (Ctrl+V)</strong> and click <strong>Audit Chart & Get Levels</strong>.
                </p>
                <p className="text-[11px] text-emerald-400 font-bold">
                  Gemini Vision will automatically identify exact Support, Resistance, Optimal Entry, Invalidation (SL), and TP targets with SMC logic.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
