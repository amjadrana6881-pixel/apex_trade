'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  History,
  ChevronDown,
  Zap,
  ShieldAlert,
  HelpCircle,
  Percent,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';
import TradingViewChart from '@/app/components/TradingViewChart';
import LiveTradePulseGraph from '@/app/components/LiveTradePulseGraph';
import { formatPKT } from '@/lib/timeUtils';

function TradingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialPair = searchParams.get('pair') || 'BTCUSDT';
  const initialType = searchParams.get('type') || 'BUY';
  const initialDuration = Number(searchParams.get('duration')) || 60;
  const initialAmount = Number(searchParams.get('amount')) || 100;
  const autoConfirm = searchParams.get('autoConfirm') === 'true';

  const { user, token, fetchProfile } = useAuth();

  const [pairs, setPairs] = useState([]);
  const [selectedPair, setSelectedPair] = useState(initialPair);
  const [tradeType, setTradeType] = useState(initialType);
  const [tradeAmount, setTradeAmount] = useState(initialAmount);
  const [duration, setDuration] = useState(Math.min(900, initialDuration));
  const [loading, setLoading] = useState(false);
  const [tradeError, setTradeError] = useState('');

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(autoConfirm);

  // Active Running Trade Execution State
  const [activeTrade, setActiveTrade] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [isCountdownModalOpen, setIsCountdownModalOpen] = useState(true);
  const [tradeResult, setTradeResult] = useState(null);
  const countdownTimerRef = useRef(null);

  // User Trade History
  const [tradeHistory, setTradeHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyMeta, setHistoryMeta] = useState({});

  // Active Daily Signal
  const [activeSignal, setActiveSignal] = useState(null);

  // 1. Fetch live pairs with periodic polling
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
        }
      } catch (err) {
        console.error('Failed to load pairs:', err);
      }
    };
    fetchPairs();
    const interval = setInterval(fetchPairs, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Fetch Active Daily Signal
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

  // 3. Check for running background trade on load / refresh
  useEffect(() => {
    if (token) {
      checkActiveRunningTrade();
    }
  }, [token]);

  const checkActiveRunningTrade = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/trading/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && data.hasActiveTrade && data.trade) {
        setActiveTrade(data.trade);
        setCountdown(data.secondsRemaining || 0);
        setIsCountdownModalOpen(true);
        startCountdownTimer(data.trade.id, data.secondsRemaining || 0);
      } else if (data.lastResolvedTrade) {
        setTradeResult(data.lastResolvedTrade);
        fetchProfile();
        fetchTradeHistory(1);
      }
    } catch (err) {
      console.error('Failed to check active trade:', err);
    }
  };

  const currentPairData = pairs.find(p => p.symbol === selectedPair) || {
    symbol: selectedPair,
    name: 'Bitcoin/USDT',
    current_price: 91450.00,
    payout_rate: 88.0,
    change: 3.4
  };

  const durations = [
    { label: '30s', value: 30 },
    { label: '60s (1m)', value: 60 },
    { label: '120s (2m)', value: 120 },
    { label: '180s (3m)', value: 180 },
    { label: '300s (5m)', value: 300 },
    { label: '900s (15m)', value: 900 },
  ];

  const userBal = Number(user?.wallet_balance || 0);

  const handleSetPercentAmount = (pct) => {
    if (userBal <= 0) {
      setTradeAmount(10);
      return;
    }
    const calc = Math.floor((userBal * pct) / 100);
    setTradeAmount(Math.max(1, calc));
  };

  useEffect(() => {
    if (token) {
      fetchTradeHistory(historyPage);
    }
  }, [token, historyPage]);

  const fetchTradeHistory = async (page) => {
    try {
      const res = await fetch(`${API_BASE}/api/trading/history?page=${page}&pageSize=8`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTradeHistory(data.data || []);
        setHistoryMeta(data.meta || {});
      }
    } catch (err) {
      console.error('Failed to load trade history:', err);
    }
  };

  // Open Confirmation Modal
  const handleInitiateOrder = (type) => {
    if (!token) {
      router.push('/login');
      return;
    }

    if (tradeAmount <= 0) {
      setTradeError('Please enter a valid trade amount.');
      return;
    }

    if (userBal < tradeAmount) {
      setTradeError(`Insufficient balance. You have $${userBal.toFixed(2)} in your wallet.`);
      return;
    }

    setTradeType(type);
    setTradeError('');
    setShowConfirmModal(true);
  };

  // Final Trade Execution
  const handleConfirmAndExecute = async () => {
    setShowConfirmModal(false);

    try {
      setLoading(true);
      setTradeError('');
      setTradeResult(null);

      const res = await fetch(`${API_BASE}/api/trading/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pair: selectedPair,
          type: tradeType,
          amount: tradeAmount,
          duration: duration
        })
      });

      const data = await res.json();

      if (!data.success) {
        setTradeError(data.error || 'Trade execution failed.');
        setLoading(false);
        return;
      }

      // Trade started successfully
      setActiveTrade(data.trade);
      const totalSec = data.session?.durationSec || duration;
      setCountdown(totalSec);
      setIsCountdownModalOpen(true);
      fetchProfile();

      startCountdownTimer(data.trade.id, totalSec);

    } catch (err) {
      console.error('Trade start error:', err);
      setTradeError('Network error executing trade.');
    } finally {
      setLoading(false);
    }
  };

  const startCountdownTimer = (tradeId, initialSec) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    let remaining = initialSec;
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(Math.max(0, remaining));

      if (remaining <= 0) {
        clearInterval(countdownTimerRef.current);
        resolveTrade(tradeId);
      }
    }, 1000);
  };

  // Resolve Trade Outcome
  const resolveTrade = async (tradeId) => {
    try {
      const res = await fetch(`${API_BASE}/api/trading/${tradeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.trade) {
        setActiveTrade(null);
        setTradeResult(data.trade);
        fetchProfile();
        fetchTradeHistory(1);
      }
    } catch (err) {
      console.error('Resolve trade error:', err);
    }
  };

  const isMatchingActiveSignal = activeSignal && 
    activeSignal.instrument?.replace('/', '').toUpperCase() === selectedPair?.replace('/', '').toUpperCase() &&
    activeSignal.order_type?.toUpperCase() === tradeType?.toUpperCase();

  const payoutRate = isMatchingActiveSignal && activeSignal.profit_percentage > 0
    ? activeSignal.profit_percentage
    : (currentPairData.payout_rate || 88.0);

  const estimatedProfit = ((tradeAmount * payoutRate) / 100).toFixed(2);
  const estimatedTotal = (Number(tradeAmount) + Number(estimatedProfit)).toFixed(2);

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6">
      
      {/* Active Signal Notice Banner */}
      {activeSignal && (
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-blue-700 uppercase">Today's Official Signal</span>
                <span className="text-[11px] font-bold text-slate-500">{activeSignal.execution_time_pst}</span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5">
                {activeSignal.instrument} • {activeSignal.order_type} MARKET • {Math.floor((activeSignal.duration_seconds || 900) / 60)} Mins Duration
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedPair(activeSignal.instrument.replace('/', ''));
              setTradeType(activeSignal.order_type);
              setDuration(activeSignal.duration_seconds || 900);
              setShowConfirmModal(true);
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold whitespace-nowrap shadow-sm cursor-pointer"
          >
            Apply & Execute Signal
          </button>
        </div>
      )}

      {/* Floating Minimized Running Trade Badge */}
      {activeTrade && !isCountdownModalOpen && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3.5 sm:p-4 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-mono font-black text-sm">
              {countdown}s
            </div>
            <div>
              <p className="text-xs font-black">{activeTrade.pair} • {activeTrade.type} (${Number(activeTrade.amount).toFixed(2)})</p>
              <p className="text-[10px] text-blue-100">Trade running on server. Click to view live seconds.</p>
            </div>
          </div>

          <button
            onClick={() => setIsCountdownModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white text-blue-700 font-black text-xs hover:bg-blue-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Open Countdown</span>
          </button>
        </div>
      )}

      {/* Main Trading Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Chart Column (8 cols) */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6 order-1">
          
          {/* Pair Selector Strip */}
          <div className="bg-white border border-slate-200 rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial min-w-[170px]">
                <select
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                  className="w-full appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm sm:text-base font-black rounded-2xl pl-3.5 pr-8 py-2 focus:outline-none focus:border-blue-500 cursor-pointer truncate"
                >
                  {pairs.map((p) => (
                    <option key={p.symbol} value={p.symbol} className="text-slate-900 bg-white font-bold">
                      {p.symbol} ({p.name})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="text-right sm:text-left">
                <span className="text-[10px] font-bold uppercase text-slate-400 block leading-none">Live Price</span>
                <p className="text-sm sm:text-lg font-black font-mono text-slate-900 mt-0.5">
                  ${Number(currentPairData.current_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <span className="text-xs text-slate-400 font-bold uppercase">Payout:</span>
              <span className="text-sm sm:text-lg font-black font-mono text-emerald-600">
                {currentPairData.payout_rate || 88}%
              </span>
            </div>
          </div>

          {/* TradingView Candlestick Chart */}
          <div className="bg-white border border-slate-200 rounded-3xl p-2 sm:p-4 shadow-xs overflow-hidden h-[330px] sm:h-[480px]">
            <TradingViewChart symbol={selectedPair} />
          </div>

          {/* User Trade History Ledger */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <span>My Executed Options History</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                Total: {historyMeta.total || 0} Trades
              </span>
            </div>

            {tradeHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <History className="w-8 h-8 mx-auto mb-1.5 text-slate-300" />
                <p className="text-xs font-semibold">No option trades executed yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Asset</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Outcome</th>
                      <th className="py-2.5 px-3">Profit / Loss</th>
                      <th className="py-2.5 px-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tradeHistory.map((t) => {
                      const isWin = t.result === 'WIN';
                      return (
                        <tr key={t.id || t._id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-extrabold text-slate-900">{t.pair}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              t.type === 'BUY' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                            }`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">${Number(t.amount).toFixed(2)}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                              isWin ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                            }`}>
                              {t.result}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-extrabold">
                            <span className={isWin ? 'text-emerald-600' : 'text-rose-600'}>
                              {isWin ? `+$${Number(t.profit).toFixed(2)}` : `-$${Number(t.amount).toFixed(2)}`}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {formatPKT(t.created_at || t.createdAt)}
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

        {/* Order Placement Panel (Order 2 on mobile) */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6 order-2">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-7 shadow-xs space-y-4 sm:space-y-5">
            
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">Trade Control Panel</h2>
                <p className="text-[11px] text-slate-500">Real-time settlement • High-frequency options</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block">Available Balance</span>
                <span className="text-xs sm:text-sm font-black font-mono text-emerald-600">${userBal.toFixed(2)}</span>
              </div>
            </div>

            {tradeError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{tradeError}</span>
              </div>
            )}

            {/* Contract Expiration Duration */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase text-slate-400">Select Expiry Duration</label>
              <div className="grid grid-cols-3 gap-1.5">
                {durations.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    className={`py-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                      duration === d.value
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Investment Capital Amount & ALL IN Shortcut */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400 uppercase text-[11px]">Trade Amount ($)</span>
                <span className="text-blue-600 text-[11px]">Any amount / Full balance</span>
              </div>

              <div className="relative">
                <DollarSign className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  max={userBal || 999999}
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-2.5 sm:py-3 text-slate-900 font-mono font-bold text-base sm:text-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Balance Percentage Shortcuts: 25%, 50%, 75%, 100% ALL IN */}
              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleSetPercentAmount(25)}
                  className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-center cursor-pointer"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPercentAmount(50)}
                  className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-center cursor-pointer"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPercentAmount(75)}
                  className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-center cursor-pointer"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPercentAmount(100)}
                  className="py-1.5 px-2 rounded-xl text-[11px] font-black bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors text-center cursor-pointer"
                >
                  🔥 ALL IN
                </button>
              </div>
            </div>

            {/* Expected Profit Calculation */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Payout Rate</span>
                <span className="text-slate-900 font-bold font-mono">{payoutRate}%</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Net Estimated Profit</span>
                <span className="text-emerald-600 font-extrabold font-mono">
                  +${estimatedProfit}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-800 font-black border-t border-slate-200 pt-1">
                <span>Total Payout If Won</span>
                <span className="font-mono text-slate-900">
                  ${estimatedTotal}
                </span>
              </div>
            </div>

            {/* Signal Compliance Badge */}
            {isMatchingActiveSignal ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Protected Daily Signal Contract</span>
              </div>
            ) : (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-snug flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Unscheduled off-signal trade: Subject to standard market risk.</span>
              </div>
            )}

            {/* Quick BUY (CALL) & SELL (PUT) Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => handleInitiateOrder('BUY')}
                disabled={loading || activeTrade}
                className="py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-sm shadow-emerald-500/20 disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              >
                <div className="flex items-center gap-1 text-sm sm:text-base">
                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                  <span>BUY / CALL</span>
                </div>
                <span className="text-[10px] text-emerald-100 font-semibold">Higher</span>
              </button>

              <button
                onClick={() => handleInitiateOrder('SELL')}
                disabled={loading || activeTrade}
                className="py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-extrabold text-xs sm:text-sm shadow-sm shadow-rose-500/20 disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              >
                <div className="flex items-center gap-1 text-sm sm:text-base">
                  <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                  <span>SELL / PUT</span>
                </div>
                <span className="text-[10px] text-rose-100 font-semibold">Lower</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 1. TRADE CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase">
                ORDER CONFIRMATION
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">Confirm Live Option Trade</h3>
              <p className="text-xs text-slate-500">Please review contract parameters before placement.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Asset Instrument:</span>
                <span className="font-mono font-black text-slate-900 text-sm">{selectedPair}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Order Direction:</span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black ${
                  tradeType === 'BUY' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {tradeType} MARKET
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Investment Capital:</span>
                <span className="font-mono font-black text-slate-900 text-sm">${Number(tradeAmount).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Contract Duration:</span>
                <span className="font-bold text-slate-800">{duration >= 60 ? `${Math.floor(duration / 60)} Mins` : `${duration} Seconds`}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Estimated Profit:</span>
                <span className="font-mono font-black text-emerald-600">+${estimatedProfit} ({payoutRate}%)</span>
              </div>

              <div className="flex justify-between items-center pt-1 text-slate-900 font-black">
                <span>Total Return If Won:</span>
                <span className="font-mono text-base text-blue-600">${estimatedTotal}</span>
              </div>
            </div>

            {isMatchingActiveSignal ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Protected Official Daily Signal Trade</span>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Unscheduled Trade: Subject to standard market volatility.</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAndExecute}
                className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4" />
                <span>Confirm & Place Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTIVE TRADE COUNTDOWN MODAL */}
      {activeTrade && isCountdownModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            
            <button
              onClick={() => setIsCountdownModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Minimize Countdown Modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black uppercase">
                CONTRACT RUNNING
              </span>
              <h3 className="text-xl font-black text-slate-900">{activeTrade.pair}</h3>
              <p className="text-xs text-slate-500">Order: {activeTrade.type} (${Number(activeTrade.amount).toFixed(2)})</p>
            </div>

            {/* Live Real-time Dynamic Trade Pulse Graph */}
            <LiveTradePulseGraph trade={activeTrade} countdown={countdown} />

            {/* Circular Countdown Display */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className="w-full h-full rounded-full border-4 border-blue-100 flex items-center justify-center bg-blue-50/40">
                <div className="text-center">
                  <span className="text-4xl font-black font-mono text-blue-600">{countdown}</span>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mt-0.5">Seconds Left</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Live algorithmic execution in progress. All times in Pakistan Standard Time (PKT).
            </p>

            <button
              onClick={() => setIsCountdownModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Minimize & Keep Running in Background</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. TRADE RESULT OUTCOME MODAL */}
      {tradeResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <button
              onClick={() => setTradeResult(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {tradeResult.result === 'WIN' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px] uppercase">
                    CONTRACT SETTLED
                  </span>
                  <h3 className="text-2xl font-black text-emerald-600 mt-1">TRADE WON!</h3>
                  <p className="text-3xl font-black font-mono text-slate-900 mt-2">
                    +${Number(tradeResult.profit).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Profit credited to your live spot wallet.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <AlertCircle className="w-9 h-9" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[11px] uppercase">
                    CONTRACT SETTLED
                  </span>
                  <h3 className="text-2xl font-black text-rose-600 mt-1">TRADE LOST</h3>
                  <p className="text-3xl font-black font-mono text-rose-600 mt-2">
                    -${Number(tradeResult.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Market shifted opposite to selected direction.
                  </p>
                </div>
              </>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Contract Pair</span>
                <span className="font-bold text-slate-900">{tradeResult.pair}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Updated Spot Balance</span>
                <span className="font-bold font-mono text-slate-900">${userBal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setTradeResult(null)}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
            >
              Continue Trading
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LiveTradingPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs font-bold">Loading Live Trading Engine...</p>
      </div>
    }>
      <TradingContent />
    </Suspense>
  );
}
