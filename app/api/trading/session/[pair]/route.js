import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import TradingPair from '@/models/TradingPair';

export async function GET(request, { params }) {
  try {
    const { pair } = await params;
    const cleanPair = (pair || '').replace('/', '').toUpperCase();

    await connectToDatabase();
    const pairData = await TradingPair.findOne({ symbol: cleanPair, is_active: true });

    if (!pairData) {
      return NextResponse.json({ success: false, message: 'Pair not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        symbol: pairData.symbol,
        name: pairData.name,
        category: pairData.category,
        currentPrice: pairData.current_price,
        payoutRate: pairData.payout_rate,
        minBalance: 1.0,
        minTrade: 1.0,
        durations: [30, 60, 120, 180] // Max 3 Minutes
      }
    });
  } catch (err) {
    console.error('Error fetching trade session:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
