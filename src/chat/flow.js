/*
 * Aura — the guided chat assistant.
 *
 * Each node can:
 *   say      – messages (strings or rich cards) the bot sends on arrival
 *   options  – quick-reply chips [{ label, value }]
 *   input    – free-text prompt { placeholder, type, validate(v) → true | 'error' }
 *   field    – key in `data` where the answer is stored
 *   next     – next node id, or (value, data) => id
 *   enter    – (data) => void, runs on arrival
 *   skipIf   – (data) => bool, skip straight to `next`
 *   run      – async (data) => void, e.g. submit the request
 *   returnable – after an edit from the review screen, jump back to review
 */
import { submitRequest, nextOpenDays, TIME_SLOTS } from '../api';
import { SERVICES, TEAM } from '../data';

export const first = (n = '') => n.trim().split(/\s+/)[0];

export const MAIN_OPTIONS = [
  { label: 'Book an appointment', value: 'book' },
  { label: 'Ask about a treatment', value: 'treatments' },
  { label: 'Prices & insurance', value: 'prices' },
  { label: 'Hours & location', value: 'hours' },
  { label: 'Send a question', value: 'enquiry' },
  { label: 'Contact the clinic', value: 'contact' },
];

const opt = (label, value = label) => ({ label, value });

const BOOKING_FIELDS = ['concern', 'patientType', 'visitType', 'doctor', 'date', 'dateLabel', 'time', 'notes'];

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Hmm, that email doesn’t look quite right — could you check it?';
const isPhone = (v) => (v.replace(/\D/g, '').length >= 7 && /^[+()\d\s.-]+$/.test(v.trim())) || 'That doesn’t look like a phone number — could you try again?';
const isName = (v) => v.trim().length >= 2 || 'Please tell me your name so our team knows who to contact.';

export const NODES = {
  welcome: {
    say: (d) => [
      `Hi${d.name ? ` ${first(d.name)}` : ''}! I’m Aura, Mirrors Dema’s virtual care assistant. 👋`,
      'I can book an appointment, answer common questions or put you in touch with our team. What can I help with?',
    ],
    options: MAIN_OPTIONS,
    next: (v) => v,
    menu: true,
  },
  menu: {
    say: ['Is there anything else I can help you with?'],
    options: MAIN_OPTIONS,
    next: (v) => v,
    menu: true,
  },
  fallback: {
    say: ['Sorry, I didn’t quite catch that — I’m a simple assistant, not a doctor. 🙂', 'Here’s what I can help with:'],
    options: MAIN_OPTIONS,
    next: (v) => v,
    menu: true,
  },
  error: {
    say: [
      'I’m sorry — something went wrong sending that to our team.',
      { type: 'contact' },
      'Please call or email us directly and we’ll look after you straight away.',
    ],
    next: 'menu',
  },

  /* ---------- Booking ---------- */
  book: {
    enter: (d) => {
      d._flow = 'booking';
    },
    say: (d) =>
      d.concern
        ? [`Great choice — let’s book you in for ${d.concern}. It only takes a minute.`]
        : ['Lovely — let’s get you booked in. It only takes a minute.'],
    next: 'concern',
  },
  concern: {
    skipIf: (d) => !!d.concern,
    say: ['What would you like to see us about?'],
    options: [...SERVICES.map((s) => opt(s.title)), opt('Not sure yet — general consult', 'General consultation')],
    input: { placeholder: 'Or describe your concern…' },
    field: 'concern',
    next: 'patientType',
    returnable: true,
  },
  patientType: {
    say: ['Have you visited Mirrors Dema before?'],
    options: [opt('I’m a new patient', 'New patient'), opt('I’ve been before', 'Returning patient')],
    field: 'patientType',
    next: 'visitType',
  },
  visitType: {
    skipIf: (d) => {
      if (d.visitType) return true;
      if (/cancer|mole/i.test(d.concern || '')) {
        d.visitType = 'In clinic';
        return true;
      }
      return false;
    },
    say: ['Would you like to come into the clinic, or have a secure video consultation?'],
    options: [opt('🏥 In clinic', 'In clinic'), opt('💻 Video consult', 'Video consult')],
    field: 'visitType',
    next: 'doctor',
  },
  doctor: {
    skipIf: (d) => !!d.doctor,
    say: ['Do you have a preferred dermatologist?'],
    options: [opt('No preference'), ...TEAM.map((t) => opt(t.name))],
    field: 'doctor',
    next: 'day',
    returnable: true,
  },
  day: {
    say: ['Which day works best for you?'],
    options: () => nextOpenDays(6),
    field: 'date',
    next: 'time',
  },
  time: {
    say: (d) => [`${d.dateLabel} it is. What time suits you?`],
    options: TIME_SLOTS.map((t) => opt(t)),
    field: 'time',
    next: 'askName',
    returnable: true,
  },

  /* ---------- Shared contact details ---------- */
  askName: {
    skipIf: (d) => !!d.name,
    say: ['Perfect. What’s your full name?'],
    input: { placeholder: 'Full name', autoComplete: 'name', validate: isName },
    field: 'name',
    next: (_, d) => (d._flow === 'enquiry' ? 'askEmail' : 'askPhone'),
  },
  askPhone: {
    skipIf: (d) => !!d.phone,
    say: (d) => [`Thanks, ${first(d.name)}! What’s the best phone number to reach you on?`],
    input: { placeholder: 'Phone number', type: 'tel', autoComplete: 'tel', validate: isPhone },
    field: 'phone',
    next: (_, d) => (d._flow === 'callback' ? 'cbTime' : 'askEmail'),
  },
  askEmail: {
    skipIf: (d) => !!d.email,
    say: ['And your email address? We’ll send your confirmation there.'],
    input: { placeholder: 'you@email.com', type: 'email', autoComplete: 'email', validate: isEmail },
    field: 'email',
    next: (_, d) => (d._flow === 'enquiry' ? 'eqSubmit' : 'notes'),
    returnable: true,
  },

  notes: {
    say: ['Anything you’d like your dermatologist to know beforehand? (optional)'],
    options: [opt('Nothing to add', '')],
    input: { placeholder: 'e.g. flare-ups on my cheeks for 3 months' },
    field: 'notes',
    next: 'review',
  },
  review: {
    say: ['Here’s a summary of your request:', { type: 'summary' }, 'Shall I send this to our care team?'],
    options: [opt('✓ Yes, send it', 'send'), opt('Change something', 'edit'), opt('Cancel', 'cancel')],
    next: (v) => ({ send: 'bookSubmit', edit: 'edit', cancel: 'cancelled' })[v] || 'review',
  },
  edit: {
    say: ['No problem — what would you like to change?'],
    options: [opt('Treatment', 'concern'), opt('Date & time', 'day'), opt('Dermatologist', 'doctor'), opt('Contact details', 'details')],
    next: (v, d) => {
      d._return = 'review';
      if (v === 'concern') delete d.concern;
      if (v === 'doctor') delete d.doctor;
      if (v === 'details') {
        delete d.name;
        delete d.phone;
        delete d.email;
        return 'askName';
      }
      return v;
    },
  },
  cancelled: {
    enter: (d) => BOOKING_FIELDS.forEach((k) => delete d[k]),
    say: ['No worries — nothing has been sent.'],
    next: 'menu',
  },
  bookSubmit: {
    run: async (d) => {
      d.ref = await submitRequest('appointment', {
        concern: d.concern,
        patientType: d.patientType,
        visitType: d.visitType,
        doctor: d.doctor,
        date: d.date,
        time: d.time,
        name: d.name,
        phone: d.phone,
        email: d.email,
        notes: d.notes,
      });
    },
    say: [{ type: 'confirm', kind: 'booking' }],
    next: 'postBook',
  },
  postBook: {
    enter: (d) => BOOKING_FIELDS.forEach((k) => delete d[k]),
    next: 'menu',
  },

  /* ---------- Treatment info ---------- */
  treatments: {
    say: ['Which treatment would you like to know about?'],
    options: [...SERVICES.map((s) => opt(s.title, s.slug)), opt('← Back to menu', 'menu')],
    field: 'topic',
    next: (v) => (v === 'menu' ? 'menu' : 'treatmentInfo'),
  },
  treatmentInfo: {
    say: (d) => [{ type: 'treatment', slug: d.topic }],
    options: [opt('Book this treatment', 'book'), opt('Another treatment', 'treatments'), opt('Main menu', 'menu')],
    next: (v, d) => {
      if (v === 'book') d.concern = SERVICES.find((s) => s.slug === d.topic)?.title;
      return v;
    },
  },

  /* ---------- Info ---------- */
  prices: {
    say: [
      { type: 'prices' },
      'Most medical dermatology is claimable with insurance. You’ll always get a written quote before any procedure, and payment plans are available.',
    ],
    options: [opt('Book an appointment', 'book'), opt('Main menu', 'menu')],
    next: (v) => v,
  },
  hours: {
    say: [{ type: 'hours' }, 'We’re on the first floor at 1/95D, Avinashi Road, Neelambur — tap the address above for Google Maps directions.'],
    options: [opt('Book an appointment', 'book'), opt('Contact the clinic', 'contact'), opt('Main menu', 'menu')],
    next: (v) => v,
  },
  contact: {
    say: ['You can reach our care team directly here:', { type: 'contact' }, 'Or I can arrange for someone to call you back.'],
    options: [opt('📞 Request a call back', 'callback'), opt('Main menu', 'menu')],
    next: (v) => v,
  },

  /* ---------- Call back ---------- */
  callback: {
    enter: (d) => {
      d._flow = 'callback';
    },
    say: ['Of course! A member of our care team will give you a call.'],
    next: 'askName',
  },
  cbTime: {
    say: ['When is the best time to call?'],
    options: [opt('As soon as possible'), opt('3 – 5 pm'), opt('5 – 7 pm')],
    field: 'callTime',
    next: 'cbSubmit',
  },
  cbSubmit: {
    run: async (d) => {
      d.ref = await submitRequest('callback', { name: d.name, phone: d.phone, callTime: d.callTime });
    },
    say: [{ type: 'confirm', kind: 'callback' }],
    next: 'menu',
  },

  /* ---------- Question / enquiry ---------- */
  enquiry: {
    enter: (d) => {
      d._flow = 'enquiry';
    },
    say: ['Of course. Type your question below and our team will reply by email, usually within one business day.'],
    input: {
      placeholder: 'Your question…',
      validate: (v) => v.trim().length > 4 || 'Could you tell me a little more?',
    },
    field: 'question',
    next: 'askName',
  },
  eqSubmit: {
    run: async (d) => {
      d.ref = await submitRequest('enquiry', { name: d.name, email: d.email, question: d.question });
    },
    say: [{ type: 'confirm', kind: 'enquiry' }],
    next: 'menu',
  },
};

/* ---------- Free-text understanding (keyword based) ---------- */
export const EMERGENCY =
  /(emergenc|can'?t breathe|cannot breathe|anaphyla|throat (is )?(closing|swelling)|bleeding (a lot|heavily|won'?t stop)|severe (pain|swelling|reaction)|suicid)/i;

const SERVICE_WORDS = [
  [/acne|pimple|breakout|eczema|dermatitis|psoriasis|rosacea|rash|itch|hives/i, 'medical-dermatology'],
  [/mole|cancer|melanoma|spot check|skin check|mohs|biopsy|lesion/i, 'skin-cancer'],
  [/laser|ipl|scar|pigment|melasma|sun ?damage|resurfac/i, 'laser-resurfacing'],
  [/peel|facial|microneedl|hydrafacial|pores?|blackhead/i, 'peels-facials'],
  [/botox|wrinkle|filler|anti.?ag|ageing|aging|lines|volume/i, 'age-well-aesthetics'],
  [/hair|scalp|bald|thinning|alopecia|prp|dandruff/i, 'hair-scalp'],
];

export function detectIntent(text, data) {
  const t = text.toLowerCase();
  if (/price|cost|fee|how much|insurance|pay|expensive|cheap/.test(t)) return 'prices';
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
