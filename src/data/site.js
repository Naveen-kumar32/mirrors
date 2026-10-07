// All photography is stored locally in /public/images/site as <name>-<480|960|1600>.webp
// (originally from Unsplash, free to use). Replace files with your own clinic photos
// using the same names, or add new entries to IMG below.
const SIZES = [480, 960, 1600];
export const img = (name, w = 1200) => {
  const size = SIZES.find((s) => s >= w) || SIZES[SIZES.length - 1];
  return `/images/site/${name}-${size}.webp`;
};

export const BRAND = {
  name: 'The Mirrors',
  full: 'The Mirrors Dermatology Clinic',
  logo: '/images/brand/logo-color-256.png',
  logoWhite: '/images/brand/logo-white-256.png',
  tagline: 'Rooted in science, reflected in your skin',
  footer: 'Your skin, our science, personalised with expertise.',
  domain: 'https://themirrorsdermclinic.com',
};

export const IMG = {
  hero: 'hero',
  lounge: 'lounge',
  lotion: 'lotion',
  serum: 'serum',
  clinical: 'clinical',
  procedure: 'procedure',
  peel: 'peel',
  mature: 'mature',
  hair: 'hair',
  mask: 'mask',
  products: 'products',
  facemask: 'facemask',
  reception: 'reception',
  consult: 'consult',
  scans: 'scans',
  surgery: 'surgery',
  dropper: 'dropper',
  oil: 'oil',
  cream: 'cream',
  range: 'range',
  citrus: 'citrus',
  hairmask: 'hairmask',
  spa: 'spa',
  faceSmile: 'faceSmile',
  faceFair: 'faceFair',
  drElena: 'drElena',
  drArjun: 'drArjun',
  drSofia: 'drSofia',
  drMarcus: 'drMarcus',
  p4: 'p4',
  trust1: 'trust1',
  trust2: 'trust2',
  trust3: 'trust3',
  jConsult: 'jConsult',
  jAnalysis: 'jAnalysis',
  jTreat: 'jTreat',
  jCare: 'jCare',
  homeBA: 'homeBA',
  bentoRoom: 'bentoRoom',
  treatHero: 'treatHero',
  catAcne: 'catAcne',
  catPsoriasis: 'catPsoriasis',
  catRosacea: 'catRosacea',
  catMole: 'catMole',
  catCyst: 'catCyst',
  catLaser: 'catLaser',
  catPeel: 'catPeel',
  catMicro: 'catMicro',
  catWrinkle: 'catWrinkle',
  catHairloss: 'catHairloss',
  catPrp: 'catPrp',
  ovMedical: 'ovMedical',
  ovLaser: 'ovLaser',
  dq1: 'dq1',
  dq2: 'dq2',
  dq3: 'dq3',
  dq4: 'dq4',
  dq5: 'dq5',
  dq6: 'dq6',
  aboutHero: 'aboutHero',
  gal1: 'gal1',
  gal2: 'gal2',
  gal3: 'gal3',
  gal4: 'gal4',
  gal5: 'gal5',
  gal6: 'gal6',
  journeyHero: 'journeyHero',
  visit1: 'visit1',
  visit2: 'visit2',
  visit3: 'visit3',
  visit4: 'visit4',
  visit5: 'visit5',
  tech1: 'tech1',
  tech2: 'tech2',
  tech3: 'tech3',
  tech4: 'tech4',
  pip: 'pip',
  resultsHero: 'resultsHero',
  caseAcne: 'caseAcne',
  rg1: 'rg1',
  rg2: 'rg2',
  rg3: 'rg3',
  rg4: 'rg4',
  rg5: 'rg5',
  rg6: 'rg6',
  rg7: 'rg7',
  rg8: 'rg8',
  specHero: 'specHero',
  featured: 'featured',
  contactHero: 'contactHero',
  jConsult2: 'jConsult2',
  jAnalysis2: 'jAnalysis2',
  jPlan2: 'jPlan2',
  jTreat2: 'jTreat2',
  jCare2: 'jCare2',
};

export const CONTACT = {
  phone: '+91 93612 61413',
  phoneHref: 'tel:+919361261413',
  whatsapp: 'https://wa.me/919361261413',
  whatsappNumber: '919361261413',
  email: 'themirrorsdermatologyclinic@gmail.com',
  emailHref: 'mailto:themirrorsdermatologyclinic@gmail.com',
  instagram: 'https://www.instagram.com/the_mirrors_dermatology/',
  instagramHandle: '@the_mirrors_dermatology',
  doctorInstagram: 'https://www.instagram.com/drsaranyarajee_derm/',
  doctorInstagramHandle: '@drsaranyarajee_derm',
  facebook: 'https://www.facebook.com/share/1EEB6MJtKi/',
  address: 'First Floor, 1/95D, Avinashi Rd',
  area: 'Neelambur, Coimbatore, Tamil Nadu 641062',
  mapsHref: 'https://maps.app.goo.gl/QxyLqw2uTuRBwAMW8',
  mapsEmbed: 'https://www.google.com/maps?q=11.0602698,77.0844502&z=17&output=embed',
  geo: { lat: 11.0602698, lng: 77.0844502 },
};

/*
 * Google Business Profile — the clinic's approved review source.
 * reviewUrl: for the most direct link, paste the clinic's own "Ask for reviews" link from
 *   Google Business Profile (looks like https://g.page/r/…/review). Until then it opens the
 *   clinic's Google listing, where patients tap "Write a review".
 * rating / count / checkedOn: fill these in by hand to show the Google rating without an API key
 *   (e.g. rating: 4.9, count: 37, checkedOn: '2026-10-05'). With GOOGLE_PLACES_API_KEY set on the
 *   server, the live rating is used instead.
 */
export const GOOGLE = {
  listingUrl: 'https://www.google.com/maps?cid=5173265861907796516',
  reviewUrl: 'https://www.google.com/maps?cid=5173265861907796516',
  rating: null,
  count: null,
  checkedOn: null,
};

/* Staff member who receives appointment calls, WhatsApp messages and enquiries */
export const COORDINATOR = {
  name: 'Mrs. Muthumari',
  title: 'B.Sc Nursing',
  role: 'Appointments & enquiries',
  phone: '+91 93612 61413',
  phoneHref: 'tel:+919361261413',
};

export const HOURS = [
  { day: 'Monday – Saturday', time: '3:00 pm – 7:00 pm' },
  { day: 'Sunday', time: 'Holiday' },
];

/* Shown with the opening hours */
export const HOURS_NOTE =
  'Planning a visit around a festival? The clinic may occasionally close for festivals or family emergencies — please call to confirm, and check our WhatsApp status for the latest updates.';

/* Shown when someone visits the website while the clinic is closed */
export const CLOSED_NOTE =
  'You can still book online, send a question or leave us a WhatsApp message — we’ll get back to you once we open.';

/* Getting here */
export const DIRECTIONS = [
  { label: 'Nearest bus stop', text: 'About 200 metres from Neelambur bus stop' },
  { label: 'Parking', text: 'Roadside parking' },
  { label: 'Access', text: 'First floor — there is no lift, and the clinic is not wheelchair accessible' },
];
