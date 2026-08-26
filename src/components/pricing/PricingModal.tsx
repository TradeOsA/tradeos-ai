import React, { useState } from 'react';
import {
  X,
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  Lock,
  ArrowRight,
  HelpCircle,
  Scale,
  BadgeCheck,
} from 'lucide-react';
import { useCurrency, CURRENCIES, CurrencyCode } from '../../context/CurrencyContext';
import { computePaymentAmounts } from '../../utils/currencyPayment';
import { RazorpayCheckoutModal } from './RazorpayCheckoutModal';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: 'FREE' | 'PRO' | 'INSTITUTIONAL';
  onPlanChange?: (newPlan: 'FREE' | 'PRO' | 'INSTITUTIONAL') => void;
  onOpenSupport?: () => void;
  onOpenPolicies?: () => void;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentPlan = 'FREE',
  onPlanChange,
  onOpenSupport,
  onOpenPolicies,
  userId = 'trader_primary',
  userEmail = 'trader@tradeos.ai',
  userName = 'Trader',
}) => {
  const { currency, setCurrency } = useCurrency();
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');
  const [activePlan, setActivePlan] = useState<'FREE' | 'PRO' | 'INSTITUTIONAL'>(currentPlan);
  const [selectedTierForCheckout, setSelectedTierForCheckout] = useState<'PRO' | 'INSTITUTIONAL' | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [activatedTierName, setActivatedTierName] = useState('');

  if (!isOpen) return null;

  // Pricing Matrix based on currency and cycle
  const prices = {
    INR: {
      PRO_MONTHLY: 999,
      PRO_ANNUAL: 416, // 4999 / 12 ~ 416/mo (Total ₹4,999/yr)
      INST_MONTHLY: 2499,
      INST_ANNUAL: 1083, // 12,999 / 12 ~ 1083/mo
      symbol: '₹',
    },
    USD: {
      PRO_MONTHLY: 12,
      PRO_ANNUAL: 5, // ~ $60/yr
      INST_MONTHLY: 29,
      INST_ANNUAL: 13,
      symbol: '$',
    },
    EUR: {
      PRO_MONTHLY: 11,
      PRO_ANNUAL: 5,
      INST_MONTHLY: 27,
      INST_ANNUAL: 12,
      symbol: '€',
    },
    GBP: {
      PRO_MONTHLY: 9,
      PRO_ANNUAL: 4,
      INST_MONTHLY: 23,
      INST_ANNUAL: 10,
      symbol: '£',
    },
    AED: {
      PRO_MONTHLY: 45,
      PRO_ANNUAL: 19,
      INST_MONTHLY: 109,
      INST_ANNUAL: 49,
      symbol: 'AED ',
    },
  };

  const currRates = prices[currency] || prices.INR;

  const getNumericalAmount = (tier: 'PRO' | 'INSTITUTIONAL') => {
    if (tier === 'PRO') {
      if (currency === 'INR') {
        return billingCycle === 'ANNUAL' ? 4999 : 999;
      }
      return billingCycle === 'ANNUAL' ? currRates.PRO_ANNUAL * 12 : currRates.PRO_MONTHLY;
    } else {
      if (currency === 'INR') {
        return billingCycle === 'ANNUAL' ? 12999 : 2499;
      }
      return billingCycle === 'ANNUAL' ? currRates.INST_ANNUAL * 12 : currRates.INST_MONTHLY;
    }
  };

  const handleOpenCheckout = (tier: 'PRO' | 'INSTITUTIONAL') => {
    setSelectedTierForCheckout(tier);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    const tier = selectedTierForCheckout || 'PRO';
    const tierName = tier === 'PRO' ? 'Pro Trader Suite' : 'Prop Master Elite';
    setActivePlan(tier);
    setActivatedTierName(tierName);
    setShowSuccessToast(true);
    if (onPlanChange) {
      onPlanChange(tier);
    }
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 6000);
  };

  const plans = [
    {
      id: 'free',
      tier: 'FREE' as const,
      name: 'Retail Trader',
      badge: 'Free Tier',
      tagline: 'Foundational market scanner & risk calculator for discipline building.',
      price: `${currRates.symbol}0`,
      period: 'forever',
      highlight: false,
      ctaText: activePlan === 'FREE' ? 'Active Free Tier' : 'Downgrade to Free',
      features: [
        'Live Multi-Asset Watchlist & Real-Time Tickers',
        'Basic Risk Matrix & Position Sizing Engine',
        'Manual Trade Journaling (Up to 25 trades/mo)',
        'Core Psychological Tilt & Bias Indicator',
        'Fear & Greed Market Sentiment Index',
        'Standard Terminal Diagnostics',
      ],
      missingFeatures: [
        'Broker Statement Auto-Sync (Zerodha, Dhan, Bybit, Binance)',
        'Prop Firm Drawdown Guardian & Daily Loss Circuit Breaker',
        'Gemini 3.7 Vision AI Chart Auditor & SMC Review',
        '24/7 AI Risk & Execution Coach with Context Memory',
        'Monte Carlo 1,000-Run Account Ruin Simulation',
        'Institutional Multi-Account Master Dashboard',
      ],
    },
    {
      id: 'pro',
      tier: 'PRO' as const,
      name: 'Pro Trader',
      badge: 'Recommended',
      tagline: 'Automated execution guardrails, AI chart vision & deep analytics suite.',
      price: billingCycle === 'ANNUAL' ? `${currRates.symbol}${currRates.PRO_ANNUAL}` : `${currRates.symbol}${currRates.PRO_MONTHLY}`,
      period: '/month, billed ' + (billingCycle === 'ANNUAL' ? 'annually' : 'monthly'),
      highlight: true,
      ctaText: activePlan === 'PRO' ? 'Current Plan' : 'Upgrade to Pro',
      features: [
        'Everything in Free, plus:',
        'Unlimited Broker Auto-Sync (Zerodha, Dhan, Bybit, Binance, MT4/5)',
        'Prop Firm Drawdown Guardian (FTMO, FundedNext, Apex rules)',
        'Gemini 3.7 Vision AI Chart Auditor & SMC Analysis',
        'Real-Time AI Trading Coach with Context Memory',
        'Pre-Trade Veto Gatekeeper (15-Sec Safety Clearance)',
        'Monte Carlo 1,000-Run Account Ruin Simulation',
        'Automated Tax Reports, CSV & Broker Audit Statements',
      ],
      missingFeatures: [
        'Institutional Multi-Account Master Dashboard',
        '1-on-1 Personalized Risk Strategy Consultation',
      ],
    },
    {
      id: 'institutional',
      tier: 'INSTITUTIONAL' as const,
      name: 'Prop Master / Elite',
      badge: 'Institutional',
      tagline: 'Engineered for funded traders, desk prop managers, and mentorship academies.',
      price: billingCycle === 'ANNUAL' ? `${currRates.symbol}${currRates.INST_ANNUAL}` : `${currRates.symbol}${currRates.INST_MONTHLY}`,
      period: '/month, billed ' + (billingCycle === 'ANNUAL' ? 'annually' : 'monthly'),
      highlight: false,
      ctaText: activePlan === 'INSTITUTIONAL' ? 'Current Plan' : 'Get Elite Plan',
      features: [
        'Everything in Pro Trader, plus:',
        'Manage up to 10 Prop Firm Accounts Simultaneously',
        'Sub-Account Allocation & Risk Cross-Correlation',
        'Direct 1-on-1 Strategy & Rule Consultation',
        'Automated Prop Evaluation Pass Metrics & Live Alerts',
        'White-Label Journal Reports for Mentors & Desks',
        'Dedicated VIP Account Manager & Priority Queue',
      ],
      missingFeatures: [],
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
        {/* Modal Window: Explicit pure dark slate container */}
        <div
          id="tradeos-pricing-modal"
          style={{ backgroundColor: '#090D16', color: '#F9FAFB', borderColor: '#1F2937' }}
          className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
        >
          {/* Modal Header: Crisp White Text on Deep Obsidian #090D16 */}
          <div
            style={{ backgroundColor: '#090D16', borderColor: '#1F2937' }}
            className="flex items-center justify-between px-6 py-4.5 border-b shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold !text-white tracking-wide flex items-center gap-2">
                  <span>TradeOS AI Licensing & Tiers</span>
                </h2>
                <p className="text-xs !text-slate-400 mt-0.5">
                  Institutional Risk Intelligence • Direct Razorpay Gateway Activation
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#9CA3AF' }}
              className="p-2 rounded-lg border hover:!text-white hover:bg-[#1F2937] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Toast / Notification */}
          {showSuccessToast && (
            <div
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
              className="mx-6 mt-4 p-3.5 rounded-xl border flex items-center justify-between text-xs !text-emerald-300 animate-slide-down"
            >
              <div className="flex items-center gap-2.5">
                <BadgeCheck className="w-5 h-5 !text-emerald-400 shrink-0" />
                <span>
                  <strong className="!text-white">Success!</strong> Your subscription to{' '}
                  <strong className="!text-emerald-400">{activatedTierName}</strong> is verified and active.
                </span>
              </div>
              <button
                onClick={() => setShowSuccessToast(false)}
                className="!text-emerald-400 hover:!text-white text-xs font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
            {/* Currency Selector + Billing Cycle Bar */}
            <div
              style={{ backgroundColor: '#111827', borderColor: '#1F2937' }}
              className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border"
            >
              {/* Currency Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs !text-slate-400 font-medium">Currency:</span>
                <div
                  style={{ backgroundColor: '#090D16', borderColor: '#1F2937' }}
                  className="flex items-center gap-1 p-1 rounded-lg border"
                >
                  {(['INR', 'USD', 'EUR', 'GBP', 'AED'] as CurrencyCode[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        currency === c
                          ? 'bg-blue-600 !text-white shadow-sm'
                          : '!text-slate-400 hover:!text-white'
                      }`}
                    >
                      {CURRENCIES[c].flag} {c} ({CURRENCIES[c].symbol})
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly / Annual Cycle Toggle */}
              <div
                style={{ backgroundColor: '#090D16', borderColor: '#1F2937' }}
                className="flex items-center gap-1 p-1 rounded-lg border"
              >
                <button
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    billingCycle === 'MONTHLY'
                      ? 'bg-blue-600 !text-white shadow-sm'
                      : '!text-slate-400 hover:!text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('ANNUAL')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    billingCycle === 'ANNUAL'
                      ? 'bg-blue-600 !text-white shadow-sm'
                      : '!text-slate-400 hover:!text-white'
                  }`}
                >
                  <span>Annual</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 !text-emerald-300 text-[10px] font-bold">
                    Save 58% (₹4,999/yr)
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards Grid - Explicit Pure Dark Slate Panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => {
                const isSelected = activePlan === p.tier;
                return (
                  <div
                    key={p.id}
                    style={{
                      backgroundColor: '#111827',
                      borderColor: p.highlight ? '#3B82F6' : '#1F2937',
                      color: '#F9FAFB',
                    }}
                    className={`relative flex flex-col justify-between rounded-xl p-5 border transition-all ${
                      p.highlight ? 'shadow-xl ring-1 ring-blue-500/40' : 'hover:border-slate-600'
                    }`}
                  >
                    {p.badge && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 !text-white font-semibold text-[10px] uppercase tracking-wider shadow-sm whitespace-nowrap">
                        {p.badge}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-bold !text-white">{p.name}</h3>
                        <p className="text-xs !text-slate-400 mt-1 h-8 leading-snug">{p.tagline}</p>
                      </div>

                      <div style={{ borderColor: '#1F2937' }} className="pt-2 border-t">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold !text-white mono-numbers">{p.price}</span>
                          <span className="text-xs !text-slate-400">{p.period}</span>
                        </div>
                      </div>

                      {/* Features list */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-mono font-semibold !text-slate-400 uppercase tracking-wider block">
                          Included Capabilities:
                        </span>
                        {p.features.map((feat, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs !text-slate-200">
                            <Check className="w-3.5 h-3.5 !text-emerald-400 shrink-0 mt-0.5" />
                            <span className="!text-slate-200">{feat}</span>
                          </div>
                        ))}

                        {p.missingFeatures.length > 0 && (
                          <div className="pt-1.5 space-y-1.5 opacity-40">
                            {p.missingFeatures.map((feat, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs !text-slate-500">
                                <X className="w-3.5 h-3.5 !text-slate-600 shrink-0 mt-0.5" />
                                <span className="line-through !text-slate-500">{feat}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-5">
                      {p.tier === 'FREE' ? (
                        <button
                          type="button"
                          disabled={isSelected}
                          style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            borderColor: 'rgba(59, 130, 246, 0.3)',
                            color: '#93C5FD',
                          }}
                          className="w-full py-3 rounded-xl border font-bold text-xs cursor-default flex items-center justify-center gap-2"
                        >
                          <span>{isSelected ? 'Current Free Tier' : 'Active Plan'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckout(p.tier)}
                          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 !text-white font-bold text-xs transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
                        >
                          <span className="!text-white">{isSelected ? 'Manage Current Plan' : p.ctaText}</span>
                          <ArrowRight className="w-4 h-4 !text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Official Security Trust Badges Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div
                style={{ backgroundColor: '#111827', borderColor: '#1F2937' }}
                className="p-3.5 rounded-xl border flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold !text-white">256-Bit SSL Encrypted</h4>
                  <p className="text-[11px] !text-slate-400">Bank-grade end-to-end encryption</p>
                </div>
              </div>

              <div
                style={{ backgroundColor: '#111827', borderColor: '#1F2937' }}
                className="p-3.5 rounded-xl border flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold !text-white">100% Secure Checkout</h4>
                  <p className="text-[11px] !text-slate-400">Razorpay RBI-compliant gateway</p>
                </div>
              </div>

              <div
                style={{ backgroundColor: '#111827', borderColor: '#1F2937' }}
                className="p-3.5 rounded-xl border flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold !text-white">Instant Activation</h4>
                  <p className="text-[11px] !text-slate-400">Zero wait automated provisioning</p>
                </div>
              </div>
            </div>

            {/* Statutory Regulatory Notice */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10.5px] text-slate-300 leading-relaxed">
              <span className="font-bold text-amber-300 mr-1">⚖️ Non-Advisory Software Notice:</span>
              <span>
                TradeOS AI subscriptions are for software tools, automated trade journaling, risk calculations, and educational backtesting. We do not provide financial advice, tips, or investment management. Cancel anytime.
              </span>
            </div>
          </div>

          {/* Modal Footer: Matching #090D16 with solid padding and separation */}
          <div
            style={{ backgroundColor: '#090D16', borderColor: '#1F2937' }}
            className="px-6 py-4 border-t shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          >
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 !text-slate-400 text-center sm:text-left">
              <span>&copy; 2026 <strong className="!text-slate-200">TradeOS AI</strong>. All Rights Reserved.</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              {onOpenPolicies && (
                <button
                  onClick={onOpenPolicies}
                  className="!text-slate-400 hover:!text-white hover:underline cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Scale className="w-3.5 h-3.5 text-slate-400" />
                  <span>Terms & Policies</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onOpenSupport && (
                <button
                  onClick={onOpenSupport}
                  style={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#E2E8F0' }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-colors cursor-pointer hover:!text-white hover:bg-[#1F2937]"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>Support Desk</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Razorpay Dedicated Checkout Modal */}
      {selectedTierForCheckout && (
        <RazorpayCheckoutModal
          isOpen={!!selectedTierForCheckout}
          onClose={() => setSelectedTierForCheckout(null)}
          tier={selectedTierForCheckout}
          tierName={selectedTierForCheckout === 'PRO' ? 'Pro Trader Suite' : 'Prop Master Elite'}
          billingCycle={billingCycle}
          paymentDetails={computePaymentAmounts(getNumericalAmount(selectedTierForCheckout), currency)}
          onSuccess={handlePaymentSuccess}
          userId={userId}
          userEmail={userEmail}
          userName={userName}
        />
      )}
    </>
  );
};
