import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion, useMotionValue, useSpring } from 'framer-motion';
import Page from '../components/Page';
import PageHero from '../components/PageHero';
import FAQ from '../components/FAQ';
import ChatCTA from '../components/ChatCTA';
import { CATALOG, CATEGORIES, CONDITIONS, FAQS, IMG, PRICING, SERVICES, img } from '../data';
import { useChat } from '../chat/ChatProvider';
import { EASE } from '../lib';
import { Icon, Reveal, SectionLabel, SplitWords, Tilt } from '../components/ui';

function Catalog() {
  const [cat, setCat] = useState('All');
  const chat = useChat();
  const items = useMemo(() => (cat === 'All' ? CATALOG : CATALOG.filter((c) => c.category === cat)), [cat]);

  return (
    <section className="catalog section">
      <div className="catalog__head">
        <div>
          <SectionLabel>Treatment menu</SectionLabel>
          <h2 className="h2">
            <SplitWords text="Find the *right* treatment." />
          </h2>
        </div>
        <LayoutGroup>
          <div className="tabs" role="tablist" aria-label="Filter treatments">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={cat === c}
                className={`tab ${cat === c ? 'is-active' : ''}`}
                onClick={() => setCat(c)}
              >
                {cat === c && <motion.span layoutId="tab-pill" className="tab__pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                <span className="tab__label">{c}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      </div>

      <motion.div className="catalog__grid" layout>
        <AnimatePresence mode="popLayout">
          {items.map((t) => (
            <motion.article
              key={t.name}
              layout
              className="tcard"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <Link to={`/treatments/${t.slug}`} className="tcard__media" data-cursor="view" data-cursor-label="View">
                <img src={img(t.image, 700)} alt="" loading="lazy" />
                <span className="tcard__cat">{t.category}</span>
              </Link>
              <div className="tcard__body">
                <h3>{t.name}</h3>
                <p>{t.text}</p>
                <div className="tcard__foot">
                  <span className="tcard__price">
                    <small>from</small> {t.from}
                  </span>
                  <button
                    className="tcard__book"
                    onClick={() => chat.open('book', { concern: t.name, userText: `I’d like to book ${t.name}` })}
                    aria-label={`Book ${t.name}`}
                  >
                    Book <Icon name="arrow" size={15} />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

/* Big list where a preview image follows the cursor */
function Specialities() {
  const ref = useRef(null);
  const [active, setActive] = useState(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 20 });
  const sy = useSpring(y, { stiffness: 150, damping: 20 });

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
  };

  return (
    <section className="spec section" ref={ref} onPointerMove={onMove} onPointerLeave={() => setActive(null)}>
      <SectionLabel light>Our six specialities</SectionLabel>
      <ul className="spec__list">
        {SERVICES.map((s, i) => (
          <Reveal as="li" key={s.slug} delay={i * 0.05} y={30}>
            <Link to={`/treatments/${s.slug}`} className="spec__row" onPointerEnter={() => setActive(i)}>
              <span className="spec__no">{s.no}</span>
              <span className="spec__title">{s.title}</span>
              <span className="spec__short">{s.short}</span>
              <span className="spec__arrow">
                <Icon name="arrow" size={22} />
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
      <motion.div
        className="spec__float"
        style={{ x: sx, y: sy }}
        animate={{ scale: active === null ? 0 : 1, opacity: active === null ? 0 : 1 }}
        transition={{ duration: 0.4, ease: EASE }}
        aria-hidden="true"
      >
        <div className="spec__float-inner" style={{ transform: `translateY(${-(active ?? 0) * 100}%)` }}>
          {SERVICES.map((s) => (
            <img key={s.slug} src={img(s.image, 600)} alt="" />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function Conditions() {
  const [q, setQ] = useState('');
  const chat = useChat();
  const list = CONDITIONS.filter((c) => c.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <section className="conds section">
      <div className="conds__head">
        <div>
          <SectionLabel>Conditions A–Z</SectionLabel>
          <h2 className="h2">
            <SplitWords text="We treat *more* than you think." />
          </h2>
        </div>
        <Reveal className="search" delay={0.15}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a condition…" aria-label="Search conditions" />
        </Reveal>
      </div>
      <motion.div className="conds__grid" layout>
        <AnimatePresence mode="popLayout">
          {list.map((c) => (
            <motion.button
              layout
              key={c}
              className="cond"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              onClick={() => chat.open('book', { concern: c, userText: `I’d like help with ${c.toLowerCase()}` })}
              title={`Book about ${c}`}
            >
              {c}
            </motion.button>
          ))}
        </AnimatePresence>
        {!list.length && (
          <p className="conds__empty">
            Not listed? <button onClick={() => chat.open('enquiry')}>Ask our team</button> — we probably treat it.
          </p>
        )}
      </motion.div>
    </section>
  );
}

function Pricing() {
  const chat = useChat();
  return (
    <section className="pricing section">
      <div className="pricing__head">
        <SectionLabel>Consultations</SectionLabel>
        <h2 className="h2">
          <SplitWords text="Transparent from the *first* visit." />
        </h2>
      </div>
      <div className="pricing__grid">
        {PRICING.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.1}>
            <Tilt className={`price ${p.featured ? 'price--featured' : ''}`} max={6}>
              {p.featured && <span className="price__badge">Most popular</span>}
              <h3>{p.name}</h3>
              <p className="price__amount">
                {p.price}
                <small>/ {p.unit}</small>
              </p>
              <p className="price__text">{p.text}</p>
              <ul>
                {p.items.map((it) => (
                  <li key={it}>
                    <span className="price__tick">✓</span> {it}
                  </li>
                ))}
              </ul>
              <button
                className={`btn ${p.featured ? 'btn--light' : 'btn--primary'} btn--block btn--sm`}
                onClick={() => chat.open('book', { concern: p.name, userText: `I’d like to book a ${p.name}` })}
              >
                Book {p.name}
              </button>
            </Tilt>
          </Reveal>
        ))}
      </div>
      <Reveal as="p" className="pricing__note" delay={0.2}>
        Procedure prices are quoted in writing after consultation. Insurance rebates available for
        most medical conditions.
      </Reveal>
    </section>
  );
}

export default function Treatments() {
  return (
    <Page title="Treatments">
      <PageHero
        label="Treatments"
        index="02"
        title={['Treatments that', '*actually* work.']}
        lead="Medical, surgical, aesthetic and hair care — every treatment chosen for evidence, performed by a dermatologist, and tailored to your skin."
        image={IMG.treatHero}
        shape="blob"
      >
        <div className="phero__pills">
          {SERVICES.map((s) => (
            <Link key={s.slug} to={`/treatments/${s.slug}`} className="pill-link">
              {s.title}
            </Link>
          ))}
        </div>
      </PageHero>
      <Catalog />
      <Specialities />
      <Conditions />
      <Pricing />
      <FAQ items={FAQS} />
      <ChatCTA title="Still not sure *which* one?" text="Tell Aura what’s bothering you and she’ll book you in with the right specialist." />
    </Page>
  );
}
