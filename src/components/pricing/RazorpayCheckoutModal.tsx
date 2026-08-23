import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Lock,
  ExternalLink,
  Settings,
  ArrowRight,
  Sparkles,
  QrCode,
  CreditCard,
  Building2,
  Clock,
  Send,
  Copy,
  Check,
  RefreshCw,
  HelpCircle,
  Compass,
} from 'lucide-react';
import { UpiQrCode } from './UpiQrCode';
import { PriceConversion } from '../../utils/currencyPayment';
import { loadRazorpayScript, isEmbeddedInIframe, getRazorpayKeyId } from '../../utils/razorpayLoader';

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: 'PRO' | 'INSTITUTIONAL';
  tierName: string;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  paymentDetails: PriceConversion;
  merchantConfig: {
    upiId?: string;
    payeeName?: string;
    razorpayKeyId?: string;
    razorpayPaymentLink?: string;
  };
  onSuccess: (paymentId: string) => void;
  onOpenMerchantSettings: () => void;
}

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  isOpen,
  onClose,
  tier,
  tierName,
  billingCycle,
  paymentDetails,
  merchantConfig,
  onSuccess,
  onOpenMerchantSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'RAZORPAY_GATEWAY' | 'DIRECT_UPI'>('RAZORPAY_GATEWAY');
  const [isLaunchingGateway, setIsLaunchingGateway] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [gatewayNotice, setGatewayNotice] = useState<string | null>(null);
  const [standaloneLinkUrl, setStandaloneLinkUrl] = useState<string | null>(null);
  const [isIframe, setIsIframe] = useState(false);

  // Manual payment ID / UTR verification state
  const [referenceInput, setReferenceInput] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrSubmittedReceipt, setUtrSubmittedReceipt] = useState<{
    invoiceId: string;
    utr: string;
    amount: string;
  } | null>(null);

  useEffect(() => {
    setIsIframe(isEmbeddedInIframe());
  }, []);

  if (!isOpen) return null;

  const upiId = merchantConfig.upiId?.trim() || '8587965337@paytm';
  const payeeName = merchantConfig.payeeName?.trim() || 'Ajay Soni';
  const razorpayKey = merchantConfig.razorpayKeyId?.trim() || '';
  const isKeyConfigured = razorpayKey.startsWith('rzp_test_') || razorpayKey.startsWith('rzp_live_');
  const paymentLink = merchantConfig.razorpayPaymentLink?.trim() || '';

  const upiIntentUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${paymentDetails.inrAmount}&cu=INR&tn=${encodeURIComponent(`TradeOS ${tierName} Plan`)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Helper to fetch or create a standalone payment link via backend API
  const fetchPaymentLink = async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: paymentDetails.rawAmount,
          currency: paymentDetails.currency,
          tier,
          billingCycle,
          userId: 'trader_primary',
          userEmail: 'trader@tradeos.ai',
          userName: 'Trader',
          merchantPaymentLink: paymentLink,
          merchantKeyId: razorpayKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.paymentLink) {
          setStandaloneLinkUrl(data.paymentLink);
          return data.paymentLink;
        }
      }
    } catch (e) {
      console.warn('Could not create payment link:', e);
    }
    return paymentLink || `https://rzp.io/l/tradeos-${tier.toLowerCase()}-${billingCycle.toLowerCase()}`;
  };

  // 1-Click Launch Standalone Checkout in New Tab (Bypasses all iframe restrictions)
  const handleOpenStandaloneCheckout = async () => {
    setIsCreatingLink(true);
    setGatewayError(null);
    setGatewayNotice(null);

    try {
      const link = await fetchPaymentLink();
      if (link) {
        window.open(link, '_blank');
        setGatewayNotice('Checkout opened in a new tab! Complete payment there, then enter your Payment ID below to activate.');
      } else {
        setGatewayError('Could not generate payment link. Please scan the Direct UPI QR code.');
      }
    } catch (err: any) {
      setGatewayError('Failed to launch standalone checkout. Please try the Direct UPI tab.');
    } finally {
      setIsCreatingLink(false);
    }
  };

  // Launch In-Page Razorpay Checkout SDK with Graceful iFrame Fallback
  const handleLaunchRazorpayGateway = async () => {
    setIsLaunchingGateway(true);
    setGatewayError(null);
    setGatewayNotice(null);

    // If user already specified a direct payment link in settings, open directly
    if (paymentLink) {
      window.open(paymentLink, '_blank');
      setIsLaunchingGateway(false);
      setGatewayNotice('Razorpay Payment Page opened in a new tab. After paying, enter your Payment ID below.');
      return;
    }

    try {
      // 1. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || typeof (window as any).Razorpay === 'undefined') {
        setIsLaunchingGateway(false);
        // Fallback to standalone checkout
        handleOpenStandaloneCheckout();
        return;
      }

      // 2. Create Order on Backend
      const res = await fetch('/api/v1/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: paymentDetails.rawAmount,
          currency: paymentDetails.currency,
          tier,
          billingCycle,
          userId: 'trader_primary',
          userEmail: 'trader@tradeos.ai',
          gateway: 'RAZORPAY',
        }),
      });

      const orderData = res.ok ? await res.json() : null;
      const dynamicEnvKey = getRazorpayKeyId();
      const activeKey = dynamicEnvKey || (isKeyConfigured ? razorpayKey : (orderData?.keyId || ''));

      if (!activeKey || activeKey === 'rzp_test_tradeos_sandbox') {
        setIsLaunchingGateway(false);
        // Fallback to standalone link
        handleOpenStandaloneCheckout();
        return;
      }

      const options = {
        key: activeKey,
        amount: orderData?.amountInSubUnits || Math.round(paymentDetails.inrAmount * 100),
        currency: 'INR',
        name: 'TradeOS AI',
        description: `${tierName} Plan (${billingCycle})`,
        order_id: orderData?.orderId && !orderData.orderId.startsWith('order_tos_') ? orderData.orderId : undefined,
        prefill: {
          name: 'Trader',
          email: 'trader@tradeos.ai',
          contact: '+918587965337',
        },
        theme: {
          color: '#10B981',
        },
        handler: async function (response: any) {
          setIsLaunchingGateway(true);
          try {
            const verifyRes = await fetch('/api/v1/payments/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                userId: 'trader_primary',
                tier,
                billingCycle,
                amount: paymentDetails.inrAmount,
                currency: 'INR',
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success || response.razorpay_payment_id) {
              setIsLaunchingGateway(false);
              onSuccess(response.razorpay_payment_id);
              onClose();
              if (typeof window !== 'undefined') {
                window.location.href = '/dashboard?payment=success';
              }
            } else {
              setGatewayError(verifyData.message || 'Payment verification failed on server.');
              setIsLaunchingGateway(false);
            }
          } catch (e: any) {
            if (response.razorpay_payment_id) {
              setIsLaunchingGateway(false);
              onSuccess(response.razorpay_payment_id);
              onClose();
              if (typeof window !== 'undefined') {
                window.location.href = '/dashboard?payment=success';
              }
            } else {
              setGatewayError('Payment received, verifying with server...');
              setIsLaunchingGateway(false);
            }
          }
        },
        modal: {
          ondismiss: function () {
            setIsLaunchingGateway(false);
          },
          escape: true,
          backdropclose: false,
        },
      };

      try {
        const rzp = new (window as any).Razorpay(options);

        // Standard Window Event Callbacks
        if (typeof rzp.on === 'function') {
          rzp.on('payment.failed', function (response: any) {
            setGatewayError(response.error?.description || 'Payment was cancelled or failed.');
            setIsLaunchingGateway(false);
          });

          rzp.on('payment.success', function (response: any) {
            if (response?.razorpay_payment_id) {
              onSuccess(response.razorpay_payment_id);
              onClose();
              if (typeof window !== 'undefined') {
                window.location.href = '/dashboard?payment=success';
              }
            }
          });

          rzp.on('modal.ondismiss', function () {
            setIsLaunchingGateway(false);
          });

          rzp.on('modal.dismiss', function () {
            setIsLaunchingGateway(false);
          });
        }

        rzp.open();
        setIsLaunchingGateway(false);
        setGatewayNotice('Checkout window opened. If blocked by browser sandbox, use the Standalone Tab button below.');
      } catch (sdkError: any) {
        console.warn('Razorpay SDK open failed in iframe sandbox:', sdkError);
        setIsLaunchingGateway(false);
        handleOpenStandaloneCheckout();
      }

    } catch (err: any) {
      console.error('[Razorpay Launch Error]:', err);
      setIsLaunchingGateway(false);
      handleOpenStandaloneCheckout();
    }
  };

  // Submit Reference / Payment ID for Instant Verification
  const handleVerifyTransaction = async () => {
    const ref = referenceInput.trim();
    if (!ref || ref.length < 6) return;
    setIsSubmittingManual(true);
    setGatewayError(null);

    try {
      if (ref.startsWith('pay_')) {
        // Razorpay Payment ID Verification
        const res = await fetch('/api/v1/payments/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayPaymentId: ref,
            userId: 'trader_primary',
            tier,
            billingCycle,
            amount: paymentDetails.inrAmount,
            currency: 'INR',
          }),
        });

        const data = await res.json();
        if (data.success) {
          onSuccess(ref);
          onClose();
          return;
        } else {
          setGatewayError(data.message || 'Payment ID could not be verified yet. If recently paid, please wait 30s or submit UTR.');
        }
      } else {
        // UPI UTR reference submission
        const generatedInv = `TOS-INV-${Math.floor(100000 + Math.random() * 900000)}`;
        const res = await fetch('/api/v1/payments/submit-utr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            utrNumber: ref,
            tier,
            billingCycle,
            amount: paymentDetails.inrAmount,
            currency: 'INR',
            invoiceId: generatedInv,
          }),
        });

        if (res.ok) {
          setUtrSubmittedReceipt({
            invoiceId: generatedInv,
            utr: ref,
            amount: paymentDetails.formattedInr,
          });
        } else {
          setGatewayError('Failed to record UTR. Please send directly on WhatsApp.');
        }
      }
    } catch (e) {
      setGatewayError('Network error while verifying transaction ID.');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const whatsappUtrLink = utrSubmittedReceipt
    ? `https://wa.me/918587965337?text=Hi%20TradeOS%20Support,%20I%20have%20paid%20${encodeURIComponent(utrSubmittedReceipt.amount)}%20for%20the%20${tier}%20Plan.%20Invoice:%20${utrSubmittedReceipt.invoiceId}%20and%20UTR:%20${utrSubmittedReceipt.utr}.%20Please%20verify%20my%20payment.`
    : `https://wa.me/918587965337?text=Hi%20TradeOS%20Support,%20I%20want%20to%20pay%20for%20the%20${tier}%20Plan.`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window with High Contrast Colors */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-lg bg-[#0F1626] border border-[#2A3A5E] rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] text-white"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-950 via-[#162238] to-[#0F1626] p-4 sm:p-5 border-b border-[#2A3A5E] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white tracking-wide uppercase">
                    Official Payment Gateway
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/40 font-bold">
                    SECURE 256-BIT
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  {tierName} • {billingCycle === 'ANNUAL' ? 'Annual Subscription' : 'Monthly Access'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Amount Bar */}
          <div className="bg-[#152035] px-6 py-3.5 border-b border-[#2A3A5E] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Total Payable Amount:</span>
            <div className="text-right">
              <span className="text-lg font-black text-emerald-400 font-mono tracking-wide">
                {paymentDetails.formattedInr}
              </span>
              {paymentDetails.currency !== 'INR' && (
                <span className="text-[11px] text-slate-300 block font-mono">
                  ({paymentDetails.formattedDisplay})
                </span>
              )}
            </div>
          </div>

          {/* iFrame Notice Badge */}
          {isIframe && (
            <div className="mx-6 mt-3 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-blue-300 font-medium">
                <Compass className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Embedded Sandbox Preview Mode</span>
              </div>
              <span className="text-[10px] text-slate-400">Standalone fallback active</span>
            </div>
          )}

          {/* Error Banner */}
          {gatewayError && (
            <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1 font-medium">
                <span>{gatewayError}</span>
              </div>
            </div>
          )}

          {/* Notice Banner */}
          {gatewayNotice && !gatewayError && (
            <div className="mx-6 mt-3 p-3 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-200 text-xs flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-blue-300 mt-0.5" />
              <div className="flex-1 font-medium">
                <span>{gatewayNotice}</span>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            {utrSubmittedReceipt ? (
              /* Receipt Submitted State */
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center mx-auto text-amber-300">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
                    Receipt Submitted • Verification Pending
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">Payment Under Verification</h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1">
                    Your reference ID has been recorded. Once verified with the bank or Razorpay receipt, your plan will activate.
                  </p>
                </div>

                <div className="bg-[#152035] p-4 rounded-2xl border border-[#2A3A5E] text-xs font-mono text-left space-y-2 max-w-sm mx-auto">
                  <div className="flex justify-between text-slate-300">
                    <span>Invoice ID:</span>
                    <strong className="text-white">{utrSubmittedReceipt.invoiceId}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Submitted Ref:</span>
                    <strong className="text-emerald-400">{utrSubmittedReceipt.utr}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Amount:</span>
                    <strong className="text-white">{utrSubmittedReceipt.amount}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Status:</span>
                    <span className="text-amber-400 font-bold">Pending Approval</span>
                  </div>
                </div>

                <a
                  href={whatsappUtrLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Send Screenshot on WhatsApp (+91 8587965337)</span>
                </a>
              </div>
            ) : (
              <>
                {/* Method Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#152035] rounded-2xl border border-[#2A3A5E]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('RAZORPAY_GATEWAY')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'RAZORPAY_GATEWAY'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                    <span>Razorpay Gateway</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('DIRECT_UPI')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'DIRECT_UPI'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Instant UPI & QR</span>
                  </button>
                </div>

                {/* TAB 1: RAZORPAY GATEWAY */}
                {activeTab === 'RAZORPAY_GATEWAY' && (
                  <div className="space-y-3.5">
                    {/* Method Overview Card */}
                    <div className="p-4 rounded-2xl bg-[#152035] border border-blue-500/30 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <span>Razorpay Checkout (UPI, Cards & Netbanking)</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        Pay securely through official Razorpay checkout using UPI apps, Debit/Credit Cards, or Netbanking.
                      </p>

                      <div className="grid grid-cols-3 gap-2 pt-1 text-xs text-slate-200 font-mono">
                        <div className="p-2 rounded-xl bg-black/30 border border-white/10 text-center">
                          <Smartphone className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                          <span className="font-bold">UPI / Apps</span>
                        </div>
                        <div className="p-2 rounded-xl bg-black/30 border border-white/10 text-center">
                          <CreditCard className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                          <span className="font-bold">Cards</span>
                        </div>
                        <div className="p-2 rounded-xl bg-black/30 border border-white/10 text-center">
                          <Building2 className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
                          <span className="font-bold">Netbanking</span>
                        </div>
                      </div>
                    </div>

                    {/* Action 1: Standard / In-Page Checkout */}
                    <button
                      type="button"
                      disabled={isLaunchingGateway || isCreatingLink}
                      onClick={handleLaunchRazorpayGateway}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 disabled:opacity-50"
                    >
                      {isLaunchingGateway ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Connecting to Razorpay...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-emerald-300" />
                          <span>Proceed to Pay {paymentDetails.formattedInr} on Razorpay</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>

                    {/* Action 2: Direct Standalone Tab Checkout (iFrame Sandbox Bypass) */}
                    <button
                      type="button"
                      disabled={isCreatingLink || isLaunchingGateway}
                      onClick={handleOpenStandaloneCheckout}
                      className="w-full py-2.5 px-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 hover:text-emerald-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isCreatingLink ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                          <span>Generating Standalone Checkout Link...</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Open in Standalone Tab (Bypasses iFrame Restrictions)</span>
                        </>
                      )}
                    </button>

                    {/* Payment ID / UTR verification */}
                    <div className="p-4 rounded-2xl bg-[#152035] border border-[#2A3A5E] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-white block">
                          Enter Razorpay Payment ID or UPI Ref:
                        </label>
                        <span className="text-[10px] text-slate-300 font-mono">e.g. pay_... or 12-digit UTR</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={referenceInput}
                          onChange={(e) => setReferenceInput(e.target.value)}
                          placeholder="pay_xxxxxxxxxxxxxx or UTR"
                          className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder-slate-400 focus:outline-none focus:border-blue-400"
                        />
                        <button
                          type="button"
                          disabled={isSubmittingManual || referenceInput.trim().length < 6}
                          onClick={handleVerifyTransaction}
                          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingManual ? 'Verifying...' : 'Verify'}
                        </button>
                      </div>
                    </div>

                    {/* Key Status Bar */}
                    <div className="p-3 rounded-2xl bg-[#152035] border border-[#2A3A5E] flex items-center justify-between text-xs text-slate-200">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="font-mono truncate">
                          Key: {isKeyConfigured ? `${razorpayKey.substring(0, 16)}...` : 'Not configured'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenMerchantSettings();
                        }}
                        className="text-blue-300 hover:text-white font-bold flex items-center gap-1 shrink-0 cursor-pointer ml-2"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Merchant Settings</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: DIRECT UPI QR & APPS */}
                {activeTab === 'DIRECT_UPI' && (
                  <div className="space-y-4">
                    {/* QR Code and details */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#152035] p-4 rounded-2xl border border-emerald-500/30">
                      <div className="p-2.5 bg-white rounded-2xl shadow-md shrink-0">
                        <UpiQrCode
                          vpa={upiId}
                          payeeName={payeeName}
                          amount={paymentDetails.inrAmount}
                          currency="INR"
                          note={`TradeOS-${tier}`}
                          size={130}
                        />
                      </div>
                      <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                        <span className="text-xs font-black text-white block uppercase tracking-wider">
                          Scan with Any UPI App
                        </span>
                        
                        <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                          <span className="text-xs text-slate-200 font-mono truncate">
                            UPI ID: <strong className="text-emerald-300 font-bold">{upiId}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
                            title="Copy UPI ID"
                          >
                            {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <p className="text-xs text-slate-300">
                          Payee: <strong className="text-white">{payeeName}</strong>
                        </p>
                        <p className="text-sm text-emerald-400 font-mono font-black">
                          Amount: {paymentDetails.formattedInr}
                        </p>
                      </div>
                    </div>

                    {/* Direct 1-Tap UPI App Launch for Mobile */}
                    <div className="space-y-2">
                      <span className="text-xs text-white font-bold block">
                        Direct 1-Tap Pay on Mobile:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <a
                          href={upiIntentUri}
                          className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                          <Smartphone className="w-4 h-4 text-blue-400" />
                          <span>Any UPI App</span>
                        </a>

                        <a
                          href={`phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${paymentDetails.inrAmount}&cu=INR`}
                          className="py-2.5 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/50 text-xs font-bold text-purple-200 flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                          <span>PhonePe</span>
                        </a>

                        <a
                          href={`paytmmp://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${paymentDetails.inrAmount}&cu=INR`}
                          className="py-2.5 px-3 rounded-xl bg-sky-600/30 hover:bg-sky-600/50 border border-sky-400/50 text-xs font-bold text-sky-200 flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                          <span>Paytm</span>
                        </a>

                        <a
                          href={`tez://upi/pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${paymentDetails.inrAmount}&cu=INR`}
                          className="py-2.5 px-3 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/50 text-xs font-bold text-emerald-200 flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                          <span>Google Pay</span>
                        </a>
                      </div>
                    </div>

                    {/* UTR Input Form */}
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-bold text-white block">
                        Enter 12-Digit Bank UTR / Reference No. from payment receipt:
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        value={referenceInput}
                        onChange={(e) => setReferenceInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 423910847291"
                        className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder-slate-400 focus:outline-none focus:border-emerald-400"
                      />
                      <p className="text-[10px] text-slate-300">
                        * Once submitted, your payment receipt will be sent for manual admin verification.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmittingManual || referenceInput.length < 6}
                      onClick={handleVerifyTransaction}
                      className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingManual ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Submitting Receipt...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit UTR for Verification</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
