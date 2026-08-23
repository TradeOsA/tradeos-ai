/**
 * TradeOS AI - Client Currency & Gateway Subunit Helper
 * Ensures Razorpay orders, UPI QR codes, and UPI deep-links use correct paise/cents and converted INR.
 */

export const USD_TO_INR_ESTIMATE = 87.50;

export interface PriceConversion {
  rawAmount: number;
  currency: string;
  inrAmount: number;
  inrPaise: number;
  usdAmount: number;
  usdCents: number;
  formattedInr: string;
  formattedDisplay: string;
  conversionNote?: string;
}

export function computePaymentAmounts(amount: number, currency: string = 'USD'): PriceConversion {
  const code = currency.toUpperCase();
  let inrAmount = 0;
  let usdAmount = 0;

  if (code === 'INR') {
    inrAmount = Math.round(amount);
    usdAmount = Number((amount / USD_TO_INR_ESTIMATE).toFixed(2));
  } else if (code === 'USD') {
    usdAmount = amount;
    inrAmount = Math.round(amount * USD_TO_INR_ESTIMATE); // e.g. $19 -> ₹1,663, $468 -> ₹40,950
  } else if (code === 'EUR') {
    usdAmount = Number((amount / 0.92).toFixed(2));
    inrAmount = Math.round(usdAmount * USD_TO_INR_ESTIMATE);
  } else if (code === 'GBP') {
    usdAmount = Number((amount / 0.79).toFixed(2));
    inrAmount = Math.round(usdAmount * USD_TO_INR_ESTIMATE);
  } else if (code === 'AED') {
    usdAmount = Number((amount / 3.67).toFixed(2));
    inrAmount = Math.round(usdAmount * USD_TO_INR_ESTIMATE);
  } else {
    usdAmount = amount;
    inrAmount = Math.round(amount * USD_TO_INR_ESTIMATE);
  }

  const inrPaise = inrAmount * 100;
  const usdCents = Math.round(usdAmount * 100);

  const formattedInr = `₹${inrAmount.toLocaleString('en-IN')}`;
  const formattedDisplay = code === 'INR' ? formattedInr : `$${usdAmount.toLocaleString('en-US')}`;

  const conversionNote = code !== 'INR' ? `(Converted: ${formattedInr} at ₹${USD_TO_INR_ESTIMATE}/$)` : undefined;

  return {
    rawAmount: amount,
    currency: code,
    inrAmount,
    inrPaise,
    usdAmount,
    usdCents,
    formattedInr,
    formattedDisplay,
    conversionNote,
  };
}
