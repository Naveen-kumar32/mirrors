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

const blank = () => ({ name: '', phone: '', gender: '', dob: '', date: '', time: '' });

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

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW_LABELS = ['Mo','Tu','We','Th','Fr','Sa','Su'];

export function DateCalendar({ schedule, value, onChange, error }) {
  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();

  const [viewYear, setViewYear] = useState(todayY);
  const [viewMonth, setViewMonth] = useState(todayM);
  const initialized = useRef(false);

  // Auto-advance to the month containing the first available day when schedule loads
  useEffect(() => {
    if (initialized.current || !schedule?.days?.length) return;
    initialized.current = true;
    const first = schedule.days.find((d) => d.booked.length < schedule.times.length);
    if (!first) return;
    const dt = new Date(`${first.date}T00:00:00`);
    setViewYear(dt.getFullYear());
    setViewMonth(dt.getMonth());
  }, [schedule]);

  const prevMonth = () => {
    if (viewYear === todayY && viewMonth === todayM) return;
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };
  const canPrev = viewYear > todayY || (viewYear === todayY && viewMonth > todayM);

  // Build the 7-column grid for this month
  const firstDow = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const leadingBlanks = (firstDow + 6) % 7;                   // shift to Mon-start
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const availMap = new Map((schedule?.days || []).map((d) => [d.date, d]));
  const pad = (n) => String(n).padStart(2, '0');
  const toISO = (d) => `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;

  const todayISO = `${todayY}-${pad(todayM + 1)}-${pad(today.getDate())}`;

  return (
    <div className={`cal${error ? ' cal--error' : ''}`}>
      {/* Header nav */}
      <div className="cal__nav">
        <button type="button" onClick={prevMonth} disabled={!canPrev} aria-label="Previous month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="cal__month-label">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} aria-label="Next month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="cal__grid" role="grid" aria-label={`${MONTH_NAMES[viewMonth]} ${viewYear}`}>
        {DOW_LABELS.map((d) => (
          <div key={d} role="columnheader" className="cal__dow">{d}</div>
        ))}

        {/* Leading blank cells */}
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`b${i}`} className="cal__cell cal__cell--blank" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1;
          const iso = toISO(dayNum);
          const dayData = availMap.get(iso);
          const isPast = iso < todayISO;
          const isToday = iso === todayISO;
          const isFull = dayData ? dayData.booked.length >= (schedule?.times?.length ?? 0) : false;
          const isAvailable = !!dayData && !isPast && !isFull;
          const isSelected = value === iso;

          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              className={[
                'cal__cell',
                isAvailable ? 'cal__cell--avail' : 'cal__cell--off',
                isToday ? 'cal__cell--today' : '',
                isSelected ? 'cal__cell--selected' : '',
                isFull ? 'cal__cell--full' : '',
              ].filter(Boolean).join(' ')}
              disabled={!isAvailable}
              onClick={() => isAvailable && onChange(iso)}
              aria-label={`${dayNum} ${MONTH_NAMES[viewMonth]}${isFull ? ' — fully booked' : ''}`}
              aria-pressed={isSelected}
            >
              <span>{dayNum}</span>
              {isFull && <span className="cal__dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {/* Selected date display */}
      {value && (
        <p className="cal__chosen">
          Selected: <strong>{availMap.get(value)?.label || value}</strong>
        </p>
      )}
    </div>
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
  const [refCode, setRefCode] = useState('');
  const [calOpen, setCalOpen] = useState(false);
  const dialog = useRef(null);
  const calPickerRef = useRef(null);
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
    setRefCode('');
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

  // Close the date-picker dropdown when clicking outside it
  useEffect(() => {
    if (!calOpen) return;
    const handler = (e) => {
      if (!calPickerRef.current?.contains(e.target)) setCalOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [calOpen]);

  if (!booking) return null;

  const set = (key) => (e) => {
    let value = typeof e === 'string' ? e : e.target.value;
    if (key === 'phone') value = value.replace(/[^+()[\]\d\s.\-]/g, '');
    setForm((f) => ({ ...f, [key]: value, ...(key === 'date' && { time: '' }) }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const message = [
    'Hello, I would like to book an appointment at The Mirrors Dermatology Clinic.',
    `Name: ${form.name.trim()}`,
    `Contact number: ${form.phone.trim()}`,
    form.gender && `Gender: ${{ male: 'Male', female: 'Female', other: 'Other' }[form.gender]}`,
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
      const code = await submitRequest('appointment', { ...form, concern });
      setRefCode(code || '');
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
            {refCode && (
              <p className="cc__ref">
                Reference code: <strong>{refCode}</strong>
              </p>
            )}
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
              <Field label="Gender">
                <select value={form.gender} onChange={set('gender')} autoComplete="sex">
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Date of birth" error={errors.dob}>
                <input type="date" value={form.dob} onChange={set('dob')} max={TODAY} min="1900-01-01" autoComplete="bday" />
              </Field>
            </div>

            <Field label="Preferred date" error={errors.date} as="div">
              <div className="cal-picker" ref={calPickerRef}>
                <button
                  type="button"
                  className={`cal-picker__trigger${form.date ? ' has-value' : ''}`}
                  onClick={() => setCalOpen((o) => !o)}
                  aria-haspopup="true"
                  aria-expanded={calOpen}
                  disabled={!schedule}
                >
                  <span>
                    {!schedule
                      ? 'Loading available days…'
                      : form.date
                        ? (schedule.days.find((d) => d.date === form.date)?.label || form.date)
                        : 'Choose a date…'}
                  </span>
                  <Icon name="calendar" size={17} />
                </button>

                {calOpen && schedule && (
                  <div className="cal-picker__dropdown">
                    <DateCalendar
                      schedule={schedule}
                      value={form.date}
                      onChange={(iso) => {
                        setForm((f) => ({ ...f, date: iso, time: '' }));
                        if (errors.date) setErrors((x) => ({ ...x, date: undefined }));
                        setCalOpen(false);
                      }}
                      error={false}
                    />
                  </div>
                )}
              </div>
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
              Monday – Saturday, 3:00 – 7:00 pm · Sunday is a holiday.
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
