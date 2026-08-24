import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calculator,
  BookOpenCheck,
  ScanLine,
  Bot,
  GraduationCap,
  PieChart,
  Target,
  Users,
  Settings,
  Menu,
  X,
  Search,
  Moon,
  Sun,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Radar,
  Wallet,
  IndianRupee,
  CreditCard,
  QrCode,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCommandPalette: () => void;
  onOpenAIAssistant: () => void;
  onOpenNewTrade: () => void;
  onOpenPricing?: () => void;
  onOpenAuth?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenCommandPalette,
  onOpenAIAssistant,
  onOpenNewTrade,
  onOpenPricing,
  onOpenAuth,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const primaryItems = [
    { id: 'dashboard', label: 'Terminal', icon: LayoutDashboard },
    { id: 'risk-center', label: 'Risk', icon: Calculator },
    { id: 'journal', label: 'Journal', icon: BookOpenCheck },
    { id: 'ai-review', label: 'Vision', icon: ScanLine },
    { id: 'ai-coach', label: 'Coach', icon: Bot },
  ];

  const secondaryItems = [
    { id: 'scanner', label: 'Breakout Radar', icon: Radar, badge: 'Live Radar', desc: 'Realtime breakout scanner & signals' },
    { id: 'paper-trading', label: 'Paper Trading', icon: Wallet, badge: '$10K Demo', desc: 'Zero risk virtual trading simulator' },
    { id: 'tax', label: 'Crypto Tax & TDS', icon: IndianRupee, badge: '30% + 1%', desc: 'Indian Section 115BBH & 194S matrix' },
    { id: 'academy', label: 'Academy & Quizzes', icon: GraduationCap, badge: '5 Modules', desc: 'SMC, Orderflow, Liquidity' },
    { id: 'portfolio', label: 'Portfolio Analytics', icon: PieChart, badge: undefined, desc: 'Equity curve, capital allocation' },
    { id: 'goals', label: 'Discipline & Habits', icon: Target, badge: undefined, desc: 'Daily checklist & goal tracker' },
    { id: 'community', label: 'Trade Theses', icon: Users, badge: undefined, desc: 'Community setups & ideas' },
    { id: 'settings', label: 'Settings & Capital', icon: Settings, badge: undefined, desc: 'Risk thresholds, theme, profile' },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* "More" Drawer Modal for Mobile */}
      {isMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="relative z-10 bg-[#111827] border-t border-[#1F2937] rounded-t-2xl p-5 pb-8 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  T
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Navigation Hub</h3>
                  <p className="text-[10px] text-slate-400">Terminal tools & settings</p>
                </div>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-lg bg-[#0D1320] hover:bg-[#161F30] text-slate-400 hover:text-white border border-[#1F2937]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Gmail / Email OTP Login Card in Mobile Drawer */}
            {onOpenAuth && (
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenAuth();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#0D1320] hover:bg-[#161F30] border border-[#1F2937] text-left cursor-pointer shadow-sm active:scale-98 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#111827] border border-[#1F2937] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">Log in with Gmail</span>
                      <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400">
                        Cloud Sync
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Sync journal across devices</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-400">Sign In →</span>
              </button>
            )}

            {/* Quick Pro Upgrade / Payment Action in Mobile Drawer */}
            {onOpenPricing && (
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenPricing();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#0D1320] hover:bg-[#161F30] border border-[#1F2937] text-left cursor-pointer shadow-sm active:scale-98 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#111827] border border-[#1F2937] flex items-center justify-center text-slate-300 font-bold shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">Plans & Access</span>
                      <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                        Pro
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Upgrade to Pro</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-300">View →</span>
              </button>
            )}

            {/* Quick Actions in Mobile Drawer */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenCommandPalette();
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#0D1320] hover:bg-[#161F30] border border-[#1F2937] text-xs font-semibold text-slate-200"
              >
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <span>Search (⌘K)</span>
              </button>
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#0D1320] hover:bg-[#161F30] border border-[#1F2937] text-xs font-semibold text-slate-200"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-blue-400" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>

            {/* Secondary Pages Grid */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                Extended Tools
              </span>
              <div className="space-y-1">
                {secondaryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                        isActive
                          ? 'bg-blue-600/15 border border-blue-500/30 text-blue-300'
                          : 'bg-[#0D1320] hover:bg-[#161F30] border border-[#1F2937] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-md flex items-center justify-center ${
                            isActive
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-[#111827] text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold block text-white">{item.label}</span>
                          <span className="text-[10px] text-slate-400">{item.desc}</span>
                        </div>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-[#111827] text-slate-400 border border-[#1F2937]">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Assistant Quick Banner */}
            <button
              onClick={() => {
                setIsMoreOpen(false);
                onOpenAIAssistant();
              }}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-[#0D1320] hover:bg-[#161F30] border border-[#1F2937] text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">AI Trading Assistant</span>
                  <span className="text-[10px] text-slate-400">Risk analysis & trade reviewer</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Open</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Sticky Bottom Navigation Bar for Mobile */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090D16]/95 backdrop-blur-lg border-t border-[#1F2937] px-2 py-2 flex items-center justify-around shadow-2xl safe-bottom"
      >
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'text-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400 stroke-[2.2]' : 'text-slate-400'}`} />
              <span className="leading-tight">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}

        {/* "More" Trigger */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
            isMoreOpen || !primaryItems.some((p) => p.id === activeTab)
              ? 'text-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-4 h-4 text-slate-400" />
          <span className="leading-tight">More</span>
          {!primaryItems.some((p) => p.id === activeTab) && (
            <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-blue-400" />
          )}
        </button>
      </nav>
    </>
  );
};
