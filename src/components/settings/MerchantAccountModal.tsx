import React, { useState } from 'react';
import {
  X,
  Building2,
  QrCode,
  CheckCircle2,
  Save,
  RotateCcw,
  Smartphone,
  Mail,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useMerchantPayment } from '../../context/MerchantPaymentContext';

interface MerchantAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MerchantAccountModal: React.FC<MerchantAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { config, updateConfig, resetToDefault } = useMerchantPayment();

  const [upiId, setUpiId] = useState(config.upiId);
  const [payeeName, setPayeeName] = useState(config.payeeName);
  const [bankName, setBankName] = useState(config.bankName);
  const [accountNumber, setAccountNumber] = useState(config.accountNumber);
  const [ifscCode, setIfscCode] = useState(config.ifscCode);
  const [accountType, setAccountType] = useState(config.accountType);
  const [supportEmail, setSupportEmail] = useState(config.supportEmail);
  const [supportWhatsApp, setSupportWhatsApp] = useState(config.supportWhatsApp);
  const [razorpayKeyId, setRazorpayKeyId] = useState(config.razorpayKeyId || '');
  const [razorpayPaymentLink, setRazorpayPaymentLink] = useState(config.razorpayPaymentLink || '');

  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      upiId: upiId.trim(),
      payeeName: payeeName.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      accountType: accountType.trim(),
      supportEmail: supportEmail.trim(),
      supportWhatsApp: supportWhatsApp.trim(),
      razorpayKeyId: razorpayKeyId.trim(),
      razorpayPaymentLink: razorpayPaymentLink.trim(),
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    resetToDefault();
    setUpiId('8587965337@paytm');
    setPayeeName('Ajay Soni');
    setBankName('Kotak Mahindra Bank');
    setAccountNumber('4145392198');
    setIfscCode('KKBK0000286');
    setAccountType('Savings Account');
    setSupportEmail('capitalsurakshaclub@gmail.com');
    setSupportWhatsApp('+91 8587965337');
    setRazorpayKeyId('');
    setRazorpayPaymentLink('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-xl bg-[#0E131F] border border-[#1C263C] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1C263C] bg-[#121827]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Merchant Payment & Payout Setup</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                  Live Settlement
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure your real UPI ID, Bank Account & Razorpay Keys to receive 100% direct subscription payments
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

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar text-xs">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Save your <strong>Real UPI ID (GPay / PhonePe / Paytm)</strong>, <strong>Bank Account</strong>, or <strong>Razorpay Credentials</strong> to receive real money for all subscription upgrades.
              </p>
            </div>

            {/* Razorpay Live Gateway Settings */}
            <div className="p-4 rounded-xl bg-[#121827] border border-blue-500/30 space-y-3">
              <div className="flex items-center gap-2 font-bold text-white text-xs">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Razorpay Live Gateway & Payment Link</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono">
                  Recommended for Real Money
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Razorpay Key ID (rzp_live_... or rzp_test_...)
                  </label>
                  <input
                    type="text"
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    placeholder="e.g. rzp_live_xxxxxxxxxxxxxx"
                    className="w-full bg-[#0E131F] border border-[#1C263C] rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Your Key ID from Razorpay Dashboard → Settings → API Keys.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Razorpay Payment Page / Link URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={razorpayPaymentLink}
                    onChange={(e) => setRazorpayPaymentLink(e.target.value)}
                    placeholder="e.g. https://rzp.io/l/your-plan-link"
                    className="w-full bg-[#0E131F] border border-[#1C263C] rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Direct payment link from your Razorpay account.
                  </span>
                </div>
              </div>
            </div>

            {/* UPI Settings */}
            <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] space-y-3">
              <div className="flex items-center gap-2 font-bold text-white text-xs">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Primary UPI Receiving ID (Instant Payout)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Your Real UPI ID / VPA *
                  </label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. 8587965337@paytm or yourname@okhdfcbank"
                    className="w-full bg-[#0E131F] border border-[#1C263C] rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Payments will land directly in this UPI linked bank account.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Beneficiary / Payee Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={payeeName}
                    onChange={(e) => setPayeeName(e.target.value)}
                    placeholder="e.g. TradeosAi / Your Name"
                    className="w-full bg-[#0E131F] border border-[#1C263C] rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Shown to traders in Google Pay / PhonePe / Paytm apps.
                  </span>
                </div>
              </div>
            </div>

            {/* Bank Details for NEFT / IMPS */}
            <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] space-y-3">
              <div className="flex items-center gap-2 font-bold text-white text-xs">
                <Building2 className="w-4 h-4 text-teal-400" />
                <span>Direct Bank Wire & IMPS Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    className="w-full bg-[#0E131F] border border-[#1C263C] rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 50200088921822"
                    className="w-full bg-[#0E131F] border border-[#1C263C] rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0000240"
                    className="w-full bg-[#0E131F] border border-[#1C263C] rounded-lg px-3 py-2 text-white font-mono uppercase focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Account Type</label>
                  <input
                    type="text"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    placeholder="Current / Savings"
                    className="w-full bg-[#0E131F] border border-[#1C263C] rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Official Support Desk Contacts */}
            <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] space-y-3">
              <div className="flex items-center gap-2 font-bold text-white text-xs">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Support & Helpdesk Channels</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Official WhatsApp Number</label>
                  <input
                    type="text"
                    value={supportWhatsApp}
                    onChange={(e) => setSupportWhatsApp(e.target.value)}
                    placeholder="+91 8587965337"
                    className="w-full bg-[#0E131F] border border-[#1C263C] rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Official Support Email</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="capitalsurakshaclub@gmail.com"
                    className="w-full bg-[#0E131F] border border-[#1C263C] rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-[#1C263C]">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm active:scale-95"
                >
                  {isSaved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Config Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Live Merchant Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
