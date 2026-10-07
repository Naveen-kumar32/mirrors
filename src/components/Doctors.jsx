import { Link } from 'react-router-dom';
import { DOCTOR, TEAM, img } from '../data';
import { Eyebrow, Icon } from './ui';

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

function DoctorCard({ d, compact }) {
  return (
    <Link to={`/doctors#${d.initials.toLowerCase()}`} className={`docfeature reveal ${compact ? 'docfeature--compact' : ''}`}>
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
  );
}

/* Home page: meet the doctor(s) */
export default function Doctors() {
  const one = TEAM.length === 1;
  return (
    <section className="section">
      <div className="container">
        <header className="section__head">
          <Eyebrow>{one ? 'Our doctor' : 'Our doctors'}</Eyebrow>
          <h2 className="title reveal">
            Meet your <em>{one ? 'dermatologist' : 'dermatologists'}</em>
          </h2>
        </header>
        <div className={one ? '' : 'docgrid'}>
          {TEAM.map((d, i) => (
            <DoctorCard key={`${d.name}-${i}`} d={d} compact={!one} />
          ))}
        </div>
      </div>
    </section>
  );
}
