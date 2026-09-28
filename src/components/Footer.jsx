import { Link } from 'react-router-dom';
import { CONTACT, HOURS } from '../data';
import { Icon } from './ui';
import { LINKS, Logo } from './Header';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Logo />
          <p>
            {CONTACT.address}, {CONTACT.area}
            <br />
            {HOURS[0].day}, {HOURS[0].time}
          </p>
        </div>
        <nav className="footer__nav" aria-label="Footer">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="footer__social">
          <a href={CONTACT.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
            <Icon name="instagram" />
          </a>
          <a href={CONTACT.phoneHref} aria-label="Call the clinic">
            <Icon name="phone" />
          </a>
          <a href={CONTACT.mapsHref} target="_blank" rel="noreferrer" aria-label="Directions">
            <Icon name="pin" />
          </a>
        </div>
      </div>
      <p className="footer__copy">© {new Date().getFullYear()} The Mirrors Dermatology Clinic, Coimbatore</p>
    </footer>
  );
}
