/**
 * TradeOS AI - Razorpay Dynamic Script Loader & iFrame Sandbox Handler
 * Ensures checkout.js is reliably loaded and instantiable across all browser & sandbox environments.
 */

declare global {
  interface Window {
    Razorpay: any;
    __NEXT_PUBLIC_RAZORPAY_KEY_ID?: string;
  }
}

/**
 * Dynamically resolves the Razorpay Key ID prioritizing NEXT_PUBLIC_RAZORPAY_KEY_ID
 */
export function getRazorpayKeyId(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
    return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
    return (import.meta as any).env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_RAZORPAY_KEY_ID) {
    return (import.meta as any).env.VITE_RAZORPAY_KEY_ID;
  }
  if (typeof window !== 'undefined' && window.__NEXT_PUBLIC_RAZORPAY_KEY_ID) {
    return window.__NEXT_PUBLIC_RAZORPAY_KEY_ID;
  }
  return '';
}

export function isEmbeddedInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true; // CORS security error indicates an iframe with different origin
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && typeof window.Razorpay !== 'undefined') {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      if (typeof window.Razorpay !== 'undefined') {
        resolve(true);
        return;
      }
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      setTimeout(() => {
        resolve(typeof window.Razorpay !== 'undefined');
      }, 1500);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.warn('Failed to load Razorpay Checkout script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}
