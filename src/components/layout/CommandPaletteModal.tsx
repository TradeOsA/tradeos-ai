import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  LayoutDashboard,
  ShieldAlert,
  BookOpen,
  Sparkles,
  Bot,
  GraduationCap,
  PieChart,
  Target,
  Users,
  Settings,
  ArrowRight,
  TrendingUp,
  Calculator,
  Plus,
  X,
  Moon,
  Sun,
  Activity,
  DollarSign,
  Percent,
  Sliders,
  Scale,
  Compass,
  Zap,
  Crown,
  Headphones,
  Radar,
  Wallet,
  IndianRupee,
} from 'lucide-react';
import { MarketAsset } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onSelectAsset: (asset: MarketAsset) => void;
  onOpenNewTrade: () => void;
  onOpenAIAssistant: () => void;
  onOpenProfileSettings?: () => void;
  onOpenPricing?: () => void;
  onOpenSupport?: () => void;
  assets: MarketAsset[];
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectAsset,
  onOpenNewTrade,
  onOpenAIAssistant,
  onOpenProfileSettings,
  onOpenPricing,
  onOpenSupport,
  assets,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Pages' | 'Calculators' | 'Assets' | 'Actions'>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
      setActiveCategory('All');
    }
  }, [isOpen]);

  // Comprehensive command database
  const navigationItems = [
    { id: 'nav-dash', type: 'page', title: 'Live Market Terminal', desc: 'Real-time quotes, candlestick charts, indicators, and market heatmap', icon: LayoutDashboard, tab: 'dashboard', category: 'Pages' },
    { id: 'nav-scan', type: 'page', title: 'Breakout Radar & Scanner', desc: 'Live algorithmic signal scanner (Volume surge, RSI oversold, EMA cross)', icon: Radar, tab: 'scanner', category: 'Pages' },
    { id: 'nav-paper', type: 'page', title: 'Paper Trading Simulator', desc: '$10,000 virtual balance demo account with real-time PnL & leverage', icon: Wallet, tab: 'paper-trading', category: 'Pages' },
    { id: 'nav-tax', type: 'page', title: 'Indian Crypto Tax & TDS Matrix', desc: 'Section 115BBH 30% tax + Section 194S 1% TDS calculator & CA report', icon: IndianRupee, tab: 'tax', category: 'Pages' },
    { id: 'nav-risk', type: 'page', title: 'Risk Matrix & Calculators', desc: '8 institutional risk management & position sizing calculators', icon: ShieldAlert, tab: 'risk-center', category: 'Pages' },
    { id: 'nav-journal', type: 'page', title: 'Trade Journal & Analytics', desc: 'Log trades, track win-rates, PnL analytics, and review mistakes', icon: BookOpen, tab: 'journal', category: 'Pages' },
    { id: 'nav-ai-rev', type: 'page', title: 'AI Chart Review (Vision)', desc: 'Upload chart screenshots for Gemini 3.7 multimodal structural audits', icon: Sparkles, tab: 'ai-review', category: 'Pages' },
    { id: 'nav-ai-coach', type: 'page', title: 'AI Trading Coach & Psychologist', desc: 'Personalized trade review, FOMO mitigation, and discipline audits', icon: Bot, tab: 'ai-coach', category: 'Pages' },
    { id: 'nav-acad', type: 'page', title: 'Learning Academy & Quizzes', desc: '5 comprehensive modules covering SMC, Liquidity, and Risk', icon: GraduationCap, tab: 'academy', category: 'Pages' },
    { id: 'nav-port', type: 'page', title: 'Portfolio & Capital Growth', desc: 'Equity curve analytics, capital allocation, and asset breakdowns', icon: PieChart, tab: 'portfolio', category: 'Pages' },
    { id: 'nav-goals', type: 'page', title: 'Goals & Discipline Habits', desc: 'Daily trader checklist, streak trackers, and execution milestones', icon: Target, tab: 'goals', category: 'Pages' },
    { id: 'nav-comm', type: 'page', title: 'Community Theses & Ideas', desc: 'Explore shared setups, risk-reward ideas, and SMC discussions', icon: Users, tab: 'community', category: 'Pages' },
    { id: 'nav-about', type: 'page', title: 'About Us & Founder Story', desc: 'Ajay’s journey: 10th pass, 4 yrs market lessons, ~₹1.2L loss survival & smartphone-built vision', icon: Sparkles, tab: 'about', category: 'Pages' },
    { id: 'nav-sett', type: 'page', title: 'Settings & Risk Limits', desc: 'Account capital rules, default risk %, display currency, and themes', icon: Settings, tab: 'settings', category: 'Pages' },
  ];

  const calculatorItems = [
    { id: 'calc-1', type: 'calc', title: 'Position Size Calculator', desc: 'Calculate exact lot size & units based on account risk percentage', icon: Calculator, tab: 'risk-center', category: 'Calculators' },
    { id: 'calc-2', type: 'calc', title: 'Stop Loss & R:R Calculator', desc: 'Define invalidation price, target price, and risk-to-reward ratio', icon: Scale, tab: 'risk-center', category: 'Calculators' },
    { id: 'calc-3', type: 'calc', title: 'Capital Preservation / Drawdown', desc: 'Required gain calculator to recover from account drawdowns', icon: ShieldAlert, tab: 'risk-center', category: 'Calculators' },
    { id: 'calc-4', type: 'calc', title: 'Daily Loss Limit Guardian', desc: 'Automated daily drawdown circuit breaker to prevent tilt', icon: Activity, tab: 'risk-center', category: 'Calculators' },
    { id: 'calc-5', type: 'calc', title: 'Value at Risk (VaR)', desc: 'Estimate maximum potential loss under 95% & 99% confidence levels', icon: Percent, tab: 'risk-center', category: 'Calculators' },
    { id: 'calc-6', type: 'calc', title: 'Compounding & Growth Projection', desc: 'Model compound account growth over months with realistic win rates', icon: TrendingUp, tab: 'risk-center', category: 'Calculators' },
    { id: 'calc-7', type: 'calc', title: 'Leverage & Margin Impact', desc: 'Compute liquidation buffer, maintenance margin, and effective leverage', icon: Sliders, tab: 'risk-center', category: 'Calculators' },
    { id: 'calc-8', type: 'calc', title: 'Asset Correlation Matrix', desc: 'Check portfolio exposure cross-correlations across BTC, SPX, Gold', icon: Compass, tab: 'risk-center', category: 'Calculators' },
  ];

  const actionItems = [
    { id: 'act-support', type: 'action', title: 'Contact Support (tradeos.crypto@gmail.com)', desc: '24/7 priority live assistance, ticket submission & FAQs', icon: Headphones, action: () => onOpenSupport && onOpenSupport(), category: 'Actions' },
    { id: 'act-pricing', type: 'action', title: 'View Pro Plans & Pricing (14-Day Free Trial)', desc: 'Unlock broker auto-sync, prop firm shield, and AI chart audits', icon: Crown, action: () => onOpenPricing && onOpenPricing(), category: 'Actions' },
    { id: 'act-new-trade', type: 'action', title: 'Log New Trade Entry', desc: 'Record a new position with stop-loss, targets, and thesis', icon: Plus, action: onOpenNewTrade, category: 'Actions' },
    { id: 'act-broker-import', type: 'action', title: 'Import Broker Statement / CSV', desc: 'Auto-sync trades from Zerodha, Dhan, Binance, Bybit, MT4/5, or CSV', icon: BookOpen, action: () => onNavigateTab('journal'), category: 'Actions' },
    { id: 'act-prop-shield', type: 'action', title: 'Prop Firm & Evaluation Shield', desc: 'FTMO / FundedNext daily loss circuit breaker and profit meter', icon: ShieldAlert, action: () => onNavigateTab('journal'), category: 'Actions' },
    { id: 'act-pre-veto', type: 'action', title: 'Pre-Trade AI Veto & Clearance', desc: '15-second risk, R:R, and psychology gatekeeper check before entry', icon: Zap, action: () => onNavigateTab('journal'), category: 'Actions' },
    { id: 'act-ai-copilot', type: 'action', title: 'Summon AI Copilot Assistant', desc: 'Chat with Gemini 3.7 about setups, risk rules, and macro context', icon: Sparkles, action: onOpenAIAssistant, category: 'Actions' },
    { id: 'act-profile', type: 'action', title: 'Open Profile Settings', desc: 'Change avatar, display name, base capital, and risk tier', icon: Settings, action: () => onOpenProfileSettings && onOpenProfileSettings(), category: 'Actions' },
    { id: 'act-theme', type: 'action', title: theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme', desc: 'Toggle visual appearance between Dark and Light mode', icon: theme === 'dark' ? Sun : Moon, action: toggleTheme, category: 'Actions' },
  ];

  const assetItems = assets.map((a) => ({
    id: `asset-${a.symbol}`,
    type: 'asset',
    title: `${a.symbol} — ${a.name}`,
    desc: `Live Price: $${a.price.toLocaleString()} • 24h: ${a.change24h >= 0 ? '+' : ''}${a.change24h}% • ${a.category}`,
    icon: TrendingUp,
    asset: a,
    category: 'Assets',
  }));

  const allItems = [...actionItems, ...navigationItems, ...calculatorItems, ...assetItems];

  const filteredItems = allItems.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesQuery =
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.desc?.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        executeItem(selected);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const executeItem = (item: any) => {
    if (item.type === 'page' || item.type === 'calc') {
      onNavigateTab(item.tab);
    } else if (item.type === 'action') {
      item.action();
    } else if (item.type === 'asset') {
      onSelectAsset(item.asset);
      onNavigateTab('dashboard');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-[#0B0F1A] border border-white/15 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 glass-panel">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 sm:px-6 py-4 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, calculators, assets (BTC, Gold, SPX), or actions..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-hidden font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-slate-400 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 bg-white/[0.02] border-b border-white/5 overflow-x-auto text-xs">
          {(['All', 'Pages', 'Calculators', 'Assets', 'Actions'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSelectedIndex(0);
              }}
              className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <p className="text-sm font-semibold">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs">Try searching for &quot;risk&quot;, &quot;journal&quot;, &quot;BTC&quot;, &quot;chart&quot;, or &quot;position size&quot;</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent text-white border border-emerald-500/30'
                      : 'hover:bg-white/[0.04] text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-md bg-white/5 text-slate-400 border border-white/10">
                          {item.category}
                        </span>
                      </div>
                      {item.desc && (
                        <p className="text-[11px] text-slate-400 truncate max-w-lg mt-0.5">
                          {item.desc}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && (
                      <span className="text-[10px] font-mono text-emerald-400 hidden sm:inline">
                        Press Enter ↵
                      </span>
                    )}
                    <ArrowRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-slate-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 sm:px-6 py-2.5 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>TradeosAi Pro Global Index</span>
        </div>
      </div>
    </div>
  );
};
