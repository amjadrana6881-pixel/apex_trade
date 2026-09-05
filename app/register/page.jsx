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
  Inbox
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[640px]">
        
        {/* Desktop Brand Showcase (Left 5 Cols) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8 lg:p-10 text-white flex-col justify-between relative overflow-hidden">
          {/* Ambient Lights */}
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
                Start Your High-Probability Option Journey
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Join thousands of verified traders executing daily 7:00 PM PST institutional signals with automated portfolio analytics.
              </p>
            </div>

            {/* Platform Feature Cards */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Daily 7 PM Official Signals</h4>
                  <p className="text-[10px] text-slate-400">Strict durations with verified algorithmic audit logs.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Instant USDT Direct Treasury</h4>
                  <p className="text-[10px] text-slate-400">TRC-20, BEP-20, ERC-20 zero-delay payouts with saved address.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">24/7 Human Live Chat Desk</h4>
                  <p className="text-[10px] text-slate-400">Direct two-way messaging with screenshot upload support.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>ApexTrade Inc. © 2026</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Systems
            </span>
          </div>
        </div>

        {/* Right Side: Responsive Mobile & Desktop Form */}
        <div className="lg:col-span-7 p-4 sm:p-7 lg:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-3.5 sm:space-y-4">
            
            {/* Mobile Header Banner */}
            <div className="lg:hidden bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-2xl p-3.5 text-white shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-sm shadow-sm">
                    A
                  </div>
                  <div>
                    <span className="text-sm font-black text-white flex items-center gap-1">
                      ApexTrade <span className="px-1.5 py-0.2 rounded-full bg-blue-500/40 text-blue-300 text-[8px] font-black border border-blue-400/40">PRO</span>
                    </span>
                    <p className="text-[9px] text-slate-300 font-mono">Options & Signals Desk</p>
                  </div>
                </div>
                <span className="text-[9px] font-extrabold text-blue-300 bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
                </span>
              </div>

              {/* Mobile Quick Highlights */}
              <div className="mt-2.5 pt-2 border-t border-white/10 grid grid-cols-3 gap-1 text-center">
                <div className="bg-white/5 rounded-lg py-0.5 px-1">
                  <div className="text-[8px] text-slate-300 font-medium">Signals</div>
                  <div className="text-[9px] font-black text-blue-300">07:00 PM</div>
                </div>
                <div className="bg-white/5 rounded-lg py-0.5 px-1">
                  <div className="text-[8px] text-slate-300 font-medium">Payouts</div>
                  <div className="text-[9px] font-black text-emerald-300">USDT Fast</div>
                </div>
                <div className="bg-white/5 rounded-lg py-0.5 px-1">
                  <div className="text-[8px] text-slate-300 font-medium">Security</div>
                  <div className="text-[9px] font-black text-purple-300">256-Bit SSL</div>
                </div>
              </div>
            </div>

            {/* Back button on Step 2 */}
            {step === 2 && (
              <button 
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to edit credentials</span>
              </button>
            )}

            <div>
              <span className="hidden lg:inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
                {step === 1 ? 'STEP 1 OF 2: TRADER PROFILE' : 'STEP 2 OF 2: OTP VERIFICATION'}
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
                {step === 1 ? 'Create Free Trader Account' : 'Verify Email with 6-Digit OTP'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {step === 1 
                  ? 'Enter your credentials to generate your institutional trader account.' 
                  : `Enter the 6-digit verification code sent to ${email}.`}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-start gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: FORM */}
            {step === 1 && (
              <form onSubmit={handleProceedToOtp} className="space-y-2.5 sm:space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-0.5">Full Legal Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tariq Khan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-0.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="trader@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-0.5">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Min 6 chars"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-medium transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-0.5">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-medium transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-0.5 flex justify-between">
                    <span>Sponsor / Referral Code</span>
                    <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Gift className="w-4 h-4 text-blue-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. APEX1234"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-mono transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all active:scale-[0.99] mt-1"
                >
                  <span>{loading ? 'Sending Verification Code...' : 'Continue to Verification'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 2 && (
              <form onSubmit={handleVerifyAndRegister} className="space-y-4">
                
                {/* Email Sent Notification Box */}
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 flex items-start gap-3 text-xs">
                  <Inbox className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block text-sm text-blue-950 mb-0.5">Verification Code Dispatched</span>
                    <span className="leading-relaxed">
                      We sent a 6-digit code to <strong>{email}</strong>. Please check your inbox (and spam folder) and enter it below.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-2xl font-mono font-black tracking-widest text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-slate-500">Didn&apos;t receive the code?</span>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleProceedToOtp}
                    className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all active:scale-[0.99]"
                >
                  <span>{loading ? 'Verifying...' : 'Verify & Open Trader Account'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Footer Sign In link */}
            <div className="border-t border-slate-100 pt-3 text-center">
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className="font-extrabold text-blue-600 hover:text-blue-700 hover:underline">
                  Sign In here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
