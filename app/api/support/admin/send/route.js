import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import SupportMessage from '@/models/SupportMessage';
import { sendPushToUser } from '@/lib/fcm';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  const { errorResponse, user } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    let userId = '';
    let message = '';
    let imageUrl = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      userId = body.userId || '';
      message = body.message || '';
      imageUrl = body.imageUrl || '';
    } else {
      const formData = await request.formData();
      userId = formData.get('userId') || '';
      message = formData.get('message') || '';
      const file = formData.get('image');

      if (file && typeof file === 'object' && file.name) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = path.extname(file.name) || '.jpg';
        const filename = `chat-${Date.now()}-${uuidv4().substring(0, 8)}${ext}`;

        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);
        imageUrl = `/uploads/${filename}`;
      }
    }

    if (!userId) {
      return NextResponse.json({ success: false, message: 'Recipient User ID is required.' }, { status: 400 });
    }

    if (!message.trim() && !imageUrl) {
      return NextResponse.json({ success: false, message: 'Message text or image is required.' }, { status: 400 });
    }

    await connectToDatabase();

    const newMsg = await SupportMessage.create({
      user_id: userId,
      sender_role: 'admin',
      sender_name: user.name || 'ApexTrader Senior Support Desk',
      message: message.trim(),
      image_url: imageUrl,
      is_seen: false
    });

    // Notify user via FCM Lock-screen Push
    try {
      sendPushToUser(userId, {
        title: '🎧 Live Support Reply',
        body: message.trim() || 'Admin sent you an image attachment.',
        data: {
          type: 'SUPPORT_CHAT'
        }
      }).catch(e => console.error('User push error:', e));
    } catch (pushErr) {}

    return NextResponse.json({
      success: true,
      data: {
        id: newMsg._id.toString(),
        _id: newMsg._id.toString(),
        user_id: newMsg.user_id,
        sender_role: newMsg.sender_role,
        sender_name: newMsg.sender_name,
        message: newMsg.message,
        image_url: newMsg.image_url,
        is_seen: newMsg.is_seen,
        is_edited: newMsg.is_edited,
        created_at: newMsg.created_at
      }
    });
  } catch (err) {
    console.error('Admin send message error:', err);
    return NextResponse.json({ success: false, message: 'Failed to send admin message.' }, { status: 500 });
  }
}
