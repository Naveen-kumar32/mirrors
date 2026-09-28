import { useEffect, useState } from 'react';
import { TESTIMONIALS } from '../data';
import { Stars } from './ui';

/* One patient quote at a time, cross-fading every few seconds */
export default function Reviews() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setI((n) => (n + 1) % TESTIMONIALS.length), 6000);
    return () => clearTimeout(id);
  }, [i]);

  return (
    <section className="section reviews">
      <div className="container reviews__inner">
        <Stars />
        <div className="reviews__stage">
          {TESTIMONIALS.map((t, k) => (
            <figure key={t.name} className={`review ${k === i ? 'is-active' : ''}`} aria-hidden={k !== i}>
              <blockquote>“{t.quote}”</blockquote>
              <figcaption>
                {t.name} <span>· {t.detail}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="reviews__dots" role="tablist" aria-label="Choose a review">
          {TESTIMONIALS.map((t, k) => (
            <button
              key={t.name}
              role="tab"
              aria-selected={k === i}
              aria-label={`Review from ${t.name}`}
              className={k === i ? 'is-active' : ''}
              onClick={() => setI(k)}
            />
          ))}
        </div>
        <p className="reviews__score">
          Rated <strong>4.9 / 5</strong> by our patients
        </p>
      </div>
    </section>
  );
}
