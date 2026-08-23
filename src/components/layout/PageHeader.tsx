import React from 'react';
import { ArrowLeft, Home, LucideIcon } from 'lucide-react';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'emerald' | 'indigo' | 'amber' | 'cyan' | 'purple' | 'slate';
  icon?: LucideIcon;
  breadcrumbs?: BreadcrumbItem[];
  onBack?: () => void;
  showBackButton?: boolean;
  onHome?: () => void;
  showHomeButton?: boolean;
  onNavigateTab?: (tab: string) => void;
  actionSlot?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  badgeVariant = 'emerald',
  icon: Icon,
  breadcrumbs = [],
  onBack,
  showBackButton = true,
  onHome,
  showHomeButton = true,
  onNavigateTab,
  actionSlot,
  className = '',
}) => {
  const getBadgeStyle = () => {
    switch (badgeVariant) {
      case 'indigo':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      case 'amber':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'cyan':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'purple':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'slate':
        return 'text-slate-300 bg-slate-500/10 border-slate-500/30';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const hasBackAction = !!onBack && showBackButton;
  const hasTopBar = hasBackAction || showHomeButton || breadcrumbs.length > 0;

  return (
    <div
      className={`p-4 sm:p-5 rounded-xl bg-[#0E131F] border border-[#1C263C] flex flex-col gap-3.5 ${className}`}
    >
      {/* Top Bar: Back & Home Actions + Breadcrumb trail (only if needed) */}
      {hasTopBar && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[#1C263C]">
          <div className="flex items-center gap-2">
            {/* Quick Back Button (Only visible on nested/sub pages when onBack is present and showBackButton is true) */}
            {hasBackAction && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all cursor-pointer group shadow-sm"
                title="Go back to previous view"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-emerald-400" />
                <span>Back</span>
              </button>
            )}

            {/* Quick Home Button */}
            {showHomeButton && (
              <button
                onClick={onHome || (() => onNavigateTab && onNavigateTab('dashboard'))}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Return to Live Terminal (Home)"
              >
                <Home className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden xs:inline">Home</span>
              </button>
            )}
          </div>

          {/* Dynamic Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <Breadcrumbs items={breadcrumbs} onNavigateTab={onNavigateTab} />
          )}
        </div>
      )}

      {/* Main Title Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {badge && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded ${getBadgeStyle()}`}
              >
                {badge}
              </span>
            )}
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              TradeosAi Pro Terminal
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {title}
            </h1>
          </div>

          {subtitle && (
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Custom Actions Slot */}
        {actionSlot && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actionSlot}</div>}
      </div>
    </div>
  );
};
