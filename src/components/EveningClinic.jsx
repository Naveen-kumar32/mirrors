import { CONTACT } from '../data';
import { Icon } from './ui';

/*
 * Home page: evening appointments after clinic hours (after 7 pm) for people who can't come
 * between 3 and 7 pm. These can't be booked online — patients call (or WhatsApp) the clinic to arrange.
 * Design: a full-width "dusk" band — the sky fades from deep navy to a warm horizon with a setting sun
 * glowing in the corner. Message and buttons on the left; on the right a frosted "clock" card with a
 * large 7 pm and the regular vs evening hours.
 */
export default function EveningClinic() {
  return (
    <section className="dusk" aria-labelledby="dusk-title">
      <span className="dusk__stars" aria-hidden="true" />
      <span className="dusk__sun" aria-hidden="true" />
      <span className="dusk__haze" aria-hidden="true" />

      <div className="container dusk__grid">
        <div className="dusk__body reveal">
          <p className="dusk__kicker">
            <Icon name="moon" size={16} /> Evening appointments
          </p>
          <h2 id="dusk-title" className="dusk__title">
            Your day ends late? <em>So can your visit.</em>
          </h2>
          <p className="dusk__text">
            Work, college and family don’t always leave room for a clinic visit. Call us and we’ll arrange a time
            after our regular hours — your skin, hair and nail care doesn’t have to wait for a day off.
          </p>
          <div className="dusk__actions">
            <a className="btn dusk__call" href={CONTACT.phoneHref}>
              <Icon name="phone" size={18} /> Call {CONTACT.phone}
            </a>
            <a className="btn dusk__wa" href={CONTACT.whatsapp} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" size={18} /> WhatsApp us
            </a>
          </div>
          <p className="dusk__note">Arranged by phone or WhatsApp only — not through online booking.</p>
        </div>

        <div className="dusk__clock reveal" style={{ '--d': '150ms' }}>
          <span className="dusk__label">Evening appointments from</span>
          <strong className="dusk__time">
            7<small>pm</small>
          </strong>
          <ul className="dusk__hours">
            <li>
              <span>Regular hours</span>
              <b>Mon – Sat · 3 – 7 pm</b>
            </li>
            <li className="is-evening">
              <span>After hours</span>
              <b>By prior arrangement</b>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
