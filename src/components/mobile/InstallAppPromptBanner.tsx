import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Zap, Sparkles } from 'lucide-react';

interface InstallAppPromptBannerProps {
  onOpenInstallModal: () => void;
  onTriggerNativeInstall?: () => void;
  hasNativePrompt?: boolean;
}

export const InstallAppPromptBanner: React.FC<InstallAppPromptBannerProps> = ({
  onOpenInstallModal,
  onTriggerNativeInstall,
  hasNativePrompt = false,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem('tradeos_install_prompt_dismissed');
    if (dismissedAt) {
      const diffDays = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (diffDays < 7) {
        setIsDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('tradeos_install_prompt_dismissed', Date.now().toString());
  };

  if (isDismissed) return null;

  return (
    <div
      id="install-app-mobile-banner"
      className="bg-gradient-to-r from-emerald-950/90 via-[#0B1524]/95 to-indigo-950/90 border-b border-emerald-500/30 text-white px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 shadow-md relative z-40"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm animate-pulse">
          <Smartphone className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-extrabold tracking-tight truncate flex items-center gap-1.5">
              <span>📲 Install TradeosAi App on Phone</span>
            </span>
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black">
              PWA 1-Click
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-300 truncate">
            Experience 2x faster charts, native app feel, and zero browser tab clutter on your home screen.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            if (hasNativePrompt && onTriggerNativeInstall) {
              onTriggerNativeInstall();
            } else {
              onOpenInstallModal();
            }
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer whitespace-nowrap"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Dismiss install banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
