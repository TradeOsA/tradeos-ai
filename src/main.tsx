import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { MerchantPaymentProvider } from './context/MerchantPaymentContext';
import { TiltProtectionProvider } from './context/TiltProtectionContext';
import './index.css';

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
