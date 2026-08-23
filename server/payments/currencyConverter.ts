/**
 * TradeOS AI - High-Precision Multi-Currency Payment Converter
 * Accurately converts USD/EUR/GBP/AED prices to INR paise or USD cents for Razorpay & Stripe.
 */

export interface CurrencyRate {
  code: string;
  symbol: string;
  rateAgainstUsd: number; // 1 USD = rate units
}

export const SUPPORTED_CURRENCY_RATES: Record<string, CurrencyRate> = {
  USD: { code: 'USD', symbol: '$', rateAgainstUsd: 1.0 },
  INR: { code: 'INR', symbol: '₹', rateAgainstUsd: 87.5 }, // 1 USD = ~87.50 INR
  EUR: { code: 'EUR', symbol: '€', rateAgainstUsd: 0.92 },
  GBP: { code: 'GBP', symbol: '£', rateAgainstUsd: 0.79 },
  AED: { code: 'AED', symbol: 'AED ', rateAgainstUsd: 3.67 },
};

export const USD_TO_INR_RATE = 87.50;

export interface PaymentCalculationResult {
  sourceAmount: number;
  sourceCurrency: string;
  targetCurrency: 'INR' | 'USD';
  calculatedAmount: number;
  subUnits: number; // paise for INR, cents for USD
  exchangeRateUsed: number;
  displayFormatted: string;
  inrEquivalent: number;
}

/**
 * Calculate payment amount in smallest sub-units (paise/cents) for Razorpay & payment gateways
 */
export function calculateGatewayAmount(
  amount: number,
  currency: string = 'USD',
  forceTargetCurrency?: 'INR' | 'USD'
): PaymentCalculationResult {
  const normalizedCurr = currency.toUpperCase();
  const targetCurrency = forceTargetCurrency || (normalizedCurr === 'INR' ? 'INR' : 'INR'); // Default UPI/Razorpay to INR
  
  let inrEquivalent = 0;
  let calculatedAmount = 0;
  let subUnits = 0;
  let exchangeRateUsed = 1.0;

  if (normalizedCurr === 'INR') {
    inrEquivalent = amount;
    calculatedAmount = amount;
    exchangeRateUsed = 1.0;
    subUnits = Math.round(amount * 100); // 499 INR -> 49900 paise
  } else if (normalizedCurr === 'USD') {
    exchangeRateUsed = USD_TO_INR_RATE;
    inrEquivalent = Math.round(amount * USD_TO_INR_RATE);
    
    if (targetCurrency === 'USD') {
      calculatedAmount = amount;
      subUnits = Math.round(amount * 100); // $19 USD -> 1900 cents
    } else {
      calculatedAmount = inrEquivalent;
      subUnits = Math.round(inrEquivalent * 100); // $19 USD -> 1663 INR -> 166300 paise
    }
  } else {
    // Other currencies (EUR, GBP, AED)
    const rateConfig = SUPPORTED_CURRENCY_RATES[normalizedCurr] || { rateAgainstUsd: 1.0 };
    const amountInUsd = amount / rateConfig.rateAgainstUsd;
    inrEquivalent = Math.round(amountInUsd * USD_TO_INR_RATE);
    exchangeRateUsed = Number((USD_TO_INR_RATE / rateConfig.rateAgainstUsd).toFixed(2));
    
    if (targetCurrency === 'USD') {
      calculatedAmount = Number(amountInUsd.toFixed(2));
      subUnits = Math.round(amountInUsd * 100);
    } else {
      calculatedAmount = inrEquivalent;
      subUnits = Math.round(inrEquivalent * 100);
    }
  }

  const symbol = targetCurrency === 'INR' ? '₹' : '$';
  const displayFormatted = `${symbol}${calculatedAmount.toLocaleString()}`;

  return {
    sourceAmount: amount,
    sourceCurrency: normalizedCurr,
    targetCurrency,
    calculatedAmount,
    subUnits,
    exchangeRateUsed,
    displayFormatted,
    inrEquivalent,
  };
}
