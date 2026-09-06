'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Gift, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Radio, 
  TrendingUp, 
  CheckCircle2, 
  Copy, 
  Check, 
  Headphones, 
  Wallet,
  ArrowLeft,
  Sparkles,
  Inbox,
  Zap,
  UserCheck
} from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';

function RegisterForm() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get('ref') || '';

  const { login } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: Info Form, 2: OTP Verification
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState(refParam);
  
  // OTP States
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (refParam) {
      setReferralCode(refParam);
    }
  }, [refParam]);

  // Step 1: Request OTP
  const handleProceedToOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!name.trim()) return setError('Please enter your full legal name.');
    if (!email.trim()) return setError('Please enter your valid email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_BASE}/api/auth/send-register-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        throw new Error('Authentication service is initializing. Please try again.');
      }

      if (data.success) {
        setStep(2);
      } else {
        setError(data.message || 'Failed to send OTP code.');
      }
    } catch (err) {
      console.error('Register OTP error:', err);
      setError(err.message || 'Unable to connect to authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and complete registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return setError('Please enter the 6-digit verification code sent to your email.');

    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_BASE}/api/auth/verify-and-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          otp: otp.trim(),
          referralCode: referralCode.trim()
        })
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        throw new Error('Verification service is initializing. Please try again.');
      }

      if (data.success && data.token) {
        login(data.token, data.user);
        router.push('/dashboard');
      } else {
        setError(data.message || 'Verification failed. Please check your OTP.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Unable to connect to authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between lg:justify-center lg:p-6 xl:p-10 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container: Full-screen mobile / Dual-column card on Desktop */}
      <div className="w-full max-w-5xl mx-auto bg-slate-900/90 lg:bg-slate-900/95 border-0 lg:border border-slate-800/80 rounded-none lg:rounded-[32px] shadow-2xl backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-screen lg:min-h-[660px] z-10">
        
        {/* ============================================================== */}
        {/* DESKTOP BRAND SHOWCASE COLUMN (Left 5 Cols) */}
        {/* ============================================================== */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8 lg:p-10 text-white flex-col justify-between relative overflow-hidden border-r border-slate-800">
          <div className="absolute -top-16 -left-16 w-56 h-56 bg-blue-500/25 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 font-black text-white text-xl border border-white/20 group-hover:scale-105 transition-transform">
                A
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  ApexTrade <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 text-[10px] font-black border border-blue-400/30">PRO</span>
                </span>
                <p className="text-[11px] text-slate-400 font-mono">Institutional Options Portal</p>
              </div>
            </Link>

            <div className="space-y-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Account Opening Fees</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Start Profiting with Daily Signals.
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Join thousands of verified traders executing daily 07:00 PM PST institutional setups with automated portfolio analytics and 100% transparent audits.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Daily 07:00 PM Signals</h4>
                  <p className="text-[10px] text-slate-400">Strict durations with verified algorithmic audit logs.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Instant USDT Direct Treasury</h4>
                  <p className="text-[10px] text-slate-400">TRC-20, BEP-20 zero-delay payouts with saved address.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">24/7 Human Live Chat Desk</h4>
                  <p className="text-[10px] text-slate-400">Direct two-way messaging with attachment support.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>ApexTrade Inc. © 2026</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              256-Bit SSL Protected
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MOBILE FULL-SCREEN / DESKTOP FORM COLUMN (Right 7 Cols) */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 flex flex-col justify-between p-5 sm:p-8 lg:p-10 min-h-screen lg:min-h-0 bg-slate-900/90 lg:bg-transparent">
          
          <div className="space-y-4">
            
            {/* Mobile Header Branding */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 lg:border-0">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-blue-500/30">
                  A
                </div>
                <div>
                  <span className="text-base font-black text-white flex items-center gap-1.5">
                    ApexTrade <span className="px-1.5 py-0.2 rounded-full bg-blue-500/30 text-blue-300 text-[9px] font-black border border-blue-400/30">PRO</span>
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono">Trader Registration Portal</p>
                </div>
              </Link>

              <span className="text-[10px] font-extrabold text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-400/30">
                {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
              </span>
            </div>

            {/* Segmented Switcher: [ Sign In ] vs [ Register ] */}
            <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-1 shadow-inner">
              <Link
                href="/login"
                className="py-2.5 rounded-xl text-slate-400 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:bg-slate-800/50"
              >
                <Zap className="w-3.5 h-3.5 text-slate-400" />
                <span>Sign In</span>
              </Link>
              <button
                type="button"
                className="py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-200" />
                <span>Create Account</span>
              </button>
            </div>

            {/* Back button on Step 2 */}
            {step === 2 && (
              <button 
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors cursor-pointer py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to edit credentials</span>
              </button>
            )}

            {/* Catchy Hero Headings */}
            <div className="pt-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                  {step === 1 ? 'STEP 1: TRADER IDENTITY' : 'STEP 2: EMAIL VERIFICATION'}
                </span>
                <span className="text-[11px] text-slate-400">• Free Registration</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {step === 1 ? 'Open Live Trader Account' : 'Verify Email with 6-Digit OTP'}
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                {step === 1 
                  ? 'Join verified traders and start trading binary options with official 7:00 PM signals.' 
                  : `Enter the 6-digit confirmation code dispatched to ${email}.`}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-200">
                <span className="text-base leading-none">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* ============================================================== */}
            {/* STEP 1: REGISTRATION FORM */}
            {/* ============================================================== */}
            {step === 1 && (
              <form onSubmit={handleProceedToOtp} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">Full Legal Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tariq Khan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 sm:py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="trader@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 sm:py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-300">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Min 6 chars"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-10 py-2.5 sm:py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-300">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 sm:py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 flex justify-between">
                    <span>Sponsor / Referral Code</span>
                    <span className="text-slate-500 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Gift className="w-4 h-4 text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. APEX1234"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 sm:py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-all shadow-inner"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.99] border border-blue-400/30 mt-1"
                >
                  <span>{loading ? 'Generating Verification OTP...' : 'Continue to Email Verification'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* ============================================================== */}
            {/* STEP 2: OTP CODE VERIFICATION */}
            {/* ============================================================== */}
            {step === 2 && (
              <form onSubmit={handleVerifyAndRegister} className="space-y-4 pt-1">
                
                {/* Email Sent Notification Box */}
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-200 flex items-start gap-3 text-xs">
                  <Inbox className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block text-sm text-blue-100 mb-0.5">Verification Code Dispatched</span>
                    <span className="leading-relaxed text-slate-300">
                      We sent a 6-digit code to <strong className="text-white font-mono">{email}</strong>. Please check your inbox (and spam folder) and enter it below.
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 text-center">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-center text-2xl font-mono font-black tracking-widest text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                  />
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-slate-400">Didn&apos;t receive the code?</span>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleProceedToOtp}
                    className="font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.99] border border-emerald-400/30"
                >
                  <span>{loading ? 'Verifying Account...' : 'Verify & Launch Trading Desk'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Quick Benefits Badges */}
            <div className="pt-2 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400">
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="block font-extrabold text-blue-400">Free Access</span>
                <span>Demo & Live</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="block font-extrabold text-emerald-400">Instant Pay</span>
                <span>USDT Treasury</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="block font-extrabold text-purple-400">24/7 Desk</span>
                <span>Live Support</span>
              </div>
            </div>
          </div>

          {/* Footer Sign In link */}
          <div className="pt-6 pb-2 text-center border-t border-slate-800/80 mt-6">
            <p className="text-xs text-slate-400">
              Already have an active account?{' '}
              <Link href="/login" className="font-extrabold text-blue-400 hover:text-blue-300 hover:underline">
                Sign In to Dashboard
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
