import { useEffect, useRef, useState } from 'react';
import { CLINIC_STATS, DOCTOR, SERVICES } from '../data';
import { useGoogle } from '../backend';
import { Eyebrow } from './ui';

/* Counts from 0 up to `to` once the number scrolls into view (decimals kept, e.g. 4.9) */
function CountUp({ to, decimals = 0, run }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setValue(to);
    const start = performance.now();
    const ms = 1400;
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / ms);
      setValue(to * (1 - Math.pow(1 - t, 3))); // ease-out
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, to]);
  return decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-IN');
}

/*
 * The clinic in numbers — years of experience, Google rating and review count (live from Google
 * when connected, otherwise GOOGLE in src/data/site.js) and the number of treatments offered.
 */
export default function ClinicStats() {
  const google = useGoogle();
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const years = parseInt(DOCTOR.years, 10) || 0;
  const stats = [
    { to: years, suffix: '+', label: 'Years of experience', show: years > 0 },
    { to: google.rating || 0, decimals: 1, suffix: '+', label: 'Google review rating', show: google.has },
    CLINIC_STATS.treatmentsDone > 0
      ? { to: CLINIC_STATS.treatmentsDone, suffix: '+', label: 'Treatments done', show: true }
      : { to: SERVICES.length, suffix: '+', label: 'Treatments offered', show: SERVICES.length > 0 },
  ].filter((s) => s.show);

  return (
    <section className="section cstats" ref={ref}>
      <div className="container">
        <header className="section__head cstats__head">
          <Eyebrow>Why patients trust us</Eyebrow>
          <h2 className="title reveal">
            Raising the standard of <em>skin care</em> in Coimbatore
          </h2>
          <p className="reveal">
            Our reputation is built on careful diagnosis, honest advice and results our patients are happy to talk about.
          </p>
        </header>
        <div className="cstats__grid" style={{ '--n': stats.length }}>
          {stats.map((s, i) => (
            <div key={s.label} className={`cstat reveal${i === 0 ? ' cstat--lead' : ''}`} style={{ '--d': `${i * 100}ms` }}>
              <strong>
                <CountUp to={s.to} decimals={s.decimals} run={seen} />
                <span className="cstat__suffix">{s.suffix}</span>
              </strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
