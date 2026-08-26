import React, { useState, useMemo } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Copy,
  Check,
  Share2,
  Calendar,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Smartphone,
  ExternalLink,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { Trade } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';

interface WhatsAppDailyDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  userName?: string;
  disciplineScore?: number;
}

export const WhatsAppDailyDigestModal: React.FC<WhatsAppDailyDigestModalProps> = ({
  isOpen,
  onClose,
  trades = [],
  userName = 'Trader',
  disciplineScore = 92,
}) => {
  const { formatCurrency, currency } = useCurrency();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [customPhone, setCustomPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  // Filter trades for the selected date
  const dailyTrades = useMemo(() => {
    return trades.filter((t) => {
      const tradeDate = (t.openDate || t.closeDate || '').split('T')[0];
      return tradeDate === selectedDate || trades.length <= 5; // fallback to all recent if no exact date match
    });
  }, [trades, selectedDate]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalTrades = dailyTrades.length;
    let totalPnl = 0;
    let winCount = 0;
    let lossCount = 0;
    let totalFees = 0;

    dailyTrades.forEach((t) => {
      const pnl = t.pnl || 0;
      totalPnl += pnl;
      if (pnl > 0) winCount++;
      else if (pnl < 0) lossCount++;
      totalFees += t.fees || 20; // default estimated ₹20 / $0.5 brokerage
    });

    const winRate = totalTrades > 0 ? Math.round((winCount / totalTrades) * 100) : 0;
    const isProfitable = totalPnl >= 0;

    return {
      totalTrades,
      totalPnl,
      winCount,
      lossCount,
      winRate,
      totalFees,
      isProfitable,
    };
  }, [dailyTrades]);

  // Generate Formatted Text for WhatsApp & Telegram
  const digestMessage = useMemo(() => {
    const pnlSymbol = metrics.isProfitable ? '🟢 +' : '🔴 ';
    const formattedPnl = formatCurrency(metrics.totalPnl);
    const dateFormatted = new Date(selectedDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    let text = `📊 *TradeOS AI — Daily Trading & Risk Audit*\n`;
    text += `👤 Trader: ${userName} | 📅 ${dateFormatted}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *Net P&L:* ${pnlSymbol}${formattedPnl}\n`;
    text += `🎯 *Win Rate:* ${metrics.winRate}% (${metrics.winCount}W / ${metrics.lossCount}L)\n`;
    text += `🛡️ *Discipline Score:* ${disciplineScore}% (${disciplineScore >= 80 ? 'EXCELLENT' : 'NEEDS FOCUS'})\n`;
    text += `📉 *Est. Brokerage & Charges:* ${formatCurrency(metrics.totalFees)}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📋 *Today's Executions:* (${metrics.totalTrades} Trades)\n`;

    if (dailyTrades.length === 0) {
      text += `• No trades executed. Capital preserved (100% Patience Rule).\n`;
    } else {
      dailyTrades.slice(0, 6).forEach((t) => {
        const itemPnl = t.pnl || 0;
        const icon = itemPnl >= 0 ? '✅' : '❌';
        text += `${icon} *${t.symbol}* (${t.direction}) ➔ ${itemPnl >= 0 ? '+' : ''}${formatCurrency(itemPnl)} [${t.strategy || 'Price Action'}]\n`;
      });
      if (dailyTrades.length > 6) {
        text += `• ...and ${dailyTrades.length - 6} more executed trades.\n`;
      }
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💡 *Psychology & Risk Audit:*\n`;
    if (metrics.totalTrades > 5) {
      text += `⚠️ High trade volume detected. Ensure no revenge trading took place.\n`;
    } else {
      text += `✅ Maintained strict trade selection and predetermined stop-loss discipline.\n`;
    }
    text += `⚖️ *SEBI Risk Disclaimer:* Analytics & Journaling summary only. No investment advice.\n`;
    text += `🚀 Generated via TradeOS AI Terminal`;

    return text;
  }, [selectedDate, metrics, dailyTrades, userName, disciplineScore, formatCurrency]);

  if (!isOpen) return null;

  // 1-Click WhatsApp Direct Share Link
  const handleOpenWhatsApp = () => {
    const encodedText = encodeURIComponent(digestMessage);
    let url = `https://api.whatsapp.com/send?text=${encodedText}`;
    if (customPhone.trim()) {
      const cleanPhone = customPhone.replace(/[^0-9]/g, '');
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    }
    window.open(url, '_blank');
  };

  // Copy to Clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(digestMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Send to Connected Telegram Bot
  const handleSendTelegram = async () => {
    setSendingTelegram(true);
    setTelegramStatus(null);
    try {
      const res = await fetch('/api/alerts/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: digestMessage,
          parseMode: 'Markdown',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTelegramStatus('✅ Successfully dispatched daily summary to Telegram!');
      } else {
        setTelegramStatus(`⚠️ Telegram dispatch note: ${data.error || 'Check bot configuration'}`);
      }
    } catch (err: any) {
      setTelegramStatus(`⚠️ Network note: ${err?.message || 'Could not reach Telegram API'}`);
    } finally {
      setSendingTelegram(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F1420] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">WhatsApp & Telegram Daily Digest</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  1-Click Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400">Automated daily P&L, win-rate, discipline score & trade summary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selector & Key Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#141B2D] border border-white/5">
            <div className="text-[11px] text-slate-400">Selected Date</div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#141B2D] border border-white/5">
            <div className="text-[11px] text-slate-400">Net P&L</div>
            <div className={`text-base font-black mt-1 ${metrics.isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.isProfitable ? '+' : ''}{formatCurrency(metrics.totalPnl)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#141B2D] border border-white/5">
            <div className="text-[11px] text-slate-400">Win Rate</div>
            <div className="text-base font-bold text-blue-400 mt-1">
              {metrics.winRate}% ({metrics.winCount}W / {metrics.lossCount}L)
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#141B2D] border border-white/5">
            <div className="text-[11px] text-slate-400">Discipline Score</div>
            <div className="text-base font-bold text-amber-400 mt-1">
              {disciplineScore}%
            </div>
          </div>
        </div>

        {/* Formatted Message Live Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Generated Summary Message (WhatsApp/Telegram Ready)</span>
            </label>
            <button
              onClick={handleCopy}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs text-emerald-300/90 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto custom-scrollbar select-all">
            {digestMessage}
          </div>
        </div>

        {/* Optional Custom Phone Number */}
        <div className="p-3.5 rounded-2xl bg-[#141B2D] border border-white/5 space-y-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Optional: Specific WhatsApp Number (With Country Code e.g. 919876543210)</span>
          </div>
          <input
            type="tel"
            placeholder="Leave blank to pick recipient in WhatsApp app"
            value={customPhone}
            onChange={(e) => setCustomPhone(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Message */}
        {telegramStatus && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 animate-in fade-in">
            {telegramStatus}
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={handleOpenWhatsApp}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Send via WhatsApp</span>
          </button>

          <button
            onClick={handleSendTelegram}
            disabled={sendingTelegram}
            className="w-full py-3 px-4 rounded-xl bg-[#229ED9] hover:bg-[#1D8AC0] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#229ED9]/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {sendingTelegram ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
            <span>Dispatch Telegram</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Message'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
