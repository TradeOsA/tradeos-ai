import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Layers,
  ArrowRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Trash2,
  HelpCircle,
  Check
} from 'lucide-react';
import { Trade, MarketCategory, TradeDirection, TradeStatus, TradingStrategy } from '../../types';

interface BrokerCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTrades: (trades: Trade[]) => void;
}

type BrokerPreset =
  | 'AUTO'
  | 'ZERODHA'
  | 'DHAN'
  | 'ANGEL'
  | 'GROWW'
  | 'UPSTOX'
  | 'FYERS'
  | 'BINANCE'
  | 'DELTA'
  | 'MT4_MT5'
  | 'IBKR'
  | 'GENERIC';

interface ParsedRow {
  id: string;
  selected: boolean;
  symbol: string;
  market: MarketCategory;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  positionSizeUsd: number;
  pnl?: number;
  pnlPercent?: number;
  status: TradeStatus;
  strategy: TradingStrategy;
  notes?: string;
  openDate: string;
  closeDate?: string;
  fees?: number;
  tags?: string[];
  isValid: boolean;
  errors: string[];
}

export const BrokerCsvImportModal: React.FC<BrokerCsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportTrades,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<BrokerPreset>('AUTO');
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<'UPLOAD' | 'PREVIEW'>('UPLOAD');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Clean and parse CSV raw text
  const parseCSVContent = (text: string, preset: BrokerPreset) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      alert('CSV file must contain at least a header row and one trade row.');
      return;
    }

    // Split CSV line respecting quoted values
    const splitCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim().replace(/^"|"$/g, ''));
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const dataLines = lines.slice(1);

    // Column finder helper
    const getColIndex = (keywords: string[]) => {
      return headers.findIndex((h) => keywords.some((k) => h.includes(k)));
    };

    const idxSymbol = getColIndex(['symbol', 'instrument', 'pair', 'ticker', 'scrip', 'contract']);
    const idxDate = getColIndex(['date', 'time', 'opentime', 'datetime', 'timestamp', 'executed']);
    const idxCloseDate = getColIndex(['closedate', 'closetime', 'exitdate', 'exittime']);
    const idxSide = getColIndex(['side', 'direction', 'type', 'buysell', 'action', 'order_type']);
    const idxEntry = getColIndex(['entry', 'buyprice', 'openprice', 'price', 'entryprice', 'avgprice']);
    const idxExit = getColIndex(['exit', 'sellprice', 'closeprice', 'exitprice', 'avgexitprice']);
    const idxQty = getColIndex(['qty', 'quantity', 'lots', 'size', 'amount', 'shares', 'units']);
    const idxPnl = getColIndex(['pnl', 'netpnl', 'profit', 'realizedpnl', 'realisedpnl', 'gain']);
    const idxFees = getColIndex(['fee', 'fees', 'commission', 'charges', 'brokerage', 'tax']);
    const idxStrategy = getColIndex(['strategy', 'setup', 'system', 'method']);
    const idxNotes = getColIndex(['note', 'notes', 'remarks', 'comment', 'reason']);
    const idxMarket = getColIndex(['market', 'assetclass', 'segment']);

    const rows: ParsedRow[] = [];

    dataLines.forEach((line, index) => {
      const cols = splitCsvLine(line);
      if (cols.length === 0 || cols.every((c) => c === '')) return;

      const errors: string[] = [];

      // 1. Symbol
      let rawSymbol = idxSymbol !== -1 ? cols[idxSymbol] : cols[0] || 'TRADE';
      rawSymbol = rawSymbol.toUpperCase().trim();
      if (!rawSymbol) errors.push('Symbol is missing');

      // 2. Market classification
      let market: MarketCategory = 'Crypto';
      if (idxMarket !== -1 && cols[idxMarket]) {
        const m = cols[idxMarket].toLowerCase();
        if (m.includes('stock') || m.includes('equity')) market = 'Stocks';
        else if (m.includes('forex') || m.includes('fx')) market = 'Forex';
        else if (m.includes('fut')) market = 'Futures';
        else if (m.includes('comm') || m.includes('gold') || m.includes('oil')) market = 'Commodities';
      } else {
        if (rawSymbol.includes('USDT') || rawSymbol.includes('BTC') || rawSymbol.includes('ETH') || rawSymbol.includes('SOL')) {
          market = 'Crypto';
        } else if (rawSymbol.includes('USD') || rawSymbol.includes('EUR') || rawSymbol.includes('JPY') || rawSymbol.includes('GBP')) {
          market = 'Forex';
        } else if (rawSymbol.includes('NIFTY') || rawSymbol.includes('BANKNIFTY') || rawSymbol.includes('ES') || rawSymbol.includes('NQ')) {
          market = 'Futures';
        } else {
          market = 'Stocks';
        }
      }

      // 3. Direction (LONG / SHORT)
      let direction: TradeDirection = 'LONG';
      if (idxSide !== -1 && cols[idxSide]) {
        const side = cols[idxSide].toLowerCase();
        if (side.includes('short') || side.includes('sell') || side === 's') {
          direction = 'SHORT';
        }
      }

      // 4. Prices & Quantities
      const parseNum = (val: string | undefined): number => {
        if (!val) return 0;
        const cleaned = val.replace(/[^0-9.-]/g, '');
        const n = parseFloat(cleaned);
        return isNaN(n) ? 0 : n;
      };

      const entryPrice = idxEntry !== -1 ? parseNum(cols[idxEntry]) : 100;
      const exitPrice = idxExit !== -1 ? parseNum(cols[idxExit]) : undefined;
      const quantity = idxQty !== -1 ? Math.max(0.001, parseNum(cols[idxQty])) : 1;
      const fees = idxFees !== -1 ? parseNum(cols[idxFees]) : 0;
      let pnl = idxPnl !== -1 ? parseNum(cols[idxPnl]) : undefined;

      // If PnL not given but exit is given, calculate it
      if (pnl === undefined && exitPrice && exitPrice > 0 && entryPrice > 0) {
        if (direction === 'LONG') {
          pnl = (exitPrice - entryPrice) * quantity - fees;
        } else {
          pnl = (entryPrice - exitPrice) * quantity - fees;
        }
      }

      const positionSizeUsd = entryPrice * quantity;

      // Status
      let status: TradeStatus = 'OPEN';
      if (pnl !== undefined && exitPrice && exitPrice > 0) {
        if (pnl > 0.01) status = 'WIN';
        else if (pnl < -0.01) status = 'LOSS';
        else status = 'BREAKEVEN';
      }

      // Strategy
      let strategy: TradingStrategy = 'Support & Resistance Bounce';
      if (idxStrategy !== -1 && cols[idxStrategy]) {
        const strat = cols[idxStrategy];
        if (strat.toLowerCase().includes('smc') || strat.toLowerCase().includes('order')) strategy = 'Order Block / Smart Money (SMC)';
        else if (strat.toLowerCase().includes('break')) strategy = 'Breakout / Expansion';
        else if (strat.toLowerCase().includes('trend')) strategy = 'Trend Following / Pullback';
        else if (strat.toLowerCase().includes('mean') || strat.toLowerCase().includes('revers')) strategy = 'Mean Reversion / Range';
        else if (strat.toLowerCase().includes('fvg') || strat.toLowerCase().includes('gap')) strategy = 'Fair Value Gap (FVG)';
        else if (strat.toLowerCase().includes('sweep') || strat.toLowerCase().includes('liq')) strategy = 'Liquidity Sweep';
      }

      // Dates
      const nowIso = new Date().toISOString();
      const openDate = idxDate !== -1 && cols[idxDate] ? cols[idxDate] : nowIso;
      const closeDate = idxCloseDate !== -1 && cols[idxCloseDate] ? cols[idxCloseDate] : exitPrice ? nowIso : undefined;

      // Notes
      const notes = idxNotes !== -1 ? cols[idxNotes] : `Imported from ${preset} CSV statement`;

      if (entryPrice <= 0) errors.push('Invalid Entry Price');

      rows.push({
        id: `import-${Date.now()}-${index}`,
        selected: errors.length === 0,
        symbol: rawSymbol,
        market,
        direction,
        entryPrice: entryPrice || 100,
        exitPrice: exitPrice && exitPrice > 0 ? exitPrice : undefined,
        quantity,
        positionSizeUsd,
        pnl,
        pnlPercent: positionSizeUsd > 0 && pnl !== undefined ? (pnl / positionSizeUsd) * 100 : undefined,
        status,
        strategy,
        notes,
        openDate,
        closeDate,
        fees,
        tags: ['CSV Import', preset],
        isValid: errors.length === 0,
        errors,
      });
    });

    setParsedRows(rows);
    setStep('PREVIEW');
  };

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setCsvText(content);
        parseCSVContent(content, selectedPreset);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSample = () => {
    const sampleCsv = `Date,Symbol,Market,Side,EntryPrice,ExitPrice,Quantity,PnL,Strategy,Notes
2026-08-16 10:30,BTC/USDT,Crypto,LONG,65400,68200,0.5,1400,"Order Block / Smart Money (SMC)","Clean 4H order block retest"
2026-08-16 14:15,NVDA,Stocks,LONG,124.50,131.20,50,335,"Breakout & Retest","Earnings continuation momentum"
2026-08-17 09:00,EUR/USD,Forex,SHORT,1.0890,1.0820,10000,70,"Fair Value Gap (FVG)","London liquidity sweep"
2026-08-17 11:20,NIFTY 50,Futures,LONG,24500,24720,25,5500,"Trendline Bounce","Gap up continuation"
2026-08-17 15:45,SOL/USDT,Crypto,SHORT,152.00,144.50,15,112.5,"Order Block / Smart Money (SMC)","Rejected at daily resistance"`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'tradeos_sample_trades.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleRowSelection = (id: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const toggleAllSelection = () => {
    const allSelected = parsedRows.every((r) => r.selected);
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));
  };

  const handleFinalImport = () => {
    const selectedTrades: Trade[] = parsedRows
      .filter((r) => r.selected)
      .map((r) => ({
        id: `tr-imp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        symbol: r.symbol,
        market: r.market,
        direction: r.direction,
        entryPrice: r.entryPrice,
        exitPrice: r.exitPrice,
        stopLoss: r.direction === 'LONG' ? r.entryPrice * 0.98 : r.entryPrice * 1.02,
        targetPrice: r.exitPrice || (r.direction === 'LONG' ? r.entryPrice * 1.04 : r.entryPrice * 0.96),
        quantity: r.quantity,
        positionSizeUsd: r.positionSizeUsd,
        leverage: 1,
        pnl: r.pnl,
        pnlPercent: r.pnlPercent,
        riskRewardRatio: 2.0,
        status: r.status,
        strategy: r.strategy,
        notes: r.notes || 'Imported via Broker CSV Sync',
        emotionBefore: 'Disciplined',
        emotionAfter: r.status === 'WIN' ? 'Satisfied' : r.status === 'LOSS' ? 'Reflective' : 'Neutral',
        openDate: r.openDate,
        closeDate: r.closeDate,
        fees: r.fees || 0,
        tags: r.tags || ['CSV Import'],
      }));

    if (selectedTrades.length === 0) {
      alert('Please select at least 1 valid trade to import.');
      return;
    }

    onImportTrades(selectedTrades);
    onClose();
  };

  const selectedCount = parsedRows.filter((r) => r.selected).length;
  const totalImportPnL = parsedRows
    .filter((r) => r.selected && r.pnl !== undefined)
    .reduce((acc, r) => acc + (r.pnl || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0B0F19] border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0E1321]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Broker Statement & CSV Universal Importer</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                  100% Free & Local
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sync trades instantly from Zerodha, Dhan, Angel One, Binance, Bybit, MT4/MT5, or custom CSV.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {step === 'UPLOAD' ? (
            <div className="space-y-6">
              {/* Preset Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Select Broker / Exchange Format
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {[
                    { id: 'AUTO', label: '⚡ Auto-Detect', desc: 'AI universal parser' },
                    { id: 'ZERODHA', label: 'Zerodha Kite', desc: 'Tradebook & P&L CSV' },
                    { id: 'DHAN', label: 'Dhan HQ', desc: 'Orders & Trades CSV' },
                    { id: 'ANGEL', label: 'Angel One', desc: 'SmartAPI Trade Log' },
                    { id: 'GROWW', label: 'Groww', desc: 'Order History CSV' },
                    { id: 'UPSTOX', label: 'Upstox', desc: 'Trade History CSV' },
                    { id: 'FYERS', label: 'Fyers API', desc: 'Tradebook Export' },
                    { id: 'DELTA', label: 'Delta Exchange', desc: 'Crypto F&O / Perps' },
                    { id: 'BINANCE', label: 'Binance / Bybit', desc: 'Spot & Futures CSV' },
                    { id: 'MT4_MT5', label: 'MetaTrader 4 / 5', desc: 'EA / Manual Report' },
                    { id: 'IBKR', label: 'Interactive Brokers', desc: 'Flex query statement' },
                    { id: 'GENERIC', label: 'Standard CSV', desc: 'Pre-formatted schema' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPreset(p.id as BrokerPreset)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedPreset === p.id
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-white shadow-sm'
                          : 'bg-[#0E1321] border-white/5 text-slate-400 hover:text-white hover:border-white/15'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-200 truncate">{p.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 1-Click Quick Demo Loaders */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1-Click Test Data Importer:</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      const sampleZerodha = `Trade Date,Symbol,Exchange,Segment,Type,Quantity,Price,Trade Value,Order ID\n2026-08-25,NIFTY 24500 CE,NFO,OPT,BUY,50,142.50,7125,120000001\n2026-08-25,NIFTY 24500 CE,NFO,OPT,SELL,50,198.00,9900,120000002\n2026-08-25,BANKNIFTY 52000 PE,NFO,OPT,BUY,30,280.00,8400,120000003\n2026-08-25,BANKNIFTY 52000 PE,NFO,OPT,SELL,30,240.00,7200,120000004\n2026-08-25,RELIANCE,NSE,EQ,BUY,25,2950.00,73750,120000005\n2026-08-25,RELIANCE,NSE,EQ,SELL,25,3010.00,75250,120000006`;
                      setCsvText(sampleZerodha);
                      parseCSVContent(sampleZerodha, 'ZERODHA');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    🇮🇳 Zerodha F&O Demo
                  </button>
                  <button
                    onClick={() => {
                      const sampleDhan = `CustomDate,Scrip,Action,Qty,BuyPrice,SellPrice,PnL,Segment\n2026-08-25,FINNIFTY 23000 CE,BUY,80,95.0,128.0,2640,NFO\n2026-08-25,TCS,BUY,10,4100.0,4180.0,800,NSE_EQ\n2026-08-25,HDFCBANK,BUY,20,1620.0,1595.0,-500,NSE_EQ`;
                      setCsvText(sampleDhan);
                      parseCSVContent(sampleDhan, 'DHAN');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    🇮🇳 Dhan / Angel One Demo
                  </button>
                  <button
                    onClick={() => {
                      const sampleBinance = `Date,Symbol,Side,EntryPrice,ExitPrice,Quantity,PnL,Strategy\n2026-08-25,BTC/USDT,LONG,64200,66800,0.45,1170,Breakout Momentum\n2026-08-25,SOL/USDT,LONG,145.2,158.4,15,198,Order Block Retest\n2026-08-25,ETH/USDT,SHORT,3480,3390,2.5,225,Fair Value Gap`;
                      setCsvText(sampleBinance);
                      parseCSVContent(sampleBinance, 'BINANCE');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    🌐 Binance / Bybit Demo
                  </button>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-white/10 bg-[#0E1321]/60 hover:border-emerald-500/50 hover:bg-[#0E1321]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                  <FileText className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {fileName ? fileName : 'Drop your CSV statement here or click to browse'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Supports export files from Zerodha, Binance, MT4, TradingView, Dhan, Angel One, and Excel.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                    Select File (.CSV)
                  </span>
                </div>
              </div>

              {/* Or Paste Raw CSV Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400">
                    Or Paste Raw CSV Data Directly:
                  </label>
                  <button
                    onClick={handleDownloadSample}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Sample CSV Template</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Date,Symbol,Side,EntryPrice,ExitPrice,Quantity,PnL,Strategy&#10;2026-08-16,BTC/USDT,LONG,65400,68200,0.5,1400,SMC&#10;2026-08-16,NVDA,LONG,124.5,131.2,50,335,Breakout"
                  className="w-full bg-[#0E1321] border border-white/10 rounded-2xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {csvText.trim() && (
                <div className="flex justify-end">
                  <button
                    onClick={() => parseCSVContent(csvText, selectedPreset)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer"
                  >
                    <span>Parse & Preview Trades</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: PREVIEW */
            <div className="space-y-4">
              {/* Summary stats bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#0E1321] border border-white/5">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Parsed Trades</div>
                    <div className="text-sm font-bold text-white">
                      {selectedCount} of {parsedRows.length} selected
                    </div>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Estimated Net P&L</div>
                    <div
                      className={`text-sm font-bold mono-numbers ${
                        totalImportPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {totalImportPnL >= 0 ? '+' : ''}${totalImportPnL.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleAllSelection}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {parsedRows.every((r) => r.selected) ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={() => setStep('UPLOAD')}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Upload Another File
                  </button>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0E1321]">
                <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#141C2E] text-[10px] text-slate-400 uppercase font-mono sticky top-0 z-10">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={parsedRows.length > 0 && parsedRows.every((r) => r.selected)}
                            onChange={toggleAllSelection}
                            className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                          />
                        </th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Symbol</th>
                        <th className="p-3">Side</th>
                        <th className="p-3">Entry</th>
                        <th className="p-3">Exit</th>
                        <th className="p-3">Qty</th>
                        <th className="p-3">P&L ($)</th>
                        <th className="p-3">Strategy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {parsedRows.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => toggleRowSelection(row.id)}
                          className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${
                            row.selected ? 'bg-emerald-500/[0.03]' : 'opacity-60'
                          }`}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={() => toggleRowSelection(row.id)}
                              className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-400">
                            {row.openDate.split('T')[0] || row.openDate}
                          </td>
                          <td className="p-3 font-bold text-white">{row.symbol}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                row.direction === 'LONG'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {row.direction}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-300">${row.entryPrice.toLocaleString()}</td>
                          <td className="p-3 font-mono text-slate-300">
                            {row.exitPrice ? `$${row.exitPrice.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-3 font-mono text-slate-400">{row.quantity}</td>
                          <td className="p-3 font-mono font-bold">
                            {row.pnl !== undefined ? (
                              <span className={row.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {row.pnl >= 0 ? '+' : ''}${row.pnl.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="p-3 text-[11px] text-slate-400 truncate max-w-[140px]">
                            {row.strategy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#0E1321]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {step === 'PREVIEW' && (
            <button
              onClick={handleFinalImport}
              disabled={selectedCount === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                selectedCount > 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Import {selectedCount} Trades into Journal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
