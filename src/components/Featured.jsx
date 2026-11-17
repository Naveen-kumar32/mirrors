import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FEATURED_TREATMENTS, WHY_US, img } from '../data';
import { Eyebrow, Icon } from './ui';

/* Home: "Why choose this clinic?" — one statement, not a list */
export function WhyChoose() {
  return (
    <section className="section section--sand">
      <div className="container why">
        <div className="why__head">
          <Eyebrow>Why choose this clinic?</Eyebrow>
          <h2 className="title reveal">
            Honest care, <span style={{ whiteSpace: 'nowrap' }}>backed by <em>Science</em></span>
          </h2>
        </div>
        <div className="why__body">
          <p className="why__statement reveal">{WHY_US}</p>
          <Link to="/about#doctor" className="text-link reveal">
            Meet the dermatologist <Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* Home: the clinic's featured treatments */
/*
 * Home page treatments: the section pins while you scroll, and the vertical scroll slides the
 * cards sideways (with a progress bar and a slowly drifting glow behind them).
 * People who turn animations off get a plain swipeable row instead.
 */
export function FeaturedTreatments() {
  const section = useRef(null);
  const track = useRef(null);
  const bar = useRef(null);
  const glow = useRef(null);
  const [height, setHeight] = useState(null);
  const [still] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useLayoutEffect(() => {
    if (still) return;
    let dist = 0;
    let shown = 0; // spring-smoothed progress for the bar
    let frame;

    const measure = () => {
      dist = Math.max(0, track.current.scrollWidth - window.innerWidth);
      setHeight(window.innerHeight + dist);
    };
    const progress = () => {
      const r = section.current.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    };
    const tick = () => {
      const p = progress();
      track.current.style.transform = `translate3d(${-p * dist}px, 0, 0)`;
      glow.current.style.transform = `translate3d(${-p * 30}%, 0, 0)`;
      // cards grow towards the centre of the screen and turn slightly as they pass (depth),
      // while each photo drifts inside its card (parallax)
      const vw = window.innerWidth;
      track.current.querySelectorAll('.tcard').forEach((card) => {
        const r = card.getBoundingClientRect();
        const d = Math.max(-1, Math.min(1, (r.left + r.width / 2 - vw * 0.55) / vw));
        card.style.scale = (1 - Math.abs(d) * 0.16).toFixed(3);
        card.style.rotate = `y ${(-d * 18).toFixed(2)}deg`;
        const photo = card.querySelector('img');
        if (photo) photo.style.translate = `${(-d * 40).toFixed(1)}px 0`;
      });
      shown += (p - shown) * 0.18;
      bar.current.style.transform = `scaleX(${shown})`;
      if (Math.abs(p - shown) > 0.001) frame = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };

    measure();
    tick();
    const ro = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    ro.observe(track.current);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
    };
  }, [still]);

  return (
    <section className={`tjourney${still ? ' is-still' : ''}`} ref={section} style={height ? { height } : undefined}>
      <div className="tjourney__sticky">
        <div className="tjourney__glow" ref={glow} aria-hidden="true" />
        <div className="tjourney__track" ref={track}>
          <div className="tjourney__intro">
            <p className="eyebrow">Featured treatments</p>
            <h2 className="title">
              Care for <em>Skin, hair</em> &amp; nails
            </h2>
            <p className="tjourney__lead">Every treatment is planned after an individual assessment by our dermatologist.</p>
            {!still && (
              <p className="tjourney__hint">
                Keep scrolling <Icon name="arrow" size={18} />
              </p>
            )}
          </div>

          {FEATURED_TREATMENTS.map((t, i) => (
            <Link key={t.name} to={t.slug ? `/treatments/${t.slug}` : '/treatments'} className="tcard">
              <span className="tcard__img">
                <img src={img(t.image, 960)} alt="" loading="lazy" />
              </span>
              <span className="tcard__no">{String(i + 1).padStart(2, '0')}</span>
              <span className="tcard__body">
                <span className="tcard__title">{t.name}</span>
                <span className="tcard__text">{t.text}</span>
                <span className="tcard__link">
                  Learn more <Icon name="arrow" size={16} />
                </span>
              </span>
            </Link>
          ))}

          <div className="tjourney__end">
            <span>Healthy</span>
            <span className="tjourney__outline">skin,</span>
            <em>For life.</em>
            <Link to="/treatments" className="tjourney__more">
              All treatments <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>

        {!still && (
          <div className="tjourney__progress" aria-hidden="true">
            <span ref={bar} />
          </div>
        )}
      </div>
    </section>
  );
}
