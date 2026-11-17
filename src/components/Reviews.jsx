import { useEffect, useRef, useState } from 'react';
import { useApi, useGoogle, useReviewSummary } from '../backend';
import { Eyebrow } from './ui';
import { ReviewModal, ReviewPhotos, ReviewReply } from './ReviewCard';

const SOURCE = { google: 'Google review', whatsapp: 'via WhatsApp', 'in-person': 'shared in clinic', website: 'website review' };
const AVATAR_COLOURS = ['#d93025', '#188038', '#1a73e8', '#e37400', '#9334e6', '#12828c', '#c5221f'];

const avatarColour = (name = '') => AVATAR_COLOURS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_COLOURS.length];

/* "3 months ago", the way Google shows review dates */
export function timeAgo(iso) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
  if (days < 1) return 'today';
  if (days < 7) return days === 1 ? 'a day ago' : `${days} days ago`;
  if (days < 30) return days < 14 ? 'a week ago' : `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return days < 60 ? 'a month ago' : `${Math.floor(days / 30)} months ago`;
  return days < 730 ? 'a year ago' : `${Math.floor(days / 365)} years ago`;
}

/* Google's multicolour "G" */
export function GoogleG({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
      <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export function GStars({ value = 5, size = 18 }) {
  return (
    <span className="gstars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill={n <= Math.round(value) ? '#fbbc04' : '#dadce0'}
            d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
          />
        </svg>
      ))}
    </span>
  );
}

export const Verified = () => (
  <svg className="gverified" width="16" height="16" viewBox="0 0 24 24" aria-label="Verified">
    <path fill="#1a73e8" d="M12 1l2.6 2.2 3.4-.4.9 3.3 3 1.7-1.3 3.2 1.3 3.2-3 1.7-.9 3.3-3.4-.4L12 23l-2.6-2.2-3.4.4-.9-3.3-3-1.7L3.4 13 2.1 9.8l3-1.7.9-3.3 3.4.4z" />
    <path fill="#fff" d="M10.6 15.6l-3.2-3.2 1.4-1.4 1.8 1.8 4.6-4.6 1.4 1.4z" />
  </svg>
);

/*
 * One review in the style of a Google review card — used on the home page and the reviews page.
 * `sub` replaces the line under the name, `photo` is a reviewer photo (live Google reviews),
 * `nameNode` can make the name a link, `google` shows the Google "G".
 */
export function GReviewCard({ review: r, onOpen, sub, photo, nameNode, google = r.source === 'google' }) {
  return (
    <article className="gcard">
      <header className="gcard__head">
        {photo ? (
          <img className="gcard__avatar" src={photo} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="gcard__avatar" style={{ background: avatarColour(r.name) }} aria-hidden="true">
            {r.name.trim().charAt(0).toUpperCase()}
          </span>
        )}
        <span className="gcard__who">
          <strong>{nameNode || r.name}</strong>
          <small>{sub || (r.source === 'google' ? timeAgo(r.createdAt) : SOURCE[r.source] || 'Patient review')}</small>
        </span>
        {google && (
          <span className="gcard__g">
            <GoogleG size={22} />
          </span>
        )}
      </header>
      <p className="gcard__stars">
        <GStars value={r.rating} size={18} />
        <Verified />
      </p>
      {r.text && <p className="gcard__text">{r.text}</p>}
      <ReviewPhotos photos={r.photos} name={r.name} onOpen={onOpen} />
      <ReviewReply reply={r.reply} className="rreply--short" />
      {(r.text?.length > 170 || r.reply?.length > 120) && (
        <button type="button" className="gcard__more" onClick={onOpen}>
          Read more
        </button>
      )}
    </article>
  );
}

/*
 * Patient reviews in the style of Google's review widget: a rating summary on the left and
 * review cards on the right. Shows the testimonials staff feature in Admin → Reviews.
 */
export default function Reviews() {
  const { data } = useApi('/reviews/featured');
  const summary = useReviewSummary();
  const google = useGoogle();
  const rowRef = useRef(null);
  const [open, setOpen] = useState(null); // review shown in full
  const [paused, setPaused] = useState(false); // mouse over / keyboard focus inside the carousel
  const quotes = data || [];

  // Endless loop: the cards are followed by a copy of themselves. Moving forward past the last review
  // slides straight on to the first one again (its copy); once the slide has settled, the row quietly
  // jumps back to the real first card — the same picture — so it never runs out and never rewinds.
  const loop = quotes.length > 1;
  const step = () => {
    const card = rowRef.current?.querySelector('.gcard');
    return (card?.offsetWidth || 300) + 18;
  };
  const setWidth = () => quotes.length * step();
  const jump = (left) => {
    const row = rowRef.current;
    row.style.scrollSnapType = 'none'; // move instantly, without snapping or animating
    row.scrollTo({ left, behavior: 'instant' });
    requestAnimationFrame(() => (row.style.scrollSnapType = ''));
  };
  const settle = useRef(0);
  const onRowScroll = () => {
    if (!loop) return;
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const row = rowRef.current;
      if (row && row.scrollLeft >= setWidth() - 4) jump(row.scrollLeft - setWidth());
    }, 150);
  };

  // slide forward on its own every few seconds. Waits while the visitor is pointing at / tabbing through
  // the cards, reading one in full, or has the tab in the background — and never runs for people who
  // prefer reduced motion.
  useEffect(() => {
    if (!loop || paused || open) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      rowRef.current?.scrollBy({ left: step(), behavior: 'smooth' });
    }, 4500);
    return () => clearInterval(id);
  }, [loop, paused, open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!quotes.length) return null;

  const rating = google.has ? google.rating : summary?.average || 5;
  const label = rating >= 4.5 ? 'Excellent' : rating >= 4 ? 'Very good' : 'Good';

  const scroll = (dir) => {
    const row = rowRef.current;
    if (!row) return;
    // going back from the first review: hop to its copy first, so the last review slides in from the left
    if (dir < 0 && loop && row.scrollLeft < 4) jump(setWidth());
    requestAnimationFrame(() => row.scrollBy({ left: dir * step(), behavior: 'smooth' }));
  };

  return (
    <section className="section greviews">
      <div className="container">
        <header className="section__head greviews__head">
          <Eyebrow>Patient stories</Eyebrow>
          <h2 className="title reveal">
            Kind words from our <em>Patients</em>
          </h2>
        </header>

        <div className="greviews__layout">
          {/* summary, like Google's rating badge */}
          <aside className="gsummary reveal">
            <p className="gsummary__label">{label}</p>
            <GStars value={rating} size={26} />
            <p className="gsummary__count">
              <a href={google.url} target="_blank" rel="noreferrer">
                Read our Google reviews
              </a>
            </p>
            <p className="gsummary__google" aria-label="Google">
              <span style={{ color: '#4285F4' }}>G</span>
              <span style={{ color: '#EA4335' }}>o</span>
              <span style={{ color: '#FBBC05' }}>o</span>
              <span style={{ color: '#4285F4' }}>g</span>
              <span style={{ color: '#34A853' }}>l</span>
              <span style={{ color: '#EA4335' }}>e</span>
            </p>
            <a className="gsummary__btn" href={google.reviewUrl} target="_blank" rel="noreferrer">
              Review us on Google
            </a>
          </aside>

          {/* review cards */}
          <div
            className="greviews__carousel"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
          >
            {quotes.length > 1 && (
              <button type="button" className="greviews__arrow greviews__arrow--prev" onClick={() => scroll(-1)} aria-label="Previous reviews">
                ‹
              </button>
            )}
            <div className="greviews__row" ref={rowRef} onScroll={onRowScroll}>
              {quotes.map((r) => (
                <GReviewCard key={r.id} review={r} onOpen={() => setOpen(r)} />
              ))}
              {/* the copy that makes the loop endless — hidden from screen readers and the keyboard */}
              {loop && (
                <div className="greviews__copies" aria-hidden="true" inert>
                  {quotes.map((r) => (
                    <GReviewCard key={`copy-${r.id}`} review={r} onOpen={() => setOpen(r)} />
                  ))}
                </div>
              )}
            </div>
            {quotes.length > 1 && (
              <button type="button" className="greviews__arrow greviews__arrow--next" onClick={() => scroll(1)} aria-label="More reviews">
                ›
              </button>
            )}
          </div>
        </div>

        {open && <ReviewModal review={{ ...open, meta: SOURCE[open.source] || 'patient review' }} onClose={() => setOpen(null)} />}
      </div>
    </section>
  );
}
