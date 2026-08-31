import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Compass, 
  TrendingUp, 
  Radio, 
  Wallet, 
  ShieldCheck 
} from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { label: 'Markets', path: '/dashboard', icon: Compass },
    { label: 'Trading', path: '/trading', icon: TrendingUp },
    { label: 'Signals', path: '/signals', icon: Radio },
    { label: 'Wallet', path: '/wallet', icon: Wallet },
    { label: 'Assets', path: '/assets', icon: ShieldCheck },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              isActive
                ? 'text-blue-600 font-extrabold'
                : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-blue-600' : 'text-slate-400'}`} />
            <span className="text-[10px] mt-0.5 leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
