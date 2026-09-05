import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import SupportMessage from '@/models/SupportMessage';
import User from '@/models/User';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();

    const userIds = await SupportMessage.distinct('user_id');

    const conversations = await Promise.all(
      userIds.map(async (uid) => {
        const u = await User.findById(uid) || { name: 'Trader', email: 'user@trade.com', wallet_balance: 0 };
        const msgs = await SupportMessage.find({ user_id: uid }).sort({ created_at: 1 });
        const lastMsg = msgs[msgs.length - 1];
        const unread = msgs.filter((m) => m.sender_role === 'user' && !m.is_seen).length;

        return {
          user_id: uid.toString(),
          name: u.name || 'Trader',
          user_name: u.name || 'Trader',
          email: u.email || 'trader@trade.com',
          user_email: u.email || 'trader@trade.com',
          wallet_balance: u.wallet_balance || 0,
          last_message: lastMsg?.message || (lastMsg?.image_url ? '📷 [Image Attachment]' : ''),
          last_image: lastMsg?.image_url || '',
          last_activity: lastMsg?.created_at || new Date().toISOString(),
          unread_count: unread
        };
      })
    );

    // Sort by latest activity
    conversations.sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));

    return NextResponse.json({ success: true, data: conversations });
  } catch (err) {
    console.error('Fetch admin support conversations error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
