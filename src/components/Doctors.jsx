import { Link } from 'react-router-dom';
import { DOCTOR, img } from '../data';
import { useChat } from '../chat/ChatProvider';
import { Eyebrow, Icon, Rich } from './ui';

/* The doctor's full profile — shown on the About page under "Meet your dermatologist" */
export function DoctorProfile({ doctor: d = DOCTOR }) {
  const chat = useChat();
  const facts = [
    ['Qualifications', d.qualifications],
    ['Registration', d.registration],
    ['Memberships', d.memberships],
    ['Languages', d.languages],
    ['Consultations', d.schedule],
  ].filter(([, v]) => v && v.length);

  return (
    <article className="profile reveal">
      <div className="profile__photo">
        <DoctorPhoto doctor={d} />
      </div>
      <div className="profile__body">
        <p className="eyebrow">{d.role}</p>
        <h3 className="title">{d.name}</h3>
        <p className="profile__quals">{d.qualifications.join(' · ')}</p>
        {d.bio.map((p) => (
          <p key={p}>
            <Rich text={p} />
          </p>
        ))}
        <ul className="profile__tags">
          {d.specialties.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <dl className="profile__facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{Array.isArray(value) ? value.map((v) => <span key={v}>{v}</span>) : value}</dd>
            </div>
          ))}
        </dl>
        <div className="profile__actions">
          <button className="btn btn--navy" onClick={() => chat.openBooking()}>
            Book an appointment <Icon name="arrow" size={18} />
          </button>
          {d.instagram && (
            <a className="btn btn--ghost" href={d.instagram} target="_blank" rel="noreferrer">
              <Icon name="instagram" size={18} /> {d.instagramHandle}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/* Doctor's photo, or their initials until the portrait is supplied */
export function DoctorPhoto({ doctor = DOCTOR, size = 960 }) {
  return doctor.image ? (
    <img src={img(doctor.image, size)} alt={`Portrait of ${doctor.name}`} loading="lazy" />
  ) : (
    <span className="monogram" role="img" aria-label={doctor.name}>
      {doctor.initials}
    </span>
  );
}

/* Home page: meet the doctor */
export default function Doctors() {
  const d = DOCTOR;
  return (
    <section className="section docsec">
      <div className="container">
        <header className="section__head">
          <Eyebrow>Our doctor</Eyebrow>
          <h2 className="title reveal">
            Meet your <em>dermatologist</em>
          </h2>
        </header>
        <Link to="/about#doctor" className="docfeature reveal">
          <span className="docfeature__photo">
            <DoctorPhoto doctor={d} size={480} />
          </span>
          <span className="docfeature__body">
            <span className="eyebrow">{d.role}</span>
            <span className="docfeature__name">{d.name}</span>
            <span className="docfeature__quals">{d.qualifications.join(' · ')}</span>
            {d.years && (
              <span className="docfeature__meta">
                {d.years} years’ experience · {d.languages}
              </span>
            )}
            <span className="treatment__link">
              View profile <Icon name="arrow" size={16} />
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}

