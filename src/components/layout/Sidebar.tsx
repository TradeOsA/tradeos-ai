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
  Headphones,
  Scale,
  Radar,
  Wallet,
  IndianRupee,
  Heart,
  CreditCard,
  Key,
  Sparkles,
  Layers,
  Building2,
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
  onOpenBrokerSync,
  isCollapsed,
  onToggleCollapse,
}) => {
  const groups = [
    {
      title: 'Trading Terminal',
      items: [
        { id: 'dashboard', label: 'Terminal', icon: LayoutDashboard, badge: 'Live', shortcut: '1' },
        { id: 'brokers', label: 'Brokers & APIs', icon: Building2, badge: 'Official', shortcut: 'B' },
        { id: 'option-chain', label: 'Option Chain', icon: Layers, badge: 'F&O', shortcut: 'O' },
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
        { id: 'ai-coach', label: 'Trading Coach', icon: Bot, badge: 'AI', shortcut: '5' },
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
      className={`hidden lg:flex flex-col border-r border-[#1C2433] bg-[#0B0E14] min-h-[calc(100vh-3.5rem)] sticky top-14 select-none shrink-0 transition-all duration-200 ease-in-out justify-between ${
        isCollapsed ? 'w-16 p-2 items-center' : 'w-60 p-3'
      }`}
    >
      {/* Top Header / Logo & Collapse Button */}
      <div className="space-y-4 w-full">
        <div className="flex items-center justify-between px-1">
          {!isCollapsed ? (
            <div
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm ring-1 ring-white/10 group-hover:scale-105 transition-transform shrink-0">
                T
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs tracking-tight text-white">{APP_CONFIG.shortName}</span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1 py-0.2 rounded">
                    TERMINAL
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setActiveTab('dashboard')}
              className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm cursor-pointer mx-auto"
            >
              T
            </div>
          )}

          {/* Sidebar Collapse/Expand Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-md bg-[#101520] hover:bg-[#151C2B] text-slate-400 hover:text-white border border-[#1C2433] transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md bg-[#101520] hover:bg-[#151C2B] text-slate-400 hover:text-white border border-[#1C2433] transition-colors cursor-pointer mx-auto"
            title="Expand sidebar"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Navigation Item Groups */}
        <nav className="space-y-3.5 w-full">
          {groups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-0.5">
              {!isCollapsed && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-2.5 block mb-1">
                  {group.title}
                </span>
              )}
              {isCollapsed && groupIdx > 0 && (
                <div className="w-6 h-px bg-[#1C2433] mx-auto my-1.5" />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <div key={item.id} className="relative group">
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center rounded-md transition-all duration-150 cursor-pointer ${
                          isCollapsed
                            ? 'justify-center p-2'
                            : 'justify-between px-2.5 py-1.5 text-xs font-semibold'
                        } ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm font-bold'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-[#101520]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                          />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!isCollapsed && item.badge && (
                          <span
                            className={`text-[8px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-[#101520] text-slate-400 border border-[#1C2433]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>

                      {/* Tooltip on Collapsed Mode */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 bg-[#101520] border border-[#1C2433] px-2.5 py-1 rounded text-xs text-white shadow-xl z-50 whitespace-nowrap pointer-events-none">
                          <span className="font-semibold">{item.label}</span>
                          {item.badge && (
                            <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1 py-0.2 rounded">
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

      {/* Pro Membership / Utilities at bottom */}
      <div className="space-y-1.5 pt-2.5 border-t border-[#1C2433] w-full">
        {onOpenPricing && (
          <div>
            {!isCollapsed ? (
              <button
                onClick={onOpenPricing}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#101520] hover:bg-[#151C2B] border border-[#1C2433] text-slate-200 hover:text-white transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Plans & Pricing</span>
                </div>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400">
                  PRO
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenPricing}
                className="w-full flex justify-center p-1.5 rounded-md bg-[#101520] hover:bg-[#151C2B] text-slate-300 border border-[#1C2433] transition-colors cursor-pointer"
                title="Plans & Pricing"
              >
                <CreditCard className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Discipline Shield Quick Trigger */}
        {onOpenTiltShield && (
          <div>
            {!isCollapsed ? (
              <button
                onClick={onOpenTiltShield}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Discipline Guard</span>
                </div>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                  SHIELD
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenTiltShield}
                className="w-full flex justify-center p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                title="Discipline Guard"
              >
                <Heart className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Bottom Status Card */}
        {!isCollapsed ? (
          <div className="p-2 rounded-md bg-[#101520] border border-[#1C2433] text-slate-300 text-[10px] space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-emerald-400 font-semibold text-[9px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Live Connected</span>
              </div>
              <span className="font-mono text-slate-500 text-[9px]">12ms</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#1C2433] text-[9px]">
              <button
                onClick={onOpenDisclaimer}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Risk Policy
              </button>
              {onOpenPolicies && (
                <button
                  onClick={onOpenPolicies}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Terms
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenDisclaimer}
            className="w-full flex justify-center p-1.5 rounded-md bg-[#101520] text-slate-400 hover:text-slate-200 border border-[#1C2433] transition-colors cursor-pointer"
            title="Risk Policy"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
};


