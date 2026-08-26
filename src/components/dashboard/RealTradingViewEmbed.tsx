import React, { useMemo } from 'react';

interface RealTradingViewEmbedProps {
  symbol: string;
  interval?: string;
  theme?: 'dark' | 'light';
  height?: number | string;
  allowSymbolChange?: boolean;
}

export const RealTradingViewEmbed: React.FC<RealTradingViewEmbedProps> = ({
  symbol,
  interval = '15',
  theme = 'dark',
  height = '100%',
  allowSymbolChange = true,
}) => {
  // Normalize timeframe intervals for TradingView format
  const normalizedInterval = useMemo(() => {
    if (interval === '1D') return 'D';
    if (interval === '1W') return 'W';
    if (interval === '1H') return '60';
    if (interval === '4H') return '240';
    return interval;
  }, [interval]);

  const iframeSrc = useMemo(() => {
    return `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(
      symbol
    )}&interval=${normalizedInterval}&hidesidetoolbar=0&symboledit=${
      allowSymbolChange ? '1' : '0'
    }&saveimage=1&toolbarbg=0E131F&theme=${theme}&style=1&timezone=Asia%2FKolkata&studies=%5B%22RSI%40tv-basicstudies%22%2C%22MASimple%40tv-basicstudies%22%2C%22Volume%40tv-basicstudies%22%5D&hide_side_toolbar=0&allow_symbol_change=${
      allowSymbolChange ? '1' : '0'
    }&locale=in`;
  }, [symbol, normalizedInterval, theme, allowSymbolChange]);

  return (
    <div
      className="tradingview-widget-container w-full h-full min-h-[480px] bg-[#0E131F] rounded-xl overflow-hidden relative"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <iframe
        id="tradingview-live-stream-frame"
        key={`${symbol}_${normalizedInterval}`}
        src={iframeSrc}
        title={`TradingView Chart ${symbol}`}
        className="w-full h-full border-0 absolute inset-0"
        allow="fullscreen; clipboard-write"
        loading="lazy"
      />
    </div>
  );
};

