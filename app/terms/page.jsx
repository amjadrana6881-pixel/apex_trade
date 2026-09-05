'use client';

import React from 'react';
import { FileText, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-7 h-7 text-blue-600" />
          <span>Terms and Conditions & Risk Disclosure</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          ApexTrade PRO Institutional Options & Crypto Financial Services Agreement.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. General Terms of Service</h2>
          <p>
            By registering and accessing ApexTrade PRO, you agree to comply with platform terms, daily signal execution protocols, and risk management guidelines. You acknowledge that binary and high-frequency option trading involves rapid capital risk.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Daily Signal Execution Guidelines</h2>
          <p>
            Official trading signals provided via the platform signals hub operate with algorithmic market liquidity protection when followed strictly during the designated execution window (07:00 PM PST). Unscheduled off-signal trading is subject to standard market volatility.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Crypto Treasury & Withdrawals</h2>
          <p>
            All deposits and withdrawals are processed exclusively in cryptocurrency (USDT, BTC, ETH). Withdrawals require a dedicated security PIN/password and are subject to a 10% platform clearance and network fee.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. 3-Tier Affiliate Commission</h2>
          <p>
            Referral commissions are calculated on successful approved deposits (Tier 1: 10%, Tier 2: 5%, Tier 3: 2%) and credited instantly to the referrer spot balance.
          </p>
        </section>
      </div>
    </div>
  );
}
