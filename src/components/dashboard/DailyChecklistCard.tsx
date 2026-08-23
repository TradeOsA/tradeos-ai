import React, { useState } from 'react';
import { CheckSquare, CheckCircle2, Circle, ShieldCheck, RefreshCw, Sparkles } from 'lucide-react';
import { defaultChecklistItems } from '../../data/mockData';

interface DailyChecklistCardProps {
  onChecklistChange?: (score: number) => void;
}

export const DailyChecklistCard: React.FC<DailyChecklistCardProps> = ({ onChecklistChange }) => {
  const [items, setItems] = useState(defaultChecklistItems);

  const toggleItem = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setItems(updated);
    const completedCount = updated.filter((i) => i.checked).length;
    const score = Math.round((completedCount / updated.length) * 100);
    if (onChecklistChange) onChecklistChange(score);
  };

  const completedCount = items.filter((i) => i.checked).length;
  const percentage = Math.round((completedCount / items.length) * 100);

  return (
    <div className="rounded-xl p-4 sm:p-5 bg-[#0E131F] border border-[#1C263C] flex flex-col justify-between space-y-3.5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">Execution Protocol</h3>
            <span className="text-[10px] text-slate-400">Institutional discipline rules</span>
          </div>
        </div>

        <span className="text-xs font-bold text-emerald-400 mono-numbers font-mono bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded">
          {completedCount}/{items.length} ({percentage}%)
        </span>
      </div>

      {/* Checklist items */}
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all ${
              item.checked
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-slate-200 shadow-sm'
                : 'bg-[#121827] hover:bg-[#182236] border border-[#1C263C] text-slate-400'
            }`}
          >
            {item.checked ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            )}
            <span
              className={`text-xs leading-relaxed ${
                item.checked ? 'line-through text-slate-500 font-normal' : 'text-slate-200 font-medium'
              }`}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#1C263C]">
        <span>Auto-resets daily at 00:00 UTC</span>
        <button
          onClick={() => {
            const reset = items.map((i) => ({ ...i, checked: false }));
            setItems(reset);
            if (onChecklistChange) onChecklistChange(0);
          }}
          className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Protocol</span>
        </button>
      </div>
    </div>
  );
};
