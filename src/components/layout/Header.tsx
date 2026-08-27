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
  MessageSquare,
  LayoutDashboard,
  Layers,
  Radar,
  Wallet,
  Calculator,
  IndianRupee,
  BookOpenCheck,
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
  onOpenWhatsAppDigest?: () => void;
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
  onOpenWhatsAppDigest,
  selectedMarketSegment = 'ALL',
  onSelectMarketSegment,
  disciplineScore = 88,
  onBack,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, formatCurrency } = useCurrency();
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const topNavItems = [
    { id: 'dashboard', label: 'Terminal', icon: LayoutDashboard },
    { id: 'option-chain', label: 'Option Chain', icon: Layers },
    { id: 'scanner', label: 'Radar', icon: Radar },
    { id: 'paper-trading', label: 'Paper Trading', icon: Wallet },
    { id: 'risk-center', label: 'Risk Matrix', icon: Calculator },
    { id: 'journal', label: 'Journal', icon: BookOpenCheck },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#1C2433] bg-[#0B0E14]/98 backdrop-blur-md transition-colors">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Brand Logo & Navigation Links */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white text-sm shadow-sm border border-blue-500/30 group-hover:scale-105 transition-transform">
              T
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-base">{APP_CONFIG.shortName}</span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded hidden sm:inline">
                PRO
              </span>
            </div>
          </div>

          {/* Quick Back & Home Shortcuts */}
          <div className="hidden lg:flex items-center gap-1 bg-[#101520] p-0.5 rounded-lg border border-[#1C2433]">
            {activeTab !== 'dashboard' && onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer text-xs font-semibold"
                title="Go back"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden xl:inline">Back</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-500/20 text-blue-400 font-bold'
                  : 'hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
              title="Jump to Live Terminal"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Top Desktop Navigation Links */}
          <nav className="hidden 2xl:flex items-center gap-1">
            {topNavItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#101520]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center: Command Palette & Market Segment Switcher */}
        <div className="flex-1 max-w-xl mx-2 sm:mx-4 flex items-center gap-2">
          {/* Market Switcher Quick Tabs */}
          {onSelectMarketSegment && (
            <div className="hidden xl:flex items-center gap-0.5 bg-[#101520] p-0.5 rounded-lg border border-[#1C2433] shrink-0 text-xs">
              <button
                onClick={() => onSelectMarketSegment('ALL')}
                className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  selectedMarketSegment === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => onSelectMarketSegment('INDIAN')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  selectedMarketSegment === 'INDIAN'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Indian Stock Market (NSE / BSE / NIFTY / BANKNIFTY)"
              >
                <span>🇮🇳 NSE</span>
              </button>
              <button
                onClick={() => onSelectMarketSegment('CRYPTO')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  selectedMarketSegment === 'CRYPTO'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Crypto (BTC, ETH, SOL, Binance, Delta)"
              >
                <span>Crypto</span>
              </button>
              <button
                onClick={() => onSelectMarketSegment('FOREX')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  selectedMarketSegment === 'FOREX'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Forex & Commodities (EUR/USD, XAU/USD Gold)"
              >
                <span>Forex</span>
              </button>
            </div>
          )}

          <button
            onClick={onOpenCommandPalette}
            className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#101520] hover:bg-[#151C2B] border border-[#1C2433] hover:border-[#2A364B] transition-all text-xs text-slate-300 cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors shrink-0" />
              <span className="hidden md:inline truncate text-slate-400">Search assets, strategies, calculators...</span>
              <span className="md:hidden truncate text-slate-400">Search or ⌘K...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-[#0D121C] border border-[#1C2433] text-[10px] font-mono text-slate-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Controls: Balance, Currency, AI Copilot, User */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Institutional Balance Widget */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#101520] border border-[#1C2433] text-xs">
            <span className="text-slate-400 text-[11px]">Capital:</span>
            <span className="font-mono font-bold text-slate-100 tabular-nums">
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

          {/* Currency Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#101520] hover:bg-[#151C2B] border border-[#1C2433] text-xs font-mono font-bold text-slate-300 transition-colors cursor-pointer"
              title="Change Display Currency"
            >
              <span>{CURRENCIES[currency].flag}</span>
              <span className="hidden sm:inline">{currency}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {isCurrencyDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-36 py-1 rounded-lg bg-[#101520] border border-[#1C2433] shadow-2xl z-50 animate-fade-in">
                {(['USD', 'INR', 'EUR', 'GBP', 'AED'] as CurrencyCode[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCurrency(c);
                      setIsCurrencyDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                      currency === c
                        ? 'bg-blue-600/20 text-blue-400 font-bold'
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
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 transition-all cursor-pointer shadow-sm group"
            title="Open AI Copilot Drawer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">AI Copilot</span>
          </button>

          {/* Quick Log Trade Button */}
          <button
            onClick={onOpenNewTrade}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Trade</span>
            <span className="sm:hidden">Log</span>
          </button>

          {/* Theme Mode Switcher */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-[#1C2433] transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-blue-400" />
            )}
          </button>

          {/* Notifications Trigger */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-[#1C2433] transition-colors cursor-pointer"
            title="Open Notifications Center"
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-400 rounded-full" />
          </button>

          {/* User Profile Pill */}
          <button
            onClick={user.email ? onOpenProfileSettings : onOpenAuth}
            className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-lg bg-[#101520] hover:bg-[#151C2B] border border-[#1C2433] transition-all cursor-pointer group"
            title={user.email ? 'Profile & Risk Settings' : 'Log In / Create Account'}
          >
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-6 h-6 rounded-md object-cover ring-1 ring-[#1C2433] group-hover:ring-blue-500 transition-all"
            />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight group-hover:text-white transition-colors truncate max-w-[80px]">
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



