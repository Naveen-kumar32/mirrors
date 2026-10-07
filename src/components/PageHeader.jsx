import { Link } from 'react-router-dom';
import { CONTACT, img } from '../data';
import { useChat } from '../chat/ChatProvider';
import { useGoogle, useReviewSummary } from '../backend';
import { Icon } from './ui';

const POINTS = [
  { icon: 'shield', text: 'Board-certified dermatologist' },
  { icon: 'clock', text: 'Mon – Sat · 3 – 7 pm' },
  { icon: 'check', text: 'Consultations by appointment' },
];

/*
 * Banner at the top of every inner page.
 * Left: breadcrumbs, title, text, actions. Right: a small photo collage
 * (main photo at its natural shape, a round inset photo and a rating card).
 */
// `image` is a built-in photo name (see IMG) or a full URL such as an uploaded blog cover
const src = (image, w) => (image.startsWith('/') || image.startsWith('http') ? image : img(image, w));

export default function PageHeader({ eyebrow, title, text, image, image2, crumbs = [], preset, cover = false }) {
  const chat = useChat();
  const site = useReviewSummary();
  const google = useGoogle();
  const reviews = google.has
    ? { average: google.rating, total: google.count, label: 'on Google' }
    : site && { ...site, label: site.total === 1 ? 'review' : 'reviews' };
  return (
    <section className={`phead ${cover ? 'phead--cover' : ''}`}>
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
              <img src={src(image, 1200)} alt="" fetchPriority="high" />
            </figure>
            {image2 && (
              <figure className="phead__inset">
                <img src={src(image2, 480)} alt="" />
              </figure>
            )}
            {reviews?.total > 0 && (
              <div className="phead__rating">
                <strong>{reviews.average.toFixed(1)}</strong>
                <span>
                  <span className="stars">★★★★★</span>
                  {reviews.total} {reviews.label}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
