import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Smartphone,
  Cpu,
  BrainCircuit,
  Zap,
  Lock,
  Compass,
  TrendingUp,
  MapPin,
  GraduationCap,
  Flame,
  CheckCircle2,
  HeartHandshake,
  ArrowRight,
  Sparkles,
  Quote,
  ShieldCheck,
  Activity,
  Award,
  Layers,
  Terminal,
  Clock,
  IndianRupee,
  Share2,
  ChevronRight,
  ExternalLink,
  MessageSquareQuote,
  Radio,
  FileCheck,
  AlertTriangle,
  Camera,
  Upload,
  RotateCcw,
  Maximize2,
  X,
  Edit3,
  Key,
  Unlock,
  Save,
  Check,
  Send,
  Globe,
} from 'lucide-react';
import { APP_CONFIG } from '../../config/branding';
import { UserProfile, FounderProfile } from '../../types';

interface AboutFoundersViewProps {
  user?: UserProfile;
  onNavigateTab?: (tab: string) => void;
  onBack?: () => void;
  onOpenPricing?: () => void;
}

const DEFAULT_FOUNDER_DATA: FounderProfile = {
  name: 'Ajay',
  role: 'Founder & Chief Product Architect',
  location: 'Faridabad, Haryana, India',
  hometown: 'Pauri Garhwal, Uttarakhand',
  experienceYears: '4+ Years',
  education: '10th Pass (Self-Taught Architect)',
  lossesLearned: '~₹1.0 - 1.2 Lakhs',
  builtWith: '1 Smartphone + AI',
  bio: "Ajay's journey didn't start in an elite corporate boardroom or with a computer science degree. As a 10th Pass self-driven innovator from the hills of Pauri Garhwal, he entered the financial markets with relentless curiosity and raw passion.\n\nOver 4 intense years of real-money market trading across crypto and equities, he endured what almost every retail trader goes through: the brutal psychological traps of over-leveraging, revenge trading, and emotional greed—resulting in ~₹1-1.2 Lakhs in personal capital losses.\n\nInstead of quitting, Ajay treated those losses as an irreplaceable education. He realized that retail traders don't fail because they lack complex chart indicators; they fail because of unguarded emotions. Determined to fix this root problem, he leveraged modern AI tools to build TradeosAi—an intelligent software sentinel engineered to automate risk discipline and prevent emotional bankruptcy.",
  quote: "Success in the market isn't about expensive setups, big offices, or fancy degrees. It's about raw experience, discipline, a smartphone, and the drive to protect traders from emotional losses.",
  photoUrl: '/image_5.png',
  badge: 'Verified Founder — TradeosAi',
  telegram: 'https://t.me/TradeOSAI',
  twitter: 'https://x.com/TradeOSAI',
  email: 'tradeos.crypto@gmail.com',
};

// Helper to compress images client-side using canvas (converts 10MB camera photo to ~60KB JPEG)
async function compressImageToDataUrl(file: File, maxWidth = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image into DOM'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Safe LocalStorage setter with QuotaExceeded recovery
function safeLocalStorageSet(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (err: any) {
    console.warn(`LocalStorage quota warning for key "${key}":`, err);
    try {
      // If quota exceeded, remove any massive orphaned keys and retry
      if (key === 'tradeosai_founder_profile') {
        const parsed = JSON.parse(value);
        // Do not embed huge base64 in profile if quota is tight
        if (parsed.photoUrl && parsed.photoUrl.startsWith('data:image')) {
          parsed.photoUrl = '/image_5.png';
          localStorage.setItem(key, JSON.stringify(parsed));
        }
      }
    } catch (inner) {
      console.error('Storage recovery failed:', inner);
    }
  }
}

export const AboutFoundersView: React.FC<AboutFoundersViewProps> = ({
  user,
  onNavigateTab,
  onBack,
  onOpenPricing,
}) => {
  const [activePillar, setActivePillar] = useState<number>(0);
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // 1. Initial Founder Profile state from localStorage or Default
  const [founderProfile, setFounderProfile] = useState<FounderProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedProfile = localStorage.getItem('tradeosai_founder_profile');
        const savedPhoto = localStorage.getItem('tradeosai_founder_photo');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (savedPhoto) parsed.photoUrl = savedPhoto;
          return parsed;
        }
        if (savedPhoto) {
          return { ...DEFAULT_FOUNDER_DATA, photoUrl: savedPhoto };
        }
      } catch (e) {
        console.error('Error reading saved founder profile:', e);
      }
    }
    return DEFAULT_FOUNDER_DATA;
  });

  // Draft profile state for editing modal
  const [draftProfile, setDraftProfile] = useState<FounderProfile>(founderProfile);

  // 2. Admin Authentication State Check
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tradeosai_admin_unlocked');
      if (stored === 'true') return true;
      // Auto-unlock if user email matches founder email
      if (user?.email && user.email.toLowerCase() === 'tradeos.crypto@gmail.com') {
        return true;
      }
    }
    return false;
  });

  // Sync Admin status if user prop updates
  useEffect(() => {
    if (user?.email && user.email.toLowerCase() === 'tradeos.crypto@gmail.com') {
      setIsAdminMode(true);
      safeLocalStorageSet('tradeosai_admin_unlocked', 'true');
    }
  }, [user]);

  // 3. Sync from backend API on mount
  useEffect(() => {
    async function loadServerProfile() {
      try {
        const res = await fetch('/api/founder/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.profile) {
            // Check if local has custom photo
            const localPhoto = localStorage.getItem('tradeosai_founder_photo');
            const localProfileStr = localStorage.getItem('tradeosai_founder_profile');
            
            if (!localProfileStr && !localPhoto) {
              setFounderProfile(data.profile);
              setDraftProfile(data.profile);
              safeLocalStorageSet('tradeosai_founder_profile', JSON.stringify(data.profile));
              if (data.profile.photoUrl) {
                safeLocalStorageSet('tradeosai_founder_photo', data.profile.photoUrl);
              }
            } else if (data.profile.photoUrl && !localPhoto) {
              // If server has photoUrl and local doesn't, sync it
              setFounderProfile(data.profile);
              setDraftProfile(data.profile);
            }
          }
        }
      } catch (e) {
        console.warn('Could not sync founder profile from server:', e);
      }
    }
    loadServerProfile();
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo Upload directly with client-side compression and backend persistence
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingPhoto(true);
      try {
        // 1. Compress image to max 800px width/height and quality 0.82 (~60KB)
        const compressedBase64 = await compressImageToDataUrl(file, 800, 0.82);

        let finalPhotoUrl = compressedBase64;

        // 2. Persist to server disk via /api/founder/photo
        try {
          const res = await fetch('/api/founder/photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: compressedBase64 }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.photoUrl) {
              finalPhotoUrl = data.photoUrl;
            }
          }
        } catch (serverErr) {
          console.warn('Server photo save fallback to local compressed data URL:', serverErr);
        }

        // 3. Update profile state
        const updated = { ...founderProfile, photoUrl: finalPhotoUrl };
        setFounderProfile(updated);
        setDraftProfile(updated);

        // 4. Safe Local Storage save without blowing quota
        safeLocalStorageSet('tradeosai_founder_photo', finalPhotoUrl);
        safeLocalStorageSet('tradeosai_founder_profile', JSON.stringify(updated));

        triggerSaveToast();
      } catch (err) {
        console.error('Failed to process image:', err);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleResetToDefault = async () => {
    if (window.confirm('Reset founder details & photo to initial defaults?')) {
      localStorage.removeItem('tradeosai_founder_photo');
      localStorage.removeItem('tradeosai_founder_profile');
      setFounderProfile(DEFAULT_FOUNDER_DATA);
      setDraftProfile(DEFAULT_FOUNDER_DATA);

      try {
        await fetch('/api/founder/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: DEFAULT_FOUNDER_DATA }),
        });
      } catch (err) {
        console.error('Server sync error:', err);
      }

      triggerSaveToast();
    }
  };

  const handleSaveProfileModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFounderProfile(draftProfile);
    safeLocalStorageSet('tradeosai_founder_profile', JSON.stringify(draftProfile));
    if (draftProfile.photoUrl) {
      safeLocalStorageSet('tradeosai_founder_photo', draftProfile.photoUrl);
    }

    try {
      await fetch('/api/founder/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: draftProfile }),
      });
    } catch (err) {
      console.error('Failed to sync with server:', err);
    }

    setIsEditModalOpen(false);
    triggerSaveToast();
  };

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = adminPinInput.trim().toLowerCase();
    // Authorized passkeys
    if (pin === 'tradeos' || pin === 'tradeos2026' || pin === '7788' || pin === 'founder' || pin === 'admin') {
      setIsAdminMode(true);
      safeLocalStorageSet('tradeosai_admin_unlocked', 'true');
      setIsAdminAuthModalOpen(false);
      setAdminPinInput('');
      setAdminAuthError('');
      triggerSaveToast();
    } else {
      setAdminAuthError('Invalid Admin Passkey. Please enter the founder security code.');
    }
  };

  const handleExitAdminMode = () => {
    setIsAdminMode(false);
    localStorage.removeItem('tradeosai_admin_unlocked');
  };

  const triggerSaveToast = () => {
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 3000);
  };

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(`"${founderProfile.quote}" — ${founderProfile.name}, Founder of TradeosAi`);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  const pillars = [
    {
      id: 'risk-engine',
      icon: ShieldAlert,
      tag: 'Core Defense',
      title: 'Live Automated Risk Engine',
      summary: 'Mathematical stop-loss safeguards, position-sizing calculators, and instant drawdown lockouts.',
      features: [
        'Dynamic 1% - 2% risk capital guardrails based on account equity',
        'Multi-timeframe drawdown locks and daily loss thresholds',
        'One-click Emergency Kill Switch to close open exposures instantly',
        'Auto Risk-to-Reward (R:R) validation before trade execution',
      ],
      badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      accentGlow: 'from-emerald-500/20 to-teal-500/5',
    },
    {
      id: 'ai-journal',
      icon: BrainCircuit,
      tag: 'Psychology Guard',
      title: 'AI Psychological Journaling',
      summary: 'Deep Gemini-powered post-mortem analysis of every entry, exit, emotional trigger, and revenge trade.',
      features: [
        'Auto tilt-score calculation and cognitive bias recognition',
        'Post-trade emotion tagging (FOMO, Greed, Fear, Euphoria, Revenge)',
        'Personalized AI Trader Coach offering actionable rules after losses',
        'Weekly discipline scorecard and psychological habit tracking',
      ],
      badgeColor: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
      accentGlow: 'from-indigo-500/20 to-purple-500/5',
    },
    {
      id: 'websockets',
      icon: Zap,
      tag: 'Speed & Telemetry',
      title: 'Low-Latency WebSockets',
      summary: 'Sub-millisecond real-time market data across Indian equities, F&O indices, and global crypto feeds.',
      features: [
        'Direct streaming price tickers for NIFTY, BANKNIFTY, BTC, ETH, and SOL',
        'Instantaneous volatility alerts and breakout radar scanning',
        'Zero-polling websocket architecture ensuring real-time order monitoring',
        'Synchronized cross-device state updates with instant alerts',
      ],
      badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      accentGlow: 'from-amber-500/20 to-orange-500/5',
    },
    {
      id: 'security',
      icon: Lock,
      tag: 'Data Sovereignty',
      title: 'Enterprise-Grade Security',
      summary: 'Bank-grade AES-256 client-side encryption and a strict zero-credential storage architecture.',
      features: [
        'Client-side encrypted broker API keys stored exclusively on your device',
        'No broker funds access—strictly read/execute permissions with your authorization',
        'TLS 1.3 encrypted data transmission for all telemetry and state',
        'Granular session controls and automated local cache purge options',
      ],
      badgeColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
      accentGlow: 'from-cyan-500/20 to-blue-500/5',
    },
  ];

  const milestones = [
    {
      year: '2022',
      title: 'The Harsh Reality of Markets',
      description:
        'Started trading real capital with zero mentor guidance. Faced the brutal psychological pressure of intraday volatility, emotional revenge trades, and experienced devastating cumulative losses of ~₹1-1.2 Lakhs.',
      badge: 'The Crucible',
    },
    {
      year: '2023 - 2024',
      title: '4 Years in the Trenches & The Epiphany',
      description:
        'Realized that 95% of trading failures are not caused by bad charts, but by lack of emotional discipline, uncontrolled risk, and revenge sizing. Decided that every trader needs an automated guardian.',
      badge: 'The Turning Point',
    },
    {
      year: '2025',
      title: 'Built on a Smartphone with AI',
      description:
        'Without a high-end multi-monitor PC or an enterprise office, Ajay began architecting TradeosAi entirely using a single smartphone, mobile developer environments, and AI generative reasoning.',
      badge: 'Zero Excuses Engineering',
    },
    {
      year: '2026',
      title: 'The Launch of TradeosAi',
      description:
        'TradeosAi goes live as an all-in-one terminal: institutional risk calculations, AI psychological journaling, breakout radar, and automated tilt locks designed for retail traders across India and the globe.',
      badge: 'Mission Live',
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 pb-16 px-3 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {saveSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-500 text-slate-950 rounded-2xl shadow-2xl font-bold text-xs sm:text-sm border border-emerald-300"
          >
            <CheckCircle2 className="w-5 h-5 text-slate-950" />
            <span>Founder profile & photograph updated and saved permanently!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Breadcrumb / Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wider uppercase mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span>The TradeosAi Story & Leadership</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Built by a Trader. Engineered for Survival.
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-3xl leading-relaxed">
            How 4 years of relentless market battles, ₹1.2 Lakhs in painful lessons, and a single smartphone built
            India's most disciplined AI Risk Sentinel.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Admin Mode Toggle Indicator */}
          {isAdminMode ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-emerald-400">Founder Mode</span>
              <button
                type="button"
                onClick={handleExitAdminMode}
                title="Lock Admin Mode"
                className="ml-1 text-slate-400 hover:text-white text-[11px] underline cursor-pointer"
              >
                Lock
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdminAuthModalOpen(true)}
              className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/10 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer"
              title="Admin / Founder Login"
            >
              <Key className="w-4 h-4" />
            </button>
          )}

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Launch Terminal</span>
            </button>
          )}
          {onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-black transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Get Pro Access</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ADMIN CONTROLS RIBBON (Visible ONLY to Admin) */}
      {isAdminMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-indigo-950/60 border border-emerald-500/30 p-4 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Unlock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Founder Management Controls Active</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                  Admin Exclusive
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                You can edit founder narrative, upload high-res photos, and customize bio details with instant persistence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-emerald-500/20"
            >
              <Camera className={`w-3.5 h-3.5 ${isUploadingPhoto ? 'animate-spin' : ''}`} />
              <span>{isUploadingPhoto ? 'Saving Photo...' : 'Update Photo'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDraftProfile(founderProfile);
                setIsEditModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Edit Details & Bio</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              title="Reset to initial default template"
              className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* SECTION 1: FOUNDER SHOWCASE CARD */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#111827] to-[#0A0E17] border border-white/10 p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden">
        {/* Subtle Background Glow Accent */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Founder Photo & Quick Badges */}
          <div className="lg:col-span-5 flex flex-col items-center text-center">
            {/* Hidden File Input for Custom Upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="relative group">
              {/* Outer Glowing Ring */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-500" />

              {/* Main Image Container */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden bg-slate-900 border-2 border-white/20 shadow-2xl">
                <img
                  src={founderProfile.photoUrl}
                  alt={`${founderProfile.name} - ${founderProfile.role} of TradeosAi`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.endsWith('/image_5.png') && !target.src.endsWith('/ajay_founder.png')) {
                      target.src = '/image_5.png';
                    }
                  }}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                  onClick={() => setIsPhotoZoomed(true)}
                />

                {/* Top Quick Actions */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsPhotoZoomed(true)}
                    title="Zoom Photo"
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white transition-all cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  
                  {/* Upload button ONLY shown to Admin */}
                  {isAdminMode && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload / Replace Actual Photo"
                      className="p-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 backdrop-blur-md border border-emerald-400/40 text-white transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold px-2"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Update</span>
                    </button>
                  )}
                </div>

                {/* Verified Founder Badge Overlay */}
                <div className="absolute bottom-3 inset-x-3 bg-[#0A0E17]/90 backdrop-blur-md border border-white/15 py-1.5 px-3 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{founderProfile.badge || 'Verified Founder'}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">TradeosAi</span>
                </div>
              </div>
            </div>

            {/* Quick Fast Facts Bar below Photo */}
            <div className="grid grid-cols-2 gap-2.5 w-full mt-6">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-left">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Education</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white">{founderProfile.education}</div>
                <div className="text-[10px] text-slate-500">Self-taught Architect</div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-left">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Experience</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white">{founderProfile.experienceYears}</div>
                <div className="text-[10px] text-slate-500">Real Market Trading</div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-left">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
                  <IndianRupee className="w-3.5 h-3.5 text-red-400" />
                  <span>Losses Survived</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-rose-400">{founderProfile.lossesLearned}</div>
                <div className="text-[10px] text-slate-500">The Price of Mastery</div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-left">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Built With</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-emerald-400">{founderProfile.builtWith}</div>
                <div className="text-[10px] text-slate-500">Zero High-End Setup</div>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative, Roots & Personal Quote */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>The Visionary Behind TradeosAi</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {founderProfile.name}
                </h2>
                <p className="text-base sm:text-lg font-semibold text-emerald-400 mt-1">
                  {founderProfile.role}
                </p>

                {/* Origin Geo Tag */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 mt-2">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    Hails from <strong className="text-slate-200">{founderProfile.hometown}</strong> • Currently residing in{' '}
                    <strong className="text-slate-200">{founderProfile.location}</strong>
                  </span>
                </div>
              </div>

              {isAdminMode && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftProfile(founderProfile);
                    setIsEditModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Edit Bio</span>
                </button>
              )}
            </div>

            {/* Authentic Bio */}
            <div className="space-y-3.5 text-sm sm:text-base text-slate-300 leading-relaxed whitespace-pre-line">
              {founderProfile.bio}
            </div>

            {/* Founder's Featured Quote Card */}
            <div className="relative rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-indigo-950/40 border border-emerald-500/20 p-5 sm:p-6">
              <Quote className="w-8 h-8 text-emerald-400/30 absolute top-4 right-4" />
              <p className="text-sm sm:text-base text-slate-200 italic font-medium leading-relaxed pr-6">
                "{founderProfile.quote}"
              </p>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5">
                <div className="text-xs text-slate-400">
                  <span className="font-bold text-white">{founderProfile.name}</span> • Founder, TradeosAi
                </div>
                <div className="flex items-center gap-3">
                  {founderProfile.email && (
                    <a
                      href={`mailto:${founderProfile.email}`}
                      className="text-xs text-slate-400 hover:text-emerald-400 font-medium transition-colors"
                    >
                      {founderProfile.email}
                    </a>
                  )}
                  <button
                    onClick={handleCopyQuote}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiedQuote ? 'Quote Copied!' : 'Share Quote'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: THE ORIGIN STORY & VISION */}
      <div className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>The Genesis of an AI Risk Sentinel</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            How a Single Smartphone & AI Built TradeosAi
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            TradeosAi was not born out of venture capital funding or 8-screen trading desks. It was forged on a single
            handheld smartphone by a real trader who lived through the emotional pain of the market.
          </p>
        </div>

        {/* Narrative Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-[#0F172A]/70 border border-white/10 p-6 space-y-4 hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">The Smartphone Revolution</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every single line of TradeosAi's product design, workflows, risk logic, and AI prompt engineering was
              conceived and tested by {founderProfile.name} on a single smartphone. Proof that dedication and resourcefulness transcend
              expensive setups.
            </p>
          </div>

          <div className="rounded-2xl bg-[#0F172A]/70 border border-white/10 p-6 space-y-4 hover:border-indigo-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">AI as the Equalizer</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              By pairing deep domain intuition from 4 years of live market losses with Google's state-of-the-art Gemini AI,
              {founderProfile.name} constructed an automated cognitive review engine that acts as an unforgiving, 24/7 personal risk manager.
            </p>
          </div>

          <div className="rounded-2xl bg-[#0F172A]/70 border border-white/10 p-6 space-y-4 hover:border-amber-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">The Trader's Empathy</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              TradeosAi is designed specifically by someone who has felt the heartbreak of a margin call and the panic of
              FOMO. Every feature—from the Tilt Lock to the Auto Sizing Matrix—exists to save your capital.
            </p>
          </div>
        </div>

        {/* Milestone Timeline */}
        <div className="rounded-3xl bg-[#0A0E17] border border-white/10 p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-2 mb-8">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">The Journey Timeline</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {milestones.map((m, idx) => (
              <div key={idx} className="relative p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-emerald-400 font-mono">{m.year}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                    {m.badge}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{m.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: CORE SAAS VALUE PILLARS */}
      <div className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture & Security</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Institutional Power, Built for the Retail Trader
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Engineered with high-speed telemetry, mathematical edge, and zero-compromise security.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Pillar Selector Buttons */}
          <div className="lg:col-span-4 space-y-3">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              const isSelected = activePillar === idx;
              return (
                <button
                  key={pillar.id}
                  onClick={() => setActivePillar(idx)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-4 cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'bg-gradient-to-r from-white/[0.08] to-white/[0.02] border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isSelected ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        {pillar.tag}
                      </span>
                      {isSelected && <ChevronRight className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">{pillar.title}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Pillar Showcase Card */}
          <div className="lg:col-span-8">
            <div className="rounded-3xl bg-[#0D1322] border border-white/10 p-6 sm:p-8 lg:p-10 relative overflow-hidden shadow-xl">
              <div
                className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-b ${pillars[activePillar].accentGlow} rounded-full blur-3xl pointer-events-none`}
              />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${pillars[activePillar].badgeColor}`}
                  >
                    {pillars[activePillar].tag}
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{pillars[activePillar].title}</h3>
                  <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
                    {pillars[activePillar].summary}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Core Technical Capabilities
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pillars[activePillar].features.map((feat, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-200"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: CALL TO ACTION FOOTER */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-[#0B132B] to-indigo-950 border border-emerald-500/30 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Protect Your Capital Today</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Stop Giving Hard-Earned Money to Emotional Mistakes
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Join thousands of disciplined traders who rely on TradeosAi's automated risk calculations, real-time breakout
            scanners, and psychological guardrails.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('paper-trading')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Activity className="w-4 h-4" />
                <span>Start Practice Trading</span>
              </button>
            )}

            {onOpenPricing && (
              <button
                onClick={onOpenPricing}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>View License Tiers</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PHOTO ZOOM MODAL */}
      <AnimatePresence>
        {isPhotoZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsPhotoZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-lg w-full bg-[#0D1322] border border-white/20 rounded-3xl overflow-hidden shadow-2xl p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-slate-950">
                <img
                  src={founderProfile.photoUrl}
                  alt={`${founderProfile.name} - Founder of TradeosAi`}
                  className="w-full h-full object-cover object-center"
                />
                <button
                  type="button"
                  onClick={() => setIsPhotoZoomed(false)}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-black text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 inset-x-3 bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold text-sm">{founderProfile.name}</div>
                    <div className="text-emerald-400 text-xs font-semibold">{founderProfile.role}</div>
                  </div>
                  {isAdminMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsPhotoZoomed(false);
                        fileInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload New</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADMIN AUTH PASSKEY MODAL */}
      <AnimatePresence>
        {isAdminAuthModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsAdminAuthModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-md w-full bg-[#0D1322] border border-white/20 rounded-3xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Founder & Admin Login</h3>
                    <p className="text-xs text-slate-400">Unlock editing controls for the About page</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdminAuthModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdminAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Enter Admin Security Passkey
                  </label>
                  <input
                    type="password"
                    value={adminPinInput}
                    onChange={(e) => {
                      setAdminPinInput(e.target.value);
                      setAdminAuthError('');
                    }}
                    placeholder="Enter passkey (e.g. tradeos / founder)"
                    autoFocus
                    className="w-full bg-[#161F33] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {adminAuthError && (
                    <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{adminAuthError}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdminAuthModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20"
                  >
                    Unlock Controls
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT FOUNDER PROFILE MODAL (Admin Only) */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-2xl w-full bg-[#0D1322] border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Edit Founder Profile Details</h3>
                    <p className="text-xs text-slate-400">
                      Changes persist permanently across sessions in local storage and backend state.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfileModal} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Founder Name</label>
                    <input
                      type="text"
                      value={draftProfile.name}
                      onChange={(e) => setDraftProfile({ ...draftProfile, name: e.target.value })}
                      required
                      className="w-full bg-[#161F33] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Role / Title</label>
                    <input
                      type="text"
                      value={draftProfile.role}
                      onChange={(e) => setDraftProfile({ ...draftProfile, role: e.target.value })}
                      required
                      className="w-full bg-[#161F33] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Hometown / Origin</label>
                    <input
                      type="text"
                      value={draftProfile.hometown}
                      onChange={(e) => setDraftProfile({ ...draftProfile, hometown: e.target.value })}
                      className="w-full bg-[#161F33] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Current Location</label>
                    <input
                      type="text"
                      value={draftProfile.location}
                      onChange={(e) => setDraftProfile({ ...draftProfile, location: e.target.value })}
                      className="w-full bg-[#161F33] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Education</label>
                    <input
                      type="text"
                      value={draftProfile.education}
                      onChange={(e) => setDraftProfile({ ...draftProfile, education: e.target.value })}
                      className="w-full bg-[#161F33] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Experience</label>
                    <input
                      type="text"
                      value={draftProfile.experienceYears}
                      onChange={(e) => setDraftProfile({ ...draftProfile, experienceYears: e.target.value })}
                      className="w-full bg-[#161F33] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Losses Survived</label>
                    <input
                      type="text"
                      value={draftProfile.lossesLearned}
                      onChange={(e) => setDraftProfile({ ...draftProfile, lossesLearned: e.target.value })}
                      className="w-full bg-[#161F33] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Built With</label>
                    <input
                      type="text"
                      value={draftProfile.builtWith}
                      onChange={(e) => setDraftProfile({ ...draftProfile, builtWith: e.target.value })}
                      className="w-full bg-[#161F33] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Founder Narrative & Authentic Bio
                  </label>
                  <textarea
                    rows={6}
                    value={draftProfile.bio}
                    onChange={(e) => setDraftProfile({ ...draftProfile, bio: e.target.value })}
                    required
                    className="w-full bg-[#161F33] border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Founder's Core Quote</label>
                  <textarea
                    rows={2}
                    value={draftProfile.quote}
                    onChange={(e) => setDraftProfile({ ...draftProfile, quote: e.target.value })}
                    required
                    className="w-full bg-[#161F33] border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 italic"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Founder Email</label>
                    <input
                      type="email"
                      value={draftProfile.email || ''}
                      onChange={(e) => setDraftProfile({ ...draftProfile, email: e.target.value })}
                      className="w-full bg-[#161F33] border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Verified Badge Text</label>
                    <input
                      type="text"
                      value={draftProfile.badge || ''}
                      onChange={(e) => setDraftProfile({ ...draftProfile, badge: e.target.value })}
                      className="w-full bg-[#161F33] border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save All Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
