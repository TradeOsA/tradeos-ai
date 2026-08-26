import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { MerchantPaymentProvider } from './context/MerchantPaymentContext';
import { TiltProtectionProvider } from './context/TiltProtectionContext';
import './index.css';

// Safely trap benign third-party external script errors (e.g. cross-origin CDNs, TradingView, Razorpay)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message === 'Script error.' ||
      event.message?.includes('ResizeObserver') ||
      event.message?.includes('TradingView') ||
      !event.filename
    ) {
      // Prevent bubbling up to the uncaught error overlay
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || String(event.reason || '');
    if (
      reason.includes('ResizeObserver') ||
      reason.includes('TradingView') ||
      reason.includes('Script error')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <CurrencyProvider>
          <MerchantPaymentProvider>
            <TiltProtectionProvider>
              <App />
            </TiltProtectionProvider>
          </MerchantPaymentProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);

