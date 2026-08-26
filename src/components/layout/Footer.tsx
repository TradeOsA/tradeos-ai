import React from 'react';
import { ShieldCheck, Lock, ExternalLink, Scale, HelpCircle, Sparkles } from 'lucide-react';
import { APP_CONFIG } from '../../config/branding';

interface FooterProps {
  onOpenPolicies?: () => void;
  onOpenSupport?: () => void;
  onOpenDisclaimer?: () => void;
  onOpenAbout?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPolicies,
  onOpenSupport,
  onOpenDisclaimer,
  onOpenAbout,
}) => {
  return (
    <footer className="w-full mt-12 pt-8 pb-12 border-t border-white/10 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand Info & Tagline */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2 font-black text-white text-sm tracking-tight">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xs">
                T
              </span>
              <span>{APP_CONFIG.name}</span>
            </div>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-slate-400 text-xs">{APP_CONFIG.tagline}</span>
          </div>

          {/* Quick Links & Legal */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
            {onOpenAbout && (
              <button
                onClick={onOpenAbout}
                className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>About & Founder Story</span>
              </button>
            )}
            {onOpenDisclaimer && (
              <button
                onClick={onOpenDisclaimer}
                className="hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Risk Disclaimer
              </button>
            )}
            {onOpenPolicies && (
              <>
                <button
                  onClick={onOpenPolicies}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Privacy Policy & Terms
                </button>
                <button
                  onClick={onOpenPolicies}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Refund & Cancellation
                </button>
              </>
            )}
            {onOpenSupport && (
              <button
                onClick={onOpenSupport}
                className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Support & Helpdesk</span>
              </button>
            )}
          </div>
        </div>

        {/* SEBI Compliance & Risk Statement */}
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>SEBI Statutory Compliance & Non-Advisory Notice:</span>
          </div>
          <p>
            TradeOS AI is an analytics workspace, journaling software, and mathematical risk management calculator for self-directed traders. We do <strong>NOT</strong> provide stock tips, investment advice, portfolio management services (PMS), or guaranteed return schemes. As per SEBI study findings, 9 out of 10 individual traders in equity Futures and Options (F&O) incurred net losses. Trading in financial markets involves substantial risk of capital loss. Past performance does not guarantee future results.
          </p>
        </div>

        {/* Copyright & All Rights Reserved Line */}
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-slate-500">
          <p>
            {APP_CONFIG.rightsReservedText}
          </p>

          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>SSL 256-Bit Encrypted</span>
            </span>
            <span>•</span>
            <span className="font-mono text-emerald-400">
              {APP_CONFIG.domain}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
