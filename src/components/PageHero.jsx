import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { img } from '../data';
import { EASE } from '../lib';
import { useReady } from '../ready';
import { SplitWords } from './ui';

/*
 * Hero used by every inner page.
 * title: array of lines; wrap words in *asterisks* for italic accent.
 * shape: 'blob' | 'arch' | 'circle' | 'tilted'
 */
export default function PageHero({ label, title, lead, image, shape = 'blob', index, crumbs = [], children, dark }) {
  const ready = useReady();
  const ref = useRef(null);
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // Only reveal the photo once it has actually downloaded (handles cached images too)
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth) setLoaded(true);
  }, [image]);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yText = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const yMedia = useTransform(scrollYProgress, [0, 1], ['0%', '-10%']);
  const yIndex = useTransform(scrollYProgress, [0, 1], ['0%', '60%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const lines = Array.isArray(title) ? title : [title];
  const base = 0.55;

  const rise = (delay) => ({
    initial: { opacity: 0, y: 24 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 1, ease: EASE, delay },
  });

  return (
    <section className={`phero phero--${shape} ${dark ? 'phero--dark' : ''} ${image ? '' : 'phero--text'}`} ref={ref}>
      <div className="aurora" aria-hidden="true">
        <span className="aurora__blob a1" />
        <span className="aurora__blob a2" />
        <span className="aurora__blob a3" />
      </div>
      <div className="hero__lines" aria-hidden="true" />
      {index && (
        <motion.span className="phero__index" style={{ y: yIndex }} aria-hidden="true">
          {index}
        </motion.span>
      )}

      <motion.div className="phero__text" style={{ y: yText, opacity: fade }}>
        <motion.nav className="crumbs" aria-label="Breadcrumb" {...rise(base - 0.1)}>
          <Link to="/">Home</Link>
          {crumbs.map((c) => (
            <span key={c.to}>
              <span className="crumbs__sep">/</span>
              <Link to={c.to}>{c.label}</Link>
            </span>
          ))}
          <span className="crumbs__sep">/</span>
          <span aria-current="page">{label}</span>
        </motion.nav>
        <h1 className="phero__title">
          {lines.map((line, i) => (
            <SplitWords key={i} text={line} animateNow={ready} delay={base + i * 0.12} />
          ))}
        </h1>
        {lead && (
          <motion.p className="phero__lead" {...rise(base + 0.35)}>
            {lead}
          </motion.p>
        )}
        {children && (
          <motion.div className="phero__extra" {...rise(base + 0.5)}>
            {children}
          </motion.div>
        )}
      </motion.div>

      {image && (
        <motion.div className="phero__media" style={{ y: yMedia }}>
          <div className="phero__ring" aria-hidden="true" />
          <motion.div
            className="phero__frame"
            initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
            animate={ready && loaded ? { clipPath: 'inset(0% 0% 0% 0%)' } : undefined}
            transition={{ duration: 1.4, ease: EASE, delay: base }}
          >
            <motion.img
              ref={imgRef}
              src={img(image, 1100)}
              alt=""
              style={{ scale: imgScale }}
              fetchPriority="high"
              onLoad={() => setLoaded(true)}
            />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
