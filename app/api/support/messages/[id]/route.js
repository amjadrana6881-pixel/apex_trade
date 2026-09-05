import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import SupportMessage from '@/models/SupportMessage';

export async function DELETE(request, { params }) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'for_everyone'; // 'for_me' or 'for_everyone'

    await connectToDatabase();
    const existing = await SupportMessage.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Message not found.' }, { status: 404 });
    }

    if (user.role !== 'admin' && existing.user_id.toString() !== user._id.toString()) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 403 });
    }

    if (mode === 'for_everyone') {
      existing.deleted_for_everyone = true;
      existing.message = '🚫 This message was deleted';
      existing.image_url = '';
      await existing.save();
      return NextResponse.json({ success: true, message: 'Message deleted for everyone.' });
    } else {
      // mode === 'for_me'
      if (!existing.deleted_by.includes(user._id.toString())) {
        existing.deleted_by.push(user._id.toString());
        await existing.save();
      }
      return NextResponse.json({ success: true, message: 'Message deleted for you.' });
    }
  } catch (err) {
    console.error('Delete message error:', err);
    return NextResponse.json({ success: false, message: 'Failed to delete message.' }, { status: 500 });
  }
}
