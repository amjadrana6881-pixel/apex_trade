import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Trade from '@/models/Trade';
import { resolveTradeRecord } from '@/lib/marketEngine';

export async function GET(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const runningTrade = await Trade.findOne({
      user_id: user._id,
      status: 'PENDING'
    }).sort({ created_at: -1 });

    if (!runningTrade) {
      return NextResponse.json({ success: true, hasActiveTrade: false });
    }

    const now = Date.now();
    const expiryTime = new Date(runningTrade.resolves_at).getTime();
    const secondsRemaining = Math.max(0, Math.floor((expiryTime - now) / 1000));

    // If time has elapsed, auto-resolve it
    if (secondsRemaining <= 0) {
      const resolved = await resolveTradeRecord(runningTrade);
      return NextResponse.json({
        success: true,
        hasActiveTrade: false,
        lastResolvedTrade: resolved
      });
    }

    return NextResponse.json({
      success: true,
      hasActiveTrade: true,
      trade: runningTrade,
      secondsRemaining
    });
  } catch (err) {
    console.error('Active trade check error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
