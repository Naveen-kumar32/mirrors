/*
 * Privacy & website policies (/policies).
 * Drafted to match what this website actually does — please have the clinic (and ideally a
 * legal adviser) review it before launch, and update UPDATED when anything changes.
 * Each section: id, title, intro?, blocks: [{ h?, p?: [...], list?: [...] }]
 */
import { CONTACT } from './site';

export const POLICIES_UPDATED = '5 October 2026';

const contactLine = `${CONTACT.email} · ${CONTACT.phone} · ${CONTACT.address}, ${CONTACT.area}`;

export const POLICIES = [
  {
    id: 'privacy',
    title: 'Privacy policy',
    intro:
      'The Mirrors Dermatology Clinic respects your privacy. This policy explains what personal information this website collects, why, and how we look after it.',
    blocks: [
      {
        h: 'What we collect and why',
        list: [
          'Appointment bookings — your name, contact number, date of birth, preferred date and time, and the treatment you choose (if any). We use these to arrange, confirm and follow up your appointment.',
          'Call-back requests and questions sent through our chat assistant — your name, phone number and/or email address and your message, so that we can reply.',
          'Reviews — your name, phone number, email address, star rating and review. Only your name, rating and review are shown on the website; your phone number and email are never published and are used only to verify or respond to your review.',
          'Testimonials — we show a patient’s review as a featured testimonial only with their permission.',
        ],
      },
      {
        p: [
          'Please do not send detailed medical information or reports through the website. Your dermatologist will discuss your health in person at your consultation.',
        ],
      },
      {
        h: 'How we use your information',
        p: [
          'We use your information only for the purposes described above — to arrange your care and to respond to you. We do not sell or rent your personal information, and we do not send marketing messages without your consent.',
        ],
      },
      {
        h: 'Who can see it',
        list: [
          'Our doctor and authorised clinic staff, through a password-protected staff area.',
          'Our website hosting provider, which stores the website and its data on our behalf.',
          'Email and messaging services we use to contact you or to notify our staff of new bookings (for example Gmail and WhatsApp).',
          'Authorities, where we are required to share information by law.',
        ],
      },
      {
        h: 'Cookies and other services',
        p: [
          'This website does not use advertising or tracking cookies. Your browser may temporarily store your chat conversation during your visit, and a secure login cookie is used for clinic staff only.',
          'The map on our Contact page is provided by Google Maps, and our fonts by Google Fonts. These services may receive technical information such as your IP address under Google’s own privacy policy. Links to Google reviews, WhatsApp, Instagram and Facebook take you to those services, which have their own privacy policies.',
        ],
      },
      {
        h: 'How long we keep it',
        p: [
          'We keep appointment and request records for as long as needed to provide your care and for our records, and as required by law. Reviews stay on the website until they are removed. You can ask us to delete your information at any time (see “Your rights” below).',
        ],
      },
      {
        h: 'Keeping it safe',
        p: [
          'The website uses a secure (HTTPS) connection, and access to patient information is limited to authorised clinic staff with individual passwords.',
        ],
      },
      {
        h: 'Your rights',
        p: [
          'Under India’s Digital Personal Data Protection Act, 2023, you can ask us to access, correct or delete the personal information you have given us, withdraw your consent, or raise a concern about how we have handled it. Contact us using the details below and we will respond promptly.',
        ],
      },
      {
        h: 'Children',
        p: ['Appointments for anyone under 18 should be made by a parent or guardian.'],
      },
      {
        h: 'Contact for privacy questions',
        p: [`The Mirrors Dermatology Clinic — ${contactLine}`],
      },
    ],
  },
  {
    id: 'terms',
    title: 'Website terms',
    intro: 'By using this website you agree to these terms.',
    blocks: [
      {
        h: 'Information only',
        p: [
          'The content on this website, including treatment pages and blog articles, is general information about skin, hair and nail care. It is not medical advice and does not replace a consultation with a dermatologist.',
        ],
      },
      {
        h: 'Appointments',
        p: [
          'Online bookings are confirmed on the website, and our staff will contact you to follow up. Occasionally we may need to change an appointment time — for example if the clinic closes for a festival or family emergency — and we will contact you if this happens.',
          'This website and its chat assistant are not monitored for emergencies. If you need urgent medical help, call your local emergency number or go to the nearest emergency department.',
        ],
      },
      {
        h: 'Reviews',
        p: [
          'Reviews should be honest, based on your own experience, and must not contain offensive language or other people’s personal details. We may hide or remove reviews that do not follow these guidelines.',
        ],
      },
      {
        h: 'Content and links',
        p: [
          'The text, design and logo on this website belong to The Mirrors Dermatology Clinic and may not be copied without permission. Links to other websites are provided for convenience; we are not responsible for their content.',
        ],
      },
      {
        h: 'Governing law',
        p: ['These terms are governed by the laws of India, and any disputes are subject to the courts of Coimbatore, Tamil Nadu.'],
      },
    ],
  },
  {
    id: 'disclaimer',
    title: 'Medical disclaimer',
    blocks: [
      {
        p: [
          'Every procedure is planned after individual skin assessment. Results vary between patients, and some conditions may require multiple sessions or combination treatments. Your dermatologist will recommend the most appropriate treatment and aftercare based on your skin type and diagnosis.',
          'Photographs on this website are for illustration and do not show results of treatments at the clinic unless clearly stated.',
        ],
      },
    ],
  },
];
