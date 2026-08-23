import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  Award,
  Lock,
  ArrowRight,
  HelpCircle,
  QrCode,
  CreditCard,
  Building2,
  Copy,
  Smartphone,
  CheckCircle2,
  ArrowLeft,
  Mail,
  ShieldAlert,
  Clock,
  ExternalLink,
  Download,
  Printer,
  Scale,
  FileText,
  BadgeCheck,
  Coins,
  RefreshCw,
  Wallet,
  Settings,
  Edit3,
  Send,
} from 'lucide-react';
import { useCurrency, CURRENCIES, CurrencyCode } from '../../context/CurrencyContext';
import { useMerchantPayment } from '../../context/MerchantPaymentContext';
import { MerchantAccountModal } from '../settings/MerchantAccountModal';
import { UpiQrCode } from './UpiQrCode';
import { computePaymentAmounts, USD_TO_INR_ESTIMATE } from '../../utils/currencyPayment';
import { loadRazorpayScript } from '../../utils/razorpayLoader';
import { RazorpayCheckoutModal } from './RazorpayCheckoutModal';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: 'FREE' | 'PRO' | 'INSTITUTIONAL';
  onPlanChange?: (newPlan: 'FREE' | 'PRO' | 'INSTITUTIONAL') => void;
  onOpenSupport?: () => void;
  onOpenPolicies?: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentPlan = 'FREE',
  onPlanChange,
  onOpenSupport,
  onOpenPolicies,
}) => {
  const { currency, setCurrency } = useCurrency();
  const { config: merchantConfig } = useMerchantPayment();
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');
  const [activePlan, setActivePlan] = useState<'FREE' | 'PRO' | 'INSTITUTIONAL'>(currentPlan);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [upgradedTierName, setUpgradedTierName] = useState('');

  // Merchant Setup Modal
  const [isMerchantSetupOpen, setIsMerchantSetupOpen] = useState(false);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);

  // Checkout Flow State
  const [checkoutTier, setCheckoutTier] = useState<'PRO' | 'INSTITUTIONAL' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'CRYPTO'>('UPI');
  const [utrNumber, setUtrNumber] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState('');
  const [copiedUPI, setCopiedUPI] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [utrSubmittedReceipt, setUtrSubmittedReceipt] = useState<{
    invoiceId: string;
    utr: string;
    amount: string;
  } | null>(null);
  const [verifiedPaymentId, setVerifiedPaymentId] = useState<string | null>(null);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('882');
  const [cardName, setCardName] = useState('TRADER ONE');

  // Live 10:00 Countdown Timer
  const [timeLeft, setTimeLeft] = useState(600);

  const OFFICIAL_SUPPORT_EMAIL = merchantConfig.supportEmail || 'capitalsurakshaclub@gmail.com';
  const OFFICIAL_WHATSAPP_NUMBER = merchantConfig.supportWhatsApp || '+91 8587965337';
  const OFFICIAL_UPI_ID = merchantConfig.upiId || '8587965337@paytm';
  const OFFICIAL_PAYEE_NAME = merchantConfig.payeeName || 'Ajay Soni';

  useEffect(() => {
    let timer: any;
    if (checkoutTier && !isPaymentSuccess) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 600));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [checkoutTier, isPaymentSuccess]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pricing Matrix based on currency and cycle
  const prices = {
    INR: {
      PRO_MONTHLY: 499,
      PRO_ANNUAL: 399,
      INST_MONTHLY: 1499,
      INST_ANNUAL: 1199,
      symbol: '₹',
    },
    USD: {
      PRO_MONTHLY: 19,
      PRO_ANNUAL: 14,
      INST_MONTHLY: 49,
      INST_ANNUAL: 39,
      symbol: '$',
    },
    EUR: {
      PRO_MONTHLY: 18,
      PRO_ANNUAL: 13,
      INST_MONTHLY: 46,
      INST_ANNUAL: 36,
      symbol: '€',
    },
    GBP: {
      PRO_MONTHLY: 15,
      PRO_ANNUAL: 11,
      INST_MONTHLY: 39,
      INST_ANNUAL: 29,
      symbol: '£',
    },
    AED: {
      PRO_MONTHLY: 69,
      PRO_ANNUAL: 52,
      INST_MONTHLY: 179,
      INST_ANNUAL: 139,
      symbol: 'AED ',
    },
  };

  const currRates = prices[currency] || prices.USD;

  const getNumericalAmount = () => {
    if (!checkoutTier) return 0;
    if (checkoutTier === 'PRO') {
      return billingCycle === 'ANNUAL' ? currRates.PRO_ANNUAL * 12 : currRates.PRO_MONTHLY;
    } else {
      return billingCycle === 'ANNUAL' ? currRates.INST_ANNUAL * 12 : currRates.INST_MONTHLY;
    }
  };

  const getPaymentDetails = () => {
    const total = getNumericalAmount();
    return computePaymentAmounts(total, currency);
  };

  const getAmountToPay = () => {
    const total = getNumericalAmount();
    return `${currRates.symbol}${total.toLocaleString()}`;
  };

  const handleStartCheckout = (tier: 'PRO' | 'INSTITUTIONAL') => {
    setCheckoutTier(tier);
    setIsPaymentSuccess(false);
    setUtrNumber('');
    setTimeLeft(600);
    setGeneratedInvoiceId(`TOS-INV-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(OFFICIAL_UPI_ID);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  const handleCopyBank = () => {
    const bankDetails = `Beneficiary: ${merchantConfig.payeeName}\nBank: ${merchantConfig.bankName}\nA/C No: ${merchantConfig.accountNumber}\nIFSC: ${merchantConfig.ifscCode}\nType: ${merchantConfig.accountType}`;
    navigator.clipboard.writeText(bankDetails);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleCompletePayment = (tier: 'PRO' | 'INSTITUTIONAL', tierTitle: string, paymentId?: string) => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setIsPaymentSuccess(true);
      setVerifiedPaymentId(paymentId || `pay_${Date.now()}`);
      setActivePlan(tier);
      setUpgradedTierName(tierTitle);
      setShowSuccessToast(true);
      if (onPlanChange) {
        onPlanChange(tier);
      }
    }, 800);
  };

  const handleSubmitUtrDirect = async () => {
    if (!checkoutTier || utrNumber.trim().length < 6) return;
    setIsProcessingPayment(true);
    const inv = generatedInvoiceId || `TOS-INV-${Math.floor(100000 + Math.random() * 900000)}`;
    try {
      const res = await fetch('/api/v1/payments/submit-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utrNumber: utrNumber.trim(),
          tier: checkoutTier,
          billingCycle,
          amount: getPaymentDetails().inrAmount,
          currency: 'INR',
          invoiceId: inv,
        }),
      });

      if (res.ok) {
        setUtrSubmittedReceipt({
          invoiceId: inv,
          utr: utrNumber.trim(),
          amount: getPaymentDetails().formattedInr,
        });
      }
    } catch (e) {
      console.error('Error submitting UTR', e);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleTriggerUpiIntent = (app: 'gpay' | 'phonepe' | 'paytm' | 'bhim') => {
    const payment = getPaymentDetails();
    // UPI protocol strictly processes Indian Rupees (INR)
    const upiUri = `upi://pay?pa=${encodeURIComponent(OFFICIAL_UPI_ID)}&pn=${encodeURIComponent(
      OFFICIAL_PAYEE_NAME
    )}&am=${payment.inrAmount}&cu=INR&tn=${encodeURIComponent(`TradeosAi ${checkoutTier} Plan`)}`;
    window.location.href = upiUri;
  };

  const handlePayWithRazorpay = async () => {
    if (!checkoutTier) return;
    setIsProcessingPayment(false);
    setIsRazorpayModalOpen(true);
  };

  const whatsappCheckoutLink = `https://wa.me/918587965337?text=Hi%20TradeosAi%20Support,%20I%20am%20activating%20the%20TradeosAi%20${checkoutTier}%20Plan%20(${getAmountToPay()}).%20Invoice%20ID:%20${generatedInvoiceId}%20and%20my%20UTR%20is:%20${utrNumber || '[ENTER_UTR]'}`;

  const plans = [
    {
      id: 'free',
      tier: 'FREE' as const,
      name: 'Retail Trader',
      badge: 'Free Forever',
      tagline: 'Foundational terminal for beginners building rule-based discipline.',
      price: `${currRates.symbol}0`,
      period: 'forever',
      highlight: false,
      ctaText: 'Current Plan',
      features: [
        'Live Multi-Asset Watchlist & Real-Time Tickers',
        'Basic Risk Matrix & Position Size Calculator',
        'Manual Trade Journaling (Up to 25 trades/month)',
        'Core Psychological Bias Detector',
        'Fear & Greed Sentiment Meter',
        'Standard Community Forum Access',
      ],
      missingFeatures: [
        'Broker Statement Auto-Sync (Zerodha, Dhan, Binance)',
        'Prop Firm Drawdown Shield & Circuit Breaker',
        'Gemini 3.7 Vision AI Chart Auditor',
        '24/7 AI Risk & Execution Coach',
        'Advanced Monte Carlo Simulation Engine',
        'VIP Priority WhatsApp Support Desk',
      ],
    },
    {
      id: 'pro',
      tier: 'PRO' as const,
      name: 'Pro Trader',
      badge: 'Most Popular',
      tagline: 'Complete automated discipline & AI intelligence suite for serious traders.',
      price: billingCycle === 'ANNUAL' ? `${currRates.symbol}${currRates.PRO_ANNUAL}` : `${currRates.symbol}${currRates.PRO_MONTHLY}`,
      period: '/month, billed ' + (billingCycle === 'ANNUAL' ? 'annually' : 'monthly'),
      highlight: true,
      ctaText: activePlan === 'PRO' ? 'Active Pro Tier' : 'Upgrade to Pro',
      features: [
        'Everything in Free, plus:',
        'Unlimited Broker Auto-Sync (Zerodha, Dhan, Bybit, Binance, MT4/5)',
        'Prop Firm Drawdown Guardian (FTMO, FundedNext, Apex rules)',
        'Gemini 3.7 Vision Chart Review & Setup Scanner',
        'Real-Time AI Trading Coach with Context Memory',
        'Pre-Trade Veto Gatekeeper (15-Sec Safety Clearance)',
        'Monte Carlo 1,000-Run Account Ruin Simulation',
        'Export Tax Reports, CSV & Broker Audit Statements',
        'Priority 24/7 WhatsApp & Email Helpdesk (<2hr SLA)',
      ],
      missingFeatures: [
        'Institutional Multi-Account Master Dashboard',
        '1-on-1 Personalized Risk Advisory Consultation',
      ],
    },
    {
      id: 'institutional',
      tier: 'INSTITUTIONAL' as const,
      name: 'Prop Master / Elite',
      badge: 'Institutional Grade',
      tagline: 'Engineered for funded traders, desk prop managers, and mentorship academies.',
      price: billingCycle === 'ANNUAL' ? `${currRates.symbol}${currRates.INST_ANNUAL}` : `${currRates.symbol}${currRates.INST_MONTHLY}`,
      period: '/month, billed ' + (billingCycle === 'ANNUAL' ? 'annually' : 'monthly'),
      highlight: false,
      ctaText: activePlan === 'INSTITUTIONAL' ? 'Active Elite Tier' : 'Get Elite Plan',
      features: [
        'Everything in Pro Trader, plus:',
        'Manage up to 10 Prop Firm Accounts Simultaneously',
        'Sub-Account Allocation & Risk Cross-Correlation',
        'Direct 1-on-1 Strategy & Rule Consultation',
        'Automated Prop Evaluation Pass Metrics & Live Alerts',
        'White-Label Journal Reports for Mentors & Desks',
        'Dedicated VIP Account Manager on WhatsApp',
        '14-Day 100% Risk-Free Money Back Guarantee',
      ],
      missingFeatures: [],
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0B0F19] border border-white/10 shadow-2xl overflow-hidden">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0E1321]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>TradeosAi Pro Plans & Institutional Licensing</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                    Official Checkout
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  14-Day 100% Money-Back Guarantee • Priority Help: <span className="text-emerald-400 font-mono">{OFFICIAL_SUPPORT_EMAIL}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMerchantSetupOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold cursor-pointer transition-colors"
                title="Configure Owner Payment Receiving Details"
              >
                <Settings className="w-3.5 h-3.5 text-teal-400" />
                <span>Payout Account</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
            {checkoutTier ? (
              /* PROFESSIONAL CHECKOUT & PAYMENT VIEW */
              <div className="max-w-3xl mx-auto space-y-6 animate-scale-in">
                {/* Back Button & Checkout Header */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCheckoutTier(null)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer p-2 rounded-xl bg-white/5 hover:bg-white/10"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Plans</span>
                  </button>

                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Session expires: <strong>{formatTimer(timeLeft)}</strong></span>
                  </div>
                </div>

                {isPaymentSuccess ? (
                  /* OFFICIAL TAX INVOICE & CERTIFICATE */
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1321] border border-emerald-500/30 text-center space-y-6 animate-scale-in">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                      <BadgeCheck className="w-10 h-10" />
                    </div>

                    <div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20">
                        Payment Verified • Pro Subscription Active
                      </span>
                      <h3 className="text-xl font-black text-white mt-3">
                        Welcome to {upgradedTierName || 'Pro Trader Tier'}!
                      </h3>
                      <p className="text-xs text-slate-300 max-w-lg mx-auto mt-2 leading-relaxed">
                        Your subscription is active. All institutional features including Broker Auto-Sync, Gemini 3.7 Vision Chart Auditor, and Prop Drawdown Shield are unlocked.
                      </p>
                    </div>

                    {/* Official Receipt Card */}
                    <div className="p-5 rounded-2xl bg-[#070A10] border border-white/10 max-w-md mx-auto text-left text-xs space-y-3 font-mono">
                      <div className="flex justify-between items-center pb-2 border-b border-white/10">
                        <span className="font-bold text-white">TAX INVOICE / RECEIPT</span>
                        <span className="text-emerald-400 font-bold">{generatedInvoiceId}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Platform:</span>
                        <span className="text-white font-bold">TradeosAi</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Plan Activated:</span>
                        <span className="text-white">{checkoutTier === 'PRO' ? 'Pro Trader Suite (Annual)' : 'Prop Master Elite'}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Total Amount Paid:</span>
                        <span className="text-emerald-400 font-bold">{getAmountToPay()}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Payment Method:</span>
                        <span className="text-slate-200">{paymentMethod} Verified</span>
                      </div>
                      {utrNumber && (
                        <div className="flex justify-between text-slate-400">
                          <span>UTR / Transaction Ref:</span>
                          <span className="text-teal-300">{utrNumber}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-white/10 flex justify-between text-[11px] text-slate-400">
                        <span>Guarantee:</span>
                        <span className="text-emerald-400 font-sans font-bold">14-Day 100% Money-Back</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      <a
                        href={whatsappCheckoutLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-teal-500/20"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>VIP WhatsApp Confirmation ({OFFICIAL_WHATSAPP_NUMBER})</span>
                      </a>

                      <button
                        onClick={() => window.print()}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Receipt</span>
                      </button>

                      <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-colors cursor-pointer"
                      >
                        Start Trading Now
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ACTIVE CHECKOUT SCREEN */
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left Column: Order Summary */}
                    <div className="md:col-span-5 space-y-4">
                      <div className="p-5 rounded-3xl bg-[#0E1321] border border-white/10 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                          <span className="text-xs font-mono font-bold text-slate-400 uppercase">Order Summary</span>
                          <span className="text-xs font-mono text-emerald-400 font-bold">{generatedInvoiceId}</span>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-white">
                            {checkoutTier === 'PRO' ? 'Pro Trader Plan' : 'Prop Master Elite Plan'}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">
                            {billingCycle === 'ANNUAL' ? '12 Months Prepaid (Saved 25%)' : 'Monthly Flexible Subscription'}
                          </p>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-white/5 text-xs text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Plan Base Fee:</span>
                            <span className="font-mono">{getAmountToPay()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">GST / Tax:</span>
                            <span className="font-mono text-emerald-400">Included (0% Extra)</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-white/10 font-bold text-sm">
                            <span className="text-white">Total Payable:</span>
                            <span className="text-emerald-400 font-mono">{getAmountToPay()}</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>Protected by 14-Day 100% Money Back Policy. No questions asked.</span>
                        </div>
                      </div>

                      {/* Official Payout Receiving Notice */}
                      <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/5 text-xs text-slate-400 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-white">
                            <Building2 className="w-4 h-4 text-emerald-400" />
                            <span>Receiving Payout Account</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsMerchantSetupOpen(true)}
                            className="text-[10px] text-emerald-400 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Change</span>
                          </button>
                        </div>
                        <p className="text-[11px] leading-relaxed font-mono">
                          UPI: <span className="text-emerald-300 font-bold">{OFFICIAL_UPI_ID}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right Column: Interactive Payment Selector */}
                    <div className="md:col-span-7 space-y-4">
                      {/* Method Selector Tabs */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#0E1321] p-1.5 rounded-2xl border border-white/10">
                        {[
                          { id: 'UPI', label: 'UPI / QR Code', icon: QrCode },
                          { id: 'NETBANKING', label: 'Bank Transfer (IMPS/NEFT)', icon: Building2 },
                          { id: 'CARD', label: 'Card / Gateway', icon: CreditCard },
                        ].map((m) => {
                          const Icon = m.icon;
                          const isSelected = paymentMethod === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setPaymentMethod(m.id as any)}
                              className={`p-2.5 rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                                  : 'text-slate-400 hover:text-white hover:bg-white/5 font-semibold'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-[10px] leading-none whitespace-nowrap">{m.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* TAB 1: UPI PAYMENT */}
                      {paymentMethod === 'UPI' && (() => {
                        const paymentDetails = getPaymentDetails();
                        return (
                        <div className="p-5 rounded-3xl bg-[#0E1321] border border-white/10 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <QrCode className="w-4 h-4 text-emerald-400" />
                              <span>Scan QR with any UPI App</span>
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              Instant 0% Fee • Sub-Second Settlement
                            </span>
                          </div>

                          {/* Crisp QR Code Container & VPA details */}
                          <div className="flex flex-col sm:flex-row items-center gap-5 bg-[#070A10] p-4 rounded-2xl border border-white/5">
                            <div className="shrink-0">
                              <UpiQrCode
                                vpa={OFFICIAL_UPI_ID}
                                payeeName={OFFICIAL_PAYEE_NAME}
                                amount={paymentDetails.inrAmount}
                                currency="INR"
                                note={`TradeosAi ${checkoutTier} Subscription`}
                                size={150}
                              />
                            </div>

                            <div className="space-y-3 flex-1 w-full">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                                  Receiving Merchant UPI ID:
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-emerald-300 font-bold bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10 select-all break-all">
                                    {OFFICIAL_UPI_ID}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleCopyUPI}
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs transition-colors cursor-pointer shrink-0"
                                    title="Copy UPI ID"
                                  >
                                    {copiedUPI ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="text-xs text-slate-300">
                                  Plan Fee: <strong className="text-white font-mono text-sm">{getAmountToPay()}</strong>
                                </div>
                                {currency !== 'INR' && (
                                  <div className="text-[11px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                    UPI Payable: <span className="text-white text-xs">{paymentDetails.formattedInr}</span> (1 USD ≈ ₹{USD_TO_INR_ESTIMATE})
                                  </div>
                                )}
                              </div>

                              {/* Mobile 1-Click App Triggers & Razorpay UPI Option */}
                              <div className="space-y-2 pt-1">
                                <span className="text-[10px] text-slate-400 font-mono block">Direct App Payment (Mobile):</span>
                                <div className="grid grid-cols-3 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerUpiIntent('gpay')}
                                    className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-200 border border-white/5 cursor-pointer text-center"
                                  >
                                    Google Pay
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerUpiIntent('phonepe')}
                                    className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-200 border border-white/5 cursor-pointer text-center"
                                  >
                                    PhonePe
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerUpiIntent('paytm')}
                                    className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-200 border border-white/5 cursor-pointer text-center"
                                  >
                                    Paytm / Cred
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={handlePayWithRazorpay}
                                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 border border-blue-400/30 cursor-pointer shadow-md transition-all active:scale-98 mt-1"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                                  <span>Pay via Razorpay UPI & Dynamic Gateway</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* UTR Form or Pending Verification Receipt */}
                          {utrSubmittedReceipt ? (
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                                <Clock className="w-4 h-4" />
                                <span>UTR Submitted — Pending Merchant Verification</span>
                              </div>
                              <p className="text-[11px] text-slate-300">
                                Your bank reference number has been recorded for invoice{' '}
                                <strong className="text-white font-mono">{utrSubmittedReceipt.invoiceId}</strong>. Plan will activate upon admin approval.
                              </p>
                              <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono space-y-1">
                                <div className="flex justify-between text-slate-400">
                                  <span>Submitted UTR:</span>
                                  <span className="text-emerald-400 font-bold">{utrSubmittedReceipt.utr}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                  <span>Payable:</span>
                                  <span className="text-white font-bold">{utrSubmittedReceipt.amount}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                  <span>Status:</span>
                                  <span className="text-amber-400 font-bold">Pending Review</span>
                                </div>
                              </div>
                              <a
                                href={whatsappCheckoutLink}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                              >
                                <Smartphone className="w-4 h-4" />
                                <span>Send UTR Receipt to WhatsApp (+91 8587965337)</span>
                              </a>
                            </div>
                          ) : (
                            <>
                              {/* UTR Number Input */}
                              <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-300">
                                  Enter 12-Digit UPI Ref / UTR No. (from banking receipt) *
                                </label>
                                <input
                                  type="text"
                                  maxLength={12}
                                  placeholder="e.g. 423910847291"
                                  value={utrNumber}
                                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                                  className="w-full bg-[#070A10] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono tracking-wider focus:outline-none focus:border-emerald-500"
                                />
                                <p className="text-[10px] text-slate-400 flex items-center justify-between">
                                  <span>Verification by merchant after bank credit check.</span>
                                  {utrNumber.length > 0 && (
                                    <span className="font-mono text-emerald-400">{utrNumber.length}/12 Digits</span>
                                  )}
                                </p>
                              </div>

                              {/* Submit & WhatsApp Buttons */}
                              <div className="space-y-2 pt-1">
                                <button
                                  type="button"
                                  disabled={isProcessingPayment || utrNumber.length < 6}
                                  onClick={handleSubmitUtrDirect}
                                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isProcessingPayment ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                      <span>Submitting UTR Receipt...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4" />
                                      <span>Submit UTR Receipt for Verification ({paymentDetails.formattedInr})</span>
                                    </>
                                  )}
                                </button>

                                <a
                                  href={whatsappCheckoutLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full py-2.5 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                  <Smartphone className="w-3.5 h-3.5" />
                                  <span>Or Send Screenshot to WhatsApp ({OFFICIAL_WHATSAPP_NUMBER})</span>
                                </a>
                              </div>
                            </>
                          )}
                        </div>
                        );
                      })()}

                      {/* TAB 2: CREDIT / DEBIT CARD & RAZORPAY */}
                      {paymentMethod === 'CARD' && (() => {
                        const paymentDetails = getPaymentDetails();
                        return (
                        <div className="p-5 rounded-3xl bg-[#0E1321] border border-white/10 space-y-4 text-xs">
                          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-blue-200">
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-blue-400 shrink-0" />
                              <span>256-Bit SSL Encrypted Card Gateway (Razorpay & Stripe)</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-blue-300">3D SECURE</span>
                          </div>

                          {/* Dynamic Currency Conversion Banner */}
                          {currency !== 'INR' && (
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex justify-between items-center font-mono">
                              <span>Dynamic Multi-Currency Conversion:</span>
                              <span className="text-white font-bold">{getAmountToPay()} = {paymentDetails.formattedInr}</span>
                            </div>
                          )}

                          {/* Interactive Visual Card Element */}
                          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1A2338] via-[#101726] to-[#0A101C] border border-white/10 space-y-3 shadow-lg">
                            <div className="flex justify-between items-center">
                              <div className="w-8 h-6 rounded bg-amber-400/80" />
                              <span className="font-mono text-[10px] text-slate-400">VISA / MASTERCARD / RUPAY</span>
                            </div>
                            <div className="font-mono text-sm tracking-widest text-white">{cardNumber || '•••• •••• •••• ••••'}</div>
                            <div className="flex justify-between text-[10px] font-mono text-slate-300">
                              <span>CARDHOLDER: {cardName || 'TRADER'}</span>
                              <span>EXP: {cardExpiry || 'MM/YY'}</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-slate-300 font-semibold mb-1">Cardholder Name</label>
                              <input
                                type="text"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                                placeholder="Name on card"
                                className="w-full bg-[#070A10] border border-white/15 rounded-xl px-3 py-2 text-white font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-300 font-semibold mb-1">Card Number</label>
                              <input
                                type="text"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                placeholder="4242 •••• •••• 4242"
                                className="w-full bg-[#070A10] border border-white/15 rounded-xl px-3 py-2 text-white font-mono"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-slate-300 font-semibold mb-1">Expiry Date</label>
                                <input
                                type="text"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="MM / YY"
                                className="w-full bg-[#070A10] border border-white/15 rounded-xl px-3 py-2 text-white font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-300 font-semibold mb-1">CVV / CVC</label>
                                <input
                                  type="password"
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value)}
                                  placeholder="•••"
                                  maxLength={4}
                                  className="w-full bg-[#070A10] border border-white/15 rounded-xl px-3 py-2 text-white font-mono"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isProcessingPayment}
                              onClick={handlePayWithRazorpay}
                              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 mt-2"
                            >
                              {isProcessingPayment ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                  <span>Authorizing Multi-Currency Gateway...</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-4 h-4" />
                                  <span>Pay {getAmountToPay()} {currency !== 'INR' ? `(${paymentDetails.formattedInr})` : ''} & Activate Plan</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        );
                      })()}

                      {/* TAB 3: NETBANKING & NEFT / IMPS */}
                      {paymentMethod === 'NETBANKING' && (
                        <div className="p-5 rounded-3xl bg-[#0E1321] border border-white/10 space-y-4 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">Direct Bank Wire / NEFT / IMPS</span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              {merchantConfig.accountType || 'Current Account'}
                            </span>
                          </div>

                          <div className="p-4 rounded-2xl bg-[#070A10] border border-white/5 space-y-2.5 font-mono">
                            <div className="flex justify-between text-slate-400">
                              <span>Account Name:</span>
                              <strong className="text-white font-bold">{merchantConfig.payeeName}</strong>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Bank Name:</span>
                              <span className="text-white font-bold">{merchantConfig.bankName}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Account Number:</span>
                              <span className="text-emerald-300 font-bold">{merchantConfig.accountNumber}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>IFSC Code:</span>
                              <span className="text-emerald-300 font-bold">{merchantConfig.ifscCode}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Account Type:</span>
                              <span className="text-white">{merchantConfig.accountType}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleCopyBank}
                              className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer"
                            >
                              {copiedBank ? 'Bank Details Copied!' : 'Copy Bank Account Details'}
                            </button>
                            <a
                              href={whatsappCheckoutLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-colors cursor-pointer text-center"
                            >
                              WhatsApp Receipt
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* STANDARD PLANS CATALOG */
              <>
                {/* Currency Selector + Billing Cycle Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[#121827] border border-[#1C263C]">
                  {/* Currency Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Currency:</span>
                    <div className="flex items-center gap-1 bg-[#0E131F] p-1 rounded-lg border border-[#1C263C]">
                      {(['INR', 'USD', 'EUR', 'GBP', 'AED'] as CurrencyCode[]).map((c) => (
                        <button
                          key={c}
                          onClick={() => setCurrency(c)}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                            currency === c
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {CURRENCIES[c].flag} {c} ({CURRENCIES[c].symbol})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Monthly / Annual Cycle Toggle */}
                  <div className="flex items-center gap-1 bg-[#0E131F] p-1 rounded-lg border border-[#1C263C]">
                    <button
                      onClick={() => setBillingCycle('MONTHLY')}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                        billingCycle === 'MONTHLY'
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Monthly Billing
                    </button>
                    <button
                      onClick={() => setBillingCycle('ANNUAL')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                        billingCycle === 'ANNUAL'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Annual Plan</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-950/30 text-[10px] font-extrabold uppercase">
                        Save 25%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((p) => {
                    const isSelected = activePlan === p.tier;
                    return (
                      <div
                        key={p.id}
                        className={`relative flex flex-col justify-between rounded-xl p-5 border transition-all ${
                          p.highlight
                            ? 'bg-[#121827] border-emerald-500/50 shadow-lg ring-1 ring-emerald-500/30'
                            : 'bg-[#0E131F] border-[#1C263C] hover:border-white/20'
                        }`}
                      >
                        {p.badge && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md whitespace-nowrap">
                            {p.badge}
                          </div>
                        )}

                        <div className="space-y-3.5">
                          <div>
                            <h3 className="text-base font-bold text-white">{p.name}</h3>
                            <p className="text-xs text-slate-400 mt-1 h-8 leading-snug">{p.tagline}</p>
                          </div>

                          <div className="pt-2 border-t border-[#1C263C]">
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-white mono-numbers">{p.price}</span>
                              <span className="text-xs text-slate-400">{p.period}</span>
                            </div>
                          </div>

                          {/* Features list */}
                          <div className="space-y-2 pt-1">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                              Included Capabilities:
                            </span>
                            {p.features.map((feat, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-slate-200">
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </div>
                            ))}

                            {p.missingFeatures.length > 0 && (
                              <div className="pt-1.5 space-y-1.5 opacity-50">
                                {p.missingFeatures.map((feat, i) => (
                                   <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                                    <X className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                                    <span className="line-through">{feat}</span>
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
                              className="w-full py-2.5 rounded-lg bg-white/5 border border-[#1C263C] text-slate-300 font-bold text-xs cursor-default"
                            >
                              {isSelected ? 'Active Plan' : 'Free Forever'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartCheckout(p.tier)}
                              className={`w-full py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 shadow-sm ${
                                p.highlight
                                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                                  : 'bg-[#182033] hover:bg-[#202b45] text-white border border-[#1C263C]'
                              }`}
                            >
                              <span>{p.ctaText}</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Modal Footer with 2026 TradeosAi Copyright, WhatsApp, Email and Policy Triggers */}
          <div className="px-5 py-3.5 border-t border-[#1C263C] bg-[#121827] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-slate-400 text-center sm:text-left">
              <span>&copy; 2026 <strong>TradeosAi</strong>. All Rights Reserved.</span>
              <span className="hidden sm:inline text-slate-700">•</span>
              {onOpenPolicies && (
                <button
                  onClick={onOpenPolicies}
                  className="text-slate-400 hover:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Terms & Policies</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/918587965337?text=Hi%20TradeosAi%20Support,%20I%20have%20a%20pricing%2Fpayment%20question.`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-bold border border-teal-500/30 transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>WhatsApp: {OFFICIAL_WHATSAPP_NUMBER}</span>
              </a>

              {onOpenSupport && (
                <button
                  onClick={onOpenSupport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Helpdesk</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Razorpay Dedicated Checkout Modal */}
      {checkoutTier && (
        <RazorpayCheckoutModal
          isOpen={isRazorpayModalOpen}
          onClose={() => setIsRazorpayModalOpen(false)}
          tier={checkoutTier}
          tierName={checkoutTier === 'PRO' ? 'Pro Trader' : 'Prop Master Elite'}
          billingCycle={billingCycle}
          paymentDetails={getPaymentDetails()}
          merchantConfig={merchantConfig}
          onSuccess={(paymentId) => {
            handleCompletePayment(checkoutTier, checkoutTier === 'PRO' ? 'Pro Trader' : 'Prop Master Elite', paymentId);
          }}
          onOpenMerchantSettings={() => setIsMerchantSetupOpen(true)}
        />
      )}

      {/* Embedded Merchant Configuration Modal */}
      <MerchantAccountModal
        isOpen={isMerchantSetupOpen}
        onClose={() => setIsMerchantSetupOpen(false)}
      />
    </>
  );
};
