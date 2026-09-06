'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAuth } from '@/app/context/AuthContext';
import { Headphones } from 'lucide-react';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const { user, token, loading } = useAuth();

  const isAuthPage = 
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/admin-secure-auth' ||
    pathname === '/admin-login';

  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isChatPage = pathname === '/contact';

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center">
        {children}
      </div>
    );
  }

  if (isAdminPage) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 pb-20 md:pb-6">
        {/* Header */}
        <Header />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Floating Quick Live Support Desk Button */}
      {token && !isChatPage && (
        <Link
          href="/contact"
          className="fixed bottom-18 md:bottom-8 right-4 md:right-8 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-blue-500/25 border border-white/20 transition-all hover:scale-105 group"
          title="Open Live Chat Support"
        >
          <div className="relative">
            <Headphones className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <span className="hidden sm:inline">Live Support</span>
        </Link>
      )}

      {/* Floating Bottom Nav for Mobile */}
      <BottomNav />
    </div>
  );
}
