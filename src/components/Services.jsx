import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SERVICES, img } from '../data';
import { useChat } from '../chat/ChatProvider';
import { Icon, Reveal, SectionLabel, SplitWords } from './ui';

function StackCard({ s, i, total, progress }) {
  const ref = useRef(null);
  const chat = useChat();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.5, 1]);
  const targetScale = 1 - (total - i) * 0.035;
  const scale = useTransform(progress, [i / total, 1], [1, targetScale]);

  return (
    <div className="stack__wrap" ref={ref}>
      <motion.article
        className="stack__card"
        style={{
          scale,
          top: `calc(-4vh + ${i * 26}px)`,
          '--card-bg': s.bg,
          '--card-fg': s.fg,
          '--card-accent': s.accent,
        }}
      >
        <div className="stack__body">
          <div className="stack__head">
            <span className="stack__no">{s.no}</span>
            <span className="stack__count">
              / 0{total}
            </span>
          </div>
          <h3 className="stack__title">{s.title}</h3>
          <p className="stack__text">{s.text}</p>
          <ul className="stack__tags">
            {s.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div className="stack__actions">
            <Link className="stack__link" to={`/treatments/${s.slug}`}>
              <span>Explore treatment</span>
              <span className="stack__link-icon">
                <Icon name="arrow" size={18} />
              </span>
            </Link>
            <button
              className="stack__book"
              onClick={() => chat.open('book', { concern: s.title, userText: `I’d like to book ${s.title}` })}
            >
              Book via chat
            </button>
          </div>
        </div>
        <Link to={`/treatments/${s.slug}`} className="stack__media" data-cursor="view" data-cursor-label="Explore" aria-label={`Explore ${s.title}`}>
          <motion.img src={img(s.image, 1000)} alt="" loading="lazy" style={{ scale: imgScale }} />
        </Link>
      </motion.article>
    </div>
  );
}

export default function Services() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  return (
    <section className="services" id="services">
      <div className="services__intro section">
        <SectionLabel>Treatments</SectionLabel>
        <div className="services__intro-row">
          <h2 className="h2">
            <SplitWords text="Six specialities. *One* standard of care." />
          </h2>
          <Reveal className="services__intro-side" delay={0.2}>
            <p className="lead">
              From medical conditions to aesthetic goals, every treatment is led by a specialist
              dermatologist — not a salesperson.
            </p>
            <Link to="/treatments" className="text-link">
              View all treatments <Icon name="arrow" size={16} />
            </Link>
          </Reveal>
        </div>
      </div>
      <div className="stack" ref={ref}>
        {SERVICES.map((s, i) => (
          <StackCard key={s.no} s={s} i={i} total={SERVICES.length} progress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}
