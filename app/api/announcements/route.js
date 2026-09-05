import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Announcement from '@/models/Announcement';

export async function GET() {
  try {
    await connectToDatabase();
    const list = await Announcement.find({ is_active: true }).sort({ created_at: -1 }).limit(20);
    return NextResponse.json({ success: true, data: list });
  } catch (err) {
    console.error('Error fetching announcements:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
