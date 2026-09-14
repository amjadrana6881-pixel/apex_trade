'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Network, 
  Users, 
  Copy, 
  Check, 
  Gift, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  ArrowUpRight, 
  Clock, 
  Layers, 
  Sparkles,
  ReceiptText,
  UserCheck,
  Calendar,
  Zap,
  ChevronRight,
  Wallet
} from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';
import { formatPKT, getPakistanDateString } from '@/lib/timeUtils';

export default function ReferralTreePage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [activeView, setActiveView] = useState('members'); // 'members' | 'ledger'
  const [ledgerFilter, setLedgerFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'month'
  const [origin, setOrigin] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !token) {
      router.push('/login');
    }
  }, [loading, token, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const referralCode = user?.referral_code || 'APEX0000';
  const referralLink = origin ? `${origin}/register?ref=${referralCode}` : `https://apextrade.pro/register?ref=${referralCode}`;

  const fetchReferralData = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/referral/tree`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      }
    } catch (err) {
      console.error('Error fetching referral tree:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, [token]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const levelMembers = selectedLevel === 1 
    ? data?.tree?.level1 || []
    : selectedLevel === 2
    ? data?.tree?.level2 || []
    : data?.tree?.level3 || [];

  const summary = data?.summary || {
    todayCommissions: 0,
    yesterdayCommissions: 0,
    thisMonthCommissions: 0,
    totalCommissions: 0,
    cumulativeCommissions: 0,
    todayTeamTradeVolume: 0,
    totalTeamTradeVolume: 0,
    todayTeamTradeProfit: 0,
    totalTeamTradeProfit: 0,
    todayTeamDepositVolume: 0,
    totalTeamDepositVolume: 0,
    totalTeamVolume: 0,
    tier1: { count: data?.directCount || 0, volume: 0, commissions: 0, rate: 10 },
    tier2: { count: data?.tree?.level2?.length || 0, volume: 0, commissions: 0, rate: 5 },
    tier3: { count: data?.tree?.level3?.length || 0, volume: 0, commissions: 0, rate: 2 }
  };

  const commissionsHistory = data?.commissionsHistory || [];

  // Filter commissions ledger based on selected time filter
  const todayStr = getPakistanDateString();
  const yesterdayPkt = new Date(Date.now() + 5 * 3600000 - 86400000);
  const yesterdayStr = getPakistanDateString(yesterdayPkt);
  const currentMonthPrefix = todayStr.slice(0, 7);

  const filteredCommissions = commissionsHistory.filter(tx => {
    if (ledgerFilter === 'all') return true;
    const txDateStr = getPakistanDateString(new Date(tx.created_at));
    if (ledgerFilter === 'today') return txDateStr === todayStr;
    if (ledgerFilter === 'yesterday') return txDateStr === yesterdayStr;
    if (ledgerFilter === 'month') return txDateStr.startsWith(currentMonthPrefix);
    return true;
  });

  return (
    <div className="space-y-5 sm:space-y-6 pb-24 md:pb-8 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Affiliate Commissions & Team Network
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your earnings from 3-tier downline trading profit shares (10% Tier 1, 5% Tier 2, 2% Tier 3).
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveView('members')}
            className={`flex-1 md:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeView === 'members'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Downline Members</span>
          </button>

          <button
            onClick={() => setActiveView('ledger')}
            className={`flex-1 md:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeView === 'ledger'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>Commission Ledger ({commissionsHistory.length})</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: YOUR COMMISSION EARNINGS PERFORMANCE BANNER */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/70 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 text-white shadow-xl shadow-slate-900/15 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-white">Your Commission Payouts Overview</h2>
                <p className="text-[11px] sm:text-xs text-slate-300">All earnings are credited instantly to your liquid Spot Wallet</p>
              </div>
            </div>

            <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-white/10 text-slate-300 text-[10px] font-mono border border-white/15 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>PKT Standard Time (UTC+5)</span>
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* 1. Today's Commission */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Today's Commission</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase">
                  TODAY
                </span>
              </div>
              <p className="text-lg sm:text-2xl md:text-3xl font-black font-mono text-emerald-400 mt-1 sm:mt-2">
                +${Number(summary.todayCommissions || 0).toFixed(2)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 font-medium truncate">
                Received today from team
              </p>
            </div>

            {/* 2. Yesterday's Commission */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:border-blue-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Yesterday</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[9px] font-black uppercase">
                  CLOSED
                </span>
              </div>
              <p className="text-lg sm:text-2xl md:text-3xl font-black font-mono text-white mt-1 sm:mt-2">
                +${Number(summary.yesterdayCommissions || 0).toFixed(2)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 font-medium truncate">
                Yesterday's total earnings
              </p>
            </div>

            {/* 3. This Month's Commission */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:border-purple-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  <span>This Month</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[9px] font-black uppercase">
                  MONTHLY
                </span>
              </div>
              <p className="text-lg sm:text-2xl md:text-3xl font-black font-mono text-white mt-1 sm:mt-2">
                +${Number(summary.thisMonthCommissions || 0).toFixed(2)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 font-medium truncate">
                Total earned this month
              </p>
            </div>

            {/* 4. Total Cumulative Commission */}
            <div className="bg-gradient-to-br from-emerald-600/30 to-blue-600/20 border border-emerald-400/50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Cumulative Total</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-400 text-slate-950 text-[9px] font-black uppercase">
                  LIFETIME
                </span>
              </div>
              <p className="text-lg sm:text-2xl md:text-3xl font-black font-mono text-white mt-1 sm:mt-2">
                ${Number(summary.totalCommissions || 0).toFixed(2)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-emerald-200/90 mt-0.5 font-medium truncate">
                Total lifetime commissions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: 3 COMMISSION TIERS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {/* Tier 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              TIER 1 (Direct Referrals)
            </span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900">10%</p>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">Your Profit Share</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">You Earned</span>
              <p className="text-base sm:text-xl font-black font-mono text-emerald-600">
                +${summary.tier1.commissions.toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
            You earn 10% instantly on all daily trade profits won by users registered directly with your code.
          </p>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Direct Members:</span>
            <span className="font-extrabold text-slate-900 font-mono">{summary.tier1.count} Members</span>
          </div>
        </div>

        {/* Tier 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              TIER 2 (Secondary Referrals)
            </span>
            <Network className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900">5%</p>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">Your Profit Share</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">You Earned</span>
              <p className="text-base sm:text-xl font-black font-mono text-blue-600">
                +${summary.tier2.commissions.toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
            You earn 5% on all daily trade profits won by referrals invited by your direct members.
          </p>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Tier 2 Downlines:</span>
            <span className="font-extrabold text-slate-900 font-mono">{summary.tier2.count} Members</span>
          </div>
        </div>

        {/* Tier 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              TIER 3 (Team Downlines)
            </span>
            <Gift className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900">2%</p>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">Your Profit Share</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">You Earned</span>
              <p className="text-base sm:text-xl font-black font-mono text-purple-600">
                +${summary.tier3.commissions.toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
            You earn 2% passive recurring commission across your extended 3rd-tier team's winning trade profits.
          </p>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Tier 3 Downlines:</span>
            <span className="font-extrabold text-slate-900 font-mono">{summary.tier3.count} Members</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: REFERRAL LINK & INVITE SHARING BOX */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2 sm:space-y-2.5 max-w-xl">
            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-black text-blue-700 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>3-TIER DAILY TRADE PROFIT SHARE</span>
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Invite Traders & Earn Lifetime Commissions
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Share your link with traders. When they win daily trades, you automatically receive <strong className="text-emerald-600 font-bold">10% Tier 1</strong>, <strong className="text-blue-600 font-bold">5% Tier 2</strong>, and <strong className="text-purple-600 font-bold">2% Tier 3</strong> commission in your wallet!
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-xs font-bold text-slate-400">Your Referral Code:</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-xl font-mono font-extrabold text-xs sm:text-sm border border-blue-200 select-all">
                {referralCode}
              </span>
            </div>
          </div>

          {/* Copy Link Input & Button */}
          <div className="w-full lg:w-96 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
            <p className="text-xs font-bold text-slate-600">Your Unique Referral Link</p>
            <div className="p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs text-blue-600 truncate select-all">
              {referralLink}
            </div>
            <button
              onClick={() => handleCopy(referralLink)}
              className="w-full py-2.5 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Referral Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4: VIEW 1 - DOWNLINE MEMBERS DIRECTORY & COMMISSION ATTRIBUTION */}
      {activeView === 'members' && (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Downline Members & Your Commission Per Member
              </h2>
              <p className="text-xs text-slate-500">
                Exact commission profits you have earned from each registered trader.
              </p>
            </div>

            {/* Tier Tabs Filter */}
            <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto scrollbar-none">
              {[
                { lvl: 1, label: 'Tier 1 (10%)', count: data?.tree?.level1?.length || 0 },
                { lvl: 2, label: 'Tier 2 (5%)', count: data?.tree?.level2?.length || 0 },
                { lvl: 3, label: 'Tier 3 (2%)', count: data?.tree?.level3?.length || 0 }
              ].map((item) => (
                <button
                  key={item.lvl}
                  onClick={() => setSelectedLevel(item.lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    selectedLevel === item.lvl
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    selectedLevel === item.lvl ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {levelMembers.length === 0 ? (
            <div className="text-center py-10 sm:py-12 text-slate-400">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm">No members found in Tier {selectedLevel}.</p>
              <p className="text-xs text-slate-400 mt-1">Share your referral link to invite your first member!</p>
            </div>
          ) : (
            <>
              {/* MOBILE STACKED CARDS VIEW (Visible on screens < 768px) */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {levelMembers.map((m) => (
                  <div key={m._id || m.id} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black border border-blue-100 shrink-0">
                          {m.name ? m.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm">{m.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{m.email}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                        ACTIVE
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70 text-xs">
                      <div className="bg-white rounded-xl p-2.5 border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Your Commission</span>
                        <p className="text-sm font-black font-mono text-emerald-600 mt-0.5">
                          +${Number(m.commissionEarned || 0).toFixed(2)}
                        </p>
                        <span className="text-[10px] text-slate-400 font-bold">
                          ({m.tierRatePct || (selectedLevel === 1 ? 10 : selectedLevel === 2 ? 5 : 2)}% Share)
                        </span>
                      </div>

                      <div className="bg-white rounded-xl p-2.5 border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Member Trade Profit</span>
                        <p className="text-sm font-black font-mono text-slate-800 mt-0.5">
                          ${Number(m.totalTradeProfit || 0).toFixed(2)}
                        </p>
                        <span className="text-[10px] text-emerald-600 font-bold">
                          {m.tradeCount || 0} winning trades
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                      <span>Code: <strong className="font-mono text-blue-600 font-bold">{m.referral_code}</strong></span>
                      <span>Joined: {new Date(m.created_at || m.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE VIEW (Visible on screens >= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Referral Code</th>
                      <th className="py-3 px-4">Commission Earned By You</th>
                      <th className="py-3 px-4">Member Trade Profit</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Join Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {levelMembers.map((m) => (
                      <tr key={m._id || m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black border border-blue-100">
                            {m.name ? m.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{m.name}</p>
                            <span className="text-[10px] text-slate-400">Tier {m.tier || selectedLevel} Member</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 font-mono">
                          {m.email}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                          {m.referral_code}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-mono font-black text-xs border border-emerald-200">
                              +${Number(m.commissionEarned || 0).toFixed(2)}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              ({m.tierRatePct || (selectedLevel === 1 ? 10 : selectedLevel === 2 ? 5 : 2)}%)
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          ${Number(m.totalTradeProfit || 0).toFixed(2)}
                          {m.tradeCount > 0 && (
                            <span className="text-[10px] text-emerald-600 block font-sans font-bold">
                              {m.tradeCount} winning trade{m.tradeCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                            ACTIVE
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 text-xs font-mono">
                          {new Date(m.created_at || m.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* SECTION 5: VIEW 2 - DETAILED COMMISSION EARNINGS LEDGER */}
      {activeView === 'ledger' && (
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-blue-600" />
                <span>Your Commission Earnings Audit Ledger</span>
              </h2>
              <p className="text-xs text-slate-500">
                Detailed audit trail of all commission payouts credited to your Spot Wallet.
              </p>
            </div>

            {/* Time Filter Buttons */}
            <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'month', label: 'This Month' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setLedgerFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                    ledgerFilter === filter.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {filteredCommissions.length === 0 ? (
            <div className="text-center py-10 sm:py-12 text-slate-400">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm">No commission transactions found for this timeframe.</p>
              <p className="text-xs text-slate-400 mt-1">
                When your downline members win daily trades, your commissions will appear here instantly!
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE STACKED LEDGER CARDS (Screens < 768px) */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredCommissions.map((tx) => (
                  <div key={tx.id || tx._id} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                          {tx.sourceUser?.name ? tx.sourceUser.name[0].toUpperCase() : 'T'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-xs">{tx.sourceUser?.name || 'Downline Trader'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{formatPKT(tx.created_at)}</p>
                        </div>
                      </div>

                      <span className="font-mono font-black text-sm sm:text-base text-emerald-600">
                        +${Number(tx.amount || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-[11px]">
                      <span className={`px-2 py-0.5 rounded-full font-bold border ${
                        tx.tier === 1
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : tx.tier === 2
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        Tier {tx.tier} ({tx.tier === 1 ? '10%' : tx.tier === 2 ? '5%' : '2%'})
                      </span>

                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Credited to Wallet</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE VIEW (Screens >= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-4">Date & Time (PKT)</th>
                      <th className="py-3 px-4">Source Member</th>
                      <th className="py-3 px-4">Affiliate Tier</th>
                      <th className="py-3 px-4">Commission Earned By You</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCommissions.map((tx) => (
                      <tr key={tx.id || tx._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                          {formatPKT(tx.created_at)}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                              {tx.sourceUser?.name ? tx.sourceUser.name[0].toUpperCase() : 'T'}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900">{tx.sourceUser?.name || 'Downline Trader'}</p>
                              {tx.sourceUser?.email && (
                                <p className="text-[10px] text-slate-400 font-mono">{tx.sourceUser.email}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            tx.tier === 1
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : tx.tier === 2
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            Tier {tx.tier} ({tx.tier === 1 ? '10%' : tx.tier === 2 ? '5%' : '2%'})
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono font-black text-sm text-emerald-600">
                            +${Number(tx.amount || 0).toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-black text-[10px] flex items-center gap-1 w-fit border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Credited to Spot Wallet</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* SECTION 6: FOOTER BALANCE GUARANTEE NOTICE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/10 text-emerald-400 border border-white/10 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-white">
              Instant Liquidity & Spot Wallet Balance Guarantee
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              All 3-Tier trade profit commissions are credited immediately as liquid capital to your Spot Wallet. You can trade or withdraw these earnings anytime.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push('/wallet')}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs shrink-0 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Wallet className="w-4 h-4 text-slate-900" />
          <span>View Spot Wallet</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
