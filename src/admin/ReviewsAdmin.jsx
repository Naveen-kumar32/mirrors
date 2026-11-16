import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api, formatDate, invalidateReviewSummary, useApi } from '../backend';
import Pagination from '../components/Pagination';
import { Icon } from '../components/ui';
import { RefreshButton, useAuth } from './AdminApp';
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
  const [f, setF] = useState({ name: '', text: '', rating: 5, source: 'google', permission: true });
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
          <div className="bf__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn--navy" disabled={busy}>
              {busy ? 'Saving…' : 'Add & feature'}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body
  );
}

// Tabs: new reviews wait in "Waiting for approval" → approve for the reviews page → choose which go on the home page
const VIEWS = [
  { value: 'pending', label: 'Waiting for approval' },
  { value: 'published', label: 'On reviews page' },
  { value: 'home', label: 'On home page' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'all', label: 'All' },
];

const STATUS_BADGE = {
  pending: { cls: 'pending', label: 'Waiting for approval' },
  published: { cls: 'published', label: 'On reviews page' },
  hidden: { cls: 'hidden', label: 'Hidden' },
};

/* The clinic's public reply under a review: write, change or remove it */
function ReplyBox({ review, onSave, onCancel }) {
  const [text, setText] = useState(review.reply || '');
  const [busy, setBusy] = useState(false);
  const save = async (value) => {
    setBusy(true);
    const ok = await onSave(value);
    if (!ok) setBusy(false);
  };
  return (
    <div className="areply">
      <label className="bf__field">
        <span className="bf__label">Reply from The Mirrors (shown publicly under the review)</span>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          placeholder={`e.g. Thank you, ${review.name.split(' ')[0]}! We're so glad the treatment helped. See you at your next visit.`}
          autoFocus
        />
      </label>
      <div className="areply__actions">
        <button className="abtn abtn--primary" disabled={busy || !text.trim()} onClick={() => save(text.trim())}>
          {busy ? 'Saving…' : review.reply ? 'Update reply' : 'Post reply'}
        </button>
        {review.reply && (
          <button className="abtn abtn--danger" disabled={busy} onClick={() => save('')}>
            Remove reply
          </button>
        )}
        <button className="abtn" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* Admin only: every review with the private phone number and email */
export default function ReviewsAdmin() {
  const { onAuthError } = useAuth();
  const [view, setView] = useState('pending');
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [replying, setReplying] = useState(null);
  const [flash, setFlash] = useState('');
  const { data, error, loading, refreshing, reload } = useApi(`/admin/reviews?filter=${view}&page=${page}`);
  const counts = data?.counts || {};

  useEffect(() => {
    if (error) onAuthError(error);
  }, [error, onAuthError]);

  const act = async (fn, message) => {
    try {
      await fn();
      invalidateReviewSummary();
      if (message) setFlash(message);
      reload();
      return true;
    } catch (err) {
      onAuthError(err);
      window.alert(err.message);
      return false;
    }
  };

  const patch = (r, body, message) => act(() => api(`/admin/reviews/${r.id}`, { method: 'PATCH', body }), message);
  // 1st approval: the reviews page
  const approve = (r) => patch(r, { status: 'published' }, `${r.name}’s review is now on the reviews page.`);
  const hide = (r) =>
    patch(
      r,
      { status: 'hidden' },
      r.status === 'pending' ? `${r.name}’s review was not approved and stays hidden.` : `${r.name}’s review is hidden from the website.`
    );
  // 2nd approval: the home page (only for reviews already on the reviews page)
  const feature = (r) =>
    patch(
      r,
      { featured: !r.featured },
      r.featured ? `${r.name}’s review is no longer on the home page.` : `${r.name}’s review now shows on the home page.`
    );
  const saveReply = async (r, reply) => {
    const ok = await patch(r, { reply }, reply ? `Reply posted under ${r.name}’s review.` : `Reply removed from ${r.name}’s review.`);
    if (ok) setReplying(null);
    return ok;
  };

  const remove = (r) =>
    window.confirm(`Delete the review from ${r.name}? This cannot be undone.`) &&
    act(() => api(`/admin/reviews/${r.id}`, { method: 'DELETE' }), 'Review deleted.');

  const changeView = (v) => {
    setView(v);
    setPage(1);
    setReplying(null);
  };

  const empty = {
    pending: 'No reviews waiting — you’re all caught up.',
    published: 'No reviews on the reviews page yet.',
    home: 'No reviews on the home page yet. Open “On reviews page” and choose “Show on home page”.',
    hidden: 'No hidden reviews.',
    all: 'No reviews yet.',
  }[view];

  return (
    <section className="apage">
      <div className="apage__topbar no-print">
        <RefreshButton onRefresh={reload} refreshing={refreshing} />
      </div>
      <header className="apage__head">
        <div>
          <h1>Reviews</h1>
          <p>
            New reviews from the website wait for your approval. <strong>Approve</strong> puts a review on the
            reviews page. Once approved, <strong>Show on home page</strong> adds it to the home page too, and you can
            take it off again at any time. <strong>Reply</strong> posts the clinic’s answer under the review. Phone
            numbers and emails are only visible here.
          </p>
        </div>
        <div className="apage__actions">
          <button className="btn btn--navy" onClick={() => setAdding(true)}>
            <Icon name="plus" size={18} /> Add testimonial
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
              onClick={() => changeView(v.value)}
            >
              {v.label}
              {counts[v.value] > 0 && (
                <span className={`acount ${v.value === 'pending' ? 'acount--alert' : ''}`}>{counts[v.value]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading && !data && <p className="state">Loading…</p>}
      {error && <p className="bf__fail">{error.message}</p>}
      {data && !data.total && <p className="state">{empty}</p>}

      <ul className="alist">
        {data?.items.map((r) => {
          const badge = STATUS_BADGE[r.status] || STATUS_BADGE.published;
          return (
            <li key={r.id} className={`alist__row areview ${r.status === 'hidden' ? 'is-hidden' : ''} ${r.status === 'pending' ? 'is-pending' : ''}`}>
              <div className="alist__main">
                <strong>
                  {r.name} <span className="rcard__stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </strong>
                <p className="areview__text">{r.text}</p>
                <span>
                  <span className={`badge badge--${badge.cls}`}>{badge.label}</span>
                  {r.status === 'published' && !!r.featured && <span className="badge badge--featured">★ On home page</span>}
                  <span className="badge badge--draft">{SOURCE_LABEL[r.source] || 'Website'}</span>
                  {r.phone && <a href={`tel:${r.phone.replace(/[^\d+]/g, '')}`}>{r.phone}</a>}
                  {r.email && <a href={`mailto:${r.email}`}>{r.email}</a>}
                  {!!r.permission && <span>· Permission confirmed</span>}
                  <span>· {formatDate(r.createdAt)}</span>
                </span>
                {r.reply && replying !== r.id && (
                  <div className="areply__current">
                    <strong>Your reply{r.replyAt ? ` · ${formatDate(r.replyAt)}` : ''}</strong>
                    <p>{r.reply}</p>
                  </div>
                )}
                {replying === r.id && <ReplyBox review={r} onSave={(text) => saveReply(r, text)} onCancel={() => setReplying(null)} />}
              </div>
              <div className="alist__actions">
                {r.status === 'pending' && (
                  <>
                    <button className="abtn abtn--primary" onClick={() => approve(r)}>
                      Approve
                    </button>
                    <button className="abtn" onClick={() => hide(r)}>
                      Don’t approve
                    </button>
                  </>
                )}
                {r.status === 'published' && (
                  <>
                    <button className={`abtn ${r.featured ? '' : 'abtn--primary'}`} onClick={() => feature(r)}>
                      {r.featured ? 'Hide from home page' : 'Show on home page'}
                    </button>
                    <button className="abtn" onClick={() => hide(r)}>
                      Hide from website
                    </button>
                  </>
                )}
                {r.status === 'hidden' && (
                  <button className="abtn" onClick={() => approve(r)}>
                    Show on reviews page
                  </button>
                )}
                {replying !== r.id && (
                  <button className="abtn" onClick={() => setReplying(r.id)}>
                    {r.reply ? 'Edit reply' : 'Reply'}
                  </button>
                )}
                <button className="abtn abtn--danger" onClick={() => remove(r)}>
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {data && <Pagination page={data.page} pages={data.pages} onChange={(p) => (setPage(p), window.scrollTo({ top: 0 }))} />}

      {adding && (
        <TestimonialDialog
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            setFlash('Testimonial added and shown on the reviews page and home page.');
            invalidateReviewSummary();
            reload();
          }}
        />
      )}
    </section>
  );
}
