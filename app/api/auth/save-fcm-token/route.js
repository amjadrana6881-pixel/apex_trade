import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import DeviceToken from '@/models/DeviceToken';
import { verifyJwtToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, app_type = 'user', device_os = 'android' } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false, message: 'FCM Token is required.' }, { status: 400 });
    }

    await connectToDatabase();

    // Try extracting user from Authorization header if present
    let userId = null;
    const authHeader = request.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const jwtToken = authHeader.substring(7);
      const decoded = verifyJwtToken(jwtToken);
      if (decoded && (decoded.id || decoded._id)) {
        userId = decoded.id || decoded._id;
      }
    }

    // Upsert device token
    await DeviceToken.findOneAndUpdate(
      { token },
      {
        user_id: userId,
        token,
        app_type: app_type === 'admin' ? 'admin' : 'user',
        device_os,
        updated_at: new Date()
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: 'Device push notification token registered.' });
  } catch (err) {
    console.error('Error saving FCM token:', err);
    return NextResponse.json({ success: false, message: 'Server error saving token' }, { status: 500 });
  }
}
