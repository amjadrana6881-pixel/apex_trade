import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import SupportMessage from '@/models/SupportMessage';

export async function PUT(request, { params }) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, message: 'Message text is required.' }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await SupportMessage.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Message not found.' }, { status: 404 });
    }

    if (existing.deleted_for_everyone) {
      return NextResponse.json({ success: false, message: 'Cannot edit a deleted message.' }, { status: 400 });
    }

    // Permission check
    if (user.role !== 'admin' && existing.user_id.toString() !== user._id.toString()) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 403 });
    }

    existing.message = message.trim();
    existing.is_edited = true;
    await existing.save();

    return NextResponse.json({
      success: true,
      data: {
        id: existing._id.toString(),
        _id: existing._id.toString(),
        user_id: existing.user_id,
        sender_role: existing.sender_role,
        sender_name: existing.sender_name,
        message: existing.message,
        image_url: existing.image_url,
        is_seen: existing.is_seen,
        is_edited: existing.is_edited,
        created_at: existing.created_at
      }
    });
  } catch (err) {
    console.error('Edit message error:', err);
    return NextResponse.json({ success: false, message: 'Failed to edit message.' }, { status: 500 });
  }
}
