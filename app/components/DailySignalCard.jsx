'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Zap, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  AlertTriangle, 
  ShieldCheck,
  Sparkles,
  Radio,
  Timer
} from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';
import { getSignalTimeWindow } from '@/lib/timeUtils';

export default function DailySignalCard({ signal: initialSignal }) {
  const router = useRouter();
  const { user, token } = useAuth();

  const [signal, setSignal] = useState(initialSignal || null);
  const [timing, setTiming] = useState(null);
  const [hasUserExecuted, setHasUserExecuted] = useState(false);
  const [userTrade, setUserTrade] = useState(null);
  const [hasVipBoost, setHasVipBoost] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const walletBal = Number(user?.wallet_balance || 0);
  const stakedBal = Number(user?.investment_balance || 0);
  const totalSignalBal = Number((walletBal + stakedBal).toFixed(2));
  const minCap = Number(signal?.min_capital || 10);

  const [tradeAmount, setTradeAmount] = useState(minCap);
  const [amountError, setAmountError] = useState('');

  // 1. Fetch live active signal status with user execution state
  const fetchActiveSignalStatus = async () => {
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/signals/active`, { headers });
      const data = await res.json();
      if (data.success) {
        setSignal(data.data || null);
        if (data.timing) {
          setTiming(data.timing);
          setHasUserExecuted(Boolean(data.timing.hasUserExecuted));
          setUserTrade(data.timing.userTrade || null);
        }
      }
    } catch (e) {
      console.error('Error fetching active signal:', e);
    }
  };

  useEffect(() => {
    fetchActiveSignalStatus();
    const interval = setInterval(fetchActiveSignalStatus, 5000);
    return () => clearInterval(interval);
  }, [token]);

  // 2. Check VIP boost status
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/investments/my`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.summary?.hasVipBoost) {
            setHasVipBoost(true);
          } else if ((user?.investment_balance || 0) > 0) {
            setHasVipBoost(true);
          }
        })
        .catch(() => {});
    }
  }, [token, user]);

  // 3. High-frequency 1-second live ticker for smooth countdown
  const [liveWindowActive, setLiveWindowActive] = useState(false);
  const [liveSecondsLeft, setLiveSecondsLeft] = useState(0);
  const [secondsUntilStart, setSecondsUntilStart] = useState(0);
  const [isExpiredSignal, setIsExpiredSignal] = useState(false);

  useEffect(() => {
    if (!signal) {
      setLiveWindowActive(false);
      setIsExpiredSignal(true);
      return;
    }

    const updateTicker = () => {
      const win = getSignalTimeWindow(signal);
      setLiveWindowActive(win.isLiveWindow);
      setLiveSecondsLeft(win.secondsRemainingInLiveWindow || 0);
      setSecondsUntilStart(win.secondsUntilStart || 0);
      setIsExpiredSignal(win.isExpired);
    };

    updateTicker();
    const ticker = setInterval(updateTicker, 1000);
    return () => clearInterval(ticker);
  }, [signal]);

  useEffect(() => {
    if (confirmModalOpen) {
      if (totalSignalBal > 0) {
        setTradeAmount(Math.floor(totalSignalBal));
      } else {
        setTradeAmount(minCap);
      }
      setAmountError('');
    }
  }, [confirmModalOpen, totalSignalBal, minCap]);

  // Formatting helper for seconds
  const formatCountdown = (totalSec) => {
    if (totalSec <= 0) return '00:00';
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSetPercentAmount = (pct) => {
    if (totalSignalBal <= 0) {
      setTradeAmount(10);
      return;
    }
    const calc = Math.floor((totalSignalBal * pct) / 100);
    setTradeAmount(Math.max(1, calc));
    setAmountError('');
  };

  const handleProceedToTrading = () => {
    const numericAmount = Number(tradeAmount) || 0;
    if (numericAmount <= 0) {
      setAmountError('Please enter a valid trade amount.');
      return;
    }
    if (totalSignalBal < numericAmount) {
      setAmountError(`Insufficient trade balance. You have $${totalSignalBal.toFixed(2)} available.`);
      return;
    }

    setConfirmModalOpen(false);
    router.push(
      `/trading?pair=${signal.instrument.replace('/', '')}&type=${signal.order_type}&duration=${signal.duration_seconds || 180}&amount=${numericAmount}&autoConfirm=true`
    );
  };

  // =========================================================================
  // STATE 1: NO ACTIVE SIGNAL / PREVIOUS SIGNAL EXPIRED
  // =========================================================================
  if (!signal || isExpiredSignal) {
    return (
      <div className="relative rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl shadow-slate-900/15 overflow-hidden border border-slate-700/60">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-[11px] sm:text-xs font-black tracking-wide border border-white/20">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                AWAITING NEXT OFFICIAL SIGNAL
              </span>
              <span className="text-xs text-blue-200 font-bold flex items-center gap-1 bg-black/30 px-2.5 py-0.5 rounded-full">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Broadcast Schedule: Daily at 07:00 PM (PKT)
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
              Signal Window Concluded • Next Signal in Preparation
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              The previous daily signal execution window has concluded. The institutional quantitative trading desk is currently evaluating liquidity and market order flow for the next high-probability setup.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span>All official signal outcomes are verified and archived in the Historical Audit Ledger.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 min-w-[200px]">
            <button
              onClick={() => router.push('/signals')}
              className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Radio className="w-4 h-4 text-blue-600" />
              <span>View Signals Ledger</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 2: USER HAS ALREADY EXECUTED TODAY'S SIGNAL
  // =========================================================================
  if (hasUserExecuted) {
    const isWinTrade = userTrade?.result === 'WIN';
    return (
      <div className="relative rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white shadow-xl shadow-emerald-950/20 overflow-hidden border border-emerald-500/30">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] sm:text-xs font-black tracking-wide border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                OFFICIAL DAILY SIGNAL COMPLETED
              </span>
              <span className="text-xs text-emerald-200 font-bold bg-black/30 px-2.5 py-0.5 rounded-full font-mono">
                {signal.instrument} • {signal.order_type} MARKET
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
              Today's Signal Order Placed & Settled
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              You have successfully executed today's official daily signal contract. Your quota for this signal is complete, and daily earnings have been credited to your spot wallet.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/15">
                <p className="text-[10px] font-bold text-emerald-200 uppercase">Instrument</p>
                <p className="text-sm font-extrabold font-mono text-white mt-0.5">{signal.instrument}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/15">
                <p className="text-[10px] font-bold text-emerald-200 uppercase">Direction</p>
                <p className="text-sm font-extrabold text-emerald-300 mt-0.5">{signal.order_type} MARKET</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/15">
                <p className="text-[10px] font-bold text-emerald-200 uppercase">Status</p>
                <p className="text-sm font-extrabold text-emerald-400 mt-0.5 flex items-center gap-1">
                  <span>Settled / Complete</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 min-w-[200px]">
            <button
              onClick={() => router.push('/trading')}
              className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Portfolio History</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 3 & 4: ACTIVE SIGNAL (LIVE WINDOW OR UPCOMING COUNTDOWN)
  // =========================================================================
  const isBuy = signal.order_type === 'BUY';
  const numericAmount = Number(tradeAmount) || 0;

  return (
    <>
      <div className="relative rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/15 overflow-hidden">
        {/* Decorative background aura */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] sm:text-xs font-black tracking-wide text-white border border-white/30">
                <span className={`w-2 h-2 rounded-full ${liveWindowActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                OFFICIAL DAILY TRADING SIGNAL
              </span>

              <span className="text-xs text-blue-100 font-bold flex items-center gap-1 bg-black/20 px-2.5 py-0.5 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                {signal.execution_time_pst || '07:00 PM (PST)'}
              </span>

              {liveWindowActive ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase flex items-center gap-1 shadow-xs animate-pulse">
                  <Timer className="w-3 h-3" />
                  <span>LIVE WINDOW: {liveSecondsLeft}s REMAINING</span>
                </span>
              ) : secondsUntilStart > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/90 text-slate-900 text-[10px] font-black uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>STARTS IN: {formatCountdown(secondsUntilStart)}</span>
                </span>
              ) : null}
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              {signal.title || 'Official Market Signal'}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/15">
                <p className="text-[10px] sm:text-[11px] font-bold text-blue-200 uppercase">Instrument</p>
                <p className="text-sm sm:text-base font-extrabold font-mono text-white mt-0.5">{signal.instrument}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/15">
                <p className="text-[10px] sm:text-[11px] font-bold text-blue-200 uppercase">Direction</p>
                <p className={`text-sm sm:text-base font-extrabold mt-0.5 flex items-center gap-1 ${isBuy ? 'text-emerald-300' : 'text-rose-300'}`}>
                  <span>{signal.order_type} MARKET</span>
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/15">
                <p className="text-[10px] sm:text-[11px] font-bold text-blue-200 uppercase">Signal Time</p>
                <p className="text-sm sm:text-base font-extrabold font-mono text-amber-300 mt-0.5">
                  {signal.execution_time_pst || 'Scheduled'}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/15">
                <p className="text-[10px] sm:text-[11px] font-bold text-blue-200 uppercase">Contract Expiry</p>
                <p className="text-sm sm:text-base font-extrabold font-mono text-white mt-0.5">
                  {Math.floor((signal.duration_seconds || 180) / 60)} Mins
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-blue-100/90 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Execute strictly during the active window to ensure guaranteed algorithmic risk protection.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[200px]">
            <button
              onClick={() => {
                if (!token) {
                  router.push('/login');
                  return;
                }
                setConfirmModalOpen(true);
              }}
              className={`w-full py-3.5 sm:py-4 px-5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer group ${
                liveWindowActive
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-900 shadow-emerald-400/30'
                  : 'bg-white hover:bg-blue-50 text-blue-700'
              }`}
            >
              <Zap className="w-4 h-4 text-blue-600 fill-blue-600 group-hover:scale-110 transition-transform" />
              <span>{liveWindowActive ? `Execute Live Signal (${liveSecondsLeft}s)` : 'Execute Signal Now'}</span>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* TRADE CONFIRMATION & CAPITAL ENTRY MODAL */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <button
              onClick={() => setConfirmModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                liveWindowActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {liveWindowActive ? 'LIVE WINDOW OPEN • READY TO EXECUTE' : 'SCHEDULE TIME NOTICE'}
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {liveWindowActive ? 'Execute Live Signal Trade' : 'Signal Schedule Notice'}
              </h3>
              <p className="text-xs text-slate-500">
                {liveWindowActive 
                  ? `Live window is open (${liveSecondsLeft}s left). Enter trade capital.`
                  : `Signal is scheduled for ${signal.execution_time_pst}.`}
              </p>
            </div>

            {/* Error Message */}
            {amountError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{amountError}</span>
              </div>
            )}

            {/* Warning if placing outside live duration window */}
            {!liveWindowActive && (
              <div className="p-3.5 bg-rose-50 border-2 border-rose-500 rounded-2xl text-left space-y-1.5">
                <div className="flex items-center gap-2 text-rose-700 font-black text-xs sm:text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
                  <span>DANGER: OFF-TIME TRADE (HIGH RISK OF LOSS)</span>
                </div>
                <p className="text-xs text-rose-800 font-bold leading-relaxed">
                  You are attempting to trade before or outside the exact signal window. Executing a trade now will result in <strong>market loss</strong>!
                </p>
                <p className="text-xs text-rose-700 font-semibold">
                  Official Signal Time: <strong className="text-rose-950 font-black">{signal.execution_time_pst || 'Scheduled Time'}</strong>. Please wait for the exact signal start time.
                </p>
              </div>
            )}

            {/* Amount Selection Input */}
            <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Signal Trade Capital (USD)
                </label>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>Balance:</span>
                  <span className="font-mono font-extrabold text-emerald-600">${totalSignalBal.toFixed(2)}</span>
                </div>
              </div>

              {stakedBal > 0 && (
                <div className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-[11px] text-amber-800">
                  <span className="flex items-center gap-1 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>VIP Staked Capital Active</span>
                  </span>
                  <span className="font-mono font-bold">
                    Spot: ${walletBal.toFixed(2)} | Staked: ${stakedBal.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Amount Input with MAX button */}
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 font-bold text-base pointer-events-none">
                  $
                </div>
                <input
                  type="number"
                  min="1"
                  max={totalSignalBal}
                  step="any"
                  value={tradeAmount}
                  onChange={(e) => {
                    setTradeAmount(e.target.value);
                    setAmountError('');
                  }}
                  placeholder="Enter amount"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-20 py-2.5 text-base font-black font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => handleSetPercentAmount(100)}
                  className="absolute right-2 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-colors cursor-pointer shadow-xs"
                >
                  MAX
                </button>
              </div>

              {/* Quick Percent Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { label: '25%', pct: 25 },
                  { label: '50%', pct: 50 },
                  { label: '75%', pct: 75 },
                  { label: '🔥 100%', pct: 100 }
                ].map((item) => (
                  <button
                    key={item.pct}
                    type="button"
                    onClick={() => handleSetPercentAmount(item.pct)}
                    className="py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors text-center cursor-pointer shadow-2xs"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trade Details Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Instrument Asset:</span>
                <span className="font-mono font-extrabold text-slate-900 text-sm">{signal.instrument}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Order Type:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isBuy ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {signal.order_type} MARKET
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Contract Capital:</span>
                <span className="font-mono font-black text-slate-900 text-sm">${numericAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 font-bold">Duration / Expiry:</span>
                <span className="font-bold text-slate-800">{Math.floor((signal.duration_seconds || 180) / 60)} Minutes ({signal.duration_seconds || 180}s)</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToTrading}
                className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4" />
                <span>Confirm & Place (${numericAmount.toFixed(0)})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
