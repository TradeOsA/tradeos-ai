import React, { createContext, useContext, useState, useEffect } from 'react';

import {
  isIndianMarketAsset,
  isIndianMarketSymbol,
  getAssetCurrencySymbol,
  formatAssetPrice,
  AssetIdentifier,
} from '../utils/currencyUtils';

export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'AED';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateAgainstUsd: number; // 1 USD = rate units of target currency
  flag: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateAgainstUsd: 1.0, flag: '🇺🇸' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateAgainstUsd: 87.5, flag: '🇮🇳' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateAgainstUsd: 0.92, flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateAgainstUsd: 0.79, flag: '🇬🇧' },
  AED: { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', rateAgainstUsd: 3.67, flag: '🇦🇪' },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  config: CurrencyConfig;
  setCurrency: (currency: CurrencyCode) => void;
  formatCurrency: (amountInUsd: number, options?: { showPlusSign?: boolean; maximumFractionDigits?: number }) => string;
  formatAssetPrice: (price: number | undefined | null, assetOrSymbol?: string | AssetIdentifier | null, options?: { showPlusSign?: boolean; decimals?: number; fallback?: string }) => string;
  getAssetCurrencySymbol: (assetOrSymbol?: string | AssetIdentifier | null, marketCategory?: string) => string;
  isIndianMarketAsset: (assetOrSymbol?: string | AssetIdentifier | null, marketCategory?: string) => boolean;
  convertFromUsd: (amountInUsd: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'tradeos_currency_preference_v1';

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved in CURRENCIES)) {
        return saved as CurrencyCode;
      }
    } catch (e) {
      console.warn('Failed to load currency preference', e);
    }
    return 'INR';
  });

  const setCurrency = (curr: CurrencyCode) => {
    setCurrencyState(curr);
    try {
      localStorage.setItem(STORAGE_KEY, curr);
    } catch (e) {
      console.warn('Failed to save currency preference', e);
    }
  };

  const config = CURRENCIES[currency];

  const convertFromUsd = (amountInUsd: number): number => {
    return amountInUsd * config.rateAgainstUsd;
  };

  const formatCurrency = (
    amountInUsd: number,
    options?: { showPlusSign?: boolean; maximumFractionDigits?: number }
  ): string => {
    if (isNaN(amountInUsd)) return `${config.symbol}0`;

    const converted = amountInUsd * config.rateAgainstUsd;
    const maxDigits = options?.maximumFractionDigits !== undefined ? options.maximumFractionDigits : Math.abs(converted) >= 1000 ? 0 : 2;
    const formattedNum = converted.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDigits,
    });

    const isPositive = amountInUsd > 0;
    const isNegative = amountInUsd < 0;
    const signPrefix = isPositive && options?.showPlusSign ? '+' : '';

    return `${signPrefix}${config.symbol}${formattedNum}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        config,
        setCurrency,
        formatCurrency,
        formatAssetPrice,
        getAssetCurrencySymbol,
        isIndianMarketAsset,
        convertFromUsd,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export {
  isIndianMarketAsset,
  isIndianMarketSymbol,
  getAssetCurrencySymbol,
  formatAssetPrice,
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
