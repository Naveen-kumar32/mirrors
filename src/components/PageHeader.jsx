import { Link } from 'react-router-dom';
import { CONTACT, img } from '../data';
import { useChat } from '../chat/ChatProvider';
import { Icon } from './ui';

const POINTS = [
  { icon: 'shield', text: 'Board-certified doctors' },
  { icon: 'clock', text: 'Mon – Sat · 3 – 7 pm' },
  { icon: 'check', text: 'No referral needed' },
];

/*
 * Banner at the top of every inner page.
 * Left: breadcrumbs, title, text, actions. Right: a small photo collage
 * (main photo at its natural shape, a round inset photo and a rating card).
 */
export default function PageHeader({ eyebrow, title, text, image, image2, crumbs = [], preset }) {
  const chat = useChat();
  return (
    <section className="phead">
      <div className="container phead__grid">
        <div className="phead__content">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            {crumbs.map((c) => (
              <span key={c.to}>
                <span aria-hidden="true"> / </span>
                <Link to={c.to}>{c.label}</Link>
              </span>
            ))}
            <span aria-hidden="true"> / </span>
            <span aria-current="page">{eyebrow}</span>
          </nav>
          <h1 className="phead__title">{title}</h1>
          {text && <p className="phead__text">{text}</p>}
          <div className="phead__actions">
            <button className="btn btn--navy" onClick={() => chat.openBooking(preset)}>
              Book appointment <Icon name="arrow" size={18} />
            </button>
            <a className="phead__call" href={CONTACT.phoneHref}>
              <span>
                <Icon name="phone" size={18} />
              </span>
              {CONTACT.phone}
            </a>
          </div>
          <ul className="phead__points">
            {POINTS.map((p) => (
              <li key={p.text}>
                <Icon name={p.icon} size={16} /> {p.text}
              </li>
            ))}
          </ul>
        </div>

        {image && (
          <div className="phead__collage">
            <span className="phead__shape" aria-hidden="true" />
            <span className="phead__dots" aria-hidden="true" />
            <figure className="phead__main">
              <img src={img(image, 1200)} alt="" fetchPriority="high" />
            </figure>
            {image2 && (
              <figure className="phead__inset">
                <img src={img(image2, 480)} alt="" />
              </figure>
            )}
            <div className="phead__rating">
              <strong>4.9</strong>
              <span>
                <span className="stars">★★★★★</span>
                2,300+ reviews
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
