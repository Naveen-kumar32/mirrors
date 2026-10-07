import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api, formatDate, invalidateReviewSummary, useApi } from '../backend';
import Pagination from '../components/Pagination';
import { Icon } from '../components/ui';
import { useAuth } from './AdminApp';
import { permissionMessage } from './messages';

const SOURCES = [
  { value: 'google', label: 'Google review' },
  { value: 'whatsapp', label: 'WhatsApp message' },
  { value: 'in-person', label: 'Said in clinic' },
  { value: 'website', label: 'Website' },
];
const SOURCE_LABEL = Object.fromEntries(SOURCES.map((s) => [s.value, s.label]));

/* Add an approved testimonial from Google, WhatsApp etc. — only with the patient's permission */
function TestimonialDialog({ onClose, onSaved }) {
  const { onAuthError } = useAuth();
  const [f, setF] = useState({ name: '', text: '', rating: 5, source: 'google', permission: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/admin/reviews', { method: 'POST', body: { ...f, rating: Number(f.rating) } });
      onSaved();
    } catch (err) {
      onAuthError(err);
      setError(err.message);
      setBusy(false);
    }
  };

  const ask = permissionMessage(f.name.trim() || 'there');

  return createPortal(
    <div className="bf-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="bf" role="dialog" aria-modal="true" aria-label="Add a testimonial" onSubmit={save}>
        <header className="bf__head">
          <div>
            <p className="bf__eyebrow">Shown on the home page</p>
            <h2>Add a testimonial</h2>
          </div>
          <button type="button" className="bf__close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </header>
        <div className="bf__form">
          <div className="bf__promise">
            <Icon name="chat" size={18} />
            <span>
              <strong>Ask first.</strong> Send the patient this message and add the testimonial once they agree:
              <em className="aask">“{ask}”</em>
              <button
                type="button"
                className="aback aask__copy"
                onClick={() => navigator.clipboard?.writeText(ask).then(() => setCopied(true), () => {})}
              >
                {copied ? 'Copied' : 'Copy message'}
              </button>
            </span>
          </div>
          {error && <p className="bf__fail">{error}</p>}
          <div className="bf__row">
            <label className="bf__field">
              <span className="bf__label">Name to show</span>
              <input value={f.name} onChange={set('name')} placeholder="e.g. Priya S." required />
            </label>
            <label className="bf__field">
              <span className="bf__label">Where is it from?</span>
              <select value={f.source} onChange={set('source')}>
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="bf__field">
            <span className="bf__label">Testimonial (exactly as approved)</span>
            <textarea rows={4} value={f.text} onChange={set('text')} maxLength={1500} required />
          </label>
          <label className="bf__field">
            <span className="bf__label">Stars</span>
            <select value={f.rating} onChange={set('rating')}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {'★'.repeat(n)} ({n})
                </option>
              ))}
            </select>
          </label>
          <label className="acheck">
            <input type="checkbox" checked={f.permission} onChange={set('permission')} />
            The patient has given permission to show this testimonial with this name on the website.
          </label>
          <div className="bf__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn--navy" disabled={busy || !f.permission}>
              {busy ? 'Saving…' : 'Add & feature'}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body
  );
}

/* Admin only: every review with the private phone number and email */
export default function ReviewsAdmin() {
  const { onAuthError } = useAuth();
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [flash, setFlash] = useState('');
  const { data, error, loading, reload } = useApi(`/admin/reviews?page=${page}`);

  useEffect(() => {
    if (error) onAuthError(error);
  }, [error, onAuthError]);

  const act = async (fn, message) => {
    try {
      await fn();
      invalidateReviewSummary();
      if (message) setFlash(message);
      reload();
    } catch (err) {
      onAuthError(err);
      window.alert(err.message);
    }
  };

  const patch = (r, body, message) => act(() => api(`/admin/reviews/${r.id}`, { method: 'PATCH', body }), message);
  const toggle = (r) => patch(r, { status: r.status === 'published' ? 'hidden' : 'published' });
  const feature = (r) =>
    patch(
      r,
      { featured: !r.featured },
      r.featured ? `${r.name}’s review is no longer on the home page.` : `${r.name}’s review now shows on the home page.`
    );

  const remove = (r) =>
    window.confirm(`Delete the review from ${r.name}? This cannot be undone.`) &&
    act(() => api(`/admin/reviews/${r.id}`, { method: 'DELETE' }), 'Review deleted.');

  return (
    <section className="apage">
      <header className="apage__head">
        <div>
          <h1>Reviews</h1>
          <p>
            New reviews go live on the website immediately. <strong>Feature</strong> the best ones to show them as
            testimonials on the home page. <strong>Hide</strong> takes a review off the website. Phone numbers and
            emails are only visible here.
          </p>
        </div>
        <button className="btn btn--navy" onClick={() => setAdding(true)}>
          <Icon name="plus" size={18} /> Add testimonial
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
      {loading && !data && <p className="state">Loading…</p>}
      {error && <p className="bf__fail">{error.message}</p>}
      {data && !data.total && <p className="state">No reviews yet.</p>}

      <ul className="alist">
        {data?.items.map((r) => (
          <li key={r.id} className={`alist__row areview ${r.status === 'hidden' ? 'is-hidden' : ''}`}>
            <div className="alist__main">
              <strong>
                {r.name} <span className="rcard__stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              </strong>
              <p className="areview__text">{r.text}</p>
              <span>
                <span className={`badge badge--${r.status}`}>{r.status === 'hidden' ? 'Hidden' : 'Live'}</span>
                {!!r.featured && <span className="badge badge--featured">★ On home page</span>}
                <span className="badge badge--draft">{SOURCE_LABEL[r.source] || 'Website'}</span>
                {r.phone && (
                  <a href={`tel:${r.phone.replace(/[^\d+]/g, '')}`}>{r.phone}</a>
                )}
                {r.email && <a href={`mailto:${r.email}`}>{r.email}</a>}
                {!!r.permission && <span>· Permission confirmed</span>}
                <span>· {formatDate(r.createdAt)}</span>
              </span>
            </div>
            <div className="alist__actions">
              <button className={`abtn ${r.featured ? '' : 'abtn--primary'}`} onClick={() => feature(r)} disabled={r.status === 'hidden'}>
                {r.featured ? 'Remove from home' : 'Feature on home'}
              </button>
              <button className="abtn" onClick={() => toggle(r)}>
                {r.status === 'published' ? 'Hide' : 'Show'}
              </button>
              <button className="abtn abtn--danger" onClick={() => remove(r)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {data && <Pagination page={data.page} pages={data.pages} onChange={(p) => (setPage(p), window.scrollTo({ top: 0 }))} />}

      {adding && (
        <TestimonialDialog
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            setFlash('Testimonial added and featured on the home page.');
            invalidateReviewSummary();
            reload();
          }}
        />
      )}
    </section>
  );
}
