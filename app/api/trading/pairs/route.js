import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import TradingPair from '@/models/TradingPair';
import { tickMarketPrices, processExpiredTrades } from '@/lib/marketEngine';
import { checkAndTriggerSignalCountdownAlerts } from '@/lib/signalCountdownNotifier';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectToDatabase();
    await tickMarketPrices();
    processExpiredTrades().catch(() => {});
    checkAndTriggerSignalCountdownAlerts().catch(() => {});
    const pairs = await TradingPair.find({ is_active: true });
    return NextResponse.json({ success: true, pairs, data: pairs });
  } catch (err) {
    console.error('Error fetching trading pairs:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch trading pairs.', pairs: [], data: [] }, { status: 500 });
  }
}
