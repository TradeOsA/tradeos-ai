import React, { useState } from 'react';
import {
  Bell,
  Search,
  PlusCircle,
  ShieldCheck,
  Zap,
  Sparkles,
  ChevronDown,
  Moon,
  Sun,
  Home,
  ArrowLeft,
  CreditCard,
  HelpCircle,
  Eye,
  EyeOff,
  Activity,
  Key,
  Flame,
} from 'lucide-react';
import { UserProfile, MarketAsset } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency, CURRENCIES, CurrencyCode } from '../../context/CurrencyContext';
import { APP_CONFIG } from '../../config/branding';

interface HeaderProps {
  user: UserProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTrade: () => void;
  onOpenAuth: () => void;
  onOpenCommandPalette: () => void;
  onOpenAIAssistant: () => void;
  onOpenNotifications: () => void;
  onOpenProfileSettings: () => void;
  onOpenPricing?: () => void;
  onOpenSupport?: () => void;
  onOpenAbout?: () => void;
  onOpenBrokerSync?: () => void;
  onOpenShareModal?: () => void;
  onOpenInstallApp?: () => void;
  onOpenKillSwitch?: () => void;
  selectedMarketSegment?: 'ALL' | 'INDIAN' | 'CRYPTO' | 'FOREX';
  onSelectMarketSegment?: (segment: 'ALL' | 'INDIAN' | 'CRYPTO' | 'FOREX') => void;
  assets?: MarketAsset[];
  disciplineScore?: number;
  onBack?: () => void;
  canGoBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenNewTrade,
  onOpenAuth,
  onOpenCommandPalette,
  onOpenAIAssistant,
  onOpenNotifications,
  onOpenProfileSettings,
  onOpenPricing,
  onOpenSupport,
  onOpenAbout,
  onOpenBrokerSync,
  onOpenKillSwitch,
  selectedMarketSegment = 'ALL',
  onSelectMarketSegment,
  disciplineScore = 88,
  onBack,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, formatCurrency } = useCurrency();
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  return (
    <header className="sticky top-0 z-40 border-b border-[#1C263C] bg-[#0A0E17]/95 transition-colors backdrop-blur-none">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Title, Fast Back & Home Quick Action, Discipline Indicator */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="lg:hidden flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-indigo-500 flex items-center justify-center font-black text-slate-950 shadow-md">
              T
            </div>
            <span className="font-black tracking-tight text-white text-base">{APP_CONFIG.shortName}</span>
          </div>

          {/* Quick Back & Home (Universal Header Shortcuts) */}
          <div className="hidden sm:flex items-center gap-1 bg-[#101626] p-1 rounded-xl border border-[#1C263C]">
            {activeTab !== 'dashboard' && onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer group active:scale-95 text-xs font-semibold"
                title="Go back to previous page"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden md:inline">Back</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                  : 'hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
              title="Jump to Live Terminal (Home)"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Real-time Network Latency & Live Status */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#101626] border border-[#1C263C] text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono font-bold text-emerald-400">12ms</span>
            <span className="text-slate-500">• Ultra-Low Latency</span>
          </div>

          {/* Institutional Balance Widget with Privacy Toggle */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#101626] border border-[#1C263C] text-xs">
            <span className="text-slate-400 text-[11px]">Capital:</span>
            <span className="font-mono font-bold text-slate-100">
              {showBalance ? formatCurrency(user.accountBalance || 50000) : '••••••'}
            </span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
              title={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Discipline Score Indicator */}
          <div className="hidden lg:flex items-center gap-2 text-xs bg-[#101626] border border-[#1C263C] rounded-xl px-3 py-1.5 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Discipline:</span>
            <span className="font-bold text-emerald-400 mono-numbers text-xs">{disciplineScore}%</span>
          </div>
        </div>

        {/* Center: Command Palette & Market Segment Switcher */}
        <div className="flex-1 max-w-2xl mx-2 sm:mx-4 flex items-center gap-2">
          {/* Market Switcher Quick Tabs (Desktop) */}
          {onSelectMarketSegment && (
            <div className="hidden xl:flex items-center gap-1 bg-[#101626] p-1 rounded-xl border border-[#1C263C] shrink-0 text-xs">
              <button
                onClick={() => onSelectMarketSegment('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedMarketSegment === 'ALL'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Markets
              </button>
              <button
                onClick={() => onSelectMarketSegment('INDIAN')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedMarketSegment === 'INDIAN'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Indian Stock Market (NSE / BSE / NIFTY / BANKNIFTY)"
              >
                <span>🇮🇳</span>
                <span>Indian (NSE/BSE)</span>
              </button>
              <button
                onClick={() => onSelectMarketSegment('CRYPTO')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedMarketSegment === 'CRYPTO'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="24x7 Crypto Market (BTC, ETH, SOL, Binance, Delta)"
              >
                <span>⚡</span>
                <span>Crypto (24x7)</span>
              </button>
              <button
                onClick={() => onSelectMarketSegment('FOREX')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedMarketSegment === 'FOREX'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Forex & Commodities (EUR/USD, GBP/USD, XAU/USD Gold)"
              >
                <span>🌍</span>
                <span>Forex (MT4/MT5)</span>
              </button>
            </div>
          )}

          <button
            onClick={onOpenCommandPalette}
            className="flex-1 flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#101626] hover:bg-[#151D30] border border-[#1C263C] hover:border-[#283654] transition-all text-xs text-slate-300 cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0" />
              <span className="hidden md:inline truncate text-slate-400">Search assets, strategies, calculators, jump anywhere...</span>
              <span className="md:hidden truncate text-slate-400">Search or ⌘K...</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <kbd className="px-1.5 py-0.5 rounded-md bg-[#080B11] border border-[#1C263C] text-[10px] font-mono text-slate-400">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Emergency Kill Switch Trigger */}
          {onOpenKillSwitch && (
            <button
              onClick={onOpenKillSwitch}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 hover:border-rose-500/60 text-rose-300 hover:text-rose-100 font-black text-xs transition-all cursor-pointer shadow-sm active:scale-95 group shrink-0"
              title="EMERGENCY KILL SWITCH: Cancel All Orders & Square Off Positions Instantly"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400 group-hover:animate-ping" />
              <span className="hidden sm:inline">KILL SWITCH</span>
              <span className="sm:hidden text-[10px]">KILL</span>
            </button>
          )}

          {/* Broker API Key Setup Button */}
          {onOpenBrokerSync && (
            <button
              onClick={onOpenBrokerSync}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 hover:text-emerald-200 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 group shrink-0"
              title="Configure Exchange & Broker API Keys (Delta Exchange, Dhan, Zerodha, Angel One, MT4/MT5)"
            >
              <Key className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">API Key & Brokers</span>
              <span className="sm:hidden text-[11px]">API Keys</span>
            </button>
          )}

          {/* About / Founder Button */}
          {onOpenAbout && (
            <button
              onClick={onOpenAbout}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 group shrink-0 ${
                activeTab === 'about'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-300 hover:text-white'
              }`}
              title="About TradeosAi & Founder Story"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">About Us</span>
              <span className="sm:hidden text-[11px]">About</span>
            </button>
          )}

          {/* Pricing / Plan Badge */}
          {onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 hover:text-white font-medium text-xs transition-all cursor-pointer shadow-sm active:scale-95 group shrink-0"
              title="View Plans & Pricing"
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
              <span className="hidden sm:inline">Pricing</span>
              <span className="sm:hidden text-[11px]">VIP</span>
            </button>
          )}

          {/* Currency Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#101626] hover:bg-[#151D30] border border-[#1C263C] text-xs font-mono font-bold text-slate-300 transition-colors cursor-pointer"
              title="Change Display Currency"
            >
              <span>{CURRENCIES[currency].flag}</span>
              <span className="hidden sm:inline">{currency}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {isCurrencyDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 py-1.5 rounded-xl bg-[#0E131F] border border-[#1C263C] shadow-2xl z-50 animate-fade-in">
                {(['USD', 'INR', 'EUR', 'GBP', 'AED'] as CurrencyCode[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCurrency(c);
                      setIsCurrencyDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                      currency === c
                        ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{CURRENCIES[c].flag}</span>
                      <span>{c}</span>
                    </div>
                    <span className="font-mono text-slate-500">{CURRENCIES[c].symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Copilot Drawer Trigger */}
          <button
            onClick={onOpenAIAssistant}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-emerald-500/10 hover:from-indigo-500/25 hover:to-emerald-500/20 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer shadow-sm group"
            title="Open AI Copilot Drawer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden lg:inline">AI Copilot</span>
          </button>

          {/* Quick Log Trade */}
          <button
            onClick={onOpenNewTrade}
            className="flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Log Trade</span>
            <span className="sm:hidden">Log</span>
          </button>

          {/* Theme Mode Switcher */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {/* Help & Support Desk */}
          {onOpenSupport && (
            <button
              onClick={onOpenSupport}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
              title="Support Desk"
              aria-label="Support Desk"
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          {/* Notifications Trigger */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
            title="Open Notifications Center"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full" />
          </button>

          {/* Direct Login / Google Auth Button */}
          {!user.email ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 hover:from-emerald-500/30 hover:to-indigo-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 group shrink-0"
              title="Log in"
            >
              <span className="font-black">Login</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden md:inline">Sync Active</span>
            </div>
          )}

          {/* User Profile Pill */}
          <button
            onClick={user.email ? onOpenProfileSettings : onOpenAuth}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-[#101626] hover:bg-[#151D30] border border-[#1C263C] transition-all cursor-pointer group"
            title={user.email ? 'Profile & Risk Settings' : 'Log In / Create Account'}
          >
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-6 h-6 rounded-lg object-cover ring-1 ring-emerald-500/40 group-hover:ring-emerald-400 transition-all"
            />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-200 leading-tight group-hover:text-white transition-colors truncate max-w-[90px]">
                {user.name}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500 hidden xl:inline" />
          </button>
        </div>
      </div>
    </header>
  );
};


