import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  IndianRupee,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Percent,
  TrendingUp,
  TrendingDown,
  Shield,
  Layers,
  Sparkles,
  Info,
  DollarSign,
} from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { CryptoTaxReport } from '../../types';

interface IndianCryptoTaxViewProps {
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const IndianCryptoTaxView: React.FC<IndianCryptoTaxViewProps> = ({
  onBack,
  onNavigateTab,
}) => {
  const [financialYear, setFinancialYear] = useState<string>('FY 2026-27 (AY 2027-28)');
  const [usdtRate, setUsdtRate] = useState<number>(91.5);
  const [salesTurnoverUsd, setSalesTurnoverUsd] = useState<number>(45000);
  const [costBasisUsd, setCostBasisUsd] = useState<number>(33000);
  const [tdsDeductedUsd, setTdsDeductedUsd] = useState<number>(450); // 1% of sales
  const [otherIncomeSlab, setOtherIncomeSlab] = useState<string>('Above 15 Lakhs (30% Slab)');

  // Mathematical Calculations under Section 115BBH & Section 194S of Indian Income Tax Act
  const grossTurnoverInr = salesTurnoverUsd * usdtRate;
  const costBasisInr = costBasisUsd * usdtRate;
  const realizedGainUsd = Math.max(0, salesTurnoverUsd - costBasisUsd);
  const realizedGainInr = realizedGainUsd * usdtRate;

  // 30% Flat Tax on VDA (Virtual Digital Assets)
  const flatTax30 = realizedGainInr * 0.3;
  // 4% Health and Education Cess on tax
  const cess4 = flatTax30 * 0.04;
  const totalTaxLiabilityInr = flatTax30 + cess4;

  // 1% TDS under Section 194S
  const actualTdsInr = salesTurnoverUsd * 0.01 * usdtRate;
  // Net Tax payable after TDS adjustment
  const netTaxPayableAfterTdsInr = Math.max(0, totalTaxLiabilityInr - actualTdsInr);
  const inHandProfitInr = realizedGainInr - totalTaxLiabilityInr;
  const inHandProfitUsd = inHandProfitInr / (usdtRate || 1);
  const effectiveTaxRate = realizedGainInr > 0 ? (totalTaxLiabilityInr / realizedGainInr) * 100 : 0;

  const handleExportTaxReport = () => {
    const reportText = `=====================================================
TRADEOS TERMINAL — INDIAN CRYPTO TAX COMPUTATION REPORT
Financial Year: ${financialYear}
Generated on: ${new Date().toLocaleString()}
Compliance Standard: Section 115BBH & Section 194S (Income Tax Act)
=====================================================

1. TURNOVER & COST BASIS
- Total Sales Turnover (USD): $${salesTurnoverUsd.toLocaleString()}
- Applied USDT/INR Rate: ₹${usdtRate}
- Total Sales Turnover (INR): ₹${grossTurnoverInr.toLocaleString()}
- Total Purchase Cost (INR): ₹${costBasisInr.toLocaleString()}
- Gross Realized Gain (INR): ₹${realizedGainInr.toLocaleString()}

2. TAX BREAKDOWN (VDA CAPITAL GAINS)
- Flat 30% Tax (Sec 115BBH): ₹${flatTax30.toLocaleString()}
- 4% Health & Education Cess: ₹${cess4.toLocaleString()}
- TOTAL TAX LIABILITY: ₹${totalTaxLiabilityInr.toLocaleString()}

3. TDS ADJUSTMENT (SEC 194S - 1% ON SALE)
- 1% TDS Deducted on Transfers: ₹${actualTdsInr.toLocaleString()}
- NET REMAINING TAX PAYABLE: ₹${netTaxPayableAfterTdsInr.toLocaleString()}

4. FINAL IN-HAND EARNINGS
- Net In-Hand Profit (INR): ₹${inHandProfitInr.toLocaleString()}
- Net In-Hand Profit (USD): $${inHandProfitUsd.toFixed(2)}
- Effective Tax Rate: ${effectiveTaxRate.toFixed(2)}%

CRITICAL COMPLIANCE NOTES:
* As per Section 115BBH, losses from one crypto asset CANNOT be set off against gains from another crypto asset or any other income.
* No deduction of any expenditure (like internet, software, or exchange fees except cost of acquisition) is allowable.
* 1% TDS credit must be claimed in Annual ITR (ITR-2 / ITR-3) using Form 26AS / AIS.
=====================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TradeosAi-CryptoTaxReport-${financialYear.replace(/\s+/g, '')}.txt`;
    link.click();
  };

  return (
    <div id="indian-crypto-tax-main" className="space-y-6 pb-20 max-w-[1600px] mx-auto animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Indian Crypto Tax & 1% TDS Matrix"
        subtitle="Comprehensive institutional tax engine under Union Budget Section 115BBH (30% Flat Tax) and Section 194S (1% TDS on VDA transfers)."
        badge="FY 2026-27 Compliant • Form 26AS Ready"
        badgeVariant="emerald"
        icon={IndianRupee}
        breadcrumbs={[
          { label: 'Terminal', tab: 'dashboard' },
          { label: 'Risk Center', tab: 'risk-center' },
          { label: 'Crypto Tax Matrix', tab: 'tax' },
        ]}
        onBack={onBack}
        onNavigateTab={onNavigateTab}
        actionSlot={
          <button
            onClick={handleExportTaxReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CA Filing Report</span>
          </button>
        }
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-xl bg-[#0E131F] border border-[#1C263C] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Realized Gains
            </span>
            <div className="text-2xl font-bold text-emerald-400 mono-numbers mt-0.5">
              ₹{realizedGainInr.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">${realizedGainUsd.toLocaleString()} USD</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-xl bg-[#0E131F] border border-[#1C263C] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Total Tax (30% + 4% Cess)
            </span>
            <div className="text-2xl font-bold text-rose-400 mono-numbers mt-0.5">
              ₹{totalTaxLiabilityInr.toLocaleString()}
            </div>
            <span className="text-[10px] text-rose-400 font-bold">Effective Rate: {effectiveTaxRate.toFixed(1)}%</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-xl bg-[#0E131F] border border-[#1C263C] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              1% Section 194S TDS
            </span>
            <div className="text-2xl font-bold text-amber-400 mono-numbers mt-0.5">
              ₹{actualTdsInr.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">Deducted at source</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-xl bg-[#0E131F] border border-[#1C263C] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Net In-Hand Profit
            </span>
            <div className="text-2xl font-bold text-white mono-numbers mt-0.5">
              ₹{inHandProfitInr.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">${inHandProfitUsd.toFixed(2)} USD</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Input Form & Detailed Computation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Form Inputs */}
        <div className="lg:col-span-1 bg-[#0E131F] p-5 rounded-xl border border-[#1C263C] space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Tax Parameters</h3>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">Assessment Year</label>
              <select
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#121827] border border-[#1C263C] text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="FY 2026-27 (AY 2027-28)">FY 2026-27 (Current)</option>
                <option value="FY 2025-26 (AY 2026-27)">FY 2025-26</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="text-[11px] font-semibold text-slate-300 uppercase">USDT / INR Rate</label>
                <span className="font-mono text-emerald-400 font-bold">₹{usdtRate}</span>
              </div>
              <input
                type="number"
                step="0.1"
                value={usdtRate}
                onChange={(e) => setUsdtRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#121827] border border-[#1C263C] text-xs font-mono font-semibold text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">Total Sales / Sell Value (USD)</label>
              <input
                type="number"
                value={salesTurnoverUsd}
                onChange={(e) => setSalesTurnoverUsd(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#121827] border border-[#1C263C] text-xs font-mono font-semibold text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 uppercase">Purchase Cost Basis (USD)</label>
              <input
                type="number"
                value={costBasisUsd}
                onChange={(e) => setCostBasisUsd(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#121827] border border-[#1C263C] text-xs font-mono font-semibold text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-300 font-bold mb-0.5">Important Tax Law Notice:</strong>
              Under Section 115BBH, <strong>loss in Coin A cannot be set off against profit in Coin B</strong>. Tax is payable on gross positive gains.
            </div>
          </div>
        </div>

        {/* Right Computation Matrix */}
        <div className="lg:col-span-2 bg-[#0E131F] p-5 rounded-xl border border-[#1C263C] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Itemized Computation Matrix</h3>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md font-mono font-semibold border border-emerald-500/20">
              ITR-2 / ITR-3 Ready
            </span>
          </div>

          <div className="space-y-2.5 divide-y divide-[#1C263C]/50 font-mono text-xs">
            <div className="flex items-center justify-between py-1.5 text-slate-300">
              <span>Gross Crypto Consideration (Sales Turnover):</span>
              <strong className="text-white text-sm font-semibold">₹{grossTurnoverInr.toLocaleString()}</strong>
            </div>

            <div className="flex items-center justify-between py-1.5 text-slate-300">
              <span>Less: Allowable Cost of Acquisition:</span>
              <strong className="text-slate-400 text-sm font-semibold">₹{costBasisInr.toLocaleString()}</strong>
            </div>

            <div className="flex items-center justify-between py-1.5 text-emerald-400 font-bold bg-emerald-500/5 px-3 rounded-lg">
              <span>Net Taxable Capital Gain (Sec 115BBH):</span>
              <strong className="text-emerald-400 text-sm">₹{realizedGainInr.toLocaleString()}</strong>
            </div>

            <div className="flex items-center justify-between py-1.5 text-slate-300">
              <span>Flat Tax @ 30%:</span>
              <strong className="text-rose-400 text-sm font-semibold">₹{flatTax30.toLocaleString()}</strong>
            </div>

            <div className="flex items-center justify-between py-1.5 text-slate-300">
              <span>Health & Education Cess @ 4% of Tax:</span>
              <strong className="text-rose-400 text-sm font-semibold">₹{cess4.toLocaleString()}</strong>
            </div>

            <div className="flex items-center justify-between py-1.5 text-rose-400 font-bold bg-rose-500/5 px-3 rounded-lg">
              <span>Gross Tax Liability:</span>
              <strong className="text-rose-400 text-sm">₹{totalTaxLiabilityInr.toLocaleString()}</strong>
            </div>

            <div className="flex items-center justify-between py-1.5 text-amber-300">
              <span>Less: 1% TDS Deducted by Exchanges (Form 26AS):</span>
              <strong className="text-amber-400 text-sm font-semibold">-₹{actualTdsInr.toLocaleString()}</strong>
            </div>

            <div className="flex items-center justify-between py-2.5 text-white font-bold text-sm bg-[#121827] px-3.5 rounded-lg border border-[#1C263C]">
              <span>Final In-Hand Profit Retained:</span>
              <strong className="text-emerald-400 text-base font-bold">₹{inHandProfitInr.toLocaleString()} (${inHandProfitUsd.toFixed(2)})</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
