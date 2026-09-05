import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({
      status: 'online',
      platform: 'ApexTrade Next.js Full-Stack Option & Signals Platform',
      database: 'MongoDB Connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json({
      status: 'degraded',
      error: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
