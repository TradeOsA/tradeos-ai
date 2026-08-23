import React, { useState } from 'react';
import {
  User,
  Shield,
  DollarSign,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  CheckCircle,
  X,
  Sparkles,
  Camera,
  Layers,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
}

const avatarPresets = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [balance, setBalance] = useState(user.accountBalance);
  const [riskPercent, setRiskPercent] = useState(user.defaultRiskPercent);
  const [experience, setExperience] = useState(user.experienceLevel);
  const [soundEnabled, setSoundEnabled] = useState(user.soundEnabled);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name,
      email,
      avatarUrl,
      accountBalance: Number(balance),
      defaultRiskPercent: Number(riskPercent),
      experienceLevel: experience,
      soundEnabled,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-[#0E131F] border border-[#1C263C] rounded-xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1C263C]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <User className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Trader Profile & Settings</h3>
              <p className="text-xs text-slate-400">Account parameters & risk rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">Trader Avatar</label>
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl}
                alt="Selected Avatar"
                className="w-11 h-11 rounded-lg object-cover ring-2 ring-emerald-500/50"
              />
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {avatarPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(preset)}
                    className={`w-8 h-8 rounded-lg overflow-hidden border transition-transform hover:scale-105 cursor-pointer shrink-0 ${
                      avatarUrl === preset
                        ? 'border-emerald-400 ring-2 ring-emerald-400/40'
                        : 'border-[#1C263C] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Account Capital & Risk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Base Capital ($)</label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Default Risk Limit (%)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={riskPercent}
                onChange={(e) => setRiskPercent(Number(e.target.value))}
                className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Trading Tier</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value as any)}
              className="w-full bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="Novice (Risk < 1%)">Novice Trader (Risk &lt; 1%)</option>
              <option value="Intermediate">Intermediate Practitioner</option>
              <option value="Pro Institutional Trader">Pro Institutional Trader</option>
            </select>
          </div>

          {/* Theme & Audio Quick Preferences */}
          <div className="p-3.5 rounded-xl bg-[#121827] border border-[#1C263C] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                <div>
                  <span className="text-xs font-bold text-white block">Theme Mode</span>
                  <span className="text-[10px] text-slate-400">Current: {theme === 'dark' ? 'Midnight Luxury Dark' : 'Clean Studio Light'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1C263C]">
              <div className="flex items-center gap-2">
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                <div>
                  <span className="text-xs font-bold text-white block">Sound Alerts</span>
                  <span className="text-[10px] text-slate-400">Trade execution & discipline chimes</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  soundEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {soundEnabled ? 'Enabled' : 'Muted'}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4 text-slate-950" />
                <span>Profile Updated Successfully!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
