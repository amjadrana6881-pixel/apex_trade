import { connectToDatabase } from './db';
import Signal from '@/models/Signal';
import { getPakistanDate, parseSignalTime, formatPKTTime } from './timeUtils';
import { sendPushToAllUsers } from './fcm';

// Keep track of sent notifications for today to prevent duplicates
const sentAlertsTracker = new Map();

/**
 * Checks active signal time vs current Pakistan time and fires 20m, 10m, 5m push notifications
 */
export async function checkAndTriggerSignalCountdownAlerts() {
  try {
    await connectToDatabase();

    const activeSignal = await Signal.findOne({ status: 'ACTIVE' }).sort({ created_at: -1 });
    if (!activeSignal) return;

    const pktNow = getPakistanDate();
    const todayKey = `${pktNow.getFullYear()}-${pktNow.getMonth() + 1}-${pktNow.getDate()}_${activeSignal._id.toString()}`;

    const currentHour = pktNow.getHours();
    const currentMinute = pktNow.getMinutes();
    const currentTotalMins = currentHour * 60 + currentMinute;

    const { hour: sigHour, minute: sigMin } = parseSignalTime(activeSignal.execution_time_pst);
    const signalTotalMins = sigHour * 60 + sigMin;

    // Remaining minutes until signal
    const remainingMins = signalTotalMins - currentTotalMins;

    // 1. 20-Minutes Warning (Between 19 and 21 minutes)
    if (remainingMins >= 19 && remainingMins <= 21) {
      const alertKey = `${todayKey}_20m`;
      if (!sentAlertsTracker.has(alertKey)) {
        sentAlertsTracker.set(alertKey, true);
        await sendPushToAllUsers({
          title: `⏰ 20 Minutes Left - Official Signal!`,
          body: `Today's ${activeSignal.instrument} signal executes at ${activeSignal.execution_time_pst}. Prepare your tradeable capital!`,
          data: {
            type: 'SIGNAL_ALERT',
            signal_id: activeSignal._id.toString(),
            minutes_left: 20
          }
        });
      }
    }

    // 2. 10-Minutes Warning (Between 9 and 11 minutes)
    if (remainingMins >= 9 && remainingMins <= 11) {
      const alertKey = `${todayKey}_10m`;
      if (!sentAlertsTracker.has(alertKey)) {
        sentAlertsTracker.set(alertKey, true);
        await sendPushToAllUsers({
          title: `⚡ 10 Minutes Alert - Signal Starting Soon!`,
          body: `High-accuracy algorithmic window is opening. Get ready to execute ${activeSignal.order_type} on ${activeSignal.instrument}.`,
          data: {
            type: 'SIGNAL_ALERT',
            signal_id: activeSignal._id.toString(),
            minutes_left: 10
          }
        });
      }
    }

    // 3. 5-Minutes Warning (Between 4 and 6 minutes)
    if (remainingMins >= 4 && remainingMins <= 6) {
      const alertKey = `${todayKey}_5m`;
      if (!sentAlertsTracker.has(alertKey)) {
        sentAlertsTracker.set(alertKey, true);
        await sendPushToAllUsers({
          title: `🚀 5 Minutes Warning - Open ApexTrade Now!`,
          body: `Official Signal execution starts in 5 minutes. Tap to open live chart and lock your profits!`,
          data: {
            type: 'SIGNAL_ALERT',
            signal_id: activeSignal._id.toString(),
            minutes_left: 5
          }
        });
      }
    }
  } catch (err) {
    console.error('Signal countdown notifier error:', err);
  }
}
