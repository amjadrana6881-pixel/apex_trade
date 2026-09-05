'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Zap,
  Calculator
} from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';

export default function InvestmentsPage() {
  const { user, token, fetchProfile } = useAuth();

  const [packages, setPackages] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);
  const [summary, setSummary] = useState({});
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [investAmount, setInvestAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/investments/packages`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setPackages(data.data);
          if (data.data.length > 0) {
            setSelectedPkg(data.data[0]);
            setInvestAmount(data.data[0].min_amount || 100);
          }
        }
      })
      .catch(console.error);

    if (token) {
      fetchMyInvestments();
    }
  }, [token]);

  const fetchMyInvestments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/investments/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMyInvestments(data.data?.investments || []);
        setSummary(data.data?.summary || {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvest = async (e) => {
    e.preventDefault();
    if (!token) return alert('Please login first');
    if (!selectedPkg) return;

    if (investAmount < selectedPkg.min_amount || investAmount > selectedPkg.max_amount) {
      return alert(`Investment amount must be between $${selectedPkg.min_amount} and $${selectedPkg.max_amount}`);
    }

    if (investAmount > (user?.wallet_balance || 0)) {
      return alert('Insufficient balance in wallet.');
    }

    try {
      setLoading(true);
      setMsg('');
      const res = await fetch(`${API_BASE}/api/investments/invest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          packageId: selectedPkg._id || selectedPkg.id,
          amount: investAmount
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✅ ' + data.message);
        fetchProfile();
        fetchMyInvestments();
      } else {
        setMsg('❌ ' + data.message);
      }
    } catch (err) {
      setMsg('❌ Failed to invest.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 md:pb-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Automated Daily Yield Packages
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Subscribe to institutional algorithmic strategies with automated daily ROI payouts credited to your wallet.
        </p>
      </div>

      {/* Portfolio Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Active Invested Principal</p>
          <p className="text-3xl font-black font-mono text-slate-900">
            ${Number(summary.totalInvested || user?.investment_balance || 0).toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400">Locked in earning yield</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Daily Profit Inflow</p>
          <p className="text-3xl font-black font-mono text-emerald-600">
            +${Number(summary.totalDailyRoi || 0).toFixed(2)}/day
          </p>
          <p className="text-[11px] text-emerald-700">Automated 24h disbursements</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Profit Accrued</p>
          <p className="text-3xl font-black font-mono text-blue-600">
            +${Number(summary.totalProfitEarned || 0).toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400">Paid out to spot balance</p>
        </div>
      </div>

      {/* Investment Plans Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900">Available Investment Strategies</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((pkg) => {
            const isSelected = (selectedPkg?._id === pkg._id || selectedPkg?.id === pkg.id);
            return (
              <div
                key={pkg._id || pkg.id}
                onClick={() => {
                  setSelectedPkg(pkg);
                  setInvestAmount(pkg.min_amount);
                }}
                className={`bg-white border-2 rounded-3xl p-6 shadow-xs cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected ? 'border-blue-600 shadow-md shadow-blue-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700">
                      {pkg.tag || 'Tier Plan'}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 font-mono">
                      +{pkg.daily_roi}% Daily
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900">{pkg.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{pkg.description}</p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Term Duration</span>
                      <strong className="text-slate-900">{pkg.duration_days} Days</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Total Net Return</span>
                      <strong className="text-emerald-600">+{pkg.total_return_roi}%</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Min / Max Limit</span>
                      <strong className="text-slate-900 font-mono">${pkg.min_amount} - ${pkg.max_amount}</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={`mt-4 w-full py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscription Action Box */}
      {selectedPkg && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Subscribe to {selectedPkg.name}</h3>
              <p className="text-xs text-slate-500">
                Earn <strong className="text-emerald-600">+{selectedPkg.daily_roi}% daily</strong> for {selectedPkg.duration_days} days.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold">Available Wallet</span>
              <p className="text-lg font-black font-mono text-slate-900">${Number(user?.wallet_balance || 0).toFixed(2)}</p>
            </div>
          </div>

          {msg && (
            <div className={`p-4 rounded-2xl text-xs font-bold ${
              msg.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleInvest} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-1.5">
              <label className="block text-xs font-bold text-slate-600">Investment Capital ($)</label>
              <input
                type="number"
                min={selectedPkg.min_amount}
                max={selectedPkg.max_amount}
                required
                value={investAmount}
                onChange={(e) => setInvestAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-mono font-bold text-slate-900 text-base focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
            >
              {loading ? 'Subscribing...' : 'Confirm Subscription'}
            </button>
          </form>
        </div>
      )}

      {/* Active Investments Tracker */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">My Active Investment Positions</h3>
        
        {myInvestments.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No active investment packages subscribed.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Plan Name</th>
                  <th className="py-3 px-3">Principal</th>
                  <th className="py-3 px-3">Daily ROI</th>
                  <th className="py-3 px-3">Total Earned</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Start Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myInvestments.map((inv) => (
                  <tr key={inv._id || inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-extrabold text-slate-900">{inv.package_name}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">${Number(inv.amount).toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600">+${Number(inv.daily_profit).toFixed(2)}/day</td>
                    <td className="py-3 px-3 font-mono font-extrabold text-blue-600">+${Number(inv.total_profit_earned).toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {new Date(inv.created_at || inv.createdAt).toLocaleDateString()}
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
