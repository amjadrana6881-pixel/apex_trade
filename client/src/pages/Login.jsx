import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Zap
} from 'lucide-react';
import { useAuth, API_BASE } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

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
          navigate('/admin');
        } else {
          navigate('/dashboard');
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[620px]">
        
        {/* Desktop Brand Showcase (Left 5 Cols) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8 lg:p-10 text-white flex-col justify-between relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 font-black text-white text-xl">
                A
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  ApexTrade <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 text-[10px] font-black border border-blue-400/30">PRO</span>
                </span>
                <p className="text-[11px] text-slate-400 font-mono">Institutional Trading Portal</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Welcome Back to ApexTrade
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Log in to execute today's 7:00 PM PST signal, track your live portfolio analytics, and request USDT payouts.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Daily 7 PM Signals Active</h4>
                  <p className="text-[10px] text-slate-400">Strict 180s high-probability setups with verified execution.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Dedicated USDT Treasury</h4>
                  <p className="text-[10px] text-slate-400">1-Click saved address payouts with withdrawal PIN security.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">24/7 Live Human Support</h4>
                  <p className="text-[10px] text-slate-400">WhatsApp-style messenger with screenshot attachments.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>ApexTrade Inc. © 2026</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              System Live
            </span>
          </div>
        </div>

        {/* Right Side: Responsive Mobile & Desktop Form */}
        <div className="lg:col-span-7 p-4 sm:p-7 lg:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-4 sm:space-y-5">
            
            {/* Mobile Branded Header Banner (Stunning & Informative) */}
            <div className="lg:hidden bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-sm">
                    A
                  </div>
                  <div>
                    <span className="text-base font-black text-white flex items-center gap-1.5">
                      ApexTrade <span className="px-1.5 py-0.2 rounded-full bg-blue-500/40 text-blue-300 text-[9px] font-black border border-blue-400/40">PRO</span>
                    </span>
                    <p className="text-[10px] text-slate-300 font-mono">Options & Signals Platform</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-extrabold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Live 24/7</span>
                </div>
              </div>

              {/* Mobile Quick Highlights Bar */}
              <div className="mt-3 pt-2.5 border-t border-white/10 grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-white/5 rounded-lg py-1 px-1">
                  <div className="text-[9px] text-slate-300 font-medium">Daily Signal</div>
                  <div className="text-[10px] font-black text-blue-300">07:00 PM PST</div>
                </div>
                <div className="bg-white/5 rounded-lg py-1 px-1">
                  <div className="text-[9px] text-slate-300 font-medium">USDT Treasury</div>
                  <div className="text-[10px] font-black text-emerald-300">Instant Pay</div>
                </div>
                <div className="bg-white/5 rounded-lg py-1 px-1">
                  <div className="text-[9px] text-slate-300 font-medium">Option Profit</div>
                  <div className="text-[10px] font-black text-amber-300">Up to 90%</div>
                </div>
              </div>
            </div>

            {/* Form Title & Subtitle */}
            <div className="pt-0.5">
              <span className="hidden lg:inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
                SECURE AUTHENTICATION
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
                Sign In to Your Account
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your registered trader credentials to access live desk.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-start gap-2 animate-shake">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="trader@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot password?
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all active:scale-[0.99] mt-1"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="border-t border-slate-100 pt-3 text-center">
              <p className="text-xs text-slate-500">
                Don't have an account yet?{' '}
                <Link to="/register" className="font-extrabold text-blue-600 hover:text-blue-700 hover:underline">
                  Create Free Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
