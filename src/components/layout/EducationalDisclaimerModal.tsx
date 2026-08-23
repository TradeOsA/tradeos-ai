import React from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface EducationalDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EducationalDisclaimerModal: React.FC<EducationalDisclaimerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#121722] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Educational & Risk Transparency Policy</h2>
            <p className="text-xs text-slate-400">TradeosAi Core Operating Principles & Legal Compliance</p>
          </div>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-300 text-sm">No Financial Advice or Guaranteed Signals</h4>
              <p className="text-slate-300 mt-1">
                TradeosAi is strictly an educational workspace, technical analytics suite, journaling tool, and risk management calculator. We never provide personalized financial advice, investment recommendations, or guaranteed buy/sell signals.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-semibold text-white text-sm">Fundamental Risk Warnings:</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Substantial Risk of Loss:</strong> Trading cryptocurrencies, equities, foreign exchange, and leveraged derivatives carries significant financial risk and may result in the loss of all deposited capital.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>AI Model Constraints:</strong> Gemini-generated trade reviews and AI coach responses analyze price action patterns and mathematical risk heuristics. They do not forecast the future and should never replace personal due diligence.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Strict Capital Preservation:</strong> TradeosAi promotes the mandatory 1%–2% maximum risk-per-trade rule, pre-determined invalidation stops, and disciplined journaling.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            I Understand & Agree to the Educational Terms
          </button>
        </div>
      </div>
    </div>
  );
};
