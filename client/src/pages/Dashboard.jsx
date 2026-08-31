import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Radio, 
  Zap, 
  ShieldCheck, 
  Smartphone,
  Download,
  Clock
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth, API_BASE } from '../context/AuthContext';
import DailySignalCard from '../components/DailySignalCard';

export default function Dashboard() {
  const { pairs } = useSocket();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSignal, setActiveSignal] = useState(null);

  const categories = ['All', 'Crypto', 'Forex', 'Commodities', 'Stocks'];

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

  const filteredPairs = activeCategory === 'All' 
    ? pairs 
    : pairs.filter(p => p.category === activeCategory);

  const walletBal = Number(user?.wallet_balance || 0);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* 1. Daily Signal Active Banner */}
      <DailySignalCard signal={activeSignal} />

      {/* 2. Top Account Summary & Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Spot Balance Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Spot Balance</span>
            <h3 className="text-3xl sm:text-4xl font-black font-mono text-slate-900 mt-1">
              ${walletBal.toFixed(2)}
            </h3>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/wallet')}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Deposit Crypto
            </button>
            <button
              onClick={() => navigate('/trading')}
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
            <p className="text-xs text-slate-500 mt-1">View official Pakistani Time signals and verified community results ledger.</p>
          </div>

          <button
            onClick={() => navigate('/signals')}
            className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs border border-blue-200 shadow-2xs transition-colors cursor-pointer"
          >
            Open Signals Ledger →
          </button>
        </div>

        {/* Android Native APK Download Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-200" />
              <span className="text-xs font-black uppercase text-blue-200">Native Android App</span>
            </div>
            <h3 className="text-xl font-extrabold mt-1">Get ApexTrade APK</h3>
            <p className="text-xs text-blue-100 mt-1">Direct live streaming with hardware acceleration.</p>
          </div>

          <a
            href="/downloads/ApexTrade.apk"
            download="ApexTrade.apk"
            className="w-full py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Download APK (Direct)</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredPairs.map((pair) => {
            const isPos = Number(pair.change) >= 0;
            return (
              <div
                key={pair.symbol}
                onClick={() => navigate(`/trading?pair=${pair.symbol}`)}
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
      </div>
    </div>
  );
}
