import { connectToDatabase } from './db';
import DeviceToken from '@/models/DeviceToken';
import User from '@/models/User';
import fs from 'fs';
import path from 'path';

let firebaseAdmin = null;

/**
 * Initialize Firebase Admin SDK lazily
 */
async function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;

  try {
    const admin = await import('firebase-admin');
    
    // 1. Check for service account file
    const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
    let serviceAccount = null;

    if (fs.existsSync(serviceAccountPath)) {
      try {
        const raw = fs.readFileSync(serviceAccountPath, 'utf8');
        serviceAccount = JSON.parse(raw);
      } catch (e) {}
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {}
    }

    if (serviceAccount && !admin.default.apps.length) {
      admin.default.initializeApp({
        credential: admin.default.credential.cert(serviceAccount)
      });
      firebaseAdmin = admin.default;
      return firebaseAdmin;
    } else if (admin.default.apps.length) {
      firebaseAdmin = admin.default;
      return firebaseAdmin;
    }
  } catch (err) {
    // Firebase admin package optional until user configures it
  }
  return null;
}

/**
 * Dispatch Push Notification to a specific list of FCM tokens
 */
export async function sendPushNotification({ tokens = [], title, body, data = {}, appType = 'user' }) {
  if (!tokens || tokens.length === 0) return { success: false, reason: 'No tokens' };

  try {
    const fb = await getFirebaseAdmin();
    if (!fb) {
      console.log(`📢 [FCM NOTIFICATION LOG - (${appType.toUpperCase()})] To: ${tokens.length} devices | Title: "${title}" | Body: "${body}"`);
      return { success: true, mocked: true, message: 'FCM logged (Firebase credentials pending)' };
    }

    const messagePayload = {
      notification: {
        title,
        body
      },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'apextrade_high_alerts',
          priority: 'max',
          visibility: 'public'
        }
      },
      tokens
    };

    const response = await fb.messaging().sendEachForMulticast(messagePayload);
    console.log(`🚀 [FCM DISPATCHED] Success: ${response.successCount}, Failed: ${response.failureCount}`);
    return { success: true, successCount: response.successCount, failureCount: response.failureCount };
  } catch (err) {
    console.error('Error sending FCM push:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send push notification to a specific user by userId
 */
export async function sendPushToUser(userId, { title, body, data = {} }) {
  try {
    await connectToDatabase();
    const records = await DeviceToken.find({ user_id: userId, app_type: 'user' });
    const tokens = records.map(r => r.token);
    if (tokens.length === 0) return { success: false, reason: 'User has no registered devices' };
    return await sendPushNotification({ tokens, title, body, data, appType: 'user' });
  } catch (err) {
    console.error('sendPushToUser error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Broadcast push notification to ALL registered traders
 */
export async function sendPushToAllUsers({ title, body, data = {} }) {
  try {
    await connectToDatabase();
    const records = await DeviceToken.find({ app_type: 'user' });
    const tokens = records.map(r => r.token);
    if (tokens.length === 0) return { success: false, reason: 'No user devices found' };
    return await sendPushNotification({ tokens, title, body, data, appType: 'user' });
  } catch (err) {
    console.error('sendPushToAllUsers error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send push notification to all Super Admin devices
 */
export async function sendPushToAdmins({ title, body, data = {} }) {
  try {
    await connectToDatabase();
    const records = await DeviceToken.find({ app_type: 'admin' });
    const tokens = records.map(r => r.token);
    if (tokens.length === 0) return { success: false, reason: 'No admin devices found' };
    return await sendPushNotification({ tokens, title, body, data, appType: 'admin' });
  } catch (err) {
    console.error('sendPushToAdmins error:', err);
    return { success: false, error: err.message };
  }
}
