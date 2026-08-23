import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`skeleton-shimmer rounded-xl ${className}`} />;
};

export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <div className="glass-panel rounded-3xl p-5 border border-white/[0.08] space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i === rows - 1 ? 'w-3/4' : 'w-full'}`} />
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] space-y-4 h-[480px] flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-6 w-36" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-16 rounded-xl" />
          <Skeleton className="h-7 w-16 rounded-xl" />
          <Skeleton className="h-7 w-16 rounded-xl" />
        </div>
      </div>
      
      {/* Candlestick / Bar simulation */}
      <div className="flex-1 flex items-end gap-2 pt-8 pb-4">
        {Array.from({ length: 24 }).map((_, i) => {
          const height = 20 + Math.sin(i * 0.5) * 15 + ((i % 5) * 12);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <Skeleton className="w-0.5 h-full opacity-40" />
              <div
                className="w-full skeleton-shimmer rounded-xs"
                style={{ height: `${Math.max(15, height)}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="glass-panel rounded-3xl p-5 border border-white/[0.08] space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-7 w-24 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};
