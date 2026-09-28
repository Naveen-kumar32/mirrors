import { useEffect, useRef, useState } from 'react';
import { SERVICES, TEAM } from '../data';
import { downloadIcs, nextOpenDays, submitRequest, TIME_SLOTS } from '../api';
import { Icon } from '../components/ui';
import { useChat } from './ChatProvider';
import { first, isEmail, isName, isPhone } from './flow';

const CONCERNS = [...SERVICES.map((s) => s.title), 'General consultation'];
const DAYS = nextOpenDays(12);

const blank = (preset = {}) => ({
  concern: preset.concern || '',
  patientType: 'New patient',
  visitType: 'In clinic',
  doctor: preset.doctor || 'No preference',
  date: '',
  time: '',
  name: '',
  phone: '',
  email: '',
  notes: '',
});

function validate(f) {
  const errors = {};
  const check = (key, result) => result !== true && (errors[key] = result);
  if (!f.concern) errors.concern = 'Please choose a treatment.';
  if (!f.date) errors.date = 'Please choose a day.';
  if (!f.time) errors.time = 'Please choose a time.';
  check('name', isName(f.name));
  check('phone', isPhone(f.phone));
  check('email', isEmail(f.email));
  return errors;
}

function Field({ label, error, children, optional }) {
  return (
    <label className={`bf__field ${error ? 'has-error' : ''}`}>
      <span className="bf__label">
        {label} {optional && <em>(optional)</em>}
      </span>
      {children}
      {error && <span className="bf__error">{error}</span>}
    </label>
  );
}

function Segmented({ name, value, options, onChange }) {
  return (
    <div className="bf__seg" role="radiogroup">
      {options.map((o) => (
        <label key={o} className={value === o ? 'is-on' : ''}>
          <input type="radio" name={name} value={o} checked={value === o} onChange={() => onChange(o)} />
          {o}
        </label>
      ))}
    </div>
  );
}

export default function BookingModal() {
  const { booking, closeBooking } = useChat();
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [ref, setRef] = useState(null);
  const dialog = useRef(null);

  // Reset the form each time it opens, applying any preset (treatment / doctor)
  useEffect(() => {
    if (!booking) return;
    setForm(blank(booking));
    setErrors({});
    setStatus('idle');
    setRef(null);
    const t = setTimeout(() => dialog.current?.querySelector('select, input')?.focus(), 50);
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

  if (!booking) return null;

  const set = (key) => (e) => {
    const v = typeof e === 'string' ? e : e.target.value;
    setForm((f) => ({ ...f, [key]: v }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const dateLabel = DAYS.find((d) => d.value === form.date)?.label;

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      dialog.current?.querySelector('.has-error select, .has-error input')?.focus();
      return;
    }
    setStatus('sending');
    try {
      setRef(await submitRequest('appointment', { ...form, notes: form.notes.trim() }));
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="bf-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeBooking()}>
      <div className="bf" role="dialog" aria-modal="true" aria-labelledby="bf-title" ref={dialog}>
        <header className="bf__head">
          <div>
            <p className="bf__eyebrow">The Mirrors Dermatology Clinic</p>
            <h2 id="bf-title">{status === 'done' ? 'Request sent' : 'Book an appointment'}</h2>
          </div>
          <button className="bf__close" onClick={closeBooking} aria-label="Close booking form">
            <Icon name="close" size={20} />
          </button>
        </header>

        {status === 'done' ? (
          <div className="bf__done">
            <span className="cc__check">
              <Icon name="check" size={22} />
            </span>
            <p>
              Thanks {first(form.name)} — our care team will call <strong>{form.phone}</strong> within one business
              day to confirm your appointment.
            </p>
            <p>
              Requested: <strong>{dateLabel} · {form.time}</strong>
            </p>
            <p className="cc__ref">
              Reference <strong>{ref}</strong>
            </p>
            <div className="bf__actions">
              <button
                className="btn btn--ghost"
                onClick={() =>
                  downloadIcs({ date: form.date, time: form.time, title: `The Mirrors — ${form.concern}`, ref })
                }
              >
                <Icon name="clock" size={16} /> Add to calendar
              </button>
              <button className="btn btn--navy" onClick={closeBooking}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form className="bf__form" onSubmit={submit} noValidate>
            <Field label="Treatment" error={errors.concern}>
              <select value={form.concern} onChange={set('concern')}>
                <option value="">Select a treatment…</option>
                {CONCERNS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
                {form.concern && !CONCERNS.includes(form.concern) && <option>{form.concern}</option>}
              </select>
            </Field>

            <div className="bf__row">
              <Field label="Have you visited before?">
                <Segmented
                  name="patientType"
                  value={form.patientType}
                  options={['New patient', 'Returning patient']}
                  onChange={set('patientType')}
                />
              </Field>
              <Field label="Visit type">
                <Segmented
                  name="visitType"
                  value={form.visitType}
                  options={['In clinic', 'Video consult']}
                  onChange={set('visitType')}
                />
              </Field>
            </div>

            <Field label="Preferred dermatologist">
              <select value={form.doctor} onChange={set('doctor')}>
                <option>No preference</option>
                {TEAM.map((t) => (
                  <option key={t.name}>{t.name}</option>
                ))}
              </select>
            </Field>

            <div className="bf__row">
              <Field label="Day" error={errors.date}>
                <select value={form.date} onChange={set('date')}>
                  <option value="">Choose a day…</option>
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Time" error={errors.time}>
                <select value={form.time} onChange={set('time')}>
                  <option value="">Choose a time…</option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Full name" error={errors.name}>
              <input value={form.name} onChange={set('name')} autoComplete="name" />
            </Field>
            <div className="bf__row">
              <Field label="Phone" error={errors.phone}>
                <input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
              </Field>
              <Field label="Email" error={errors.email}>
                <input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
              </Field>
            </div>
            <Field label="Anything your dermatologist should know?" optional>
              <textarea
                rows={3}
                value={form.notes}
                onChange={set('notes')}
                placeholder="e.g. flare-ups on my cheeks for 3 months"
              />
            </Field>

            {status === 'error' && (
              <p className="bf__fail">
                Sorry — something went wrong sending your request. Please try again, or call us directly.
              </p>
            )}

            <div className="bf__actions">
              <button type="button" className="btn btn--ghost" onClick={closeBooking}>
                Cancel
              </button>
              <button type="submit" className="btn btn--navy" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Request appointment'}
              </button>
            </div>
            <p className="bf__fine">Our team will call to confirm your time. No referral needed.</p>
          </form>
        )}
      </div>
    </div>
  );
}
