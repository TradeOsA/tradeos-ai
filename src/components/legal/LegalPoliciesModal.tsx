import React, { useState } from 'react';
import {
  X,
  Shield,
  FileText,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Smartphone,
  ExternalLink,
  Scale,
  Building,
} from 'lucide-react';
import { useMerchantPayment } from '../../context/MerchantPaymentContext';

export type PolicyTab = 'terms' | 'privacy' | 'refund' | 'compliance';

interface LegalPoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PolicyTab;
  onOpenSupport?: () => void;
}

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
  onOpenSupport,
}) => {
  const { config } = useMerchantPayment();
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);

  if (!isOpen) return null;

  const OFFICIAL_EMAIL = config.supportEmail || 'tradeos.crypto@gmail.com';
  const OFFICIAL_WHATSAPP = config.supportWhatsApp || '+91 8587965337';
  const WHATSAPP_LINK = `https://wa.me/918587965337?text=Hi%20TradeosAi%20Support%20Team,%20I%20have%20a%20legal%2Fpolicy%20inquiry.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl bg-[#0E131F] border border-[#1C263C] shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1C263C] bg-[#121827]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Scale className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>TradeosAi — Legal, Terms & Policies</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                  v2026 Compliant
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official Terms of Service, Privacy Policy & 14-Day Refund Framework
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-5 pt-2 border-b border-[#1C263C] bg-[#121827] gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms of Service</span>
          </button>

          <button
            onClick={() => setActiveTab('refund')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'refund'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>14-Day Refund Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Privacy & Data Security</span>
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className={`pb-3 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'compliance'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Educational & Risk Disclaimer</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs text-slate-300 leading-relaxed">
          
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/10 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-400" />
                  <span>1. Acceptance of Terms & Platform Ownership</span>
                </h3>
                <p>
                  Welcome to <strong>TradeosAi</strong> (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;). By accessing our web application, trading tools, and AI algorithms, you agree to be bound by these Terms of Service. All software rights, terminal code, algorithms, and brand assets are &copy; 2026 TradeosAi. All Rights Reserved. Customer support and trader verification are assisted by the Capital Suraksha Club support desk.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/10 space-y-2">
                <h3 className="text-sm font-bold text-white">2. License & Permitted Usage</h3>
                <p>
                  Subscribers receive a non-exclusive, non-transferable, revocable license to use TradeosAi for personal trade journaling, statistical risk management, and market simulation. Reverse engineering, bulk API scraping, or redistributing proprietary AI coach models without express written authorization is strictly prohibited.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/10 space-y-2">
                <h3 className="text-sm font-bold text-white">3. Subscription, Billing & Invoices</h3>
                <p>
                  Subscriptions are billed on a Monthly or Annual cycle as selected during checkout. Payments via UPI (GPay, PhonePe, Paytm), NetBanking, Cards, or Web3 are verified securely. Tax invoices are generated immediately upon transaction clearance.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/10 space-y-2">
                <h3 className="text-sm font-bold text-white">4. Intellectual Property</h3>
                <p>
                  All proprietary indicators, Monte Carlo risk engines, chart auditing models, and layout architectures belong exclusively to TradeosAi. &copy; 2026 TradeosAi. All Rights Reserved.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'refund' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0E1321] to-teal-950/40 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>14-Day 100% Money-Back Satisfaction Guarantee</span>
                </div>
                <p className="text-slate-200">
                  We stand 100% behind the quality and performance of TradeosAi. If within 14 calendar days of your Pro or Elite subscription you find that TradeosAi has not substantially improved your trading discipline and risk awareness, we will issue a complete 100% refund — no questions asked.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/10 space-y-2">
                <h3 className="text-sm font-bold text-white">How to Claim Your Refund (2 Simple Steps):</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li>
                    <strong>Step 1:</strong> Send an email to <span className="text-emerald-400 font-mono font-bold">{OFFICIAL_EMAIL}</span> or drop a message on WhatsApp at <span className="text-emerald-400 font-mono font-bold">{OFFICIAL_WHATSAPP}</span> with your registered email and payment UTR/Order ID.
                  </li>
                  <li>
                    <strong>Step 2:</strong> Our support desk will verify the timestamp and transfer your refund back to your original payment method within <strong>24 to 48 business hours</strong>.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/10 space-y-2">
                <h3 className="text-sm font-bold text-white">Cancellation of Renewal</h3>
                <p>
                  You can cancel future auto-renewals anytime from your Profile Settings. You will retain full access until the end of your prepaid billing period.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/10 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>1. Institutional Data Privacy & AES-256 Encryption</span>
                </h3>
                <p>
                  We treat your trade logs, position sizes, and financial strategies with strict confidentiality. All trade data is encrypted using military-grade AES-256 at rest and TLS 1.3 in transit.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/10 space-y-2">
                <h3 className="text-sm font-bold text-white">2. Broker API Security (Strictly Read-Only)</h3>
                <p>
                  When connecting Zerodha, Dhan, Binance, or MT4/5 statements, TradeosAi requests strictly <strong>read-only permission</strong>. The software can NEVER execute orders, withdraw funds, or modify brokerage accounts on your behalf.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/10 space-y-2">
                <h3 className="text-sm font-bold text-white">3. Zero Third-Party Monetization</h3>
                <p>
                  We never sell, rent, or monetize your trading data or personal identity to third-party ad networks or brokers.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-amber-200">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Regulatory Disclaimer & Risk Disclosure</span>
                </div>
                <p>
                  TradeosAi is an educational analytics, mathematical risk management, and performance journaling platform. We are <strong>NOT a SEBI-registered Investment Advisor (RIA) or Research Analyst (RA)</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/10 space-y-2">
                <h3 className="text-sm font-bold text-white">Capital Defense & Risk Responsibility</h3>
                <p>
                  Trading in Equities, Futures, Options (F&amp;O), Forex, and Cryptocurrencies involves substantial risk of capital loss. Past performance and AI suggestions do not guarantee future returns. Users must exercise independent judgment and consult certified financial planners before risking real capital.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Copyright & Direct Channels */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#0E1321] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 text-center sm:text-left">
            <span>&copy; 2026 <strong>TradeosAi</strong>. All Rights Reserved.</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-bold border border-teal-500/30 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>WhatsApp: {OFFICIAL_WHATSAPP}</span>
            </a>

            <a
              href={`mailto:${OFFICIAL_EMAIL}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{OFFICIAL_EMAIL}</span>
            </a>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
