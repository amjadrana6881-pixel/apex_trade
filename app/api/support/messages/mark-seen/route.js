import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import SupportMessage from '@/models/SupportMessage';

export async function POST(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    await SupportMessage.updateMany(
      { user_id: user._id, sender_role: 'admin', is_seen: false },
      { is_seen: true }
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
