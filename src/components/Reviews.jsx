import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi, useReviewSummary } from '../backend';
import { Stars } from './ui';

/* The latest good patient reviews, one at a time, cross-fading every few seconds */
export default function Reviews() {
  const { data } = useApi('/reviews');
  const summary = useReviewSummary();
  const quotes = (data?.items || []).filter((r) => r.rating >= 4).slice(0, 5);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (quotes.length < 2) return;
    const id = setTimeout(() => setI((n) => (n + 1) % quotes.length), 6000);
    return () => clearTimeout(id);
  }, [i, quotes.length]);

  if (!quotes.length) return null;

  return (
    <section className="section reviews">
      <div className="container reviews__inner">
        <Stars />
        <div className="reviews__stage">
          {quotes.map((t, k) => (
            <figure key={t.id} className={`review ${k === i ? 'is-active' : ''}`} aria-hidden={k !== i}>
              <blockquote>“{t.text}”</blockquote>
              <figcaption>{t.name}</figcaption>
            </figure>
          ))}
        </div>
        {quotes.length > 1 && (
          <div className="reviews__dots" role="tablist" aria-label="Choose a review">
            {quotes.map((t, k) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={k === i}
                aria-label={`Review from ${t.name}`}
                className={k === i ? 'is-active' : ''}
                onClick={() => setI(k)}
              />
            ))}
          </div>
        )}
        <p className="reviews__score">
          {summary?.total > 0 && (
            <>
              Rated <strong>{summary.average.toFixed(1)} / 5</strong> by our patients ·{' '}
            </>
          )}
          <Link to="/reviews">Read all reviews</Link>
        </p>
      </div>
    </section>
  );
}
