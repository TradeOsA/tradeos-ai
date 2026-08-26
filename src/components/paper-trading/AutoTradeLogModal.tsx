import React, { useState } from 'react';
import {
  ListFilter,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Layers,
  Trash2,
  X,
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Download,
  Info,
} from 'lucide-react';
import { AutoTradeLogItem, TradeDirection } from '../../types';

interface AutoTradeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AutoTradeLogItem[];
  onClearLogs: () => void;
  onNavigateToPosition?: (symbol: string) => void;
}

export const AutoTradeLogModal: React.FC<AutoTradeLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  onNavigateToPosition,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'FILLED' | 'LIMIT_QUEUED' | 'SKIPPED'>('ALL');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredLogs = logs.filter((item) => {
    if (filter === 'FILLED' && item.status !== 'FILLED') return false;
    if (filter === 'LIMIT_QUEUED' && item.status !== 'LIMIT_QUEUED') return false;
    if (filter === 'SKIPPED' && item.status !== 'SKIPPED_FILTER') return false;
    if (search.trim() && !item.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filledCount = logs.filter((l) => l.status === 'FILLED').length;
  const queuedCount = logs.filter((l) => l.status === 'LIMIT_QUEUED').length;
  const skippedCount = logs.filter((l) => l.status === 'SKIPPED_FILTER').length;

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tradeos-autotrade-audit-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0B101D] border border-teal-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0F1626] border-b border-[#1C263C] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Zap className="w-5 h-5 fill-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base sm:text-lg">
                  Paper Trading Automated Backtester & Signal Audit Log
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Paper Audit Trail
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Transparent mathematical audit log of every evaluated bot signal and automated paper execution.
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

        {/* Stats Row */}
        <div className="p-4 bg-[#0D1424] border-b border-[#1C263C] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-2.5 rounded-xl bg-[#121827] border border-[#1C263C]">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Total Evaluated</span>
            <span className="text-base font-black text-white">{logs.length} Signals</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#121827] border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 font-mono block uppercase">⚡ Market Fills</span>
            <span className="text-base font-black text-emerald-400">{filledCount} Executed</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#121827] border border-indigo-500/30">
            <span className="text-[10px] text-indigo-300 font-mono block uppercase">🎯 Limit Orders</span>
            <span className="text-base font-black text-indigo-300">{queuedCount} Queued</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#121827] border border-slate-700">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">🛡️ Filtered Out</span>
            <span className="text-base font-black text-slate-400">{skippedCount} Filtered</span>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="p-4 bg-[#0B101D] border-b border-[#1C263C] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'ALL', label: `All (${logs.length})` },
              { id: 'FILLED', label: `Market Fills (${filledCount})` },
              { id: 'LIMIT_QUEUED', label: `Limit Queued (${queuedCount})` },
              { id: 'SKIPPED', label: `Filtered (${skippedCount})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filter === t.id
                    ? 'bg-teal-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#121827] text-slate-400 hover:text-white border border-[#1C263C]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search symbol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#121827] border border-[#1C263C] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 w-36 sm:w-48"
              />
            </div>

            <button
              onClick={handleExportJSON}
              title="Export Log as JSON"
              className="p-1.5 rounded-lg bg-[#121827] border border-[#1C263C] text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            {logs.length > 0 && (
              <button
                onClick={onClearLogs}
                title="Clear all audit logs"
                className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Logs List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 space-y-3 text-slate-500">
              <Zap className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
              <p className="text-sm font-bold text-slate-400">No Auto-Trade events in this filter.</p>
              <p className="text-xs max-w-md mx-auto text-slate-500">
                When the Sentinel Auto-Trader is ON, any incoming high-confidence breakout or SMC alert will be evaluated and logged here automatically!
              </p>
            </div>
          ) : (
            filteredLogs.map((item) => {
              const isFilled = item.status === 'FILLED';
              const isQueued = item.status === 'LIMIT_QUEUED';
              const isSkipped = item.status === 'SKIPPED_FILTER';
              const isLong = item.direction === 'LONG';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                    isFilled
                      ? 'bg-emerald-500/5 border-emerald-500/40'
                      : isQueued
                      ? 'bg-indigo-500/5 border-indigo-500/40'
                      : 'bg-[#0E131F] border-[#1C263C] opacity-80'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                          isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {item.direction}
                      </span>

                      <span className="font-black text-white text-sm tracking-tight">{item.symbol}</span>

                      <span className="text-xs text-slate-400 font-mono">@{item.entryPrice.toLocaleString()}</span>

                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1C263C] text-slate-300">
                        {item.signalType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.timestamp}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isFilled
                            ? 'bg-emerald-500 text-slate-950'
                            : isQueued
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isFilled ? '⚡ AUTO FILLED' : isQueued ? '🎯 LIMIT QUEUED' : '🛡️ FILTERED'}
                      </span>
                    </div>
                  </div>

                  {/* Summary / Logic description */}
                  <div className="p-2.5 rounded-lg bg-[#0A0E17] border border-[#1A2234] text-xs font-mono text-slate-300">
                    <div className="flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div>{item.executionLogicSummary}</div>
                        {item.rejectionReason && (
                          <div className="text-rose-400 text-[11px] font-sans">
                            <strong>Reason Filtered:</strong> {item.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Execution Metrics Row */}
                  {(isFilled || isQueued) && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono pt-1">
                      <div className="p-1.5 rounded bg-[#121827]">
                        <span className="text-[9px] text-slate-500 block font-sans">Allocated Margin</span>
                        <span className="font-bold text-white">${item.marginUsed.toFixed(2)} ({item.leverage}x)</span>
                      </div>
                      <div className="p-1.5 rounded bg-[#121827]">
                        <span className="text-[9px] text-slate-500 block font-sans">Stop Loss (SL)</span>
                        <span className="font-bold text-rose-400">${item.stopLoss.toLocaleString()}</span>
                      </div>
                      <div className="p-1.5 rounded bg-[#121827]">
                        <span className="text-[9px] text-slate-500 block font-sans">Target (TP2)</span>
                        <span className="font-bold text-emerald-400">${item.takeProfit.toLocaleString()}</span>
                      </div>
                      <div className="p-1.5 rounded bg-[#121827]">
                        <span className="text-[9px] text-slate-500 block font-sans">Risk:Reward</span>
                        <span className="font-bold text-teal-300">1:{item.riskReward}</span>
                      </div>
                      <div className="p-1.5 rounded bg-[#121827]">
                        <span className="text-[9px] text-slate-500 block font-sans">Confidence & Grade</span>
                        <span className="font-bold text-amber-300">{item.confidenceScore}% (Grade {item.setupGrade})</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0F1626] border-t border-[#1C263C] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Automated by <strong>TradeOS Sentinel Engine</strong> with anti-fakeout filters.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all cursor-pointer"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
