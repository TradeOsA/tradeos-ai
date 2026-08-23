import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  Heart,
  Brain,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  Pause,
} from 'lucide-react';
import { useTiltProtection } from '../../context/TiltProtectionContext';

interface TiltProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TiltProtectionModal: React.FC<TiltProtectionModalProps> = ({ isOpen, onClose }) => {
  const { tiltState, unlockWithDisciplineVerification, triggerManualLock } = useTiltProtection();
  const [timeLeftStr, setTimeLeftStr] = useState<string>('15:00');
  const [breathingPhase, setBreathingPhase] = useState<'Inhale (4s)' | 'Hold (7s)' | 'Exhale (8s)'>('Inhale (4s)');
  const [breathingCounter, setBreathingCounter] = useState<number>(4);
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(true);
  const [showOverrideQuiz, setShowOverrideQuiz] = useState<boolean>(false);
  const [quizAnswer1, setQuizAnswer1] = useState<string>('');
  const [quizAnswer2, setQuizAnswer2] = useState<string>('');
  const [quizError, setQuizError] = useState<string>('');

  // Cooldown Countdown Timer
  useEffect(() => {
    if (!tiltState.isLocked || !tiltState.lockEndTime) return;

    const interval = setInterval(() => {
      const diff = new Date(tiltState.lockEndTime!).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeftStr('00:00');
      } else {
        const mins = Math.floor(diff / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeftStr(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tiltState.isLocked, tiltState.lockEndTime]);

  // 4-7-8 Breathing Cycle
  useEffect(() => {
    if (!isBreathingActive) return;

    let timer: NodeJS.Timeout;
    if (breathingPhase === 'Inhale (4s)') {
      timer = setTimeout(() => {
        setBreathingPhase('Hold (7s)');
        setBreathingCounter(7);
      }, 4000);
    } else if (breathingPhase === 'Hold (7s)') {
      timer = setTimeout(() => {
        setBreathingPhase('Exhale (8s)');
        setBreathingCounter(8);
      }, 7000);
    } else {
      timer = setTimeout(() => {
        setBreathingPhase('Inhale (4s)');
        setBreathingCounter(4);
      }, 8000);
    }

    return () => clearTimeout(timer);
  }, [breathingPhase, isBreathingActive]);

  const handleQuizSubmit = () => {
    if (quizAnswer1 === 'rule1' && quizAnswer2 === 'rule2') {
      unlockWithDisciplineVerification();
      setShowOverrideQuiz(false);
      onClose();
    } else {
      setQuizError('Incorrect answers. Capital Suraksha mandate requires 100% adherence to risk rules.');
    }
  };

  if (!isOpen && !tiltState.isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-fade-in">
      <div className="relative w-full max-w-lg flex flex-col rounded-xl bg-[#0E131F] border border-rose-500/40 shadow-2xl overflow-hidden">
        {/* Banner Alert */}
        <div className="px-5 py-3.5 bg-rose-950/40 border-b border-rose-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Capital Suraksha — Tilt Shield Active</span>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                  LOCKOUT
                </span>
              </h2>
              <p className="text-xs text-rose-300/80">
                Automatic psychological cool-down to eliminate revenge-trading.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Minimize / Back to Terminal"
          >
            <span className="sr-only">Close</span>
            <XCircle className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Reason Alert Box */}
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200 leading-relaxed">
              <strong className="block text-rose-300 font-bold mb-0.5">
                {tiltState.reason === 'CONSECUTIVE_LOSSES'
                  ? '3 Consecutive Stop Losses Triggered'
                  : tiltState.reason === 'DAILY_DRAWDOWN_LIMIT'
                  ? 'Daily Account Drawdown Breach (>5%)'
                  : 'Trader Voluntary Mindset Reset'}
              </strong>
              Research proves executing another trade within 15 minutes of consecutive losses carries an <strong>82% higher probability of tilt and further capital loss</strong>.
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="text-center py-3.5 rounded-xl bg-[#121827] border border-[#1C263C] space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Cool-Down Quarantine Remaining
            </span>
            <div className="text-4xl sm:text-5xl font-bold text-rose-400 mono-numbers tracking-tight">
              {timeLeftStr}
            </div>
            <span className="text-xs text-slate-500">Order execution paused to preserve capital</span>
          </div>

          {/* Interactive 4-7-8 Breathing Circle */}
          <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] space-y-3 text-center">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Heart className="w-4 h-4" />
                <span>4-7-8 Diaphragmatic Pulse</span>
              </span>
              <button
                onClick={() => setIsBreathingActive(!isBreathingActive)}
                className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
              >
                {isBreathingActive ? 'Pause' : 'Resume'}
              </button>
            </div>

            <div className="py-4 flex flex-col items-center justify-center">
              <div
                className={`w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-1000 ${
                  breathingPhase.startsWith('Inhale')
                    ? 'scale-110 border-emerald-400 bg-emerald-500/20'
                    : breathingPhase.startsWith('Hold')
                    ? 'scale-105 border-amber-400 bg-amber-500/20'
                    : 'scale-95 border-indigo-400 bg-indigo-500/20'
                }`}
              >
                <span className="text-[11px] font-bold text-white">{breathingPhase.split(' ')[0]}</span>
                <span className="text-xl font-bold text-white mono-numbers mt-0.5">{breathingCounter}s</span>
              </div>
              <p className="text-xs text-slate-400 mt-3 max-w-xs">
                Slow down heart rate and lower cortisol levels before analyzing any new chart setup.
              </p>
            </div>
          </div>

          {/* Early Unlock Discipline Quiz (Friction Mechanism) */}
          {!showOverrideQuiz ? (
            <div className="pt-1 text-center">
              <button
                onClick={() => setShowOverrideQuiz(true)}
                className="text-xs text-slate-400 hover:text-rose-300 underline cursor-pointer transition-colors"
              >
                Need to unlock early? Complete Discipline Confirmation Quiz
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#121827] border border-[#1C263C] space-y-3 text-xs">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Discipline Verification Friction Gate</span>
              </h4>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">1. What is the max risk per trade rule?</label>
                <select
                  value={quizAnswer1}
                  onChange={(e) => setQuizAnswer1(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#0E131F] border border-[#1C263C] text-white focus:outline-none"
                >
                  <option value="">Select correct rule...</option>
                  <option value="rule1">1% to 2% max capital risk per setup with hard Stop Loss</option>
                  <option value="wrong1">Increase size 2x to recover previous losses quickly</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">2. What should you do when a stop loss is hit?</label>
                <select
                  value={quizAnswer2}
                  onChange={(e) => setQuizAnswer2(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#0E131F] border border-[#1C263C] text-white focus:outline-none"
                >
                  <option value="">Select correct rule...</option>
                  <option value="wrong2">Immediately re-enter market with higher leverage</option>
                  <option value="rule2">Accept the loss as a business cost and log emotion in journal</option>
                </select>
              </div>

              {quizError && <div className="text-rose-400 font-bold">{quizError}</div>}

              <button
                onClick={handleQuizSubmit}
                className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-sm"
              >
                Confirm Discipline & Unlock Terminal
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[#1C263C] bg-[#121827] flex items-center justify-between text-xs text-slate-400">
          <span>Capital Suraksha Club Risk Protocol</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Minimize Notice
          </button>
        </div>
      </div>
    </div>
  );
};
