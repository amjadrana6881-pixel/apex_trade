/**
 * Pakistan Standard Time (PKT / PST, UTC+5) Helpers
 */

/**
 * Returns current Date adjusted to Pakistan Standard Time (UTC+5)
 */
export function getPakistanDate() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 5)); // UTC+5
}

/**
 * Formats a date string or object to standard Pakistan Time: "DD MMM YYYY, hh:mm A PKT"
 */
export function formatPKT(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(d) + ' PKT';
}

/**
 * Formats time only in Pakistan Time: "07:00 PM PKT"
 */
export function formatPKTTime(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d) + ' PKT';
}

/**
 * Parse signal time string e.g. "07:00 PM", "19:00", "02:00 PM (PKT)"
 * Returns { hour, minute } in 24h format.
 */
export function parseSignalTime(timeStr) {
  if (!timeStr) return { hour: 19, minute: 0 };
  const clean = timeStr.toUpperCase().replace(/\(PST\)|\(PKT\)|PST|PKT/g, '').trim();
  const match = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return { hour: 19, minute: 0 };

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const meridiem = match[3];

  if (meridiem) {
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
  }
  return { hour, minute };
}

/**
 * Returns current date string in Pakistan Time as 'YYYY-MM-DD'
 */
export function getPakistanDateString(dateInput) {
  const d = dateInput ? new Date(dateInput) : getPakistanDate();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates complete timing breakdown for a signal.
 * - Live Entry Window: strictly during the signal duration (e.g. 180 seconds for 3-minute trade)
 * - Auto-Expiry Cutoff: scheduled time + max(300, duration * 2) (e.g. 6 mins for 3m, 10 mins for 5m)
 */
export function getSignalTimeWindow(signal) {
  if (!signal) {
    return {
      isValid: false,
      isLiveWindow: false,
      isExpired: true,
      isBeforeSignal: false,
      secondsUntilStart: 0,
      secondsRemainingInLiveWindow: 0
    };
  }

  const pktNow = getPakistanDate();
  const todayPktStr = getPakistanDateString(pktNow);
  const signalDateStr = signal.scheduled_date || (signal.created_at ? getPakistanDateString(new Date(signal.created_at)) : todayPktStr);

  const isPastDate = signalDateStr < todayPktStr;
  const isFutureDate = signalDateStr > todayPktStr;
  const isToday = signalDateStr === todayPktStr;

  const durationSeconds = Math.max(30, Number(signal.duration_seconds) || 180);
  // Auto-expiry offset: duration * 2 (minimum 5 minutes, e.g. 6 mins for 180s, 10 mins for 300s)
  const expiryOffsetSeconds = Math.max(300, durationSeconds * 2);

  const { hour: sigHour, minute: sigMin } = parseSignalTime(signal.execution_time_pst);
  const signalStartSeconds = sigHour * 3600 + sigMin * 60;
  const liveEntryEndSeconds = signalStartSeconds + durationSeconds;
  const expiryCutoffSeconds = signalStartSeconds + expiryOffsetSeconds;

  const currentSeconds = pktNow.getHours() * 3600 + pktNow.getMinutes() * 60 + pktNow.getSeconds();

  if (isPastDate) {
    return {
      isValid: true,
      isToday: false,
      isPastDate: true,
      isLiveWindow: false,
      isExpired: true,
      isBeforeSignal: false,
      durationSeconds,
      secondsUntilStart: 0,
      secondsRemainingInLiveWindow: 0
    };
  }

  if (isFutureDate) {
    return {
      isValid: true,
      isToday: false,
      isPastDate: false,
      isLiveWindow: false,
      isExpired: false,
      isBeforeSignal: true,
      durationSeconds,
      secondsUntilStart: 86400,
      secondsRemainingInLiveWindow: 0
    };
  }

  // Same Day (Today)
  if (currentSeconds < signalStartSeconds) {
    // Before Signal Scheduled Time
    return {
      isValid: true,
      isToday: true,
      isPastDate: false,
      isLiveWindow: false,
      isExpired: false,
      isBeforeSignal: true,
      durationSeconds,
      secondsUntilStart: signalStartSeconds - currentSeconds,
      secondsRemainingInLiveWindow: 0
    };
  } else if (currentSeconds >= signalStartSeconds && currentSeconds <= liveEntryEndSeconds) {
    // Strictly Inside Live Execution Window (e.g. within the 180 seconds duration)
    return {
      isValid: true,
      isToday: true,
      isPastDate: false,
      isLiveWindow: true,
      isExpired: false,
      isBeforeSignal: false,
      durationSeconds,
      secondsUntilStart: 0,
      secondsRemainingInLiveWindow: liveEntryEndSeconds - currentSeconds
    };
  } else if (currentSeconds > liveEntryEndSeconds && currentSeconds < expiryCutoffSeconds) {
    // Entry Window Closed, within post-signal grace before full expiry
    return {
      isValid: true,
      isToday: true,
      isPastDate: false,
      isLiveWindow: false,
      isExpired: false,
      isBeforeSignal: false,
      durationSeconds,
      secondsUntilStart: 0,
      secondsRemainingInLiveWindow: 0,
      secondsUntilExpiry: expiryCutoffSeconds - currentSeconds
    };
  } else {
    // Current time is past expiry cutoff (e.g. 6 mins past 3-min signal, 10 mins past 5-min signal)
    return {
      isValid: true,
      isToday: true,
      isPastDate: false,
      isLiveWindow: false,
      isExpired: true,
      isBeforeSignal: false,
      durationSeconds,
      secondsUntilStart: 0,
      secondsRemainingInLiveWindow: 0
    };
  }
}

/**
 * Returns true strictly if current time is within the signal execution window
 */
export function isCurrentlySignalTime(signal) {
  if (!signal || signal.status !== 'ACTIVE') return false;
  const windowInfo = getSignalTimeWindow(signal);
  return windowInfo.isLiveWindow;
}

/**
 * Returns true if signal has passed its expiry threshold
 */
export function isSignalExpired(signal) {
  if (!signal) return true;
  if (signal.status === 'EXPIRED' || signal.status === 'ARCHIVED') return true;
  const windowInfo = getSignalTimeWindow(signal);
  return windowInfo.isExpired;
}

/**
 * Auto-expires any past active signals in database
 */
export async function autoExpirePastSignals() {
  try {
    const Signal = (await import('@/models/Signal')).default;
    const activeSignals = await Signal.find({ status: 'ACTIVE' });
    for (const sig of activeSignals) {
      if (isSignalExpired(sig)) {
        sig.status = 'EXPIRED';
        await sig.save();
      }
    }
  } catch (err) {
    console.error('Error in autoExpirePastSignals:', err);
  }
}
