import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useScroll, useTransform } from 'framer-motion';
import Page from '../components/Page';
import PageHero from '../components/PageHero';
import ChatCTA from '../components/ChatCTA';
import { IMG, RATING_BREAKDOWN, REVIEWS, img } from '../data';
import { useChat } from '../chat/ChatProvider';
import { EASE } from '../lib';
import { Counter, Icon, Initials, Reveal, SectionLabel, SplitWords, Stars } from '../components/ui';

const FILTERS = ['All', 'Medical', 'Surgical', 'Aesthetic', 'Hair'];

function Summary() {
  return (
    <section className="rating section">
      <Reveal className="rating__score clay">
        <span className="rating__big">
          <Counter to={4.9} decimals={1} />
        </span>
        <Stars />
        <p>Based on 2,300+ verified reviews</p>
      </Reveal>
      <div className="rating__bars">
        {RATING_BREAKDOWN.map((r, i) => (
          <div className="rating__row" key={r.stars}>
            <span>{r.stars} ★</span>
            <div className="bar__track">
              <motion.span
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: r.pct / 100 }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, ease: EASE, delay: i * 0.1 }}
              />
            </div>
            <strong>{r.pct}%</strong>
          </div>
        ))}
      </div>
      <Reveal className="rating__side" delay={0.2}>
        <h2 className="h2">
          <SplitWords text="Loved by *thousands*." />
        </h2>
        <p className="lead">Every review is from a verified patient. We read all of them — and we reply.</p>
      </Reveal>
    </section>
  );
}

function Wall() {
  const [filter, setFilter] = useState('All');
  const list = useMemo(() => (filter === 'All' ? REVIEWS : REVIEWS.filter((r) => r.tag === filter)), [filter]);
  return (
    <section className="wall section">
      <div className="wall__head">
        <SectionLabel>Reviews</SectionLabel>
        <LayoutGroup>
          <div className="tabs" role="tablist" aria-label="Filter reviews">
            {FILTERS.map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                className={`tab ${filter === f ? 'is-active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {filter === f && <motion.span layoutId="review-pill" className="tab__pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                <span className="tab__label">{f}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      </div>
      <motion.div className="wall__grid" layout>
        <AnimatePresence mode="popLayout">
          {list.map((r, i) => (
            <motion.figure
              layout
              key={r.name + r.date}
              className={`review ${i % 5 === 1 ? 'review--accent' : ''}`}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: EASE, delay: (i % 6) * 0.04 }}
            >
              <div className="review__top">
                <Stars n={r.rating} />
                <span className="review__tag">{r.tag}</span>
              </div>
              <blockquote>{r.text}</blockquote>
              <figcaption>
                <Initials name={r.name} />
                <span>
                  <strong>{r.name}</strong>
                  {r.date} · Verified patient
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

function Featured() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-12%', '12%']);
  const rotate = useTransform(scrollYProgress, [0, 1], [-6, 6]);
  return (
    <section className="featured section" ref={ref}>
      <div className="featured__media">
        <motion.div className="featured__blob" style={{ rotate }} aria-hidden="true" />
        <div className="featured__img">
          <motion.img src={img(IMG.featured, 900)} alt="Portrait of a smiling patient" style={{ y, scale: 1.25 }} />
        </div>
      </div>
      <div className="featured__text">
        <SectionLabel light>Featured story</SectionLabel>
        <blockquote>
          <SplitWords text="“A *ten-minute* skin check turned into the most important appointment of my life.”" stagger={0.03} />
        </blockquote>
        <Reveal as="p" className="lead" delay={0.2}>
          Claire booked a routine mole check after a friend’s encouragement. Digital dermoscopy picked
          up an early melanoma on her back that she had never noticed. It was removed the same week —
          and her follow-ups have been clear ever since.
        </Reveal>
        <Reveal className="featured__who" delay={0.3}>
          <strong>Claire D.</strong> · Skin cancer screening, 2026
        </Reveal>
      </div>
    </section>
  );
}

function Share() {
  const chat = useChat();
  return (
    <section className="share section">
      <Reveal className="share__card">
        <div>
          <h2 className="h2">
            <SplitWords text="Share *your* story." />
          </h2>
          <p className="lead">Had a great experience? We’d love to hear it — and so would future patients.</p>
        </div>
        <button className="btn btn--primary" onClick={() => chat.open('enquiry')}>
          Send us a message
          <span className="btn__icon">
            <Icon name="mail" size={17} />
          </span>
        </button>
      </Reveal>
    </section>
  );
}

export default function Stories() {
  return (
    <Page title="Stories">
      <PageHero
        label="Stories"
        index="06"
        title={['Kind words from', '*real* skin.']}
        lead="Thousands of patients have trusted Mirrors Dema with their skin. Here are a few of their stories, in their own words."
        image={IMG.p4}
        shape="circle"
      />
      <Summary />
      <Wall />
      <Featured />
      <Share />
      <ChatCTA title="Start *your* story." />
    </Page>
  );
}
