/*
 * Doctor profiles, as supplied by the clinic (bio text uses **bold** for emphasis).
 *
 * image: null until the portrait is supplied — the site shows the doctor's initials instead.
 *   To add a photo, save it in public/images/site as <name>-480.webp, -960.webp and -1600.webp
 *   and set image: '<name>'.
 *
 * draft: true marks a placeholder profile. Drafts appear only while developing locally
 *   (npm run dev) and are hidden on the live website. Replace the details and remove
 *   `draft` when the clinic sends a real profile. (The clinic's workbook currently lists
 *   doctors 2 and 3 as "Not applicable".)
 */
const ALL_DOCTORS = [
  {
    name: 'Dr. Saranya Rajee Saminathan',
    first: 'Saranya',
    initials: 'SR',
    role: 'Founder & Consultant Dermatologist',
    image: 'drSaranya', // clinic-supplied portrait (public/images/dr) — sizes in public/images/site/drSaranya-*.webp
    years: '10+',
    languages: 'English • Tamil • Hindi',
    qualifications: ['MBBS., MD DVL (Stanley)', 'Fellowship in Laser Medicine, Aesthetic Dermatology & Dermatosurgery'],
    registration: 'TNMC 141779',
    awards: ['Best Outgoing Student — undergraduate medical training', 'Gold Medalist in Surgery'],
    memberships: [
      'Life Member, Indian Association of Dermatologists, Venereologists & Leprologists (IADVL)',
      'Life Member, Association of Cutaneous Surgeons of India (ACSI)',
    ],
    specialties: [
      'Clinical dermatology',
      'Acne & acne scars',
      'Pigmentation',
      'Hair loss & hair restoration',
      'Laser dermatology',
      'Vitiligo',
      'Nail disorders',
      'Aesthetic dermatology',
    ],
    schedule: 'Monday – Saturday, 3:00 – 7:00 pm. Consultations are by appointment — please book ahead to see the doctor.',
    instagram: 'https://www.instagram.com/drsaranyarajee_derm/',
    instagramHandle: '@drsaranyarajee_derm',
    bio: [
      '**Dr. Saranya Rajee Saminathan, MBBS., MD DVL (Govt. Stanley Medical College)** is a Consultant and Interventional Dermatologist dedicated to providing evidence-based, personalised care for skin, hair and nail concerns.',
      'A **Best Outgoing Student during her undergraduate medical training** and a **Gold Medalist in Surgery**, Dr. Saranya has pursued her medical journey with a strong foundation in clinical excellence and academic achievement.',
      'She completed her postgraduate training in Dermatology at **Government Stanley Medical College and Hospital, Chennai**, one of India’s renowned and historic government medical institutions, known for its strong clinical training, academic legacy and extensive patient exposure. The institution’s rich tradition of medical education has shaped her approach to clinical practice—combining sound medical knowledge with practical expertise.',
      'Her areas of expertise include **clinical dermatology, acne and acne scars, pigmentation, hair loss and hair restoration, laser dermatology, vitiligo, nail disorders, and aesthetic dermatology**. She integrates advanced dermatological technologies with a personalised, patient-centred approach, with a focus on natural, healthy and sustainable outcomes.',
    ],
  },
  {
    draft: true,
    name: 'Dr. Doctor Name',
    first: 'Doctor',
    initials: 'D2',
    role: 'Consultant Dermatologist',
    image: null,
    languages: 'To be confirmed',
    qualifications: ['Qualifications to be confirmed'],
    specialties: ['Specialities to be confirmed'],
    schedule: 'Consultation days and times to be confirmed.',
    bio: ['Placeholder profile — the full biography will be added when the clinic sends this doctor’s details.'],
  },
  {
    draft: true,
    name: 'Dr. Doctor Name',
    first: 'Doctor',
    initials: 'D3',
    role: 'Consultant Dermatologist',
    image: null,
    languages: 'To be confirmed',
    qualifications: ['Qualifications to be confirmed'],
    specialties: ['Specialities to be confirmed'],
    schedule: 'Consultation days and times to be confirmed.',
    bio: ['Placeholder profile — the full biography will be added when the clinic sends this doctor’s details.'],
  },
];

// Placeholder (draft) profiles only show while developing locally
export const TEAM = ALL_DOCTORS.filter((d) => !d.draft || import.meta.env.DEV);
export const DOCTOR = TEAM[0];
