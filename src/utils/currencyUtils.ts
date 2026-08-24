/**
 * Currency Formatting & Asset Market Detector Utility for TradeOS AI
 * Formats Indian Market symbols/indices (Nifty, Bank Nifty, Sensex, NSE/BSE stocks, F&O) with ₹ (INR)
 * and global/crypto assets with $ (or selected user currency preference).
 */

export interface AssetIdentifier {
  symbol?: string;
  category?: string;
  name?: string;
  market?: string;
}

/**
 * Checks if a given symbol string belongs to Indian markets (NSE / BSE / NIFTY / SENSEX / etc.)
 */
export function isIndianMarketSymbol(symbolStr?: string): boolean {
  if (!symbolStr) return false;
  const sym = symbolStr.toUpperCase().trim();
  
  return (
    sym.includes('^NSE') ||
    sym.includes('^BSE') ||
    sym.includes('^BSESN') ||
    sym.includes('^NSEI') ||
    sym.includes('^NSEBANK') ||
    sym.includes('NIFTY') ||
    sym.includes('BANKNIFTY') ||
    sym.includes('FINNIFTY') ||
    sym.includes('MIDCPNIFTY') ||
    sym.includes('SENSEX') ||
    sym.includes('RELIANCE') ||
    sym.includes('HDFCBANK') ||
    sym.includes('TCS') ||
    sym.includes('INFY') ||
    sym.includes('TATAMOTORS') ||
    sym.includes('TATASTEEL') ||
    sym.includes('ICICIBANK') ||
    sym.includes('SBIN') ||
    sym.includes('AXISBANK') ||
    sym.includes('KOTAKBANK') ||
    sym.includes('BHARTIARTL') ||
    sym.includes('ITC') ||
    sym.includes('LT') ||
    sym.includes('BAJFINANCE') ||
    sym.includes('MARUTI') ||
    sym.endsWith('.NS') ||
    sym.endsWith('.BO') ||
    sym.startsWith('NSE:') ||
    sym.startsWith('BSE:') ||
    sym.includes(' CE') ||
    sym.includes(' PE') ||
    sym === 'USD/INR' ||
    sym === 'INR'
  );
}

/**
 * Checks if an asset object or string belongs to the Indian Market.
 */
export function isIndianMarketAsset(
  assetOrSymbol?: string | AssetIdentifier | null,
  marketCategory?: string
): boolean {
  if (marketCategory) {
    const mc = marketCategory.toUpperCase();
    if (mc.includes('INDIAN') || mc.includes('NSE') || mc.includes('BSE') || mc.includes('F&O')) {
      return true;
    }
  }

  if (!assetOrSymbol) return false;

  if (typeof assetOrSymbol === 'string') {
    return isIndianMarketSymbol(assetOrSymbol);
  }

  const sym = (assetOrSymbol.symbol || '').toUpperCase();
  const cat = (assetOrSymbol.category || assetOrSymbol.market || '').toUpperCase();
  const name = (assetOrSymbol.name || '').toUpperCase();

  if (
    cat.includes('INDIAN') ||
    cat.includes('NSE') ||
    cat.includes('BSE') ||
    cat.includes('F&O') ||
    cat === 'INDIAN STOCKS / F&O'
  ) {
    return true;
  }

  if (
    name.includes('NIFTY') ||
    name.includes('SENSEX') ||
    name.includes('BANK NIFTY') ||
    name.includes('FIN NIFTY') ||
    name.includes('RELIANCE') ||
    name.includes('HDFC') ||
    name.includes('TATA') ||
    name.includes('INFOSYS') ||
    name.includes('ICICI') ||
    name.includes('STATE BANK OF INDIA')
  ) {
    return true;
  }

  return isIndianMarketSymbol(sym);
}

/**
 * Gets the currency symbol for an asset: '₹' for Indian Market, '$' for Global/Crypto
 */
export function getAssetCurrencySymbol(
  assetOrSymbol?: string | AssetIdentifier | null,
  marketCategory?: string
): string {
  return isIndianMarketAsset(assetOrSymbol, marketCategory) ? '₹' : '$';
}

/**
 * Formats an asset's live market price with the correct currency symbol (₹ for Indian, $ for Global/Crypto).
 */
export function formatAssetPrice(
  price: number | undefined | null,
  assetOrSymbol?: string | AssetIdentifier | null,
  options?: {
    showPlusSign?: boolean;
    decimals?: number;
    fallback?: string;
  }
): string {
  if (price === undefined || price === null || isNaN(price)) {
    return options?.fallback || '0.00';
  }

  const isIndian = isIndianMarketAsset(assetOrSymbol);
  const symbol = isIndian ? '₹' : '$';
  const locale = isIndian ? 'en-IN' : 'en-US';

  const sign = price > 0 && options?.showPlusSign ? '+' : price < 0 ? '-' : '';
  const absPrice = Math.abs(price);

  let decimals = options?.decimals;
  if (decimals === undefined) {
    if (isIndian) {
      decimals = 2;
    } else {
      decimals = absPrice < 2 ? 4 : 2;
    }
  }

  const formattedNum = absPrice.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${sign}${symbol}${formattedNum}`;
}
