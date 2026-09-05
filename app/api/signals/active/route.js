import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Signal from '@/models/Signal';

export async function GET() {
  try {
    await connectToDatabase();
    const activeSignal = await Signal.findOne({ status: 'ACTIVE' }).sort({ created_at: -1 });

    return NextResponse.json({
      success: true,
      data: activeSignal || null
    });
  } catch (err) {
    console.error('Error fetching active signal:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
