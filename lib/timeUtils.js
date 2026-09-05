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
 * Verifies whether current Pakistan Time is within the valid signal execution window (+/- 30 minutes)
 */
export function isCurrentlySignalTime(signal) {
  if (!signal || signal.status !== 'ACTIVE') return false;
  
  const pktNow = getPakistanDate();
  const currentHour = pktNow.getHours();
  const currentMinute = pktNow.getMinutes();
  const currentTotalMins = currentHour * 60 + currentMinute;

  const { hour: sigHour, minute: sigMin } = parseSignalTime(signal.execution_time_pst);
  const signalTotalMins = sigHour * 60 + sigMin;

  // Valid if within 30 minutes before or after scheduled execution time
  const diff = Math.abs(currentTotalMins - signalTotalMins);
  return diff <= 30;
}
