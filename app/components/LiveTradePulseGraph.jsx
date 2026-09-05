'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

export default function LiveTradePulseGraph({ trade, countdown }) {
  if (!trade) return null;

  const { entryPrice = 100, type = 'BUY', expectedOutcome = 'LOSS', payoutRate = 88, amount = 10 } = trade;
  const isWin = expectedOutcome === 'WIN';
  const isBuy = type.toUpperCase() === 'BUY';

  // Generate real-time micro ticks
  const [ticks, setTicks] = useState([entryPrice]);
  const [currentLivePrice, setCurrentLivePrice] = useState(entryPrice);

  useEffect(() => {
    const totalDuration = trade.duration || 60;
    const progress = Math.max(0, Math.min(1, (totalDuration - countdown) / totalDuration));

    const interval = setInterval(() => {
      setTicks(prev => {
        const last = prev[prev.length - 1] || entryPrice;
        const noise = (Math.random() * 0.0006 - 0.0003) * entryPrice;
        
        let targetBias = 0;
        if (isWin) {
          // Move in user's favor
          targetBias = isBuy ? (entryPrice * 0.0015 * (progress + 0.2)) : (-entryPrice * 0.0015 * (progress + 0.2));
        } else {
          // Move against user
          targetBias = isBuy ? (-entryPrice * 0.0015 * (progress + 0.2)) : (entryPrice * 0.0015 * (progress + 0.2));
        }

        const nextPrice = Number((entryPrice + targetBias + noise).toFixed(4));
        setCurrentLivePrice(nextPrice);

        const newArr = [...prev, nextPrice];
        if (newArr.length > 24) newArr.shift();
        return newArr;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [countdown, trade, isWin, isBuy, entryPrice]);

  const inProfit = isWin ? true : (isBuy ? currentLivePrice > entryPrice : currentLivePrice < entryPrice);
  const strokeColor = inProfit ? '#10b981' : '#f43f5e';
  const fillColor = inProfit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';

  // Calculate SVG Polyline points
  const minP = Math.min(...ticks, entryPrice * 0.998);
  const maxP = Math.max(...ticks, entryPrice * 1.002);
  const range = maxP - minP || 1;

  const width = 300;
  const height = 90;

  const points = ticks.map((p, idx) => {
    const x = (idx / (Math.max(ticks.length - 1, 1))) * width;
    const y = height - ((p - minP) / range) * (height - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  const entryY = height - ((entryPrice - minP) / range) * (height - 20) - 10;
  const lastPoint = points.split(' ').pop() || '0,0';
  const [lastX, lastY] = lastPoint.split(',').map(Number);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white space-y-2 shadow-inner overflow-hidden relative">
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${inProfit ? 'bg-emerald-400 animate-ping' : 'bg-rose-400 animate-ping'}`}></span>
          <span className="font-extrabold uppercase tracking-wider text-[11px] text-slate-300">
            {trade.pair} • {type}
          </span>
        </div>

        <div className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${
          inProfit ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        }`}>
          {inProfit ? 'IN PROFIT (WIN)' : 'OUT OF RANGE (LOSS)'}
        </div>
      </div>

      {/* SVG Canvas Graph */}
      <div className="relative w-full h-[90px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="tradeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Dotted Strike/Entry Price Line */}
          <line
            x1="0"
            y1={entryY}
            x2={width}
            y2={entryY}
            stroke="#64748b"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {/* Area Fill */}
          <polygon
            points={`0,${height} ${points} ${width},${height}`}
            fill="url(#tradeGradient)"
          />

          {/* Dynamic Live Price Polyline */}
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Pulsing Live Dot */}
          <circle cx={lastX} cy={lastY} r="4.5" fill={strokeColor} className="animate-pulse" />
          <circle cx={lastX} cy={lastY} r="8" fill={strokeColor} opacity="0.3" />
        </svg>

        {/* Floating Entry Strike Tag */}
        <div 
          className="absolute left-1 text-[9px] font-mono text-slate-400 bg-slate-900/80 px-1 rounded border border-slate-700 pointer-events-none"
          style={{ top: `${Math.max(2, Math.min(height - 18, entryY - 9))}px` }}
        >
          Strike: ${Number(entryPrice).toFixed(2)}
        </div>
      </div>

      {/* Bottom Live Price Strip */}
      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
        <div>
          <span className="text-slate-400 block text-[10px]">Live Market Price</span>
          <span className="font-mono font-black text-white text-xs">${currentLivePrice.toFixed(2)}</span>
        </div>

        <div className="text-right">
          <span className="text-slate-400 block text-[10px]">Est. Return</span>
          <span className={`font-mono font-black text-xs ${inProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {inProfit ? `+$${((amount * payoutRate) / 100).toFixed(2)}` : `-$${Number(amount).toFixed(2)}`}
          </span>
        </div>
      </div>
    </div>
  );
}
