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
 *   openForm – open the booking form modal on arrival
 */
import { submitRequest } from '../api';
import { COORDINATOR, SERVICES } from '../data';

export const first = (n = '') => n.trim().split(/\s+/)[0];

export const MAIN_OPTIONS = [
  { label: 'Book an appointment', value: 'book' },
  { label: 'Ask about a treatment', value: 'treatments' },
  { label: 'Hours & location', value: 'hours' },
  { label: 'Send a question', value: 'enquiry' },
  { label: 'Contact the clinic', value: 'contact' },
];

const opt = (label, value = label) => ({ label, value });

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Hmm, that email doesn’t look quite right — could you check it?';
export const isPhone = (v) => (v.replace(/\D/g, '').length >= 7 && /^[+()\d\s.-]+$/.test(v.trim())) || 'That doesn’t look like a phone number — could you try again?';
export const isName = (v) => v.trim().length >= 2 || 'Please tell me your name so our team knows who to contact.';

export const NODES = {
  welcome: {
    say: (d) => [
      `Hi${d.name ? ` ${first(d.name)}` : ''}! I’m Aura, the virtual care assistant at The Mirrors Dermatology Clinic. 👋`,
      'I can answer common questions, open our booking form or put you in touch with our team. What can I help with?',
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
      'I’m sorry — I couldn’t send that to our team just now.',
      { type: 'contact' },
      'Please call, WhatsApp or email us directly and we’ll look after you straight away.',
    ],
    next: 'menu',
  },

  /* ---------- Booking (handled by the booking form, not the chat) ---------- */
  book: {
    say: (d) => [
      d.concern
        ? `Appointments are booked through a quick form — I’ve opened it for you with ${d.concern} selected. 📝`
        : 'Appointments are booked through a quick form — I’ve opened it for you. 📝',
    ],
    openForm: true,
    options: [opt('Open the booking form', 'book'), opt('Main menu', 'menu')],
    next: (v) => v,
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
    next: 'eqSubmit',
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
  fees: {
    say: [
      'Fees depend on your consultation and any treatment you need, so our team shares them directly. Please call or WhatsApp us and we’ll be happy to help.',
      { type: 'contact' },
    ],
    options: [opt('Book an appointment', 'book'), opt('Main menu', 'menu')],
    next: (v) => v,
  },
  hours: {
    say: [
      { type: 'hours' },
      'We’re on the first floor at 1/95D, Avinashi Road, Neelambur — about 200 metres from Neelambur bus stop, with roadside parking. Please note there is no lift. Tap the address above for directions.',
    ],
    options: [opt('Book an appointment', 'book'), opt('Contact the clinic', 'contact'), opt('Main menu', 'menu')],
    next: (v) => v,
  },
  contact: {
    say: [
      `Appointments and enquiries are handled by ${COORDINATOR.name} (${COORDINATOR.title}). You can reach her directly here:`,
      { type: 'contact' },
      'Or I can ask her to call you back.',
    ],
    options: [opt('📞 Request a call back', 'callback'), opt('Main menu', 'menu')],
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
    options: [opt('As soon as possible'), opt('3 – 5 pm'), opt('5 – 7 pm')],
    field: 'callTime',
    next: 'cbSubmit',
  },
  cbSubmit: {
    run: async (d) => {
      d.ref = await submitRequest('callback', { name: d.name, phone: d.phone, message: d.callTime });
    },
    say: [{ type: 'confirm', kind: 'callback' }],
    next: 'menu',
  },

  /* ---------- Question / enquiry ---------- */
  enquiry: {
    enter: (d) => {
      d._flow = 'enquiry';
    },
    say: [`Of course. Type your question below and ${COORDINATOR.name} from our team will reply by email, usually within one working day.`],
    input: {
      placeholder: 'Your question…',
      validate: (v) => v.trim().length > 4 || 'Could you tell me a little more?',
    },
    field: 'question',
    next: 'askName',
  },
  eqSubmit: {
    run: async (d) => {
      d.ref = await submitRequest('enquiry', { name: d.name, email: d.email, message: d.question });
    },
    say: [{ type: 'confirm', kind: 'enquiry' }],
    next: 'menu',
  },
};

/* ---------- Free-text understanding (keyword based) ---------- */
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
