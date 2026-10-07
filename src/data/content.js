import { IMG } from './site';

/* About the clinic — a short version of the clinic's introduction */
export const ABOUT_INTRO =
  'At The Mirrors Dermatology Clinic, every skin, hair and nail concern is treated with the same care we would give our own. We take time to understand the problem, recommend only what is truly needed, and offer scientific, evidence-based treatment chosen for each patient — with a focus on safety and realistic results.';
export const ABOUT_LINE = 'No unnecessary treatments. No one-size-fits-all approach. Just honest, scientific dermatological care.';

/* About page — the clinic's full introduction, word for word (**text** = bold) */
export const ABOUT_FULL = [
  'At **The Mirrors Dermatology Clinic**, we believe every skin, hair, and nail concern deserves to be treated with the same care and attention we would give to our own.',
  'Our approach is simple — **understand the problem, identify what is truly needed, and treat it appropriately.** We do not believe in unnecessary procedures or pushing treatments that a patient does not require.',
  'In a world where misinformation and unqualified advice can often influence healthcare decisions, we strive to provide something different: **scientific, evidence-based and patient-tailored dermatological care.**',
  'Every treatment is chosen based on the individual — their condition, concerns, needs and expectations — with an emphasis on **medical necessity, safety and realistic outcomes.**',
];

/*
 * Facilities — based on the procedures the clinic offers in-house.
 * Add verified equipment names (make / model) here when the clinic supplies them.
 */
export const FACILITIES = [
  { icon: 'zap', title: 'Laser hair reduction', text: 'Laser treatment for long-term reduction of unwanted facial and body hair.' },
  { icon: 'shield', title: 'Electrocautery & minor dermatosurgery', text: 'For removal of moles, warts, cysts and skin tags, and for ear lobe repair.' },
  { icon: 'drop', title: 'PRP / GFC', text: 'Regenerative treatments prepared from your own blood, for hair thinning and selected skin goals.' },
  { icon: 'spark', title: 'Chemical peels & medifacials', text: 'Medically supervised peels and facials for acne, pigmentation, tanning and dull skin.' },
];

/*
 * Awards & accreditations — from Dr. Saranya's supplied profile.
 * Add the issuing body / year and a link to the certificate when available.
 */
export const AWARDS = [
  { icon: 'award', title: 'Gold Medalist in Surgery', detail: 'Undergraduate medical training' },
  { icon: 'award', title: 'Best Outgoing Student', detail: 'Undergraduate medical training' },
  { icon: 'plan', title: 'MD — Dermatology, Venereology & Leprosy', detail: 'Govt. Stanley Medical College, Chennai' },
  { icon: 'plan', title: 'Fellowship in Laser Medicine, Aesthetic Dermatology & Dermatosurgery' },
  { icon: 'shield', title: 'Life Member — IADVL', detail: 'Indian Association of Dermatologists, Venereologists & Leprologists' },
  { icon: 'shield', title: 'Life Member — ACSI', detail: 'Association of Cutaneous Surgeons of India' },
  { icon: 'check', title: 'Registered Medical Practitioner', detail: 'Tamil Nadu Medical Council · Reg. No. 141779' },
];

/* "Why choose this clinic?" — the clinic's own statement, shown as one paragraph */
export const WHY_US =
  'A board-certified dermatologist with 10+ years of experience in treating all skin, hair and nail related conditions — in an evidence-based manner. No treatment is pushed unless it is actually needed.';

/* Care philosophy — "Listen. Understand. Treat." (text supplied by the clinic) */
export const PHILOSOPHY_INTRO = [
  'At The Mirrors Dermatology Clinic, we believe good dermatology begins with understanding the person behind the problem.',
  'Every patient is different. Every skin, hair and nail concern has its own story. Our approach is to listen carefully, diagnose accurately and recommend only what is genuinely needed.',
];

// Shown in bold inside the intro
export const PHILOSOPHY_HIGHLIGHT = 'listen carefully, diagnose accurately and recommend only what is genuinely needed.';

export const PROMISE = {
  lines: ['The right diagnosis.', 'The right treatment.', 'For the right patient.'],
  note: 'No unnecessary treatments. No pressure. Just ethical, evidence-based dermatological care.',
  sign: 'Rooted in Science. Reflected in Your Skin.',
};

export const VALUES = [
  { icon: 'plan', title: 'Evidence over trends', text: 'Our treatments are guided by scientific evidence, established dermatological principles and medical expertise.' },
  { icon: 'chat', title: 'Patient over procedure', text: 'We do not believe in pushing unnecessary treatments. If a procedure is not needed, we will tell you.' },
  { icon: 'check', title: 'Individual over one-size-fits-all', text: 'Treatment plans are tailored to your condition, skin type, lifestyle, concerns and expectations.' },
  { icon: 'shield', title: 'Honest expectations', text: 'We believe in explaining what treatment can—and cannot—achieve, so you can make informed decisions about your care.' },
  { icon: 'clock', title: 'Long-term skin health', text: 'Our goal is not simply to change how your skin looks today, but to help you maintain healthier skin for the years ahead.' },
];

/*
 * FAQs — one list. The first two are the clinic owner's questions with approved answers;
 * the rest cover the topics the clinic asked for (treatment expectations, payments,
 * follow-up, age groups, languages) and are for the doctor to review.
 */
export const FAQ_LIST = [
  {
    q: 'What should I bring to my first consultation?',
    a: 'Please bring any lab reports and prescriptions of medications you are already taking.',
    approved: true,
  },
  {
    q: 'Do I need to book in advance?',
    a: 'Appointments are preferred, to avoid long waiting hours and unexpected holidays.',
    approved: true,
  },
  {
    q: 'Can I walk in without an appointment?',
    a: 'The doctor sees patients by appointment, so please book ahead — online, by phone or on WhatsApp. If you come in without one, we will fit you in when a slot is free.',
  },
  {
    q: 'How many sessions will I need?',
    a: 'It depends on your condition and skin. Many treatments, such as chemical peels, laser hair reduction, acne scar revision and PRP / GFC, work over several sessions, and some conditions need a combination of treatments. Your dermatologist will explain this after assessing your skin.',
  },
  {
    q: 'When will I start to see results?',
    a: 'Some treatments show a change within a few weeks; others, like PRP / GFC or pigmentation treatment, improve gradually over several sessions. You will be given a realistic timeline for your treatment at your consultation.',
  },
  {
    q: 'Are the results permanent?',
    a: 'Not always. Laser hair removal gives long-term reduction rather than guaranteed permanent removal, and conditions like melasma or keloids can come back. Following the aftercare advice and attending maintenance sessions helps results last.',
  },
  {
    q: 'Is there any downtime after a procedure?',
    a: 'Most treatments need little or no time off — you may have mild redness or flaking for a few days. You will get clear aftercare advice, such as daily sunscreen and gentle skincare, before you leave.',
  },
  {
    q: 'How much does a consultation or treatment cost?',
    a: 'Fees depend on your consultation and the treatment you need, so we share them directly. Please call or WhatsApp us on +91 93612 61413.',
  },
  {
    q: 'Will I need a follow-up visit?',
    a: 'For most conditions and procedures, yes. Your dermatologist will tell you when to come back so your progress can be checked and treatment adjusted if needed.',
  },
  {
    q: 'Do you treat children and older adults?',
    a: 'Yes, we see patients of all age groups. Children should come with a parent or guardian.',
  },
  {
    q: 'Which languages does the doctor speak?',
    a: 'English, Tamil and Hindi.',
  },
];

/* Short list for the Contact page */
export const FAQS = FAQ_LIST.slice(0, 4);
