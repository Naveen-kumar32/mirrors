import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { animate, motion, useInView, useMotionTemplate, useMotionValue, useTransform } from 'framer-motion';
import { CASES, img } from '../data';
import { Counter, Icon, Reveal, SectionLabel, SplitWords } from './ui';

/*
 * The "before" layers are simulated with CSS for demo purposes.
 * Replace with real, consented patient photos before going live.
 */
const ACNE = [
  [38, 44, 3.2], [58, 40, 2.4], [44, 58, 2.8], [62, 55, 3.6], [52, 66, 2.2],
  [35, 60, 2.6], [66, 46, 2.0], [48, 36, 1.8], [57, 72, 2.4], [40, 70, 2.0],
  [70, 62, 2.8], [30, 50, 2.2],
];
const PIGMENT = [
  [40, 40, 5], [60, 38, 4], [36, 52, 6], [64, 50, 5.5], [50, 30, 4], [46, 60, 3.5], [58, 62, 3],
  [30, 44, 3.5], [70, 44, 3.2],
];
const spots = (list, rgb, a) =>
  list
    .map(([x, y, r]) => `radial-gradient(circle at ${x}% ${y}%, rgba(${rgb},${a}) 0, rgba(${rgb},${a * 0.35}) ${r}%, transparent ${r * 1.8}%)`)
    .join(',');

const EFFECTS = {
  acne: {
    filter: 'contrast(1.1) saturate(1.3) sepia(0.14) brightness(0.96)',
    overlay: spots(ACNE, '190,60,50', 0.55),
    texture: true,
  },
  pigment: {
    filter: 'contrast(1.06) sepia(0.28) saturate(1.1) brightness(0.97)',
    overlay: spots(PIGMENT, '120,70,40', 0.42),
  },
  redness: {
    filter: 'saturate(1.35) contrast(1.05)',
    overlay: [
      'radial-gradient(18% 13% at 38% 52%, rgba(215,60,60,.5), transparent 70%)',
      'radial-gradient(18% 13% at 63% 52%, rgba(215,60,60,.5), transparent 70%)',
      'radial-gradient(7% 9% at 51% 50%, rgba(215,60,60,.45), transparent 70%)',
      'radial-gradient(12% 6% at 50% 30%, rgba(215,60,60,.25), transparent 70%)',
    ].join(','),
  },
};

export function BeforeAfterSlider({ image, effect = 'acne', label = 'Before and after comparison' }) {
  const box = useRef(null);
  const inView = useInView(box, { once: true, margin: '-25%' });
  const pos = useMotionValue(50);
  const clip = useMotionTemplate`inset(0 ${useTransform(pos, (v) => 100 - v)}% 0 0)`;
  const left = useMotionTemplate`${pos}%`;
  const dragging = useRef(false);
  const fx = EFFECTS[effect];

  useEffect(() => {
    if (!inView) return;
    const c = animate(pos, [50, 22, 78, 50], { duration: 2.6, ease: 'easeInOut', delay: 0.4 });
    return () => c.stop();
  }, [inView, pos]);

  const setFromEvent = (e) => {
    const r = box.current.getBoundingClientRect();
    pos.set(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
  };
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') pos.set(Math.max(0, pos.get() - 5));
    if (e.key === 'ArrowRight') pos.set(Math.min(100, pos.get() + 5));
  };

  return (
    <div
      className="ba"
      ref={box}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={50}
      onKeyDown={onKey}
      data-cursor="drag"
      data-cursor-label="Drag"
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        setFromEvent(e);
      }}
      onPointerMove={(e) => dragging.current && setFromEvent(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <img className="ba__after" src={img(image, 1000)} alt="After treatment" draggable="false" />
      <motion.div className="ba__before" style={{ clipPath: clip }}>
        <img src={img(image, 1000)} alt="Before treatment" draggable="false" style={{ filter: fx.filter }} />
        <div className="ba__spots" style={{ backgroundImage: fx.overlay }} />
        {fx.texture && <div className="ba__texture" />}
      </motion.div>
      <span className="ba__tag ba__tag--before">Before</span>
      <span className="ba__tag ba__tag--after">After</span>
      <motion.div className="ba__handle" style={{ left }}>
        <span className="ba__knob">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </motion.div>
    </div>
  );
}

/* Home page section */
export default function BeforeAfter() {
  const c = CASES[0];
  return (
    <section className="results section">
      <div className="results__grid">
        <div className="results__text">
          <SectionLabel>Results</SectionLabel>
          <h2 className="h2">
            <SplitWords text="Clearer, calmer, *visibly* you." />
          </h2>
          <Reveal as="p" className="lead" delay={0.15}>
            Drag the handle to compare. Our combined acne and pigment programme typically shows
            visible change within 12 weeks.
          </Reveal>
          <div className="results__chips">
            {[...c.stats, { to: 94, suffix: '%', label: 'would recommend us' }].map((s, i) => (
              <Reveal className="neu-chip" delay={0.2 + i * 0.1} key={s.label}>
                <strong>
                  <Counter to={s.to} suffix={s.suffix} />
                </strong>
                <span>{s.label}</span>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.4}>
            <Link to="/results" className="text-link">
              See more results <Icon name="arrow" size={16} />
            </Link>
          </Reveal>
        </div>

        <Reveal className="ba-wrap" y={60}>
          <BeforeAfterSlider image={c.image} effect={c.effect} />
          <p className="ba__note">Illustrative simulation. Individual results vary.</p>
        </Reveal>
      </div>
    </section>
  );
}
