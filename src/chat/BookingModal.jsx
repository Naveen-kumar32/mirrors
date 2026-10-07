import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CONTACT, COORDINATOR } from '../data';
import { submitRequest, whatsappLink } from '../api';
import { useApi } from '../backend';
import { bookableDays, dayLabel, timeSlots, todayISO } from '../../server/booking-rules.js';
import { Icon } from '../components/ui';
import { opensWhen } from '../components/ClinicStatus';
import { useClinicStatus } from '../lib';
import { useChat } from './ChatProvider';
import { first, isName, isPhone } from './flow';

const AUTO_CLOSE_MS = 3000;
const TODAY = todayISO();

const blank = () => ({ name: '', phone: '', dob: '', date: '', time: '' });

// Without the clinic server (e.g. static hosting) we still know the opening hours, just not the bookings
const OFFLINE_SLOTS = { times: timeSlots(), days: bookableDays().map((date) => ({ date, label: dayLabel(date), booked: [] })) };

function validate(f) {
  const errors = {};
  const check = (key, result) => result !== true && (errors[key] = result);
  check('name', isName(f.name));
  check('phone', isPhone(f.phone));
  if (!f.dob || f.dob > TODAY) errors.dob = 'Please enter your date of birth.';
  if (!f.date) errors.date = 'Please choose a day.';
  if (!f.time) errors.time = 'Please choose a time.';
  return errors;
}

const formatDob = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function Field({ label, error, children, as: Tag = 'label' }) {
  return (
    <Tag className={`bf__field ${error ? 'has-error' : ''}`}>
      <span className="bf__label">{label}</span>
      {children}
      {error && <span className="bf__error">{error}</span>}
    </Tag>
  );
}

export default function BookingModal() {
  const { booking, closeBooking } = useChat();
  const slots = useApi(booking ? '/slots' : null);
  const [form, setForm] = useState(blank);
  const [concern, setConcern] = useState('');
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | done | offline | error
  const [errorText, setErrorText] = useState('');
  const dialog = useRef(null);
  const clinic = useClinicStatus();
  // While the clinic is closed the follow-up call happens once it opens
  const followUp = clinic.open ? 'within 2–3 hours (working days)' : `after we open (${opensWhen(clinic.text)})`;

  const schedule = slots.data || (slots.error ? OFFLINE_SLOTS : null);
  const day = schedule?.days.find((d) => d.date === form.date);

  // Reset the form each time it opens (the free slots are re-fetched too);
  // a treatment page passes its treatment as `concern`
  useEffect(() => {
    if (!booking) return;
    setForm(blank());
    setConcern(booking.concern || '');
    setErrors({});
    setStatus('idle');
    const t = setTimeout(() => dialog.current?.querySelector('input, select')?.focus(), 50);
    return () => clearTimeout(t);
  }, [booking]);

  useEffect(() => {
    if (!booking) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && closeBooking();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [booking, closeBooking]);

  // After a successful booking, show the confirmation briefly, then close
  useEffect(() => {
    if (status !== 'done') return;
    const t = setTimeout(closeBooking, AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [status, closeBooking]);

  if (!booking) return null;

  const set = (key) => (e) => {
    const value = typeof e === 'string' ? e : e.target.value;
    setForm((f) => ({ ...f, [key]: value, ...(key === 'date' && { time: '' }) }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const message = [
    'Hello, I would like to book an appointment at The Mirrors Dermatology Clinic.',
    `Name: ${form.name.trim()}`,
    `Contact number: ${form.phone.trim()}`,
    form.dob && `Date of birth: ${formatDob(form.dob)}`,
    `Preferred date & time: ${day?.label} · ${form.time}`,
    concern && `Treatment: ${concern}`,
  ]
    .filter(Boolean)
    .join('\n');

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      dialog.current?.querySelector('.has-error select, .has-error input, .has-error button')?.focus();
      return;
    }
    setStatus('sending');
    try {
      await submitRequest('appointment', { ...form, concern });
      setStatus('done');
    } catch (err) {
      if (err.code === 'slot_taken') {
        // Someone else got this time first: refresh the slots and ask for another time
        slots.reload();
        setForm((f) => ({ ...f, time: '' }));
        setErrors({ time: err.message });
        setStatus('idle');
        return;
      }
      setErrorText(err.message);
      setStatus(err.offline ? 'offline' : 'error');
    }
  };

  const title = { done: 'Appointment booked', offline: 'Almost done' }[status] || 'Book an appointment';

  return (
    <div className="bf-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeBooking()}>
      <div className="bf" role="dialog" aria-modal="true" aria-labelledby="bf-title" ref={dialog}>
        <header className="bf__head">
          <div>
            <p className="bf__eyebrow">The Mirrors Dermatology Clinic</p>
            <h2 id="bf-title">{title}</h2>
          </div>
          <button className="bf__close" onClick={closeBooking} aria-label="Close booking form">
            <Icon name="close" size={20} />
          </button>
        </header>

        {status === 'done' && (
          <div className="bf__done bf__success" role="status">
            <svg className="tick" viewBox="0 0 52 52" aria-hidden="true">
              <circle className="tick__circle" cx="26" cy="26" r="24" />
              <path className="tick__mark" d="M15 27l7 7 15-16" />
            </svg>
            <p className="bf__success-title">You’re booked in, {first(form.name)}!</p>
            <p>
              <strong>
                {day?.label} · {form.time}
              </strong>
            </p>
            <p>
              {COORDINATOR.name} from our team will call you on {form.phone} {followUp} to finalise your visit.
            </p>
            <span className="bf__timer" style={{ animationDuration: `${AUTO_CLOSE_MS}ms` }} aria-hidden="true" />
          </div>
        )}

        {status === 'offline' && (
          <div className="bf__done">
            <p>
              Please send your booking to {COORDINATOR.name} on WhatsApp to confirm it — your details are already
              written in the message. You can also call her on <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>.
            </p>
            <div className="bf__actions">
              <a className="btn btn--ghost" href={CONTACT.phoneHref}>
                <Icon name="phone" size={16} /> Call
              </a>
              <a className="btn btn--navy" href={whatsappLink(message)} target="_blank" rel="noreferrer">
                <Icon name="whatsapp" size={18} /> Send on WhatsApp
              </a>
            </div>
          </div>
        )}

        {(status === 'idle' || status === 'sending' || status === 'error') && (
          <form className="bf__form" onSubmit={submit} noValidate>
            <p className="bf__promise">
              <Icon name="check" size={18} />
              <span>
                <strong>Instant confirmation.</strong> Pick a free slot and your appointment is booked straight away —
                our team will call you {clinic.open ? 'within 2–3 hours on working days' : `after we open (${opensWhen(clinic.text)})`}{' '}
                to follow up.
              </span>
            </p>

            {concern && (
              <p className="bf__concern">
                Treatment: <strong>{concern}</strong>
                <button type="button" onClick={() => setConcern('')} aria-label="Remove treatment">
                  <Icon name="close" size={14} />
                </button>
              </p>
            )}

            <Field label="Name" error={errors.name}>
              <input value={form.name} onChange={set('name')} autoComplete="name" maxLength={80} />
            </Field>
            <div className="bf__row">
              <Field label="Contact number" error={errors.phone}>
                <input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" maxLength={25} />
              </Field>
              <Field label="Date of birth" error={errors.dob}>
                <input type="date" value={form.dob} onChange={set('dob')} max={TODAY} min="1900-01-01" autoComplete="bday" />
              </Field>
            </div>

            <Field label="Preferred date" error={errors.date}>
              <select value={form.date} onChange={set('date')} disabled={!schedule}>
                <option value="">{schedule ? 'Choose a day…' : 'Loading available days…'}</option>
                {schedule?.days.map((d) => {
                  const full = d.booked.length >= schedule.times.length;
                  return (
                    <option key={d.date} value={d.date} disabled={full}>
                      {d.label}
                      {full ? ' — fully booked' : ''}
                    </option>
                  );
                })}
              </select>
            </Field>

            <Field label="Preferred time" error={errors.time} as="div">
              {day ? (
                <div className="slots" role="radiogroup" aria-label="Available times">
                  {schedule.times.map((t) => {
                    const taken = day.booked.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={form.time === t}
                        disabled={taken}
                        className={`slot ${form.time === t ? 'is-on' : ''} ${taken ? 'is-booked' : ''}`}
                        onClick={() => set('time')(t)}
                        title={taken ? 'This slot is already booked' : undefined}
                      >
                        {t}
                        {taken && <small>Booked</small>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="slots__hint">Choose a day to see the available times.</p>
              )}
            </Field>

            {status === 'error' && (
              <p className="bf__fail">
                {errorText} You can also call us on <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>.
              </p>
            )}

            <div className="bf__actions">
              <button type="button" className="btn btn--ghost" onClick={closeBooking}>
                Cancel
              </button>
              <button type="submit" className="btn btn--navy" disabled={status === 'sending'}>
                {status === 'sending' ? 'Booking…' : 'Book appointment'}
              </button>
            </div>
            <p className="bf__fine">
              Monday – Saturday, 3:00 – 7:00 pm · 30-minute appointments · Sunday is a holiday.
              <br />
              Your details are used only to arrange your appointment — see our{' '}
              <Link to="/policies#privacy" onClick={closeBooking}>
                Privacy policy
              </Link>
              .
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
