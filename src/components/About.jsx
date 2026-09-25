import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { IMG, img } from '../data';
import { Counter, Icon, ParallaxImage, Reveal, ScrollRevealText, SectionLabel, SplitWords } from './ui';

const STATS = [
  { to: 18, suffix: 'k+', label: 'Patients cared for' },
  { to: 16, suffix: ' yrs', label: 'Of clinical practice' },
  { to: 42, suffix: '', label: 'Treatments offered' },
  { to: 4.9, suffix: '★', decimals: 1, label: 'Average rating' },
];

export default function About() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const ySmall = useTransform(scrollYProgress, [0, 1], [140, -140]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-8, 10]);
  const yShape = useTransform(scrollYProgress, [0, 1], [-80, 120]);

  return (
    <section className="about section" id="about" ref={ref}>
      <div className="about__grid">
        <div className="about__text">
          <SectionLabel>About the clinic</SectionLabel>
          <h2 className="h2">
            <SplitWords text="Where medicine meets *quiet* luxury." />
          </h2>
          <ScrollRevealText
            className="about__statement"
            text="We believe great skin care starts with a correct diagnosis, not a product. Every plan at Mirrors Dema is written by a board-certified dermatologist, grounded in *evidence* and shaped around the person in front of us — their skin tone, their lifestyle and their goals."
          />
          <Reveal className="about__sign" delay={0.1}>
            <span className="about__sig">Elena Marsh</span>
            <span>Dr. Elena Marsh, FACD — Medical Director</span>
          </Reveal>
          <Reveal delay={0.2}>
            <Link to="/about" className="text-link">
              Read our story <Icon name="arrow" size={16} />
            </Link>
          </Reveal>
        </div>

        <div className="about__visual">
          <motion.div className="about__shape" style={{ y: yShape, rotate }} aria-hidden="true" />
          <ParallaxImage
            src={img(IMG.lounge, 1100)}
            alt="Calm clinic lounge with plants and natural light"
            className="about__img-main"
            speed={0.1}
          />
          <motion.div className="about__img-small-wrap" style={{ y: ySmall }}>
            <ParallaxImage
              src={img(IMG.lotion, 700)}
              alt="Medical-grade body lotion"
              className="about__img-small"
              speed={0.16}
              delay={0.2}
            />
          </motion.div>
        </div>
      </div>

      <div className="stats">
        {STATS.map((s, i) => (
          <Reveal className="stat" key={s.label} delay={i * 0.1}>
            <span className="stat__num">
              <Counter to={s.to} suffix={s.suffix} decimals={s.decimals || 0} />
            </span>
            <span className="stat__label">{s.label}</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
