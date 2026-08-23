import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  Twitter,
  Gift,
  Award,
  Sparkles,
  Users,
  CheckCircle2,
  ExternalLink,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getPublicAppUrl } from '../../utils/appUrl';

interface ShareReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const ShareReferralModal: React.FC<ShareReferralModalProps> = ({
  isOpen,
  onClose,
  userName = 'SmartAi',
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'telegram' | 'custom'>('whatsapp');
  const [customPhone, setCustomPhone] = useState('');

  if (!isOpen) return null;

  const appUrl = getPublicAppUrl();
  const referralCode = 'TRADEOS-SMARTAI99';
  const shareLink = `${appUrl}?ref=SmartAi`;

  const defaultShareText = `🚀 Bhai yeh TradeosAi Trading Terminal check karo! (Referral Code: SmartAi)
📊 Real-time Multi-Asset Charts, Risk Matrix Calculator, AI Vision Trade Review, & Prop Firm Shield.
Sab kuch 100% free trader workspace me available hai!

👉 Join directly: ${shareLink}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToWhatsApp = (phone?: string) => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const baseUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(defaultShareText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(defaultShareText)}`;
    window.open(baseUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0F1420] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-[#25D366] flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">Share TradeosAi with Friends</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                VIRAL PASS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Share in trading groups & WhatsApp circles to unlock VIP AI Coach & Pro badges
            </p>
          </div>
        </div>

        {/* 1-Click WhatsApp Big CTA */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#25D366]/15 via-[#25D366]/10 to-transparent border border-[#25D366]/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#25D366] flex items-center justify-center text-slate-950">
                <MessageCircle className="w-4 h-4 fill-current" />
              </div>
              <span className="text-sm font-black text-white">Instant WhatsApp 1-Click Share</span>
            </div>
            <span className="text-[10px] font-bold text-[#25D366] bg-[#25D366]/10 px-2 py-0.5 rounded-full">
              Recommended
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Automatically opens WhatsApp with a pre-formatted Hindi/English message and your unique referral link:
          </p>

          <button
            onClick={() => handleSendToWhatsApp()}
            className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-slate-950 font-black text-sm transition-all shadow-lg shadow-[#25D366]/30 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Open WhatsApp & Share with Friends</span>
          </button>
        </div>

        {/* Direct Phone Number WhatsApp input */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <label className="text-xs font-bold text-slate-300 block">
            Or Send Direct WhatsApp Message to Specific Trader Number:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="tel"
              placeholder="+91 98765 43210 (Country code + Mobile)"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0A0E18] border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => handleSendToWhatsApp(customPhone)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
            >
              Send Invite
            </button>
          </div>
        </div>

        {/* Referral Link & Code Box */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Your Personal Referral Link</span>
            <span className="text-[10px] text-emerald-400 font-mono">Code: {referralCode}</span>
          </label>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[#090D17] border border-white/10">
            <input
              type="text"
              readOnly
              value={shareLink}
              className="flex-1 bg-transparent px-2 text-xs font-mono text-emerald-400 select-all outline-none"
            />
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Social Channels Row */}
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent('🚀 Free AI Trading Terminal & Psychology Journal: TradeosAi')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/30 text-[#229ED9] text-xs font-bold transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Telegram Channel</span>
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Elevate your trading discipline with TradeosAi! 📈 Live multi-asset charts, risk calculators & AI review: ${shareLink}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 text-xs font-bold transition-all"
          >
            <Twitter className="w-4 h-4" />
            <span>Twitter / X</span>
          </a>
        </div>

        {/* Referral Rewards List */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5" />
            Unlockable Referral Milestone Perks
          </span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-200">1 Friend: Unlock Dark Glass Themes</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 font-mono">UNLOCKED</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-slate-200">3 Friends: Lifetime Gemini 3.7 AI Coach</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 font-mono">2 More Left</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-200">5 Friends: VIP Institutional Badge & Priority Feeds</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 font-mono">In Progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
