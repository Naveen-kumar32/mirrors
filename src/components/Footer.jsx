import { Link } from 'react-router-dom';
import { BRAND, CONTACT, HOURS } from '../data';
import { Icon } from './ui';
import { LINKS, Logo } from './Header';

const POLICIES = [
  { to: '/policies#privacy', label: 'Privacy policy' },
  { to: '/policies#terms', label: 'Website terms' },
  { to: '/policies#disclaimer', label: 'Medical disclaimer' },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <Logo />
          <p className="site-footer__tagline">{BRAND.footer}</p>
          <div className="site-footer__social">
            <a href={CONTACT.instagram} target="_blank" rel="noreferrer" aria-label={`Instagram ${CONTACT.instagramHandle}`}>
              <Icon name="instagram" size={19} />
            </a>
            <a href={CONTACT.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
              <Icon name="facebook" size={19} />
            </a>
            <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp">
              <Icon name="whatsapp" size={19} />
            </a>
          </div>
        </div>

        <nav className="site-footer__col" aria-label="Footer">
          <p className="site-footer__title">Explore</p>
          <ul className="site-footer__links">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-footer__col">
          <p className="site-footer__title">Visit us</p>
          <a className="site-footer__line" href={CONTACT.mapsHref} target="_blank" rel="noreferrer">
            <Icon name="pin" size={17} />
            <span>
              {CONTACT.address}, {CONTACT.area}
            </span>
          </a>
          <p className="site-footer__line">
            <Icon name="clock" size={17} />
            <span>
              {HOURS.map((h) => (
                <span key={h.day} className="site-footer__hours">
                  {h.day}: {h.time}
                </span>
              ))}
            </span>
          </p>
        </div>

        <div className="site-footer__col">
          <p className="site-footer__title">Contact</p>
          <a className="site-footer__line" href={CONTACT.phoneHref}>
            <Icon name="phone" size={17} />
            <span>{CONTACT.phone}</span>
          </a>
          <a className="site-footer__line" href={CONTACT.whatsapp} target="_blank" rel="noreferrer">
            <Icon name="whatsapp" size={17} />
            <span>WhatsApp us</span>
          </a>
          <a className="site-footer__line" href={CONTACT.emailHref}>
            <Icon name="mail" size={17} />
            <span className="site-footer__email">{CONTACT.email}</span>
          </a>
        </div>
      </div>

      <div className="container site-footer__bottom">
        <p>© {new Date().getFullYear()} The Mirrors Dermatology Clinic, Coimbatore · Website in English</p>
        <nav aria-label="Policies">
          {POLICIES.map((p) => (
            <Link key={p.to} to={p.to}>
              {p.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
