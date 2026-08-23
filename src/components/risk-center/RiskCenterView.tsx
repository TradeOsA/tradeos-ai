import React, { useState } from 'react';
import {
  Calculator,
  ShieldCheck,
  Percent,
  TrendingUp,
  AlertTriangle,
  Send,
  Zap,
  ArrowRight,
  RefreshCw,
  Sliders,
  DollarSign,
  PieChart,
  TrendingDown
} from 'lucide-react';
import { UserProfile, TradeDirection, MarketCategory } from '../../types';
import { PageHeader } from '../layout/PageHeader';

interface RiskCenterViewProps {
  user: UserProfile;
  onSendToJournalDraft?: (draft: {
    symbol?: string;
    direction?: TradeDirection;
    entryPrice?: number;
    stopLoss?: number;
    targetPrice?: number;
    quantity?: number;
    positionSizeUsd?: number;
    leverage?: number;
  }) => void;
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
}

type CalculatorTab =
  | 'position-size'
  | 'risk-per-trade'
  | 'risk-reward'
  | 'margin'
  | 'liquidation'
  | 'pnl'
  | 'compound'
  | 'drawdown';

export const RiskCenterView: React.FC<RiskCenterViewProps> = ({
  user,
  onSendToJournalDraft,
  onBack,
  onNavigateTab,
}) => {
  const [activeCalc, setActiveCalc] = useState<CalculatorTab>('position-size');

  // 1. Position Size State
  const [psAccountBalance, setPsAccountBalance] = useState<number>(user.accountBalance);
  const [psRiskPercent, setPsRiskPercent] = useState<number>(user.defaultRiskPercent);
  const [psEntryPrice, setPsEntryPrice] = useState<number>(68000);
  const [psStopLoss, setPsStopLoss] = useState<number>(66800);
  const [psTargetPrice, setPsTargetPrice] = useState<number>(71000);
  const [psDirection, setPsDirection] = useState<TradeDirection>('LONG');

  // 2. Risk Per Trade State
  const [rptCapital, setRptCapital] = useState<number>(25000);
  const [rptMaxDollarLoss, setRptMaxDollarLoss] = useState<number>(250);
  const [rptPriceDistance, setRptPriceDistance] = useState<number>(1200);

  // 3. Risk Reward State
  const [rrEntry, setRrEntry] = useState<number>(100);
  const [rrStopLoss, setRrStopLoss] = useState<number>(95);
  const [rrTarget1, setRrTarget1] = useState<number>(110);
  const [rrTarget2, setRrTarget2] = useState<number>(115);
  const [rrTarget3, setRrTarget3] = useState<number>(125);

  // 4. Margin State
  const [marginAssetPrice, setMarginAssetPrice] = useState<number>(3500);
  const [marginUnits, setMarginUnits] = useState<number>(2);
  const [marginLeverage, setMarginLeverage] = useState<number>(10);

  // 5. Liquidation State
  const [liqEntryPrice, setLiqEntryPrice] = useState<number>(68000);
  const [liqLeverage, setLiqLeverage] = useState<number>(20);
  const [liqDirection, setLiqDirection] = useState<TradeDirection>('LONG');
  const [liqMaintenanceMarginRate, setLiqMaintenanceMarginRate] = useState<number>(0.5); // 0.5%

  // 6. PnL State
  const [pnlEntry, setPnlEntry] = useState<number>(150);
  const [pnlExit, setPnlExit] = useState<number>(175);
  const [pnlQuantity, setPnlQuantity] = useState<number>(100);
  const [pnlFeePercent, setPnlFeePercent] = useState<number>(0.075);
  const [pnlDirection, setPnlDirection] = useState<TradeDirection>('LONG');

  // 7. Compound Growth State
  const [compInitial, setCompInitial] = useState<number>(10000);
  const [compRate, setCompRate] = useState<number>(3); // 3% per month
  const [compMonths, setCompMonths] = useState<number>(24);
  const [compMonthlyAddition, setCompMonthlyAddition] = useState<number>(200);

  // 8. Drawdown Recovery State
  const [drawdownPercent, setDrawdownPercent] = useState<number>(25);

  // Calculations:
  // 1. Position Size
  const psRiskAmount = (psAccountBalance * psRiskPercent) / 100;
  const psStopDistance = Math.abs(psEntryPrice - psStopLoss);
  const psUnits = psStopDistance > 0 ? psRiskAmount / psStopDistance : 0;
  const psPositionValue = psUnits * psEntryPrice;
  const psRewardDistance = Math.abs(psTargetPrice - psEntryPrice);
  const psCalculatedRR = psStopDistance > 0 ? (psRewardDistance / psStopDistance).toFixed(2) : '0';

  // 2. Risk Per Trade
  const rptUnits = rptPriceDistance > 0 ? rptMaxDollarLoss / rptPriceDistance : 0;
  const rptRiskPercentOfCapital = ((rptMaxDollarLoss / rptCapital) * 100).toFixed(2);

  // 3. Risk Reward
  const rrRisk = Math.abs(rrEntry - rrStopLoss);
  const rrR1 = rrRisk > 0 ? ((rrTarget1 - rrEntry) / rrRisk).toFixed(2) : '0';
  const rrR2 = rrRisk > 0 ? ((rrTarget2 - rrEntry) / rrRisk).toFixed(2) : '0';
  const rrR3 = rrRisk > 0 ? ((rrTarget3 - rrEntry) / rrRisk).toFixed(2) : '0';
  const rrBreakevenWinRate = rrRisk > 0 ? ((1 / (1 + Number(rrR1))) * 100).toFixed(1) : '50.0';

  // 4. Margin
  const totalNotional = marginAssetPrice * marginUnits;
  const initialMarginReq = totalNotional / marginLeverage;
  const maintenanceMargin = totalNotional * 0.005;

  // 5. Liquidation Price
  // For Long: Entry * (1 - (1/Leverage) + MMR)
  // For Short: Entry * (1 + (1/Leverage) - MMR)
  const liqMMR = liqMaintenanceMarginRate / 100;
  const calculatedLiqPrice =
    liqDirection === 'LONG'
      ? liqEntryPrice * (1 - 1 / liqLeverage + liqMMR)
      : liqEntryPrice * (1 + 1 / liqLeverage - liqMMR);
  const distanceToLiqPercent = Math.abs((liqEntryPrice - calculatedLiqPrice) / liqEntryPrice) * 100;

  // 6. PnL
  const grossPnL =
    pnlDirection === 'LONG'
      ? (pnlExit - pnlEntry) * pnlQuantity
      : (pnlEntry - pnlExit) * pnlQuantity;
  const totalTradingVolume = (pnlEntry * pnlQuantity) + (pnlExit * pnlQuantity);
  const estimatedFees = (totalTradingVolume * pnlFeePercent) / 100;
  const netPnL = grossPnL - estimatedFees;
  const pnlROI = ((netPnL / (pnlEntry * pnlQuantity)) * 100).toFixed(2);

  // 7. Compound Growth Table
  const compoundSchedule = [];
  let currentBalance = compInitial;
  for (let m = 1; m <= compMonths; m++) {
    const interest = currentBalance * (compRate / 100);
    currentBalance += interest + compMonthlyAddition;
    if (m % 3 === 0 || m === compMonths) {
      compoundSchedule.push({
        month: m,
        balance: Math.round(currentBalance),
        interestEarned: Math.round(interest),
      });
    }
  }

  // 8. Drawdown Recovery Formula: (1 / (1 - Loss%)) - 1
  const recoveryGainRequired =
    drawdownPercent < 100 ? (((1 / (1 - drawdownPercent / 100)) - 1) * 100).toFixed(1) : 'Infinite';

  return (
    <div className="space-y-6 pb-12">
      {/* Universal Page Header with Breadcrumbs */}
      <PageHeader
        title="Risk Matrix & Position Sizing"
        subtitle="Mathematical capital defense calculations to eliminate guesswork, enforce invalidation discipline, and safeguard account longevity."
        badge="8 Institutional Calculators"
        badgeVariant="emerald"
        icon={Calculator}
        breadcrumbs={[
          { label: 'Risk Matrix', tab: 'risk-center' },
          { label: activeCalc.replace('-', ' ').toUpperCase() },
        ]}
        onBack={onBack}
        onNavigateTab={onNavigateTab}
        actionSlot={
          <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-xs text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px]">
              Risk Ceiling: <strong className="text-emerald-400">{user.defaultRiskPercent}% / trade</strong>
            </span>
          </div>
        }
      />

      {/* Calculator Tab Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'position-size', label: 'Position Size' },
          { id: 'risk-per-trade', label: 'Risk Per Trade' },
          { id: 'risk-reward', label: 'Risk / Reward' },
          { id: 'margin', label: 'Margin Req.' },
          { id: 'liquidation', label: 'Liquidation Price' },
          { id: 'pnl', label: 'Profit & Loss' },
          { id: 'compound', label: 'Compound Growth' },
          { id: 'drawdown', label: 'Drawdown Recovery' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCalc(tab.id as CalculatorTab)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCalc === tab.id
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'bg-[#0E131F] text-slate-400 hover:text-white border border-[#1C263C]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Calculator Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Input Form */}
        <div className="lg:col-span-7 bg-[#0E131F] rounded-xl p-5 border border-[#1C263C] space-y-4 shadow-sm">
          {/* 1. Position Size Calculator */}
          {activeCalc === 'position-size' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1C263C] pb-3">
                <h3 className="font-bold text-sm text-white">Position Size Calculator</h3>
                <div className="flex items-center gap-1 bg-[#121827] p-1 rounded-lg border border-[#1C263C]">
                  <button
                    onClick={() => setPsDirection('LONG')}
                    className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                      psDirection === 'LONG' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    LONG
                  </button>
                  <button
                    onClick={() => setPsDirection('SHORT')}
                    className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                      psDirection === 'SHORT' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    SHORT
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Balance ($)</label>
                  <input
                    type="number"
                    value={psAccountBalance}
                    onChange={(e) => setPsAccountBalance(Number(e.target.value))}
                    className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white mono-numbers focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Risk Percentage (%)</label>
                    <span className="text-xs font-bold text-emerald-400 mono-numbers">{psRiskPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.25"
                    max="5.0"
                    step="0.25"
                    value={psRiskPercent}
                    onChange={(e) => setPsRiskPercent(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Entry Price ($)</label>
                  <input
                    type="number"
                    value={psEntryPrice}
                    onChange={(e) => setPsEntryPrice(Number(e.target.value))}
                    className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white mono-numbers focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stop Loss ($)</label>
                  <input
                    type="number"
                    value={psStopLoss}
                    onChange={(e) => setPsStopLoss(Number(e.target.value))}
                    className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white mono-numbers focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Take Profit Target ($)</label>
                  <input
                    type="number"
                    value={psTargetPrice}
                    onChange={(e) => setPsTargetPrice(Number(e.target.value))}
                    className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white mono-numbers focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Risk Per Trade Calculator */}
          {activeCalc === 'risk-per-trade' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-white border-b border-white/10 pb-3">Risk Per Trade Calculator</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Total Trading Capital ($)</label>
                  <input
                    type="number"
                    value={rptCapital}
                    onChange={(e) => setRptCapital(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max Tolerable Loss ($)</label>
                  <input
                    type="number"
                    value={rptMaxDollarLoss}
                    onChange={(e) => setRptMaxDollarLoss(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stop Loss Distance ($)</label>
                  <input
                    type="number"
                    value={rptPriceDistance}
                    onChange={(e) => setRptPriceDistance(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mono-numbers"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Risk Reward Calculator */}
          {activeCalc === 'risk-reward' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-white border-b border-white/10 pb-3">Risk / Reward Calculator</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Entry Price ($)</label>
                  <input
                    type="number"
                    value={rrEntry}
                    onChange={(e) => setRrEntry(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stop Loss ($)</label>
                  <input
                    type="number"
                    value={rrStopLoss}
                    onChange={(e) => setRrStopLoss(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mono-numbers"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target 1 ($)</label>
                  <input
                    type="number"
                    value={rrTarget1}
                    onChange={(e) => setRrTarget1(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target 2 ($)</label>
                  <input
                    type="number"
                    value={rrTarget2}
                    onChange={(e) => setRrTarget2(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target 3 ($)</label>
                  <input
                    type="number"
                    value={rrTarget3}
                    onChange={(e) => setRrTarget3(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white mono-numbers"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Margin Calculator */}
          {activeCalc === 'margin' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-white border-b border-white/10 pb-3">Margin Requirement Calculator</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Asset Price ($)</label>
                  <input
                    type="number"
                    value={marginAssetPrice}
                    onChange={(e) => setMarginAssetPrice(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Position Quantity (Units)</label>
                  <input
                    type="number"
                    value={marginUnits}
                    onChange={(e) => setMarginUnits(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Leverage (x)</label>
                  <select
                    value={marginLeverage}
                    onChange={(e) => setMarginLeverage(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mono-numbers"
                  >
                    {[1, 2, 5, 10, 20, 50, 100].map((lev) => (
                      <option key={lev} value={lev}>
                        {lev}x
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 5. Liquidation Calculator */}
          {activeCalc === 'liquidation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-bold text-base text-white">Liquidation Price Calculator</h3>
                <div className="flex items-center gap-1 bg-[#0E121B] p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setLiqDirection('LONG')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      liqDirection === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    LONG
                  </button>
                  <button
                    onClick={() => setLiqDirection('SHORT')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      liqDirection === 'SHORT' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    SHORT
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Entry Price ($)</label>
                  <input
                    type="number"
                    value={liqEntryPrice}
                    onChange={(e) => setLiqEntryPrice(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Leverage ({liqLeverage}x)</label>
                  <input
                    type="range"
                    min="2"
                    max="100"
                    step="1"
                    value={liqLeverage}
                    onChange={(e) => setLiqLeverage(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. PnL Calculator */}
          {activeCalc === 'pnl' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-bold text-base text-white">Profit & Loss (PnL) Calculator</h3>
                <div className="flex items-center gap-1 bg-[#0E121B] p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setPnlDirection('LONG')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      pnlDirection === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    LONG
                  </button>
                  <button
                    onClick={() => setPnlDirection('SHORT')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      pnlDirection === 'SHORT' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    SHORT
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Entry Price ($)</label>
                  <input
                    type="number"
                    value={pnlEntry}
                    onChange={(e) => setPnlEntry(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Exit Price ($)</label>
                  <input
                    type="number"
                    value={pnlExit}
                    onChange={(e) => setPnlExit(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity (Units)</label>
                  <input
                    type="number"
                    value={pnlQuantity}
                    onChange={(e) => setPnlQuantity(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mono-numbers"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 7. Compound Growth Calculator */}
          {activeCalc === 'compound' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-white border-b border-white/10 pb-3">Compound Growth Simulator</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Starting Balance ($)</label>
                  <input
                    type="number"
                    value={compInitial}
                    onChange={(e) => setCompInitial(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Expected Return (%)</label>
                  <input
                    type="number"
                    value={compRate}
                    onChange={(e) => setCompRate(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    value={compMonths}
                    onChange={(e) => setCompMonths(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Capital Addition ($)</label>
                  <input
                    type="number"
                    value={compMonthlyAddition}
                    onChange={(e) => setCompMonthlyAddition(Number(e.target.value))}
                    className="w-full bg-[#0E121B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white mono-numbers"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 8. Drawdown Recovery Calculator */}
          {activeCalc === 'drawdown' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-white border-b border-white/10 pb-3">Drawdown Recovery Calculator</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Account Loss Percentage (%)</label>
                  <span className="text-base font-bold text-rose-400 mono-numbers">-{drawdownPercent}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="90"
                  step="5"
                  value={drawdownPercent}
                  onChange={(e) => setDrawdownPercent(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Results Display Card */}
        <div className="lg:col-span-5 bg-[#0E131F] rounded-xl p-5 border border-[#1C263C] space-y-4 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#1C263C] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Calculated Metrics</span>
              <span className="text-[10px] text-slate-500 font-semibold">Realtime Math Engine</span>
            </div>

            {/* Position Size Results */}
            {activeCalc === 'position-size' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-[#121827] border border-[#1C263C] space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Optimal Position Size</span>
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mono-numbers">
                    {psUnits.toFixed(4)} <span className="text-xs text-slate-400 font-medium">Units</span>
                  </div>
                  <span className="text-xs text-slate-400 mono-numbers">
                    Total Position Value: <strong>${psPositionValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#121827] border border-[#1C263C] space-y-0.5">
                    <span className="text-slate-500 font-medium">Risk Amount</span>
                    <div className="text-rose-400 font-bold mono-numbers text-sm">-${psRiskAmount.toFixed(2)}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#121827] border border-[#1C263C] space-y-0.5">
                    <span className="text-slate-500 font-medium">Risk:Reward</span>
                    <div className="text-emerald-400 font-bold mono-numbers text-sm">1:{psCalculatedRR}</div>
                  </div>
                </div>

                {onSendToJournalDraft && (
                  <button
                    onClick={() =>
                      onSendToJournalDraft({
                        direction: psDirection,
                        entryPrice: psEntryPrice,
                        stopLoss: psStopLoss,
                        targetPrice: psTargetPrice,
                        quantity: Number(psUnits.toFixed(4)),
                        positionSizeUsd: Number(psPositionValue.toFixed(2)),
                        leverage: 1,
                      })
                    }
                    className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Parameters to Trade Journal Draft</span>
                  </button>
                )}
              </div>
            )}

            {/* Risk Per Trade Results */}
            {activeCalc === 'risk-per-trade' && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#0E121B] border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">Max Lot / Unit Size</span>
                  <div className="text-3xl font-black text-emerald-400 mono-numbers">{rptUnits.toFixed(4)} Units</div>
                  <span className="text-xs text-slate-400">
                    Represents <strong>{rptRiskPercentOfCapital}%</strong> of total account capital
                  </span>
                </div>
              </div>
            )}

            {/* Risk Reward Results */}
            {activeCalc === 'risk-reward' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#0E121B] border border-white/10 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target 1 R:R:</span>
                    <span className="font-bold text-emerald-400 mono-numbers">1:{rrR1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target 2 R:R:</span>
                    <span className="font-bold text-emerald-400 mono-numbers">1:{rrR2}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target 3 R:R:</span>
                    <span className="font-bold text-emerald-400 mono-numbers">1:{rrR3}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                  <span>Required Breakeven Win Rate for Target 1: <strong>{rrBreakevenWinRate}%</strong></span>
                </div>
              </div>
            )}

            {/* Margin Results */}
            {activeCalc === 'margin' && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#0E121B] border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">Initial Required Margin</span>
                  <div className="text-3xl font-black text-indigo-400 mono-numbers">
                    ${initialMarginReq.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-xs text-slate-400 mono-numbers">
                    Total Notional: ${totalNotional.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Liquidation Results */}
            {activeCalc === 'liquidation' && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                  <span className="text-[11px] text-rose-400 font-semibold block uppercase">Estimated Liquidation Price</span>
                  <div className="text-3xl font-black text-rose-400 mono-numbers">
                    ${calculatedLiqPrice.toFixed(2)}
                  </div>
                  <span className="text-xs text-rose-300">
                    Safety Margin Distance: <strong>{distanceToLiqPercent.toFixed(2)}%</strong> from entry
                  </span>
                </div>
              </div>
            )}

            {/* PnL Results */}
            {activeCalc === 'pnl' && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#0E121B] border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">Net Profit / Loss</span>
                  <div className={`text-3xl font-black mono-numbers ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {netPnL >= 0 ? '+' : ''}${netPnL.toFixed(2)}
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 pt-1">
                    <span>ROI: <strong className={netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{pnlROI}%</strong></span>
                    <span>Fees: ${estimatedFees.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Compound Schedule Results */}
            {activeCalc === 'compound' && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Projected Equity Milestones:</span>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 text-xs">
                  {compoundSchedule.map((s) => (
                    <div key={s.month} className="flex justify-between p-2 rounded-xl bg-[#0E121B] border border-white/5">
                      <span className="text-slate-400">Month {s.month}</span>
                      <span className="text-emerald-400 font-bold mono-numbers">${s.balance.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drawdown Recovery Results */}
            {activeCalc === 'drawdown' && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#0E121B] border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">Gain Needed to Recover</span>
                  <div className="text-3xl font-black text-amber-400 mono-numbers">+{recoveryGainRequired}%</div>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    A {drawdownPercent}% loss requires a +{recoveryGainRequired}% gain just to return to breakeven. This asymmetric recovery curve is why strict stop losses are mandatory.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
