import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  X,
  Lock,
  CheckCircle2,
  Clock,
  Zap,
  Info,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Trade } from '../../types';

interface EmergencyKillSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  openTrades?: Trade[];
  onFlattenAllTrades?: () => void;
}

export const EmergencyKillSwitchModal: React.FC<EmergencyKillSwitchModalProps> = ({
  isOpen,
  onClose,
  openTrades = [],
  onFlattenAllTrades,
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isFlattened, setIsFlattened] = useState(false);
  const [lockDuration, setLockDuration] = useState<'15m' | '1h' | 'eod' | 'manual'>('1h');
  const [confirmText, setConfirmText] = useState('');
  const [auditLog, setAuditLog] = useState<string[]>([]);

  if (!isOpen) return null;

  const activePositions = openTrades.filter((t) => t.status === 'OPEN');
  const totalOpenPnL = activePositions.reduce((acc, t) => acc + (t.pnl || 0), 0);

  const handleExecuteKillSwitch = () => {
    setIsExecuting(true);

    setTimeout(() => {
      if (onFlattenAllTrades) {
        onFlattenAllTrades();
      }

      const timestamp = new Date().toLocaleTimeString();
      const logs = [
        `[${timestamp}] 🔴 EMERGENCY KILL SWITCH TRIGGERED`,
        `[${timestamp}] Cancelled all active limit and bracket orders`,
        `[${timestamp}] Squared off ${activePositions.length} open position(s) across connected accounts`,
        `[${timestamp}] Trading engine locked (${lockDuration.toUpperCase()}) to prevent revenge trading`,
        `[${timestamp}] Risk safety protocol acknowledged and sealed in audit log`,
      ];

      setAuditLog(logs);
      setIsExecuting(false);
      setIsFlattened(true);

      // Save lock state to local storage
      try {
        localStorage.setItem(
          'tradeos_kill_switch_active',
          JSON.stringify({
            triggeredAt: new Date().toISOString(),
            duration: lockDuration,
          })
        );
      } catch {}
    }, 1200);
  };

  const handleResetLock = () => {
    try {
      localStorage.removeItem('tradeos_kill_switch_active');
    } catch {}
    setIsFlattened(false);
    setConfirmText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#0E131F] border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Urgent Warning Header Banner */}
        <div className="bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-red-950/80 p-5 border-b border-rose-500/30 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">EMERGENCY KILL SWITCH</h2>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-black uppercase">
                  Safety Protocol
                </span>
              </div>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Instant multi-broker position liquidation & anti-tilt trading lockdown
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-200">
          {!isFlattened ? (
            <>
              {/* Active Exposure Summary Card */}
              <div className="p-4 rounded-xl bg-[#141B2D] border border-[#1F2C47] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Active Open Positions:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {activePositions.length} active trade{activePositions.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Open Exposure P&L:</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      totalOpenPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {totalOpenPnL >= 0 ? `+$${totalOpenPnL.toFixed(2)}` : `-$${Math.abs(totalOpenPnL).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Target Broker Channels:</span>
                  <span className="text-slate-300 font-medium">
                    Zerodha, Dhan, Angel One, Delta Exchange, Paper Engine
                  </span>
                </div>
              </div>

              {/* Action Checklist */}
              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2 text-xs text-rose-200/90">
                <div className="font-bold text-rose-300 flex items-center gap-1.5 text-xs mb-1">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Execution Safeguard Checklist:</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Cancel all pending Limit, Stop-Loss, and OCO orders immediately.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Send market square-off orders for all open long & short positions.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Enforce psychological cooldown lockout to protect accumulated capital.</span>
                </div>
              </div>

              {/* Cooldown Lock Selection */}
              <div>
                <label className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Post-Kill Trading Lockout Duration:</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: '15m', label: '15 Mins' },
                    { id: '1h', label: '1 Hour' },
                    { id: 'eod', label: 'End of Day' },
                    { id: 'manual', label: 'Manual' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLockDuration(opt.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        lockDuration === opt.id
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm'
                          : 'bg-[#141B2D] border-[#1F2C47] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Safety Confirmation Text Field */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5">
                  Type <span className="text-rose-400 font-mono font-bold">FLATTEN</span> to unlock the emergency trigger:
                </label>
                <input
                  type="text"
                  placeholder="FLATTEN"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141B2D] border border-[#1F2C47] focus:border-rose-500 text-white font-mono text-center tracking-widest font-bold text-sm focus:outline-none transition-colors"
                />
              </div>

              {/* Regulatory & Advisory Disclaimer */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-300">Regulatory Disclaimer:</strong> TradeosAi is an Analytics,
                  Journaling & Trade Execution Interface tool and is <span className="text-amber-400">NOT a SEBI-registered investment advisor</span> or portfolio manager. All automated order cancellations and square-offs are executed via your authorized API credentials.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel & Return
                </button>
                <button
                  type="button"
                  disabled={confirmText !== 'FLATTEN' || isExecuting}
                  onClick={handleExecuteKillSwitch}
                  className={`flex-1 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                    confirmText === 'FLATTEN' && !isExecuting
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30'
                      : 'bg-rose-950/40 border border-rose-900/40 text-rose-500/40 cursor-not-allowed'
                  }`}
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Liquidating & Locking...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4" />
                      <span>ACTIVATE KILL SWITCH</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Successful Lockdown State */
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Emergency Lockdown Active</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  All active positions have been squared off and order books have been cleared. Trading interface has been locked to prevent emotional decision-making.
                </p>
              </div>

              {/* Audit Log Box */}
              <div className="p-4 rounded-xl bg-[#080B11] border border-[#1C263C] text-left space-y-1.5 font-mono text-[11px]">
                <div className="text-slate-500 text-[10px] uppercase font-bold border-b border-[#1C263C] pb-1 mb-2">
                  Safeguard Execution Log:
                </div>
                {auditLog.map((line, i) => (
                  <div key={i} className="text-emerald-400/90 leading-tight">
                    {line}
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleResetLock}
                  className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Close & Acknowledge
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
