import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LiveTickerMarquee } from './components/layout/LiveTickerMarquee';
import { CommandPaletteModal } from './components/layout/CommandPaletteModal';
import { AIAssistantDrawer } from './components/layout/AIAssistantDrawer';
import { EducationalDisclaimerModal } from './components/layout/EducationalDisclaimerModal';
import { NotificationCenterModal } from './components/layout/NotificationCenterModal';
import { ProfileSettingsModal } from './components/settings/ProfileSettingsModal';
import { QuickActionFAB } from './components/layout/QuickActionFAB';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { AuthModal } from './components/auth/AuthModal';
import { ShareReferralModal } from './components/dashboard/ShareReferralModal';
import { InstallMobileAppModal } from './components/mobile/InstallMobileAppModal';
import { InstallAppPromptBanner } from './components/mobile/InstallAppPromptBanner';
import { DashboardView } from './components/dashboard/DashboardView';
import { RiskCenterView } from './components/risk-center/RiskCenterView';
import { JournalView } from './components/journal/JournalView';
import { NewTradeModal } from './components/journal/NewTradeModal';
import { TradeDetailModal } from './components/journal/TradeDetailModal';
import { EditTradeModal } from './components/journal/EditTradeModal';
import { AITradeReviewView } from './components/ai-review/AITradeReviewView';
import { AICoachView } from './components/ai-coach/AICoachView';
import { AcademyView } from './components/academy/AcademyView';
import { PortfolioView } from './components/portfolio/PortfolioView';
import { GoalsHabitsView } from './components/goals/GoalsHabitsView';
import { CommunityView } from './components/community/CommunityView';
import { SettingsView } from './components/settings/SettingsView';
import { AboutFoundersView } from './components/about/AboutFoundersView';
import { PricingModal } from './components/pricing/PricingModal';
import { SupportModal } from './components/support/SupportModal';
import { LegalPoliciesModal } from './components/legal/LegalPoliciesModal';
import { BreakoutRadarView } from './components/scanner/BreakoutRadarView';
import { PaperTradingView } from './components/paper-trading/PaperTradingView';
import { IndianCryptoTaxView } from './components/tax/IndianCryptoTaxView';
import { TradeStoryCardModal } from './components/story-card/TradeStoryCardModal';
import { TiltProtectionModal } from './components/tilt-lock/TiltProtectionModal';
import { BrokerSyncModal } from './components/broker/BrokerSyncModal';
import { TelegramAlertsModal } from './components/alerts/TelegramAlertsModal';
import { MacroAlertsModal } from './components/alerts/MacroAlertsModal';
import { EmergencyKillSwitchModal } from './components/risk-center/EmergencyKillSwitchModal';
import { TiltProtectionProvider, useTiltProtection } from './context/TiltProtectionContext';
import { Footer } from './components/layout/Footer';
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  query,
} from './lib/firebase';
import {
  defaultUser,
  defaultMarketAssets,
  defaultEconomicEvents,
  defaultMarketNews,
  defaultTrades,
} from './data/mockData';
import {
  UserProfile,
  MarketAsset,
  EconomicEvent,
  MarketNewsItem,
  Trade,
  FearGreedData,
} from './types';

export default function App() {
  const [activeTab, setActiveTabState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/about' || path.startsWith('/about')) return 'about';
      const cleanPath = path.replace(/^\/+/, '');
      if (cleanPath && ['dashboard', 'scanner', 'paper-trading', 'risk-center', 'tax', 'journal', 'ai-review', 'ai-coach', 'academy', 'portfolio', 'goals', 'community', 'settings', 'about'].includes(cleanPath)) {
        return cleanPath;
      }
    }
    return 'dashboard';
  });
  const [tabHistory, setTabHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/about' || path.startsWith('/about')) return ['about'];
    }
    return ['dashboard'];
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [assets, setAssets] = useState<MarketAsset[]>(defaultMarketAssets);
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset>(defaultMarketAssets[0]);
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>(defaultEconomicEvents);
  const [news, setNews] = useState<MarketNewsItem[]>(defaultMarketNews);
  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
      const saved = localStorage.getItem('tradeos_trades_v2');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load saved trades', e);
    }
    return defaultTrades || [];
  });

  const [paymentSuccessToast, setPaymentSuccessToast] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: '' });

  // Handle URL callback redirect like /dashboard?payment=success or ?payment=success
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      setActiveTabState('dashboard');
      setUser((prev) => {
        const upgraded: UserProfile = { ...prev, experienceLevel: 'Pro / Institutional' };
        try {
          localStorage.setItem('tradeos_user_profile', JSON.stringify(upgraded));
        } catch {}
        return upgraded;
      });
      setPaymentSuccessToast({
        show: true,
        message: 'Payment Verified! Your Pro Membership has been activated.',
      });
      setTimeout(() => {
        setPaymentSuccessToast({ show: false, message: '' });
      }, 7000);

      // Clean up URL query parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  // Handler to completely clear all trades across LocalStorage, Server Disk, and Firestore
  const handleClearAllTrades = () => {
    setTrades([]);
    try {
      localStorage.setItem('tradeos_trades_v2', JSON.stringify([]));
    } catch {}
    fetch('/api/journal/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trades: [] }),
    }).catch(() => {});
    try {
      setDoc(
        doc(db, 'system_state', 'journal_trades'),
        { trades: [], updatedAt: new Date().toISOString() },
        { merge: true }
      ).catch(() => {});
    } catch {}
  };

  // Load trades from Server Disk & Firestore on boot
  useEffect(() => {
    // 1. Fetch server disk
    fetch('/api/journal/trades')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.trades)) {
          const localSaved = localStorage.getItem('tradeos_trades_v2');
          if (localSaved !== null) {
            try {
              const parsedLocal = JSON.parse(localSaved);
              if (Array.isArray(parsedLocal) && parsedLocal.length === 0) {
                return;
              }
            } catch {}
          }
          if (data.trades.length > 0) {
            setTrades((prev) => {
              const currentIds = new Set(prev.map((t) => t.id));
              const merged = [...prev, ...data.trades.filter((t: Trade) => !currentIds.has(t.id))];
              return merged;
            });
          }
        }
      })
      .catch(() => {});

    // 2. Listen to Firestore
    try {
      const unsub = onSnapshot(
        doc(db, 'system_state', 'journal_trades'),
        (snap) => {
          if (snap.exists()) {
            const cloudData = snap.data();
            if (cloudData && Array.isArray(cloudData.trades)) {
              const localSaved = localStorage.getItem('tradeos_trades_v2');
              if (localSaved !== null) {
                try {
                  const parsedLocal = JSON.parse(localSaved);
                  if (Array.isArray(parsedLocal) && parsedLocal.length === 0 && cloudData.trades.length === 0) {
                    setTrades([]);
                    return;
                  }
                } catch {}
              }
              if (cloudData.trades.length > 0) {
                setTrades((prev) => {
                  const currentIds = new Set(prev.map((t) => t.id));
                  const merged = [...prev, ...cloudData.trades.filter((t: Trade) => !currentIds.has(t.id))];
                  return merged.length > 0 ? merged : prev;
                });
              }
            }
          }
        },
        (error) => {
          // Graceful handler prevents unhandled exceptions during background/hidden/closing states
          console.warn('[Firestore] Journal trades snapshot sync info:', error?.message || error);
        }
      );
      return () => {
        try {
          unsub();
        } catch {}
      };
    } catch (err) {
      console.warn('Firestore trades sync init:', err);
    }
  }, []);

  // Listen to real Firebase Authentication changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Fetch or create profile in Firestore
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          let loadedProfile: Partial<UserProfile> = {};
          if (userDocSnap.exists()) {
            loadedProfile = userDocSnap.data() as Partial<UserProfile>;
          }

          const loggedInUser: UserProfile = {
            id: fbUser.uid,
            name: fbUser.displayName || loadedProfile.name || 'Pro Trader',
            email: fbUser.email || loadedProfile.email || 'capitalsurakshaclub@gmail.com',
            avatarUrl: fbUser.photoURL || loadedProfile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            experienceLevel: loadedProfile.experienceLevel || user.experienceLevel || 'Intermediate',
            accountBalance: loadedProfile.accountBalance ?? user.accountBalance ?? 50000,
            defaultRiskPercent: loadedProfile.defaultRiskPercent ?? user.defaultRiskPercent ?? 1.0,
            primaryMarkets: loadedProfile.primaryMarkets || user.primaryMarkets || ['Crypto', 'Stocks'],
            maxDailyLossUsd: loadedProfile.maxDailyLossUsd ?? user.maxDailyLossUsd ?? 1500,
            maxOpenTrades: loadedProfile.maxOpenTrades ?? user.maxOpenTrades ?? 4,
            theme: loadedProfile.theme || user.theme || 'cyber-dark',
            soundEnabled: loadedProfile.soundEnabled ?? user.soundEnabled ?? true,
            autoSaveCloud: loadedProfile.autoSaveCloud ?? user.autoSaveCloud ?? true,
          };

          setUser(loggedInUser);
          localStorage.setItem('tradeos_user_profile', JSON.stringify(loggedInUser));
        } catch (err) {
          console.warn('Error fetching Firestore user profile:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync trades to localStorage, Server Disk & Firestore
  useEffect(() => {
    try {
      localStorage.setItem('tradeos_trades_v2', JSON.stringify(trades));
    } catch (e) {
      console.error('Failed to persist trades', e);
    }

    const timer = setTimeout(() => {
      // 1. Post to Server Disk
      fetch('/api/journal/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades }),
      }).catch(() => {});

      // 2. Write to Firestore
      try {
        setDoc(doc(db, 'system_state', 'journal_trades'), {
          trades,
          updatedAt: new Date().toISOString(),
        }, { merge: true }).catch(() => {});
      } catch {}
    }, 800);

    return () => clearTimeout(timer);
  }, [trades]);
  const [disciplineScore, setDisciplineScore] = useState<number>(88);
  const [fearGreedData, setFearGreedData] = useState<FearGreedData>({
    value: 72,
    sentiment: 'Greed',
    yesterdayValue: 68,
    lastWeekValue: 64,
    lastMonthValue: 56,
  });

  // Modals & Panels state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNewTradeOpen, setIsNewTradeOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [tradeDraft, setTradeDraft] = useState<Partial<Trade> | null>(null);
  const [selectedTradeDetail, setSelectedTradeDetail] = useState<Trade | null>(null);
  const [tradeToEditGlobal, setTradeToEditGlobal] = useState<Trade | null>(null);
  const [isGlobalEditModalOpen, setIsGlobalEditModalOpen] = useState(false);
  const [tradeToReviewInAI, setTradeToReviewInAI] = useState<Trade | null>(null);
  const [aiReviewSymbol, setAiReviewSymbol] = useState<string>('BTC/USDT');
  const [aiReviewPrice, setAiReviewPrice] = useState<number>(67800);
  const [isStoryCardOpen, setIsStoryCardOpen] = useState<boolean>(false);
  const [storyTrade, setStoryTrade] = useState<Trade | null>(null);
  const [isTiltShieldOpen, setIsTiltShieldOpen] = useState<boolean>(false);
  const [isBrokerSyncOpen, setIsBrokerSyncOpen] = useState<boolean>(false);
  const [isTelegramAlertsOpen, setIsTelegramAlertsOpen] = useState<boolean>(false);
  const [isMacroAlertsOpen, setIsMacroAlertsOpen] = useState<boolean>(false);
  const [selectedMarketSegment, setSelectedMarketSegment] = useState<'ALL' | 'INDIAN' | 'CRYPTO' | 'FOREX'>('ALL');
  const [isKillSwitchModalOpen, setIsKillSwitchModalOpen] = useState<boolean>(false);

  // Emergency Kill Switch: Instant Flatten & Square-off all open trades
  const handleFlattenAllTrades = useCallback((reason: string = 'Emergency Kill Switch Triggered') => {
    setTrades((prevTrades) => {
      const now = new Date().toISOString();
      const updated = prevTrades.map((t) => {
        if (t.status === 'OPEN') {
          return {
            ...t,
            status: 'BREAKEVEN' as const,
            exitPrice: t.entryPrice,
            exitDate: now,
            pnl: 0,
            roiPercentage: 0,
            notes: (t.notes ? t.notes + ' | ' : '') + `[FLATTENED: ${reason}]`,
          };
        }
        return t;
      });
      return updated;
    });
  }, []);

  // Capture PWA beforeinstallprompt event for 1-click install
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleNativeInstall = async () => {
    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredInstallPrompt(null);
        }
      } catch {
        setIsInstallModalOpen(true);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  // Tab Navigation with history tracking for Back Button and URL synchronization
  const navigateToTab = useCallback((nextTab: string) => {
    setActiveTabState((prev) => {
      if (prev !== nextTab) {
        setTabHistory((h) => [...h, nextTab]);
      }
      return nextTab;
    });

    if (typeof window !== 'undefined') {
      const targetPath = nextTab === 'about' ? '/about' : nextTab === 'dashboard' ? '/' : `/${nextTab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab: nextTab }, '', targetPath);
      }
    }
  }, []);

  // Listen to browser popstate (Back/Forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/about' || path.startsWith('/about')) {
        setActiveTabState('about');
      } else {
        const cleanTab = path.replace(/^\/+/, '') || 'dashboard';
        setActiveTabState(cleanTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleBack = useCallback(() => {
    setTabHistory((prev) => {
      if (prev.length > 1) {
        const nextHistory = [...prev];
        nextHistory.pop(); // remove current
        const previousTab = nextHistory[nextHistory.length - 1] || 'dashboard';
        setActiveTabState(previousTab);
        return nextHistory;
      }
      setActiveTabState('dashboard');
      return ['dashboard'];
    });
  }, []);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch live market data and setup polling
  useEffect(() => {
    const fetchLiveMarketData = () => {
      fetch('/api/market/quotes')
        .then((res) => res.json())
        .then((data) => {
          if (data.assets && data.assets.length > 0) {
            setAssets((prevAssets) => {
              const favMap = new Map(prevAssets.map((a) => [a.symbol, a.isFavorite]));
              return data.assets.map((a: MarketAsset) => ({
                ...a,
                isFavorite: favMap.get(a.symbol) || false,
              }));
            });

            setSelectedAsset((prevSelected) => {
              const updated = data.assets.find((a: MarketAsset) => a.symbol === prevSelected.symbol);
              return updated ? { ...prevSelected, ...updated } : prevSelected;
            });
          }
        })
        .catch((err) => {
          console.log('Using cached market data', err);
        });
    };

    const fetchFearGreed = () => {
      fetch('/api/market/fear-greed')
        .then((res) => res.json())
        .then((data) => {
          const fg = data.fearGreed || data.data;
          if (fg) {
            setFearGreedData(fg);
          }
        })
        .catch(() => {});
    };

    const fetchEconomicCalendar = () => {
      fetch('/api/market/economic-calendar')
        .then((res) => res.json())
        .then((data) => {
          if (data.events && data.events.length > 0) {
            setEconomicEvents(data.events);
          }
        })
        .catch(() => {});
    };

    const fetchNews = () => {
      fetch('/api/market/news')
        .then((res) => res.json())
        .then((data) => {
          if (data.news && data.news.length > 0) {
            setNews(data.news);
          }
        })
        .catch(() => {});
    };

    fetchLiveMarketData();
    fetchFearGreed();
    fetchEconomicCalendar();
    fetchNews();

    const quoteInterval = setInterval(fetchLiveMarketData, 4000);
    const fearGreedInterval = setInterval(fetchFearGreed, 60000);
    const calendarInterval = setInterval(fetchEconomicCalendar, 120000);
    const newsInterval = setInterval(fetchNews, 60000);

    return () => {
      clearInterval(quoteInterval);
      clearInterval(fearGreedInterval);
      clearInterval(calendarInterval);
      clearInterval(newsInterval);
    };
  }, []);

  const handleSaveNewTrade = (newTrade: Trade) => {
    setTrades((prev) => [newTrade, ...prev]);
    setTradeDraft(null);
  };

  const handleUpdateTrade = (updatedTrade: Trade) => {
    setTrades((prev) => prev.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)));
    if (selectedTradeDetail && selectedTradeDetail.id === updatedTrade.id) {
      setSelectedTradeDetail(updatedTrade);
    }
  };

  const handleDeleteTrade = (id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
    if (selectedTradeDetail && selectedTradeDetail.id === id) {
      setSelectedTradeDetail(null);
    }
  };

  const handleCloseTradeStatus = (
    tradeId: string,
    exitPrice: number,
    status: 'WIN' | 'LOSS' | 'BREAKEVEN'
  ) => {
    setTrades(
      trades.map((t) => {
        if (t.id === tradeId) {
          const pnl =
            t.direction === 'LONG'
              ? (exitPrice - t.entryPrice) * t.quantity - (t.fees || 0)
              : (t.entryPrice - exitPrice) * t.quantity - (t.fees || 0);
          const pnlPercent = t.positionSizeUsd > 0 ? (pnl / t.positionSizeUsd) * 100 : 0;
          return {
            ...t,
            exitPrice,
            status,
            pnl,
            pnlPercent,
            closeDate: new Date().toISOString(),
          };
        }
        return t;
      })
    );
  };

  const handleSendRiskToJournal = (draft: Partial<Trade>) => {
    setTradeDraft(draft);
    setIsNewTradeOpen(true);
  };

  const handleOpenTradeWithAsset = (asset: MarketAsset) => {
    setTradeDraft({
      symbol: asset.symbol,
      entryPrice: asset.price,
      stopLoss: Number((asset.price * 0.985).toFixed(asset.price < 2 ? 4 : 2)),
      targetPrice: Number((asset.price * 1.045).toFixed(asset.price < 2 ? 4 : 2)),
      direction: 'LONG',
      positionSizeUsd: 10000,
      leverage: 1,
    });
    setIsNewTradeOpen(true);
  };

  const handleSendToAIReviewFromChart = (symbol: string, currentPrice: number) => {
    setAiReviewSymbol(symbol);
    setAiReviewPrice(currentPrice);
    setTradeToReviewInAI(null);
    navigateToTab('ai-review');
  };

  const handleAnalyzeTradeWithAI = (trade: Trade) => {
    setTradeToReviewInAI(trade);
    setAiReviewSymbol(trade.symbol);
    setAiReviewPrice(trade.entryPrice);
    navigateToTab('ai-review');
  };

  return (
    <div id="tradeos-app-root" className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-200 pb-16 lg:pb-0">
      {/* Mobile Install App Top Sticky Prompt Banner */}
      <InstallAppPromptBanner
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onTriggerNativeInstall={handleNativeInstall}
        hasNativePrompt={!!deferredInstallPrompt}
      />

      {/* Payment Success Confirmation Banner */}
      <AnimatePresence>
        {paymentSuccessToast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-emerald-950 via-emerald-900/90 to-emerald-950 border-b border-emerald-500/40 text-emerald-200 px-4 py-2.5 text-center text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 z-50"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{paymentSuccessToast.message}</span>
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Real-Time Ticker Marquee */}
      <LiveTickerMarquee
        assets={assets}
        onSelectAsset={(asset) => {
          setSelectedAsset(asset);
          navigateToTab('dashboard');
        }}
      />

      {/* Global Header with Theme, Breadcrumbs, Profile, Notifications & Search */}
      <Header
        user={user}
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenNewTrade={() => {
          setTradeDraft(null);
          setIsNewTradeOpen(true);
        }}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenProfileSettings={() => setIsProfileModalOpen(true)}
        onOpenPricing={() => setIsPricingModalOpen(true)}
        onOpenSupport={() => setIsSupportOpen(true)}
        onOpenAbout={() => navigateToTab('about')}
        onOpenBrokerSync={() => setIsBrokerSyncOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenInstallApp={() => setIsInstallModalOpen(true)}
        onOpenKillSwitch={() => setIsKillSwitchModalOpen(true)}
        selectedMarketSegment={selectedMarketSegment}
        onSelectMarketSegment={setSelectedMarketSegment}
        disciplineScore={disciplineScore}
        onBack={handleBack}
        canGoBack={tabHistory.length > 1}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex max-w-[1900px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 gap-6 sm:gap-8">
        {/* Navigation Sidebar with Collapsible State */}
        <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} shrink-0 hidden lg:block transition-all duration-300`}>
          <div className="sticky top-24">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={navigateToTab}
              onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
              onOpenSupport={() => setIsSupportOpen(true)}
              onOpenPolicies={() => setIsPoliciesOpen(true)}
              onOpenTiltShield={() => setIsTiltShieldOpen(true)}
              onOpenPricing={() => setIsPricingModalOpen(true)}
              onOpenAuth={() => setIsAuthOpen(true)}
              onOpenBrokerSync={() => setIsBrokerSyncOpen(true)}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            />
          </div>
        </aside>

        {/* Dynamic View Panel with Smooth Motion Transitions */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="w-full"
            >
              {activeTab === 'dashboard' && (
                <DashboardView
                  user={user}
                  assets={assets}
                  selectedAsset={selectedAsset}
                  onSelectAsset={setSelectedAsset}
                  economicEvents={economicEvents}
                  news={news}
                  fearGreedData={fearGreedData}
                  trades={trades}
                  disciplineScore={disciplineScore}
                  onChecklistChange={(score) => setDisciplineScore(Math.max(60, score))}
                  setActiveTab={navigateToTab}
                  onOpenNewTradeWithAsset={handleOpenTradeWithAsset}
                  onSendToAIReviewFromChart={handleSendToAIReviewFromChart}
                  onOpenShareModal={() => setIsShareModalOpen(true)}
                  onOpenInstallModal={() => setIsInstallModalOpen(true)}
                  onOpenPricing={() => setIsPricingModalOpen(true)}
                  onOpenKillSwitch={() => setIsKillSwitchModalOpen(true)}
                  selectedMarketSegment={selectedMarketSegment}
                  onSelectMarketSegment={setSelectedMarketSegment}
                  onBack={handleBack}
                  onNavigateTab={navigateToTab}
                />
              )}

              {activeTab === 'scanner' && (
                <BreakoutRadarView
                  assets={assets}
                  onSelectAsset={(a) => {
                    setSelectedAsset(a);
                    navigateToTab('dashboard');
                  }}
                  onSendToAIReview={(sym, price) => {
                    setAiReviewSymbol(sym);
                    setAiReviewPrice(price);
                    setTradeToReviewInAI(null);
                    navigateToTab('ai-review');
                  }}
                  onOpenNewTradeWithAsset={(a) => {
                    setSelectedAsset(a);
                    handleOpenTradeWithAsset(a);
                  }}
                  onNavigateTab={navigateToTab}
                  onBack={handleBack}
                />
              )}

              {activeTab === 'paper-trading' && (
                <PaperTradingView
                  assets={assets}
                  selectedAsset={selectedAsset}
                  onSelectAsset={setSelectedAsset}
                  onNavigateTab={navigateToTab}
                  onBack={handleBack}
                  onOpenBrokerSync={() => setIsBrokerSyncOpen(true)}
                />
              )}

              {activeTab === 'risk-center' && (
                <RiskCenterView
                  user={user}
                  onSendToJournalDraft={handleSendRiskToJournal}
                  onBack={handleBack}
                  onNavigateTab={navigateToTab}
                />
              )}

              {activeTab === 'tax' && (
                <IndianCryptoTaxView
                  onBack={handleBack}
                  onNavigateTab={navigateToTab}
                />
              )}

              {activeTab === 'journal' && (
                <JournalView
                  trades={trades}
                  onOpenNewTradeModal={() => {
                    setTradeDraft(null);
                    setIsNewTradeOpen(true);
                  }}
                  onSelectTrade={(t) => setSelectedTradeDetail(t)}
                  onAnalyzeTradeWithAI={handleAnalyzeTradeWithAI}
                  onUpdateTrade={handleUpdateTrade}
                  onDeleteTrade={handleDeleteTrade}
                  onClearAllTrades={handleClearAllTrades}
                  onLoadSampleTrades={() => setTrades(defaultTrades)}
                  onImportTrades={(importedTrades) => {
                    setTrades((prev) => [...importedTrades, ...prev]);
                  }}
                  onSaveNewTrade={handleSaveNewTrade}
                  accountBalance={user.accountBalance}
                  maxDailyLossUsd={user.maxDailyLossUsd}
                  defaultRiskPercent={user.defaultRiskPercent}
                  userName={user.name}
                  onBack={handleBack}
                  onNavigateTab={navigateToTab}
                />
              )}

              {activeTab === 'ai-review' && (
                <AITradeReviewView
                  initialTradeToReview={tradeToReviewInAI}
                  initialSymbol={aiReviewSymbol}
                  initialPrice={aiReviewPrice}
                  onBack={handleBack}
                  onNavigateTab={navigateToTab}
                  onSaveToJournal={(partial) => {
                    handleSaveNewTrade({
                      id: `trade-ai-${Date.now()}`,
                      openDate: new Date().toISOString(),
                      symbol: partial.symbol || 'BTC/USDT',
                      market: 'Crypto',
                      direction: (partial.direction as any) || 'LONG',
                      entryPrice: partial.entryPrice || 67500,
                      exitPrice: partial.targetPrice || 70000,
                      stopLoss: partial.stopLoss || 66500,
                      targetPrice: partial.targetPrice || 70000,
                      quantity: 0.1,
                      positionSizeUsd: (partial.entryPrice || 67500) * 0.1,
                      leverage: 1,
                      pnl: 0,
                      pnlPercent: 0,
                      riskRewardRatio: 2.5,
                      strategy: 'Order Block / Smart Money (SMC)',
                      status: 'OPEN',
                      emotionBefore: 'Disciplined',
                      fees: 2.5,
                      tags: ['AI-Audited', 'Gemini-3.7'],
                      notes: partial.notes || 'Audited via TradeOS AI Multimodal Vision',
                      screenshotUrl: partial.screenshotUrl,
                    });
                  }}
                />
              )}

              {activeTab === 'ai-coach' && (
                <AICoachView
                  user={user}
                  onBack={handleBack}
                  onNavigateTab={navigateToTab}
                />
              )}

              {activeTab === 'academy' && (
                <AcademyView
                  onBack={handleBack}
                  onNavigateTab={navigateToTab}
                />
              )}

              {activeTab === 'portfolio' && (
                <PortfolioView
                  onBack={handleBack}
                  onNavigateTab={navigateToTab}
                />
              )}

              {activeTab === 'goals' && (
                <GoalsHabitsView
                  onBack={handleBack}
                  onNavigateTab={navigateToTab}
                />
              )}

              {activeTab === 'community' && (
                <CommunityView
                  onBack={handleBack}
                  onNavigateTab={navigateToTab}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  user={user}
                  onUpdateUser={setUser}
                  onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
                  onOpenSupport={() => setIsSupportOpen(true)}
                  onOpenPolicies={() => setIsPoliciesOpen(true)}
                  onBack={handleBack}
                  onNavigateTab={navigateToTab}
                  onImportTrades={(importedTrades) => {
                    setTrades((prev) => [...importedTrades, ...prev]);
                  }}
                />
              )}

              {activeTab === 'about' && (
                <AboutFoundersView
                  user={user}
                  onNavigateTab={navigateToTab}
                  onBack={handleBack}
                  onOpenPricing={() => setIsPricingModalOpen(true)}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Global Footer with Copyright & Legal */}
          <Footer
            onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
            onOpenPolicies={() => setIsPoliciesOpen(true)}
            onOpenSupport={() => setIsSupportOpen(true)}
            onOpenAbout={() => navigateToTab('about')}
          />
        </main>
      </div>

      {/* Floating Quick Action FAB */}
      <QuickActionFAB
        onOpenNewTrade={() => {
          setTradeDraft(null);
          setIsNewTradeOpen(true);
        }}
        onNavigateTab={navigateToTab}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        onOpenPricing={() => setIsPricingModalOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenNewTrade={() => {
          setTradeDraft(null);
          setIsNewTradeOpen(true);
        }}
      />

      {/* Modals & Drawers */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={navigateToTab}
        onSelectAsset={(a) => {
          setSelectedAsset(a);
          navigateToTab('dashboard');
        }}
        onOpenNewTrade={() => {
          setTradeDraft(null);
          setIsNewTradeOpen(true);
        }}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        onOpenProfileSettings={() => setIsProfileModalOpen(true)}
        onOpenPricing={() => setIsPricingModalOpen(true)}
        onOpenSupport={() => setIsSupportOpen(true)}
        assets={assets}
      />

      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateTab={navigateToTab}
      />

      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdateUser={setUser}
      />

      <AIAssistantDrawer
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        selectedAsset={selectedAsset}
        userProfile={user}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onUpdateUser={(updated) => {
          setUser(updated);
          localStorage.setItem('tradeos_user_profile', JSON.stringify(updated));
        }}
        trades={trades}
        onImportTrades={(imported) => {
          setTrades(imported);
          localStorage.setItem('tradeos_trades', JSON.stringify(imported));
        }}
      />

      <ShareReferralModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        userName={user.name}
      />

      <InstallMobileAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onTriggerNativeInstall={handleNativeInstall}
        hasNativePrompt={!!deferredInstallPrompt}
      />

      <EducationalDisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />

      <NewTradeModal
        isOpen={isNewTradeOpen}
        onClose={() => setIsNewTradeOpen(false)}
        onSaveTrade={handleSaveNewTrade}
        initialDraft={tradeDraft}
      />

      <TradeDetailModal
        trade={selectedTradeDetail}
        isOpen={!!selectedTradeDetail}
        onClose={() => setSelectedTradeDetail(null)}
        onDeleteTrade={handleDeleteTrade}
        onAnalyzeWithAI={handleAnalyzeTradeWithAI}
        onCloseTradeStatus={handleCloseTradeStatus}
        onEditTrade={(t) => {
          setTradeToEditGlobal(t);
          setIsGlobalEditModalOpen(true);
        }}
        onOpenStoryCard={(t) => {
          setStoryTrade(t);
          setIsStoryCardOpen(true);
        }}
      />

      <TradeStoryCardModal
        isOpen={isStoryCardOpen}
        onClose={() => setIsStoryCardOpen(false)}
        trade={storyTrade}
        user={user}
        disciplineScore={disciplineScore}
      />

      <TiltProtectionModal
        isOpen={isTiltShieldOpen}
        onClose={() => setIsTiltShieldOpen(false)}
      />

      <EditTradeModal
        isOpen={isGlobalEditModalOpen}
        trade={tradeToEditGlobal}
        onClose={() => {
          setIsGlobalEditModalOpen(false);
          setTradeToEditGlobal(null);
        }}
        onSave={handleUpdateTrade}
      />

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        currentPlan={user.experienceLevel.includes('Pro') ? 'PRO' : 'FREE'}
        onPlanChange={(newPlan) => {
          setUser((prev) => ({
            ...prev,
            experienceLevel: newPlan === 'PRO' || newPlan === 'INSTITUTIONAL' ? 'Pro / Institutional' : 'Intermediate',
          }));
        }}
        onOpenSupport={() => {
          setIsPricingModalOpen(false);
          setIsSupportOpen(true);
        }}
        onOpenPolicies={() => {
          setIsPricingModalOpen(false);
          setIsPoliciesOpen(true);
        }}
      />

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        userEmail={user.email}
        userName={user.name}
        onOpenPolicies={() => {
          setIsSupportOpen(false);
          setIsPoliciesOpen(true);
        }}
      />

      <LegalPoliciesModal
        isOpen={isPoliciesOpen}
        onClose={() => setIsPoliciesOpen(false)}
        onOpenSupport={() => {
          setIsPoliciesOpen(false);
          setIsSupportOpen(true);
        }}
      />

      <BrokerSyncModal
        isOpen={isBrokerSyncOpen}
        onClose={() => setIsBrokerSyncOpen(false)}
        onImportTrades={(importedTrades) => {
          setTrades((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const newTrades = importedTrades.filter((t) => !existingIds.has(t.id));
            return [...newTrades, ...prev];
          });
        }}
      />

      <TelegramAlertsModal
        isOpen={isTelegramAlertsOpen}
        onClose={() => setIsTelegramAlertsOpen(false)}
        assets={assets}
        onOpenMacroAlerts={() => {
          setIsTelegramAlertsOpen(false);
          setIsMacroAlertsOpen(true);
        }}
      />

      <MacroAlertsModal
        isOpen={isMacroAlertsOpen}
        onClose={() => setIsMacroAlertsOpen(false)}
        events={economicEvents}
        onOpenTelegramSettings={() => {
          setIsMacroAlertsOpen(false);
          setIsTelegramAlertsOpen(true);
        }}
      />

      <EmergencyKillSwitchModal
        isOpen={isKillSwitchModalOpen}
        onClose={() => setIsKillSwitchModalOpen(false)}
        openTrades={trades}
        onFlattenAllTrades={handleFlattenAllTrades}
      />
    </div>
  );
}
