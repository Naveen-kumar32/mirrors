import { CONTACT, HOURS } from '../data';
import { useChat } from '../chat/ChatProvider';
import { Eyebrow, Icon } from './ui';

export default function Contact() {
  const chat = useChat();
  return (
    <section className="section section--sand">
      <div className="container contact">
        <div className="contact__info">
          <Eyebrow>Visit us</Eyebrow>
          <h2 className="title reveal">
            Book your <em>visit</em>
          </h2>
          <p className="reveal">
            Book online in a minute, or call us during clinic hours. No referral needed.
          </p>

          <ul className="contact__list reveal">
            <li>
              <Icon name="pin" />
              <a href={CONTACT.mapsHref} target="_blank" rel="noreferrer">
                {CONTACT.address}, {CONTACT.area}
              </a>
            </li>
            <li>
              <Icon name="phone" />
              <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
            </li>
            <li>
              <Icon name="clock" />
              <span>
                {HOURS.map((h) => (
                  <span key={h.day} className="contact__hours">
                    {h.day}: <strong>{h.time}</strong>
                  </span>
                ))}
              </span>
            </li>
          </ul>

          <div className="contact__actions reveal">
            <button className="btn btn--navy" onClick={() => chat.openBooking()}>
              Book appointment <Icon name="arrow" size={18} />
            </button>
            <a className="btn btn--ghost" href={CONTACT.whatsapp} target="_blank" rel="noreferrer">
              WhatsApp us
            </a>
          </div>
        </div>

        <div className="contact__map reveal">
          <iframe
            title="Map showing The Mirrors Dermatology Clinic, Neelambur, Coimbatore"
            src={CONTACT.mapsEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
