import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Page from '../components/Page';
import PageHero from '../components/PageHero';
import ChatCTA from '../components/ChatCTA';
import { CREDENTIALS, IMG, TEAM, img } from '../data';
import { useChat } from '../chat/ChatProvider';
import { EASE } from '../lib';
import { Counter, Icon, Reveal, SectionLabel, SplitWords } from '../components/ui';

function Profile({ d, i, onClose }) {
  const chat = useChat();
  useEffect(() => {
    window.__lenis?.stop();
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.__lenis?.start();
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <motion.div className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.article
        className="profile"
        role="dialog"
        aria-modal="true"
        aria-label={d.name}
        layoutId={`doc-card-${i}`}
        onClick={(e) => e.stopPropagation()}
        transition={{ duration: 0.6, ease: EASE }}
        data-lenis-prevent
      >
        <motion.div className="profile__img" layoutId={`doc-img-${i}`} transition={{ duration: 0.6, ease: EASE }}>
          <img src={img(d.image, 800)} alt={d.name} />
        </motion.div>
        <motion.div
          className="profile__body"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.5, ease: EASE } }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <button className="profile__close" onClick={onClose} aria-label="Close profile">
            <Icon name="plus" size={22} className="rot45" />
          </button>
          <p className="profile__role">{d.role}</p>
          <h2>{d.name}</h2>
          <blockquote>“{d.quote}”</blockquote>
          <p className="profile__bio">{d.bio}</p>
          <dl className="profile__facts">
            <div>
              <dt>Experience</dt>
              <dd>{d.years} years</dd>
            </div>
            <div>
              <dt>Languages</dt>
              <dd>{d.languages}</dd>
            </div>
            <div>
              <dt>Training</dt>
              <dd>{d.education}</dd>
            </div>
          </dl>
          <ul className="profile__tags">
            {d.specialties.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <button
            className="btn btn--primary"
            onClick={() => {
              onClose();
              chat.open('book', { doctor: d.name, userText: `I’d like to book with ${d.name}` });
            }}
          >
            Book with Dr. {d.first}
            <span className="btn__icon">
              <Icon name="chat" size={17} />
            </span>
          </button>
        </motion.div>
      </motion.article>
    </motion.div>
  );
}

function TeamGrid() {
  const [open, setOpen] = useState(null);
  return (
    <section className="roster section">
      <div className="roster__head">
        <SectionLabel>The team</SectionLabel>
        <h2 className="h2">
          <SplitWords text="Specialists, *not* generalists." />
        </h2>
        <Reveal as="p" className="lead" delay={0.1}>
          Tap a profile to learn more about each dermatologist’s training, interests and approach.
        </Reveal>
      </div>
      <div className="roster__grid">
        {TEAM.map((d, i) => (
          <Reveal key={d.name} delay={i * 0.1} y={60}>
            <motion.button
              className="rcard-doc"
              layoutId={`doc-card-${i}`}
              onClick={() => setOpen(i)}
              data-cursor="view"
              data-cursor-label="Profile"
              transition={{ duration: 0.6, ease: EASE }}
            >
              <motion.div className="rcard-doc__img" layoutId={`doc-img-${i}`} transition={{ duration: 0.6, ease: EASE }}>
                <img src={img(d.image, 700)} alt={`Portrait of ${d.name}`} loading="lazy" />
              </motion.div>
              <div className="rcard-doc__body">
                <span className="rcard-doc__years">{d.years} yrs</span>
                <h3>{d.name}</h3>
                <p>{d.role}</p>
                <span className="rcard-doc__focus">{d.focus}</span>
                <span className="rcard-doc__more">
                  View profile <Icon name="arrow" size={15} />
                </span>
              </div>
            </motion.button>
          </Reveal>
        ))}
      </div>
      <AnimatePresence>{open !== null && <Profile d={TEAM[open]} i={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </section>
  );
}

function Together() {
  return (
    <section className="together section">
      <div className="together__grid">
        <div>
          <SectionLabel light>How we work</SectionLabel>
          <h2 className="h2">
            <SplitWords text="Four minds, *one* plan." />
          </h2>
          <Reveal as="p" className="lead" delay={0.1}>
            Complex cases are discussed at our weekly multidisciplinary meeting, so you benefit from
            the combined expertise of the whole team — not just one opinion.
          </Reveal>
        </div>
        <div className="together__stats">
          {[
            { to: 52, suffix: '+', label: 'Years combined experience' },
            { to: 7, suffix: '', label: 'Languages spoken' },
            { to: 1, suffix: '', label: 'Weekly case meeting' },
            { to: 100, suffix: '%', label: 'Board certified' },
          ].map((s, i) => (
            <Reveal className="together__stat" key={s.label} delay={i * 0.08}>
              <strong>
                <Counter to={s.to} suffix={s.suffix} />
              </strong>
              <span>{s.label}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Credentials() {
  return (
    <section className="creds creds--light">
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

function Careers() {
  const chat = useChat();
  return (
    <section className="careers section">
      <Reveal className="careers__card">
        <motion.span
          className="brutal__star"
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          aria-hidden="true"
        >
          ✺
        </motion.span>
        <h2>
          Join the <span>team.</span>
        </h2>
        <p>
          We’re always looking for kind, curious dermatologists, nurses and patient coordinators who
          believe healthcare should feel human.
        </p>
        <button className="btn btn--dark" onClick={() => chat.open('enquiry')}>
          Get in touch <Icon name="arrow" size={17} />
        </button>
      </Reveal>
    </section>
  );
}

export default function Specialists() {
  return (
    <Page title="Specialists">
      <PageHero
        label="Specialists"
        index="05"
        title={['The hands your', 'skin is *in*.']}
        lead="Four board-certified dermatologists, each with a deep specialist interest — from skin cancer surgery to hair loss and skin of colour."
        image={IMG.drElena}
        shape="arch"
      />
      <TeamGrid />
      <Credentials />
      <Together />
      <Careers />
      <ChatCTA title="Choose your *specialist*." text="Ask Aura to book you in with a specific dermatologist — or let us match you with the right one." />
    </Page>
  );
}
