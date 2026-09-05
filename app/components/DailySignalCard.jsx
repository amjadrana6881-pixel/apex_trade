'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Zap, Clock, ShieldAlert, ArrowRight, CheckCircle2, TrendingUp, X, DollarSign } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

export default function DailySignalCard({ signal }) {
  const router = useRouter();
  const { user, token } = useAuth();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  if (!signal) return null;

  const isBuy = signal.order_type === 'BUY';
  const minCap = Number(signal.min_capital || 700);
  const profitPct = Number(signal.profit_percentage || 4.25);
  const estProfit = ((minCap * profitPct) / 100).toFixed(2);
  const estTotal = (minCap + Number(estProfit)).toFixed(2);

  const handleProceedToTrading = () => {
    setConfirmModalOpen(false);
    router.push(`/trading?pair=${signal.instrument}&type=${signal.order_type}&duration=${signal.duration_seconds}&amount=${minCap}&autoConfirm=true`);
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

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/15">
                <p className="text-[10px] sm:text-[11px] font-bold text-blue-200 uppercase">Min Capital</p>
                <p className="text-sm sm:text-base font-extrabold font-mono text-white mt-0.5">${minCap.toFixed(0)}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/15">
                <p className="text-[10px] sm:text-[11px] font-bold text-blue-200 uppercase">Expiry / Time</p>
                <p className="text-sm sm:text-base font-extrabold font-mono text-white mt-0.5">{Math.floor((signal.duration_seconds || 900) / 60)} Mins</p>
              </div>
            </div>

            <p className="text-[11px] text-blue-100/90 leading-relaxed pt-0.5">
              ⚠️ <strong className="text-white">Risk Advisory:</strong> Trade strictly according to the official signal parameters. Unscheduled off-signal trades are subject to strict volatility loss.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[190px]">
            <button
              onClick={() => setConfirmModalOpen(true)}
              className="w-full py-3.5 sm:py-4 px-5 rounded-2xl bg-white hover:bg-blue-50 text-blue-700 font-extrabold text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Zap className="w-4 h-4 text-blue-600 fill-blue-600 group-hover:scale-110 transition-transform" />
              <span>Execute Signal Now</span>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* TRADE CONFIRMATION MODAL */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <button
              onClick={() => setConfirmModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase">
                ORDER CONFIRMATION
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">Execute Daily Signal Trade</h3>
              <p className="text-xs text-slate-500">Please review contract details before launching live execution.</p>
            </div>

            {/* Trade Details Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Instrument Asset:</span>
                <span className="font-mono font-extrabold text-slate-900 text-sm">{signal.instrument}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Order Type:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isBuy ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {signal.order_type} MARKET
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Contract Capital:</span>
                <span className="font-mono font-black text-slate-900 text-sm">${minCap.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Duration / Expiry:</span>
                <span className="font-bold text-slate-800">{Math.floor((signal.duration_seconds || 900) / 60)} Minutes ({signal.duration_seconds || 900}s)</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Expected Net Return:</span>
                <span className="font-mono font-black text-emerald-600">+${estProfit} (+{profitPct}%)</span>
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
                <span>Confirm & Place</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
