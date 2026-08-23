import React, { useState, useEffect } from 'react';
import {
  Send,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Sliders,
  Calendar,
  Layers,
  Radio,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Lock,
  Search,
  RefreshCw,
  User,
  Users,
  Bot,
} from 'lucide-react';
import { TelegramAlertConfig } from '../../types';
import { auth, db, doc, setDoc, getDoc } from '../../lib/firebase';

interface TelegramAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets?: any[];
  onOpenMacroAlerts?: () => void;
}

const DEFAULT_CONFIG: TelegramAlertConfig = {
  isEnabled: true,
  botToken: '',
  chatId: '',
  channelUsername: '@TradeOS_Signals',
  alertOnBreakout: true,
  alertOnRiskDrawdown: true,
  alertOnMacroNews: true,
  alertOnJournalSync: false,
  minConfidenceScore: 88,
  antiFakeoutFilter: true,
  autoSendBreakouts: true,
  minPriceJumpUsd: 400,
  respectIndianMarketHours: true,
  segmentThrottling: true,
};

// Helper to sanitize chat ID / username input
function sanitizeChatIdInput(input?: string): string {
  if (!input) return '';
  let clean = String(input).trim();
  if (clean.includes('t.me/')) {
    const after = clean.split('t.me/')[1]?.split('?')[0]?.split('/')[0]?.trim();
    if (after && !after.startsWith('+') && !after.startsWith('joinchat')) {
      clean = `@${after.replace(/^@/, '')}`;
    }
  }
  return clean;
}

// Helper to sanitize bot token input
function sanitizeBotTokenInput(input?: string): string {
  if (!input) return '';
  let clean = String(input).trim();
  clean = clean.replace(/^["'`]|["'`]$/g, '');
  if (clean.includes('api.telegram.org/bot')) {
    clean = clean.split('api.telegram.org/bot')[1]?.split('/')[0]?.trim() || clean;
  }
  if (clean.toLowerCase().startsWith('bot') && clean.includes(':')) {
    clean = clean.slice(3).trim();
  }
  clean = clean.replace(/^(token|bot_token|api_key|token:)\s*[:=]\s*/i, '').trim();
  return clean;
}

export const TelegramAlertsModal: React.FC<TelegramAlertsModalProps> = ({
  isOpen,
  onClose,
  assets,
  onOpenMacroAlerts,
}) => {
  const [config, setConfig] = useState<TelegramAlertConfig>(() => {
    try {
      const saved = localStorage.getItem('tradeos_telegram_alert_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [botToken, setBotToken] = useState(config.botToken || '');
  const [chatId, setChatId] = useState(config.chatId || '');
  const [channelUsername, setChannelUsername] = useState(config.channelUsername || '@TradeOS_Signals');
  const [minScore, setMinScore] = useState<number>(config.minConfidenceScore || 88);
  const [antiFakeout, setAntiFakeout] = useState<boolean>(config.antiFakeoutFilter ?? true);
  const [autoSend, setAutoSend] = useState<boolean>(config.autoSendBreakouts ?? true);
  const [minPriceJumpUsd, setMinPriceJumpUsd] = useState<number>(config.minPriceJumpUsd || 400);
  const [respectIndianMarketHours, setRespectIndianMarketHours] = useState<boolean>(config.respectIndianMarketHours ?? true);
  const [segmentThrottling, setSegmentThrottling] = useState<boolean>(config.segmentThrottling ?? true);

  const [isVerifyingBot, setIsVerifyingBot] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [isScanningNow, setIsScanningNow] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string; preview?: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [sentinelStatus, setSentinelStatus] = useState<any>(null);
  const [detectedBotName, setDetectedBotName] = useState<string>('');
  const [detectedChats, setDetectedChats] = useState<any[]>([]);

  // Load server-side Sentinel config & Firestore config on open (prevents settings loss on remix/reload)
  useEffect(() => {
    if (!isOpen) return;

    // 1. Fetch server config (persisted in container storage)
    fetch('/api/alerts/telegram/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.config) {
            if (data.config.botToken && !botToken) setBotToken(data.config.botToken);
            if (data.config.chatId && !chatId) setChatId(data.config.chatId);
            if (data.config.minPriceJumpUsd) setMinPriceJumpUsd(data.config.minPriceJumpUsd);
            if (data.config.minConfidenceScore) setMinScore(data.config.minConfidenceScore);
            if (data.config.respectIndianMarketHours !== undefined) setRespectIndianMarketHours(data.config.respectIndianMarketHours);
            if (data.config.segmentThrottling !== undefined) setSegmentThrottling(data.config.segmentThrottling);
          }
          if (data.status) {
            setSentinelStatus(data.status);
          }
        }
      })
      .catch((err) => console.warn('Could not fetch server Telegram config:', err));

    // 2. Fetch from Firestore if user is authenticated
    if (auth.currentUser) {
      getDoc(doc(db, 'users', auth.currentUser.uid))
        .then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.telegramConfig) {
              if (data.telegramConfig.botToken && !botToken) setBotToken(data.telegramConfig.botToken);
              if (data.telegramConfig.chatId && !chatId) setChatId(data.telegramConfig.chatId);
            }
          }
        })
        .catch((e) => console.warn('Could not load Firestore telegram settings:', e));
    }
  }, [isOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('tradeos_telegram_alert_config', JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save telegram alert settings locally', e);
    }
  }, [config]);

  if (!isOpen) return null;

  const isInviteLink = chatId.includes('t.me/+') || chatId.includes('joinchat') || (chatId.startsWith('+') && chatId.length > 5);

  const handleChatIdChange = (val: string) => {
    const sanitized = sanitizeChatIdInput(val);
    setChatId(sanitized);
  };

  const handleSaveConfig = async () => {
    const cleanChat = sanitizeChatIdInput(chatId);
    const updated: TelegramAlertConfig = {
      ...config,
      botToken: botToken.trim(),
      chatId: cleanChat,
      channelUsername: channelUsername.trim(),
      minConfidenceScore: minScore,
      antiFakeoutFilter: antiFakeout,
      autoSendBreakouts: autoSend,
      minPriceJumpUsd: minPriceJumpUsd,
      respectIndianMarketHours: respectIndianMarketHours,
      segmentThrottling: segmentThrottling,
      isEnabled: true,
    };
    setConfig(updated);

    // 1. Sync directly to server-side 24/7 background worker
    try {
      const res = await fetch('/api/alerts/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: botToken.trim(),
          chatId: cleanChat,
          channelUsername: channelUsername.trim(),
          minConfidenceScore: minScore,
          antiFakeoutFilter: antiFakeout,
          autoSendBreakouts: autoSend,
          minPriceJumpUsd: minPriceJumpUsd,
          respectIndianMarketHours: respectIndianMarketHours,
          segmentThrottling: segmentThrottling,
          alertOnBreakout: config.alertOnBreakout,
          alertOnRiskDrawdown: config.alertOnRiskDrawdown,
          alertOnMacroNews: config.alertOnMacroNews,
          isEnabled: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.status) {
        setSentinelStatus(data.status);
      }
    } catch (e) {
      console.warn('Could not sync config to server:', e);
    }

    // 2. Sync to Firestore (persistent across remixes & devices)
    if (auth.currentUser) {
      try {
        await setDoc(
          doc(db, 'users', auth.currentUser.uid),
          {
            telegramConfig: {
              botToken: botToken.trim(),
              chatId: cleanChat,
              updatedAt: new Date().toISOString(),
            },
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Firestore sync note:', e);
      }
    }

    setSavedSuccess(true);
    setFeedback({
      type: 'success',
      text: '✅ Telegram Bot Alert & 24/7 Sentinel background scanner saved and actively monitoring live BTC/Crypto prices!',
    });
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAutoDetectChatId = async () => {
    if (!botToken.trim()) {
      setFeedback({
        type: 'error',
        text: 'Please paste your Bot Token from @BotFather first.',
      });
      return;
    }

    setIsAutoDetecting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/alerts/telegram/auto-detect-chat-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: botToken.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.botUsername) {
          setDetectedBotName(data.botUsername);
        }
        if (data.detectedChats && data.detectedChats.length > 0) {
          setDetectedChats(data.detectedChats);
          const top = data.detectedChats[0];
          setChatId(top.id);
          setFeedback({
            type: 'success',
            text: `✅ Connected! Detected Chat: ${top.name} (${top.type}) with Chat ID: ${top.id}. Click 'Save & Activate Alerts' below!`,
          });
        } else {
          setFeedback({
            type: 'info',
            text: data.message || `No messages received yet. Open Telegram, search @${data.botUsername || 'your bot'}, click /start, and click Auto-Detect again!`,
          });
        }
      } else {
        throw new Error(data.error || 'Failed to auto-detect chat ID.');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Auto-detection failed. Ensure you created the bot and sent /start.',
      });
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const handleTriggerLiveScanNow = async () => {
    setIsScanningNow(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/alerts/telegram/scan-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          text: `🚀 Live Market Scan Completed! ${data.message} ${
            data.dispatchesFound > 0
              ? `Dispatched ${data.dispatchesFound} signal(s) directly to your Telegram chat.`
              : 'Market scanned, all assets currently within active baseline threshold.'
          }`,
        });
        if (data.status) {
          setSentinelStatus(data.status);
        }
      } else {
        throw new Error(data.error || 'Failed to scan markets');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Error executing live market scan.',
      });
    } finally {
      setIsScanningNow(false);
    }
  };

  const handleVerifyBot = async () => {
    const cleanToken = sanitizeBotTokenInput(botToken);
    if (!cleanToken) {
      setFeedback({
        type: 'error',
        text: 'Please enter your Telegram Bot Token from @BotFather first (Format: 123456789:ABCdefGhIJKlmNoPQRstuVWXyz).',
      });
      return;
    }

    setIsVerifyingBot(true);
    setFeedback(null);

    try {
      const cleanChat = sanitizeChatIdInput(chatId);
      const res = await fetch('/api/alerts/telegram/verify-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: cleanToken,
          chatId: cleanChat || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.botUsername) setDetectedBotName(data.botUsername);
        if (data.cleanedChatId) setChatId(data.cleanedChatId);
        setBotToken(cleanToken);
        setFeedback({
          type: 'success',
          text: `✅ ${data.message}`,
        });
      } else {
        if (data.botUsername) setDetectedBotName(data.botUsername);
        throw new Error(data.error || 'Failed to verify bot token');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Telegram Bot Verification failed. Check token format.',
      });
    } finally {
      setIsVerifyingBot(false);
    }
  };

  const handleSendTestAlert = async (type: 'BULLISH' | 'BEARISH' | 'RISK_GUARD' | 'MACRO_NEWS') => {
    setSendingTest(true);
    setFeedback(null);

    let samplePayload: any = {};
    if (type === 'BULLISH') {
      samplePayload = {
        alertType: 'BREAKOUT RADAR SIGNAL',
        direction: 'BULLISH',
        symbol: 'BTC/USDT',
        price: '68,450.00',
        signalType: 'Volume Surge (3x) + 15m Bullish Order Block',
        timeframe: '15m',
        entryZone: '$68,200 - $68,450',
        stopLoss: '$67,350',
        invalidationReason: 'Below 15m Order Block Low & ATR Buffer',
        tp1: '69,800',
        tp2: '71,200',
        tp3: '73,000',
        riskReward: '2.85',
        volumeMultiplier: '3.4',
        antiFakeoutScore: 94,
        setupGrade: 'A+',
        triggerMetric: 'Institutional buy wall absorbed. 3.4x volume expansion with CHoCH confirmation.',
      };
    } else if (type === 'BEARISH') {
      samplePayload = {
        alertType: 'BREAKOUT RADAR SIGNAL',
        direction: 'BEARISH',
        symbol: 'SOL/USDT',
        price: '184.20',
        signalType: 'Support Breakdown + Supply Shelf Rejection',
        timeframe: '15m',
        entryZone: '$184.00 - $184.50',
        stopLoss: '$188.00',
        invalidationReason: 'Above broken 4H support now acting as supply',
        tp1: '179.50',
        tp2: '174.00',
        tp3: '166.00',
        riskReward: '2.55',
        volumeMultiplier: '2.8',
        antiFakeoutScore: 91,
        setupGrade: 'A+',
        triggerMetric: 'Failed liquidity sweep of lower range boundary. Bearish continuation triggered.',
      };
    } else if (type === 'RISK_GUARD') {
      samplePayload = {
        alertType: 'RISK_GUARD',
        symbol: 'ACCOUNT RISK GUARD',
        price: 'Account Equity: $48,600',
        signalType: 'Max Daily Drawdown Warning: 75% of Limit Reached',
        entry: 'Current Daily PnL: -$1,125.00',
        stopLoss: 'Hard Stop: -$1,500.00',
      };
    } else {
      samplePayload = {
        alertType: 'MACRO_NEWS',
        symbol: 'USD (US Core CPI m/m)',
        price: 'Due in 15 Minutes (06:00 PM IST / 8:30 AM EST)',
        signalType: 'High Volatility Expected in BTC, Gold & EUR/USD',
        entry: 'Forecast: 0.3% | Prior: 0.2%',
      };
    }

    try {
      const cleanChat = sanitizeChatIdInput(chatId);
      const res = await fetch('/api/alerts/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: botToken.trim() || undefined,
          chatId: cleanChat || undefined,
          channelUsername: channelUsername.trim() || undefined,
          ...samplePayload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          text: `⚡ Test Alert Dispatched: ${data.message}`,
          preview: data.preview,
        });
      } else {
        throw new Error(data.error || 'Failed to dispatch test alert');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: `Telegram Dispatch Failed: ${err.message || 'Check bot token and chat ID'}`,
      });
    } finally {
      setSendingTest(false);
    }
  };

  const botNameDisplay = detectedBotName || (botToken ? 'Your Bot' : 'Bot');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#0E131F] border border-[#1C263C] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1C263C] bg-[#121827]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Telegram Real-Time Alert Engine</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  Anti-Fakeout Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Instant push signals with verified Entry Zone, Invalidation (SL), Multi-Targets (TP1/TP2/TP3), and R:R ratios.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert Bar */}
        {feedback && (
          <div
            className={`px-5 py-3 text-xs font-semibold flex items-center justify-between border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : feedback.type === 'info'
                ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : feedback.type === 'info' ? (
                <HelpCircle className="w-4 h-4 text-sky-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="whitespace-pre-line">{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer ml-3 shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-[#0E131F]">
          {/* 24/7 Autonomous Cloud Sentinel Live Status Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#121827] via-[#161F33] to-[#121827] border border-teal-500/40 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white tracking-wide uppercase">
                      24/7 Background Market Sentinel
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      AUTONOMOUS (8s POLLING)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Continuously scans Binance & Global tickers in the cloud even when your browser tab is closed.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTriggerLiveScanNow}
                disabled={isScanningNow}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Radio className={`w-3.5 h-3.5 ${isScanningNow ? 'animate-spin' : ''}`} />
                <span>{isScanningNow ? 'Scanning Markets...' : '⚡ Scan Live Markets & Push Now'}</span>
              </button>
            </div>

            {sentinelStatus && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-[11px]">
                <div className="p-2 rounded-lg bg-[#0E131F] border border-[#1C263C]">
                  <span className="text-slate-400 block text-[10px]">Cloud Worker:</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {sentinelStatus.isRunning ? 'Active (24/7)' : 'Standby'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#0E131F] border border-[#1C263C]">
                  <span className="text-slate-400 block text-[10px]">Total Scans Run:</span>
                  <span className="text-white font-bold font-mono">{sentinelStatus.scanCount || 0}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#0E131F] border border-[#1C263C]">
                  <span className="text-slate-400 block text-[10px]">Bot Target:</span>
                  <span className="text-teal-300 font-bold font-mono truncate block">
                    {chatId || sentinelStatus.activeConfig?.chatId || 'Not Configured'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#0E131F] border border-[#1C263C]">
                  <span className="text-slate-400 block text-[10px]">Auto-Push Breakouts:</span>
                  <span className="text-emerald-400 font-bold">
                    {autoSend ? 'ENABLED (Instant)' : 'OFF'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Connect Guide Box */}
          <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-teal-400" />
                <span>Telegram Bot Credentials Setup</span>
              </span>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-xs text-teal-300 hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <span>{showGuide ? 'Hide Instructions' : 'How to get Chat ID & Bot Token?'}</span>
              </button>
            </div>

            {showGuide ? (
              <div className="space-y-2 pt-2 border-t border-[#1C263C] text-xs text-slate-300 leading-relaxed">
                <div className="p-2.5 rounded-lg bg-[#0E131F] border border-[#1C263C] space-y-1">
                  <strong className="text-teal-300 block">Step 1: Create your Bot in 30 Seconds</strong>
                  <p>1. Open Telegram and search for <code>@BotFather</code>.</p>
                  <p>2. Send <code>/newbot</code>, choose a name and username (e.g. <i>CapitalSurakshaAlerts_bot</i>).</p>
                  <p>3. Copy the HTTP API <strong>Token</strong> (e.g. <code>123456789:ABCdefGhIJK...</code>) and paste below.</p>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0E131F] border border-[#1C263C] space-y-1">
                  <strong className="text-teal-300 block">Step 2: Connect Your Chat / Channel</strong>
                  <p>• <strong>Personal Chat:</strong> Open your bot in Telegram, press <code>/start</code>, then click <strong>"Auto-Detect My Chat ID"</strong> below!</p>
                  <p>• <strong>Channel / Group:</strong> Add your bot as Administrator with "Post Messages" permission, send any message in the channel, and click "Auto-Detect My Chat ID".</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-300">
                You can receive instant signals in your personal chat, private trading group, or public VIP channel. Settings persist automatically across remixes & sessions.
              </p>
            )}
          </div>

          {/* Credentials Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Field 1: Bot API Token */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Telegram Bot API Token <span className="text-slate-500">(from @BotFather)</span> <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="123456789:ABCdefGhIJKlmNoP..."
                    className="flex-1 bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyBot}
                    disabled={isVerifyingBot || !botToken.trim()}
                    className="px-3 py-2 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    {isVerifyingBot ? 'Checking...' : 'Verify'}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  💡 Hint: @BotFather me <code>/mybots</code> ➔ select bot ➔ copy <code>API Token</code>. Token persists securely in cloud & disk across remixes.
                </span>
              </div>

              {/* Field 2: Telegram Chat ID with Auto-Detect */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    Telegram Chat ID or @Channel <span className="text-rose-400">*</span>
                  </label>
                  {detectedBotName && (
                    <a
                      href={`https://t.me/${detectedBotName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-teal-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Bot className="w-3 h-3" />
                      <span>Open @{detectedBotName}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatId}
                    onChange={(e) => handleChatIdChange(e.target.value)}
                    placeholder="e.g. 987654321 or @MyChannel"
                    className="flex-1 bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAutoDetectChatId}
                    disabled={isAutoDetecting || !botToken.trim()}
                    title="Automatically find your Chat ID after sending /start to your bot"
                    className="px-3 py-2 rounded-lg bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 text-teal-300 border border-teal-500/40 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 shrink-0 flex items-center gap-1.5"
                  >
                    <Search className={`w-3.5 h-3.5 ${isAutoDetecting ? 'animate-spin' : ''}`} />
                    <span>{isAutoDetecting ? 'Detecting...' : 'Auto-Detect'}</span>
                  </button>
                </div>

                {isInviteLink ? (
                  <div className="mt-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] leading-tight space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Private invite links (t.me/+...) cannot be used directly by bot!</span>
                    </p>
                    <p className="text-slate-300">
                      👉 <strong>Personal alerts:</strong> Send <code>/start</code> to @{detectedBotName || 'your bot'} in Telegram, then click <strong>Auto-Detect</strong> above.
                    </p>
                    <p className="text-slate-300">
                      👉 <strong>Channel:</strong> Add @{detectedBotName || 'your bot'} as Admin to channel, send 1 message, then click <strong>Auto-Detect</strong>!
                    </p>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Numeric User ID (e.g. <code>987654321</code>) or public <code>@ChannelName</code>
                  </span>
                )}
              </div>
            </div>

            {/* Discovered Chats Dropdown / Selector if available */}
            {detectedChats.length > 0 && (
              <div className="p-3 rounded-xl bg-[#121827] border border-teal-500/30 space-y-2">
                <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Detected Telegram Targets (Click to Select):</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {detectedChats.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setChatId(c.id);
                        setFeedback({
                          type: 'success',
                          text: `Selected target: ${c.name} (Chat ID: ${c.id})`,
                        });
                      }}
                      className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                        chatId === c.id
                          ? 'bg-teal-500/20 border-teal-500 text-white'
                          : 'bg-[#0E131F] border-[#1C263C] text-slate-300 hover:border-teal-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {c.type === 'channel' ? (
                          <Radio className="w-3.5 h-3.5 text-teal-400" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <div>
                          <span className="text-xs font-bold block">{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {c.id} {c.username ? `(${c.username})` : ''} • {c.type}
                          </span>
                        </div>
                      </div>
                      {chatId === c.id && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quality & Anti-Fakeout Filters */}
            <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] space-y-3">
              <span className="text-xs font-bold text-white block flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Anti-Fakeout & Rapid Price Surge Triggers</span>
                </span>
                <span className="text-xs font-mono font-bold text-teal-400">Min Score: {minScore}%</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="p-3 rounded-lg bg-[#0E131F] border border-[#1C263C] flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-white block">Auto-Dispatch A+ Breakouts</span>
                    <span className="text-[10px] text-slate-400">Instantly push high-velocity moves (like BTC $69.5k → $72k)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSend}
                    onChange={(e) => setAutoSend(e.target.checked)}
                    className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                  />
                </label>

                <label className="p-3 rounded-lg bg-[#0E131F] border border-[#1C263C] flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-white block">Volume Surge Confirmation</span>
                    <span className="text-[10px] text-slate-400">Require &gt;2.2x 20-MA volume expansion before alerting</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={antiFakeout}
                    onChange={(e) => setAntiFakeout(e.target.checked)}
                    className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Rapid Move Sensitivity */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#0E131F] border border-[#1C263C]">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Rapid BTC Price Jump Sensitivity:</span>
                    <span className="font-bold text-teal-300 font-mono">≥ ${minPriceJumpUsd}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[300, 400, 750, 1500].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMinPriceJumpUsd(val)}
                        className={`py-1 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                          minPriceJumpUsd === val
                            ? 'bg-teal-500 text-slate-950'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0E131F] border border-[#1C263C]">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Minimum Setup Conviction Score:</span>
                    <span className="font-bold text-white">{minScore}%</span>
                  </div>
                  <input
                    type="range"
                    min={70}
                    max={95}
                    step={5}
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-full accent-teal-500 cursor-pointer mt-2"
                  />
                </div>
              </div>

              {/* Strict Market Session & Segment Throttling (Anti-Spam Discipline) */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Systematic Entry Discipline & Session Gates</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Gate 1: Indian Market Hours */}
                  <label className="p-3 rounded-lg bg-[#0E131F] border border-[#1C263C] hover:border-amber-500/40 flex items-start justify-between gap-3 cursor-pointer transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">🇮🇳 Indian Market Session Filter</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300">09:15-15:30 IST</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Block alerts when NSE / BSE is closed (weekends & outside 09:15 AM - 03:30 PM IST). Zero closed-market spam.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={respectIndianMarketHours}
                      onChange={(e) => setRespectIndianMarketHours(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer mt-0.5"
                    />
                  </label>

                  {/* Gate 2: Segment Throttling */}
                  <label className="p-3 rounded-lg bg-[#0E131F] border border-[#1C263C] hover:border-teal-500/40 flex items-start justify-between gap-3 cursor-pointer transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">⚡ Segment Anti-Flood Throttling</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-teal-500/20 text-teal-300">15m Cooldown</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Prevent multiple duplicate entries per market segment. Only the highest conviction A+ trade is dispatched.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={segmentThrottling}
                      onChange={(e) => setSegmentThrottling(e.target.checked)}
                      className="w-4 h-4 accent-teal-500 rounded cursor-pointer mt-0.5"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Trigger Rules Matrix */}
          <div className="space-y-3 pt-2 border-t border-[#1C263C]">
            <span className="text-xs font-bold text-white block">Active Notification Channels</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Trigger 1: Breakout Signals */}
              <label className="p-3 rounded-xl bg-[#121827] border border-[#1C263C] hover:border-teal-500/40 flex items-start justify-between gap-3 cursor-pointer transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Breakout Radar Signals</span>
                  </span>
                  <p className="text-[10px] text-slate-400">
                    High volume surges, RSI divergence, and SMC liquidity sweeps
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.alertOnBreakout}
                  onChange={(e) => setConfig({ ...config, alertOnBreakout: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 cursor-pointer accent-teal-500 mt-0.5"
                />
              </label>

              {/* Trigger 2: Risk Guard & Drawdown */}
              <label className="p-3 rounded-xl bg-[#121827] border border-[#1C263C] hover:border-teal-500/40 flex items-start justify-between gap-3 cursor-pointer transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                    <span>Risk & Drawdown Gauntlet</span>
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Daily loss threshold reached or consecutive losses warning
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.alertOnRiskDrawdown}
                  onChange={(e) => setConfig({ ...config, alertOnRiskDrawdown: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 cursor-pointer accent-teal-500 mt-0.5"
                />
              </label>

              {/* Trigger 3: Macro Economic Events */}
              <label className="p-3 rounded-xl bg-[#121827] border border-[#1C263C] hover:border-teal-500/40 flex items-start justify-between gap-3 cursor-pointer transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>High-Impact Macro News (15m Warning)</span>
                  </span>
                  <p className="text-[10px] text-slate-400">
                    15-min warning before US CPI, FOMC, and NFP releases
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.alertOnMacroNews}
                  onChange={(e) => setConfig({ ...config, alertOnMacroNews: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 cursor-pointer accent-teal-500 mt-0.5"
                />
              </label>

              {/* Trigger 4: Journal Auto-Sync */}
              <label className="p-3 rounded-xl bg-[#121827] border border-[#1C263C] hover:border-teal-500/40 flex items-start justify-between gap-3 cursor-pointer transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Journal Trade Execution Alerts</span>
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Instant notification when a new trade is executed or logged
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.alertOnJournalSync}
                  onChange={(e) => setConfig({ ...config, alertOnJournalSync: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 cursor-pointer accent-teal-500 mt-0.5"
                />
              </label>
            </div>
          </div>

          {/* Test Buttons Row */}
          <div className="space-y-2 pt-2 border-t border-[#1C263C]">
            <span className="text-xs font-bold text-slate-300 block">⚡ Instant Test Dispatch to Telegram:</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSendTestAlert('BULLISH')}
                disabled={sendingTest}
                className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Test Bullish Alert</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendTestAlert('BEARISH')}
                disabled={sendingTest}
                className="py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Test Short Alert</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendTestAlert('RISK_GUARD')}
                disabled={sendingTest}
                className="py-2.5 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Test Risk Guard</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendTestAlert('MACRO_NEWS')}
                disabled={sendingTest}
                className="py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Test Macro News</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1C263C] bg-[#121827] flex items-center justify-between">
          <button
            onClick={handleSaveConfig}
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedSuccess ? 'Settings Saved & Active!' : 'Save & Activate Alerts'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

