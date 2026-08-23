import React, { createContext, useContext, useState, useEffect } from 'react';

export interface MerchantPaymentConfig {
  upiId: string;
  payeeName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  supportEmail: string;
  supportWhatsApp: string;
  razorpayKeyId?: string;
  razorpayPaymentLink?: string;
  isConfigured: boolean;
}

const DEFAULT_CONFIG: MerchantPaymentConfig = {
  upiId: '8587965337@paytm',
  payeeName: 'Ajay Soni',
  bankName: 'Kotak Mahindra Bank',
  accountNumber: '4145392198',
  ifscCode: 'KKBK0000286',
  accountType: 'Savings Account',
  supportEmail: 'capitalsurakshaclub@gmail.com',
  supportWhatsApp: '+91 8587965337',
  razorpayKeyId: '',
  razorpayPaymentLink: '',
  isConfigured: true,
};

interface MerchantPaymentContextType {
  config: MerchantPaymentConfig;
  updateConfig: (newConfig: Partial<MerchantPaymentConfig>) => void;
  resetToDefault: () => void;
}

const MerchantPaymentContext = createContext<MerchantPaymentContextType | undefined>(undefined);

const STORAGE_KEY = 'tradeos_merchant_payout_config_v2';

export const MerchantPaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<MerchantPaymentConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse merchant config from localStorage', e);
    }
    return DEFAULT_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save merchant config', e);
    }
  }, [config]);

  const updateConfig = (newConfig: Partial<MerchantPaymentConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...newConfig,
      isConfigured: true,
    }));
  };

  const resetToDefault = () => {
    setConfig(DEFAULT_CONFIG);
  };

  return (
    <MerchantPaymentContext.Provider value={{ config, updateConfig, resetToDefault }}>
      {children}
    </MerchantPaymentContext.Provider>
  );
};

export const useMerchantPayment = () => {
  const context = useContext(MerchantPaymentContext);
  if (!context) {
    throw new Error('useMerchantPayment must be used within a MerchantPaymentProvider');
  }
  return context;
};
