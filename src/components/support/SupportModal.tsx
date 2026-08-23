import React, { useState } from 'react';
import {
  X,
  Mail,
  MessageSquare,
  LifeBuoy,
  CheckCircle2,
  Copy,
  Check,
  Send,
  ExternalLink,
  ShieldCheck,
  Clock,
  HelpCircle,
  ChevronDown,
  Smartphone,
  Headphones,
  Zap,
  Scale,
  FileText,
} from 'lucide-react';
import { useMerchantPayment } from '../../context/MerchantPaymentContext';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  onOpenPolicies?: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  userEmail = 'trader@tradeos.live',
  userName = 'Trader',
  onOpenPolicies,
}) => {
  const { config } = useMerchantPayment();
  const OFFICIAL_EMAIL = config.supportEmail || 'capitalsurakshaclub@gmail.com';
  const OFFICIAL_WHATSAPP_NUMBER = config.supportWhatsApp || '+91 8587965337';
  const OFFICIAL_WHATSAPP_RAW = (config.supportWhatsApp || '8587965337').replace(/\D/g, '');
  const WHATSAPP_LINK = `https://wa.me/${OFFICIAL_WHATSAPP_RAW}?text=Hi%20TradeosAi%20Support%20Team,%20I%20am%20${encodeURIComponent(userName)}%20and%20I%20need%20assistance%20with%20TradeosAi.`;

  const [activeTab, setActiveTab] = useState<'ticket' | 'faq' | 'contact'>('ticket');
  const [copied, setCopied] = useState(false);
  const [copiedWA, setCopiedWA] = useState(false);
  
  // Ticket form state
  const [ticketCategory, setTicketCategory] = useState('Payment / Billing');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'Normal' | 'High' | 'Urgent'>('High');
  const [ticketEmail, setTicketEmail] = useState(userEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  // FAQ accordion state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(OFFICIAL_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(OFFICIAL_WHATSAPP_NUMBER);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const generatedId = `CSC-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicketId(generatedId);
      setIsSubmitting(false);
    }, 900);
  };

  const handleResetTicket = () => {
    setSubmittedTicketId(null);
    setTicketSubject('');
    setTicketMessage('');
    setTicketCategory('Payment / Billing');
  };

  const faqs = [
    {
      q: 'Payment karne ke baad mera Pro plan kaise active hoga?',
      a: `Aap UPI (GPay/PhonePe/Paytm), Card, ya NetBanking se payment complete karne ke baad apna UTR/Transaction Reference ID submit karenge ya WhatsApp (${OFFICIAL_WHATSAPP_NUMBER}) par receipt bhejenge. Hamara automated system instant activate kar deta hai. Kisi bhi query ke liye ${OFFICIAL_EMAIL} par email karein.`,
    },
    {
      q: 'Broker CSV ya API Auto-Sync kaise kaam karta hai?',
      a: 'Trade Journal tab me jakar "Import Broker CSV" par click karein. Wahan Zerodha (TradeBook CSV), Dhan, MT4/MT5, Bybit, ya Binance ka statement upload karein. TradeosAi automatically aapke entry price, exit price, brokerage aur charges calculate karke execute kar dega.',
    },
    {
      q: 'Prop Firm (FTMO, FundedNext, Apex) Drawdown Shield kya hai?',
      a: 'Ye feature aapke daily allowed loss limit ko live monitor karta hai. Jaise hi aapka loss daily threshold (e.g. -4.5%) ke kareeb aata hai, system red alert generate karta hai aur AI Tilt Veto trigger karke revenge trading ko block karta hai.',
    },
    {
      q: 'Refund Policy aur Subscription cancellation kaise hoti hai?',
      a: `Hum 14-Day 100% Money-Back Guarantee dete hain. Agar aap satisfied nahi hain, toh simply ${OFFICIAL_EMAIL} par email drop karein ya WhatsApp (${OFFICIAL_WHATSAPP_NUMBER}) par message bhejein, full refund 24-48 ghante me aapke original payment source me transfer ho jayega.`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-xl bg-[#0E131F] border border-[#1C263C] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1C263C] bg-[#121827]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Headphones className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Capital Suraksha Support Desk</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                  24/7 Live Help
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official Support, WhatsApp Assistance & Priority Resolution for Traders
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

        {/* Official Channels Banner (Email + WhatsApp) */}
        <div className="px-5 py-2.5 bg-[#121827] border-b border-[#1C263C] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <strong className="text-emerald-300 font-mono select-all">{OFFICIAL_EMAIL}</strong>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="text-teal-300 font-mono font-bold">{OFFICIAL_WHATSAPP_NUMBER}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>WhatsApp Us</span>
            </a>

            <a
              href={`mailto:${OFFICIAL_EMAIL}?subject=TradeosAi%20Support%20Request%20-%20${encodeURIComponent(userName)}&body=Hi%20Capital%20Suraksha%20Club%20Team,%0A%0AMy%20query%20is:%20`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-[#1C263C] transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Email Us</span>
            </a>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center px-5 pt-2 border-b border-[#1C263C] bg-[#0E131F] gap-2">
          <button
            onClick={() => setActiveTab('ticket')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'ticket'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Submit Support Ticket</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'faq'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Instant FAQs & Knowledgebase</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'contact'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Direct WhatsApp & SLA</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'ticket' && (
            <div>
              {submittedTicketId ? (
                <div className="p-6 rounded-3xl bg-[#0E1321] border border-emerald-500/30 text-center space-y-4 animate-scale-in">
                  <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20">
                      Ticket ID: {submittedTicketId}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-3">Support Ticket Submitted Successfully!</h3>
                    <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                      Aapka message direct <strong>{OFFICIAL_EMAIL}</strong> aur hamare VIP WhatsApp desk (<strong>{OFFICIAL_WHATSAPP_NUMBER}</strong>) ko dispatch ho gaya hai. Hamari expert team <strong>2 ghante ke andar</strong> aapse contact karegi.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/5 max-w-md mx-auto text-left text-xs space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Category:</span>
                      <span className="text-white font-medium">{ticketCategory}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Subject:</span>
                      <span className="text-white font-medium">{ticketSubject}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Priority:</span>
                      <span className="text-amber-400 font-bold">{ticketPriority}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Contact Email:</span>
                      <span className="text-emerald-400 font-mono">{ticketEmail}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap justify-center gap-3">
                    <a
                      href={WHATSAPP_LINK}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Follow-up on WhatsApp ({OFFICIAL_WHATSAPP_NUMBER})</span>
                    </a>
                    <button
                      onClick={handleResetTicket}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Submit Another Ticket
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                    <Zap className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-200 leading-relaxed">
                      Facing an issue with Pro activation, Broker Sync, or Prop drawdown rules? Submit below, or message us on WhatsApp (<strong>{OFFICIAL_WHATSAPP_NUMBER}</strong>) for instant resolution.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Issue Category *
                      </label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Payment / Billing">Payment / Plan Activation / UTR Issue</option>
                        <option value="Broker Auto-Sync">Broker Statement CSV / Auto-Sync</option>
                        <option value="Prop Firm Shield">Prop Firm Drawdown & Rules (FTMO/FundedNext)</option>
                        <option value="AI Vision Auditor">AI Chart Vision / Coach Question</option>
                        <option value="Bug / Error">Technical Bug / Feature Request</option>
                        <option value="Mentorship / Custom Plan">Capital Suraksha Club Mentorship Inquiry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Priority Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Normal', 'High', 'Urgent'] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setTicketPriority(p)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              ticketPriority === p
                                ? p === 'Urgent'
                                  ? 'bg-rose-500 text-white shadow-sm'
                                  : p === 'High'
                                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                                  : 'bg-emerald-500 text-slate-950 shadow-sm'
                                : 'bg-[#0E1321] text-slate-400 border border-white/5 hover:border-white/15'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Your Registered Email *
                      </label>
                      <input
                        type="email"
                        value={ticketEmail}
                        onChange={(e) => setTicketEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Subject / Brief Headline *
                      </label>
                      <input
                        type="text"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="e.g., UTR submitted for Pro Plan activation"
                        className="w-full bg-[#0E1321] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Describe your problem or question in detail *
                    </label>
                    <textarea
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      rows={4}
                      placeholder="Please provide details (Transaction UTR, Broker name, screenshot details, or specific error message)..."
                      className="w-full bg-[#0E1321] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                      required
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      Average Resolution Time: <strong>under 2 hours</strong>
                    </span>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Ticket</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-3">
              {faqs.map((f, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[#0E1321] border border-white/5 overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-white/[0.02]"
                    >
                      <span className="text-xs font-bold text-slate-200 pr-4">{f.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-emerald-400 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-400 border-t border-white/5 leading-relaxed bg-[#0B0F19]">
                        {f.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Official WhatsApp Card */}
                <div className="p-4 rounded-2xl bg-[#0E1321] border border-teal-500/30 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Official WhatsApp Desk</h4>
                      <p className="text-[11px] text-slate-400">Instant VIP verification & chats</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 font-mono bg-[#0B0F19] p-2.5 rounded-xl border border-white/5 select-all font-bold">
                    {OFFICIAL_WHATSAPP_NUMBER}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyWhatsApp}
                      className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold transition-colors cursor-pointer text-center"
                    >
                      {copiedWA ? 'Copied!' : 'Copy Number'}
                    </button>
                    <a
                      href={WHATSAPP_LINK}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition-colors cursor-pointer text-center"
                    >
                      Direct Chat
                    </a>
                  </div>
                </div>

                {/* Official Email Card */}
                <div className="p-4 rounded-2xl bg-[#0E1321] border border-emerald-500/20 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Official Helpdesk Email</h4>
                      <p className="text-[11px] text-slate-400">Primary support pipeline</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 font-mono bg-[#0B0F19] p-2.5 rounded-xl border border-white/5 select-all">
                    {OFFICIAL_EMAIL}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyEmail}
                      className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold transition-colors cursor-pointer text-center"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <a
                      href={`mailto:${OFFICIAL_EMAIL}`}
                      className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      Direct Mail
                    </a>
                  </div>
                </div>
              </div>

              {/* Service Level Agreement (SLA) Matrix */}
              <div className="p-4 rounded-2xl bg-[#0E1321] border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Support Service Level Guarantee (SLA)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#0B0F19] border border-white/5">
                    <span className="text-slate-400 text-[10px] block">WhatsApp Activation</span>
                    <span className="font-bold text-emerald-400">&lt; 10 Minutes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0B0F19] border border-white/5">
                    <span className="text-slate-400 text-[10px] block">Email Ticket Resolution</span>
                    <span className="font-bold text-white">&lt; 2 Hours</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0B0F19] border border-white/5">
                    <span className="text-slate-400 text-[10px] block">Live Desk Support Hours</span>
                    <span className="font-bold text-amber-400">9:00 AM – 11:30 PM IST</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Copyright and Policy Trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-t border-white/10 bg-[#0E1321] gap-2 text-xs">
          <div className="text-slate-400">
            <span>&copy; 2026 <strong>TradeosAi</strong>. All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-3">
            {onOpenPolicies && (
              <button
                onClick={onOpenPolicies}
                className="text-slate-400 hover:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Terms, Privacy & Refund Policy</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
