import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TESTIMONIALS, img } from '../data';
import { EASE } from '../lib';
import { Icon, SectionLabel, SplitWords, Stars } from './ui';

const DURATION = 7000;

export default function Testimonials() {
  const [[index, dir], setState] = useState([0, 1]);
  const t = TESTIMONIALS[index];

  const go = (d) =>
    setState(([i]) => [(i + d + TESTIMONIALS.length) % TESTIMONIALS.length, d]);

  useEffect(() => {
    const id = setTimeout(() => go(1), DURATION);
    return () => clearTimeout(id);
  }, [index]);

  return (
    <section className="stories section">
      <div className="stories__blob b1" aria-hidden="true" />
      <div className="stories__blob b2" aria-hidden="true" />

      <div className="stories__head">
        <SectionLabel>Patient stories</SectionLabel>
        <h2 className="h2">
          <SplitWords text="Kind words from *real* skin." />
        </h2>
      </div>

      <div className="stories__stage">
        <span className="stories__quote-mark" aria-hidden="true">
          “
        </span>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.figure
            key={index}
            className="stories__card glass"
            custom={dir}
            initial={{ opacity: 0, x: dir * 80, rotate: dir * 2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: dir * -80, rotate: dir * -2 }}
            transition={{ duration: 0.7, ease: EASE }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(1);
              else if (info.offset.x > 60) go(-1);
            }}
            data-cursor="drag"
            data-cursor-label="Swipe"
          >
            <Stars />
            <blockquote>{t.quote}</blockquote>
            <figcaption>
              <img src={img(t.image, 160)} alt="" />
              <span>
                <strong>{t.name}</strong>
                {t.detail}
              </span>
            </figcaption>
          </motion.figure>
        </AnimatePresence>

        <div className="stories__controls">
          <button className="round-btn" onClick={() => go(-1)} aria-label="Previous story">
            <Icon name="arrow" size={18} className="flip" />
          </button>
          <div className="stories__dots">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                className={`stories__dot ${i === index ? 'is-active' : ''}`}
                onClick={() => setState([i, i > index ? 1 : -1])}
                aria-label={`Show story ${i + 1}`}
              >
                {i === index && (
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: DURATION / 1000, ease: 'linear' }}
                  />
                )}
              </button>
            ))}
          </div>
          <button className="round-btn" onClick={() => go(1)} aria-label="Next story">
            <Icon name="arrow" size={18} />
          </button>
        </div>
        <Link to="/stories" className="text-link stories__more">
          Read all patient stories <Icon name="arrow" size={16} />
        </Link>
      </div>
    </section>
  );
}
