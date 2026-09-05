import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function PUT(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await request.json();
    const { trade_mode, custom_win_rate } = body;

    if (!['AUTO', 'FORCE_WIN', 'FORCE_LOSS'].includes(trade_mode)) {
      return NextResponse.json({ success: false, message: 'Invalid trade mode.' }, { status: 400 });
    }

    const winRate = Number(custom_win_rate) >= 0 ? Number(custom_win_rate) : 0.50;

    await connectToDatabase();
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    targetUser.trade_mode = trade_mode;
    targetUser.custom_win_rate = winRate;
    await targetUser.save();

    return NextResponse.json({
      success: true,
      message: `User trade mode updated to ${trade_mode} (Win rate: ${Math.round(winRate * 100)}%).`
    });
  } catch (err) {
    console.error('Admin user trade mode error:', err);
    return NextResponse.json({ success: false, message: 'Failed to update trade mode.' }, { status: 500 });
  }
}
