/*
 * Ready-written messages staff send to patients from the clinic's own WhatsApp or phone.
 * (Sending automatically would need a paid WhatsApp Business / SMS service.)
 */
import { CONTACT, COORDINATOR, GOOGLE } from '../data';

const day = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

const bring = 'Please bring any lab reports and prescriptions of medications you are already taking.';

/** Confirmation sent once an appointment is confirmed (or rescheduled) */
export function confirmationMessage(r) {
  return [
    `Hello ${r.name}, your appointment at The Mirrors Dermatology Clinic is confirmed ✅`,
    '',
    `📅 ${day(r.date)}`,
    `🕒 ${r.time}`,
    `📍 ${CONTACT.address}, ${CONTACT.area}`,
    `Directions: ${CONTACT.mapsHref}`,
    '',
    bring,
    '',
    'If we ever have to close for a festival or family emergency, we’ll let you know — you can also check our WhatsApp status for updates, or call us to confirm before you come.',
    '',
    `Need to change the time? Just reply here or call ${CONTACT.phone}.`,
    `— ${COORDINATOR.name}, The Mirrors Dermatology Clinic (Ref ${r.ref})`,
  ]
    .filter((l) => l !== undefined)
    .join('\n');
}

/** After a visit: ask for a Google review (send to every patient, not only happy ones) */
export const reviewRequestMessage = (r) =>
  [
    `Hello ${r.name}, thank you for visiting The Mirrors Dermatology Clinic.`,
    'If you have a minute, we’d be grateful if you could share your experience on Google — it helps other patients find the right care:',
    GOOGLE.reviewUrl,
    `— ${COORDINATOR.name}`,
  ].join('\n');

/** Ask a patient's permission before showing their review as a testimonial */
export const permissionMessage = (name) =>
  `Hello ${name}, thank you for your kind words about The Mirrors Dermatology Clinic. May we show your review on our website, with your first name and initial? Please reply YES if you are happy for us to use it.`;

/** A general reply for call-back requests and questions */
export const replyMessage = (r) =>
  `Hello ${r.name}, this is ${COORDINATOR.name} from The Mirrors Dermatology Clinic, replying to your request (Ref ${r.ref}).`;

// Patient's number in international form: digits only, Indian numbers get the 91 country code
export function intlNumber(phone = '') {
  let d = phone.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d.length === 10 ? `91${d}` : d;
}

export const whatsappTo = (phone, text) => `https://wa.me/${intlNumber(phone)}?text=${encodeURIComponent(text)}`;
export const smsTo = (phone, text) => `sms:+${intlNumber(phone)}?body=${encodeURIComponent(text)}`;
