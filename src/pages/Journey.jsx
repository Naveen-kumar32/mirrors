import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import Page from '../components/Page';
import PageHero from '../components/PageHero';
import JourneyScroller from '../components/Journey';
import FAQ from '../components/FAQ';
import ChatCTA from '../components/ChatCTA';
import { CHECKLIST, FAQS, FIRST_VISIT, IMG, PAYMENT, TECH, img } from '../data';
import { useChat } from '../chat/ChatProvider';
import { EASE } from '../lib';
import { Icon, Reveal, SectionLabel, SplitWords, Tilt } from '../components/ui';

function VisitStep({ step, i, onActive }) {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.6 });
  useEffect(() => {
    if (inView) onActive(i);
  }, [inView, i, onActive]);
  return (
    <div className={`visit__step ${inView ? 'is-active' : ''}`} ref={ref}>
      <span className="visit__time">{step.time}</span>
      <h3>{step.title}</h3>
      <p>{step.text}</p>
      <img className="visit__step-img" src={img(step.image, 700)} alt="" loading="lazy" />
    </div>
  );
}

function FirstVisit() {
  const [active, setActive] = useState(0);
  return (
    <section className="visit section">
      <div className="visit__head">
        <SectionLabel>Your first visit</SectionLabel>
        <h2 className="h2">
          <SplitWords text="Forty-five minutes, *minute* by minute." />
        </h2>
      </div>
      <div className="visit__grid">
        <div className="visit__sticky">
          <div className="visit__frame">
            {/* All photos are mounted up front so switching steps never shows an empty frame */}
            {FIRST_VISIT.map((step, i) => (
              <motion.img
                key={step.title}
                src={img(step.image, 1000)}
                alt=""
                style={{ zIndex: i }}
                initial={false}
                animate={
                  i <= active
                    ? { clipPath: 'inset(0% 0% 0% 0%)', scale: 1 }
                    : { clipPath: 'inset(0% 0% 100% 0%)', scale: 1.15 }
                }
                transition={{ duration: 1, ease: EASE }}
              />
            ))}
            <div className="visit__counter glass" style={{ zIndex: FIRST_VISIT.length }}>
              <strong>{FIRST_VISIT[active].time}</strong>
              <span>
                {active + 1} / {FIRST_VISIT.length}
              </span>
            </div>
          </div>
        </div>
        <div className="visit__steps">
          {FIRST_VISIT.map((s, i) => (
            <VisitStep key={s.title} step={s} i={i} onActive={setActive} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Checklist() {
  return (
    <section className="check section">
      <div className="check__card">
        <div className="check__text">
          <SectionLabel>Before you come</SectionLabel>
          <h2 className="h2">
            <SplitWords text="A little *prep* goes a long way." />
          </h2>
          <Reveal as="p" className="lead" delay={0.1}>
            Bring these along and we can make the most of every minute together.
          </Reveal>
        </div>
        <motion.ul
          className="check__list"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-15%' }}
          variants={{ show: { transition: { staggerChildren: 0.18 } } }}
        >
          {CHECKLIST.map((c) => (
            <motion.li key={c} variants={{ hidden: { opacity: 0.3, x: 20 }, show: { opacity: 1, x: 0 } }}>
              <span className="check__box">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <motion.path
                    d="M5 12l5 5 9-10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1 } }}
                    transition={{ duration: 0.4 }}
                  />
                </svg>
              </span>
              {c}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

function Technology() {
  return (
    <section className="tech section">
      <div className="tech__head">
        <SectionLabel light>Technology</SectionLabel>
        <h2 className="h2">
          <SplitWords text="Tools that see *deeper*." />
        </h2>
      </div>
      <div className="tech__grid">
        {TECH.map((t, i) => (
          <Reveal key={t.title} delay={i * 0.1}>
            <Tilt className="techcard">
              <div className="techcard__img">
                <img src={img(t.image, 700)} alt="" loading="lazy" />
              </div>
              <span className="techcard__icon">
                <Icon name={t.icon} size={22} />
              </span>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Payment() {
  return (
    <section className="pay section">
      <SectionLabel>Insurance & payment</SectionLabel>
      <h2 className="h2 pay__title">
        <SplitWords text="Clear costs, *always* in writing." />
      </h2>
      <div className="pay__grid">
        {PAYMENT.map((p, i) => (
          <Reveal className="pay__card" key={p.title} delay={i * 0.1}>
            <span className="pay__no">0{i + 1}</span>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Tele() {
  const chat = useChat();
  return (
    <section className="tele section">
      <div className="tele__grid">
        <div className="tele__media">
          <div className="tele__screen">
            <img src={img(IMG.drSofia, 700)} alt="" />
            <span className="tele__live">
              <span className="pulse" /> Live · 12:04
            </span>
            <div className="tele__pip">
              <img src={img(IMG.pip, 300)} alt="" />
            </div>
            <div className="tele__bar">
              <span><Icon name="video" size={18} /></span>
              <span><Icon name="chat" size={18} /></span>
              <span className="tele__end"><Icon name="phone" size={18} /></span>
            </div>
          </div>
        </div>
        <div className="tele__text">
          <SectionLabel>Tele-dermatology</SectionLabel>
          <h2 className="h2">
            <SplitWords text="Follow-ups from your *sofa*." />
          </h2>
          <Reveal as="p" className="lead" delay={0.1}>
            Secure video appointments with your own dermatologist for reviews, prescription renewals and
            many new concerns. Upload photos beforehand and we’ll be ready.
          </Reveal>
          <Reveal delay={0.2}>
            <button
              className="btn btn--primary"
              onClick={() => chat.open('book', { visitType: 'Video consult', userText: 'I’d like a video consultation' })}
            >
              Book a video consult
              <span className="btn__icon">
                <Icon name="video" size={17} />
              </span>
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default function Journey() {
  return (
    <Page title="Your Journey">
      <PageHero
        label="Your Journey"
        index="03"
        title={['From first hello', 'to *healthy* skin.']}
        lead="What happens when you choose The Mirrors — from the moment you book to the aftercare that keeps your skin at its best."
        image={IMG.journeyHero}
        shape="circle"
      />
      <JourneyScroller showLink={false} altImages />
      <FirstVisit />
      <Checklist />
      <Technology />
      <Tele />
      <Payment />
      <FAQ items={FAQS.slice(0, 5)} />
      <ChatCTA title="Take the *first* step." />
    </Page>
  );
}
