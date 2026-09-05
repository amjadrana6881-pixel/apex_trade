import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  const hasWithdrawalPassword = Boolean(user.withdrawal_password && user.withdrawal_password.trim().length > 0);

  return NextResponse.json({
    success: true,
    user: {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      wallet_balance: user.wallet_balance,
      tradeable_amount: user.tradeable_amount,
      investment_balance: user.investment_balance,
      referral_code: user.referral_code,
      referred_by: user.referred_by,
      phone: user.phone,
      kyc_status: user.kyc_status,
      status: user.status,
      has_withdrawal_password: hasWithdrawalPassword,
      saved_usdt_address: user.saved_usdt_address || '',
      saved_usdt_network: user.saved_usdt_network || 'TRC-20',
      created_at: user.created_at
    }
  });
}
