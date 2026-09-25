import { motion } from 'framer-motion';
import { CONTACT } from '../data';
import { nextOpenDays } from '../api';
import { useChat } from '../chat/ChatProvider';
import { EASE } from '../lib';
import { Icon, Magnetic, Reveal, SectionLabel, SplitWords } from './ui';

const PREVIEW = [
  { from: 'bot', text: 'Hi! I’m Aura 👋 How can I help today?' },
  { from: 'user', text: 'I’d like to book a skin check' },
  { from: 'bot', text: 'Lovely — which day works best for you?' },
];

/* Closing band on every page: pushes visitors into the chat booking flow */
export default function ChatCTA({
  title = 'Not sure where to *start?*',
  text = 'Chat with Aura, our care assistant. Book an appointment, request a call back or ask a question — any time, day or night.',
  intent = 'book',
  preset,
  button = 'Chat with Aura',
}) {
  const chat = useChat();
  return (
    <section className="cta">
      <div className="aurora aurora--book" aria-hidden="true">
        <span className="aurora__blob a1" />
        <span className="aurora__blob a2" />
        <span className="aurora__blob a3" />
      </div>
      <div className="cta__inner">
        <div className="cta__text">
          <SectionLabel light>Book in a minute</SectionLabel>
          <h2 className="h2">
            <SplitWords text={title} />
          </h2>
          <Reveal as="p" className="lead" delay={0.15}>
            {text}
          </Reveal>
          <Reveal className="cta__btns" delay={0.25}>
            <Magnetic>
              <button className="btn btn--light" onClick={() => chat.open(intent, preset)}>
                {button}
                <span className="btn__icon">
                  <Icon name="chat" size={17} />
                </span>
              </button>
            </Magnetic>
            <a className="btn btn--ghost-light" href={CONTACT.phoneHref}>
              <Icon name="phone" size={17} /> {CONTACT.phone}
            </a>
          </Reveal>
        </div>

        <motion.div
          className="cta__phone glass"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-15%' }}
          variants={{ show: { transition: { staggerChildren: 0.7, delayChildren: 0.3 } } }}
          onClick={() => chat.open()}
          data-cursor="view"
          data-cursor-label="Chat"
        >
          <div className="cta__phone-head">
            <span className="aura-avatar" style={{ width: 38, height: 38 }}>
              <span>a</span>
            </span>
            <div>
              <strong>Aura</strong>
              <span>
                <span className="pulse" /> Online now
              </span>
            </div>
          </div>
          {PREVIEW.map((m, i) => (
            <motion.p
              key={i}
              className={`cta__bubble cta__bubble--${m.from}`}
              variants={{ hidden: { opacity: 0, y: 16, scale: 0.9 }, show: { opacity: 1, y: 0, scale: 1 } }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              {m.text}
            </motion.p>
          ))}
          <motion.div
            className="cta__chips"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
          >
            {nextOpenDays(3).map((d) => (
              <span key={d.value}>{d.label}</span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
