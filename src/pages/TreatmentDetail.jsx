import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Page from '../components/Page';
import PageHero from '../components/PageHero';
import FAQ from '../components/FAQ';
import ChatCTA from '../components/ChatCTA';
import { SERVICES, TEAM, img } from '../data';
import { useChat } from '../chat/ChatProvider';
import { Icon, Magnetic, ParallaxImage, Reveal, SectionLabel, SplitWords } from '../components/ui';
import NotFound from './NotFound';

const LEAD_DOCTOR = {
  'medical-dermatology': 0,
  'skin-cancer': 1,
  'laser-resurfacing': 2,
  'peels-facials': 2,
  'age-well-aesthetics': 2,
  'hair-scalp': 3,
};

function Facts({ s }) {
  const facts = [
    { label: 'Treatment time', value: s.facts.duration, icon: 'clock' },
    { label: 'Downtime', value: s.facts.downtime, icon: 'leaf' },
    { label: 'Sessions', value: s.facts.sessions, icon: 'plan' },
    { label: 'Starting from', value: s.facts.from, icon: 'spark' },
  ];
  return (
    <section className="facts">
      {facts.map((f, i) => (
        <Reveal className="fact" key={f.label} delay={i * 0.08}>
          <span className="fact__icon">
            <Icon name={f.icon} size={20} />
          </span>
          <span className="fact__label">{f.label}</span>
          <strong>{f.value}</strong>
        </Reveal>
      ))}
    </section>
  );
}

function Overview({ s }) {
  return (
    <section className="overview section">
      <div className="overview__text">
        <SectionLabel>Overview</SectionLabel>
        <h2 className="h2">
          <SplitWords text={`Why choose *Mirrors* *Dema* for ${s.title.toLowerCase()}?`} />
        </h2>
        <Reveal as="p" className="overview__lead" delay={0.1}>
          {s.overview}
        </Reveal>
        <Reveal className="overview__conds" delay={0.2}>
          <h3>What we treat</h3>
          <ul>
            {s.conditions.map((c) => (
              <li key={c}>
                <span className="tick">✓</span>
                {c}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
      <div className="overview__media">
        <ParallaxImage src={img(s.image2, 1000)} alt="" className="overview__img" speed={0.12} />
        <motion.div
          className="overview__badge clay-pill"
          initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
          whileInView={{ opacity: 1, scale: 1, rotate: -4 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.5 }}
        >
          <Icon name="shield" size={16} /> Dermatologist-led
        </motion.div>
      </div>
    </section>
  );
}

function Expect({ s }) {
  return (
    <section className="expect section">
      <div className="expect__side">
        <SectionLabel light>What to expect</SectionLabel>
        <h2 className="h2">
          <SplitWords text="Step by step, *no* surprises." />
        </h2>
      </div>
      <ol className="expect__list">
        {s.expect.map((e, i) => (
          <Reveal as="li" key={e.title} className="expect__step" delay={i * 0.06} y={50}>
            <span className="expect__no">0{i + 1}</span>
            <div>
              <h3>{e.title}</h3>
              <p>{e.text}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

function DoctorQuote({ s }) {
  const d = TEAM[LEAD_DOCTOR[s.slug]];
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-15%', '15%']);
  return (
    <section className="dquote" ref={ref}>
      <motion.img className="dquote__bg" src={img(s.image, 1600)} alt="" style={{ y }} />
      <div className="dquote__card glass">
        <img src={img(d.image, 300)} alt={d.name} className="dquote__img" />
        <blockquote>
          <SplitWords text={`“${d.quote}”`} stagger={0.04} />
        </blockquote>
        <p>
          <strong>{d.name}</strong> · {d.role}
        </p>
        <Link to="/specialists" className="text-link">
          Meet the team <Icon name="arrow" size={16} />
        </Link>
      </div>
    </section>
  );
}

function Related({ s }) {
  const idx = SERVICES.findIndex((x) => x.slug === s.slug);
  const others = [1, 2, 3].map((k) => SERVICES[(idx + k) % SERVICES.length]);
  const next = SERVICES[(idx + 1) % SERVICES.length];
  return (
    <section className="related section">
      <div className="related__head">
        <SectionLabel>Explore more</SectionLabel>
        <h2 className="h2">
          <SplitWords text="Related *treatments*." />
        </h2>
      </div>
      <div className="related__grid">
        {others.map((o, i) => (
          <Reveal key={o.slug} delay={i * 0.1}>
            <Link to={`/treatments/${o.slug}`} className="rcard" style={{ '--card-bg': o.bg, '--card-fg': o.fg }} data-cursor="view" data-cursor-label="View">
              <div className="rcard__img">
                <img src={img(o.image, 700)} alt="" loading="lazy" />
              </div>
              <span className="rcard__no">{o.no}</span>
              <h3>{o.title}</h3>
              <p>{o.short}</p>
            </Link>
          </Reveal>
        ))}
      </div>
      <Link to={`/treatments/${next.slug}`} className="next-link">
        <span>Next treatment</span>
        <strong>{next.title}</strong>
        <Icon name="arrow" size={28} />
      </Link>
    </section>
  );
}

export default function TreatmentDetail() {
  const { slug } = useParams();
  const chat = useChat();
  const s = SERVICES.find((x) => x.slug === slug);
  if (!s) return <NotFound />;

  const [firstWord, ...rest] = s.title.split(' ');
  return (
    <Page title={s.title}>
      <div style={{ '--theme': s.bg, '--theme-fg': s.fg, '--theme-accent': s.accent }}>
        <PageHero
          label={s.title}
          index={s.no}
          crumbs={[{ to: '/treatments', label: 'Treatments' }]}
          title={[firstWord, rest.map((w) => `*${w}*`).join(' ')]}
          lead={s.text}
          image={s.image}
          shape={['blob', 'arch', 'circle', 'tilted', 'arch', 'blob'][Number(s.no) - 1]}
        >
          <div className="phero__ctas">
            <Magnetic>
              <button
                className="btn btn--primary"
                onClick={() => chat.open('book', { concern: s.title, userText: `I’d like to book ${s.title}` })}
              >
                Book via chat
                <span className="btn__icon">
                  <Icon name="chat" size={17} />
                </span>
              </button>
            </Magnetic>
            <Link to="/contact" className="btn btn--ghost">
              Contact the clinic
            </Link>
          </div>
        </PageHero>
        <Facts s={s} />
        <Overview s={s} />
        <Expect s={s} />
        <DoctorQuote s={s} />
        <FAQ items={s.faqs} title={`${s.title}, *answered*.`} />
        <Related s={s} />
        <ChatCTA
          title={`Ready to *start?*`}
          text={`Aura can book your ${s.title.toLowerCase()} appointment in about a minute — or arrange a call back if you have questions first.`}
          preset={{ concern: s.title, userText: `I’d like to book ${s.title}` }}
          button={`Book ${s.title}`}
        />
      </div>
    </Page>
  );
}
