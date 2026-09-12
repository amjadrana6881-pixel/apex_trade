'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAuth } from '@/app/context/AuthContext';

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

      {/* Floating Bottom Nav for Mobile */}
      <BottomNav />
    </div>
  );
}
