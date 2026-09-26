import { IMG } from './site';

export const TEAM = [
  {
    name: 'Dr. Elena Marsh',
    first: 'Elena',
    role: 'Medical Director',
    focus: 'Complex medical dermatology',
    image: IMG.drElena,
    years: 18,
    languages: 'English, French',
    specialties: ['Severe acne', 'Eczema', 'Psoriasis & biologics'],
    education: 'MD, Fellowship in Medical Dermatology',
    bio: 'Elena founded Aurelle with a simple idea: patients deserve time, honesty and a clear plan. She leads our medical dermatology service and has a special interest in inflammatory skin disease and biologic therapies.',
    quote: 'The best treatment starts with listening properly.',
  },
  {
    name: 'Dr. Arjun Mehta',
    first: 'Arjun',
    role: 'Mohs Surgeon',
    focus: 'Skin cancer & surgery',
    image: IMG.drArjun,
    years: 14,
    languages: 'English, Hindi',
    specialties: ['Mohs surgery', 'Melanoma surveillance', 'Reconstructive closures'],
    education: 'MD, Fellowship in Mohs Micrographic Surgery',
    bio: 'Arjun heads our skin cancer service. His precise, tissue-sparing technique means excellent cure rates and scars that are barely visible — even on the face.',
    quote: 'Precision is kindness — for your health and your scar.',
  },
  {
    name: 'Dr. Sofia Reyes',
    first: 'Sofia',
    role: 'Aesthetic Dermatologist',
    focus: 'Injectables & lasers',
    image: IMG.drSofia,
    years: 11,
    languages: 'English, Spanish',
    specialties: ['Anti-wrinkle & fillers', 'Laser resurfacing', 'Pigmentation'],
    education: 'MD, Diploma in Cosmetic Dermatology',
    bio: 'Sofia is known for results that nobody notices — only that you look fresher. She combines lasers, injectables and skincare into gentle, long-term plans.',
    quote: 'You should look like yourself on your very best day.',
  },
  {
    name: 'Dr. Marcus Hale',
    first: 'Marcus',
    role: 'Clinical Dermatologist',
    focus: 'Hair, scalp & skin of colour',
    image: IMG.drMarcus,
    years: 9,
    languages: 'English, Portuguese',
    specialties: ['Hair loss & PRP', 'Skin of colour', 'Keloids & scarring'],
    education: 'MD, Fellowship in Hair & Scalp Disorders',
    bio: 'Marcus leads our hair clinic and has a particular passion for treating conditions in skin of colour, where diagnosis and treatment often need a different approach.',
    quote: 'Every skin tone deserves an expert who truly understands it.',
  },
];

export const TESTIMONIALS = [
  {
    quote: 'After ten years of trying everything for my acne, Dr. Marsh had a plan in one visit. Six months later I stopped wearing foundation.',
    name: 'Hannah R.',
    detail: 'Acne treatment programme',
  },
  {
    quote: 'They caught a melanoma at my first mole-mapping appointment. Calm, clear and kind from the phone call to the follow-up. I owe them a lot.',
    name: 'Claire D.',
    detail: 'Skin cancer screening',
  },
  {
    quote: 'I wanted to look like myself, just less tired. Dr. Reyes nailed it — nobody can tell what changed, they just say I look great.',
    name: 'James T.',
    detail: 'Age-well aesthetics',
  },
];

export const REVIEWS = [
  { name: 'Hannah R.', tag: 'Medical', rating: 5, date: 'Aug 2026', text: 'After ten years of trying everything for my acne, Dr. Marsh had a plan in one visit. Six months later I stopped wearing foundation.' },
  { name: 'Claire D.', tag: 'Surgical', rating: 5, date: 'Jul 2026', text: 'They caught a melanoma at my first mole-mapping appointment. Calm, clear and kind from start to finish.' },
  { name: 'James T.', tag: 'Aesthetic', rating: 5, date: 'Jul 2026', text: 'Nobody can tell what changed — they just say I look great. Exactly what I wanted.' },
  { name: 'Priya S.', tag: 'Medical', rating: 5, date: 'Jun 2026', text: 'My eczema used to rule my life. The team explained everything and my skin has been calm for months.' },
  { name: 'Daniel K.', tag: 'Hair', rating: 5, date: 'Jun 2026', text: 'Dr. Hale found an iron deficiency nobody else checked. My hair is noticeably thicker at six months.' },
  { name: 'Sophie L.', tag: 'Aesthetic', rating: 4, date: 'May 2026', text: 'Loved my laser results for pigmentation. Recovery was a few days of pinkness, exactly as they said.' },
  { name: 'Marco V.', tag: 'Surgical', rating: 5, date: 'May 2026', text: 'Mohs surgery on my nose — the scar is almost invisible. Dr. Mehta is a true craftsman.' },
  { name: 'Aisha N.', tag: 'Medical', rating: 5, date: 'Apr 2026', text: 'Finally a clinic that understands melasma on darker skin. Gentle, careful and effective.' },
  { name: 'Tom B.', tag: 'Medical', rating: 5, date: 'Apr 2026', text: 'Booked through the chat on a Sunday night and was seen on Tuesday. The easiest healthcare I have ever had.' },
  { name: 'Grace H.', tag: 'Aesthetic', rating: 5, date: 'Mar 2026', text: 'My rosacea redness is down so much after IPL. I wear less makeup and feel more confident.' },
  { name: 'Leo M.', tag: 'Hair', rating: 4, date: 'Mar 2026', text: 'Honest advice on PRP — they told me what to expect and it has delivered.' },
  { name: 'Nina P.', tag: 'Aesthetic', rating: 5, date: 'Feb 2026', text: 'The peel series transformed my texture. The clinic itself is so calm it feels like a retreat.' },
];

export const RATING_BREAKDOWN = [
  { stars: 5, pct: 91 },
  { stars: 4, pct: 7 },
  { stars: 3, pct: 1 },
  { stars: 2, pct: 1 },
  { stars: 1, pct: 0 },
];
