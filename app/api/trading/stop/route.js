import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { stopTradeEarly } from '@/lib/marketEngine';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { tradeId } = body;

    if (!tradeId) {
      return NextResponse.json({ success: false, error: 'Trade ID is required.' }, { status: 400 });
    }

    const result = await stopTradeEarly(tradeId, user._id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Trade stopped early. -$${result.penaltyFee.toFixed(2)} (${result.penaltyPct}%) fee deducted, +$${result.refundAmount.toFixed(2)} refunded to your balance.`,
      trade: result.trade,
      penaltyPct: result.penaltyPct,
      penaltyFee: result.penaltyFee,
      refundAmount: result.refundAmount,
      updatedBalance: result.updatedBalance
    });
  } catch (err) {
    console.error('Error in stop trade API:', err);
    return NextResponse.json({ success: false, error: 'Server error processing early exit.' }, { status: 500 });
  }
}
