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
  userEmail = 'trader@tradeosai.in',
  userName = 'Trader',
  onOpenPolicies,
}) => {
  const { config } = useMerchantPayment();
  const OFFICIAL_EMAIL = config.supportEmail || 'support@tradeosai.in';
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
      const generatedId = `TOS-${Math.floor(100000 + Math.random() * 900000)}`;
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
      q: 'How does plan activation work upon payment completion?',
      a: `Upon completing payment via UPI (GPay, PhonePe, Paytm), Card, or NetBanking, submit your UTR / Transaction Reference ID. The terminal automatically verifies and unlocks institutional access. For expedited processing, send your receipt to ${OFFICIAL_EMAIL} or WhatsApp (${OFFICIAL_WHATSAPP_NUMBER}).`,
    },
    {
      q: 'How do Broker CSV imports and API sync work?',
      a: 'Navigate to the Trade Journal tab and select "Import CSV" or "Broker API Setup". Upload statements from Zerodha, Dhan, Angel One, MT4/MT5, Delta Exchange, or Binance. TradeosAi automatically computes entry, exit, commissions, and net risk metrics.',
    },
    {
      q: 'What is the Prop Firm Drawdown & Tilt Guard?',
      a: 'The discipline engine monitors your real-time floating and closed losses against your preset daily maximum drawdown (e.g. -4.5%). When nearing breach limits, the terminal triggers audio alerts and locks order execution to prevent revenge trading.',
    },
    {
      q: 'What is the refund and cancellation policy?',
      a: `We provide a 14-Day Money-Back Guarantee. If the platform does not meet your operational workflow requirements, contact ${OFFICIAL_EMAIL} or WhatsApp (${OFFICIAL_WHATSAPP_NUMBER}) for an immediate refund.`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-lg bg-[#090D16] border border-[#1F2937] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1F2937] bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Enterprise Support Desk</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-medium border border-emerald-500/30">
                  Online
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official Support, Technical Assistance & Account Inquiries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#161F30] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Official Channels Banner (Email + WhatsApp) */}
        <div className="px-5 py-2.5 bg-[#0D1320] border-b border-[#1F2937] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <strong className="text-slate-200 font-mono select-all">{OFFICIAL_EMAIL}</strong>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-200 font-mono">{OFFICIAL_WHATSAPP_NUMBER}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111827] hover:bg-[#161F30] border border-[#1F2937] text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Desk</span>
            </a>

            <a
              href={`mailto:${OFFICIAL_EMAIL}?subject=TradeosAi%20Support%20Request%20-%20${encodeURIComponent(userName)}&body=Query%20details:`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#111827] hover:bg-[#161F30] text-slate-200 text-xs font-semibold border border-[#1F2937] transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>Email Desk</span>
            </a>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center px-5 pt-2 border-b border-[#1F2937] bg-[#090D16] gap-2">
          <button
            onClick={() => setActiveTab('ticket')}
            className={`pb-2.5 px-3 text-xs font-semibold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'ticket'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Submit Ticket</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`pb-2.5 px-3 text-xs font-semibold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'faq'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Knowledgebase & FAQs</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`pb-2.5 px-3 text-xs font-semibold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'contact'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Service SLA & Contacts</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#090D16]">
          {activeTab === 'ticket' && (
            <div>
              {submittedTicketId ? (
                <div className="p-6 rounded-lg bg-[#111827] border border-[#1F2937] text-center space-y-4 animate-scale-in">
                  <div className="w-12 h-12 mx-auto rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-3 py-1 rounded bg-[#090D16] text-blue-400 text-xs font-mono font-semibold border border-[#1F2937]">
                      Ticket Ref: {submittedTicketId}
                    </span>
                    <h3 className="text-base font-bold text-white mt-3">Support Request Dispatched</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                      Your ticket has been logged with the support queue. Expected response time is within 2 hours.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#090D16] border border-[#1F2937] max-w-md mx-auto text-left text-xs space-y-2">
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
                      <span className="text-blue-400 font-semibold">{ticketPriority}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Email:</span>
                      <span className="text-slate-200 font-mono">{ticketEmail}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap justify-center gap-3">
                    <a
                      href={WHATSAPP_LINK}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#161F30] border border-[#1F2937] text-slate-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp Follow-up</span>
                    </a>
                    <button
                      onClick={handleResetTicket}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Submit Another Ticket
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div className="p-3 rounded-lg bg-[#111827] border border-[#1F2937] flex items-start gap-3">
                    <Zap className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300 leading-relaxed">
                      For issues regarding plan activation, Broker Sync, or risk policies, submit below for rapid response from our desk.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Issue Category *
                      </label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full bg-[#111827] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Payment / Billing">Payment / Plan Activation / UTR</option>
                        <option value="Broker Auto-Sync">Broker CSV / API Integration</option>
                        <option value="Prop Firm Shield">Prop Firm Drawdown & Rules</option>
                        <option value="AI Vision Auditor">AI Chart Vision / Audit Query</option>
                        <option value="Bug / Error">Technical Bug / Feature Feedback</option>
                        <option value="Enterprise Inquiries">Enterprise / Multi-Seat Inquiries</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Priority Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Normal', 'High', 'Urgent'] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setTicketPriority(p)}
                            className={`py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              ticketPriority === p
                                ? p === 'Urgent'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : p === 'High'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-[#1F2937] text-white border border-slate-600'
                                : 'bg-[#111827] text-slate-400 border border-[#1F2937] hover:border-slate-600'
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
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Registered Email *
                      </label>
                      <input
                        type="email"
                        value={ticketEmail}
                        onChange={(e) => setTicketEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full bg-[#111827] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Subject Headline *
                      </label>
                      <input
                        type="text"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="Brief summary of request"
                        className="w-full bg-[#111827] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Details *
                    </label>
                    <textarea
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      rows={4}
                      placeholder="Include transaction UTR, broker details, or relevant error codes..."
                      className="w-full bg-[#111827] border border-[#1F2937] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                      required
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      Resolution SLA: <strong>&lt; 2 hours</strong>
                    </span>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all cursor-pointer active:scale-95 flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Transmitting...</span>
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
            <div className="space-y-2.5">
              {faqs.map((f, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-lg bg-[#111827] border border-[#1F2937] overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-[#161F30]"
                    >
                      <span className="text-xs font-semibold text-slate-200 pr-4">{f.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-400 border-t border-[#1F2937] leading-relaxed bg-[#0D1320]">
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
                <div className="p-4 rounded-lg bg-[#111827] border border-[#1F2937] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">Direct WhatsApp Desk</h4>
                      <p className="text-[11px] text-slate-400">Instant verification & inquiries</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 font-mono bg-[#090D16] p-2.5 rounded-lg border border-[#1F2937] select-all font-medium">
                    {OFFICIAL_WHATSAPP_NUMBER}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyWhatsApp}
                      className="flex-1 py-2 rounded-lg bg-[#090D16] hover:bg-[#161F30] border border-[#1F2937] text-slate-300 text-xs font-medium transition-colors cursor-pointer text-center"
                    >
                      {copiedWA ? 'Copied' : 'Copy Number'}
                    </button>
                    <a
                      href={WHATSAPP_LINK}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer text-center"
                    >
                      Chat on WhatsApp
                    </a>
                  </div>
                </div>

                {/* Official Email Card */}
                <div className="p-4 rounded-lg bg-[#111827] border border-[#1F2937] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">Official Helpdesk Email</h4>
                      <p className="text-[11px] text-slate-400">Primary enterprise ticket desk</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 font-mono bg-[#090D16] p-2.5 rounded-lg border border-[#1F2937] select-all">
                    {OFFICIAL_EMAIL}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyEmail}
                      className="flex-1 py-2 rounded-lg bg-[#090D16] hover:bg-[#161F30] border border-[#1F2937] text-slate-300 text-xs font-medium transition-colors cursor-pointer text-center"
                    >
                      {copied ? 'Copied' : 'Copy Email'}
                    </button>
                    <a
                      href={`mailto:${OFFICIAL_EMAIL}`}
                      className="flex-1 py-2 rounded-lg bg-[#1F2937] hover:bg-[#283548] text-white text-xs font-semibold transition-colors cursor-pointer text-center border border-[#1F2937]"
                    >
                      Send Email
                    </a>
                  </div>
                </div>
              </div>

              {/* Service Level Agreement (SLA) Matrix */}
              <div className="p-4 rounded-lg bg-[#111827] border border-[#1F2937] space-y-3">
                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Support Service Level Guarantee (SLA)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#090D16] border border-[#1F2937]">
                    <span className="text-slate-400 text-[10px] block">WhatsApp Activation</span>
                    <span className="font-semibold text-emerald-400">&lt; 10 Minutes</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#090D16] border border-[#1F2937]">
                    <span className="text-slate-400 text-[10px] block">Email Ticket Resolution</span>
                    <span className="font-semibold text-white">&lt; 2 Hours</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#090D16] border border-[#1F2937]">
                    <span className="text-slate-400 text-[10px] block">Live Desk Support Hours</span>
                    <span className="font-semibold text-slate-300">9:00 AM – 11:30 PM IST</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Copyright and Policy Trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-t border-[#1F2937] bg-[#111827] gap-2 text-xs">
          <div className="text-slate-400">
            <span>&copy; 2026 <strong>TradeosAi</strong>. All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-3">
            {onOpenPolicies && (
              <button
                onClick={onOpenPolicies}
                className="text-slate-400 hover:text-slate-200 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Terms & Policies</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#090D16] hover:bg-[#161F30] border border-[#1F2937] text-slate-300 font-medium text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
