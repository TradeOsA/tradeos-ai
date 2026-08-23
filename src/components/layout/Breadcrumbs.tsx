import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  tab?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigateTab?: (tab: string) => void;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  onNavigateTab,
  className = '',
}) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-xs text-slate-400 ${className}`}>
      {/* Home Root */}
      <button
        onClick={() => onNavigateTab && onNavigateTab('dashboard')}
        className="flex items-center gap-1 hover:text-emerald-400 text-slate-400 transition-colors p-1 rounded-md hover:bg-white/5 cursor-pointer"
        title="Go to Terminal / Home"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only sm:not-sr-only text-[11px] font-medium">Home</span>
      </button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            {isLast ? (
              <span className="font-bold text-white text-[11px] tracking-tight bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/5">
                {item.label}
              </span>
            ) : (
              <button
                onClick={() => {
                  if (item.onClick) item.onClick();
                  else if (item.tab && onNavigateTab) onNavigateTab(item.tab);
                }}
                className="hover:text-emerald-400 text-slate-400 transition-colors px-1.5 py-0.5 rounded-md hover:bg-white/5 cursor-pointer text-[11px] font-medium"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
