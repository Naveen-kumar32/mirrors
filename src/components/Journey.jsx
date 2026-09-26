import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { JOURNEY, img } from '../data';
import { Icon } from './ui';

/* Vertical scroll drives a pinned horizontal track */
export default function Journey({ showLink = true, altImages = false }) {
  const section = useRef(null);
  const track = useRef(null);
  const dist = useRef(0);
  const [height, setHeight] = useState('300vh');

  useLayoutEffect(() => {
    const measure = () => {
      dist.current = Math.max(0, track.current.scrollWidth - window.innerWidth);
      setHeight(`${window.innerHeight + dist.current}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, (v) => -v * dist.current);
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const bgShift = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);

  return (
    <section className="journey" ref={section} style={{ height }}>
      <div className="journey__sticky">
        <motion.div className="journey__glow" style={{ x: bgShift }} aria-hidden="true" />
        <motion.div className="journey__track" ref={track} style={{ x }}>
          <div className="journey__intro">
            <p className="section-label is-light">
              <span className="section-label__dot" />
              Your journey
            </p>
            <h2 className="h2">
              Five steps to <em>skin</em> you feel at home in.
            </h2>
            <p className="journey__hint">
              Keep scrolling <Icon name="arrow" size={18} />
            </p>
          </div>

          {JOURNEY.map((step) => (
            <article className="jcard jcard--image" key={step.no}>
              {(altImages ? step.imageAlt : step.image) && (
                <div className="jcard__img">
                  <img src={img(altImages ? step.imageAlt : step.image, 800)} alt="" loading="lazy" />
                </div>
              )}
              <div className="jcard__top">
                <span className="jcard__no">{step.no}</span>
                <span className="jcard__icon">
                  <Icon name={step.icon} size={24} />
                </span>
              </div>
              <div className="jcard__bottom">
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </article>
          ))}

          <div className="journey__end">
            <span>Healthy</span>
            <span className="outline">skin,</span>
            <em>for life.</em>
            {showLink && (
              <Link to="/journey" className="journey__more">
                See the full journey <Icon name="arrow" size={18} />
              </Link>
            )}
          </div>
        </motion.div>

        <div className="journey__progress" aria-hidden="true">
          <motion.span style={{ scaleX: progress }} />
        </div>
      </div>
    </section>
  );
}
