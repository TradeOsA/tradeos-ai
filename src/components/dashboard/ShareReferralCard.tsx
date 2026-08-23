import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Sparkles,
  Users,
  MessageCircle,
  Send,
  Gift,
  Award,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getPublicAppUrl } from '../../utils/appUrl';

interface ShareReferralCardProps {
  userName?: string;
  onOpenDetailedModal?: () => void;
}

export const ShareReferralCard: React.FC<ShareReferralCardProps> = ({
  userName = 'Trader',
  onOpenDetailedModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [invitedCount, setInvitedCount] = useState(1);

  const appUrl = getPublicAppUrl();
  const referralCode = `TRADEOS-${(userName || 'VIP').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'ALPHA'}99`;

  const shareText = `🔥 Bhai yeh TradeosAi Trading Terminal dekho! 
📈 Real-time Multi-Asset Charts, Risk Matrix, AI Trade Review & Psychology Journal sab free me hai.
Zero risk calculation mistakes & 1-click trade audits!

👉 Try now: ${appUrl}?ref=${referralCode}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl + '?ref=' + referralCode)}&text=${encodeURIComponent('🚀 Best AI Trading Terminal & Risk Journal: TradeosAi!')}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Elevating my trading edge with @TradeosAi_AI — Real-time charts, AI trade audits & risk shield! 📈\n\nCheck it out: ${appUrl}?ref=${referralCode}`)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${appUrl}?ref=${referralCode}`);
    setCopied(true);
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppClick = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="share-referral-card"
      className="glass-panel rounded-3xl p-5 sm:p-6 border border-emerald-500/25 relative overflow-hidden bg-gradient-to-br from-[#0D1524] via-[#0A101C] to-[#070D18] shadow-xl"
    >
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left: Headline & Benefits */}
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <Gift className="w-3 h-3 text-emerald-400 animate-bounce" />
              Free Viral Trader Pass • Invite & Unlock VIP Perks
            </span>
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
              1-Click Share
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Share App with Trader Friends</span>
            <span className="text-xs px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold hidden sm:inline">
              +1 Month Pro Free
            </span>
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Apne trading groups aur dosto ko WhatsApp par share karein. Dosto ko milega instant AI
            journal access aur aapko milega <strong className="text-emerald-400">VIP Pro AI Coach Badge</strong>!
          </p>

          {/* Referral Progress */}
          <div className="pt-1 flex items-center gap-3">
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span className="text-slate-400">Trader Friends Joined:</span>
                <span className="text-emerald-400 font-mono">{invitedCount}/3 for VIP Badge</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 border border-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${(invitedCount / 3) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-1 rounded-xl">
              <Award className="w-3.5 h-3.5" />
              <span>Badge 33% Ready</span>
            </div>
          </div>
        </div>

        {/* Right: Instant 1-Click WhatsApp Button & Quick Action Strip */}
        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {/* Primary WhatsApp 1-Click Share Button */}
          <button
            onClick={handleWhatsAppClick}
            className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-slate-950 font-black text-sm transition-all shadow-lg shadow-[#25D366]/20 cursor-pointer group"
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-slate-950 fill-current" />
            </div>
            <span>Share on WhatsApp</span>
          </button>

          {/* Telegram & Twitter / Copy Link Buttons */}
          <div className="flex items-center gap-2">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-2xl bg-[#229ED9]/20 hover:bg-[#229ED9]/30 border border-[#229ED9]/40 text-[#229ED9] text-xs font-bold transition-all active:scale-95"
              title="Share on Telegram"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="sm:hidden lg:inline">Telegram</span>
            </a>

            <button
              onClick={handleCopyLink}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-2xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
              }`}
              title="Copy referral link"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
