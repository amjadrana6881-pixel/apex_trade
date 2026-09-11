import { connectToDatabase } from './db.js';
import DeviceToken from '../models/DeviceToken.js';
import fs from 'fs';
import path from 'path';

let messagingInstance = null;

export const FCM_CHANNELS = {
  USER: 'apextrade_user_channel_v3',
  ADMIN: 'apextrade_admin_channel_v3'
};

/**
 * Initialize Firebase Admin Messaging SDK lazily
 */
async function getFirebaseMessaging() {
  if (messagingInstance) return messagingInstance;

  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getMessaging } = await import('firebase-admin/messaging');

    // Check for service account file
    const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
    let serviceAccount = null;

    if (fs.existsSync(serviceAccountPath)) {
      try {
        const raw = fs.readFileSync(serviceAccountPath, 'utf8');
        serviceAccount = JSON.parse(raw);
      } catch (e) {
        console.error('Error parsing firebase-service-account.json:', e);
      }
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT env:', e);
      }
    }

    if (serviceAccount) {
      const apps = getApps();
      let app;
      if (apps.length === 0) {
        app = initializeApp({
          credential: cert(serviceAccount)
        });
      } else {
        app = apps[0];
      }
      messagingInstance = getMessaging(app);
      return messagingInstance;
    }
  } catch (err) {
    console.error('Firebase Admin init error:', err);
  }
  return null;
}

/**
 * Dispatch Push Notification to a specific list of FCM tokens with Popup / Heads-Up & Lock Screen visibility
 */
export async function sendPushNotification({ tokens = [], title, body, data = {}, appType = 'user' }) {
  if (!tokens || tokens.length === 0) return { success: false, reason: 'No tokens provided' };

  // Remove duplicates and empty strings
  const cleanTokens = [...new Set(tokens.filter(t => t && typeof t === 'string' && t.trim().length > 10))];
  if (cleanTokens.length === 0) return { success: false, reason: 'No valid tokens' };

  const channelId = appType === 'admin' ? FCM_CHANNELS.ADMIN : FCM_CHANNELS.USER;

  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.log(`📢 [FCM LOG (${appType.toUpperCase()})] To: ${cleanTokens.length} devices | Title: "${title}" | Body: "${body}"`);
      return { success: true, mocked: true, message: 'FCM logged (Firebase credentials not loaded)' };
    }

    const stringData = Object.fromEntries(
      Object.entries({
        ...data,
        title: title || 'ApexTrader Alert',
        body: body || '',
        message: body || '',
        channel_id: channelId,
        channelId: channelId,
        appType,
        sound: 'default',
        priority: 'high',
        visibility: 'public',
        timestamp: String(Date.now())
      }).map(([k, v]) => [k, String(v ?? '')])
    );

    const messagePayload = {
      notification: {
        title,
        body
      },
      data: stringData,
      android: {
        priority: 'high',
        ttl: 86400 * 1000, // 24 hours
        notification: {
          channelId,
          title,
          body,
          priority: 'max',
          visibility: 'public',
          sound: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
          defaultLightSettings: true,
          notificationPriority: 'PRIORITY_MAX'
        }
      },
      tokens: cleanTokens
    };

    const response = await messaging.sendEachForMulticast(messagePayload);
    console.log(`🚀 [FCM DISPATCHED (${appType.toUpperCase()})] Success: ${response.successCount}, Failed: ${response.failureCount} | Title: "${title}"`);

    // Clean up dead tokens if needed
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const errorCode = resp.error.code;
          if (errorCode === 'messaging/registration-token-not-registered' || errorCode === 'messaging/invalid-registration-token') {
            const deadToken = cleanTokens[idx];
            DeviceToken.deleteOne({ token: deadToken }).catch(() => { });
          }
        }
      });
    }

    return { success: true, successCount: response.successCount, failureCount: response.failureCount };
  } catch (err) {
    console.error('Error sending FCM push:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send push notification to a specific user by userId (with fallback to active user tokens)
 */
export async function sendPushToUser(userId, { title, body, data = {} }) {
  try {
    await connectToDatabase();
    let records = [];
    if (userId) {
      records = await DeviceToken.find({ user_id: userId, app_type: 'user' });
    }

    let tokens = records.map(r => r.token);

    // Fallback: If no token explicitly linked to this userId, send to all recent active user devices so alerts aren't dropped
    if (tokens.length === 0) {
      const fallbackRecords = await DeviceToken.find({ app_type: 'user' }).sort({ updated_at: -1 }).limit(10);
      tokens = fallbackRecords.map(r => r.token);
    }

    if (tokens.length === 0) return { success: false, reason: 'No registered user devices found' };
    return await sendPushNotification({ tokens, title, body, data, appType: 'user' });
  } catch (err) {
    console.error('sendPushToUser error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Broadcast push notification to ALL registered traders (User App)
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
 * Send push notification to ALL Super Admin devices (Admin App)
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
