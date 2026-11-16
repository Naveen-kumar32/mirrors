import { CONTACT } from '../data';
import { Icon } from './ui';

/*
 * Home page poster: special appointments after clinic hours (after 7 pm) for people who can't come
 * between 3 and 7 pm. These can't be booked online — patients call (or WhatsApp) the clinic to arrange.
 */
export default function EveningClinic() {
  return (
    <section className="section ahours-wrap">
      <div className="container">
        <article className="ahours reveal" aria-labelledby="ahours-title">
          {/* left: the poster's headline panel */}
          <div className="ahours__tag">
            <span className="ahours__icon" aria-hidden="true">
              <Icon name="moon" size={26} />
            </span>
            <p className="ahours__kicker">Special appointments</p>
            <p className="ahours__time">
              After <strong>7 pm</strong>
            </p>
            <p className="ahours__sub">Beyond regular clinic hours</p>
          </div>

          {/* right: what it is and how to get one */}
          <div className="ahours__body">
            <h2 id="ahours-title" className="ahours__title">
              Can’t make it during <em>clinic hours?</em>
            </h2>
            <p className="ahours__text">
              Our regular hours are 3 – 7 pm, Monday to Saturday. If that doesn’t work for you, we also offer
              <strong> special appointments after clinic hours</strong> — ideal for working professionals and college
              students, and open to anyone who needs it.
            </p>

            <ul className="ahours__for">
              <li>
                <Icon name="briefcase" size={16} /> Working professionals
              </li>
              <li>
                <Icon name="cap" size={16} /> College students
              </li>
              <li>
                <Icon name="check" size={16} /> Anyone who needs it
              </li>
            </ul>

            <p className="ahours__note">
              <Icon name="phone" size={15} /> Not available for online booking — please call us to arrange your
              appointment.
            </p>

            <div className="ahours__actions">
              <a className="btn btn--navy" href={CONTACT.phoneHref}>
                <Icon name="phone" size={18} /> Call {CONTACT.phone}
              </a>
              <a className="btn btn--ghost" href={CONTACT.whatsapp} target="_blank" rel="noreferrer">
                <Icon name="whatsapp" size={18} /> WhatsApp us
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
