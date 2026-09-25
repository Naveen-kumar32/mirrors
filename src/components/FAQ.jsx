import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChat } from '../chat/ChatProvider';
import { EASE } from '../lib';
import { Icon, Reveal, SectionLabel, SplitWords } from './ui';

export default function FAQ({ items, title = 'Questions, *answered*.', label = 'FAQ' }) {
  const [open, setOpen] = useState(0);
  const chat = useChat();

  return (
    <section className="faq section">
      <div className="faq__side">
        <SectionLabel>{label}</SectionLabel>
        <h2 className="h2">
          <SplitWords text={title} />
        </h2>
        <Reveal className="faq__ask" delay={0.2}>
          <p>Can’t find what you’re looking for?</p>
          <button className="btn btn--ghost btn--sm" onClick={() => chat.open('enquiry')}>
            <Icon name="chat" size={16} /> Ask our team
          </button>
        </Reveal>
      </div>
      <div className="faq__list">
        {items.map((f, i) => {
          const isOpen = open === i;
          return (
            <Reveal className={`faq__item ${isOpen ? 'is-open' : ''}`} key={f.q} delay={i * 0.05} y={24}>
              <button
                className="faq__q"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
              >
                <span>{f.q}</span>
                <span className="faq__icon">
                  <Icon name="plus" size={18} />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className="faq__a"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                  >
                    <p>{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
