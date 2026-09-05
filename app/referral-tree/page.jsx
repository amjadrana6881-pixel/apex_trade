'use client';

import React, { useState, useEffect } from 'react';
import { Network, Users, Copy, Check, Gift } from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';

export default function ReferralTreePage() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const referralCode = user?.referral_code || 'APEX0000';
  const referralLink = origin ? `${origin}/register?ref=${referralCode}` : `https://apextrade.pro/register?ref=${referralCode}`;

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/referral/tree`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(resData => {
          if (resData.success) {
            setData(resData.data);
          }
        })
        .catch(console.error);
    }
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

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Affiliate Network & Referral Tree
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Build your network and earn 3-tier lifetime commissions on all team deposits.
        </p>
      </div>

      {/* Referral Link Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-black text-blue-700">
              3-TIER AFFILIATE PROGRAM
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Invite Traders & Earn Lifetime Commissions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg">
              Earn <strong className="text-emerald-600">10% Tier 1</strong> direct bonus + <strong className="text-blue-600">5% Tier 2</strong> + <strong className="text-purple-600">2% Tier 3</strong> instant commissions on every single deposit.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">Your Referral Code:</span>
              <span className="px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-xl font-mono font-extrabold text-sm border border-blue-200">
                {referralCode}
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
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              TIER 1 (Direct)
            </span>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black font-mono text-slate-900">10%</p>
          <p className="text-xs text-slate-500">Earn 10% instantly on all deposits made by users registered with your code.</p>
          <div className="pt-2 text-xs font-bold text-slate-700">
            Direct Referrals: <span className="text-emerald-600 font-extrabold">{data?.directCount || 0} Members</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              TIER 2 (Secondary)
            </span>
            <Network className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-black font-mono text-slate-900">5%</p>
          <p className="text-xs text-slate-500">Earn 5% on all deposits made by referrals of your direct members.</p>
          <div className="pt-2 text-xs font-bold text-slate-700">
            Tier 2 Downlines: <span className="text-blue-600 font-extrabold">{data?.tree?.level2?.length || 0} Members</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              TIER 3 (Team)
            </span>
            <Gift className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-black font-mono text-slate-900">2%</p>
          <p className="text-xs text-slate-500">Earn 2% passive recurring commission across your extended 3rd-tier team.</p>
          <div className="pt-2 text-xs font-bold text-slate-700">
            Tier 3 Downlines: <span className="text-purple-600 font-extrabold">{data?.tree?.level3?.length || 0} Members</span>
          </div>
        </div>
      </div>

      {/* Downline Tree Explorer */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Referral Downline Explorer</h2>
            <p className="text-xs text-slate-500">View team members registered in your referral hierarchy.</p>
          </div>

          <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
            {[1, 2, 3].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tier {lvl}
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
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {levelMembers.map((m) => (
                  <tr key={m._id || m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                        {m.name ? m.name[0].toUpperCase() : 'U'}
                      </div>
                      <span>{m.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{m.email}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{m.referral_code}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {new Date(m.created_at || m.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
