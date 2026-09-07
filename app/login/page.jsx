'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Radio, 
  Wallet, 
  Headphones, 
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Zap,
  CheckCircle2,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        throw new Error('Authentication service is initializing. Please try again.');
      }

      if (data.success && data.token) {
        login(data.token, data.user);
        if (data.user?.role === 'admin') {
          localStorage.setItem('apextrade_admin_token', data.token);
          localStorage.setItem('apextrade_admin_user', JSON.stringify(data.user));
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Unable to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between lg:justify-center lg:p-6 xl:p-10 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      
      {/* Dynamic Background Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container: Full-screen mobile screen / Dual-column card on Desktop */}
      <div className="w-full max-w-5xl mx-auto bg-slate-900/90 lg:bg-slate-900/95 border-0 lg:border border-slate-800/80 rounded-none lg:rounded-[32px] shadow-2xl backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-screen lg:min-h-[640px] z-10">
        
        {/* ============================================================== */}
        {/* DESKTOP SHOWCASE COLUMN (Left 5 Cols) */}
        {/* ============================================================== */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8 lg:p-10 text-white flex-col justify-between relative overflow-hidden border-r border-slate-800">
          <div className="absolute -top-16 -left-16 w-56 h-56 bg-blue-500/25 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6">
            {/* Top Brand Logo */}
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 font-black text-white text-xl border border-white/20 group-hover:scale-105 transition-transform">
                A
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  ApexTrader <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 text-[10px] font-black border border-blue-400/30">PRO</span>
                </span>
                <p className="text-[11px] text-slate-400 font-mono">Institutional Trading Terminal</p>
              </div>
            </Link>

            {/* Impactful Headings */}
            <div className="space-y-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Next-Gen Binary Options</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Trade with Institutional Precision.
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Log in to execute today's 07:00 PM PST high-yield signal, monitor algorithmic trade outcomes, and claim instant USDT withdrawals.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Daily 07:00 PM PST Signals</h4>
                  <p className="text-[10px] text-slate-400">Strict execution windows with verified historical win rate.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Dedicated USDT Treasury</h4>
                  <p className="text-[10px] text-slate-400">TRC-20 / BEP-20 payouts secured with withdrawal PINs.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Zero Slippage Execution</h4>
                  <p className="text-[10px] text-slate-400">Real-time TradingView chart feeds with instant confirmation.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>ApexTrader PRO © 2026</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              256-Bit SSL Encrypted
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MOBILE FULL-SCREEN / DESKTOP FORM COLUMN (Right 7 Cols) */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 flex flex-col justify-between p-5 sm:p-8 lg:p-10 min-h-screen lg:min-h-0 bg-slate-900/90 lg:bg-transparent">
          
          {/* Mobile Top App Bar */}
          <div className="space-y-4">
            
            {/* Mobile Header Branding */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 lg:border-0">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-blue-500/30">
                  A
                </div>
                <div>
                  <span className="text-base font-black text-white flex items-center gap-1.5">
                    ApexTrader <span className="px-1.5 py-0.2 rounded-full bg-blue-500/30 text-blue-300 text-[9px] font-black border border-blue-400/30">PRO</span>
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono">Options & Signals Portal</p>
                </div>
              </Link>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Desk</span>
              </div>
            </div>

            {/* Mobile Segmented Switcher: [ Sign In ] vs [ Register ] */}
            <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-1 shadow-inner">
              <button
                type="button"
                className="py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-blue-200" />
                <span>Sign In</span>
              </button>
              <Link
                href="/register"
                className="py-2.5 rounded-xl text-slate-400 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:bg-slate-800/50"
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Create Account</span>
              </Link>
            </div>

            {/* Catchy Hero Headings */}
            <div className="pt-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/30">
                  SECURE TRADER ACCESS
                </span>
                <span className="text-[11px] text-slate-400">• Daily 7 PM Signal Active</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome Back, Trader
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your credentials to enter the live options trading room and manage your portfolio.
              </p>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-200">
                <span className="text-base leading-none">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4 pt-1">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="trader@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">Password</label>
                  <Link 
                    href="/forgot-password" 
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.99] border border-blue-400/30"
              >
                <span>{loading ? 'Authenticating Secure Session...' : 'Sign In to Live Desk'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Mobile Feature Badges */}
            <div className="pt-2 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400">
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="block font-extrabold text-blue-400">7:00 PM PST</span>
                <span>Daily Signal</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="block font-extrabold text-emerald-400">Instant Pay</span>
                <span>USDT Treasury</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="block font-extrabold text-amber-400">Up to 90%</span>
                <span>Option Payout</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer Link */}
          <div className="pt-6 pb-2 text-center border-t border-slate-800/80 mt-6">
            <p className="text-xs text-slate-400">
              Don&apos;t have an active trader account?{' '}
              <Link href="/register" className="font-extrabold text-blue-400 hover:text-blue-300 hover:underline">
                Create Free Account
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
