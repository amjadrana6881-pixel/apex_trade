'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  Radio, 
  Zap, 
  ShieldCheck, 
  Smartphone,
  Download,
  Clock,
  Layers,
  Sparkles,
  User as UserIcon,
  CheckCircle2,
  Copy,
  Check,
  Headphones,
  ArrowDownLeft,
  AlertCircle
} from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';
import DailySignalCard from '@/app/components/DailySignalCard';

export default function Dashboard() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [pairs, setPairs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSignal, setActiveSignal] = useState(null);
  const [loadingPairs, setLoadingPairs] = useState(true);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [copiedRef, setCopiedRef] = useState(false);

  const categories = ['All', 'Crypto', 'Forex', 'Commodities', 'Stocks'];

  // Fetch Trading Pairs & poll for real-time prices
  useEffect(() => {
    let isMounted = true;

    const fetchPairs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/trading/pairs`);
        const data = await res.json();
        if (isMounted) {
          const list = Array.isArray(data.pairs) ? data.pairs : Array.isArray(data.data) ? data.data : [];
          if (list.length > 0) {
            setPairs(list);
          }
          setLoadingPairs(false);
        }
      } catch (err) {
        console.error('Error loading trading pairs:', err);
        if (isMounted) setLoadingPairs(false);
      }
    };

    fetchPairs();
    const interval = setInterval(fetchPairs, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch Active Daily Signal
  useEffect(() => {
    fetch(`${API_BASE}/api/signals/active`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setActiveSignal(data.data);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch User Pending Deposits for realtime feedback
  useEffect(() => {
    if (!token) return;
    const checkDeposits = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/wallet/transactions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          const depList = Array.isArray(data.data.deposits) 
            ? data.data.deposits 
            : [];
          setPendingDeposits(depList.filter(d => d.status === 'PENDING'));
        }
      } catch (e) {}
    };
    checkDeposits();
    const interval = setInterval(checkDeposits, 3000);
    return () => clearInterval(interval);
  }, [token]);

  const handleCopyReferral = () => {
    if (!user?.referral_code) return;
    navigator.clipboard.writeText(user.referral_code);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const filteredPairs = activeCategory === 'All' 
    ? pairs 
    : pairs.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());

  const walletBal = Number(user?.wallet_balance || 0);

  return (
    <div className="space-y-6">

      {/* 0. LOGGED IN USER PROFILE & VERIFICATION BADGE CARD */}
      {user && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* User Identity & Badges */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-blue-500/30 shrink-0 border border-white/20">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {user.name || 'Trader Account'}
                  </h1>
                  
                  {/* Verified Trader Badge */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black tracking-wider uppercase shadow-xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Verified Trader
                  </span>

                  {/* VIP Level Badge */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black tracking-wider uppercase">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    VIP Tier 1
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                  <span>{user.email}</span>
                  {user.referral_code && (
                    <>
                      <span>•</span>
                      <button
                        onClick={handleCopyReferral}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-blue-300 text-[11px] font-mono transition-colors cursor-pointer border border-slate-700"
                        title="Copy Referral Code"
                      >
                        {copiedRef ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        <span>Ref: {user.referral_code}</span>
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Balance & Action Shortcuts */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex-1 sm:flex-none">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Spot Available</span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  ${walletBal.toFixed(2)}
                </span>
              </div>

              <Link
                href="/wallet"
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Deposit USDT</span>
              </Link>

              <Link
                href="/contact"
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              >
                <Headphones className="w-4 h-4 text-amber-400" />
                <span>Live Support</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* PENDING DEPOSIT IN REVIEW BANNER */}
      {pendingDeposits.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-900">
                ⏳ Deposit Request Submitted (${Number(pendingDeposits[0].amount).toFixed(2)} USDT via {pendingDeposits[0].network})
              </h4>
              <p className="text-[11px] text-amber-700">
                Your deposit is currently awaiting blockchain verification by the administration desk. Once verified, it will be credited immediately to your spot balance.
              </p>
            </div>
          </div>
          <Link
            href="/wallet"
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shrink-0 shadow-xs"
          >
            View Status
          </Link>
        </div>
      )}
      
      {/* 1. Daily Signal Active Card */}
      {activeSignal && <DailySignalCard signal={activeSignal} />}

      {/* 2. Top Account Summary & Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Spot Balance Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Balance</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black border border-emerald-100">
                Live Spot
              </span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black font-mono text-slate-900 mt-1">
              ${walletBal.toFixed(2)}
            </h3>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push('/wallet')}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Deposit Crypto
            </button>
            <button
              onClick={() => router.push('/trading')}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
            >
              Trade Live
            </button>
          </div>
        </div>

        {/* Daily Signals Hub Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-1.5 text-blue-600">
              <Radio className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-extrabold uppercase">Official Signals</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Daily Signals Hub
            </h3>
            <p className="text-xs text-slate-500 mt-1">Official high-probability signals with guaranteed algorithmic risk settlement.</p>
          </div>

          <button
            onClick={() => router.push('/signals')}
            className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs border border-blue-200 shadow-2xs transition-colors cursor-pointer"
          >
            Open Signals Ledger →
          </button>
        </div>

        {/* Android Native APK Download Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-md shadow-blue-500/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-200" />
              <span className="text-xs font-black uppercase text-blue-200">Native Android App</span>
            </div>
            <h3 className="text-xl font-extrabold mt-1">ApexTrade PRO APK</h3>
            <p className="text-xs text-blue-100 mt-1">
              Lock-screen signal countdowns (20m, 10m, 5m), instant profit alerts & live support push notifications.
            </p>
          </div>

          <a
            href="/api/download/apk?type=user"
            download="ApexTrade_User.apk"
            className="w-full py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Download Trader APK (Direct)</span>
          </a>
        </div>
      </div>

      {/* 3. Live Markets Overview */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Financial Markets & Assets</h2>
            <p className="text-xs text-slate-500">Live prices streamed via realtime institutional liquidity providers.</p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Market Grid Cards */}
        {loadingPairs && pairs.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-36 bg-slate-100 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredPairs.map((pair) => {
              const isPos = Number(pair.change) >= 0;
              return (
                <div
                  key={pair.symbol}
                  onClick={() => router.push(`/trading?pair=${pair.symbol}`)}
                  className="bg-white border border-slate-200 hover:border-blue-300 rounded-3xl p-5 shadow-xs transition-all hover:shadow-md cursor-pointer space-y-3 group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                        {pair.symbol}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">{pair.name}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase">
                      {pair.category}
                    </span>
                  </div>

                  <div className="flex justify-between items-end pt-1">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Price</span>
                      <p className="text-base sm:text-lg font-black font-mono text-slate-900 mt-0.5">
                        ${Number(pair.current_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-black flex items-center justify-end gap-0.5 ${isPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>{isPos ? `+${pair.change}%` : `${pair.change}%`}</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                        Payout: <strong className="text-slate-700 font-mono">{pair.payout_rate || 88}%</strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
