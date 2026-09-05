import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Trade from '@/models/Trade';

export async function GET(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get('pageSize')) || 10));
    const skip = (page - 1) * pageSize;

    await connectToDatabase();

    const totalCount = await Trade.countDocuments({ user_id: user._id });
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    const trades = await Trade.find({ user_id: user._id })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize);

    return NextResponse.json({
      success: true,
      data: trades,
      meta: {
        page,
        pageSize,
        total: totalCount,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching trade history:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
