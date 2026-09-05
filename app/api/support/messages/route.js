import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import SupportMessage from '@/models/SupportMessage';

export async function GET(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();

    // Mark admin messages as seen by user
    await SupportMessage.updateMany(
      { user_id: user._id, sender_role: 'admin', is_seen: false },
      { is_seen: true }
    );

    const messages = await SupportMessage.find({ user_id: user._id }).sort({ created_at: 1 });

    const formatted = messages
      .filter((m) => !(m.deleted_by || []).includes(user._id.toString()))
      .map((m) => {
        if (m.deleted_for_everyone) {
          return {
            id: m._id.toString(),
            _id: m._id.toString(),
            user_id: m.user_id,
            sender_role: m.sender_role,
            sender_name: m.sender_name,
            message: '🚫 This message was deleted',
            image_url: '',
            is_seen: m.is_seen,
            is_edited: m.is_edited,
            deleted_for_everyone: true,
            isDeletedForEveryone: true,
            created_at: m.created_at
          };
        }
        return {
          id: m._id.toString(),
          _id: m._id.toString(),
          user_id: m.user_id,
          sender_role: m.sender_role,
          sender_name: m.sender_name,
          message: m.message,
          image_url: m.image_url,
          is_seen: m.is_seen,
          is_edited: m.is_edited,
          deleted_for_everyone: m.deleted_for_everyone,
          created_at: m.created_at
        };
      });

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Fetch support messages error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
