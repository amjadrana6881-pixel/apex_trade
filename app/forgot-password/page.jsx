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
  ArrowLeft,
  Sparkles,
  Inbox,
  Eye,
  EyeOff,
  Zap
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
      console.error('Send reset OTP error:', err);
      setError('Unable to connect to authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return setError('Please enter the 6-digit verification code.');
    if (newPassword.length < 6) return setError('New password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');

    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/auth/reset-password-otp`, {
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
        setStep(3);
        setSuccessMsg('Your password has been reset successfully! You can now log in with your new password.');
      } else {
        setError(data.message || 'Password reset failed. Please check your OTP.');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Unable to connect to authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between lg:justify-center lg:p-6 xl:p-10 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg mx-auto bg-slate-900/90 lg:bg-slate-900/95 border-0 lg:border border-slate-800/80 rounded-none lg:rounded-[32px] shadow-2xl backdrop-blur-xl overflow-hidden p-5 sm:p-8 lg:p-10 min-h-screen lg:min-h-0 z-10 flex flex-col justify-between">
        
        <div className="space-y-4">
          
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-blue-500/30">
                A
              </div>
              <div>
                <span className="text-base font-black text-white flex items-center gap-1.5">
                  ApexTrader <span className="px-1.5 py-0.2 rounded-full bg-blue-500/30 text-blue-300 text-[9px] font-black border border-blue-400/30">PRO</span>
                </span>
                <p className="text-[10px] text-slate-400 font-mono">Account Recovery Portal</p>
              </div>
            </Link>

            <Link
              href="/login"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>

          {/* Heading */}
          <div className="pt-2 space-y-1">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
              ACCOUNT RECOVERY
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {step === 1 && 'Reset Login Password'}
              {step === 2 && 'Enter Verification Code'}
              {step === 3 && 'Password Reset Complete'}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {step === 1 && 'Enter your registered email address to receive a 6-digit recovery code.'}
              {step === 2 && `Enter the 6-digit OTP sent to ${email} and choose your new password.`}
              {step === 3 && successMsg}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-200">
              <span className="text-base leading-none">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Registered Email Address</label>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all border border-blue-400/30"
              >
                <span>{loading ? 'Sending Recovery Code...' : 'Send 6-Digit OTP Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-3.5 pt-1">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-200 flex items-start gap-2.5 text-xs">
                <Inbox className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Recovery code sent to <strong className="text-white">{email}</strong>.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 text-center">6-Digit Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-center text-xl font-mono font-black tracking-widest text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">New Login Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 chars"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition-all shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all border border-emerald-400/30"
              >
                <span>{loading ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && (
            <div className="text-center py-6 space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-white">Password Updated!</h2>
              <p className="text-xs text-slate-400">
                You can now log in to your ApexTrader account with your updated credentials.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 cursor-pointer"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        <div className="pt-6 pb-2 text-center border-t border-slate-800/80 mt-6">
          <Link href="/login" className="text-xs text-slate-400 hover:text-blue-400 font-bold">
            ← Return to Sign In Screen
          </Link>
        </div>

      </div>
    </div>
  );
}
