import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import UserInvestment from '@/models/UserInvestment';

export async function GET(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const investments = await UserInvestment.find({ user_id: user._id }).sort({ created_at: -1 });

    const totalInvested = investments.reduce((acc, curr) => curr.status === 'ACTIVE' ? acc + curr.amount : acc, 0);
    const totalProfitEarned = investments.reduce((acc, curr) => acc + (curr.total_profit_earned || 0), 0);
    const totalDailyRoi = investments.reduce((acc, curr) => curr.status === 'ACTIVE' ? acc + curr.daily_profit : acc, 0);

    return NextResponse.json({
      success: true,
      data: {
        investments,
        summary: {
          totalInvested,
          totalProfitEarned,
          totalDailyRoi,
          activeCount: investments.filter(i => i.status === 'ACTIVE').length
        }
      }
    });
  } catch (err) {
    console.error('Error fetching my investments:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
