import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Withdrawal from '@/models/Withdrawal';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const withdrawals = await Withdrawal.find()
      .populate('user_id', 'name email')
      .sort({ created_at: -1 });

    const formatted = withdrawals.map(w => ({
      ...w.toObject(),
      user_name: w.user_id?.name || 'Trader',
      user_email: w.user_id?.email || 'trader@trade.com'
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Admin withdrawals error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
