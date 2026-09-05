import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Signal from '@/models/Signal';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const signals = await Signal.find().sort({ created_at: -1 });
    return NextResponse.json({ success: true, data: signals });
  } catch (err) {
    console.error('Admin signals list error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
