import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Trade from '@/models/Trade';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const trades = await Trade.find()
      .populate('user_id', 'name email')
      .sort({ created_at: -1 })
      .limit(100);

    const formatted = trades.map(t => ({
      ...t.toObject(),
      user_name: t.user_id?.name || 'Trader',
      user_email: t.user_id?.email || 'trader@trade.com'
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Admin trades error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
