import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
} from 'framer-motion';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { BRAND, CONTACT, NAV_LINKS } from '../data';
import { useChat } from '../chat/ChatProvider';
import { EASE, EASE_IN_OUT } from '../lib';
import { Magnetic } from './ui';

/* ---------- Preloader: counter + curtain wipe ---------- */
export function Preloader({ onDone }) {
  const [n, setN] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    let v = 0;
    let timeout;
    const id = setInterval(() => {
      v = Math.min(100, v + Math.ceil(Math.random() * 8));
      setN(v);
      if (v === 100) {
        clearInterval(id);
        timeout = setTimeout(() => done.current(), 500);
      }
    }, 40);
    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <motion.div
      className="preloader"
      initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      transition={{ duration: 1.1, ease: EASE_IN_OUT }}
    >
      <motion.div
        className="preloader__logo"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <motion.img
          className="preloader__mark"
          src={BRAND.logoWhite}
          alt=""
          initial={{ scale: 0.6, rotate: -90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 1.1, ease: EASE }}
        />
        The <em>Mirrors</em>
        <span>Dermatology Clinic · Coimbatore</span>
      </motion.div>
      <div className="preloader__count">{String(n).padStart(3, '0')}</div>
      <div className="preloader__bar">
        <span style={{ transform: `scaleX(${n / 100})` }} />
      </div>
    </motion.div>
  );
}

/* ---------- Custom cursor (fine pointers only) ---------- */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [variant, setVariant] = useState('default');
  const [label, setLabel] = useState('');
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const dx = useSpring(x, { stiffness: 900, damping: 50 });
  const dy = useSpring(y, { stiffness: 900, damping: 50 });
  const rx = useSpring(x, { stiffness: 170, damping: 22, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 170, damping: 22, mass: 0.6 });

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;
    setEnabled(true);
    document.documentElement.classList.add('has-cursor');

    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e) => {
      const t = e.target.closest?.('[data-cursor]');
      if (t) {
        setVariant(t.dataset.cursor);
        setLabel(t.dataset.cursorLabel || '');
      } else if (e.target.closest?.('a, button, [role="slider"], select, label')) {
        setVariant('link');
        setLabel('');
      } else {
        setVariant('default');
        setLabel('');
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerover', over);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      document.documentElement.classList.remove('has-cursor');
    };
  }, [x, y]);

  if (!enabled) return null;
  return (
    <>
      <motion.div className="cursor-dot" style={{ x: dx, y: dy }} aria-hidden="true" />
      <motion.div className="cursor-ring" style={{ x: rx, y: ry }} aria-hidden="true">
        <div className={`cursor-ring__inner is-${variant}`}>{label && <span>{label}</span>}</div>
      </motion.div>
    </>
  );
}

/* ---------- Scroll progress bar ---------- */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}

/* ---------- Film grain overlay ---------- */
export function Grain() {
  return <div className="grain" aria-hidden="true" />;
}

/* ---------- Navigation ---------- */
export function Logo({ light = false }) {
  return (
    <span className={`logo ${light ? 'logo--light' : ''}`}>
      <span className="logo__mark">
        <img className="logo__img logo__img--color" src={BRAND.logo} alt="" width="40" height="40" />
        <img className="logo__img logo__img--white" src={BRAND.logoWhite} alt="" width="40" height="40" />
      </span>
      <span className="logo__text">
        <span className="logo__name">
          The <em>Mirrors</em>
        </span>
        <span className="logo__sub">Dermatology Clinic</span>
      </span>
    </span>
  );
}

export function Nav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const chat = useChat();

  useMotionValueEvent(scrollY, 'change', (v) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(v > prev && v > 240);
    setScrolled(v > 40);
  });

  // Close the mobile menu and reveal the bar after navigating
  useEffect(() => {
    setOpen(false);
    setHidden(false);
  }, [pathname]);

  useEffect(() => {
    if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  const bookChat = () => {
    setOpen(false);
    chat.open('book');
  };

  return (
    <>
      <motion.header
        className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}
        animate={{ y: hidden && !open ? '-130%' : '0%' }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        <Link className="nav__logo" to="/" aria-label="The Mirrors Dermatology Clinic home">
          <Logo />
        </Link>
        <nav className="nav__links" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className="roll-link">
              <span data-text={l.label}>{l.label}</span>
            </NavLink>
          ))}
          <NavLink to="/contact" className="roll-link">
            <span data-text="Contact">Contact</span>
          </NavLink>
        </nav>
        <Magnetic className="nav__cta">
          <button onClick={bookChat} className="btn btn--dark btn--sm">
            Book a visit
          </button>
        </Magnetic>
        <button
          className={`burger ${open ? 'is-open' : ''}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
        </button>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu"
            initial={{ clipPath: 'circle(0% at 92% 4%)' }}
            animate={{ clipPath: 'circle(150% at 92% 4%)' }}
            exit={{ clipPath: 'circle(0% at 92% 4%)' }}
            transition={{ duration: 0.8, ease: EASE_IN_OUT }}
          >
            <div className="mobile-menu__blob" />
            <nav aria-label="Mobile">
              {[{ to: '/', label: 'Home' }, ...NAV_LINKS, { to: '/contact', label: 'Contact' }].map((l, i) => (
                <div className="mobile-menu__mask" key={l.to}>
                  <motion.div
                    initial={{ y: '110%' }}
                    animate={{ y: '0%' }}
                    exit={{ y: '110%' }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.25 + i * 0.05 }}
                  >
                    <NavLink to={l.to} end={l.to === '/'}>
                      <small>0{i + 1}</small>
                      {l.label}
                    </NavLink>
                  </motion.div>
                </div>
              ))}
            </nav>
            <motion.div
              className="mobile-menu__foot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.7 } }}
              exit={{ opacity: 0 }}
            >
              <button className="btn btn--light btn--sm" onClick={bookChat}>
                Book via chat
              </button>
              <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
