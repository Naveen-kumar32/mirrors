import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TEAM, img } from '../data';
import { EASE } from '../lib';
import { Icon, Reveal, SectionLabel, SplitWords } from './ui';

const ARCH = {
  hidden: { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 28px 28px)' },
  show: (i) => ({
    clipPath: 'inset(0% 0% 0% 0% round 999px 999px 28px 28px)',
    transition: { duration: 1.3, ease: EASE, delay: i * 0.12 },
  }),
};

export default function Team() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const yA = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const yB = useTransform(scrollYProgress, [0, 1], [-40, 120]);

  return (
    <section className="team section">
      <div className="team__head">
        <div>
          <SectionLabel>Specialists</SectionLabel>
          <h2 className="h2">
            <SplitWords text="The hands your skin is *in*." />
          </h2>
        </div>
        <Reveal className="team__side" delay={0.15}>
          <p className="lead">
            Four dermatologists, 50+ years of combined experience and one shared belief: you deserve
            to understand your skin.
          </p>
          <Link to="/specialists" className="text-link">
            Meet the specialists <Icon name="arrow" size={16} />
          </Link>
        </Reveal>
      </div>

      <motion.div
        className="team__grid"
        ref={ref}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        {TEAM.map((d, i) => (
          <motion.article
            className="doc"
            key={d.name}
            style={{ y: i % 2 === 0 ? yA : yB }}
            data-cursor="view"
            data-cursor-label="Meet"
          >
            <motion.div
              className="doc__arch"
              variants={ARCH}
              custom={i}
            >
              <img src={img(d.image, 700)} alt={`Portrait of ${d.name}`} loading="lazy" />
              <div className="doc__overlay">
                <span>{d.focus}</span>
              </div>
            </motion.div>
            <div className="doc__info">
              <h3>{d.name}</h3>
              <p>{d.role}</p>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
