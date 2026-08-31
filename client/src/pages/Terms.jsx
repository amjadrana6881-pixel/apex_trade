import React from 'react';
import { FileText } from 'lucide-react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-7 h-7 text-blue-600" />
          <span>Terms and Conditions</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          ApexTrade Pro Options & Financial Services User Agreement.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. General Overview</h2>
          <p>
            By accessing ApexTrade services, you agree to comply with platform guidelines, daily signal terms, and risk management policies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Daily Signal Execution Guidelines</h2>
          <p>
            Trading signals provided via official channels operate with algorithmic protection when followed during the designated execution window. Unscheduled off-signal trading is subject to standard market volatility.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Deposits and Withdrawals</h2>
          <p>
            Deposits are credited upon receipt verification. Withdrawals are processed within standard security clearance windows directly to verified user addresses.
          </p>
        </section>
      </div>
    </div>
  );
}
