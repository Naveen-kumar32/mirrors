import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { BRAND } from '../data';
import { useChat } from '../chat/ChatProvider';
import { Icon } from './ui';

export const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/treatments', label: 'Treatments' },
  { to: '/doctors', label: 'Our Doctor' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/blog', label: 'Blog' },
  { to: '/faqs', label: 'FAQs' },
  { to: '/contact', label: 'Contact' },
];

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="The Mirrors Dermatology Clinic home">
      <img src={BRAND.logo} alt="" width="44" height="44" />
      <span>
        The Mirrors
        <small>Dermatology Clinic</small>
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
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button className="btn btn--navy header__book" onClick={book}>
          Book appointment
        </button>
        <button className="header__menu" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
          <Icon name="menu" size={24} />
        </button>
      </div>

      {open && (
        <div className="menu" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="menu__close" onClick={() => setOpen(false)} aria-label="Close menu">
            <Icon name="close" size={26} />
          </button>
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
      )}
    </header>
  );
}
