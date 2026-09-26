/*
 * Patient requests (appointments, call backs, questions).
 *
 * Set VITE_REQUEST_ENDPOINT in a `.env` file to POST every request as JSON to
 * your backend, CRM, Zapier/Make webhook, Formspree, etc. Without it the site
 * runs in demo mode and keeps requests in this browser's localStorage.
 */
const ENDPOINT = import.meta.env.VITE_REQUEST_ENDPOINT;
const STORE_KEY = 'mirrors:requests';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function makeRef() {
  const a = Date.now().toString(36).slice(-3);
  const b = Math.random().toString(36).slice(2, 5);
  return `MD-${(a + b).toUpperCase()}`;
}

export async function submitRequest(type, fields) {
  const record = { ref: makeRef(), type, ...fields, createdAt: new Date().toISOString() };

  if (ENDPOINT) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
  } else {
    await wait(900);
  }

  try {
    const all = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    all.push(record);
    localStorage.setItem(STORE_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable — ignore */
  }
  return record.ref;
}

/* ---------- Dates ---------- */
const pad = (n) => String(n).padStart(2, '0');
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Next `count` days the clinic is open (skips Sundays), starting tomorrow. */
export function nextOpenDays(count = 6) {
  const out = [];
  const d = new Date();
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) continue;
    out.push({
      value: isoDate(d),
      label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
    });
  }
  return out;
}

export const TIME_SLOTS = ['3:00 pm', '3:30 pm', '4:00 pm', '4:30 pm', '5:00 pm', '5:30 pm', '6:00 pm', '6:30 pm'];

/** Downloads a tentative calendar event for a requested appointment. */
export function downloadIcs({ date, time, title, ref }) {
  const m = /(\d+):(\d+)\s*(am|pm)/i.exec(time || '9:00 am');
  let h = Number(m[1]) % 12;
  if (m[3].toLowerCase() === 'pm') h += 12;
  const [y, mo, d] = date.split('-').map(Number);
  const start = new Date(y, mo - 1, d, h, Number(m[2]));
  const end = new Date(start.getTime() + 45 * 60000);
  const fmt = (x) =>
    `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Mirrors Dermatology Clinic//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${ref}@themirrors`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${title} (requested)`,
    'LOCATION:The Mirrors Dermatology Clinic\\, First Floor\\, 1/95D\\, Avinashi Rd\\, Neelambur\\, Coimbatore 641062',
    `DESCRIPTION:Reference ${ref}. Our team will call to confirm this time.`,
    'STATUS:TENTATIVE',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `the-mirrors-${ref}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
