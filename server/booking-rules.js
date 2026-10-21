/*
 * Appointment booking rules — used by both the website's booking form and the server.
 * Change them here and both stay in step.
 */
export const BOOKING = {
  timeZone: 'Asia/Kolkata',
  openDays: [1, 2, 3, 4, 5, 6], // Monday – Saturday (0 = Sunday, holiday)
  start: '15:00', // first appointment
  end: '19:00', // clinic closes (last slot starts one slot earlier)
  slotMinutes: 30,
  minNoticeDays: 0, // patients can book from today (remaining slots) onwards
  daysAhead: 60, // …up to two months ahead
};

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const label = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
};

/** ['3:00 pm', '3:30 pm', … '6:30 pm'] */
export function timeSlots() {
  const out = [];
  for (let t = toMinutes(BOOKING.start); t + BOOKING.slotMinutes <= toMinutes(BOOKING.end); t += BOOKING.slotMinutes) {
    out.push(label(t));
  }
  return out;
}

/** Today's date in the clinic's time zone, as YYYY-MM-DD */
export const todayISO = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: BOOKING.timeZone }).format(now);

export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const isOpenDay = (iso) => BOOKING.openDays.includes(new Date(`${iso}T00:00:00Z`).getUTCDay());

export const isISODate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

/** Open days a patient can choose from, e.g. tomorrow → two weeks ahead (staff may also book today) */
export function bookableDays({ now = new Date(), staff = false } = {}) {
  const today = todayISO(now);
  const out = [];
  for (let i = staff ? 0 : BOOKING.minNoticeDays; i <= BOOKING.daysAhead; i++) {
    const iso = addDays(today, i);
    if (isOpenDay(iso)) out.push(iso);
  }
  return out;
}

export function isBookable(date, time, { now = new Date(), staff = false } = {}) {
  if (!isISODate(date) || !timeSlots().includes(time) || !isOpenDay(date)) return false;
  const today = todayISO(now);
  // Staff can book any open day from today on; patients only within the booking window
  return staff ? date >= today : bookableDays({ now }).includes(date);
}

/** 'Tue, 6 Oct' */
export const dayLabel = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/** Time slots already past for today in the clinic's timezone — used to grey them out for patients */
export function pastTimeSlots(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: BOOKING.timeZone, hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour').value);
  const m = Number(parts.find((p) => p.type === 'minute').value);
  const nowMins = h * 60 + m;
  return timeSlots().filter((slot) => {
    const [timePart, period] = slot.split(' ');
    const [sh, sm] = timePart.split(':').map(Number);
    const sH = sh === 12 ? (period === 'am' ? 0 : 12) : (period === 'pm' ? sh + 12 : sh);
    return sH * 60 + sm <= nowMins;
  });
}
