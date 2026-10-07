/*
 * Patient requests (appointments, call backs, questions) are saved by the clinic
 * server (see /server) and appear for staff under Appointments in /admin.
 * If the server can't be reached, the UI offers WhatsApp instead (whatsappLink).
 */
import { api } from './backend';
import { CONTACT } from './data';

export async function submitRequest(type, fields) {
  const { ref } = await api('/requests', { method: 'POST', body: { type, ...fields } });
  return ref;
}

/** wa.me link to the clinic with a ready-written message */
export const whatsappLink = (text) => `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}`;
