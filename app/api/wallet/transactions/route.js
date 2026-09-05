import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Transaction from '@/models/Transaction';
import Deposit from '@/models/Deposit';
import Withdrawal from '@/models/Withdrawal';

export async function GET(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();

    const transactions = await Transaction.find({ user_id: user._id })
      .sort({ created_at: -1 })
      .limit(100);

    const deposits = await Deposit.find({ user_id: user._id })
      .sort({ created_at: -1 });

    const withdrawals = await Withdrawal.find({ user_id: user._id })
      .sort({ created_at: -1 });

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        deposits,
        withdrawals
      }
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
