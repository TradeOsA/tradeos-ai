import React, { useState } from 'react';
import {
  X,
  Smartphone,
  CheckCircle2,
  Share,
  Laptop,
  Zap,
  Shield,
  Layers,
  Sparkles,
  ArrowUpRight,
  HelpCircle,
} from 'lucide-react';

interface InstallMobileAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerNativeInstall?: () => void;
  hasNativePrompt?: boolean;
}

export const InstallMobileAppModal: React.FC<InstallMobileAppModalProps> = ({
  isOpen,
  onClose,
  onTriggerNativeInstall,
  hasNativePrompt = false,
}) => {
  const [deviceTab, setDeviceTab] = useState<'android' | 'ios' | 'desktop'>('android');

  if (!isOpen) return null;

  const handleNativeClick = () => {
    if (hasNativePrompt && onTriggerNativeInstall) {
      onTriggerNativeInstall();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0E1322] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-slate-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                Install TradeosAi on Phone
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                PWA APP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Run TradeosAi as a standalone, full-screen app on your phone home screen.
            </p>
          </div>
        </div>

        {/* Native 1-Tap Trigger if supported */}
        {hasNativePrompt && (
          <button
            onClick={handleNativeClick}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-base transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-3 cursor-pointer"
          >
            <Zap className="w-5 h-5 fill-slate-950" />
            <span>📲 1-Tap Install TradeosAi Now</span>
          </button>
        )}

        {/* Device Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#090D17] border border-white/10">
          <button
            onClick={() => setDeviceTab('android')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              deviceTab === 'android'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🤖 Android (Chrome)</span>
          </button>
          <button
            onClick={() => setDeviceTab('ios')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              deviceTab === 'ios'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📱 iPhone (Safari)</span>
          </button>
          <button
            onClick={() => setDeviceTab('desktop')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              deviceTab === 'desktop'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>💻 PC</span>
          </button>
        </div>

        {/* Android Chrome Step-by-Step Box */}
        {deviceTab === 'android' && (
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#121A2E] to-[#0A0E1A] border border-emerald-500/30 space-y-4">
            <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-sm">
              <span className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
                ⋮
              </span>
              <span>Android Chrome Me Direct Install (2 Steps):</span>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  <p className="font-bold text-white">
                    Chrome me sabse upar right corner me <span className="bg-white/15 px-2 py-0.5 rounded text-emerald-300 font-mono font-black text-sm">⋮</span> (3 dots) par tap karein.
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    (Aapke phone me sabse upar daayein kone me 3 dots dikh rahe hain)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  <p className="font-bold text-white">
                    Menu me <span className="text-emerald-400 underline decoration-emerald-500 font-black">"Install app"</span> ya <span className="text-emerald-400 underline decoration-emerald-500 font-black">"Add to Home screen"</span> par tap karein.
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    TradeosAi ka official App icon turant phone ki home screen par add ho jayega!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Koi file download karne ki zaroorat nahi hai, ye direct official Web App hai.</span>
            </div>
          </div>
        )}

        {/* iPhone Safari Step-by-Step Box */}
        {deviceTab === 'ios' && (
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#121A2E] to-[#0A0E1A] border border-emerald-500/30 space-y-4">
            <div className="flex items-center gap-2 text-sky-300 font-extrabold text-sm">
              <Smartphone className="w-5 h-5 text-sky-400" />
              <span>iPhone Safari Me Install:</span>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-black flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  <p className="font-bold text-white">
                    Safari browser ke niche <Share className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> <strong>Share</strong> button par tap karein.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-black flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  <p className="font-bold text-white">
                    List me se <strong className="text-sky-300">"Add to Home Screen"</strong> select karein aur confirm karein.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Step-by-Step Box */}
        {deviceTab === 'desktop' && (
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2 text-xs">
            <div className="font-extrabold text-white flex items-center gap-2">
              <Laptop className="w-4 h-4 text-emerald-400" />
              <span>Desktop / Laptop Standalone App:</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Chrome ya Edge ke address bar me sabse right me jo <strong>Install icon (💻 / ⊕)</strong> dikhta hai, uspe click karein. TradeosAi separate desktop window me khul jayega.
            </p>
          </div>
        )}

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <Zap className="w-4 h-4 text-emerald-400 mx-auto" />
            <span className="font-bold text-white block">Full Screen</span>
            <span className="text-slate-400 text-[10px]">No URL bar</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <Layers className="w-4 h-4 text-indigo-400 mx-auto" />
            <span className="font-bold text-white block">Fast Speed</span>
            <span className="text-slate-400 text-[10px]">Instant launch</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <Shield className="w-4 h-4 text-teal-400 mx-auto" />
            <span className="font-bold text-white block">Auto-Save</span>
            <span className="text-slate-400 text-[10px]">Local storage</span>
          </div>
        </div>
      </div>
    </div>
  );
};
