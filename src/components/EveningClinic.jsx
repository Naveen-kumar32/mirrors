import { CONTACT, DIRECTIONS, HOURS } from '../data';
import { useChat } from '../chat/ChatProvider';
import { Icon } from './ui';

/*
 * Home page: why the clinic is open 3 – 7 pm.
 * The clinic chose these hours on purpose — most clinics open in the morning, when people are at work or
 * college. 3 – 7 pm lets working professionals, students and anyone with a busy morning visit without
 * taking a day off. (These are the regular hours — appointments are booked as usual, online or by phone.)
 * Design: a full-width "dusk" band — the sky fades from deep navy to a warm horizon with a setting sun.
 * Message, who the hours suit, and Book / Call on the left; a frosted clock card with "3 – 7 pm" on the right.
 */
const FOR_WHOM = [
  { icon: 'briefcase', text: 'Working professionals' },
  { icon: 'cap', text: 'Students' },
  { icon: 'home', text: 'Busy mornings' },
];

// practical notes along the bottom of the section
const NOTES = [
  { icon: 'calendar', title: 'Book ahead', text: 'Pick a time online or give us a call.' },
  { icon: 'pin', title: 'Easy to reach', text: `${DIRECTIONS[0].text}.` },
  { icon: 'check', title: 'Parking', text: `${DIRECTIONS[1].text} near the clinic.` },
];
// the day bar runs 9 am – 9 pm (12 hours); clinic hours 3 – 7 pm sit at 50 % – 83.3 %
const DAY = [
  { t: '9 am', at: 0 },
  { t: '12 pm', at: 25 },
  { t: '3 pm', at: 50 },
  { t: '7 pm', at: 83.333 },
  { t: '9 pm', at: 100 },
];

export default function EveningClinic() {
  const chat = useChat();
  return (
    <section className="dusk" aria-labelledby="dusk-title">
      <span className="dusk__stars" aria-hidden="true" />
      <span className="dusk__sun" aria-hidden="true" />
      <span className="dusk__haze" aria-hidden="true" />

      <div className="container dusk__grid">
        <div className="dusk__body reveal">
          <p className="dusk__kicker">
            <Icon name="clock" size={16} /> Clinic hours
          </p>
          <h2 id="dusk-title" className="dusk__title">
            Hours that fit <em>Your day</em>
          </h2>
          <p className="dusk__text">
            We’re open from 3 to 7 pm, Monday to Saturday — an easy time to come in after college, after work or
            once the morning’s errands are done. No need to take a day off for a skin, hair or nail check-up.
          </p>
          <ul className="dusk__for">
            {FOR_WHOM.map((f) => (
              <li key={f.text}>
                <span>
                  <Icon name={f.icon} size={17} />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
          <div className="dusk__actions">
            <button className="btn dusk__call" onClick={() => chat.openBooking()}>
              Book appointment <Icon name="arrow" size={18} />
            </button>
            <a className="btn dusk__wa" href={CONTACT.phoneHref}>
              <Icon name="phone" size={18} /> Call {CONTACT.phone}
            </a>
          </div>
        </div>

        <div className="dusk__clock reveal" style={{ '--d': '150ms' }}>
          <span className="dusk__label">We’re open</span>
          <strong className="dusk__time">
            3–7<small>pm</small>
          </strong>
          <div className="dusk__day" aria-hidden="true">
            <div className="dusk__track">
              <span className="dusk__open">Open</span>
            </div>
            <div className="dusk__ticks">
              {DAY.map((d) => (
                <span key={d.t} style={{ left: `${d.at}%` }}>
                  {d.t}
                </span>
              ))}
            </div>
          </div>
          <ul className="dusk__hours">
            {HOURS.map((h) => (
              <li key={h.day} className={h.time === 'Holiday' ? 'is-off' : undefined}>
                <span>{h.day}</span>
                <b>{h.time}</b>
              </li>
            ))}
          </ul>
        </div>

        <ul className="dusk__notes">
          {NOTES.map((n, i) => (
            <li key={n.title} className="reveal" style={{ '--d': `${200 + i * 100}ms` }}>
              <span className="dusk__note-icon">
                <Icon name={n.icon} size={20} />
              </span>
              <div>
                <strong>{n.title}</strong>
                <p>{n.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
