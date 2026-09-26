import { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import Page from '../components/Page';
import PageHero from '../components/PageHero';
import Testimonials from '../components/Testimonials';
import ChatCTA from '../components/ChatCTA';
import { BeforeAfterSlider } from '../components/BeforeAfter';
import { CASES, IMG, OUTCOMES, RESULTS_GALLERY, img } from '../data';
import { EASE } from '../lib';
import { Counter, Reveal, ScrollRevealText, SectionLabel, SplitWords } from '../components/ui';

function Cases() {
  const [active, setActive] = useState(0);
  const c = CASES[active];
  return (
    <section className="cases section">
      <div className="cases__head">
        <div>
          <SectionLabel>Case studies</SectionLabel>
          <h2 className="h2">
            <SplitWords text="Drag to see the *difference*." />
          </h2>
        </div>
        <LayoutGroup>
          <div className="tabs" role="tablist" aria-label="Choose a case">
            {CASES.map((k, i) => (
              <button
                key={k.id}
                role="tab"
                aria-selected={active === i}
                className={`tab ${active === i ? 'is-active' : ''}`}
                onClick={() => setActive(i)}
              >
                {active === i && <motion.span layoutId="case-pill" className="tab__pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                <span className="tab__label">{k.label}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      </div>

      <div className="cases__grid">
        <AnimatePresence mode="wait">
          <motion.div
            key={c.id}
            className="cases__slider"
            initial={{ opacity: 0, x: 40, rotate: 2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: -40, rotate: -2 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <BeforeAfterSlider image={c.image} effect={c.effect} label={`${c.title} before and after`} />
            <p className="ba__note">Illustrative simulation. Individual results vary.</p>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={c.id}
            className="cases__info"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
          >
            <span className="cases__no">Case 0{active + 1}</span>
            <h3>{c.title}</h3>
            <p>{c.text}</p>
            <div className="cases__stats">
              {c.stats.map((s) => (
                <div className="neu-chip" key={s.label}>
                  <strong>
                    <Counter to={s.to} suffix={s.suffix} duration={1.4} />
                  </strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function Outcomes() {
  return (
    <section className="outcomes section">
      <div className="outcomes__grid">
        <div>
          <SectionLabel light>Outcomes</SectionLabel>
          <h2 className="h2">
            <SplitWords text="We *measure* what matters." />
          </h2>
          <Reveal as="p" className="lead" delay={0.1}>
            Every treatment plan is tracked with standardised photos and patient-reported outcomes, so
            we know what works — and so do you.
          </Reveal>
        </div>
        <div className="bars">
          {OUTCOMES.map((o, i) => (
            <div className="bar" key={o.label}>
              <div className="bar__top">
                <span>{o.label}</span>
                <strong>
                  <Counter to={o.value} suffix="%" />
                </strong>
              </div>
              <div className="bar__track">
                <motion.span
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: o.value / 100 }}
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ duration: 1.6, ease: EASE, delay: i * 0.12 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Promise() {
  return (
    <section className="promise section">
      <SectionLabel>Our promise</SectionLabel>
      <ScrollRevealText
        className="promise__text"
        text="We will never show you *filtered* photos, promise results we can’t deliver, or sell you a treatment you don’t need. Real skin has texture — and that’s *beautiful*."
      />
    </section>
  );
}

function Gallery() {
  return (
    <section className="gallery section">
      <div className="gallery__head">
        <SectionLabel>Inside The Mirrors</SectionLabel>
        <h2 className="h2">
          <SplitWords text="Details that make the *difference*." />
        </h2>
      </div>
      <div className="masonry">
        {RESULTS_GALLERY.map((g, i) => (
          <motion.figure
            key={g.caption}
            className={`masonry__item ${g.tall ? 'is-tall' : ''}`}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-8%' }}
            transition={{ duration: 0.9, ease: EASE, delay: (i % 4) * 0.08 }}
            data-cursor="view"
            data-cursor-label="Look"
          >
            <img src={img(g.image, 800)} alt={g.caption} loading="lazy" />
            <figcaption>{g.caption}</figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

export default function Results() {
  return (
    <Page title="Results">
      <PageHero
        label="Results"
        index="04"
        title={['Honest results,', '*real* skin.']}
        lead="See how our treatment programmes transform common skin concerns — measured objectively, and always without filters."
        image={IMG.resultsHero}
        shape="tilted"
      />
      <Cases />
      <Outcomes />
      <Promise />
      <Gallery />
      <Testimonials />
      <ChatCTA title="Your results *start* here." />
    </Page>
  );
}
