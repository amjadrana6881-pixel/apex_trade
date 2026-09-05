'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PieChart, 
  Activity, 
  CheckCircle2, 
  Percent,
  History
} from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';

export default function AssetsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/trading/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAnalytics(data.data);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  const walletBal = Number(analytics?.walletBalance ?? user?.wallet_balance ?? 0);
  const totalDeposited = Number(analytics?.totalDeposited || 0);
  const totalWithdrawn = Number(analytics?.totalWithdrawn || 0);
  const totalTrades = Number(analytics?.totalTrades || 0);
  const winsCount = Number(analytics?.winsCount || 0);
  const lossCount = Number(analytics?.lossCount || 0);
  const totalProfitWon = Number(analytics?.totalProfitWon || 0);
  const netPnL = Number(analytics?.netTradingPnL || 0);
  const winRate = Number(analytics?.winRate || 0);
  const recentTrades = analytics?.recentTrades || [];

  const isProfitable = netPnL >= 0;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Portfolio & Trading Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          100% verified realtime ledger of your trading performance, profit/loss, deposits, and spot capital.
        </p>
      </div>

      {/* Main Real Equity Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Spot Trading Capital</span>
            <h2 className="text-3xl sm:text-5xl font-black font-mono text-slate-900 mt-1">
              ${walletBal.toFixed(2)}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                isProfitable 
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                  : 'text-rose-700 bg-rose-50 border-rose-200'
              }`}>
                {isProfitable ? `+$${netPnL.toFixed(2)} Net Trading Profit` : `-$${Math.abs(netPnL).toFixed(2)} Net Trading Loss`}
              </span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {winRate}% Win Rate ({winsCount}W / {lossCount}L)
              </span>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => router.push('/wallet')}
              className="px-4 sm:px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm cursor-pointer"
            >
              Deposit Funds
            </button>
            <button
              onClick={() => router.push('/trading')}
              className="px-4 sm:px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold cursor-pointer"
            >
              Live Trading
            </button>
          </div>
        </div>

        {/* Real Performance Progress Bar */}
        <div className="pt-6 border-t border-slate-100 space-y-2">
          <div className="flex justify-between text-xs text-slate-500 font-semibold">
            <span>Trading Win Ratio: <strong className="text-emerald-600">{winsCount} Wins ({winRate}%)</strong></span>
            <span>Losses: <strong className="text-rose-600">{lossCount} Losses ({100 - winRate}%)</strong></span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${winRate}%` }}></div>
            <div className="bg-rose-400 h-full transition-all" style={{ width: `${100 - winRate}%` }}></div>
          </div>
        </div>
      </div>

      {/* Real Statistics 4-Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Deposited */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Crypto Deposited</span>
          <p className="text-2xl font-black font-mono text-slate-900">${totalDeposited.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500">Approved on blockchain</p>
        </div>

        {/* Total Withdrawn */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Withdrawn</span>
          <p className="text-2xl font-black font-mono text-slate-900">${totalWithdrawn.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500">Cleared to external wallet</p>
        </div>

        {/* Total Trades Count */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Option Contracts</span>
          <p className="text-2xl font-black font-mono text-slate-900">{totalTrades}</p>
          <p className="text-[11px] text-emerald-600 font-semibold">{winsCount} Successful Orders</p>
        </div>

        {/* Total Profit Earned */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase block">Gross Trading Profits</span>
          <p className="text-2xl font-black font-mono text-emerald-600">+${totalProfitWon.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500">Generated from wins</p>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Recent Portfolio Trades</span>
          </h3>
          <button
            onClick={() => router.push('/trading')}
            className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
          >
            View Live Trading Room →
          </button>
        </div>

        {recentTrades.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Activity className="w-8 h-8 mx-auto mb-1 text-slate-300" />
            <p className="text-xs font-semibold">No trade records found yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">Capital</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Profit / Loss</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTrades.map((t) => {
                  const isWin = t.result === 'WIN';
                  return (
                    <tr key={t._id || t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-extrabold text-slate-900">{t.pair}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          t.type === 'BUY' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">${Number(t.amount).toFixed(2)}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          isWin ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {t.result}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-extrabold">
                        <span className={isWin ? 'text-emerald-600' : 'text-rose-600'}>
                          {isWin ? `+$${Number(t.profit).toFixed(2)}` : `-$${Number(t.amount).toFixed(2)}`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 text-xs">
                        {new Date(t.created_at || t.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
