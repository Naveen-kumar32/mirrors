import { IMG } from './site';

export const JOURNEY = [
  { no: '01', icon: 'chat', title: 'Consultation', image: IMG.jConsult, imageAlt: IMG.jConsult2, text: 'A relaxed 45-minute conversation about your skin, history and goals — never rushed, never upsold.' },
  { no: '02', icon: 'scan', title: 'Skin Analysis', image: IMG.jAnalysis, imageAlt: IMG.jAnalysis2, text: '3D imaging and dermoscopy map what the eye can’t see: pigment depth, vascularity and texture.' },
  { no: '03', icon: 'plan', title: 'Your Plan', text: 'A written, phased treatment plan with clear costs, timelines and realistic outcomes.', image: IMG.products, imageAlt: IMG.jPlan2 },
  { no: '04', icon: 'spark', title: 'Treatment', image: IMG.jTreat, imageAlt: IMG.jTreat2, text: 'Delivered by the specialist who designed your plan, in calm private suites.' },
  { no: '05', icon: 'leaf', title: 'Aftercare', text: 'Follow-ups in clinic or online, plus a direct line to your care team between visits.', image: IMG.jCare, imageAlt: IMG.jCare2 },
];

export const FIRST_VISIT = [
  { time: '0 min', title: 'A warm welcome', text: 'Check in at our quiet reception. Tea, water and zero waiting-room chaos.', image: IMG.visit1 },
  { time: '5 min', title: 'Meet your dermatologist', text: 'Not a nurse or a junior — the specialist who will lead your care.', image: IMG.visit2 },
  { time: '20 min', title: 'Imaging & examination', text: 'Dermoscopy and 3D imaging reveal what is really going on beneath the surface.', image: IMG.visit3 },
  { time: '35 min', title: 'Your plan, explained', text: 'We walk through options, costs and timelines — and answer every question.', image: IMG.visit4 },
  { time: '45 min', title: 'Leave with clarity', text: 'A written plan in your inbox, prescriptions sent, and a follow-up booked.', image: IMG.visit5 },
];

export const CHECKLIST = [
  'A list of current medications and supplements',
  'Photos of any flare-ups that come and go',
  'Skincare products you use (a photo is fine)',
  'Your insurance card, if claiming',
  'Arrive with clean skin — no makeup if possible',
  'Questions you would like answered',
];

export const TECH = [
  { title: '3D Skin Imaging', text: 'Maps pigment, redness and texture in three dimensions for precise planning.', image: IMG.tech1, icon: 'scan' },
  { title: 'Digital Dermoscopy', text: 'Magnified, stored images of every mole so tiny changes are never missed.', image: IMG.tech2, icon: 'spark' },
  { title: 'Multi-Platform Lasers', text: 'Fractional, vascular and pigment lasers safe for all skin tones.', image: IMG.tech3, icon: 'leaf' },
  { title: 'Trichoscopy', text: 'Follicle-level imaging that diagnoses hair loss accurately.', image: IMG.tech4, icon: 'plan' },
];

export const PAYMENT = [
  { title: 'Insurance', text: 'Most medical dermatology is claimable. We process claims for major insurers on the spot.' },
  { title: 'Clear pricing', text: 'You receive a written quote before any procedure — no surprises, ever.' },
  { title: 'Payment plans', text: 'Spread the cost of longer treatment programmes with interest-free plans.' },
];

export const TIMELINE = [
  { year: '2009', title: 'A small clinic opens', text: 'Dr. Elena Marsh opens a two-room practice with one promise: time, honesty, a clear plan.' },
  { year: '2013', title: 'Skin cancer service', text: 'Dr. Arjun Mehta joins and launches Mohs surgery and full-body mole mapping.' },
  { year: '2017', title: 'The laser suite', text: 'A dedicated laser suite opens with devices chosen for every skin tone.' },
  { year: '2020', title: 'Tele-dermatology', text: 'Secure video consults let patients see their own doctor from anywhere.' },
  { year: '2023', title: '3D skin imaging', text: 'We introduce 3D imaging for more precise diagnosis and planning.' },
  { year: '2026', title: 'Our new home', text: 'A calm, light-filled clinic on Avinashi Road, Neelambur, designed around patients.' },
];

export const VALUES = [
  { icon: 'shield', title: 'Specialists only', text: 'Every consultation and procedure is performed by a board-certified dermatologist.' },
  { icon: 'chat', title: 'Honest advice', text: 'If you don’t need a treatment, we’ll tell you. No upselling, ever.' },
  { icon: 'leaf', title: 'Every skin tone', text: 'Devices, protocols and expertise that are safe and effective for all skin types.' },
  { icon: 'clock', title: 'Time to listen', text: 'Longer appointments, because good diagnosis can’t be rushed.' },
];

export const CREDENTIALS = [
  'Board Certified Dermatologists',
  'Mohs Surgery Fellowship',
  'Accredited Skin Cancer Clinic',
  'Laser Safety Certified',
  'Hair & Scalp Specialists',
  'Skin of Colour Expertise',
];

export const CASES = [
  {
    id: 'acne',
    label: 'Acne',
    title: 'Inflammatory acne',
    text: 'A 12-week combined prescription and peel programme cleared active breakouts and faded post-acne marks.',
    image: IMG.caseAcne,
    effect: 'acne',
    stats: [
      { to: 87, suffix: '%', label: 'fewer active breakouts' },
      { to: 12, suffix: ' wks', label: 'average programme' },
    ],
  },
  {
    id: 'pigment',
    label: 'Pigmentation',
    title: 'Sun spots & melasma',
    text: 'Three pigment-laser sessions with a tailored brightening routine evened tone and reduced dark patches.',
    image: IMG.faceSmile,
    effect: 'pigment',
    stats: [
      { to: 72, suffix: '%', label: 'less visible pigment' },
      { to: 3, suffix: ' sessions', label: 'laser treatments' },
    ],
  },
  {
    id: 'redness',
    label: 'Redness',
    title: 'Rosacea & redness',
    text: 'Medical therapy plus two IPL sessions calmed flushing and visible vessels across the cheeks and nose.',
    image: IMG.faceFair,
    effect: 'redness',
    stats: [
      { to: 64, suffix: '%', label: 'reduction in redness' },
      { to: 2, suffix: ' sessions', label: 'IPL treatments' },
    ],
  },
];

export const OUTCOMES = [
  { label: 'Acne clearance at 6 months', value: 89 },
  { label: 'Patients happy with laser results', value: 94 },
  { label: 'Eczema flares reduced', value: 81 },
  { label: 'Hair density improved (PRP)', value: 76 },
];

export const GALLERY = [
  { image: IMG.gal2, caption: 'Our waiting lounge', tall: true },
  { image: IMG.gal1, caption: 'Medical-grade actives' },
  { image: IMG.gal3, caption: 'Fresh linen, every visit' },
  { image: IMG.gal4, caption: 'Gentle, fragrance-free care', tall: true },
  { image: IMG.range, caption: 'Our curated range' },
  { image: IMG.gal5, caption: 'Serums, precisely dosed' },
  { image: IMG.spa, caption: 'Treatment suite details', tall: true },
  { image: IMG.gal6, caption: 'Prescribed home care' },
];

export const RESULTS_GALLERY = [
  { image: IMG.rg1, caption: 'Textures we trust', tall: true },
  { image: IMG.rg2, caption: 'Calming masks' },
  { image: IMG.rg3, caption: 'Daily SPF, non-negotiable' },
  { image: IMG.rg4, caption: 'Gentle cleansing', tall: true },
  { image: IMG.rg5, caption: 'Barrier repair' },
  { image: IMG.rg6, caption: 'Post-treatment care' },
  { image: IMG.rg7, caption: 'Lymphatic massage', tall: true },
  { image: IMG.rg8, caption: 'Targeted serums' },
];

export const FAQS = [
  { q: 'Do I need a referral to book?', a: 'No — you can book directly with us. A GP referral may increase your insurance rebate for medical conditions, so bring one if you have it.' },
  { q: 'How soon can I be seen?', a: 'Most new patients are seen within the same week. Urgent skin cancer concerns are prioritised, often within 48 hours.' },
  { q: 'What does a first consultation cost?', a: 'A new patient consultation is ₹500 and includes a written plan and an 8-week review. Many insurers cover part of this.' },
  { q: 'Do you treat children?', a: 'Yes, we see patients of all ages, including babies with eczema and teenagers with acne.' },
  { q: 'Can I have a video consultation?', a: 'Yes. Follow-ups and many new concerns can be handled by secure video. Skin checks need an in-person visit.' },
  { q: 'What is your cancellation policy?', a: 'Please give us 24 hours’ notice so we can offer the time to someone else. Late cancellations may incur a fee.' },
];
