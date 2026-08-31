import React, { useEffect, useRef } from 'react';

export default function TradingViewChart({ symbol = 'BTCUSDT' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Map internal symbols to TradingView TV symbols
    const symbolMap = {
      XAUUSD: 'OANDA:XAUUSD',
      XAGUSD: 'OANDA:XAGUSD',
      USOIL: 'TVC:USOIL',
      GAS: 'TVC:NATURALGAS',
      EURUSD: 'FX:EURUSD',
      USDJPY: 'FX:USDJPY',
      GBPJPY: 'FX:GBPJPY',
      AUDNZD: 'FX:AUDNZD',
      BTCUSDT: 'BINANCE:BTCUSDT',
      ETHUSDT: 'BINANCE:ETHUSDT',
      SOLUSDT: 'BINANCE:SOLUSDT',
      XRPUSDT: 'BINANCE:XRPUSDT',
      AAPL: 'NASDAQ:AAPL',
      TSLA: 'NASDAQ:TSLA',
      GOOG: 'NASDAQ:GOOGL',
      META: 'NASDAQ:META',
    };

    const cleanSymbol = symbol ? symbol.replace('/', '').toUpperCase() : 'BTCUSDT';
    const tvSymbol = symbolMap[cleanSymbol] || cleanSymbol;
    const containerId = 'tradingview_widget_container';

    // Clear previous widget
    if (containerRef.current) {
      containerRef.current.innerHTML = `<div id="${containerId}" style="height: 100%; width: 100%;"></div>`;
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView && document.getElementById(containerId)) {
        new window.TradingView.widget({
          container_id: containerId,
          autosize: true,
          symbol: tvSymbol,
          interval: '1',
          timezone: 'Etc/UTC',
          theme: 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f8fafc',
          enable_publishing: false,
          allow_symbol_change: false,
          hide_top_toolbar: false,
          hide_legend: false,
          hide_side_toolbar: false,
          save_image: false,
          backgroundColor: '#ffffff',
          gridColor: '#f1f5f9',
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[350px] sm:min-h-[420px] rounded-2xl overflow-hidden bg-white">
      <div id="tradingview_widget_container" className="w-full h-full"></div>
    </div>
  );
}
