import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  PlusCircle,
  ScanLine,
  Calculator,
  Sparkles,
  Search,
  Moon,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface QuickActionFABProps {
  onOpenNewTrade: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenAIAssistant: () => void;
  onOpenCommandPalette: () => void;
}

export const QuickActionFAB: React.FC<QuickActionFABProps> = ({
  onOpenNewTrade,
  onNavigateTab,
  onOpenAIAssistant,
  onOpenCommandPalette,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const actions = [
    {
      id: 'log-trade',
      label: 'Log New Trade',
      icon: PlusCircle,
      color: 'from-emerald-500 to-teal-500 text-slate-950',
      action: () => {
        setIsOpen(false);
        onOpenNewTrade();
      },
    },
    {
      id: 'chart-audit',
      label: 'AI Chart Review',
      icon: ScanLine,
      color: 'from-indigo-500 to-purple-500 text-white',
      action: () => {
        setIsOpen(false);
        onNavigateTab('ai-review');
      },
    },
    {
      id: 'risk-calc',
      label: 'Position Sizer',
      icon: Calculator,
      color: 'from-amber-500 to-orange-500 text-slate-950',
      action: () => {
        setIsOpen(false);
        onNavigateTab('risk-center');
      },
    },
    {
      id: 'ai-assistant',
      label: 'AI Copilot Chat',
      icon: Sparkles,
      color: 'from-cyan-500 to-blue-600 text-slate-950',
      action: () => {
        setIsOpen(false);
        onOpenAIAssistant();
      },
    },
    {
      id: 'search-cmd',
      label: 'Search Platform (⌘K)',
      icon: Search,
      color: 'from-slate-700 to-slate-800 text-white',
      action: () => {
        setIsOpen(false);
        onOpenCommandPalette();
      },
    },
    {
      id: 'theme-toggle',
      label: theme === 'dark' ? 'Switch to Light' : 'Switch to Dark',
      icon: theme === 'dark' ? Sun : Moon,
      color: 'from-slate-800 to-slate-900 text-amber-400',
      action: () => {
        toggleTheme();
        setIsOpen(false);
      },
    },
  ];

  return (
    <div
      ref={fabRef}
      className="fixed bottom-20 lg:bottom-8 right-5 lg:right-8 z-40 flex flex-col items-end gap-2.5"
    >
      {/* Speed Dial Menu Items */}
      {isOpen && (
        <div className="flex flex-col items-end gap-2 mb-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={act.action}
                className="flex items-center gap-2.5 pl-3 pr-3.5 py-2 rounded-2xl bg-[#0E1322]/95 hover:bg-[#151D33] border border-white/15 text-xs text-white shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer glass-panel group"
              >
                <span className="font-semibold text-[11px] text-slate-200 group-hover:text-emerald-400 transition-colors">
                  {act.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${act.color} flex items-center justify-center shadow-md`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        id="quick-action-fab-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl sm:rounded-3xl flex items-center justify-center text-slate-950 font-black shadow-2xl transition-all duration-300 cursor-pointer active:scale-90 border border-white/25 ${
          isOpen
            ? 'bg-rose-500 hover:bg-rose-600 text-white rotate-90 shadow-rose-500/30'
            : 'bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-500 hover:scale-105 shadow-emerald-500/40 glow-emerald'
        }`}
        title="Quick Actions & Tools"
        aria-label="Quick Actions"
      >
        {isOpen ? (
          <X className="w-6 h-6 stroke-[2.5]" />
        ) : (
          <Plus className="w-6 h-6 stroke-[3]" />
        )}
      </button>
    </div>
  );
};
