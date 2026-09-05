'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  KeyRound, 
  Mail, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  TrendingUp, 
  Radio, 
  Copy, 
  Check, 
  ArrowLeft,
  Sparkles,
  Inbox,
  Eye,
  EyeOff
} from 'lucide-react';
import { API_BASE } from '@/app/context/AuthContext';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP & New Password, 3: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email.trim()) return setError('Please enter your registered email address.');

    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/auth/send-forgot-password-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await res.json();

      if (data.success) {
        setStep(2);
      } else {
        setError(data.message || 'Failed to send reset code.');
      }
    } catch (err) {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError('New passwords do not match.');
    }
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }
    if (!otp.trim()) {
      return setError('Please enter the 6-digit verification code sent to your email.');
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/auth/reset-password-with-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword
        })
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg(data.message || 'Password reset successfully!');
        setStep(3);
      } else {
        setError(data.message || 'Password reset failed. Please check your OTP.');
      }
    } catch (err) {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[600px]">
        
        {/* Desktop Brand Showcase (Left 5 Cols) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8 lg:p-10 text-white flex-col justify-between relative overflow-hidden">
          {/* Subtle Background Glows */}
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
                <p className="text-[11px] text-slate-400 font-mono">Institutional Option Desk</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Account Recovery & Security Desk
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Securely reset your password using your verified 6-digit OTP code to restore access to your portfolio.
              </p>
            </div>

            {/* Feature Badges */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">256-Bit SSL Protection</h4>
                  <p className="text-[10px] text-slate-400">Cryptographically signed authentication sessions.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Daily 7 PM Signals Active</h4>
                  <p className="text-[10px] text-slate-400">Daily high-probability institutional setups.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>ApexTrade Inc. © 2026</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Desk
            </span>
          </div>
        </div>

        {/* Right Side: Step-by-Step Recovery Form */}
        <div className="lg:col-span-7 p-4 sm:p-7 lg:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-3.5 sm:space-y-4">
            
            {/* Top Navigation Back to Login */}
            <Link 
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>

            <div>
              <span className="hidden lg:inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
                PASSWORD RECOVERY
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
                {step === 1 ? 'Forgot your password?' : step === 2 ? 'Verify 6-Digit OTP' : 'Password Reset Complete!'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {step === 1 
                  ? 'Enter your registered email address to receive an instant verification code.' 
                  : step === 2 
                  ? `Enter the 6-digit code sent to ${email} and choose your new password.`
                  : 'Your account credentials have been securely updated.'}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs font-bold text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-3 sm:space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Registered Email Address</label>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all active:scale-[0.99]"
                >
                  <span>{loading ? 'Generating Code...' : 'Send Verification OTP'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: Enter OTP & New Password */}
            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-3 sm:space-y-3.5">
                
                {/* Email Sent Notification Box */}
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 flex items-start gap-3 text-xs">
                  <Inbox className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block text-sm text-blue-950 mb-0.5">Reset Code Dispatched</span>
                    <span className="leading-relaxed">
                      We sent a 6-digit reset code to <strong>{email}</strong>. Please check your inbox (and spam folder) and enter it below.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 text-center">6-Digit OTP Code</label>
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
                    onClick={handleRequestOtp}
                    className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all active:scale-[0.99]"
                >
                  <span>{loading ? 'Resetting Password...' : 'Save New Password & Log In'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 3: Success */}
            {step === 3 && (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900">{successMsg}</h3>
                <p className="text-xs text-slate-500">
                  Your new security credentials are now active. You can log in to your account.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/20"
                >
                  Proceed to Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
