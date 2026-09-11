import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

async function handleUserTradeMode(request, params) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await request.json();
    const trade_mode = body.trade_mode || body.tradeMode;
    const custom_win_rate = body.custom_win_rate || body.customWinRate;

    const validModes = ['AUTO', 'FORCE_WIN', 'FORCE_LOSS', 'OFFICIAL_SIGNAL_PROTECTION'];
    let finalMode = 'AUTO';
    if (trade_mode && validModes.includes(trade_mode.toUpperCase())) {
      finalMode = trade_mode.toUpperCase();
    }

    const winRate = !isNaN(Number(custom_win_rate)) && Number(custom_win_rate) >= 0 ? Number(custom_win_rate) : 0.50;

    await connectToDatabase();
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    targetUser.trade_mode = finalMode;
    targetUser.custom_win_rate = winRate;
    await targetUser.save();

    return NextResponse.json({
      success: true,
      message: `User trade mode updated to ${finalMode}.`,
      trade_mode: finalMode,
      custom_win_rate: winRate
    });
  } catch (err) {
    console.error('Admin user trade mode error:', err);
    return NextResponse.json({ success: false, message: 'Failed to update trade mode.', error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  return handleUserTradeMode(request, params);
}

export async function PUT(request, { params }) {
  return handleUserTradeMode(request, params);
}
