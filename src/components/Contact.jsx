import { CONTACT, COORDINATOR, DIRECTIONS, HOURS, HOURS_NOTE } from '../data';
import { useChat } from '../chat/ChatProvider';
import { Eyebrow, Icon } from './ui';
import ClinicStatus from './ClinicStatus';

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
            Call or WhatsApp us, or book online. The doctor sees patients by appointment, so please book ahead.
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
              <Icon name="chat" />
              <span>
                <span className="contact__hours">
                  {COORDINATOR.role}: <strong>{COORDINATOR.name}, {COORDINATOR.title}</strong>
                </span>
                <span className="contact__note">Calls, WhatsApp messages and email enquiries are handled by our staff.</span>
              </span>
            </li>
            <li>
              <Icon name="mail" />
              <a href={CONTACT.emailHref}>{CONTACT.email}</a>
            </li>
            <li>
              <Icon name="clock" />
              <span>
                {HOURS.map((h) => (
                  <span key={h.day} className="contact__hours">
                    {h.day}: <strong>{h.time}</strong>
                  </span>
                ))}
                <ClinicStatus note={false} className="contact__status" />
                <span className="contact__note">{HOURS_NOTE}</span>
              </span>
            </li>
          </ul>

          <div className="contact__actions reveal">
            <button className="btn btn--navy" onClick={() => chat.openBooking()}>
              Book appointment <Icon name="arrow" size={18} />
            </button>
            <a className="btn btn--ghost" href={CONTACT.whatsapp} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" size={18} /> WhatsApp us
            </a>
          </div>

          <div className="contact__getting reveal">
            <p className="contact__getting-title">Getting here</p>
            <ul>
              {DIRECTIONS.map((d) => (
                <li key={d.label}>
                  <strong>{d.label}:</strong> {d.text}
                </li>
              ))}
            </ul>
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
