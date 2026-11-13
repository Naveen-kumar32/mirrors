import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { BRAND } from '../data';
import { useChat } from '../chat/ChatProvider';
import { Icon } from './ui';

// `more: true` links sit in the ☰ drop-down next to "Book appointment" on big screens;
// on small screens (full-screen menu) and in the footer every link is listed as usual
export const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About', more: true },
  { to: '/treatments', label: 'Treatments' },
  { to: '/doctors', label: 'Our Doctor', more: true },
  { to: '/gallery', label: 'Gallery' },
  { to: '/reviews', label: 'Reviews', more: true },
  { to: '/blog', label: 'Blog' },
  { to: '/social', label: 'Social' },
  { to: '/faqs', label: 'FAQs', more: true },
  { to: '/contact', label: 'Contact' },
];
const MAIN_LINKS = LINKS.filter((l) => !l.more);
const MORE_LINKS = LINKS.filter((l) => l.more);

/* ☰ button + small drop-down with the "more" links (big screens only) */
function MoreMenu({ pathname }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const here = MORE_LINKS.some((l) => pathname.startsWith(l.to));

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const away = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="more" ref={ref}>
      <button
        className={`more__btn${open ? ' is-open' : ''}${here ? ' is-here' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="More pages"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Icon name={open ? 'close' : 'menu'} size={20} />
      </button>
      {open && (
        <nav className="more__panel" aria-label="More pages">
          {MORE_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="THE MIRRORS DERMATOLOGY CLINIC home">
      <img src={BRAND.logo} alt="" width="44" height="44" />
      <span>
        THE MIRRORS
        <small>DERMATOLOGY CLINIC</small>
      </span>
    </Link>
  );
}

export default function Header() {
  const chat = useChat();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  const book = () => {
    setOpen(false);
    chat.openBooking();
  };

  return (
    <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container header__inner">
        <Logo />
        <nav className="header__nav" aria-label="Main">
          {MAIN_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <MoreMenu pathname={pathname} />
        <button className="btn btn--navy header__book" onClick={book}>
          Book appointment
        </button>
        <button className="header__menu" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
          <Icon name="menu" size={24} />
        </button>
      </div>

      {/* Rendered into <body>: the scrolled header's blur would otherwise trap this
          full-screen menu inside the header's own height */}
      {open &&
        createPortal(
          <div className="menu" role="dialog" aria-modal="true" aria-label="Menu">
            <button className="menu__close" onClick={() => setOpen(false)} aria-label="Close menu">
              <Icon name="close" size={26} />
            </button>
            <div className="menu__inner">
              <nav aria-label="Mobile">
                {LINKS.map((l, i) => (
                  <NavLink key={l.to} to={l.to} end={l.to === '/'} style={{ '--i': i }}>
                    {l.label}
                  </NavLink>
                ))}
              </nav>
              <button className="btn btn--navy" onClick={book}>
                Book appointment
              </button>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
