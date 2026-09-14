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
  UserCheck
} from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';
import { formatPKT } from '@/lib/timeUtils';

export default function ReferralTreePage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [activeView, setActiveView] = useState('members'); // 'members' | 'ledger'
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
    totalCommissions: data?.totalCommissions || 0,
    totalTeamVolume: 0,
    tier1: { count: data?.directCount || 0, volume: 0, commissions: 0, rate: 10 },
    tier2: { count: data?.tree?.level2?.length || 0, volume: 0, commissions: 0, rate: 5 },
    tier3: { count: data?.tree?.level3?.length || 0, volume: 0, commissions: 0, rate: 2 }
  };

  const commissionsHistory = data?.commissionsHistory || [];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Affiliate Network & Commission Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Build your quantitative trading team and earn 3-tier lifetime commissions on all network deposits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('members')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
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
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
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

      {/* Top 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Commissions Earned */}
        <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 text-white shadow-lg shadow-emerald-950/20 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="relative z-10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Total Commissions</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40">
                INSTANT PAY
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white pt-1">
              ${summary.totalCommissions.toFixed(2)}
            </p>
            <p className="text-[11px] text-emerald-200/80 font-medium">
              Credited directly to Spot Wallet
            </p>
          </div>
        </div>

        {/* Total Team Deposit Volume */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>Network Volume</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-200">
                3 TIERS
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 pt-1">
              ${summary.totalTeamVolume.toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Combined team deposit turnover
            </p>
          </div>
        </div>

        {/* Direct Referrals (Tier 1) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Direct Referrals</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                TIER 1 (10%)
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 pt-1">
              {data?.directCount || 0}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Direct invitees registered
            </p>
          </div>
        </div>

        {/* Total Network Size */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>Network Size</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-extrabold border border-purple-200">
                ALL TIERS
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 pt-1">
              {data?.totalTeamCount || 0}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Total downline members
            </p>
          </div>
        </div>
      </div>

      {/* Referral Link & Code Sharing Box */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-black text-blue-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                3-TIER AFFILIATE COMMISSION PROGRAM
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Invite Traders & Earn Lifetime Commissions
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Earn <strong className="text-emerald-600">10% Tier 1</strong> direct bonus + <strong className="text-blue-600">5% Tier 2</strong> + <strong className="text-purple-600">2% Tier 3</strong> instant commissions on every single deposit made by your network.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-400">Your Referral Code:</span>
              <span className="px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-xl font-mono font-extrabold text-sm border border-blue-200 select-all">
                {referralCode}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                • Share with friends and trading groups
              </span>
            </div>
          </div>

          {/* Copy Box */}
          <div className="w-full lg:w-96 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <p className="text-xs font-bold text-slate-600">Your Unique Invite Link</p>
            <div className="p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs text-blue-600 truncate select-all">
              {referralLink}
            </div>
            <button
              onClick={() => handleCopy(referralLink)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Referral Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Commission Tiers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tier 1 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              TIER 1 (Direct Referrals)
            </span>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black font-mono text-slate-900">10%</p>
            <span className="text-xs font-bold text-slate-400">Commission Rate</span>
          </div>
          <p className="text-xs text-slate-500">
            Earn 10% instantly on all deposits made by users directly registered with your code.
          </p>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Direct Members:</span>
            <span className="font-extrabold text-slate-900 font-mono">{summary.tier1.count} Members</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Volume / Earned:</span>
            <span className="font-bold text-emerald-600 font-mono">
              ${summary.tier1.volume.toFixed(2)} / <strong className="font-extrabold text-emerald-700">${summary.tier1.commissions.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Tier 2 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              TIER 2 (Secondary Referrals)
            </span>
            <Network className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black font-mono text-slate-900">5%</p>
            <span className="text-xs font-bold text-slate-400">Commission Rate</span>
          </div>
          <p className="text-xs text-slate-500">
            Earn 5% on all deposits made by referrals invited by your direct members.
          </p>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Tier 2 Downlines:</span>
            <span className="font-extrabold text-slate-900 font-mono">{summary.tier2.count} Members</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Volume / Earned:</span>
            <span className="font-bold text-blue-600 font-mono">
              ${summary.tier2.volume.toFixed(2)} / <strong className="font-extrabold text-blue-700">${summary.tier2.commissions.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Tier 3 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              TIER 3 (Team Downlines)
            </span>
            <Gift className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black font-mono text-slate-900">2%</p>
            <span className="text-xs font-bold text-slate-400">Commission Rate</span>
          </div>
          <p className="text-xs text-slate-500">
            Earn 2% passive recurring commission across your extended 3rd-tier team.
          </p>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Tier 3 Downlines:</span>
            <span className="font-extrabold text-slate-900 font-mono">{summary.tier3.count} Members</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Volume / Earned:</span>
            <span className="font-bold text-purple-600 font-mono">
              ${summary.tier3.volume.toFixed(2)} / <strong className="font-extrabold text-purple-700">${summary.tier3.commissions.toFixed(2)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* VIEW 1: DOWNLINE MEMBERS DIRECTORY */}
      {activeView === 'members' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Referral Downline Explorer & Commission Attribution
              </h2>
              <p className="text-xs text-slate-500">
                View team members, their deposited volume, and exact commissions earned from each trader.
              </p>
            </div>

            <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
              {[
                { lvl: 1, label: 'Tier 1 (10%)', count: data?.tree?.level1?.length || 0 },
                { lvl: 2, label: 'Tier 2 (5%)', count: data?.tree?.level2?.length || 0 },
                { lvl: 3, label: 'Tier 3 (2%)', count: data?.tree?.level3?.length || 0 }
              ].map((item) => (
                <button
                  key={item.lvl}
                  onClick={() => setSelectedLevel(item.lvl)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
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
            <div className="text-center py-12 text-slate-400">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm">No members found in Tier {selectedLevel}.</p>
              <p className="text-xs text-slate-400 mt-1">Share your referral link to invite your first member!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Referral Code</th>
                    <th className="py-3 px-4">Total Deposited</th>
                    <th className="py-3 px-4">Commission Earned</th>
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

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        ${Number(m.totalDeposited || 0).toFixed(2)}
                        {m.depositCount > 0 && (
                          <span className="text-[10px] text-slate-400 block font-sans">
                            {m.depositCount} deposit{m.depositCount > 1 ? 's' : ''}
                          </span>
                        )}
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
          )}
        </div>
      )}

      {/* VIEW 2: DETAILED COMMISSION EARNINGS LEDGER */}
      {activeView === 'ledger' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-blue-600" />
              <span>Affiliate Commission Earnings Ledger</span>
            </h2>
            <p className="text-xs text-slate-500">
              Detailed audit trail of all affiliate bonuses credited to your spot wallet from team activities.
            </p>
          </div>

          {commissionsHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm">No commission transactions recorded yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                When your downline members make approved deposits, your commissions will appear here instantly!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Source Member</th>
                    <th className="py-3 px-4">Affiliate Tier</th>
                    <th className="py-3 px-4">Source Deposit</th>
                    <th className="py-3 px-4">Commission Paid</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissionsHistory.map((tx) => (
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

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {tx.depositAmount > 0 ? `$${tx.depositAmount.toFixed(2)}` : '—'}
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
          )}
        </div>
      )}

      {/* Safety & Financial Integrity Footer Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/10 text-emerald-400 border border-white/10 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white">
              Instant Liquidity & Spot Wallet Balance Guarantee
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              All 3-Tier referral bonuses are credited immediately as liquid capital to your Spot Wallet. You can trade or withdraw these earnings anytime.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push('/wallet')}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs shrink-0 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>View Spot Wallet</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
