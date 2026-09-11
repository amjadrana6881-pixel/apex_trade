import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import DeviceToken from '@/models/DeviceToken';
import { verifyJwtToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, app_type = 'user', device_os = 'android', userId: bodyUserId, user_id: bodyUserId2 } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false, message: 'FCM Token is required.' }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Try extracting user from Authorization header if present
    let detectedUserId = bodyUserId || bodyUserId2 || null;
    const authHeader = request.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const jwtToken = authHeader.substring(7);
      const decoded = verifyJwtToken(jwtToken);
      if (decoded && (decoded.id || decoded._id)) {
        detectedUserId = decoded.id || decoded._id;
      }
    }

    // Prepare update object: only overwrite user_id if a valid non-null userId was provided
    const updateFields = {
      token,
      app_type: app_type === 'admin' ? 'admin' : 'user',
      device_os,
      updated_at: new Date()
    };

    if (detectedUserId) {
      updateFields.user_id = detectedUserId;
    }

    // Upsert device token
    const result = await DeviceToken.findOneAndUpdate(
      { token },
      { $set: updateFields },
      { upsert: true, new: true }
    );

    console.log(`📱 [FCM TOKEN REGISTERED] Token: ${token.substring(0, 14)}... | App: ${updateFields.app_type} | User: ${result.user_id || 'anonymous'}`);

    return NextResponse.json({
      success: true,
      message: 'Device push notification token registered.',
      userId: result.user_id
    });
  } catch (err) {
    console.error('Error saving FCM token:', err);
    return NextResponse.json({ success: false, message: 'Server error saving token' }, { status: 500 });
  }
}

