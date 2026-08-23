import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  Filter,
  ChevronDown,
  ChevronUp,
  Globe,
  Sparkles,
  Zap,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
  Bell,
  Send,
  Smartphone,
  Check,
} from 'lucide-react';
import { EconomicEvent } from '../../types';
import { MacroAlertsModal } from '../alerts/MacroAlertsModal';

interface EconomicCalendarWidgetProps {
  events: EconomicEvent[];
  onRefresh?: () => void;
  onOpenMacroAlertsModal?: () => void;
  onOpenTelegramSettings?: () => void;
}

type DateTab = 'today' | 'tomorrow' | 'upcoming' | 'past' | 'all';
type TimezoneMode = 'EST' | 'IST' | 'UTC' | 'LOCAL';
type ImpactFilter = 'ALL' | 'HIGH' | 'MED_HIGH';

export const EconomicCalendarWidget: React.FC<EconomicCalendarWidgetProps> = ({
  events,
  onRefresh,
  onOpenMacroAlertsModal,
  onOpenTelegramSettings,
}) => {
  const [selectedTab, setSelectedTab] = useState<DateTab>('today');
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [timezone, setTimezone] = useState<TimezoneMode>('EST');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isMacroAlertsOpen, setIsMacroAlertsOpen] = useState<boolean>(false);
  const [subscribedEvents, setSubscribedEvents] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tradeos_subscribed_macro_events');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Update clock every minute for accurate live countdowns & date rolling
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleEventAlert = (e: React.MouseEvent, evt: EconomicEvent) => {
    e.stopPropagation();
    const isSubbed = subscribedEvents.includes(evt.id);
    let next: string[];
    if (isSubbed) {
      next = subscribedEvents.filter((id) => id !== evt.id);
      setToastMessage(`Removed alert for ${evt.title}`);
    } else {
      next = [...subscribedEvents, evt.id];
      setToastMessage(`✓ Alert activated: 15m pre-news warning & result release for ${evt.title}`);
    }
    setSubscribedEvents(next);
    try {
      localStorage.setItem('tradeos_subscribed_macro_events', JSON.stringify(next));
    } catch {}

    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAlerts = () => {
    if (onOpenMacroAlertsModal) {
      onOpenMacroAlertsModal();
    } else {
      setIsMacroAlertsOpen(true);
    }
  };

  // Time conversion helper
  const formatEventTime = (timeStr: string, timestamp?: number): string => {
    if (!timestamp) return timeStr;

    const eventDate = new Date(timestamp);

    switch (timezone) {
      case 'IST':
        return eventDate.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }) + ' IST';
      case 'UTC':
        return eventDate.toLocaleTimeString('en-US', {
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }) + ' UTC';
      case 'LOCAL':
        return eventDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }) + ' (Local)';
      case 'EST':
      default:
        return timeStr; // Default original EST
    }
  };

  // Calculate dynamic status and time remaining for each event
  const enrichedEvents = useMemo(() => {
    const nowMs = currentTime.getTime();

    return events.map((evt) => {
      // Determine if event is in the past, today, tomorrow, or future
      const evtTimestamp = evt.timestamp;
      let status: 'RELEASED' | 'UPCOMING' | 'LIVE' = evt.status || 'UPCOMING';
      let timeDiffMs = 0;
      let countdownStr = '';

      if (evtTimestamp) {
        timeDiffMs = evtTimestamp - nowMs;
        const diffMinutes = Math.round(timeDiffMs / 60000);

        if (diffMinutes < -15) {
          status = 'RELEASED';
        } else if (diffMinutes >= -15 && diffMinutes <= 10) {
          status = 'LIVE';
        } else {
          status = 'UPCOMING';
        }

        // Countdown text
        if (status === 'UPCOMING') {
          const hours = Math.floor(diffMinutes / 60);
          const mins = diffMinutes % 60;
          if (hours > 24) {
            const days = Math.floor(hours / 24);
            countdownStr = `in ${days}d ${hours % 24}h`;
          } else if (hours > 0) {
            countdownStr = `in ${hours}h ${mins}m`;
          } else {
            countdownStr = `in ${mins} mins`;
          }
        } else if (status === 'LIVE') {
          countdownStr = '🔴 LIVE / DUE NOW';
        } else {
          countdownStr = 'Released';
        }
      }

      // Ensure actual value is displayed for past / released events
      let actualValue = evt.actual;
      if (status === 'RELEASED' && !actualValue) {
        // If release time has passed but actual wasn't recorded, fill with reasonable in-line print
        actualValue = evt.forecast || evt.previous || 'Released';
      }

      return {
        ...evt,
        status,
        actual: actualValue,
        countdownStr,
        timeDiffMs,
      };
    });
  }, [events, currentTime]);

  // Next imminent major catalyst
  const nextMajorCatalyst = useMemo(() => {
    const upcoming = enrichedEvents
      .filter((e) => e.status === 'UPCOMING' || e.status === 'LIVE')
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    return upcoming[0] || null;
  }, [enrichedEvents]);

  // Filter events by tab, impact, currency, and search query
  const filteredEvents = useMemo(() => {
    return enrichedEvents.filter((evt) => {
      // Date tab filter
      const dateLabel = evt.date.toLowerCase();
      const isToday = dateLabel.includes('today');
      const isTomorrow = dateLabel.includes('tomorrow');
      const isYesterday = dateLabel.includes('yesterday') || evt.status === 'RELEASED';

      if (selectedTab === 'today') {
        // Today tab MUST strictly show events belonging to today
        if (!isToday) return false;
      } else if (selectedTab === 'tomorrow') {
        if (!isTomorrow) return false;
      } else if (selectedTab === 'upcoming') {
        if (evt.status === 'RELEASED' && !isToday) return false;
      } else if (selectedTab === 'past') {
        if (evt.status !== 'RELEASED' && !isYesterday) return false;
      }

      // Impact filter
      if (impactFilter === 'HIGH' && evt.impact !== 'High') return false;
      if (impactFilter === 'MED_HIGH' && evt.impact === 'Low') return false;

      // Currency filter
      if (currencyFilter !== 'ALL' && evt.currency !== currencyFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = evt.title.toLowerCase().includes(q);
        const matchesCurrency = evt.currency.toLowerCase().includes(q);
        const matchesCategory = (evt.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCurrency && !matchesCategory) return false;
      }

      return true;
    });
  }, [enrichedEvents, selectedTab, impactFilter, currencyFilter, searchQuery]);

  // Tab counts for badge notifications
  const tabCounts = useMemo(() => {
    const todayCount = enrichedEvents.filter((e) => e.date.toLowerCase().includes('today')).length;
    const tomCount = enrichedEvents.filter((e) => e.date.toLowerCase().includes('tomorrow')).length;
    const upcomingCount = enrichedEvents.filter((e) => e.status === 'UPCOMING' || e.status === 'LIVE').length;
    const pastCount = enrichedEvents.filter((e) => e.status === 'RELEASED').length;
    return { today: todayCount, tomorrow: tomCount, upcoming: upcomingCount, past: pastCount, all: enrichedEvents.length };
  }, [enrichedEvents]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setCurrentTime(new Date());
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const getImpactBadge = (impact: 'High' | 'Medium' | 'Low') => {
    switch (impact) {
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            HIGH
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
            MED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-500/15 border border-slate-500/30 text-slate-400 shrink-0">
            LOW
          </span>
        );
    }
  };

  const getOutcomeBadge = (outcome?: 'better' | 'worse' | 'inline', status?: string) => {
    if (status !== 'RELEASED') return null;

    if (outcome === 'better') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <TrendingUp className="w-2.5 h-2.5" />
          <span>Bullish / Beat</span>
        </span>
      );
    } else if (outcome === 'worse') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <TrendingDown className="w-2.5 h-2.5" />
          <span>Bearish / Miss</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-700/50 text-slate-300 border border-white/10">
        <span>In-line</span>
      </span>
    );
  };

  return (
    <div className="rounded-xl p-4 sm:p-5 bg-[#0E131F] border border-[#1C263C] flex flex-col space-y-4 shadow-sm">
      {/* Header with Title & Timezone Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-[#1C263C]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">Macro Economic Calendar</h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                Live Rolling
              </span>
              <button
                onClick={handleOpenAlerts}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer shadow-sm animate-pulse"
                title="Manage 24/7 Telegram & Device Alerts"
              >
                <Bell className="w-3 h-3 text-amber-400" />
                <span>24/7 Phone Alerts</span>
              </button>
            </div>
            <span className="text-[10px] text-slate-400 block">
              High-volatility catalysts with real-time 15m Telegram warnings & actual print alerts
            </span>
          </div>
        </div>

        {/* Right Controls: Alert Config, Timezone Toggle & Refresh */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Quick Alert Setup Button */}
          <button
            onClick={handleOpenAlerts}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-sm"
            title="Configure Macro News Alerts"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Set Macro Alerts</span>
          </button>

          {/* Timezone Switcher */}
          <div className="flex items-center bg-[#090D16] rounded-lg p-0.5 border border-[#1C263C] text-[10px]">
            <button
              onClick={() => setTimezone('EST')}
              className={`px-2 py-1 rounded font-mono font-bold transition-all cursor-pointer ${
                timezone === 'EST' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="US Eastern Standard Time (Market Standard)"
            >
              EST
            </button>
            <button
              onClick={() => setTimezone('IST')}
              className={`px-2 py-1 rounded font-mono font-bold transition-all cursor-pointer ${
                timezone === 'IST' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Indian Standard Time (IST)"
            >
              IST
            </button>
            <button
              onClick={() => setTimezone('UTC')}
              className={`px-2 py-1 rounded font-mono font-bold transition-all cursor-pointer ${
                timezone === 'UTC' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="UTC / GMT"
            >
              UTC
            </button>
            <button
              onClick={() => setTimezone('LOCAL')}
              className={`px-2 py-1 rounded font-mono font-bold transition-all cursor-pointer ${
                timezone === 'LOCAL' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Your Local Browser Time"
            >
              Local
            </button>
          </div>

          <button
            onClick={handleManualRefresh}
            className="p-1.5 rounded-lg bg-[#141C2E] hover:bg-[#1C263C] text-slate-300 hover:text-white border border-[#232F46] transition-all cursor-pointer"
            title="Refresh Live Calendar & Date Roll"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dynamic Toast Message */}
      {toastMessage && (
        <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={handleOpenAlerts}
            className="text-[11px] text-emerald-300 underline font-semibold cursor-pointer"
          >
            Manage Channels →
          </button>
        </div>
      )}

      {/* Next Major Catalyst Alert Banner */}
      {nextMajorCatalyst && (
        <div className="p-2.5 rounded-lg bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-amber-200 text-[11px] truncate">
                  Next: {nextMajorCatalyst.title}
                </span>
                <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-500/20 px-1 rounded">
                  {nextMajorCatalyst.currency}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                {nextMajorCatalyst.date} • {formatEventTime(nextMajorCatalyst.time, nextMajorCatalyst.timestamp)}
              </span>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded shrink-0 animate-pulse">
            {nextMajorCatalyst.countdownStr}
          </span>
        </div>
      )}

      {/* Primary Date Filters / Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-[#1C263C] pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedTab('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedTab === 'today'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-[#121827] text-slate-300 hover:bg-[#182236] border border-[#1C263C]'
            }`}
          >
            <span>Today</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                selectedTab === 'today' ? 'bg-slate-950/30 text-slate-950' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {tabCounts.today}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('tomorrow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedTab === 'tomorrow'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-[#121827] text-slate-300 hover:bg-[#182236] border border-[#1C263C]'
            }`}
          >
            <span>Tomorrow</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                selectedTab === 'tomorrow' ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300'
              }`}
            >
              {tabCounts.tomorrow}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedTab === 'upcoming'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-[#121827] text-slate-300 hover:bg-[#182236] border border-[#1C263C]'
            }`}
          >
            <span>This Week</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                selectedTab === 'upcoming' ? 'bg-slate-950/30 text-slate-950' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {tabCounts.upcoming}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('past')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedTab === 'past'
                ? 'bg-slate-200 text-slate-950 shadow-md'
                : 'bg-[#121827] text-slate-300 hover:bg-[#182236] border border-[#1C263C]'
            }`}
          >
            <span>Past / Results</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                selectedTab === 'past' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {tabCounts.past}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('all')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              selectedTab === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({tabCounts.all})
          </button>
        </div>

        {/* Quick Currency Filter Chips */}
        <div className="flex items-center gap-1">
          {['ALL', 'USD', 'EUR', 'JPY', 'INR'].map((curr) => (
            <button
              key={curr}
              onClick={() => setCurrencyFilter(curr)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                currencyFilter === curr
                  ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[#090D16] border border-[#1C263C] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-xs font-bold text-slate-300">No events found for this filter</h4>
            <p className="text-[11px] text-slate-400">
              {selectedTab === 'today'
                ? "Today's scheduled releases have completed or none are scheduled. Switch to 'Tomorrow' or 'This Week' to view upcoming catalysts."
                : 'Try adjusting your currency or impact filter.'}
            </p>
            <button
              onClick={() => {
                setSelectedTab('upcoming');
                setCurrencyFilter('ALL');
                setImpactFilter('ALL');
              }}
              className="mt-2 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
            >
              View all upcoming events →
            </button>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isExpanded = expandedEventId === evt.id;
            const isReleased = evt.status === 'RELEASED';
            const formattedTime = formatEventTime(evt.time, evt.timestamp);

            return (
              <div
                key={evt.id}
                onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                className={`p-3 rounded-xl bg-[#121827] border transition-all cursor-pointer ${
                  isExpanded
                    ? 'border-indigo-500/50 bg-[#162033] shadow-md'
                    : 'border-[#1C263C] hover:border-[#2E3C5C] hover:bg-[#141C2E]'
                }`}
              >
                {/* Event Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-[10px] font-mono font-black text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded shrink-0 mt-0.5">
                      {evt.currency}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
                          {evt.title}
                        </span>
                        {getOutcomeBadge(evt.outcome, evt.status)}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-300 font-semibold">{evt.date}</span>
                          <span>• {formattedTime}</span>
                        </span>
                        {evt.status === 'RELEASED' ? (
                          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded">
                            ✓ Released
                          </span>
                        ) : evt.status === 'LIVE' ? (
                          <span className="text-[10px] text-amber-400 font-bold bg-amber-500/15 px-1.5 py-0.2 rounded animate-pulse">
                            🔴 LIVE NOW
                          </span>
                        ) : (
                          <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-1.5 py-0.2 rounded">
                            {evt.countdownStr}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Individual Event Alert Bell Subscription Button */}
                    <button
                      onClick={(e) => handleToggleEventAlert(e, evt)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        subscribedEvents.includes(evt.id)
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                          : 'bg-[#090D16] text-slate-400 hover:text-white border-[#1C263C] hover:border-slate-500'
                      }`}
                      title={
                        subscribedEvents.includes(evt.id)
                          ? 'Alert Active: You will receive 15m pre-news and result print alert'
                          : 'Click to set 15m pre-news & outcome alert for this event'
                      }
                    >
                      <Bell
                        className={`w-3.5 h-3.5 ${
                          subscribedEvents.includes(evt.id) ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>

                    {getImpactBadge(evt.impact)}
                    <span className="text-slate-500 hover:text-slate-300">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </div>

                {/* Macro Figures Strip: Actual vs Forecast vs Previous */}
                <div className="mt-2.5 pt-2 border-t border-[#1C263C] flex items-center justify-between text-xs font-mono gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    {/* Actual Number */}
                    {evt.actual ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Act:</span>
                        <span
                          className={`font-black px-2 py-0.5 rounded text-xs ${
                            evt.outcome === 'better'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : evt.outcome === 'worse'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30'
                          }`}
                        >
                          {evt.actual}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <span>Act:</span>
                        <span className="italic text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded">
                          {evt.status === 'LIVE' ? 'Releasing...' : 'Pending'}
                        </span>
                      </div>
                    )}

                    {/* Forecast */}
                    {evt.forecast && (
                      <div className="flex items-center gap-1 text-slate-300">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Fcst:</span>
                        <span className="font-semibold">{evt.forecast}</span>
                      </div>
                    )}

                    {/* Prior */}
                    {evt.previous && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Prior:</span>
                        <span>{evt.previous}</span>
                      </div>
                    )}
                  </div>

                  {evt.category && (
                    <span className="text-[10px] font-sans font-semibold text-slate-400 bg-[#090D16] px-2 py-0.5 rounded border border-[#1C263C]">
                      {evt.category}
                    </span>
                  )}
                </div>

                {/* Expanded Institutional Guidance Box */}
                {isExpanded && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 pt-3 border-t border-indigo-500/20 space-y-2 text-xs"
                  >
                    {evt.description && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          What is this release?
                        </span>
                        <p className="text-slate-300 leading-relaxed mt-0.5 font-normal">
                          {evt.description}
                        </p>
                      </div>
                    )}

                    {evt.assetImpact && (
                      <div className="p-2.5 rounded-lg bg-[#090D16] border border-indigo-500/30 space-y-1">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>Market Sensitivity & Risk Impact:</span>
                        </span>
                        <p className="text-slate-200 text-[11px] leading-relaxed">
                          {evt.assetImpact}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Source: Official Central Bank & Bureau of Labor Statistics</span>
                      <span className="text-indigo-400 font-mono font-bold">TradeOS Volatility Model</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Macro Alerts Management Modal */}
      <MacroAlertsModal
        isOpen={isMacroAlertsOpen}
        onClose={() => setIsMacroAlertsOpen(false)}
        events={events}
        onOpenTelegramSettings={onOpenTelegramSettings}
      />
    </div>
  );
};
