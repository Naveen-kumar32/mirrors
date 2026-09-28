export function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* Live open/closed status for the clinic (Mon–Sat, 3–7 pm, India time) */
export function clinicStatus(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const day = get('weekday');
  const mins = Number(get('hour')) * 60 + Number(get('minute'));
  const OPEN = 15 * 60;
  const CLOSE = 19 * 60;

  if (day !== 'Sun' && mins >= OPEN && mins < CLOSE) return { open: true, text: 'Open now · until 7 pm' };
  if (day !== 'Sun' && mins < OPEN) return { open: false, text: 'Opens today at 3 pm' };
  if (day === 'Sat' || day === 'Sun') return { open: false, text: 'Opens Monday at 3 pm' };
  return { open: false, text: 'Opens tomorrow at 3 pm' };
}
