import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api, useApi } from '../backend';
import { DateCalendar } from '../chat/BookingModal';
import Pagination from '../components/Pagination';
import { Icon } from '../components/ui';
import { RefreshButton, useAuth } from './AdminApp';
import { confirmationMessage, replyMessage, reviewRequestMessage, smsTo, whatsappTo } from './messages';
import { PatientReportModal, ReopenVisitDialog, VisitBadge } from './PatientModals';

const TYPE = { appointment: 'Appointment', callback: 'Call back', enquiry: 'Question' };
const STATUS = { new: 'New', confirmed: 'Confirmed', done: 'Visited', cancelled: 'Cancelled' };
const VIEWS = [
  { value: 'new', label: 'New requests', count: 'new' },
  { value: 'confirmed', label: 'Confirmed', count: 'confirmed' },
  { value: 'closed', label: 'Visited & cancelled' },
  { value: 'all', label: 'All' },
];

const day = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
const dob = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const received = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const age = (iso) => {
  if (!iso) return null;
  const today = new Date();
  const d = new Date(`${iso}T00:00:00`);
  let a = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) a--;
  return a;
};
const GENDER_LABEL = { male: 'M', female: 'F', other: 'Other' };

/* ---------- Confirm / reschedule / new booking dialog (with Existing Patient Revisit & Same ID support) ---------- */
function BookingDialog({ request, onClose, onSaved }) {
  const { onAuthError } = useAuth();
  const isNew = !request; // staff booking for a patient who phoned in or walked in
  const slots = useApi(`/admin/slots${request ? `?except=${request.id}` : ''}`);
  const patients = useApi(isNew ? '/admin/patients/lookup' : null);
  const [patientMode, setPatientMode] = useState('new'); // 'new' | 'existing'
  const [f, setF] = useState({
    existingRef: '',
    visitType: 'first',
    name: request?.name || '',
    phone: request?.phone || '',
    email: request?.email || '',
    gender: request?.gender || '',
    dob: request?.dob || '',
    concern: request?.concern || 'General consultation',
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

  const days = slots.data?.days || [];
  const selected = days.find((d) => d.date === f.date);
  const set = (k) => (e) => {
    let value = e.target.value;
    if (k === 'phone') value = value.replace(/[^+()[\]\d\s.\-]/g, '');
    setF((x) => ({ ...x, [k]: value, ...(k === 'date' && { time: '' }) }));
  };

  const selectExistingPatient = (refCode) => {
    const cleanRef = refCode.trim().toUpperCase();
    const match = (patients.data?.patients || []).find((p) => p.ref.toUpperCase() === cleanRef);
    setF((x) => ({
      ...x,
      existingRef: cleanRef,
      visitType: x.visitType === 'first' ? 'revisit' : x.visitType,
      ...(match
        ? {
            name: match.name || x.name,
            phone: match.phone || x.phone,
            email: match.email || x.email,
            gender: match.gender || x.gender,
            dob: match.dob || x.dob,
            concern: match.lastConcern || x.concern,
          }
        : {}),
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = { date: f.date, time: f.time, concern: f.concern, note: f.note };
      const r = isNew
        ? await api('/admin/appointments', {
            method: 'POST',
            body: {
              ...body,
              name: f.name,
              phone: f.phone,
              email: f.email,
              gender: f.gender || undefined,
              dob: f.dob,
              existingRef: patientMode === 'existing' ? f.existingRef : '',
              visitType: patientMode === 'existing' ? f.visitType : 'first',
            },
          })
        : await api(`/admin/requests/${request.id}/confirm`, { method: 'POST', body });
      setSaved(r);
      setBusy(false);
      onSaved(`Appointment confirmed for ${r.name} (${r.ref}) — ${day(r.date)}, ${r.time}.`);
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
              <p className="bf__eyebrow">
                {saved.name} · Ref ID: <strong>{saved.ref}</strong>
              </p>
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
                is now booked under ID <strong>{saved.ref}</strong>. Send {saved.name.split(' ')[0]} the confirmation:
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
            <p className="bf__eyebrow">
              {isNew ? 'Phone or walk-in booking' : `${request.name} · Ref ID: ${request.ref}`}
            </p>
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
              <div className="abody__tabs" style={{ alignSelf: 'flex-start' }}>
                <button
                  type="button"
                  className={patientMode === 'new' ? 'is-on' : ''}
                  onClick={() => {
                    setPatientMode('new');
                    setF((x) => ({ ...x, existingRef: '', visitType: 'first' }));
                  }}
                >
                  New Patient (1st Visit)
                </button>
                <button
                  type="button"
                  className={patientMode === 'existing' ? 'is-on' : ''}
                  onClick={() => {
                    setPatientMode('existing');
                    setF((x) => ({ ...x, visitType: 'revisit' }));
                  }}
                >
                  Existing Customer (Revisit / Same ID)
                </button>
              </div>

              {patientMode === 'existing' && (
                <div className="bf__row">
                  <label className="bf__field">
                    <span className="bf__label">Existing Customer Ref ID (auto-fills details)</span>
                    <input
                      list="staff-existing-patients"
                      value={f.existingRef}
                      onChange={(e) => selectExistingPatient(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      placeholder="Type MD-... ref code"
                      required
                    />
                    <datalist id="staff-existing-patients">
                      {(patients.data?.patients || []).map((p) => (
                        <option key={p.ref} value={p.ref}>
                          {p.name} · {p.phone} ({p.visitCount} visit{p.visitCount > 1 ? 's' : ''})
                        </option>
                      ))}
                    </datalist>
                  </label>
                  <label className="bf__field">
                    <span className="bf__label">Visit type</span>
                    <select value={f.visitType} onChange={set('visitType')}>
                      <option value="revisit">Existing Customer Revisit (Follow-up)</option>
                      <option value="rescheduled_first">Reopened / Rescheduled 1st Visit</option>
                    </select>
                  </label>
                </div>
              )}

              <div className="bf__row">
                <label className="bf__field">
                  <span className="bf__label">Patient name</span>
                  <input value={f.name} onChange={set('name')} required autoFocus={patientMode === 'new'} />
                </label>
                <label className="bf__field">
                  <span className="bf__label">Mobile number</span>
                  <input type="tel" value={f.phone} onChange={set('phone')} required />
                </label>
              </div>

              <div className="bf__row">
                <label className="bf__field">
                  <span className="bf__label">
                    Email <em>(optional)</em>
                  </span>
                  <input type="email" value={f.email} onChange={set('email')} />
                </label>
                <label className="bf__field">
                  <span className="bf__label">Gender <em>(optional)</em></span>
                  <select value={f.gender} onChange={set('gender')} autoComplete="sex">
                    <option value="">Not specified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
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

          <div className="bf__field">
            <span className="bf__label">Date</span>
            <DateCalendar
              schedule={slots.data}
              value={f.date}
              onChange={(iso) => setF((x) => ({ ...x, date: iso, time: '' }))}
            />
            {slots.loading && !slots.data && <p className="slots__hint">Loading available days…</p>}
          </div>

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
              rows={2}
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
  const [q, setQ] = useState('');
  const [dialog, setDialog] = useState(null); // { request } — or { request: null } for a new booking
  const [reportTarget, setReportTarget] = useState(null); // individual patient report modal
  const [reopenTarget, setReopenTarget] = useState(null); // flexible reopen / revisit modal
  const [flash, setFlash] = useState('');
  const { data, error, loading, refreshing, reload } = useApi(
    `/admin/requests?view=${view}&page=${page}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`
  );

  useEffect(() => {
    if (error) onAuthError(error);
  }, [error, onAuthError]);

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
  const counts = data?.counts || { total: 0, new: 0, confirmed: 0, done: 0, cancelled: 0 };

  return (
    <section className="apage areport--compact">
      <header className="areport__top no-print">
        <div className="areport__top-left">
          <RefreshButton onRefresh={reload} refreshing={refreshing} loading={loading} />
          <h1>Appointments</h1>
        </div>

        <div className="areport__top-right">
          <div className="astats-mini" aria-label="Appointments summary">
            <span className="astat-pill">
              Total <strong>{counts.total || 0}</strong>
            </span>
            <span className="astat-pill astat-pill--confirmed">
              Confirmed <strong>{counts.confirmed || 0}</strong>
            </span>
            <span className="astat-pill astat-pill--new">
              New (Pending) <strong>{counts.new || 0}</strong>
            </span>
            <span className="astat-pill astat-pill--done">
              Visited <strong>{counts.done || 0}</strong>
            </span>
            <span className="astat-pill">
              Cancelled <strong>{counts.cancelled || 0}</strong>
            </span>
          </div>

          <button className="abtn abtn--primary" onClick={() => setDialog({ request: null })}>
            <Icon name="plus" size={15} /> Book appointment
          </button>
        </div>
      </header>

      {flash && (
        <p className="aflash" role="status">
          {flash}
          <button onClick={() => setFlash('')} aria-label="Dismiss">
            ×
          </button>
        </p>
      )}

      <div className="areport__bar">
        <div className="filters filters--compact" role="tablist" aria-label="Show">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              role="tab"
              aria-selected={view === v.value}
              className={view === v.value ? 'is-on' : ''}
              onClick={() => (setView(v.value), setPage(1))}
            >
              {v.label}
              {v.count && counts[v.count] > 0 && <span className="acount">{counts[v.count]}</span>}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="areport__search-input"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search by Ref ID (e.g. MD-...), patient name, phone or email…"
          aria-label="Search requests"
        />
      </div>

      {loading && !data && <p className="state">Loading…</p>}
      {error && <p className="bf__fail">{error.message}</p>}
      {data && !data.total && (
        <p className="state">
          {q.trim()
            ? `No requests matching “${q.trim()}”.`
            : view === 'new'
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
                <div className="areq__head">
                  <span className="areq__name">
                    {r.name}
                    {(r.dob || r.gender) && (
                      <span className="areq__meta">
                        {r.dob && age(r.dob) !== null && <span>{age(r.dob)} yrs</span>}
                        {r.gender && <span>{GENDER_LABEL[r.gender] || r.gender}</span>}
                      </span>
                    )}
                  </span>
                  <div className="areq__badges">
                    <span className={`badge badge--${r.type}`}>{TYPE[r.type]}</span>
                    <span className={`badge badge--st-${r.status}`}>{STATUS[r.status]}</span>
                    {r.ref && <code className="aref" title="Customer reference ID">{r.ref}</code>}
                    {appt && <VisitBadge r={r} onOpenHistory={(item) => setReportTarget(item)} />}
                  </div>
                </div>
                {appt && (
                  <p className="areq__when">
                    <Icon name="clock" size={15} /> {day(r.date)} · {r.time}
                    {r.status === 'new' && <em>(requested)</em>}
                    {r.concern && <span>· {r.concern}</span>}
                    {Number(r.amountPaid) > 0 && (
                      <span className="badge badge--published">Paid ₹{Number(r.amountPaid).toLocaleString('en-IN')}</span>
                    )}
                  </p>
                )}
                {r.type === 'callback' && r.message && <p className="areq__when">Best time to call: {r.message}</p>}
                {r.type === 'enquiry' && <p className="areview__text">{r.message}</p>}
                {(r.diagnosis || r.treatments) && (
                  <p className="areq__note">
                    {r.diagnosis && <><strong>Dx:</strong> {r.diagnosis} </>}
                    {r.treatments && <>· <strong>Tx:</strong> {r.treatments}</>}
                  </p>
                )}
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
                    <button className="abtn abtn--primary" onClick={() => setStatus(r, 'done', `${r.name} marked as visited.`)}>
                      Visited
                    </button>
                  </>
                )}
                {appt && (
                  <button
                    className="abtn"
                    onClick={() => setReportTarget(r)}
                    title="Open clinical report, diagnosis, medicines & billing PDF"
                  >
                    Patient Report / ℞
                  </button>
                )}
                {appt && (
                  <button
                    className="abtn"
                    onClick={() => setReopenTarget(r)}
                    title="Reopen as 1st appointment, add existing customer revisit (same ID), or link ID"
                  >
                    Reopen / Revisit
                  </button>
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
                  <a className="abtn" href={whatsappTo(r.phone, reviewRequestMessage(r))} target="_blank" rel="noreferrer">
                    Ask for review
                  </a>
                )}
                {!appt && ['done', 'cancelled'].includes(r.status) && (
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

      {reportTarget && (
        <PatientReportModal
          request={reportTarget}
          onClose={() => setReportTarget(null)}
          onSaved={(message) => {
            setFlash(message);
            reload();
          }}
        />
      )}

      {reopenTarget && (
        <ReopenVisitDialog
          request={reopenTarget}
          onClose={() => setReopenTarget(null)}
          onSaved={(message) => {
            setFlash(message);
            reload();
          }}
        />
      )}
    </section>
  );
}
