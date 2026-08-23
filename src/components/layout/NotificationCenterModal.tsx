import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Calendar,
  X,
  Trash2,
  ExternalLink,
  Volume2,
  VolumeX,
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  text: string;
  time: string;
  type: 'risk' | 'macro' | 'ai' | 'discipline' | 'price';
  isRead: boolean;
  actionTab?: string;
  actionLabel?: string;
}

const initialNotifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Pre-Trade Discipline Gate Verified',
    text: '5 of 6 checklist rules approved. London session risk ceiling locked at $400.',
    time: '4m ago',
    type: 'discipline',
    isRead: false,
    actionTab: 'dashboard',
    actionLabel: 'View Checklist',
  },
  {
    id: 'n2',
    title: 'High Impact Macro Catalyst Ahead',
    text: 'US CPI inflation report scheduled at 08:30 EST. Expect volatility on Gold & Indices.',
    time: '28m ago',
    type: 'macro',
    isRead: false,
    actionTab: 'dashboard',
    actionLabel: 'Macro Calendar',
  },
  {
    id: 'n3',
    title: 'AI Vision Review Available',
    text: 'Gemini evaluated your BTC/USDT 4H breakout thesis with an 88/100 execution score.',
    time: '1h ago',
    type: 'ai',
    isRead: false,
    actionTab: 'ai-review',
    actionLabel: 'Open Review',
  },
  {
    id: 'n4',
    title: 'Stop-Loss & R:R Alert on EUR/USD',
    text: 'Price approaches key Fair Value Gap at 1.0850. Confirm invalidation level before entering.',
    time: '3h ago',
    type: 'risk',
    isRead: true,
    actionTab: 'risk-center',
    actionLabel: 'Calculate Size',
  },
  {
    id: 'n5',
    title: 'Daily Streak Milestone',
    text: 'You logged 5 consecutive disciplined trading days with zero revenge trades!',
    time: '1d ago',
    type: 'discipline',
    isRead: true,
    actionTab: 'goals',
    actionLabel: 'View Habits',
  },
];

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [filter, setFilter] = useState<'all' | 'risk' | 'macro' | 'ai'>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'risk') return n.type === 'risk' || n.type === 'discipline';
    if (filter === 'macro') return n.type === 'macro' || n.type === 'price';
    if (filter === 'ai') return n.type === 'ai';
    return true;
  });

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleToggleRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const handleDeleteOne = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'risk':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'macro':
        return <Calendar className="w-4 h-4 text-cyan-400" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      case 'discipline':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      default:
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Notification Drawer / Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0C101C] border border-white/15 rounded-3xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-top-4 sm:slide-in-from-right-4 duration-250 glass-panel">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">Notifications Center</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">Real-time risk, macro, and AI alerts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5 text-[11px]">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'risk', label: 'Risk' },
                { id: 'macro', label: 'Macro' },
                { id: 'ai', label: 'AI' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filter === t.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-emerald-400 hover:underline font-semibold cursor-pointer"
              >
                Mark read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                title="Clear all notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-10 space-y-2 text-slate-500">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/40" />
              <p className="text-xs font-semibold text-slate-400">All caught up!</p>
              <p className="text-[11px]">No unread alerts in this category.</p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition-all text-xs space-y-2 group ${
                  item.isRead
                    ? 'bg-white/[0.02] border-white/5 opacity-75'
                    : 'bg-[#111827]/80 border-emerald-500/30 shadow-md shadow-emerald-500/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/5 shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <span className="font-bold text-white text-xs leading-tight">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-slate-500">{item.time}</span>
                    <button
                      onClick={() => handleDeleteOne(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed pl-7">
                  {item.text}
                </p>

                {item.actionTab && (
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 pl-7">
                    <button
                      onClick={() => {
                        handleToggleRead(item.id);
                        onNavigateTab(item.actionTab!);
                        onClose();
                      }}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{item.actionLabel || 'View Details'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    {!item.isRead && (
                      <button
                        onClick={() => handleToggleRead(item.id)}
                        className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
