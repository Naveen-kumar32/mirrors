/*
 * Emails the clinic when a patient books or sends a request from the website.
 * Optional: only runs when SMTP settings are in .env (see .env.example). For Gmail, use
 * SMTP_HOST=smtp.gmail.com, SMTP_PORT=465 and a Google "App password" as SMTP_PASS.
 */
import nodemailer from 'nodemailer';
import { dayLabel } from './booking-rules.js';

const { SMTP_HOST, SMTP_PORT = '465', SMTP_USER, SMTP_PASS, NOTIFY_EMAIL, SITE_URL = '' } = process.env;

const transport =
  SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    : null;

export const emailEnabled = !!transport;

const TITLES = {
  appointment: 'New appointment booking',
  callback: 'Call-back request',
  enquiry: 'New question',
};

/** Fire-and-forget: never blocks or fails the patient's request */
export function notifyClinic(r) {
  if (!transport) return;
  const lines = [
    `${TITLES[r.type]} from the website — please follow up.`,
    '',
    `Name: ${r.name}`,
    r.phone && `Phone: ${r.phone}`,
    r.email && `Email: ${r.email}`,
    r.dob && `Date of birth: ${r.dob}`,
    r.date && `Preferred date & time: ${dayLabel(r.date)} · ${r.time}`,
    r.concern && `Treatment: ${r.concern}`,
    r.message && `${r.type === 'callback' ? 'Best time to call' : 'Message'}: ${r.message}`,
    `Reference: ${r.ref}`,
    '',
    `Confirm it in the staff area: ${SITE_URL}/admin`,
  ].filter((l) => l !== undefined && l !== null && l !== false);

  transport
    .sendMail({
      from: `"The Mirrors website" <${SMTP_USER}>`,
      to: NOTIFY_EMAIL || SMTP_USER,
      subject: `${TITLES[r.type]}: ${r.name}${r.date ? ` — ${dayLabel(r.date)}, ${r.time}` : ''}`,
      text: lines.join('\n'),
    })
    .catch((err) => console.error('Could not send notification email:', err.message));
}
