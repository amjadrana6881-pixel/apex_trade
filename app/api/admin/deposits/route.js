import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Deposit from '@/models/Deposit';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const deposits = await Deposit.find()
      .populate('user_id', 'name email referral_code referred_by')
      .sort({ created_at: -1 });

    const formatted = deposits.map(d => ({
      ...d.toObject(),
      user_name: d.user_id?.name || 'Trader',
      user_email: d.user_id?.email || 'trader@trade.com',
      referral_code: d.user_id?.referral_code || '',
      referred_by: d.user_id?.referred_by || ''
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Admin deposits error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
