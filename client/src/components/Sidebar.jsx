import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Compass, 
  TrendingUp, 
  Wallet, 
  Radio, 
  ShieldCheck, 
  Share2, 
  Bell, 
  FileText, 
  HelpCircle,
  Download,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const mainNav = [
    { label: 'Markets & Assets', path: '/dashboard', icon: Compass },
    { label: 'Live Option Trading', path: '/trading', icon: TrendingUp },
    { label: 'Daily Signals Hub', path: '/signals', icon: Radio },
    { label: 'Deposit & Withdrawal', path: '/wallet', icon: Wallet },
    { label: 'Portfolio Analytics', path: '/assets', icon: ShieldCheck },
    { label: 'Affiliate Network', path: '/referral-tree', icon: Share2 },
    { label: 'News & Updates', path: '/announcements', icon: Bell },
  ];

  const secondaryNav = [
    { label: 'Terms Agreement', path: '/terms', icon: FileText },
    { label: 'Support Desk', path: '/contact', icon: HelpCircle },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen p-5 justify-between select-none shrink-0 shadow-xs">
      <div className="space-y-6">
        {/* Brand Logo Header */}
        <Link to="/dashboard" className="flex items-center gap-3 px-2 group">
          <img 
            src="/logo.svg" 
            alt="ApexTrade Logo" 
            className="w-10 h-10 rounded-2xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform" 
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-black text-lg text-slate-900 tracking-tight leading-tight">ApexTrade</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 border border-blue-200">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trading Platform</p>
          </div>
        </Link>

        {/* Primary Navigation */}
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 pb-1">
            Trading Menu
          </p>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Secondary Info Links */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 pb-1">
            Information
          </p>
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 text-slate-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* APK Download Box */}
      <div className="pt-4 border-t border-slate-100">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <p className="font-extrabold text-xs text-slate-900">Android Mobile App</p>
          </div>
          <p className="text-[10px] text-slate-500">Zero updates required. Realtime cloud sync.</p>
          <a
            href="/downloads/ApexTrade.apk"
            download="ApexTrade.apk"
            className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download APK</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
