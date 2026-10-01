import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IMG } from '../data';
import { api, formatDate, invalidateReviewSummary, useApi } from '../backend';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import CTA from '../components/CTA';
import { Eyebrow, Icon, useReveal } from '../components/ui';

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
const EMPTY = { name: '', phone: '', email: '', rating: 0, text: '', website: '' };

function validate(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Please enter your name.';
  if (!(f.phone.replace(/\D/g, '').length >= 7 && /^[+()\d\s.-]+$/.test(f.phone.trim()))) e.phone = 'Please enter a valid phone number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Please enter a valid email address.';
  if (!f.rating) e.rating = 'Please choose a star rating.';
  if (f.text.trim().length < 10) e.text = 'Please write a little more (at least 10 characters).';
  return e;
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="starpick" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={n <= shown ? 'is-on' : ''}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
      <span className="starpick__word">{RATING_WORDS[shown]}</span>
    </div>
  );
}

function ReviewForm({ onPosted }) {
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | done
  const [serverError, setServerError] = useState('');

  const set = (k) => (e) => {
    const v = typeof e === 'object' ? e.target.value : e;
    setF((x) => ({ ...x, [k]: v }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    setServerError('');
    if (Object.keys(errs).length) return;
    setStatus('sending');
    try {
      await api('/reviews', { method: 'POST', body: f });
      setStatus('done');
      setF(EMPTY);
      onPosted();
    } catch (err) {
      setServerError(err.message);
      setStatus('idle');
    }
  };

  if (status === 'done')
    return (
      <div className="rform rform--done reveal is-visible">
        <span className="cc__check">
          <Icon name="check" size={22} />
        </span>
        <h3>Thank you for your review!</h3>
        <p>Your review is now live below.</p>
        <button className="btn btn--ghost" onClick={() => setStatus('idle')}>
          Write another review
        </button>
      </div>
    );

  return (
    <form className="rform reveal" onSubmit={submit} noValidate>
      <h3>Share your experience</h3>
      <p className="rform__note">
        Only your <strong>name</strong> and <strong>review</strong> are shown on the website. Your phone number and email
        stay private with the clinic.
      </p>

      <div className={`bf__field ${errors.rating ? 'has-error' : ''}`}>
        <span className="bf__label">Your rating</span>
        <StarPicker value={f.rating} onChange={set('rating')} />
        {errors.rating && <span className="bf__error">{errors.rating}</span>}
      </div>

      <label className={`bf__field ${errors.name ? 'has-error' : ''}`}>
        <span className="bf__label">Name</span>
        <input value={f.name} onChange={set('name')} autoComplete="name" maxLength={60} />
        {errors.name && <span className="bf__error">{errors.name}</span>}
      </label>
      <div className="bf__row">
        <label className={`bf__field ${errors.phone ? 'has-error' : ''}`}>
          <span className="bf__label">Phone number</span>
          <input type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" maxLength={25} />
          {errors.phone && <span className="bf__error">{errors.phone}</span>}
        </label>
        <label className={`bf__field ${errors.email ? 'has-error' : ''}`}>
          <span className="bf__label">Email</span>
          <input type="email" value={f.email} onChange={set('email')} autoComplete="email" maxLength={120} />
          {errors.email && <span className="bf__error">{errors.email}</span>}
        </label>
      </div>
      <label className={`bf__field ${errors.text ? 'has-error' : ''}`}>
        <span className="bf__label">Your review</span>
        <textarea
          rows={5}
          value={f.text}
          onChange={set('text')}
          maxLength={1500}
          placeholder="How was your visit and treatment?"
        />
        {errors.text && <span className="bf__error">{errors.text}</span>}
      </label>

      {/* Hidden from people; bots that fill it in are ignored */}
      <input className="hp" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} aria-hidden="true" />

      {serverError && <p className="bf__fail">{serverError}</p>}
      <button type="submit" className="btn btn--navy" disabled={status === 'sending'}>
        {status === 'sending' ? 'Posting…' : 'Post review'} <Icon name="arrow" size={18} />
      </button>
    </form>
  );
}

export default function PatientReviewsPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  const { data, error, loading, reload } = useApi(`/reviews?page=${page}`);
  const listTop = useRef(null);
  useReveal(data ? `reviews-${data.page}-${data.total}` : null);

  const goTo = (p) => {
    setParams(p === 1 ? {} : { page: String(p) });
    listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onPosted = () => {
    invalidateReviewSummary();
    if (page === 1) reload();
    else goTo(1);
  };

  return (
    <Page title="Patient reviews">
      <PageHeader
        eyebrow="Patient reviews"
        title="What our patients say"
        text="Honest words from people we have cared for. Visited us? We’d love to hear from you."
        image={IMG.faceSmile}
        image2={IMG.consult}
      />

      <section className="section">
        <div className="container rtop">
          <div className="rsum">
            <div className="rsum__score reveal">
              <strong>{data?.total ? data.average.toFixed(1) : '–'}</strong>
              <span className="stars" aria-hidden="true">★★★★★</span>
              <p>
                {data?.total
                  ? `Based on ${data.total} patient ${data.total === 1 ? 'review' : 'reviews'}`
                  : 'No reviews yet — be the first!'}
              </p>
            </div>
            <ul className="rsum__bars reveal" aria-label="Rating breakdown">
              {(data?.breakdown || [5, 4, 3, 2, 1].map((s) => ({ stars: s, pct: 0 }))).map((b) => (
                <li key={b.stars}>
                  <span>{b.stars} ★</span>
                  <span className="rsum__bar">
                    <span style={{ width: `${b.pct}%` }} />
                  </span>
                  <span>{b.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
          <ReviewForm onPosted={onPosted} />
        </div>
      </section>

      <section className="section section--sand" ref={listTop} style={{ scrollMarginTop: 'var(--header-h)' }}>
        <div className="container">
          <header className="section__head">
            <Eyebrow>Patient stories</Eyebrow>
            <h2 className="title reveal">
              Real <em>experiences</em>
            </h2>
          </header>

          {loading && !data && <p className="state">Loading reviews…</p>}
          {error && (
            <div className="state">
              <p>{error.message}</p>
              <button className="btn btn--ghost" onClick={reload}>
                Try again
              </button>
            </div>
          )}
          {data && !data.total && <p className="state">No reviews yet. Be the first to share your experience above.</p>}

          {data?.items.length > 0 && (
            <>
              <div className={`rgrid ${loading ? 'is-loading' : ''}`} key={data.page}>
                {data.items.map((r, i) => (
                  <figure key={r.id} className="rcard reveal" style={{ '--d': `${(i % 3) * 100}ms` }}>
                    <span className="rcard__stars" aria-label={`${r.rating} out of 5 stars`}>
                      {stars(r.rating)}
                    </span>
                    <blockquote>“{r.text}”</blockquote>
                    <figcaption>
                      <span className="rcard__avatar" aria-hidden="true">
                        {r.name.trim()[0]?.toUpperCase()}
                      </span>
                      <span>
                        <strong>{r.name}</strong>
                        {formatDate(r.createdAt)}
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <Pagination page={data.page} pages={data.pages} onChange={goTo} />
              <p className="pager__info">
                Showing {(data.page - 1) * data.perPage + 1}–{(data.page - 1) * data.perPage + data.items.length} of{' '}
                {data.total} reviews
              </p>
            </>
          )}
        </div>
      </section>

      <CTA title="Ready to start your own story?" />
    </Page>
  );
}
