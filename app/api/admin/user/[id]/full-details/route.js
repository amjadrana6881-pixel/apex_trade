import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Deposit from '@/models/Deposit';
import Withdrawal from '@/models/Withdrawal';
import Trade from '@/models/Trade';
import Transaction from '@/models/Transaction';
import UserInvestment from '@/models/UserInvestment';

export async function GET(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    await connectToDatabase();

    const targetUser = await User.findById(id).select('-password -withdrawal_password');
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const deposits = await Deposit.find({ user_id: id }).sort({ created_at: -1 });
    const withdrawals = await Withdrawal.find({ user_id: id }).sort({ created_at: -1 });
    const trades = await Trade.find({ user_id: id }).sort({ created_at: -1 }).limit(50);
    const transactions = await Transaction.find({ user_id: id }).sort({ created_at: -1 }).limit(50);
    const investments = await UserInvestment.find({ user_id: id }).sort({ created_at: -1 });
    const downlines = await User.find({ referred_by: targetUser.referral_code })
      .select('name email referral_code created_at status');

    return NextResponse.json({
      success: true,
      data: {
        user: targetUser,
        deposits,
        withdrawals,
        trades,
        transactions,
        investments,
        downlines
      }
    });
  } catch (err) {
    console.error('User details error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
