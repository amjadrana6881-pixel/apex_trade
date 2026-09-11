'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Zap, Clock, ShieldAlert, ArrowRight, CheckCircle2, TrendingUp, X, DollarSign, AlertCircle, Sparkles, Lock } from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';

export default function DailySignalCard({ signal }) {
  const router = useRouter();
  const { user, token } = useAuth();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [hasVipBoost, setHasVipBoost] = useState(false);

  const userBal = Number(user?.wallet_balance || 0);
  const minCap = Number(signal?.min_capital || 10);
  const stdProfitPct = Number(signal?.profit_percentage || 5.00);
  const vipProfitPct = Number(signal?.investment_profit_percentage || 8.50);

  // Check if user has active staking package
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

  const effectiveProfitPct = hasVipBoost ? vipProfitPct : stdProfitPct;

  // Initialize trade amount to user balance or default minCap
  const [tradeAmount, setTradeAmount] = useState(minCap);
  const [amountError, setAmountError] = useState('');

  useEffect(() => {
    if (confirmModalOpen) {
      if (userBal > 0) {
        setTradeAmount(Math.floor(userBal));
      } else {
        setTradeAmount(minCap);
      }
      setAmountError('');
    }
  }, [confirmModalOpen, userBal, minCap]);

  if (!signal) return null;

  const isBuy = signal.order_type === 'BUY';
  const numericAmount = Number(tradeAmount) || 0;
  const estProfit = ((numericAmount * effectiveProfitPct) / 100).toFixed(2);
  const estTotal = (numericAmount + Number(estProfit)).toFixed(2);

  const handleSetPercentAmount = (pct) => {
    if (userBal <= 0) {
      setTradeAmount(10);
      return;
    }
    const calc = Math.floor((userBal * pct) / 100);
    setTradeAmount(Math.max(1, calc));
    setAmountError('');
  };

  const handleProceedToTrading = () => {
    if (numericAmount <= 0) {
      setAmountError('Please enter a valid trade amount.');
      return;
    }
    if (userBal < numericAmount) {
      setAmountError(`Insufficient wallet balance. You have $${userBal.toFixed(2)} available.`);
      return;
    }

    setConfirmModalOpen(false);
    router.push(
      `/trading?pair=${signal.instrument.replace('/', '')}&type=${signal.order_type}&duration=${signal.duration_seconds || 180}&amount=${numericAmount}&autoConfirm=true`
    );
  };

  return (
    <>
      <div className="relative rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/15 overflow-hidden">
        {/* Decorative background aura */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] sm:text-xs font-black tracking-wide text-white border border-white/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                OFFICIAL DAILY TRADING SIGNAL
              </span>
              <span className="text-xs text-blue-100 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {signal.execution_time_pst || '07:00 PM (PST)'}
              </span>

              {hasVipBoost ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black uppercase">
                  <Sparkles className="w-3 h-3" />
                  VIP Boost Active (+{vipProfitPct}%)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold">
                  Standard Rate (+{stdProfitPct}%)
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              {signal.title || 'Day Trading Signal'}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/15">
                <p className="text-[10px] sm:text-[11px] font-bold text-blue-200 uppercase">Instrument</p>
                <p className="text-sm sm:text-base font-extrabold font-mono text-white mt-0.5">{signal.instrument}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/15">
                <p className="text-[10px] sm:text-[11px] font-bold text-blue-200 uppercase">Order Type</p>
                <p className={`text-sm sm:text-base font-extrabold mt-0.5 flex items-center gap-1 ${isBuy ? 'text-emerald-300' : 'text-rose-300'}`}>
                  <span>{signal.order_type} MARKET</span>
                </p>
              </div>

              <div className={`backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border ${
                hasVipBoost 
                  ? 'bg-amber-400/20 border-amber-300/40 text-amber-200' 
                  : 'bg-white/10 border-white/15 text-emerald-300'
              }`}>
                <p className="text-[10px] sm:text-[11px] font-bold text-blue-200 uppercase">
                  {hasVipBoost ? '🌟 VIP Yield' : 'Expected Return'}
                </p>
                <p className={`text-sm sm:text-base font-extrabold font-mono mt-0.5 ${hasVipBoost ? 'text-amber-300' : 'text-emerald-300'}`}>
                  +{effectiveProfitPct}%
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/15">
                <p className="text-[10px] sm:text-[11px] font-bold text-blue-200 uppercase">Expiry / Time</p>
                <p className="text-sm sm:text-base font-extrabold font-mono text-white mt-0.5">{Math.floor((signal.duration_seconds || 180) / 60)} Mins ({signal.duration_seconds || 180}s)</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-blue-100/90 leading-relaxed">
              <span>⚠️ <strong className="text-white">Risk Advisory:</strong> Trade strictly according to official signal parameters.</span>
              {!hasVipBoost && (
                <button
                  type="button"
                  onClick={() => router.push('/investments')}
                  className="text-amber-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Stake in Yield Package to boost profit to +{vipProfitPct}% &rarr;</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[190px]">
            <button
              onClick={() => {
                if (!token) {
                  router.push('/login');
                  return;
                }
                setConfirmModalOpen(true);
              }}
              className="w-full py-3.5 sm:py-4 px-5 rounded-2xl bg-white hover:bg-blue-50 text-blue-700 font-extrabold text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Zap className="w-4 h-4 text-blue-600 fill-blue-600 group-hover:scale-110 transition-transform" />
              <span>Execute Signal Now</span>
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
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase">
                ORDER CAPITAL & CONFIRMATION
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">Execute Daily Signal Trade</h3>
              <p className="text-xs text-slate-500">Choose how much capital you want to trade with.</p>
            </div>

            {/* Error Message */}
            {amountError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{amountError}</span>
              </div>
            )}

            {/* VIP Status Banner */}
            {hasVipBoost ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>VIP Yield Staking Active: Boosted +{vipProfitPct}% Return Applied!</span>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 flex justify-between items-center">
                <span>Standard Rate: +{stdProfitPct}%</span>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModalOpen(false);
                    router.push('/investments');
                  }}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Unlock VIP +{vipProfitPct}% &rarr;
                </button>
              </div>
            )}

            {/* Amount Selection Input */}
            <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Trade Amount (USD)
                </label>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>Balance:</span>
                  <span className="font-mono font-extrabold text-emerald-600">${userBal.toFixed(2)}</span>
                </div>
              </div>

              {/* Amount Input with MAX button */}
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 font-bold text-base pointer-events-none">
                  $
                </div>
                <input
                  type="number"
                  min="1"
                  max={userBal}
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

              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Duration / Expiry:</span>
                <span className="font-bold text-slate-800">{Math.floor((signal.duration_seconds || 180) / 60)} Minutes ({signal.duration_seconds || 180}s)</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Expected Net Return:</span>
                <span className={`font-mono font-black ${hasVipBoost ? 'text-amber-600' : 'text-emerald-600'}`}>
                  +${estProfit} (+{effectiveProfitPct}%)
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 text-slate-900 font-black">
                <span>Total Payout If Won:</span>
                <span className="font-mono text-base text-blue-600">${estTotal}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Official Daily Signal: Protected Algorithmic Outcome</span>
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
