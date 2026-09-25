import { useRef } from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion';
import { MARQUEE_A, MARQUEE_B } from '../data';
import { wrap } from '../lib';

/* Infinite ticker that speeds up, reverses and skews with scroll velocity */
function VelocityRow({ items, baseVelocity, className }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [0, 1000], [0, 4], { clamp: false });
  const skewX = useTransform(smooth, [-2000, 2000], [-8, 8]);
  const x = useTransform(baseX, (v) => `${wrap(-50, -25, v)}%`);
  const dir = useRef(1);

  useAnimationFrame((_, delta) => {
    let move = dir.current * baseVelocity * (delta / 1000);
    const f = factor.get();
    if (f < 0) dir.current = -1;
    else if (f > 0) dir.current = 1;
    move += dir.current * move * f;
    baseX.set(baseX.get() + move);
  });

  return (
    <div className={`marquee__row ${className}`}>
      <motion.div className="marquee__track" style={{ x, skewX }}>
        {[0, 1, 2, 3].map((copy) => (
          <span className="marquee__group" key={copy} aria-hidden={copy > 0}>
            {items.map((t) => (
              <span className="marquee__item" key={t}>
                {t}
                <svg viewBox="0 0 24 24" className="marquee__star" aria-hidden="true">
                  <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
                </svg>
              </span>
            ))}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export default function Marquee() {
  return (
    <section className="marquee" aria-label="Our specialities">
      <VelocityRow items={MARQUEE_A} baseVelocity={-2.2} className="marquee__row--a" />
      <VelocityRow items={MARQUEE_B} baseVelocity={2.2} className="marquee__row--b" />
    </section>
  );
}
