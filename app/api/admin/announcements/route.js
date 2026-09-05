import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Announcement from '@/models/Announcement';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const list = await Announcement.find().sort({ created_at: -1 });
    return NextResponse.json({ success: true, data: list });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { title, content, category } = body;

    await connectToDatabase();
    await Announcement.create({
      title,
      content,
      category: category || 'General',
      is_active: true
    });

    return NextResponse.json({ success: true, message: 'Announcement published!' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to publish announcement.' }, { status: 500 });
  }
}
