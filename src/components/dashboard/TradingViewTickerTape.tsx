import React, { useMemo } from 'react';

interface TradingViewTickerTapeProps {
  onSelectSymbol?: (symbol: string) => void;
}

export const TradingViewTickerTape: React.FC<TradingViewTickerTapeProps> = () => {
  const tickerHtml = useMemo(() => {
    const config = JSON.stringify({
      symbols: [
        { proName: 'NSE:NIFTY', title: 'NIFTY 50' },
        { proName: 'NSE:BANKNIFTY', title: 'BANK NIFTY' },
        { proName: 'NSE:FINNIFTY', title: 'FIN NIFTY' },
        { proName: 'BSE:SENSEX', title: 'SENSEX' },
        { proName: 'NSE:RELIANCE', title: 'RELIANCE' },
        { proName: 'NSE:HDFCBANK', title: 'HDFC BANK' },
        { proName: 'NSE:ICICIBANK', title: 'ICICI BANK' },
        { proName: 'NSE:INFY', title: 'INFOSYS' },
        { proName: 'NSE:TCS', title: 'TCS' },
        { proName: 'NSE:TATAMOTORS', title: 'TATA MOTORS' },
        { proName: 'NSE:SBIN', title: 'SBIN' },
        { proName: 'BINANCE:BTCUSDT', title: 'BTC / USDT' },
        { proName: 'BINANCE:ETHUSDT', title: 'ETH / USDT' },
        { proName: 'BINANCE:SOLUSDT', title: 'SOL / USDT' },
        { proName: 'OANDA:XAUUSD', title: 'GOLD' },
        { proName: 'TVC:USOIL', title: 'CRUDE OIL' },
        { proName: 'FX_IDC:USDINR', title: 'USD / INR' },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: 'in',
    });

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: #080C16; overflow: hidden; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div class="tradingview-widget-container">
    <div class="tradingview-widget-container__widget"></div>
    <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js" async>
    ${config}
    </script>
  </div>
</body>
</html>`;
  }, []);

  return (
    <div className="w-full h-[46px] bg-[#080C16] border-y border-[#1C263C] overflow-hidden">
      <iframe
        title="TradingView Ticker Tape"
        srcDoc={tickerHtml}
        className="w-full h-full border-0 block"
        sandbox="allow-scripts allow-same-origin allow-popups"
        loading="lazy"
      />
    </div>
  );
};

