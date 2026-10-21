/*
 * Aura — the guided chat assistant.
 *
 * Each node can:
 *   say      – messages (strings or rich cards) the bot sends on arrival
 *   options  – quick-reply chips [{ label, value, nav }]
 *   input    – free-text prompt { placeholder, type, validate(v) → true | 'error' }
 *              (The chat text box is ONLY enabled on nodes that define `input`.)
 *   field    – key in `data` where the answer is stored
 *   next     – next node id, or (value, data) => id
 *   enter    – (data) => void, runs on arrival
 *   skipIf   – (data) => bool, skip straight to `next`
 *   run      – async (data) => void, e.g. fetch slots or submit the request
 */
import { submitRequest } from '../api';
import { api } from '../backend';
import { bookableDays, dayLabel, isISODate, timeSlots, todayISO } from '../../server/booking-rules.js';
import { COORDINATOR, SERVICES } from '../data';

export const first = (n = '') => n.trim().split(/\s+/)[0];

export const MAIN_OPTIONS = [
  { label: 'Book an appointment', value: 'book' },
  { label: 'Ask about a treatment', value: 'treatments' },
  { label: 'Hours & location', value: 'hours' },
  { label: 'Send a question', value: 'enquiry' },
  { label: 'Contact the clinic', value: 'contact' },
];

const opt = (label, value = label, nav = false) => ({ label, value, nav });
const backOpt = (label = '← Back to menu', value = 'menu') => ({ label, value, nav: true });

export const isEmail = (v) =>
  /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v.trim()) ||
  `That email doesn’t look right — please use the format name@example.com.`;
export const isPhone = (v) => {
  const trimmed = v.trim();
  if (trimmed && !/^[+()[\]\d\s.\-]+$/.test(trimmed))
    return `Please enter digits only (e.g. 9876543210).`;
  const digits = trimmed.replace(/\D/g, '');
  const local = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
  return local.length === 10 || `Please enter a valid 10-digit mobile number.`;
};
export const isName = (v) => v.trim().length >= 2 || 'Please tell me your name so our team knows who to contact.';

export function normalizeDob(raw = '') {
  const s = raw.trim();
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return s;
}

export const isDob = (v) => {
  const iso = normalizeDob(v);
  if (!isISODate(iso) || iso > todayISO() || iso < '1900-01-01') {
    return 'Please select or enter a valid date of birth.';
  }
  return true;
};

const getOfflineSlots = () => ({
  times: timeSlots(),
  days: bookableDays().map((date) => ({ date, label: dayLabel(date), booked: [] })),
});

async function loadSlots(d) {
  try {
    d._slots = await api('/slots');
  } catch {
    d._slots = getOfflineSlots();
  }
}

export const NODES = {
  welcome: {
    say: (d) => [
      `Hi${d.name ? ` ${first(d.name)}` : ''}! I’m Aura, the virtual care assistant at THE MIRRORS DERMATOLOGY CLINIC. 👋`,
      'I can book your appointment right here in the chat, answer treatment questions or connect you with our team. Please choose an option below:',
    ],
    options: MAIN_OPTIONS,
    next: (v) => v,
    menu: true,
  },
  menu: {
    say: ['Is there anything else I can help you with? Please select an option below:'],
    options: MAIN_OPTIONS,
    next: (v) => v,
    menu: true,
  },
  fallback: {
    say: ['Please select one of the options below so I can help you right away:'],
    options: MAIN_OPTIONS,
    next: (v) => v,
    menu: true,
  },
  error: {
    say: [
      'I’m sorry — I couldn’t send that to our team just now.',
      { type: 'contact' },
      'Please call, WhatsApp or email us directly and we’ll look after you straight away.',
    ],
    next: 'menu',
  },

  /* ---------- In-chat Appointment Booking ---------- */
  book: {
    enter: (d) => {
      d._flow = 'appointment';
      delete d.date;
      delete d.dateLabel;
      delete d.time;
      delete d._slotTaken;
      delete d.visitType;
      delete d.existingRef;
    },
    run: async (d) => {
      await loadSlots(d);
    },
    next: (_, d) => (d.concern ? 'bookVisitType' : 'bookConcern'),
  },
  bookConcern: {
    say: ['Let’s book your appointment right here. What would you like to see the doctor for?'],
    options: [
      opt('General consultation (Skin / Hair / Nails)', 'General consultation'),
      ...SERVICES.map((s) => opt(s.title, s.title)),
      backOpt(),
    ],
    field: 'concern',
    next: (v, d) => {
      if (v === 'menu') {
        delete d.concern;
        return 'menu';
      }
      return 'bookVisitType';
    },
  },
  bookVisitType: {
    say: ['Is this your first visit with us, or a follow-up / revisit?'],
    options: [
      opt('First-time visit', 'first'),
      opt('Existing patient — Revisit / Follow-up', 'revisit'),
      opt('Rebook / Reschedule a cancelled 1st visit', 'rescheduled_first'),
      opt('Change treatment', 'bookConcern', true),
      backOpt(),
    ],
    field: 'visitType',
    next: (v, d) => {
      if (v === 'menu') return 'menu';
      if (v === 'bookConcern') {
        delete d.concern;
        return 'bookConcern';
      }
      if (v === 'revisit' || v === 'rescheduled_first') return 'bookRef';
      d.existingRef = '';
      return 'bookDate';
    },
  },
  bookRef: {
    say: [
      'If you have your previous Reference Code (e.g. MD-7A2F9B), please type it below so we link this visit to your existing patient ID — or tap “Skip” if you don’t have it handy:',
    ],
    input: {
      placeholder: 'Type Ref code (e.g. MD-7A2F9B)…',
      validate: (v) =>
        /^MD-[A-Z0-9]{4,10}$/i.test(v.trim()) ||
        'Please enter a valid code starting with MD- (e.g. MD-7A2F9B), or tap “Skip” above.',
    },
    options: [opt('Skip (don’t have code handy)', 'skip', true), backOpt('← Back', 'bookVisitType')],
    field: 'existingRef',
    next: (v, d) => {
      if (v === 'bookVisitType') return 'bookVisitType';
      if (v === 'skip') {
        d.existingRef = '';
        return 'bookDate';
      }
      d.existingRef = String(d.existingRef || '').trim().toUpperCase();
      return 'bookDate';
    },
  },
  bookDate: {
    say: (d) => [
      d.concern
        ? `Booking for: ${d.concern}. Which day works best for you? (Mon – Sat, 3:00 – 7:00 pm)`
        : 'Which day works best for your appointment? (Mon – Sat, 3:00 – 7:00 pm)',
    ],
    options: (d) => {
      const s = d._slots || getOfflineSlots();
      const openDays = s.days.filter((day) => day.booked.length < s.times.length);
      return [
        ...openDays.map((day) => opt(day.label, day.date)),
        opt('Change treatment', 'bookConcern', true),
        backOpt(),
      ];
    },
    field: 'date',
    next: (v, d) => {
      if (v === 'menu') return 'menu';
      if (v === 'bookConcern') {
        delete d.concern;
        return 'bookConcern';
      }
      return 'bookTime';
    },
  },
  bookTime: {
    say: (d) => [
      d._slotTaken
        ? `${d._slotTaken} Please pick another available time on ${d.dateLabel || dayLabel(d.date)}:`
        : `Which time slot on ${d.dateLabel || dayLabel(d.date)} suits you best?`,
    ],
    enter: (d) => {
      delete d._slotTaken;
    },
    options: (d) => {
      const s = d._slots || getOfflineSlots();
      const day = s.days.find((x) => x.date === d.date);
      const booked = day?.booked || [];
      const free = s.times.filter((t) => !booked.includes(t));
      return [
        ...free.map((t) => opt(t, t)),
        opt('← Choose another day', 'bookDate', true),
        backOpt(),
      ];
    },
    field: 'time',
    next: (v) => (v === 'bookDate' || v === 'menu' ? v : 'askName'),
  },
  askDob: {
    skipIf: (d) => !!d.dob,
    say: ['Please select or type your date of birth below:'],
    input: { placeholder: 'Select date of birth', type: 'date', autoComplete: 'bday', validate: isDob },
    options: [backOpt('← Cancel booking', 'menu')],
    field: 'dob',
    next: (v, d) => {
      if (v === 'menu') return 'menu';
      d.dob = normalizeDob(d.dob);
      return 'bookConfirm';
    },
  },
  bookConfirm: {
    say: () => [{ type: 'bookingPreview' }],
    options: [
      opt('✅ Confirm & book appointment', 'bookSubmit', true),
      opt('Change date / time', 'bookDate', true),
      opt('Change treatment', 'bookConcern', true),
      backOpt('← Cancel', 'menu'),
    ],
    next: (v, d) => {
      if (v === 'bookConcern') delete d.concern;
      return v;
    },
  },
  bookSubmit: {
    run: async (d) => {
      try {
        d.ref = await submitRequest('appointment', {
          name: d.name,
          phone: d.phone,
          email: d.email,
          dob: normalizeDob(d.dob),
          date: d.date,
          time: d.time,
          concern: d.concern,
          visitType: d.visitType || 'first',
          existingRef: d.existingRef || '',
        });
      } catch (err) {
        if (err.code === 'slot_taken') {
          await loadSlots(d);
          d._slotTaken = err.message;
          return;
        }
        throw err;
      }
    },
    skipIf: () => false,
    say: (d) => (d._slotTaken ? [] : [{ type: 'confirm', kind: 'appointment' }]),
    next: (_, d) => {
      if (d._slotTaken) return 'bookTime';
      delete d.concern;
      return 'menu';
    },
  },

  /* ---------- Shared contact details (Name + Mobile Number + Email always collected) ---------- */
  askName: {
    skipIf: (d) => !!d.name,
    say: ['Perfect. Please type your full name in the box below:'],
    input: { placeholder: 'Type your full name…', autoComplete: 'name', validate: isName },
    options: [backOpt('← Cancel', 'menu')],
    field: 'name',
    next: (v) => (v === 'menu' ? 'menu' : 'askPhone'),
  },
  askPhone: {
    // For enquiries always ask — the clinic needs a confirmed number for every question.
    // For bookings / callbacks, reuse a number already given this session.
    skipIf: (d) => !!d.phone && d._flow !== 'enquiry',
    say: (d) => [`Thanks, ${first(d.name)}! What mobile number should our team call you on?`],
    input: { placeholder: 'Type your mobile number…', type: 'tel', autoComplete: 'tel', validate: isPhone },
    options: [backOpt('← Cancel', 'menu')],
    field: 'phone',
    next: (v) => (v === 'menu' ? 'menu' : 'askEmail'),
  },
  askEmail: {
    // Same — enquiries always need a fresh email address.
    skipIf: (d) => !!d.email && d._flow !== 'enquiry',
    say: ['And what email address should we reply to?'],
    input: { placeholder: 'you@email.com', type: 'email', autoComplete: 'email', validate: isEmail },
    options: [backOpt('← Cancel', 'menu')],
    field: 'email',
    next: (v, d) => {
      if (v === 'menu') return 'menu';
      if (d._flow === 'callback') return 'cbTime';
      if (d._flow === 'appointment') return 'askGender';
      return 'eqSubmit';
    },
  },
  askGender: {
    skipIf: (d) => !!d.gender,
    say: ['One more thing — what is your gender? This helps our doctors prepare.'],
    options: [
      opt('Male', 'male'),
      opt('Female', 'female'),
      opt('Other / Prefer not to say', 'other'),
      backOpt('← Cancel', 'menu'),
    ],
    field: 'gender',
    next: (v) => (v === 'menu' ? 'menu' : 'askDob'),
  },

  /* ---------- Treatment info ---------- */
  treatments: {
    say: ['Which treatment would you like to know about?'],
    options: [...SERVICES.map((s) => opt(s.title, s.slug)), backOpt()],
    field: 'topic',
    next: (v) => (v === 'menu' ? 'menu' : 'treatmentInfo'),
  },
  treatmentInfo: {
    say: (d) => [{ type: 'treatment', slug: d.topic }],
    options: [
      opt('Book this treatment', 'book', true),
      opt('Enquire about this treatment', 'enquiry', true),
      opt('Another treatment', 'treatments', true),
      backOpt('Main menu', 'menu'),
    ],
    next: (v, d) => {
      if (v === 'book' || v === 'enquiry') {
        d.concern = SERVICES.find((s) => s.slug === d.topic)?.title;
      }
      return v;
    },
  },

  /* ---------- Info ---------- */
  fees: {
    say: [
      'Fees depend on your consultation and any treatment you need, so our team shares them directly. Please call or WhatsApp us, or send an enquiry right here.',
      { type: 'contact' },
    ],
    options: [
      opt('Book an appointment', 'book', true),
      opt('Send a fee enquiry', 'enquiry', true),
      backOpt('Main menu', 'menu'),
    ],
    next: (v) => v,
  },
  hours: {
    say: [
      { type: 'hours' },
      'We’re on the first floor at 1/95D, Avinashi Road, Neelambur — about 200 metres from Neelambur bus stop, with roadside parking. Please note there is no lift. Tap the address above for directions.',
    ],
    options: [opt('Book an appointment', 'book', true), opt('Contact the clinic', 'contact', true), backOpt('Main menu', 'menu')],
    next: (v) => v,
  },
  contact: {
    say: [
      `Appointments and enquiries are handled by ${COORDINATOR.name} (${COORDINATOR.title}). You can reach her directly here:`,
      { type: 'contact' },
      'Or I can ask her to call you back.',
    ],
    options: [opt('📞 Request a call back', 'callback', true), opt('Book an appointment', 'book', true), backOpt('Main menu', 'menu')],
    next: (v) => v,
  },

  /* ---------- Call back ---------- */
  callback: {
    enter: (d) => {
      d._flow = 'callback';
    },
    say: [`Of course! ${COORDINATOR.name} from our team will give you a call.`],
    next: 'askName',
  },
  cbTime: {
    say: ['When is the best time to call?'],
    options: [opt('As soon as possible'), opt('3 – 5 pm'), opt('5 – 7 pm'), backOpt('← Cancel', 'menu')],
    field: 'callTime',
    next: (v) => (v === 'menu' ? 'menu' : 'cbSubmit'),
  },
  cbSubmit: {
    run: async (d) => {
      d.ref = await submitRequest('callback', {
        name: d.name,
        phone: d.phone,
        email: d.email,
        message: d.callTime,
      });
    },
    say: [{ type: 'confirm', kind: 'callback' }],
    next: 'menu',
  },

  /* ---------- Question / enquiry ---------- */
  enquiry: {
    enter: (d) => {
      d._flow = 'enquiry';
    },
    say: (d) => [
      d.concern
        ? `Please type your question about ${d.concern} in the box below, and we’ll collect your mobile number and email so ${COORDINATOR.name} can get back to you:`
        : `Of course. Please type your question in the box below, and we’ll collect your mobile number and email so ${COORDINATOR.name} can reply promptly:`,
    ],
    input: {
      placeholder: 'Type your question…',
      validate: (v) => v.trim().length > 4 || 'Could you tell me a little more?',
    },
    options: [backOpt('← Cancel', 'menu')],
    field: 'question',
    next: (v) => (v === 'menu' ? 'menu' : 'askName'),
  },
  eqSubmit: {
    run: async (d) => {
      d.ref = await submitRequest('enquiry', {
        name: d.name,
        phone: d.phone,
        email: d.email,
        concern: d.concern,
        message: d.concern ? `[${d.concern}] ${d.question}` : d.question,
      });
      delete d.concern;
    },
    say: [{ type: 'confirm', kind: 'enquiry' }],
    next: 'menu',
  },
};

/* ---------- Emergency keyword check ---------- */
export const EMERGENCY =
  /(emergenc|can'?t breathe|cannot breathe|anaphyla|throat (is )?(closing|swelling)|bleeding (a lot|heavily|won'?t stop)|severe (pain|swelling|reaction)|suicid)/i;

const SERVICE_WORDS = [
  [/scar|pit|crater/i, 'acne-scar-revision'],
  [/keloid/i, 'keloid-treatment'],
  [/pigment|melasma|dark ?spot|tan|uneven|marks/i, 'pigmentation-melasma'],
  [/laser|unwanted hair|facial hair|body hair|hair removal/i, 'laser-hair-removal'],
  [/prp|gfc|hair ?(fall|loss)|thinning|bald|alopecia/i, 'prp-gfc'],
  [/peel/i, 'chemical-peeling'],
  [/medifacial|facial|dull|glow/i, 'medifacial'],
  [/ear ?lobe|earlobe|torn ear/i, 'ear-lobe-repair'],
  [/mole|wart|cyst|skin ?tag/i, 'mole-wart-cyst-skin-tag-removal'],
  [/acne|pimple|breakout/i, 'chemical-peeling'],
];

export function detectIntent(text, data) {
  const t = text.toLowerCase();
  if (/price|cost|fee|charge|how much|insurance|pay|expensive|cheap/.test(t)) return 'fees';
  if (/\b(book|appointment|appt|schedule|reserve|consult(ation)?)\b/.test(t)) {
    const svc = SERVICE_WORDS.find(([re]) => re.test(t));
    if (svc) data.concern = SERVICES.find((s) => s.slug === svc[1]).title;
    return 'book';
  }
  if (/call ?back|call me|ring me/.test(t)) return 'callback';
  if (/hour|open|close|when are you|where|address|location|direction|park|find you/.test(t)) return 'hours';
  if (/phone|human|person|someone|staff|contact|whats ?app|email|speak|talk/.test(t)) return 'contact';
  const svc = SERVICE_WORDS.find(([re]) => re.test(t));
  if (svc) {
    data.topic = svc[1];
    return 'treatmentInfo';
  }
  if (/question|ask|enquir|inquir/.test(t)) return 'enquiry';
  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(t)) return 'welcome';
  if (/thank/.test(t)) return 'thanks';
  return null;
}

NODES.thanks = {
  say: ['You’re very welcome! 😊'],
  next: 'menu',
};

