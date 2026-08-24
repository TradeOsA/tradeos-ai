import React from 'react';
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
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Headphones,
  Scale,
  Radar,
  Wallet,
  IndianRupee,
  Heart,
  CreditCard,
  Flame,
  Key,
  Sparkles,
} from 'lucide-react';
import { APP_CONFIG } from '../../config/branding';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDisclaimer: () => void;
  onOpenSupport?: () => void;
  onOpenPolicies?: () => void;
  onOpenTiltShield?: () => void;
  onOpenPricing?: () => void;
  onOpenAuth?: () => void;
  onOpenBrokerSync?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenDisclaimer,
  onOpenSupport,
  onOpenPolicies,
  onOpenTiltShield,
  onOpenPricing,
  onOpenAuth,
  onOpenBrokerSync,
  isCollapsed,
  onToggleCollapse,
}) => {
  const groups = [
    {
      title: 'Trading Terminal',
      items: [
        { id: 'dashboard', label: 'Terminal', icon: LayoutDashboard, badge: 'Live', shortcut: '1' },
        { id: 'scanner', label: 'Breakout Radar', icon: Radar, badge: 'Hot', shortcut: 'S' },
        { id: 'paper-trading', label: 'Paper Trading', icon: Wallet, badge: 'Demo', shortcut: 'P' },
        { id: 'risk-center', label: 'Risk Matrix', icon: Calculator, badge: '8 Tools', shortcut: '2' },
        { id: 'tax', label: 'Crypto Tax & TDS', icon: IndianRupee, badge: '30%+1%', shortcut: 'T' },
        { id: 'journal', label: 'Trade Journal', icon: BookOpenCheck, badge: undefined, shortcut: '3' },
      ],
    },
    {
      title: 'AI Intelligence',
      items: [
        { id: 'ai-review', label: 'Chart Auditor', icon: ScanLine, badge: 'Vision', shortcut: '4' },
        { id: 'ai-coach', label: 'Trading Coach', icon: Bot, badge: 'Gemini', shortcut: '5' },
      ],
    },
    {
      title: 'Trader Growth',
      items: [
        { id: 'academy', label: 'Academy', icon: GraduationCap, badge: '5 Modules', shortcut: '6' },
        { id: 'portfolio', label: 'Portfolio', icon: PieChart, badge: undefined, shortcut: '7' },
        { id: 'goals', label: 'Habits & Goals', icon: Target, badge: undefined, shortcut: '8' },
        { id: 'community', label: 'Theses & Ideas', icon: Users, badge: undefined, shortcut: '9' },
      ],
    },
    {
      title: 'System',
      items: [
        { id: 'about', label: 'About & Founder', icon: Sparkles, badge: 'Story', shortcut: 'A' },
        { id: 'settings', label: 'Settings', icon: Settings, badge: undefined, shortcut: '0' },
      ],
    },
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-[#1F2937] bg-[#090D16] min-h-[calc(100vh-4rem)] sticky top-16 select-none shrink-0 transition-all duration-200 ease-in-out justify-between ${
        isCollapsed ? 'w-20 p-3 items-center' : 'w-64 p-4'
      }`}
    >
      {/* Top Header / Logo & Collapse Button */}
      <div className="space-y-5 w-full">
        <div className="flex items-center justify-between px-1">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base tracking-wider ring-1 ring-white/10 group-hover:scale-105 transition-transform shrink-0">
              T
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-white">{APP_CONFIG.shortName}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate">{APP_CONFIG.tagline}</p>
              </div>
            )}
          </div>

          {/* Sidebar Collapse/Expand Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg bg-[#111827] hover:bg-[#161F30] text-slate-400 hover:text-white border border-[#1F2937] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Item Groups */}
        <nav className="space-y-4 w-full">
          {groups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 block mb-1">
                  {group.title}
                </span>
              )}
              {isCollapsed && groupIdx > 0 && (
                <div className="w-8 h-px bg-[#1F2937] mx-auto my-2" />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <div key={item.id} className="relative group">
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center rounded-lg transition-all duration-150 cursor-pointer ${
                          isCollapsed
                            ? 'justify-center p-2.5'
                            : 'justify-between px-3 py-2 text-xs font-semibold'
                        } ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-[#111827] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                          />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!isCollapsed && item.badge && (
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-[#111827] text-slate-400 border border-[#1F2937]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>

                      {/* Tooltip on Collapsed Mode */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-[#111827] border border-[#1F2937] px-3 py-1.5 rounded-md text-xs text-white shadow-xl z-50 whitespace-nowrap pointer-events-none">
                          <span className="font-semibold">{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1 py-0.2 rounded">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Pro Membership / Payment Upgrade Trigger */}
      <div className="space-y-2 pt-3 border-t border-[#1F2937] w-full">
        {/* Broker API Key Setup Button */}
        {onOpenBrokerSync && (
          <div>
            {!isCollapsed ? (
              <button
                onClick={onOpenBrokerSync}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-[#111827] hover:bg-[#161F30] border border-[#1F2937] text-slate-300 hover:text-white transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Key className="w-3.5 h-3.5 text-blue-400" />
                  <span>Broker API Setup</span>
                </div>
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[#0D1320] text-slate-400 border border-[#1F2937]">
                  API Keys
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenBrokerSync}
                className="w-full flex justify-center p-2 rounded-lg bg-[#111827] hover:bg-[#161F30] text-blue-400 border border-[#1F2937] transition-colors cursor-pointer"
                title="Broker & Exchange API Keys"
              >
                <Key className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {onOpenPricing && (
          <div>
            {!isCollapsed ? (
              <button
                onClick={onOpenPricing}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-[#111827] hover:bg-[#161F30] border border-[#1F2937] text-slate-200 hover:text-white transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Plans & Pricing</span>
                </div>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                  Pro
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenPricing}
                className="w-full flex justify-center p-2 rounded-lg bg-[#111827] hover:bg-[#161F30] text-slate-300 border border-[#1F2937] transition-colors cursor-pointer"
                title="Plans & Pricing"
              >
                <CreditCard className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Tilt & Mindset Shield Quick Trigger */}
        {onOpenTiltShield && (
          <div>
            {!isCollapsed ? (
              <button
                onClick={onOpenTiltShield}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Discipline Guard</span>
                </div>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                  Shield
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenTiltShield}
                className="w-full flex justify-center p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                title="Discipline Guard"
              >
                <Heart className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Bottom Status Card */}
        {!isCollapsed ? (
          <div className="p-2.5 rounded-lg bg-[#111827] border border-[#1F2937] text-slate-300 text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Market Feed Active</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500">v3.8</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#1F2937] text-[10px]">
              <button
                onClick={onOpenDisclaimer}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>Risk Policy</span>
              </button>
              {onOpenPolicies && (
                <button
                  onClick={onOpenPolicies}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <Scale className="w-2.5 h-2.5 text-slate-400" />
                  <span>Terms</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenDisclaimer}
            className="w-full flex justify-center p-2 rounded-lg bg-[#111827] text-slate-400 hover:text-slate-200 border border-[#1F2937] transition-colors cursor-pointer"
            title="Risk Policy"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

