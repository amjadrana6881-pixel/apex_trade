'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const FALLBACK_IMAGES = {
  XAUUSD: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80',
  XAGUSD: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?auto=format&fit=crop&w=600&q=80',
  USOIL: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
  GAS: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80',
  EURUSD: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
  USDJPY: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80',
  GBPJPY: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80',
  AUDNZD: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=600&q=80',
  BTCUSDT: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
  ETHUSDT: 'https://images.unsplash.com/photo-1621504450181-5d356f61d307?auto=format&fit=crop&w=600&q=80',
  SOLUSDT: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=600&q=80',
  XRPUSDT: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80',
  AAPL: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80',
  TSLA: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=600&q=80',
  GOOG: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=600&q=80',
  META: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'
};

export default function TradingPairCard({ pair }) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  const numChange = Number(pair.change || 0);
  const isPos = numChange >= 0;
  const changeValue = Math.abs(numChange).toFixed(2);
  const formattedChange = isPos ? `+${changeValue}%` : `${changeValue}%`;

  const symbol = (pair.symbol || '').toUpperCase();
  const primaryImage = pair.image_url || `/images/${symbol}.jpg`;
  const imgSrc = imgError ? (FALLBACK_IMAGES[symbol] || '/images/Bitcoin.jpg') : primaryImage;

  const handleNavigate = (e) => {
    e.stopPropagation();
    router.push(`/trading?pair=${pair.symbol}`);
  };

  return (
    <div
      onClick={handleNavigate}
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-slate-900 shadow-md hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 group cursor-pointer flex flex-col justify-between min-h-[155px] sm:min-h-[175px]"
    >
      {/* Background Image with slight opacity / transparency */}
      <img
        src={imgSrc}
        alt={pair.name || pair.symbol}
        onError={() => setImgError(true)}
        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
      />

      {/* Dark Translucent Tint & Overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/75 group-hover:via-black/50 transition-colors" />

      {/* Card Body */}
      <div className="relative z-10 p-3.5 sm:p-4 flex flex-col justify-between h-full flex-1">
        {/* Top Header: Symbol & Change Badge */}
        <div>
          <div className="flex items-center justify-between gap-1.5">
            <h4 className="font-extrabold text-white text-sm sm:text-base tracking-tight truncate group-hover:text-blue-300 transition-colors">
              {pair.symbol}
            </h4>

            {/* Pill Change Badge */}
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black shrink-0 border inline-flex items-center gap-0.5 shadow-xs ${
                isPos
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                  : 'bg-rose-950/80 border-rose-500/40 text-rose-400'
              }`}
            >
              <span>{isPos ? '↑' : '↓'}</span>
              <span>{formattedChange}</span>
            </span>
          </div>

          {/* Subtitle: Pair Name */}
          <p className="text-[11px] sm:text-xs text-slate-300 font-medium truncate mt-0.5">
            {pair.name}
          </p>
        </div>

        {/* Bottom Button: Trade Now */}
        <div className="mt-3">
          <button
            onClick={handleNavigate}
            className="w-full py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all flex items-center justify-center cursor-pointer"
          >
            Trade Now
          </button>
        </div>
      </div>
    </div>
  );
}
