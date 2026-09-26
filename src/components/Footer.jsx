import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { CONTACT, HOURS, NAV_LINKS, SERVICES } from '../data';
import { useChat } from '../chat/ChatProvider';
import { EASE, scrollToTop } from '../lib';
import { Icon, Magnetic } from './ui';
import { Logo } from './Chrome';

const WORD = 'Mirrors';

export default function Footer() {
  const ref = useRef(null);
  const chat = useChat();
  const [subscribed, setSubscribed] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-35%', '0%']);

  return (
    <footer className="footer" ref={ref}>
      <motion.div className="footer__inner" style={{ y }}>
        <div className="footer__top">
          <div className="footer__brand">
            <Link to="/" aria-label="The Mirrors home">
              <Logo light />
            </Link>
            <p>
              Medical, surgical and aesthetic dermatology — delivered with honesty, warmth and
              science.
            </p>
            {subscribed ? (
              <p className="footer__thanks">Thanks — look out for our next skin notes. ✨</p>
            ) : (
              <form
                className="footer__news"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubscribed(true);
                }}
              >
                <label htmlFor="news" className="sr-only">
                  Email for skin tips
                </label>
                <input id="news" type="email" required placeholder="Monthly skin notes, no spam" />
                <button aria-label="Subscribe">
                  <Icon name="arrow" size={18} />
                </button>
              </form>
            )}
            <button className="footer__chat" onClick={() => chat.open()}>
              <span className="pulse" /> Chat with Aura — online now
            </button>
          </div>
          <div className="footer__col">
            <h4>Explore</h4>
            {NAV_LINKS.map((l) => (
              <Link key={l.to} to={l.to}>
                {l.label}
              </Link>
            ))}
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer__col">
            <h4>Treatments</h4>
            {SERVICES.map((s) => (
              <Link key={s.slug} to={`/treatments/${s.slug}`}>
                {s.title}
              </Link>
            ))}
          </div>
          <div className="footer__col">
            <h4>Visit</h4>
            <p>
              {CONTACT.address}
              <br />
              {CONTACT.area}
            </p>
            <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
            <a href={CONTACT.instagram} target="_blank" rel="noreferrer">
              Instagram {CONTACT.instagramHandle}
            </a>
            <a href={CONTACT.mapsHref} target="_blank" rel="noreferrer">
              Get directions →
            </a>
            <h4 className="footer__h4-gap">Hours</h4>
            {HOURS.map((h) => (
              <p key={h.day}>
                {h.day} · {h.time}
              </p>
            ))}
          </div>
        </div>

        <div className="footer__giant" aria-hidden="true">
          {WORD.split('').map((ch, i) => (
            <span className="footer__mask" key={i}>
              <motion.span
                initial={{ y: '100%' }}
                whileInView={{ y: '0%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: EASE, delay: i * 0.06 }}
              >
                {ch}
              </motion.span>
            </span>
          ))}
        </div>

        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} The Mirrors Dermatology Clinic. All rights reserved.</p>
          <p className="footer__legal">
            <Link to="/contact">Privacy</Link>
            <Link to="/contact">Accessibility</Link>
          </p>
          <Magnetic>
            <button className="round-btn round-btn--light" onClick={scrollToTop} aria-label="Back to top">
              <Icon name="arrowUp" size={18} />
            </button>
          </Magnetic>
        </div>
      </motion.div>
    </footer>
  );
}
