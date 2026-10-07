import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi, useGoogle, useReviewSummary } from '../backend';
import { Stars } from './ui';
import { ReviewModal } from './ReviewCard';

const SOURCE = { google: 'Google review', whatsapp: 'via WhatsApp', 'in-person': 'shared in clinic', website: 'website review' };

/* Testimonials chosen by staff (Admin → Reviews → Feature), one at a time, cross-fading */
export default function Reviews() {
  const { data } = useApi('/reviews/featured');
  const summary = useReviewSummary();
  const google = useGoogle();
  const quotes = data || [];
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(null); // review shown in full

  useEffect(() => {
    if (quotes.length < 2 || open) return; // don't move on while someone is reading
    const id = setTimeout(() => setI((n) => (n + 1) % quotes.length), 6000);
    return () => clearTimeout(id);
  }, [i, quotes.length, open]);

  if (!quotes.length) return null;

  return (
    <section className="section reviews">
      <div className="container reviews__inner">
        <Stars />
        <div className="reviews__stage">
          {quotes.map((t, k) => (
            <figure key={t.id} className={`review ${k === i ? 'is-active' : ''}`} aria-hidden={k !== i}>
              <blockquote className="review__text">“{t.text}”</blockquote>
              {t.text.length > 220 && (
                <button className="review__more" tabIndex={k === i ? 0 : -1} onClick={() => setOpen(t)}>
                  Read the full review
                </button>
              )}
              <figcaption>
                {t.name} <span>· {SOURCE[t.source] || 'patient review'}</span>
              </figcaption>
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
        {open && (
          <ReviewModal review={{ ...open, meta: SOURCE[open.source] || 'patient review' }} onClose={() => setOpen(null)} />
        )}
        <p className="reviews__score">
          {google.has ? (
            <>
              <strong>{google.rating.toFixed(1)} / 5</strong> on Google from {google.count} reviews ·{' '}
            </>
          ) : (
            summary?.total > 0 && (
              <>
                Rated <strong>{summary.average.toFixed(1)} / 5</strong> by our patients ·{' '}
              </>
            )
          )}
          <Link to="/reviews">Read all reviews</Link>
        </p>
      </div>
    </section>
  );
}
