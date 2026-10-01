import { useEffect, useState } from 'react';
import { api, formatDate, invalidateReviewSummary, useApi } from '../backend';
import Pagination from '../components/Pagination';
import { useAuth } from './AdminApp';

/* Admin only: every review with the private phone number and email */
export default function ReviewsAdmin() {
  const { onAuthError } = useAuth();
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi(`/admin/reviews?page=${page}`);

  useEffect(() => {
    if (error) onAuthError(error);
  }, [error, onAuthError]);

  const act = async (fn) => {
    try {
      await fn();
      invalidateReviewSummary();
      reload();
    } catch (err) {
      onAuthError(err);
      window.alert(err.message);
    }
  };

  const toggle = (r) =>
    act(() =>
      api(`/admin/reviews/${r.id}`, { method: 'PATCH', body: { status: r.status === 'published' ? 'hidden' : 'published' } })
    );

  const remove = (r) =>
    window.confirm(`Delete the review from ${r.name}? This cannot be undone.`) &&
    act(() => api(`/admin/reviews/${r.id}`, { method: 'DELETE' }));

  return (
    <section className="apage">
      <header className="apage__head">
        <div>
          <h1>Reviews</h1>
          <p>
            New reviews go live on the website immediately. <strong>Hide</strong> one to take it off the website without
            deleting it. Phone numbers and emails are only visible here.
          </p>
        </div>
      </header>

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
                <a href={`tel:${r.phone.replace(/[^\d+]/g, '')}`}>{r.phone}</a> ·{' '}
                <a href={`mailto:${r.email}`}>{r.email}</a> · {formatDate(r.createdAt)}
              </span>
            </div>
            <div className="alist__actions">
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
    </section>
  );
}
