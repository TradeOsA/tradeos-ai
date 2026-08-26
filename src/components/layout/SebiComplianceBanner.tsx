import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, Info, X, ChevronDown, ChevronUp, ExternalLink, Scale } from 'lucide-react';

interface SebiComplianceBannerProps {
  onOpenDisclaimerModal?: () => void;
}

export const SebiComplianceBanner: React.FC<SebiComplianceBannerProps> = ({ onOpenDisclaimerModal }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tradeos_sebi_banner_dismissed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('tradeos_sebi_banner_dismissed', 'true');
    } catch {}
  };

  if (isDismissed) {
    return (
      <div className="w-full bg-[#0d131f] border-b border-amber-500/20 py-1 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span className="font-semibold text-amber-300">SEBI Regulatory Notice:</span>
            <span className="truncate">9/10 individual traders in equity F&O segment incurred net losses. TradeOS AI is strictly an analytics & journaling tool.</span>
          </div>
          <button
            onClick={() => setIsDismissed(false)}
            className="text-amber-400 hover:text-amber-300 underline font-medium ml-2 shrink-0 cursor-pointer text-[10px]"
          >
            View Full Disclosure
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside aria-label="SEBI Statutory Risk Disclosure" className="w-full bg-gradient-to-r from-[#17120a] via-[#1c140b] to-[#17120a] border-b border-amber-500/30 text-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
        <div className="flex items-start sm:items-center justify-between gap-3">
          {/* Left Icon & Main Headline */}
          <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
            <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <div className="text-[11px] sm:text-xs leading-tight">
              <span className="font-bold text-amber-400 mr-1.5">
                SEBI Mandatory Risk Disclosure on Derivatives & Capital Safety:
              </span>
              <span className="text-slate-300">
                9 out of 10 individual traders in equity Futures & Options (F&O) segment incurred net losses (avg loss ~₹50,000). TradeOS AI does <strong>NOT</strong> provide buy/sell tips or investment advice.
              </span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 transition-colors cursor-pointer"
            >
              <span>{isExpanded ? 'Less' : 'SEBI Guidelines'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {onOpenDisclaimerModal && (
              <button
                onClick={onOpenDisclaimerModal}
                className="hidden md:inline-flex text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Policy
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              title="Minimize notice for this session"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expanded SEBI Regulatory Details */}
        {isExpanded && (
          <div className="mt-2.5 pt-2.5 border-t border-amber-500/20 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300 animate-in fade-in duration-150">
            <div className="p-2.5 rounded-lg bg-black/40 border border-amber-500/15 space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>1. SEBI Study Statistics (FY22-FY24)</span>
              </div>
              <p className="text-slate-400 text-[10.5px] leading-relaxed">
                89% of individual F&O traders lost money, with an average net loss of ₹1.1 Lakh per loser (plus ~28% additional transaction fees and brokerage charges).
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/40 border border-amber-500/15 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>2. SaaS Software Role & Non-Advisory</span>
              </div>
              <p className="text-slate-400 text-[10.5px] leading-relaxed">
                TradeOS AI operates as a self-directed risk journal, stop-loss mathematical calculator, and performance analytics tool. No portfolio management or tip advisory is offered.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/40 border border-amber-500/15 space-y-1">
              <div className="font-bold text-blue-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>3. Capital Protection Rule</span>
              </div>
              <p className="text-slate-400 text-[10.5px] leading-relaxed">
                Never risk more than 1–2% of total capital on any single trade. Always enforce fixed stop-losses and respect daily drawdown limits.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
