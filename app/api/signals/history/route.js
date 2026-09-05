import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Signal from '@/models/Signal';

export async function GET() {
  try {
    await connectToDatabase();
    const signals = await Signal.find().sort({ created_at: -1 }).limit(30);

    return NextResponse.json({
      success: true,
      data: signals
    });
  } catch (err) {
    console.error('Error fetching signals history:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
