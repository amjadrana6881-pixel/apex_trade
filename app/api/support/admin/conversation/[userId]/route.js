import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import SupportMessage from '@/models/SupportMessage';
import User from '@/models/User';

export async function GET(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { userId } = await params;
    await connectToDatabase();

    // Mark user messages as seen by Admin
    await SupportMessage.updateMany(
      { user_id: userId, sender_role: 'user', is_seen: false },
      { is_seen: true }
    );

    const targetUser = await User.findById(userId);
    const messages = await SupportMessage.find({ user_id: userId }).sort({ created_at: 1 });

    const formatted = messages.map((m) => {
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

    return NextResponse.json({
      success: true,
      data: {
        user: targetUser ? {
          id: targetUser._id.toString(),
          name: targetUser.name,
          email: targetUser.email,
          wallet_balance: targetUser.wallet_balance
        } : null,
        messages: formatted
      }
    });
  } catch (err) {
    console.error('Fetch admin conversation detail error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
