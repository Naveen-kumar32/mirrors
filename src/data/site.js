// All photography is stored locally in /public/images/site as <name>-<480|960|1600>.webp
// (originally from Unsplash, free to use). Replace files with your own clinic photos
// using the same names, or add new entries to IMG below.
const SIZES = [480, 960, 1600];
export const img = (name, w = 1200) => {
  const size = SIZES.find((s) => s >= w) || SIZES[SIZES.length - 1];
  return `/images/site/${name}-${size}.webp`;
};

export const BRAND = {
  name: 'Mirrors Dema',
  full: 'Mirrors Dema Dermatology Clinic',
  logo: '/images/brand/logo-color-256.png',
  logoWhite: '/images/brand/logo-white-256.png',
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
  p1: 'p1',
  p2: 'p2',
  p3: 'p3',
  p4: 'p4',
  p5: 'p5',
  p6: 'p6',
  p7: 'p7',
  p8: 'p8',
};

export const NAV_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/treatments', label: 'Treatments' },
  { to: '/journey', label: 'Your Journey' },
  { to: '/results', label: 'Results' },
  { to: '/specialists', label: 'Specialists' },
  { to: '/stories', label: 'Stories' },
];

export const CONTACT = {
  phone: '+91 93612 61413',
  phoneHref: 'tel:+919361261413',
  // Assumes the clinic number is also on WhatsApp — change if not
  whatsapp: 'https://wa.me/919361261413',
  instagram: 'https://www.instagram.com/the_mirrors_dermatology/',
  instagramHandle: '@the_mirrors_dermatology',
  address: 'First Floor, 1/95D, Avinashi Rd',
  area: 'Neelambur, Coimbatore, Tamil Nadu 641062',
  mapsHref: 'https://maps.app.goo.gl/zH5pEvCwGp5dZGdr7',
  mapsEmbed:
    'https://www.google.com/maps?q=11.0602698,77.0844502&z=17&output=embed',
};

export const HOURS = [
  { day: 'Monday – Saturday', time: '3:00 pm – 7:00 pm' },
  { day: 'Sunday', time: 'Closed' },
];

export const MARQUEE_A = [
  'Acne Care',
  'Mole Mapping',
  'Laser Resurfacing',
  'Eczema & Psoriasis',
  'Chemical Peels',
  'Rosacea',
  'Hair Restoration',
  'Pigmentation',
];

export const MARQUEE_B = [
  'Board Certified',
  'Evidence Based',
  'Medical Grade',
  'Same-Week Visits',
  'Tele-Dermatology',
  'Gentle On All Skin Tones',
];
