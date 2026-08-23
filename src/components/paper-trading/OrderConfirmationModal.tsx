import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  ShieldCheck,
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  Layers,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { MarketAsset, TradeDirection } from '../../types';
import { getIndianMarketSessionInfo, isIndianSymbolCategory } from '../../services/autoTrader';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: MarketAsset;
  direction: TradeDirection;
  orderType: 'MARKET' | 'LIMIT';
  setOrderType: (type: 'MARKET' | 'LIMIT') => void;
  limitPrice: number;
  setLimitPrice: (price: number) => void;
  activeQuantity: number;
  unitShort: string;
  totalPositionSizeUsd: number;
  leverage: number;
  computedMarginRequired: number;
  freeCollateral: number;
  liquidationPrice: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  maxLossUsd: number;
  maxProfitUsd: number;
  maxLossPercentOnMargin: number;
  maxProfitPercentOnMargin: number;
  calculatedRRRatio: number;
  isTrailingEnabled: boolean;
  trailingDistanceInput: number;
  onConfirmExecuteMarket: () => void;
  onConfirmPlaceLimit: (limitPrice: number) => void;
  inrPerUsd?: number;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  onClose,
  asset,
  direction,
  orderType,
  setOrderType,
  limitPrice,
  setLimitPrice,
  activeQuantity,
  unitShort,
  totalPositionSizeUsd,
  leverage,
  computedMarginRequired,
  freeCollateral,
  liquidationPrice,
  stopLossPrice,
  takeProfitPrice,
  maxLossUsd,
  maxProfitUsd,
  maxLossPercentOnMargin,
  maxProfitPercentOnMargin,
  calculatedRRRatio,
  isTrailingEnabled,
  trailingDistanceInput,
  onConfirmExecuteMarket,
  onConfirmPlaceLimit,
  inrPerUsd = 89.0,
}) => {
  if (!isOpen) return null;

  const isLong = direction === 'LONG';
  const livePrice = asset.price;
  const targetPrice = orderType === 'MARKET' ? livePrice : limitPrice;
  const priceDiffPct = livePrice > 0 ? ((limitPrice - livePrice) / livePrice) * 100 : 0;
  const isMarginSufficient = freeCollateral >= computedMarginRequired;

  const formatINR = (val: number) => {
    return `₹${Math.round(val * inrPerUsd).toLocaleString('en-IN')}`;
  };

  const handleApplyPricePercent = (pctOffset: number) => {
    const newPrice = Number((livePrice * (1 + pctOffset / 100)).toFixed(2));
    setLimitPrice(newPrice);
  };

  const isIndian = isIndianSymbolCategory(asset.symbol, asset.category);
  const indianSession = getIndianMarketSessionInfo();

  return (
    <div
      id="order-confirmation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-[#0E131F] border border-[#1C263C] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#1C263C] bg-[#121827] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
                isLong
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isLong ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Confirm Virtual Order</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    isLong
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {direction} {leverage}x
                </span>
                {isIndian && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    🇮🇳 NSE/BSE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {asset.symbol} • {asset.name} • Live: {isIndian ? `₹${livePrice.toLocaleString('en-IN')}` : `$${livePrice.toLocaleString()}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C263C] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* INDIAN MARKET WORKING HOURS NOTICE (09:15 AM - 03:30 PM IST) */}
          {isIndian && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                indianSession.isOpen
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-white">🇮🇳 Indian Market Working Hours:</strong>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/40 text-amber-300">
                    09:15 AM - 03:30 PM IST (Mon-Fri)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      indianSession.isOpen
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {indianSession.isOpen ? '● LIVE SESSION' : '● MARKET CLOSED'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {indianSession.isOpen ? (
                    <span>
                      NSE/BSE is actively open for regular order execution (Current: <strong className="text-white">{indianSession.currentIstTime}</strong>).
                    </span>
                  ) : (
                    <span>
                      Market is currently closed (Current: <strong className="text-white">{indianSession.currentIstTime}</strong>). Orders placed now will be registered and queued as <strong className="text-amber-300">After Market Orders (AMO)</strong> for execution at <strong className="text-emerald-400">09:15 AM IST</strong> opening bell.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
          {/* 1. ORDER TYPE SELECTOR: MARKET vs LIMIT */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              1. Choose Order Type (ऑर्डर प्रकार चुनें)
            </label>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#121827] border border-[#1C263C]">
              {/* Market Order Option */}
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={`p-3 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between ${
                  orderType === 'MARKET'
                    ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-[#1C263C]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-black text-xs">
                    <Zap className="w-4 h-4" />
                    <span>Market Order</span>
                  </div>
                  {orderType === 'MARKET' && (
                    <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                  )}
                </div>
                <div
                  className={`text-[10px] leading-snug ${
                    orderType === 'MARKET' ? 'text-slate-900 font-medium' : 'text-slate-400'
                  }`}
                >
                  Instant fill at current live market price (${livePrice.toLocaleString()})
                </div>
              </button>

              {/* Limit Order Option */}
              <button
                type="button"
                onClick={() => {
                  setOrderType('LIMIT');
                  if (limitPrice === 0 || limitPrice === livePrice) {
                    // Default suggest limit offset
                    const offsetPct = isLong ? -0.5 : 0.5;
                    setLimitPrice(Number((livePrice * (1 + offsetPct / 100)).toFixed(2)));
                  }
                }}
                className={`p-3 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between ${
                  orderType === 'LIMIT'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-[#1C263C]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-black text-xs">
                    <Target className="w-4 h-4" />
                    <span>Limit Order</span>
                  </div>
                  {orderType === 'LIMIT' && (
                    <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                  )}
                </div>
                <div
                  className={`text-[10px] leading-snug ${
                    orderType === 'LIMIT' ? 'text-slate-900 font-medium' : 'text-slate-400'
                  }`}
                >
                  Pending trigger. Executes automatically when live price touches your target
                </div>
              </button>
            </div>
          </div>

          {/* 2. LIMIT PRICE CONFIGURATION (If Limit Order is Active) */}
          {orderType === 'LIMIT' && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Target Limit Price (लक्षित लिमिट भाव):</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-amber-200">
                  Current Live: ${livePrice.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="any"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0E131F] border border-amber-500/50 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                    placeholder="Enter limit price"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono font-bold">
                    USD
                  </span>
                </div>
              </div>

              {/* Quick % Offset Chips */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400 font-bold">Quick Presets:</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {[-1.0, -0.5, -0.2, 0, 0.2, 0.5, 1.0].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplyPricePercent(pct)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        priceDiffPct.toFixed(1) === pct.toFixed(1)
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'bg-[#0E131F] text-slate-300 hover:text-white border border-[#1C263C]'
                      }`}
                    >
                      {pct === 0 ? 'Market' : `${pct > 0 ? '+' : ''}${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trigger Explanation Banner */}
              <div className="text-[11px] text-amber-200/90 font-medium bg-[#0E131F]/80 p-2.5 rounded-lg border border-amber-500/20 flex items-start gap-2">
                <InfoIcon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Order Trigger Condition:</strong>
                  {isLong ? (
                    <span>
                      {' '}
                      Will wait in <strong>Pending Orders</strong> and trigger into an active{' '}
                      <strong>LONG</strong> position when live price{' '}
                      {limitPrice <= livePrice
                        ? `drops to or below $${limitPrice.toLocaleString()} (${Math.abs(
                            priceDiffPct
                          ).toFixed(2)}% pullback)`
                        : `touches $${limitPrice.toLocaleString()}`}
                      .
                    </span>
                  ) : (
                    <span>
                      {' '}
                      Will wait in <strong>Pending Orders</strong> and trigger into an active{' '}
                      <strong>SHORT</strong> position when live price{' '}
                      {limitPrice >= livePrice
                        ? `rallies to or above $${limitPrice.toLocaleString()} (+${priceDiffPct.toFixed(
                            2
                          )}% bounce)`
                        : `touches $${limitPrice.toLocaleString()}`}
                      .
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. ORDER BREAKDOWN & RISK METRICS */}
          <div className="p-3.5 rounded-xl bg-[#121827] border border-[#1C263C] space-y-2.5 text-xs">
            <div className="font-bold text-slate-300 flex items-center justify-between pb-1.5 border-b border-[#1C263C]">
              <span>Order Summary & Collateral Check</span>
              <span className="font-mono text-teal-300">
                {activeQuantity} {unitShort}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-slate-400 block">Execution / Limit Price:</span>
                <strong className="text-white font-mono font-bold">
                  ${targetPrice.toLocaleString()} ({formatINR(targetPrice)})
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Total Volume / Exposure:</span>
                <strong className="text-teal-300 font-mono font-bold">
                  ${totalPositionSizeUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} (
                  {formatINR(totalPositionSizeUsd)})
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Margin Collateral Required:</span>
                <strong
                  className={`font-mono font-bold ${
                    isMarginSufficient ? 'text-white' : 'text-rose-400'
                  }`}
                >
                  ${computedMarginRequired.toFixed(2)} ({formatINR(computedMarginRequired)})
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Free Margin Available:</span>
                <strong className="text-emerald-400 font-mono font-bold">
                  ${freeCollateral.toLocaleString()} ({formatINR(freeCollateral)})
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Est. Liquidation Price:</span>
                <strong className="text-rose-400 font-mono font-bold">
                  ${liquidationPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Risk : Reward Ratio:</span>
                <strong className="text-amber-300 font-mono font-bold">
                  1 : {calculatedRRRatio}
                </strong>
              </div>
            </div>

            {/* SL / TP Summary */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1C263C]">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px]">
                <span className="text-rose-400 font-bold block">Stop Loss:</span>
                <span className="text-white font-mono font-bold block">
                  {stopLossPrice ? `$${stopLossPrice.toLocaleString()}` : 'Not Set'}
                </span>
                <span className="text-rose-300 font-mono">
                  Max Loss: -${maxLossUsd.toFixed(2)} (-{maxLossPercentOnMargin.toFixed(1)}%)
                </span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px]">
                <span className="text-emerald-400 font-bold block">Take Profit:</span>
                <span className="text-white font-mono font-bold block">
                  {takeProfitPrice ? `$${takeProfitPrice.toLocaleString()}` : 'Not Set'}
                </span>
                <span className="text-emerald-300 font-mono">
                  Target Profit: +${maxProfitUsd.toFixed(2)} (+{maxProfitPercentOnMargin.toFixed(1)}%)
                </span>
              </div>
            </div>

            {isTrailingEnabled && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] flex items-center justify-between text-amber-300">
                <span className="flex items-center gap-1 font-bold">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Trailing Stop Loss Active:</span>
                </span>
                <span className="font-mono font-bold">${trailingDistanceInput} Step Distance</span>
              </div>
            )}
          </div>

          {!isMarginSufficient && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Insufficient free collateral. Required margin ($
                {computedMarginRequired.toFixed(2)}) exceeds free margin ($
                {freeCollateral.toFixed(2)}).
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer with Clear Actions */}
        <div className="px-5 py-3.5 border-t border-[#1C263C] bg-[#121827] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#0E131F] hover:bg-[#1C263C] text-slate-300 text-xs font-bold transition-all cursor-pointer border border-[#1C263C]"
          >
            Cancel / Edit
          </button>

          {orderType === 'MARKET' ? (
            <button
              type="button"
              disabled={!isMarginSufficient}
              onClick={onConfirmExecuteMarket}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-2 ${
                !isMarginSufficient
                  ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400'
                  : isLong
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 font-black'
                  : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-500/25 font-black'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>
                Confirm & Execute Market {direction} (${targetPrice.toLocaleString()})
              </span>
            </button>
          ) : (
            <button
              type="button"
              disabled={!isMarginSufficient || limitPrice <= 0}
              onClick={() => onConfirmPlaceLimit(limitPrice)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-2 ${
                !isMarginSufficient || limitPrice <= 0
                  ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25 font-black'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>
                Place Limit Order @ ${limitPrice.toLocaleString()} ({direction})
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
