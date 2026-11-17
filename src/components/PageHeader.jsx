import { Link } from 'react-router-dom';
import { CONTACT, img } from '../data';
import { useChat } from '../chat/ChatProvider';
import { Icon } from './ui';

const POINTS = [
  { icon: 'shield', text: 'Board-certified dermatologist' },
  { icon: 'clock', text: 'Mon – Sat · 3 – 7 pm' },
  { icon: 'check', text: 'Consultations by appointment' },
];

/*
 * Banner at the top of every inner page — light "editorial" design, in the same spirit as the home hero:
 *   • a full-width cream banner; the photo fills the right side right up to the screen edge and
 *     melts softly into the cream behind the text (no hard frame)
 *   • left: breadcrumbs, a large navy title with one highlighted word, the intro, Book / Call
 *   • along the bottom: a frosted-glass strip with the clinic's three promises, floating over the photo
 * On phones the photo sits on top, fading into the cream where the text begins.
 */
// `image` is a built-in photo name (see IMG) or a full URL such as an uploaded blog cover
const src = (image, w) => (image.startsWith('/') || image.startsWith('http') ? image : img(image, w));

// `image` = EMPTY: keeps the photo area but shows a soft branded fill (logo watermark) until a photo is chosen.
// `background` (Contact page) is shown in the photo area the same way as `image`.
// No image at all: text only.
export const EMPTY = 'empty';
// `fit` = { bg: '#colour' }: show the whole image (no cropping) on that background colour — for graphics with text,
//   such as the blog word cloud, whose plain background then fills the rest of the photo area.
export default function PageHeader({ eyebrow, title, text, image, background, fit, crumbs = [], preset }) {
  const chat = useChat();
  const photo = image || background;
  const builtIn = photo && photo !== EMPTY && !photo.startsWith('/') && !photo.startsWith('http');

  return (
    <section className={`ph${photo ? '' : ' ph--text'}`}>
      {photo && (
        <div className="ph__media" aria-hidden="true">
          {photo === EMPTY ? (
            <div className="ph__empty" />
          ) : (
            <img
              className={fit ? 'is-fit' : undefined}
              style={fit ? { background: fit.bg } : undefined}
              src={src(photo, 1600)}
              srcSet={builtIn ? [480, 960, 1600].map((w) => `${img(photo, w)} ${w}w`).join(', ') : undefined}
              sizes="(max-width: 860px) 100vw, 62vw"
              alt=""
              fetchPriority="high"
            />
          )}
        </div>
      )}

      <div className="container ph__inner">
        <div className="ph__content">
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
        </div>

        <ul className="ph__points">
          {POINTS.map((p) => (
            <li key={p.text}>
              <Icon name={p.icon} size={16} />
              {p.text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
