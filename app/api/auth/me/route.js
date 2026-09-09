import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { processExpiredTrades } from '@/lib/marketEngine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  await connectToDatabase();
  await processExpiredTrades();

  const freshUser = await User.findById(user._id);
  const targetUser = freshUser || user;

  const hasWithdrawalPassword = Boolean(targetUser.withdrawal_password && targetUser.withdrawal_password.trim().length > 0);

  return NextResponse.json({
    success: true,
    user: {
      id: targetUser._id.toString(),
      _id: targetUser._id.toString(),
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      wallet_balance: targetUser.wallet_balance,
      tradeable_amount: targetUser.tradeable_amount,
      investment_balance: targetUser.investment_balance,
      referral_code: targetUser.referral_code,
      referred_by: targetUser.referred_by,
      phone: targetUser.phone,
      kyc_status: targetUser.kyc_status,
      status: targetUser.status,
      has_withdrawal_password: hasWithdrawalPassword,
      saved_usdt_address: targetUser.saved_usdt_address || '',
      saved_usdt_network: targetUser.saved_usdt_network || 'TRC-20',
      created_at: targetUser.created_at
    }
  });
}
