import React, { useState } from 'react';
import {
  Target,
  Flame,
  CheckCircle2,
  Circle,
  Shield,
  Plus,
  Calendar,
  Zap,
  Award,
  BookOpenCheck
} from 'lucide-react';
import { defaultHabits } from '../../data/mockData';
import { TradingHabit } from '../../types';
import { PageHeader } from '../layout/PageHeader';

interface GoalsHabitsViewProps {
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const GoalsHabitsView: React.FC<GoalsHabitsViewProps> = ({ onBack, onNavigateTab }) => {
  const [habits, setHabits] = useState<TradingHabit[]>(defaultHabits);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<'discipline' | 'risk' | 'mindset' | 'study'>('discipline');

  const toggleHabit = (id: string) => {
    setHabits(
      habits.map((h) => {
        if (h.id === id) {
          const nextCompleted = !h.completedToday;
          return {
            ...h,
            completedToday: nextCompleted,
            streakDays: nextCompleted ? h.streakDays + 1 : Math.max(0, h.streakDays - 1),
          };
        }
        return h;
      })
    );
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    const newH: TradingHabit = {
      id: `hb-${Date.now()}`,
      title: newHabitTitle.trim(),
      description: 'Daily execution discipline and routine adherence',
      completedDays: [false, false, false, false, false, false, true],
      streakDays: 1,
      completedToday: true,
      category: newHabitCategory,
    };
    setHabits([...habits, newH]);
    setNewHabitTitle('');
  };

  const totalStreak = habits.reduce((acc, h) => acc + h.streakDays, 0);
  const completedTodayCount = habits.filter((h) => h.completedToday).length;

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto animate-fade-in">
      {/* Universal Page Header with Breadcrumbs */}
      <PageHeader
        title="Goals & Daily Discipline Habits"
        subtitle="Success in trading is a statistical byproduct of consistent execution habits and neurological emotional control. Track your daily trader checklist."
        badge={`${completedTodayCount}/${habits.length} Habits Active`}
        badgeVariant="emerald"
        icon={Target}
        breadcrumbs={[{ label: 'Terminal', tab: 'dashboard' }, { label: 'Habits & Goals', tab: 'goals' }]}
        onBack={onBack}
        onNavigateTab={onNavigateTab}
        actionSlot={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <Flame className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{totalStreak} Cumulative Streak Days</span>
          </div>
        }
      />

      {/* Trader's Discipline Contract Card */}
      <div className="rounded-xl p-5 border border-emerald-500/25 space-y-2.5 bg-[#0E131F] shadow-sm">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <Shield className="w-4 h-4" />
          <span>The Trader&apos;s Non-Negotiable Contract</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          &quot;I accept that each trade has an uncertain outcome. My edge exists over a sample size of 50+ disciplined executions. I will never move my stop loss, never risk more than 1% of my account, and never revenge trade after a loss.&quot;
        </p>
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {habits.map((habit) => (
          <div
            key={habit.id}
            onClick={() => toggleHabit(habit.id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group shadow-sm ${
              habit.completedToday
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-[#0E131F] border-[#1C263C] hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              {habit.completedToday ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-600 shrink-0 group-hover:text-slate-400" />
              )}
              <div className="space-y-0.5">
                <span
                  className={`text-xs font-bold ${
                    habit.completedToday ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {habit.title}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Category: {habit.category}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#121827] border border-[#1C263C] text-amber-400 text-xs font-bold font-mono">
              <Flame className="w-3.5 h-3.5" />
              <span>{habit.streakDays}d</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Habit Form */}
      <div className="rounded-xl p-5 bg-[#0E131F] border border-[#1C263C] space-y-3.5 shadow-sm">
        <h3 className="font-bold text-sm text-white">Add Custom Trading Habit</h3>
        <form onSubmit={handleAddHabit} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            placeholder="e.g. Meditate 5 minutes before opening chart terminal..."
            value={newHabitTitle}
            onChange={(e) => setNewHabitTitle(e.target.value)}
            className="flex-1 bg-[#121827] border border-[#1C263C] rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            required
          />
          <select
            value={newHabitCategory}
            onChange={(e: any) => setNewHabitCategory(e.target.value)}
            className="bg-[#121827] border border-[#1C263C] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="discipline">Discipline</option>
            <option value="risk">Risk Management</option>
            <option value="mindset">Psychology & Mindset</option>
            <option value="study">Market Study</option>
          </select>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
          >
            Add Habit
          </button>
        </form>
      </div>
    </div>
  );
};
