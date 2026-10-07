import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api, useApi } from '../backend';
import Pagination from '../components/Pagination';
import { Icon } from '../components/ui';
import { useAuth } from './AdminApp';
import { confirmationMessage, replyMessage, reviewRequestMessage, smsTo, whatsappTo } from './messages';

const TYPE = { appointment: 'Appointment', callback: 'Call back', enquiry: 'Question' };
const STATUS = { new: 'New', confirmed: 'Confirmed', done: 'Done', cancelled: 'Cancelled' };
const VIEWS = [
  { value: 'new', label: 'New requests', count: 'new' },
  { value: 'confirmed', label: 'Confirmed', count: 'confirmed' },
  { value: 'closed', label: 'Done & cancelled' },
  { value: 'all', label: 'All' },
];

const day = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
const dob = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const received = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });


/* ---------- Confirm / reschedule / new booking dialog ---------- */
function BookingDialog({ request, onClose, onSaved }) {
  const { onAuthError } = useAuth();
  const isNew = !request; // staff booking for a patient who phoned in
  const slots = useApi(`/admin/slots${request ? `?except=${request.id}` : ''}`);
  const [f, setF] = useState({
    name: '',
    phone: '',
    dob: '',
    date: request?.date || '',
    time: request?.time || '',
    note: request?.note || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(null); // the confirmed appointment, ready to send to the patient
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // The requested day may no longer be in the list (e.g. it has passed) — then staff pick again
  const days = slots.data?.days || [];
  const selected = days.find((d) => d.date === f.date);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value, ...(k === 'date' && { time: '' }) }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = { date: f.date, time: f.time, note: f.note };
      const r = isNew
        ? await api('/admin/appointments', { method: 'POST', body: { ...body, name: f.name, phone: f.phone, dob: f.dob } })
        : await api(`/admin/requests/${request.id}/confirm`, { method: 'POST', body });
      setSaved(r);
      setBusy(false);
      onSaved(`Appointment confirmed for ${r.name} — ${day(r.date)}, ${r.time}.`);
    } catch (err) {
      onAuthError(err);
      setError(err.message);
      setBusy(false);
      slots.reload();
    }
  };

  const title = isNew ? 'Book an appointment' : request.status === 'confirmed' ? 'Reschedule appointment' : 'Confirm booking';

  // Step 2: the slot is booked — send the confirmation to the patient
  if (saved) {
    const text = confirmationMessage(saved);
    const copy = () => navigator.clipboard?.writeText(text).then(() => setCopied(true), () => {});
    return createPortal(
      <div className="bf-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="bf" role="dialog" aria-modal="true" aria-label="Send confirmation">
          <header className="bf__head">
            <div>
              <p className="bf__eyebrow">{saved.name}</p>
              <h2>Appointment confirmed</h2>
            </div>
            <button type="button" className="bf__close" onClick={onClose} aria-label="Close">
              <Icon name="close" size={20} />
            </button>
          </header>
          <div className="bf__form">
            <p className="bf__promise">
              <Icon name="check" size={18} />
              <span>
                <strong>
                  {day(saved.date)} · {saved.time}
                </strong>{' '}
                is now booked. Send {saved.name.split(' ')[0]} the confirmation:
              </span>
            </p>
            <pre className="amsg">{text}</pre>
            <div className="bf__actions bf__actions--start">
              <a className="btn btn--navy" href={whatsappTo(saved.phone, text)} target="_blank" rel="noreferrer">
                <Icon name="whatsapp" size={18} /> Send on WhatsApp
              </a>
              <a className="btn btn--ghost" href={smsTo(saved.phone, text)}>
                Send as SMS
              </a>
              <button type="button" className="btn btn--ghost" onClick={copy}>
                {copied ? 'Copied' : 'Copy message'}
              </button>
            </div>
            <button type="button" className="aback amsg__done" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="bf-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="bf" role="dialog" aria-modal="true" aria-label={title} onSubmit={save}>
        <header className="bf__head">
          <div>
            <p className="bf__eyebrow">{isNew ? 'Phone or walk-in booking' : request.name}</p>
            <h2>{title}</h2>
          </div>
          <button type="button" className="bf__close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </header>
        <div className="bf__form">
          {!isNew && (
            <p className="bf__promise">
              <Icon name="phone" size={18} />
              <span>
                Requested <strong>{day(request.date)} · {request.time}</strong>
                {request.phone && <> — call {request.phone} to agree the time, then save.</>}
              </span>
            </p>
          )}
          {error && <p className="bf__fail">{error}</p>}

          {isNew && (
            <>
              <label className="bf__field">
                <span className="bf__label">Patient name</span>
                <input value={f.name} onChange={set('name')} required autoFocus />
              </label>
              <div className="bf__row">
                <label className="bf__field">
                  <span className="bf__label">Contact number</span>
                  <input type="tel" value={f.phone} onChange={set('phone')} required />
                </label>
                <label className="bf__field">
                  <span className="bf__label">
                    Date of birth <em>(optional)</em>
                  </span>
                  <input type="date" value={f.dob} onChange={set('dob')} />
                </label>
              </div>
            </>
          )}

          <label className="bf__field">
            <span className="bf__label">Date</span>
            <select value={selected ? f.date : ''} onChange={set('date')} required>
              <option value="">{slots.loading && !slots.data ? 'Loading…' : 'Choose a day…'}</option>
              {days.map((d) => (
                <option key={d.date} value={d.date}>
                  {d.label}
                  {d.booked.length ? ` — ${d.booked.length} booked` : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="bf__field">
            <span className="bf__label">Time</span>
            {selected ? (
              <div className="slots">
                {slots.data.times.map((t) => {
                  const taken = selected.booked.find((b) => b.time === t);
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={!!taken}
                      className={`slot ${f.time === t ? 'is-on' : ''} ${taken ? 'is-booked' : ''}`}
                      onClick={() => setF((x) => ({ ...x, time: t }))}
                      title={taken ? `Booked: ${taken.name}` : undefined}
                    >
                      {t}
                      {taken && <small>{taken.name.split(' ')[0]}</small>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="slots__hint">Choose a day to see free times.</p>
            )}
          </div>

          <label className="bf__field">
            <span className="bf__label">
              Note for the clinic <em>(optional)</em>
            </span>
            <textarea
              rows={3}
              value={f.note}
              onChange={set('note')}
              maxLength={1000}
              placeholder="e.g. First visit — bring previous prescriptions"
            />
          </label>

          <div className="bf__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn--navy" disabled={busy || !selected || !f.time}>
              {busy ? 'Saving…' : isNew ? 'Book appointment' : 'Save & confirm'}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body
  );
}

/* ---------- Appointments page ---------- */
export default function Requests() {
  const { user, onAuthError } = useAuth();
  const [view, setView] = useState('new');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null); // { request } — or { request: null } for a new booking
  const [flash, setFlash] = useState('');
  const { data, error, loading, reload } = useApi(`/admin/requests?view=${view}&page=${page}`);

  useEffect(() => {
    if (error) onAuthError(error);
  }, [error, onAuthError]);

  // New bookings arrive while the page is open
  useEffect(() => {
    const id = setInterval(reload, 60000);
    return () => clearInterval(id);
  }, [reload]);

  const act = async (fn, message) => {
    try {
      await fn();
      if (message) setFlash(message);
      reload();
    } catch (err) {
      onAuthError(err);
      window.alert(err.message);
    }
  };

  const setStatus = (r, status, message) =>
    act(() => api(`/admin/requests/${r.id}`, { method: 'PATCH', body: { status } }), message);
  const cancel = (r) =>
    window.confirm(`Cancel ${r.name}’s appointment? The time slot becomes free for others.`) &&
    setStatus(r, 'cancelled', `${r.name}’s appointment was cancelled.`);
  const remove = (r) =>
    window.confirm(`Delete the request from ${r.name}? This cannot be undone.`) &&
    act(() => api(`/admin/requests/${r.id}`, { method: 'DELETE' }), 'Request deleted.');

  // Confirmed appointments get the full confirmation; everything else a short hello
  const reply = (r) => whatsappTo(r.phone, r.status === 'confirmed' ? confirmationMessage(r) : replyMessage(r));

  return (
    <section className="apage">
      <header className="apage__head">
        <div>
          <h1>Appointments</h1>
          <p>
            New bookings from the website wait here. Call the patient, then <strong>Confirm booking</strong> — the time
            slot then shows as booked on the website, so no one else can take it.
          </p>
        </div>
        <button className="btn btn--navy" onClick={() => setDialog({ request: null })}>
          <Icon name="plus" size={18} /> Book appointment
        </button>
      </header>

      {flash && (
        <p className="aflash" role="status">
          {flash}
          <button onClick={() => setFlash('')} aria-label="Dismiss">
            ×
          </button>
        </p>
      )}

      <div className="filters filters--left" role="tablist" aria-label="Show">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            role="tab"
            aria-selected={view === v.value}
            className={view === v.value ? 'is-on' : ''}
            onClick={() => (setView(v.value), setPage(1))}
          >
            {v.label}
            {v.count && data?.counts[v.count] > 0 && <span className="acount">{data.counts[v.count]}</span>}
          </button>
        ))}
      </div>

      {loading && !data && <p className="state">Loading…</p>}
      {error && <p className="bf__fail">{error.message}</p>}
      {data && !data.total && (
        <p className="state">
          {view === 'new'
            ? 'No new requests — you’re all caught up.'
            : view === 'confirmed'
              ? 'No upcoming appointments.'
              : 'Nothing here yet.'}
        </p>
      )}

      <ul className="alist">
        {data?.items.map((r) => {
          const appt = r.type === 'appointment';
          return (
            <li key={r.id} className={`alist__row areq areq--${r.status}`}>
              <div className="alist__main">
                <strong>
                  <span className={`badge badge--${r.type}`}>{TYPE[r.type]}</span>
                  <span className={`badge badge--st-${r.status}`}>{STATUS[r.status]}</span>
                  {r.name}
                </strong>
                {appt && (
                  <p className="areq__when">
                    <Icon name="clock" size={15} /> {day(r.date)} · {r.time}
                    {r.status === 'new' && <em>(requested)</em>}
                    {r.concern && <span>· {r.concern}</span>}
                  </p>
                )}
                {r.type === 'callback' && r.message && <p className="areq__when">Best time to call: {r.message}</p>}
                {r.type === 'enquiry' && <p className="areview__text">{r.message}</p>}
                {r.note && <p className="areq__note">Note: {r.note}</p>}
                <span>
                  {r.phone && <a href={`tel:${r.phone.replace(/[^\d+]/g, '')}`}>{r.phone}</a>}
                  {r.email && <a href={`mailto:${r.email}`}>{r.email}</a>}
                  {r.dob && <span>· Born {dob(r.dob)}</span>}
                  <span>· {r.source === 'staff' ? 'Booked by staff' : 'From website'}</span>
                  <span>· Received {received(r.createdAt)}</span>
                </span>
              </div>
              <div className="alist__actions">
                {appt && r.status === 'new' && (
                  <button className="abtn abtn--primary" onClick={() => setDialog({ request: r })}>
                    Confirm booking
                  </button>
                )}
                {appt && r.status === 'confirmed' && (
                  <>
                    <button className="abtn" onClick={() => setDialog({ request: r })}>
                      Reschedule
                    </button>
                    <button className="abtn" onClick={() => setStatus(r, 'done', `${r.name} marked as visited.`)}>
                      Visited
                    </button>
                  </>
                )}
                {r.phone && (
                  <a className="abtn" href={reply(r)} target="_blank" rel="noreferrer">
                    {r.status === 'confirmed' ? 'Send confirmation' : 'WhatsApp'}
                  </a>
                )}
                {!appt && r.status === 'new' && (
                  <button className="abtn" onClick={() => setStatus(r, 'done')}>
                    Mark done
                  </button>
                )}
                {appt && ['new', 'confirmed'].includes(r.status) && (
                  <button className="abtn abtn--danger" onClick={() => cancel(r)}>
                    Cancel
                  </button>
                )}
                {appt && r.status === 'done' && r.phone && (
                  <a className="abtn abtn--primary" href={whatsappTo(r.phone, reviewRequestMessage(r))} target="_blank" rel="noreferrer">
                    Ask for a Google review
                  </a>
                )}
                {['done', 'cancelled'].includes(r.status) && (
                  <button className="abtn" onClick={() => setStatus(r, 'new', 'Moved back to New requests.')}>
                    Reopen
                  </button>
                )}
                {user.role === 'admin' && (
                  <button className="abtn abtn--danger" onClick={() => remove(r)}>
                    Delete
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {data && <Pagination page={data.page} pages={data.pages} onChange={(p) => (setPage(p), window.scrollTo({ top: 0 }))} />}

      {dialog && (
        <BookingDialog
          request={dialog.request}
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setFlash(message);
            reload();
          }}
        />
      )}
    </section>
  );
}
