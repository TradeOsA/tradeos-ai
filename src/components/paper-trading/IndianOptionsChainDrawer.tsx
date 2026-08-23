import React, { useState } from 'react';
import {
  Layers,
  TrendingUp,
  TrendingDown,
  X,
  Zap,
  CheckCircle2,
  Activity,
  ArrowRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { MarketAsset } from '../../types';
import { getIndianMarketSessionInfo } from '../../services/autoTrader';

export interface OptionContractSelection {
  underlyingSymbol: string;
  underlyingName: string;
  strikePrice: number;
  optionType: 'CE' | 'PE';
  contractSymbol: string;
  expiryDate: string;
  premiumInr: number;
  lotSize: number;
  greeks: {
    delta: number;
    theta: number;
    gamma: number;
    iv: number;
  };
}

interface IndianOptionsChainDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  underlyingAsset: MarketAsset;
  onSelectContract: (contract: OptionContractSelection) => void;
}

export const IndianOptionsChainDrawer: React.FC<IndianOptionsChainDrawerProps> = ({
  isOpen,
  onClose,
  underlyingAsset,
  onSelectContract,
}) => {
  if (!isOpen) return null;

  const [selectedExpiry, setSelectedExpiry] = useState<'CURRENT_WEEK' | 'MONTHLY'>('CURRENT_WEEK');
  const [selectedOptionType, setSelectedOptionType] = useState<'ALL' | 'CE' | 'PE'>('ALL');

  // Derive spot price and determine strike interval
  const spotPrice = underlyingAsset.price || 24380;
  const isNifty = underlyingAsset.symbol.includes('NSEI') || underlyingAsset.symbol.includes('NIFTY');
  const isBankNifty = underlyingAsset.symbol.includes('BANK');
  const isSensex = underlyingAsset.symbol.includes('BSESN') || underlyingAsset.symbol.includes('SENSEX');
  const isReliance = underlyingAsset.symbol.includes('RELIANCE');
  const isHdfc = underlyingAsset.symbol.includes('HDFC');

  const strikeStep = isNifty ? 50 : isBankNifty ? 100 : isSensex ? 100 : isReliance ? 20 : isHdfc ? 10 : 50;
  const lotSize = isNifty ? 25 : isBankNifty ? 15 : isSensex ? 10 : isReliance ? 250 : isHdfc ? 550 : 25;
  const baseAtmStrike = Math.round(spotPrice / strikeStep) * strikeStep;

  const currentWeekDate = '28-AUG-2026';
  const monthlyDate = '25-SEP-2026';
  const activeExpiry = selectedExpiry === 'CURRENT_WEEK' ? currentWeekDate : monthlyDate;

  // Generate 9 strikes around ATM (4 ITM, 1 ATM, 4 OTM)
  const strikeOffsets = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  const indianSession = getIndianMarketSessionInfo();
  const strikesData = strikeOffsets.map((offset) => {
    const strike = baseAtmStrike + offset * strikeStep;
    const isAtm = strike === baseAtmStrike;
    const isCeItm = strike < spotPrice;
    const isPeItm = strike > spotPrice;

    // Calculate realistic Black-Scholes approximate option premiums in ₹ INR
    const ceIntrinsic = Math.max(0, spotPrice - strike);
    const peIntrinsic = Math.max(0, strike - spotPrice);
    const timeValue = Math.max(12, (spotPrice * 0.008) - Math.abs(offset) * (strikeStep * 0.15));

    const cePremium = Number((ceIntrinsic + timeValue + (Math.random() * 2 - 1)).toFixed(2));
    const pePremium = Number((peIntrinsic + timeValue + (Math.random() * 2 - 1)).toFixed(2));

    const iv = Number((12.5 + Math.abs(offset) * 0.4).toFixed(1));
    const ceDelta = Number((0.5 + (offset < 0 ? (Math.abs(offset) * 0.1) : -Math.abs(offset) * 0.09)).toFixed(2));
    const peDelta = Number((-0.5 + (offset > 0 ? -Math.abs(offset) * 0.1 : Math.abs(offset) * 0.09)).toFixed(2));

    const theta = Number((-8.5 - Math.random() * 3).toFixed(1));
    const gamma = Number((0.0025 - Math.abs(offset) * 0.0003).toFixed(4));

    return {
      strike,
      isAtm,
      isCeItm,
      isPeItm,
      ce: {
        premium: Math.max(2.5, cePremium),
        oi: Math.floor(Math.random() * 45000) + 12000,
        oiChange: Number((Math.random() * 18 - 4).toFixed(1)),
        delta: Math.min(0.95, Math.max(0.05, ceDelta)),
        theta,
        gamma,
        iv,
      },
      pe: {
        premium: Math.max(2.5, pePremium),
        oi: Math.floor(Math.random() * 42000) + 11000,
        oiChange: Number((Math.random() * 16 - 5).toFixed(1)),
        delta: Math.max(-0.95, Math.min(-0.05, peDelta)),
        theta,
        gamma,
        iv,
      },
    };
  });

  const handlePick = (strike: number, type: 'CE' | 'PE', premium: number, greeks: any) => {
    const symbolBase = isNifty
      ? 'NIFTY'
      : isBankNifty
      ? 'BANKNIFTY'
      : isSensex
      ? 'SENSEX'
      : isReliance
      ? 'RELIANCE'
      : isHdfc
      ? 'HDFCBANK'
      : underlyingAsset.symbol.replace('^', '').replace('.NS', '');

    const contractSymbol = `${symbolBase} ${activeExpiry} ${strike} ${type}`;
    onSelectContract({
      underlyingSymbol: underlyingAsset.symbol,
      underlyingName: underlyingAsset.name,
      strikePrice: strike,
      optionType: type,
      contractSymbol,
      expiryDate: activeExpiry,
      premiumInr: premium,
      lotSize,
      greeks,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0B101D] border border-emerald-500/40 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1C263C] bg-gradient-to-r from-[#0C1527] via-[#0E1B2C] to-[#0C1527] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base sm:text-lg">
                  Indian Market Option Chain ({underlyingAsset.name})
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase">
                  NSE / BSE F&O
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span>
                  Spot Price: <strong className="text-white font-mono">₹{spotPrice.toLocaleString('en-IN')}</strong>
                </span>
                <span>•</span>
                <span>
                  Lot Size: <strong className="text-teal-300 font-mono">{lotSize} Qty/Lot</strong>
                </span>
                <span>•</span>
                <span>
                  Currency: <strong className="text-emerald-400 font-mono">₹ INR Strictly</strong>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#121827] hover:bg-[#1A2234] border border-[#1C263C] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Indian Market Working Hours Session Banner (09:15 AM - 03:30 PM IST) */}
        <div className={`px-4 py-2 border-b border-[#1C263C] flex items-center justify-between text-xs gap-3 ${
          indianSession.isOpen ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>NSE/BSE Trading Hours:</strong> 09:15 AM - 03:30 PM IST (Mon-Fri) • IST Time: <strong className="text-white">{indianSession.currentIstTime}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              indianSession.isOpen
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
            }`}>
              {indianSession.isOpen ? '● LIVE NSE/BSE SESSION' : '● MARKET CLOSED (AMO ACTIVE)'}
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-3 bg-[#0E131F] border-b border-[#1C263C] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Expiry:</span>
            <div className="flex p-0.5 rounded-lg bg-[#121827] border border-[#1C263C]">
              <button
                type="button"
                onClick={() => setSelectedExpiry('CURRENT_WEEK')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  selectedExpiry === 'CURRENT_WEEK'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Weekly ({currentWeekDate})
              </button>
              <button
                type="button"
                onClick={() => setSelectedExpiry('MONTHLY')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  selectedExpiry === 'MONTHLY'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly ({monthlyDate})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Filter View:</span>
            <div className="flex p-0.5 rounded-lg bg-[#121827] border border-[#1C263C]">
              <button
                type="button"
                onClick={() => setSelectedOptionType('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  selectedOptionType === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Strikes (CE & PE)
              </button>
              <button
                type="button"
                onClick={() => setSelectedOptionType('CE')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  selectedOptionType === 'CE' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-emerald-400 hover:text-white'
                }`}
              >
                Calls (CE) Only
              </button>
              <button
                type="button"
                onClick={() => setSelectedOptionType('PE')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  selectedOptionType === 'PE' ? 'bg-rose-500 text-white font-black' : 'text-rose-400 hover:text-white'
                }`}
              >
                Puts (PE) Only
              </button>
            </div>
          </div>
        </div>

        {/* Options Chain Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-2 rounded-lg bg-[#121827] border border-[#1C263C] text-[10px] font-black uppercase tracking-wider text-slate-400 text-center">
            <div className="col-span-5 text-emerald-400">CALLS (CE) — Bullish Upside</div>
            <div className="col-span-2 text-white bg-slate-800/80 rounded py-0.5">STRIKE PRICE</div>
            <div className="col-span-5 text-rose-400">PUTS (PE) — Bearish Downside</div>
          </div>

          {strikesData.map((row) => (
            <div
              key={row.strike}
              className={`grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl border transition-all items-center ${
                row.isAtm
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-[#121827]/70 border-[#1C263C] hover:border-slate-600'
              }`}
            >
              {/* CALLS SIDE (5 Cols) */}
              {(selectedOptionType === 'ALL' || selectedOptionType === 'CE') && (
                <div
                  onClick={() =>
                    handlePick(row.strike, 'CE', row.ce.premium, {
                      delta: row.ce.delta,
                      theta: row.ce.theta,
                      gamma: row.ce.gamma,
                      iv: row.ce.iv,
                    })
                  }
                  className={`sm:col-span-5 p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    row.isCeItm
                      ? 'bg-emerald-950/30 border-emerald-500/40 hover:bg-emerald-900/40'
                      : 'bg-[#0E131F] border-[#1C263C] hover:border-emerald-500/50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                        CE CALL
                      </span>
                      {row.isCeItm && (
                        <span className="text-[9px] font-bold text-emerald-300 font-mono">ITM</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Δ {row.ce.delta} • IV {row.ce.iv}% • OI {(row.ce.oi / 1000).toFixed(0)}k
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="text-sm font-black font-mono text-emerald-300">
                      ₹{row.ce.premium.toFixed(2)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      1 Lot: ₹{(row.ce.premium * lotSize).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              )}

              {/* CENTER STRIKE (2 Cols) */}
              <div className="sm:col-span-2 text-center py-1 bg-[#0B101D] border border-slate-700 rounded-lg">
                <div className="text-xs sm:text-sm font-black font-mono text-white">
                  {row.strike.toLocaleString('en-IN')}
                </div>
                {row.isAtm ? (
                  <span className="text-[9px] font-black text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full uppercase">
                    ⭐ ATM Strike
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-500 font-mono">
                    {row.strike > spotPrice ? `+${(row.strike - spotPrice).toFixed(0)} pts` : `${(row.strike - spotPrice).toFixed(0)} pts`}
                  </span>
                )}
              </div>

              {/* PUTS SIDE (5 Cols) */}
              {(selectedOptionType === 'ALL' || selectedOptionType === 'PE') && (
                <div
                  onClick={() =>
                    handlePick(row.strike, 'PE', row.pe.premium, {
                      delta: row.pe.delta,
                      theta: row.pe.theta,
                      gamma: row.pe.gamma,
                      iv: row.pe.iv,
                    })
                  }
                  className={`sm:col-span-5 p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    row.isPeItm
                      ? 'bg-rose-950/30 border-rose-500/40 hover:bg-rose-900/40'
                      : 'bg-[#0E131F] border-[#1C263C] hover:border-rose-500/50'
                  }`}
                >
                  <div className="text-left space-y-0.5">
                    <div className="text-sm font-black font-mono text-rose-300">
                      ₹{row.pe.premium.toFixed(2)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      1 Lot: ₹{(row.pe.premium * lotSize).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {row.isPeItm && (
                        <span className="text-[9px] font-bold text-rose-300 font-mono">ITM</span>
                      )}
                      <span className="text-[10px] font-black uppercase text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded">
                        PE PUT
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Δ {row.pe.delta} • IV {row.pe.iv}% • OI {(row.pe.oi / 1000).toFixed(0)}k
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#0C1527] border-t border-[#1C263C] flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Click any Call (CE) or Put (PE) strike box to load it directly into your Order Terminal.</span>
          </div>
          <span className="text-[11px] font-bold text-slate-300">
            Rule Regulation: NIFTY/BANKNIFTY F&O trades execute strictly in ₹ INR.
          </span>
        </div>
      </div>
    </div>
  );
};
