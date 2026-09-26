import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import Page from '../components/Page';
import PageHero from '../components/PageHero';
import ChatCTA from '../components/ChatCTA';
import { CREDENTIALS, GALLERY, IMG, TIMELINE, VALUES, img } from '../data';
import { EASE } from '../lib';
import {
  Counter,
  Icon,
  ParallaxImage,
  Reveal,
  ScrollRevealText,
  SectionLabel,
  SplitWords,
  Tilt,
} from '../components/ui';

function Story() {
  return (
    <section className="story section">
      <div className="story__grid">
        <div>
          <SectionLabel>Our story</SectionLabel>
          <h2 className="h2">
            <SplitWords text="Built on one *simple* promise." />
          </h2>
        </div>
        <div className="story__body">
          <ScrollRevealText text="In 2009 Dr. Elena Marsh opened a two-room clinic with a promise that still guides everything we do: give every patient *time*, tell them the *truth*, and leave them with a *clear* plan." />
          <Reveal as="p" className="lead" delay={0.1}>
            Seventeen years later we are a team of four dermatologists and twenty-two nurses,
            coordinators and therapists — but appointments are still long, advice is still honest, and
            every plan is still written down.
          </Reveal>
        </div>
      </div>
      <div className="story__images">
        <ParallaxImage src={img(IMG.reception, 1200)} alt="The Mirrors reception" className="story__img story__img--a" speed={0.1} />
        <ParallaxImage src={img(IMG.consult, 900)} alt="Dermatologist speaking with a patient" className="story__img story__img--b" speed={0.16} delay={0.15} />
        <Reveal className="story__stamp" delay={0.3}>
          <span>Est.</span>
          <strong>2009</strong>
        </Reveal>
      </div>
    </section>
  );
}

function Timeline() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] });
  const line = useSpring(scrollYProgress, { stiffness: 90, damping: 25 });

  return (
    <section className="timeline section">
      <div className="timeline__head">
        <SectionLabel light>Milestones</SectionLabel>
        <h2 className="h2">
          <SplitWords text="Seventeen years of *listening*." />
        </h2>
      </div>
      <div className="timeline__track" ref={ref}>
        <div className="timeline__rail" aria-hidden="true">
          <motion.span style={{ scaleY: line }} />
        </div>
        {TIMELINE.map((t, i) => (
          <motion.article
            key={t.year}
            className={`tl ${i % 2 ? 'tl--right' : 'tl--left'}`}
            initial={{ opacity: 0, x: i % 2 ? 60 : -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 1, ease: EASE }}
          >
            <span className="tl__dot" aria-hidden="true" />
            <span className="tl__year">{t.year}</span>
            <h3>{t.title}</h3>
            <p>{t.text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function Values() {
  return (
    <section className="values section">
      <SectionLabel>What we believe</SectionLabel>
      <h2 className="h2 values__title">
        <SplitWords text="Four values, *zero* compromises." />
      </h2>
      <div className="values__grid">
        {VALUES.map((v, i) => (
          <Reveal key={v.title} delay={i * 0.1}>
            <Tilt className={`value value--${i}`}>
              <span className="value__icon">
                <Icon name={v.icon} size={26} />
              </span>
              <span className="value__no">0{i + 1}</span>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Space() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x1 = useTransform(scrollYProgress, [0, 1], ['4%', '-18%']);
  const x2 = useTransform(scrollYProgress, [0, 1], ['-22%', '2%']);
  const rowA = GALLERY.slice(0, 4);
  const rowB = GALLERY.slice(4);

  return (
    <section className="space section" ref={ref}>
      <div className="space__head">
        <SectionLabel>The space</SectionLabel>
        <h2 className="h2">
          <SplitWords text="Designed to feel like a *deep* breath." />
        </h2>
        <Reveal as="p" className="lead" delay={0.15}>
          Natural light, soft materials and private suites — because healing is easier when you feel
          calm.
        </Reveal>
      </div>
      <motion.div className="space__row" style={{ x: x1 }}>
        {rowA.map((g) => (
          <figure key={g.caption} className="space__item">
            <img src={img(g.image, 800)} alt={g.caption} loading="lazy" />
            <figcaption>{g.caption}</figcaption>
          </figure>
        ))}
      </motion.div>
      <motion.div className="space__row" style={{ x: x2 }}>
        {rowB.map((g) => (
          <figure key={g.caption} className="space__item">
            <img src={img(g.image, 800)} alt={g.caption} loading="lazy" />
            <figcaption>{g.caption}</figcaption>
          </figure>
        ))}
      </motion.div>
    </section>
  );
}

function Numbers() {
  const stats = [
    { to: 18, suffix: 'k+', label: 'Patients cared for' },
    { to: 26, suffix: '', label: 'Clinicians & staff' },
    { to: 4200, suffix: '+', label: 'Skin cancers treated' },
    { to: 4.9, suffix: '★', decimals: 1, label: 'Average rating' },
  ];
  return (
    <section className="numbers">
      {stats.map((s, i) => (
        <Reveal className="numbers__item" key={s.label} delay={i * 0.08}>
          <strong>
            <Counter to={s.to} suffix={s.suffix} decimals={s.decimals || 0} />
          </strong>
          <span>{s.label}</span>
        </Reveal>
      ))}
    </section>
  );
}

function Credentials() {
  return (
    <section className="creds">
      <div className="creds__track">
        {[0, 1].map((k) => (
          <div className="creds__group" key={k} aria-hidden={k > 0}>
            {CREDENTIALS.map((c) => (
              <span key={c} className="creds__item">
                <Icon name="shield" size={20} /> {c}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function About() {
  return (
    <Page title="About">
      <PageHero
        label="About"
        index="01"
        title={['A clinic built', 'around *you*.']}
        lead="The Mirrors Dermatology Clinic is an independent dermatology clinic led by board-certified specialists. We combine medical rigour with the calm of a boutique — and we never rush."
        image={IMG.aboutHero}
        shape="arch"
      />
      <Story />
      <Credentials />
      <Timeline />
      <Values />
      <Numbers />
      <Space />
      <ChatCTA title="Come and *meet* us." text="Book a consultation or ask Aura anything about the clinic — she’s available day and night." />
    </Page>
  );
}
