'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Radio, 
  Clock, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  History, 
  TrendingUp, 
  HelpCircle,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';
import DailySignalCard from '@/app/components/DailySignalCard';

export default function SignalsHubPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [activeSignal, setActiveSignal] = useState(null);
  const [signalHistory, setSignalHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveSignal();
    fetchSignalHistory();
  }, []);

  const fetchActiveSignal = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/signals/active`);
      const data = await res.json();
      if (data.success) {
        setActiveSignal(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSignalHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/signals/history`);
      const data = await res.json();
      if (data.success) {
        setSignalHistory(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Radio className="w-7 h-7 text-blue-600 animate-pulse" />
          <span>Daily Signals Hub & Ledger</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Official Pakistani Standard Time (PST) trading signals, community verification ledger, and algorithmic protection protocols.
        </p>
      </div>

      {/* 1. Active Signal Card */}
      <DailySignalCard signal={activeSignal} />

      {/* 2. Official Trading Protocols */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Execution Window Compliance</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Execute precisely at the designated time (<strong className="text-slate-800">07:00 PM PST</strong>). Strict window entry ensures optimal liquidity and algorithmic win execution.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Algorithmic Risk Shield</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Signal trades are backed by platform liquidity protection. Off-signal unauthorized trades are subject to 100% market loss.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Dual-Tier Return Architecture</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Standard traders earn base signal yield. Subscribing to an active Yield Staking plan automatically boosts signal returns up to <strong className="text-amber-700 font-bold">+8.50%+</strong>!
            </p>
          </div>
        </div>

        {/* 3. Verified Historical Signals Ledger */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <span>Historical Signals Audit Ledger</span>
              </h2>
              <p className="text-xs text-slate-500">Track record of all official daily signals, standard rates, and VIP boosted payouts.</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Total Broadcasts: {signalHistory.length}
            </span>
          </div>

          {signalHistory.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Radio className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold">No historical signals recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Broadcast Date</th>
                    <th className="py-3 px-4">Signal Title</th>
                    <th className="py-3 px-4">Instrument</th>
                    <th className="py-3 px-4">Order Type</th>
                    <th className="py-3 px-4">Execution (PST)</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Outcome</th>
                    <th className="py-3 px-4">Standard Return</th>
                    <th className="py-3 px-4 text-right">VIP Staking Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {signalHistory.map((s) => {
                    const isWin = s.outcome === 'WIN';
                    return (
                      <tr key={s._id || s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {new Date(s.created_at || s.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{s.title}</td>
                        <td className="py-3.5 px-4 font-extrabold text-blue-600">{s.instrument}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            s.order_type === 'BUY' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {s.order_type} MARKET
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-semibold">{s.execution_time_pst}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{s.duration_seconds}s</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isWin ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {s.outcome}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span className={isWin ? 'text-emerald-600' : 'text-rose-600'}>
                            {isWin ? `+${s.profit_percentage}%` : '-100%'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black">
                          <span className={isWin ? 'text-amber-600' : 'text-rose-600'}>
                            {isWin ? `+${s.investment_profit_percentage || (s.profit_percentage * 1.6).toFixed(2)}%` : '-100%'}
                          </span>
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
