import { connectToDatabase } from './db.js';
import DeviceToken from '../models/DeviceToken.js';
import fs from 'fs';
import path from 'path';

let messagingInstance = null;

export const FCM_CHANNELS = {
  USER: 'apextrade_user_channel_v3',
  ADMIN: 'apextrade_admin_channel_v3'
};

const DEFAULT_FIREBASE_CONFIG = {
  type: "service_account",
  project_id: "apextrade-pro-995ad",
  private_key_id: "d80e1c7e5a4a79463987211250dc1ee328fcc7d2",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCoI7TmTmWjnqN4\nUX+j+YqrE5Ul0Inhwt3Rmwrx27FZZu+IJJ+R2Vq5ZtQhZL5bUBk9zyMHopz/GTP1\nIa4hRzTEHsVdWPCoK/TjahsOS4epBPCpnfF0N7uOGw0jqVD01MUBEiQLBB7D8IYj\nPj/HWCqiHK8kjexW308TvvljwlcVwHtPe3adKU2sLS3T3FwcW6fFdSPpSGrcHXNj\nM4ffeq6OqqXRtwISJgRSh8vw6NDoCLwyGXb3FpVQ5Wf3/roDO7IIf7QVXoMtMFjw\no1lgtGWA3UjgoUnvdlaFfh0JRmLsJyYN1q6MOQBOzoRiARvZJ4aZ3KDtoXQ+tc5v\nbksWy//VAgMBAAECggEABYvszD+d86oGYUml59Dvxrlfput+iGRdmU4yxaF3WlLr\nTnkHWK3jwa5ex1ldXnlffv4EwXoOqtpRp3cYO4JFGOA2/Io0OvTJ3AoiXJ7TxF0k\nn0PNTo5bk1rY9i5mkeFO+ETOmQuAFWGz7CnXVXCbVMQ/NLWyo5mrMDVeHJugRYtN\n0ZRcI8muQGpxXfedUQpsXNZ2Np76aQbPlR3AEAHS2zhUq1S7/xuvDoQpfq6SJMjU\nWI1FTMqh+Hgmlp/s4KQcrpTYw7ROY1V4bGnoMoxZZi4DEYSPeuqKl4R2Ww4R+w3w\nyBvJ5wHejnORq2IZa9AVuLQo/MU9rYbFB3vr4RZl5QKBgQDQScRUeG/IQT2pZBb5\n+2OV/x4GrV23EMlXD9W7fOCX3nu88N97k4FQ+ylRAAUXbZJRTlYOUfzZqFxzYw7d\n0Abdzdh43Gn4FSUaC3BWuF3GezcNXdADDvdTpJwyYWcbaZ2UlpFatPl5LOoExkj1\nge0xBkgi5oRs9adgmUGPdDVNNwKBgQDOp5R2vlnGqNSbrwl9/x44t6V3NbqRYAdM\nn3dcuilmVc/0uFoutN3l4Tb+Br2fzc3yzESveNB2vva3jAbaBnSffi42VXn1qxj0\ne5lrjHpvc8udEUvBUHboLGRFs3s/g57MnHCoRPj5XMy/Ez2huqZ37unvlfJ3HDIx\n48xLUt9BUwKBgGmrAs9Xyl3tuzqUbJOl1X/jTXhVu5WEDqD8h5H2aHqjhGL2UGqB\nCrnqsatGN08LZ4+YDlB1h7FkmIJxXrlpMBKWu5uVNq2FDK2J4BQetHRdTjCZx03F\n6fOlLxjgEU725drcCCHcbjPrdU22yozCvXKBnVcXW1dryN5Y4cnFSsVBAoGBAIOi\nt61T3zfuP0/UFYXOxl92i839yZPkyYGDarMEWm63ZroJ3Fg4GcjexvrVLGDo5bEt\ncOsdWBzr05hjd9HVnuAhrioqFH/qtwC04qthVnQ8HI02gTzolnWaIV1M0MtKehL3\n68Mj/DxLYpisFuw4SuXGp/lXWJWKvmaNJosshM3FAoGBAKKgdye5vg/hC4WCdRwm\nD50CA8t/ydAFIN0+Tr+dIQw0GOSwAq5TgxSklUncUTVggfb6wwoenMpFkBhJzK5y\nDU9aScXlfiXTSqYjb7IziAMYp3PIlZul6i6ZIyA6isGFyzx2HBvGwk/jD6vuQTI2\nk+Pfhn5pbYOVrbJq7skekzS0\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@apextrade-pro-995ad.iam.gserviceaccount.com",
  client_id: "109999286035504829139",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40apextrade-pro-995ad.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

/**
 * Initialize Firebase Admin Messaging SDK lazily
 */
async function getFirebaseMessaging() {
  if (messagingInstance) return messagingInstance;

  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getMessaging } = await import('firebase-admin/messaging');

    let serviceAccount = null;

    // 1. Try environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT env:', e);
      }
    }

    // 2. Try file system
    if (!serviceAccount) {
      const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
      if (fs.existsSync(serviceAccountPath)) {
        try {
          const raw = fs.readFileSync(serviceAccountPath, 'utf8');
          serviceAccount = JSON.parse(raw);
        } catch (e) {
          console.error('Error parsing firebase-service-account.json:', e);
        }
      }
    }

    // 3. Fallback to embedded config
    if (!serviceAccount) {
      serviceAccount = DEFAULT_FIREBASE_CONFIG;
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
    
    // 1. Direct search by app_type = 'admin'
    const adminAppRecords = await DeviceToken.find({ app_type: 'admin' });
    let tokens = adminAppRecords.map(r => r.token).filter(Boolean);

    // 2. Also include tokens for any user with role = 'ADMIN' or 'admin'
    try {
      const User = (await import('../models/User.js')).default;
      const adminUsers = await User.find({ role: { $in: ['ADMIN', 'admin', 'SuperAdmin'] } }, '_id');
      const adminIds = adminUsers.map(u => u._id);
      if (adminIds.length > 0) {
        const userRecords = await DeviceToken.find({ user_id: { $in: adminIds } });
        tokens = [...tokens, ...userRecords.map(r => r.token).filter(Boolean)];
      }
    } catch (userLookupErr) {
      console.warn('Admin user lookup warning:', userLookupErr);
    }

    // 3. Fallback: If no admin-specific tokens found, fallback to all active devices
    if (tokens.length === 0) {
      const fallbackTokens = await DeviceToken.find({}).sort({ updated_at: -1 }).limit(10);
      tokens = fallbackTokens.map(r => r.token).filter(Boolean);
    }

    // Deduplicate and clean
    tokens = [...new Set(tokens.filter(t => t && typeof t === 'string' && t.length > 10))];

    if (tokens.length === 0) {
      console.warn('⚠️ [sendPushToAdmins] No registered admin device tokens found.');
      return { success: false, reason: 'No admin devices found' };
    }

    console.log(`📡 [sendPushToAdmins] Dispatching to ${tokens.length} admin device(s) | Title: "${title}"`);
    return await sendPushNotification({ tokens, title, body, data, appType: 'admin' });
  } catch (err) {
    console.error('sendPushToAdmins error:', err);
    return { success: false, error: err.message };
  }
}
