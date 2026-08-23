import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
  Globe,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sliders,
  Smartphone,
  Check,
  X,
} from 'lucide-react';
import { EconomicEvent } from '../../types';

interface MacroAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EconomicEvent[];
  onOpenTelegramSettings?: () => void;
}

interface MacroAlertConfig {
  alertOn15mWarning: boolean;
  alertOn5mCountdown: boolean;
  alertOnLiveNow: boolean;
  alertOnActualOutcome: boolean;
  highImpactOnly: boolean;
  currencies: string[];
  enableBrowserPush: boolean;
  enableSoundChime: boolean;
  enableTelegramPush: boolean;
}

const DEFAULT_CONFIG: MacroAlertConfig = {
  alertOn15mWarning: true,
  alertOn5mCountdown: true,
  alertOnLiveNow: true,
  alertOnActualOutcome: true,
  highImpactOnly: true,
  currencies: ['USD', 'EUR', 'GBP', 'JPY', 'INR'],
  enableBrowserPush: true,
  enableSoundChime: true,
  enableTelegramPush: true,
};

export const MacroAlertsModal: React.FC<MacroAlertsModalProps> = ({
  isOpen,
  onClose,
  events,
  onOpenTelegramSettings,
}) => {
  const [config, setConfig] = useState<MacroAlertConfig>(() => {
    try {
      const saved = localStorage.getItem('tradeos_macro_alerts_config');
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [serverTelegramActive, setServerTelegramActive] = useState<boolean>(false);
  const [serverChatId, setServerChatId] = useState<string>('');
  const [isTestingTelegram, setIsTestingTelegram] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [activeTab, setActiveTab] = useState<'triggers' | 'upcoming' | 'how-it-works'>('triggers');

  // Save config changes to localStorage & server disk
  useEffect(() => {
    try {
      localStorage.setItem('tradeos_macro_alerts_config', JSON.stringify(config));
    } catch (e) {
      console.warn('Failed saving macro alert config:', e);
    }

    fetch('/api/alerts/macro-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).catch(() => {});
  }, [config]);

  // Load server macro alert config and server Telegram status on mount
  useEffect(() => {
    if (isOpen) {
      fetch('/api/alerts/macro-config')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.config) {
            setConfig((prev) => ({ ...prev, ...data.config }));
          }
        })
        .catch(() => {});

      fetch('/api/alerts/telegram/status')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.activeConfig) {
            setServerTelegramActive(data.activeConfig.hasBotToken && data.activeConfig.hasChatId);
            setServerChatId(data.activeConfig.chatId || '');
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const playAudioChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('Web Audio synthesis failed:', e);
    }
  };

  const requestBrowserPushPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('Browser notifications are not supported in this browser.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      if (perm === 'granted') {
        new Notification('TradeOS Macro Alert Engine Active', {
          body: 'You will receive 15m pre-news warnings and actual outcome releases directly on your device!',
          icon: '/favicon.ico',
        });
        if (config.enableSoundChime) playAudioChime();
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
  };

  const handleTestTelegramDispatch = async (stage: '15M_WARNING' | 'ACTUAL_RELEASE') => {
    setIsTestingTelegram(true);
    setTestResult(null);

    // If browser push and sound are enabled, test them too
    if (config.enableBrowserPush && browserPermission === 'granted') {
      new Notification('📅 US Core CPI (MoM) Due in 15 Minutes', {
        body: 'Forecast: 0.2% | Prior: 0.3% - High Volatility expected across Crypto & Indices.',
        icon: '/favicon.ico',
      });
    }
    if (config.enableSoundChime) {
      playAudioChime();
    }

    try {
      const res = await fetch('/api/alerts/macro/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: data.delivered
            ? '✓ Test alert dispatched & confirmed delivered to your Telegram chat/channel!'
            : '✓ Test alert triggered! (Server Bridge sent sample payload)',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to dispatch test alert.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error triggering test alert.',
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const toggleCurrency = (currency: string) => {
    setConfig((prev) => {
      const exists = prev.currencies.includes(currency);
      const next = exists
        ? prev.currencies.filter((c) => c !== currency)
        : [...prev.currencies, currency];
      return { ...prev, currencies: next.length > 0 ? next : [currency] };
    });
  };

  // Filter high impact upcoming events
  const upcomingHighImpact = events
    .filter((e) => e.status !== 'RELEASED' && (config.highImpactOnly ? e.impact === 'High' : true))
    .slice(0, 5);

  return (
    <div
      id="macro-alerts-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-[#0B0F19] border border-[#1E293B] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#1E293B] bg-gradient-to-r from-amber-500/10 via-[#0B0F19] to-indigo-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Macro Economic Calendar Alerts
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  24/7 Sentinel
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Get instant notifications on Telegram & Phone before high-impact news releases
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-[#1E293B] bg-[#0E1322] text-xs font-bold">
          <button
            onClick={() => setActiveTab('triggers')}
            className={`pb-2.5 px-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'triggers'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Alert Triggers & Channels</span>
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-2.5 px-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'upcoming'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Subscribed Events ({upcomingHighImpact.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('how-it-works')}
            className={`pb-2.5 px-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'how-it-works'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>How Off-Screen Alerting Works</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-200 flex-1">
          {activeTab === 'triggers' && (
            <>
              {/* Telegram Delivery Status Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  serverTelegramActive
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      serverTelegramActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">
                        Telegram Push Delivery: {serverTelegramActive ? 'Connected & Active' : 'Setup Recommended'}
                      </span>
                      {serverChatId && (
                        <span className="text-[10px] font-mono bg-black/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                          Chat: {serverChatId}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {serverTelegramActive
                        ? 'Autonomous background worker monitors economic schedule 24/7 and pushes directly to your Telegram app.'
                        : 'Connect your Telegram Bot once to receive alerts on your phone even when away from the computer.'}
                    </p>
                  </div>
                </div>

                {onOpenTelegramSettings && (
                  <button
                    onClick={onOpenTelegramSettings}
                    className="px-3 py-1.5 rounded-lg bg-[#141C2E] hover:bg-[#1E293B] border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer shrink-0"
                  >
                    {serverTelegramActive ? 'Manage Bot' : 'Connect Telegram'}
                  </button>
                )}
              </div>

              {/* Alert Stage Toggles */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Select Alert Timing Triggers
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 15m Pre-News Warning */}
                  <label
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      config.alertOn15mWarning
                        ? 'bg-[#131B2E] border-amber-500/40 text-white shadow-sm'
                        : 'bg-[#0E131F] border-[#1C263C] text-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold">15-Min Pre-News Warning</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Advance volatility notification. Gives you time to close risky positions or widen stops.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.alertOn15mWarning}
                      onChange={(e) => setConfig({ ...config, alertOn15mWarning: e.target.checked })}
                      className="mt-1 rounded accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* 5m Final Prep Warning */}
                  <label
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      config.alertOn5mCountdown
                        ? 'bg-[#131B2E] border-amber-500/40 text-white shadow-sm'
                        : 'bg-[#0E131F] border-[#1C263C] text-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold">5-Min Final Countdown</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Final warning before spread expansion and orderbook thinning starts.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.alertOn5mCountdown}
                      onChange={(e) => setConfig({ ...config, alertOn5mCountdown: e.target.checked })}
                      className="mt-1 rounded accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* LIVE NOW Alert */}
                  <label
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      config.alertOnLiveNow
                        ? 'bg-[#131B2E] border-rose-500/40 text-white shadow-sm'
                        : 'bg-[#0E131F] border-[#1C263C] text-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-xs font-bold">LIVE NOW / Due Alert</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Event is live and printing right now. High-speed market wick advisory.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.alertOnLiveNow}
                      onChange={(e) => setConfig({ ...config, alertOnLiveNow: e.target.checked })}
                      className="mt-1 rounded accent-rose-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* Actual Outcome / Result Released */}
                  <label
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      config.alertOnActualOutcome
                        ? 'bg-[#131B2E] border-emerald-500/40 text-white shadow-sm'
                        : 'bg-[#0E131F] border-[#1C263C] text-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-bold">Actual Result Print Alert</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Sends Actual vs Forecast vs Prior numbers with Bullish/Bearish market impact analysis.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.alertOnActualOutcome}
                      onChange={(e) => setConfig({ ...config, alertOnActualOutcome: e.target.checked })}
                      className="mt-1 rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Delivery Channels: Browser Push & Sound */}
              <div className="p-4 rounded-xl bg-[#0E131F] border border-[#1C263C] space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span>Device Channels (Browser & Audio Chime)</span>
                </h4>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Web Push Notifications (Desktop / Mobile)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Permission:{' '}
                      <span
                        className={`font-bold ${
                          browserPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {browserPermission.toUpperCase()}
                      </span>
                    </span>
                  </div>

                  {browserPermission !== 'granted' ? (
                    <button
                      onClick={requestBrowserPushPermission}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Enable Browser Notifications
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Permission Granted</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1C263C]">
                  <div className="flex items-center gap-2">
                    {config.enableSoundChime ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    )}
                    <span className="text-xs text-slate-200">Play Audio Sound Chime on Alert</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enableSoundChime}
                    onChange={(e) => setConfig({ ...config, enableSoundChime: e.target.checked })}
                    className="accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>

              {/* Currency Filters */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Alert On Currencies
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'USD', name: 'US Dollar (USD)', flag: '🇺🇸' },
                    { id: 'EUR', name: 'Eurozone (EUR)', flag: '🇪🇺' },
                    { id: 'GBP', name: 'British Pound (GBP)', flag: '🇬🇧' },
                    { id: 'JPY', name: 'Japanese Yen (JPY)', flag: '🇯🇵' },
                    { id: 'INR', name: 'Indian Rupee (INR)', flag: '🇮🇳' },
                  ].map((curr) => {
                    const isSelected = config.currencies.includes(curr.id);
                    return (
                      <button
                        key={curr.id}
                        onClick={() => toggleCurrency(curr.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-[#0E131F] text-slate-400 hover:text-slate-200 border border-[#1C263C]'
                        }`}
                      >
                        <span>{curr.flag}</span>
                        <span>{curr.id}</span>
                        {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Test Dispatch Action Strip */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#141C2E] to-[#0E131F] border border-[#1E293B] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-white block">Test Alert Delivery Now</span>
                    <span className="text-[11px] text-slate-400">
                      Instantly sends a sample 15m pre-news warning and result print to verify your notifications
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestTelegramDispatch('15M_WARNING')}
                      disabled={isTestingTelegram}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      {isTestingTelegram ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Bell className="w-3.5 h-3.5" />
                      )}
                      <span>Test 15m Alert</span>
                    </button>

                    <button
                      onClick={() => handleTestTelegramDispatch('ACTUAL_RELEASE')}
                      disabled={isTestingTelegram}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      <span>Test Result Print</span>
                    </button>
                  </div>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'upcoming' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Upcoming High-Impact Catalysts
                </span>
                <span className="text-xs text-emerald-400 font-mono font-bold">
                  ● 24/7 Monitoring Active
                </span>
              </div>

              {upcomingHighImpact.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl bg-[#0E131F] border border-[#1C263C] flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0">
                      {evt.currency}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">
                        {evt.title}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {evt.date} • {evt.time}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        Fcst: {evt.forecast || 'N/A'} | Prior: {evt.previous || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      {evt.status === 'LIVE' ? '🔴 LIVE' : 'Alert Active'}
                    </span>
                    <button
                      onClick={() => handleTestTelegramDispatch('15M_WARNING')}
                      className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Send preview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'how-it-works' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-[#0E131F] border border-[#1C263C] space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>Website ke aage nahi hone par bhi alert kaise milega?</span>
                </h4>
                <p className="text-slate-300">
                  TradeOS ka <b>24/7 Autonomous Market Sentinel</b> server background mein chalta rehta hai bina website open rakhe.
                </p>
                <div className="space-y-2 pt-2 border-t border-[#1C263C]">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">
                      1
                    </span>
                    <p>
                      <b>15 Min Pre-News Warning:</b> News aane se theek 15 minute pehle aapke Telegram & phone notification mein alert aayega (e.g. <i>"US CPI releasing in 15m - tighten stops"</i>).
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">
                      2
                    </span>
                    <p>
                      <b>Live News Status:</b> Exact time par release hote hi spread volatility advisory notify hoti hai.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">
                      3
                    </span>
                    <p>
                      <b>Actual Result vs Forecast Dropped:</b> Jaise hi numbers aate hain (e.g. CPI Actual: 0.2% vs 0.2%), Turant Bullish/Bearish outcome + trade bias message aapko milta hai.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0E1322] flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Autonomous Server Loop: 8s • Telegram Bot Direct API
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
          >
            Save & Activate
          </button>
        </div>
      </div>
    </div>
  );
};
