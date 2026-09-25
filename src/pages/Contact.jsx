import Page from '../components/Page';
import PageHero from '../components/PageHero';
import Booking from '../components/Booking';
import FAQ from '../components/FAQ';
import { CONTACT, FAQS, HOURS, IMG } from '../data';
import { useChat } from '../chat/ChatProvider';
import { Icon, Reveal, SectionLabel, SplitWords, Tilt } from '../components/ui';

function Methods() {
  const chat = useChat();
  const today = new Date().getDay();
  const openNow = today !== 0;

  return (
    <section className="methods section">
      <div className="methods__grid">
        <Reveal className="method method--chat" delay={0}>
          <Tilt className="method__inner" max={5}>
            <span className="live">
              <span className="pulse" /> Online now
            </span>
            <span className="aura-avatar" style={{ width: 64, height: 64 }}>
              <span>a</span>
            </span>
            <h3>Chat with Aura</h3>
            <p>Book an appointment, request a call back or ask a question. Available 24/7 — replies instantly.</p>
            <div className="method__btns">
              <button className="btn btn--light btn--sm" onClick={() => chat.open('book')}>
                Book via chat
              </button>
              <button className="btn btn--ghost-light btn--sm" onClick={() => chat.open('callback')}>
                Request a call back
              </button>
            </div>
          </Tilt>
        </Reveal>

        <Reveal className="method method--call" delay={0.08}>
          <a href={CONTACT.phoneHref} className="method__inner">
            <span className="method__icon">
              <Icon name="phone" size={22} />
            </span>
            <h3>Call us</h3>
            <p>{CONTACT.phone}</p>
            <span className="method__meta">{openNow ? 'Open today, 3 – 7 pm' : 'Closed today — chat is open'}</span>
          </a>
        </Reveal>

        <Reveal className="method method--mail" delay={0.16}>
          <a href={CONTACT.instagram} target="_blank" rel="noreferrer" className="method__inner">
            <span className="method__icon">
              <Icon name="instagram" size={22} />
            </span>
            <h3>Instagram</h3>
            <p>{CONTACT.instagramHandle}</p>
            <span className="method__meta">Follow for skin tips & updates</span>
          </a>
        </Reveal>

        <Reveal className="method method--wa" delay={0.24}>
          <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer" className="method__inner">
            <span className="method__icon">
              <Icon name="chat" size={22} />
            </span>
            <h3>WhatsApp</h3>
            <p>Message our care team</p>
            <span className="method__meta">Mon – Sat, 3 – 7 pm</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}

function MapEmbed() {
  return (
    <iframe
      className="map"
      title="Map showing Mirrors Dema Dermatology Clinic, Neelambur, Coimbatore"
      src={CONTACT.mapsEmbed}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}

function Location() {
  return (
    <section className="location section">
      <div className="location__grid">
        <Reveal className="location__map" y={60}>
          <MapEmbed />
          <div className="location__card glass">
            <strong>Mirrors Dema Dermatology Clinic</strong>
            <span>{CONTACT.address}</span>
            <span>{CONTACT.area}</span>
            <a href={CONTACT.mapsHref} target="_blank" rel="noreferrer" className="text-link">
              Get directions <Icon name="arrow" size={15} />
            </a>
          </div>
        </Reveal>
        <div className="location__info">
          <SectionLabel>Visit us</SectionLabel>
          <h2 className="h2">
            <SplitWords text="Easy to find, *hard* to leave." />
          </h2>
          <Reveal className="hours" delay={0.1}>
            {HOURS.map((h) => (
              <div className="hours__row" key={h.day}>
                <span>{h.day}</span>
                <strong>{h.time}</strong>
              </div>
            ))}
          </Reveal>
          <Reveal className="getting" delay={0.2}>
            <p>
              <Icon name="pin" size={18} /> First floor, 1/95D, Avinashi Road, Neelambur, Coimbatore 641062
            </p>
            <p>
              <Icon name="phone" size={18} /> <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
            </p>
            <p>
              <Icon name="clock" size={18} /> Evening clinic — Monday to Saturday, 3 – 7 pm
            </p>
            <a href={CONTACT.mapsHref} target="_blank" rel="noreferrer" className="btn btn--primary btn--sm getting__btn">
              <Icon name="pin" size={16} /> Open in Google Maps
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default function Contact() {
  return (
    <Page title="Contact">
      <PageHero
        label="Contact"
        index="07"
        title={['Let’s talk', '*skin.*']}
        lead="Book an appointment, ask a question or just say hello. Choose whatever’s easiest — our care team is here to help."
        image={IMG.reception}
        shape="blob"
      />
      <Methods />
      <Booking />
      <Location />
      <FAQ items={FAQS} />
    </Page>
  );
}
