'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function RootPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (token) {
        if (user?.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, token, loading, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-sm text-slate-500 font-bold">Launching ApexTrade PRO...</span>
      </div>
    </div>
  );
}
