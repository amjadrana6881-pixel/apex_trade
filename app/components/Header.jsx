'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  TrendingUp,
  Radio,
  Share2,
  Bell,
  ChevronDown,
  Layers,
  Compass,
  HelpCircle,
  Download,
  Clock
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { formatPKTTime } from '@/lib/timeUtils';

export default function Header() {
  const { user, logout, token } = useAuth();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pktTime, setPktTime] = useState('');
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      setPktTime(formatPKTTime(new Date()));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    if (typeof window !== 'undefined') {
      const adminTok = localStorage.getItem('apextrade_admin_token');
      if (adminTok || user?.role === 'admin') {
        setHasAdminAccess(true);
      }
    }

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navLinks = [
    { label: 'Markets', path: '/dashboard', icon: Compass },
    { label: 'Live Trading', path: '/trading', icon: TrendingUp },
    { label: 'Daily Signals Hub', path: '/signals', icon: Radio },
    { label: 'Deposit & Wallet', path: '/wallet', icon: Wallet },
    { label: 'Yield Investments', path: '/investments', icon: Layers },
    { label: 'Portfolio Analytics', path: '/assets', icon: ShieldCheck },
    { label: 'Affiliate Network', path: '/referral-tree', icon: Share2 },
    { label: 'News & Updates', path: '/announcements', icon: Bell },
    { label: 'Support Desk', path: '/contact', icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto p-2.5 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-2">

        {/* Left: Mobile Menu & Brand Logo */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
            <img
              src="/logo.svg"
              alt="ApexTrade"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-xs group-hover:scale-105 transition-transform"
            />
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 leading-none">ApexTrade</span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 leading-none">
                PRO
              </span>
            </div>
          </Link>

          {/* Connection Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 border border-slate-200 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Market Online</span>
          </div>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

          {/* Pakistan Standard Time Live Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-[11px] font-black text-blue-800 shrink-0 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span className="font-mono">{pktTime || '07:00 PM PKT'}</span>
          </div>

          {/* Master Admin Portal Direct Shortcut Button */}
          {hasAdminAccess && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-red-400 font-black text-xs shadow-xs transition-colors shrink-0"
              title="Open Super Admin Console"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden md:inline">Admin Portal</span>
            </Link>
          )}

          {/* Download App Button */}
          <a
            href="/downloads/ApexTrade.apk"
            download="ApexTrade.apk"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs border border-slate-200 transition-all cursor-pointer"
            title="Download Android APK"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Download App</span>
          </a>

          {token ? (
            <>
              {/* Wallet Balance Widget */}
              <Link
                href="/wallet"
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <p className="text-xs sm:text-sm font-extrabold font-mono text-slate-900 leading-tight">
                  ${Number(user?.wallet_balance || 0).toFixed(2)}
                </p>
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1 p-1 sm:px-2 sm:py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{user?.email}</p>
                      <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-600">
                        {user?.role === 'admin' ? '🛡️ Master Admin' : '👤 Verified Trader'}
                      </span>
                    </div>

                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Account Profile & KYC</span>
                    </Link>

                    <Link href="/assets" className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      <span>Portfolio Analytics</span>
                    </Link>

                    {user?.role === 'admin' && (
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-xs text-blue-700 hover:bg-blue-50 font-bold">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>Master Admin Dashboard</span>
                      </Link>
                    )}

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/login"
                className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Floating Mobile Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 top-15 bg-slate-900/30 backdrop-blur-xs z-40 animate-in fade-in"
          ></div>
          <div className="md:hidden absolute top-full left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-2xl p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 font-bold text-xs"
                >
                  <Icon className="w-4 h-4 text-blue-600" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-100">
              <a
                href="/downloads/ApexTrade.apk"
                download="ApexTrade.apk"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Android App (.APK)</span>
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
