import React, { createContext, useContext, useState, useEffect } from 'react';
import { TiltLockState } from '../types';

interface TiltProtectionContextType {
  tiltState: TiltLockState;
  triggerManualLock: (minutes: number) => void;
  recordTradeResult: (status: 'WIN' | 'LOSS' | 'BREAKEVEN', pnlPercent: number) => void;
  unlockWithDisciplineVerification: () => boolean;
  clearLock: () => void;
}

const STORAGE_KEY = 'tradeos_tilt_protection_v1';

const defaultTiltState: TiltLockState = {
  isLocked: false,
  consecutiveLosses: 0,
  dailyDrawdownPercent: 0,
  reason: null,
  cooldownMinutesTotal: 15,
};

const TiltProtectionContext = createContext<TiltProtectionContextType | undefined>(undefined);

export const TiltProtectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tiltState, setTiltState] = useState<TiltLockState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TiltLockState;
        // Check if lock expired
        if (parsed.isLocked && parsed.lockEndTime) {
          const now = new Date().getTime();
          const end = new Date(parsed.lockEndTime).getTime();
          if (now >= end) {
            return { ...parsed, isLocked: false, reason: null };
          }
        }
        return parsed;
      }
    } catch {
      // fallback
    }
    return defaultTiltState;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tiltState));
    } catch {
      // ignore
    }
  }, [tiltState]);

  // Periodic check for lock expiry
  useEffect(() => {
    if (!tiltState.isLocked || !tiltState.lockEndTime) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(tiltState.lockEndTime!).getTime();
      if (now >= end) {
        setTiltState((prev) => ({
          ...prev,
          isLocked: false,
          reason: null,
          consecutiveLosses: 0,
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tiltState.isLocked, tiltState.lockEndTime]);

  const triggerManualLock = (minutes: number) => {
    const lockEnd = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    setTiltState((prev) => ({
      ...prev,
      isLocked: true,
      lockEndTime: lockEnd,
      reason: 'MANUAL_LOCKOUT',
      cooldownMinutesTotal: minutes,
    }));
  };

  const recordTradeResult = (status: 'WIN' | 'LOSS' | 'BREAKEVEN', pnlPercent: number) => {
    setTiltState((prev) => {
      let newConsecutiveLosses = prev.consecutiveLosses;
      let newDailyDrawdown = prev.dailyDrawdownPercent;

      if (status === 'LOSS') {
        newConsecutiveLosses += 1;
        newDailyDrawdown += Math.abs(pnlPercent);
      } else if (status === 'WIN') {
        newConsecutiveLosses = 0;
        newDailyDrawdown = Math.max(0, newDailyDrawdown - pnlPercent);
      }

      // Check auto-trigger thresholds: 3 consecutive losses OR >5% daily drawdown
      if (newConsecutiveLosses >= 3) {
        const lockEnd = new Date(Date.now() + 20 * 60 * 1000).toISOString();
        return {
          ...prev,
          isLocked: true,
          lockEndTime: lockEnd,
          consecutiveLosses: newConsecutiveLosses,
          dailyDrawdownPercent: newDailyDrawdown,
          reason: 'CONSECUTIVE_LOSSES',
          cooldownMinutesTotal: 20,
        };
      }

      if (newDailyDrawdown >= 5) {
        const lockEnd = new Date(Date.now() + 45 * 60 * 1000).toISOString();
        return {
          ...prev,
          isLocked: true,
          lockEndTime: lockEnd,
          consecutiveLosses: newConsecutiveLosses,
          dailyDrawdownPercent: newDailyDrawdown,
          reason: 'DAILY_DRAWDOWN_LIMIT',
          cooldownMinutesTotal: 45,
        };
      }

      return {
        ...prev,
        consecutiveLosses: newConsecutiveLosses,
        dailyDrawdownPercent: newDailyDrawdown,
      };
    });
  };

  const unlockWithDisciplineVerification = () => {
    setTiltState((prev) => ({
      ...prev,
      isLocked: false,
      reason: null,
      consecutiveLosses: 0,
      dailyDrawdownPercent: 0,
    }));
    return true;
  };

  const clearLock = () => {
    setTiltState(defaultTiltState);
  };

  return (
    <TiltProtectionContext.Provider
      value={{
        tiltState,
        triggerManualLock,
        recordTradeResult,
        unlockWithDisciplineVerification,
        clearLock,
      }}
    >
      {children}
    </TiltProtectionContext.Provider>
  );
};

export const useTiltProtection = () => {
  const context = useContext(TiltProtectionContext);
  if (!context) {
    throw new Error('useTiltProtection must be used within a TiltProtectionProvider');
  }
  return context;
};
