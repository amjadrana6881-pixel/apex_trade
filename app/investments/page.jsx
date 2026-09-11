'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Layers, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Zap,
  Lock,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Award
} from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';

export default function InvestmentsPage() {
  const router = useRouter();
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
            setInvestAmount(data.data[0].min_amount || 50);
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
    if (!token) {
      router.push('/login');
      return;
    }
    if (!selectedPkg) return;

    if (investAmount < selectedPkg.min_amount || investAmount > selectedPkg.max_amount) {
      return alert(`Investment amount must be between $${selectedPkg.min_amount} and $${selectedPkg.max_amount}`);
    }

    if (investAmount > (user?.wallet_balance || 0)) {
      return alert(`Insufficient balance in wallet. You have $${Number(user?.wallet_balance || 0).toFixed(2)} available.`);
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
      setMsg('❌ Failed to process investment.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetMax = () => {
    if (user?.wallet_balance) {
      const maxAllowed = Math.min(user.wallet_balance, selectedPkg?.max_amount || 999999);
      setInvestAmount(Math.floor(maxAllowed));
    }
  };

  const activePositions = myInvestments.filter(i => i.status === 'ACTIVE');
  const completedPositions = myInvestments.filter(i => i.status !== 'ACTIVE');

  return (
    <div className="space-y-8 pb-20 md:pb-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Institutional Yield Staking
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
              VIP Yield Boost
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Lock your balance for fixed terms (7d, 14d, 21d, 30d) to earn guaranteed returns + trade freely with boosted VIP Signal profit rates.
          </p>
        </div>

        {summary.hasVipBoost && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2 shrink-0 animate-pulse">
            <Sparkles className="w-5 h-5 text-amber-200" />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-amber-100">VIP Status</p>
              <p className="text-xs font-black">Boosted Signal Return Active</p>
            </div>
          </div>
        )}
      </div>

      {/* Portfolio Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <p className="text-xs font-bold uppercase tracking-wider">Active Staked Principal</p>
            <Lock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-black font-mono text-slate-900">
            ${Number(summary.totalInvested || user?.investment_balance || 0).toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400">Locked in earning yield</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <p className="text-xs font-bold uppercase tracking-wider">Active Plans</p>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black font-mono text-emerald-600">
            {summary.activeCount || 0}
          </p>
          <p className="text-[11px] text-emerald-700">Subscribed staking tiers</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <p className="text-xs font-bold uppercase tracking-wider">Total Profit Accrued</p>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-black font-mono text-blue-600">
            +${Number(summary.totalProfitEarned || 0).toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400">Credited directly to wallet</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <p className="text-xs font-bold uppercase tracking-wider">Trading Freedom</p>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-base font-black text-slate-800">
            100% Available
          </p>
          <p className="text-[11px] text-amber-700 font-semibold">Full balance tradeable on signals</p>
        </div>
      </div>

      {/* HOW IT WORKS BANNER */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="font-extrabold text-white text-base sm:text-lg">How Institutional Staking & VIP Boost Works</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1 text-xs">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-xs">1</span>
            <h4 className="font-bold text-white text-sm">Choose Staking Term</h4>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Select 7 Days (15%), 14 Days (22%), 21 Days (28%), or 30 Days (35%) guaranteed profit plan.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black flex items-center justify-center text-xs">2</span>
            <h4 className="font-bold text-white text-sm">Trade Freely with Full Balance</h4>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Your wallet balance is NOT taken away! You can still trade everyday with your full capital.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black flex items-center justify-center text-xs">3</span>
            <h4 className="font-bold text-white text-sm">VIP Signal Profit Boost</h4>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              While your plan is active, every daily signal trade pays out at the higher VIP rate!
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-purple-500 text-white font-black flex items-center justify-center text-xs">4</span>
            <h4 className="font-bold text-white text-sm">Maturity Payout</h4>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Upon maturity, guaranteed yield profit is credited to your wallet and withdrawal locks are released.
            </p>
          </div>
        </div>
      </div>

      {/* ACTIVE STAKING POSITIONS TRACKER */}
      {activePositions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>My Active Staking Positions ({activePositions.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Withdrawals are locked until maturity date. Full balance remains active for daily trading with VIP Boost.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>{summary.daysRemaining || 1} Days Remaining</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePositions.map((inv) => {
              const matureDate = new Date(inv.matures_at || (new Date(inv.created_at).getTime() + (inv.duration_days || 7) * 86400 * 1000));
              const startDate = new Date(inv.created_at);
              const totalMs = matureDate.getTime() - startDate.getTime();
              const passedMs = Date.now() - startDate.getTime();
              const progressPct = Math.min(100, Math.max(5, Math.round((passedMs / totalMs) * 100)));
              const daysLeft = Math.max(0, Math.ceil((matureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

              return (
                <div key={inv._id || inv.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                        {inv.package_name}
                      </span>
                      <p className="text-lg font-black text-slate-900 mt-1 font-mono">${Number(inv.amount).toFixed(2)} Staked</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 font-bold uppercase">Expected Profit</span>
                      <p className="text-base font-black font-mono text-emerald-600">
                        +${Number(inv.expected_profit || (inv.amount * inv.total_roi / 100)).toFixed(2)} (+{inv.total_roi}%)
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                      <span>Term Progress ({inv.duration_days} Days)</span>
                      <span>{daysLeft} days remaining</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-2 font-medium">
                    <span>Matures On: <strong>{matureDate.toLocaleDateString()}</strong></span>
                    <span className="text-emerald-700 font-bold">VIP Signal Boost Active</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AVAILABLE INVESTMENT TIERS GRID */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Available Yield Staking Tiers</h2>
          <p className="text-xs text-slate-500">Select a term to view details and subscribe.</p>
        </div>
        
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
                className={`bg-white border-2 rounded-3xl p-6 shadow-xs cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden ${
                  isSelected ? 'border-blue-600 shadow-lg shadow-blue-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl">
                    Selected
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                      {pkg.tag || 'Tier Plan'}
                    </span>
                    <span className="text-sm font-black text-emerald-600 font-mono">
                      +{pkg.total_return_roi}% ROI
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900">{pkg.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{pkg.description}</p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Term Duration</span>
                      <strong className="text-slate-900 font-black">{pkg.duration_days} Days</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Guaranteed Profit</span>
                      <strong className="text-emerald-600 font-black">+{pkg.total_return_roi}% Return</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Limits</span>
                      <strong className="text-slate-900 font-mono font-bold">${pkg.min_amount} - ${pkg.max_amount}</strong>
                    </div>
                    <div className="flex justify-between text-slate-500 border-t border-slate-200 pt-1.5">
                      <span>Signal Boost</span>
                      <strong className="text-amber-600 font-black">VIP Rate Rate</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={`mt-4 w-full py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSelected ? 'Ready to Stake' : 'Select Plan'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SUBSCRIPTION ACTION BOX */}
      {selectedPkg && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">Stake in {selectedPkg.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                  +{selectedPkg.total_return_roi}% Payout
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Duration: <strong className="text-slate-800">{selectedPkg.duration_days} Days</strong> | Expected Net Profit: <strong className="text-emerald-600">+${Number((investAmount * selectedPkg.total_return_roi) / 100).toFixed(2)}</strong>.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold">Available Spot Balance</span>
              <p className="text-xl font-black font-mono text-slate-900">${Number(user?.wallet_balance || 0).toFixed(2)}</p>
            </div>
          </div>

          {msg && (
            <div className={`p-4 rounded-2xl text-xs font-bold ${
              msg.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleInvest} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-600">Staking Capital Amount ($)</label>
                  <button
                    type="button"
                    onClick={handleSetMax}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    Use Max Available
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min={selectedPkg.min_amount}
                    max={selectedPkg.max_amount}
                    required
                    value={investAmount}
                    onChange={(e) => setInvestAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-4 py-3 font-mono font-bold text-slate-900 text-base focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
              >
                {loading ? 'Processing...' : `Confirm & Stake ($${Number(investAmount).toFixed(0)})`}
              </button>
            </div>

            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-blue-800">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Guaranteed Liquidity & Trading Rules:</span>
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-blue-800/90">
                <li>Your full wallet balance remains available to execute daily trading signals.</li>
                <li>Withdrawals are locked during the {selectedPkg.duration_days}-day active term to guarantee yield.</li>
                <li>On day {selectedPkg.duration_days}, +${Number((investAmount * selectedPkg.total_return_roi) / 100).toFixed(2)} (+{selectedPkg.total_return_roi}%) profit is automatically deposited to your wallet.</li>
              </ul>
            </div>
          </form>
        </div>
      )}

      {/* COMPLETED POSITIONS HISTORY */}
      {completedPositions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900">Matured & Completed Staking Positions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Plan Name</th>
                  <th className="py-3 px-3">Staked Capital</th>
                  <th className="py-3 px-3">Return ROI</th>
                  <th className="py-3 px-3">Profit Paid Out</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Completion Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedPositions.map((inv) => (
                  <tr key={inv._id || inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-extrabold text-slate-900">{inv.package_name}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">${Number(inv.amount).toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600">+{inv.total_roi}%</td>
                    <td className="py-3 px-3 font-mono font-extrabold text-blue-600">+${Number(inv.total_profit_earned).toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {new Date(inv.completed_at || inv.matures_at || inv.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
