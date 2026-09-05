import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Trade from '@/models/Trade';
import { resolveTradeRecord } from '@/lib/marketEngine';

export async function GET(request, { params }) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    await connectToDatabase();

    const trade = await Trade.findOne({ _id: id, user_id: user._id });
    if (!trade) {
      return NextResponse.json({ success: false, error: 'Trade not found.' }, { status: 404 });
    }

    if (trade.status === 'RESOLVED') {
      return NextResponse.json({ success: true, trade });
    }

    const now = Date.now();
    const expiryTime = new Date(trade.resolves_at).getTime();

    if (now >= expiryTime) {
      const resolved = await resolveTradeRecord(trade);
      return NextResponse.json({ success: true, trade: resolved });
    }

    const secondsRemaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
    return NextResponse.json({ success: true, trade, secondsRemaining });
  } catch (err) {
    console.error('Error in trade resolution query:', err);
    return NextResponse.json({ success: false, error: 'Failed to query trade status.' }, { status: 500 });
  }
}
