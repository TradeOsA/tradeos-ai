import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Trade } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  userName?: string;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  trades,
  userName = 'Institutional Trader',
}) => {
  const { formatCurrency, currency } = useCurrency();
  const [reportRange, setReportRange] = useState<'ALL' | '30D' | '90D'>('ALL');
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Filter trades based on date range
  const now = new Date();
  const filteredTrades = trades.filter((t) => {
    if (reportRange === 'ALL') return true;
    const tradeDate = new Date(t.openDate);
    const diffDays = (now.getTime() - tradeDate.getTime()) / (1000 * 3600 * 24);
    if (reportRange === '30D') return diffDays <= 30;
    if (reportRange === '90D') return diffDays <= 90;
    return true;
  });

  const closedTrades = filteredTrades.filter((t) => t.status !== 'OPEN');
  const winningTrades = closedTrades.filter((t) => t.status === 'WIN');
  const losingTrades = closedTrades.filter((t) => t.status === 'LOSS');
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  const totalGains = winningTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const totalLosses = Math.abs(losingTrades.reduce((acc, t) => acc + (t.pnl || 0), 0));
  const netPnL = totalGains - totalLosses;
  const profitFactor = totalLosses > 0 ? (totalGains / totalLosses).toFixed(2) : totalGains > 0 ? 'MAX' : '0.00';

  const avgWin = winningTrades.length > 0 ? totalGains / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
  const expectancy = closedTrades.length > 0 ? (totalGains - totalLosses) / closedTrades.length : 0;

  // Strategy breakdown
  const strategyStats: Record<string, { count: number; pnl: number; winRate: number }> = {};
  filteredTrades.forEach((t) => {
    const s = t.strategy || 'General';
    if (!strategyStats[s]) strategyStats[s] = { count: 0, pnl: 0, winRate: 0 };
    strategyStats[s].count += 1;
    strategyStats[s].pnl += t.pnl || 0;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0B0F19] border border-white/10 shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-full print:bg-white print:text-black">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0E1321] print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Executive Trading Performance Audit</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                  PDF Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Printable verification report for prop firm evaluations, mentors, and personal records.
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

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#0C101B] border-b border-white/5 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Audit Period:</span>
            <div className="flex bg-[#0B0F19] p-1 rounded-xl border border-white/10">
              {(['ALL', '30D', '90D'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setReportRange(range)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportRange === range
                      ? 'bg-indigo-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range === 'ALL' ? 'All Time' : range === '30D' ? 'Last 30 Days' : 'Last 90 Days'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>

        {/* Printable Audit Paper Content */}
        <div
          ref={reportRef}
          className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar bg-[#0B0F19] print:bg-white print:text-black print:p-8"
        >
          {/* Official Document Banner */}
          <div className="flex items-start justify-between border-b border-white/10 print:border-gray-300 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white print:text-black tracking-tight">
                  TRADE<span className="text-emerald-400 print:text-emerald-600">OS</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 print:bg-gray-100 print:text-gray-800 font-mono font-bold">
                  VERIFIED AUDIT REPORT
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                Institutional Risk & Execution Performance Audit
              </p>
            </div>
            <div className="text-right text-xs text-slate-400 print:text-gray-600 space-y-0.5">
              <div>
                <strong className="text-white print:text-black">Trader:</strong> {userName}
              </div>
              <div>
                <strong className="text-white print:text-black">Generated:</strong>{' '}
                {new Date().toLocaleDateString()}
              </div>
              <div>
                <strong className="text-white print:text-black">Base Currency:</strong> {currency}
              </div>
            </div>
          </div>

          {/* Core Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:gap-4">
            <div className="p-4 rounded-2xl bg-[#0E1321] print:bg-gray-50 border border-white/5 print:border-gray-200">
              <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold uppercase block">
                Net Realized P&L
              </span>
              <div
                className={`text-xl font-black mono-numbers ${
                  netPnL >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'
                }`}
              >
                {formatCurrency(netPnL, { showPlusSign: true })}
              </div>
              <span className="text-[10px] text-slate-500 print:text-gray-600">
                {closedTrades.length} trades closed
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E1321] print:bg-gray-50 border border-white/5 print:border-gray-200">
              <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold uppercase block">
                Win Rate
              </span>
              <div className="text-xl font-black text-emerald-400 print:text-emerald-700 mono-numbers">
                {winRate.toFixed(1)}%
              </div>
              <span className="text-[10px] text-slate-500 print:text-gray-600">
                {winningTrades.length}W / {losingTrades.length}L
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E1321] print:bg-gray-50 border border-white/5 print:border-gray-200">
              <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold uppercase block">
                Profit Factor
              </span>
              <div className="text-xl font-black text-indigo-400 print:text-indigo-700 mono-numbers">
                {profitFactor}
              </div>
              <span className="text-[10px] text-slate-500 print:text-gray-600">
                Gains: {formatCurrency(totalGains)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E1321] print:bg-gray-50 border border-white/5 print:border-gray-200">
              <span className="text-[10px] text-slate-400 print:text-gray-500 font-bold uppercase block">
                Trade Expectancy
              </span>
              <div className="text-xl font-black text-white print:text-black mono-numbers">
                {formatCurrency(expectancy, { showPlusSign: true })}
              </div>
              <span className="text-[10px] text-slate-500 print:text-gray-600">Per trade edge</span>
            </div>
          </div>

          {/* Strategy Breakdown Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-white print:text-black uppercase tracking-wider">
              Strategy Setup Breakdown
            </h3>
            <div className="border border-white/10 print:border-gray-300 rounded-2xl overflow-hidden bg-[#0E1321] print:bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141C2E] print:bg-gray-100 text-[10px] text-slate-400 print:text-gray-600 uppercase font-mono">
                  <tr>
                    <th className="p-3">Strategy Setup</th>
                    <th className="p-3">Executions</th>
                    <th className="p-3">Net Return</th>
                    <th className="p-3">Performance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-gray-200 text-slate-300 print:text-gray-800">
                  {Object.entries(strategyStats).map(([strat, stat]) => (
                    <tr key={strat}>
                      <td className="p-3 font-semibold text-white print:text-black">{strat}</td>
                      <td className="p-3 font-mono">{stat.count} trades</td>
                      <td className="p-3 font-mono font-bold">
                        <span className={stat.pnl >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}>
                          {formatCurrency(stat.pnl, { showPlusSign: true })}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            stat.pnl >= 0
                              ? 'bg-emerald-500/20 text-emerald-300 print:bg-emerald-50 print:text-emerald-800'
                              : 'bg-rose-500/20 text-rose-300 print:bg-rose-50 print:text-rose-800'
                          }`}
                        >
                          {stat.pnl >= 0 ? 'Profitable Edge' : 'Drawdown Phase'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Executions Audit Trail */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-white print:text-black uppercase tracking-wider">
              Recent Trade Execution Log
            </h3>
            <div className="border border-white/10 print:border-gray-300 rounded-2xl overflow-hidden bg-[#0E1321] print:bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141C2E] print:bg-gray-100 text-[10px] text-slate-400 print:text-gray-600 uppercase font-mono">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Symbol</th>
                    <th className="p-3">Side</th>
                    <th className="p-3">Entry</th>
                    <th className="p-3">Exit</th>
                    <th className="p-3">P&L</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-gray-200 text-slate-300 print:text-gray-800">
                  {filteredTrades.slice(0, 10).map((t) => (
                    <tr key={t.id}>
                      <td className="p-3 font-mono text-[11px] text-slate-400 print:text-gray-600">
                        {t.openDate.split('T')[0]}
                      </td>
                      <td className="p-3 font-bold text-white print:text-black">{t.symbol}</td>
                      <td className="p-3 font-mono text-[11px]">{t.direction}</td>
                      <td className="p-3 font-mono">${t.entryPrice.toLocaleString()}</td>
                      <td className="p-3 font-mono">
                        {t.exitPrice ? `$${t.exitPrice.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 font-mono font-bold">
                        {t.pnl !== undefined ? (
                          <span className={t.pnl >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}>
                            {formatCurrency(t.pnl, { showPlusSign: true })}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3 font-bold text-[10px]">{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Verification Seal */}
          <div className="pt-4 border-t border-white/10 print:border-gray-300 flex items-center justify-between text-xs text-slate-500 print:text-gray-600">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 print:text-emerald-700" />
              <span>Certified algorithmic calculation via TradeOS Engine.</span>
            </div>
            <div className="font-mono text-[10px]">Document ID: AUD-{Date.now().toString(36).toUpperCase()}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-white/10 bg-[#0E1321] print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
