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
      <div className={`flex-1 flex flex-col min-w-0 bg-slate-50 ${isChatPage ? 'pb-14 md:pb-6' : 'pb-16 md:pb-6'}`}>
        {/* Header */}
        <Header />

        {/* Dynamic Page Container */}
        <main className={`flex-1 w-full mx-auto ${isChatPage ? 'p-2 sm:p-6 lg:p-8 max-w-4xl flex flex-col' : 'p-3 sm:p-6 lg:p-8 max-w-7xl'}`}>
          {children}
        </main>
      </div>

      {/* Floating Quick Live Support Desk Button (Always above Mobile Footer Menu) */}
      {!isChatPage && (
        <Link
          href="/contact"
          className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-2xl shadow-blue-600/40 border border-white/25 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
          title="Open Live Chat Support Desk"
        >
          <div className="relative flex items-center justify-center">
            <Headphones className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white"></span>
          </div>
          <span className="inline font-bold tracking-tight">Live Support</span>
        </Link>
      )}

      {/* Floating Bottom Nav for Mobile */}
      <BottomNav />
    </div>
  );
}
