import { Link } from 'react-router-dom';
import { DOCTOR, img } from '../data';
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

/* Home page: meet the doctor */
export default function Doctors() {
  const d = DOCTOR;
  return (
    <section className="section">
      <div className="container">
        <header className="section__head">
          <Eyebrow>Our doctor</Eyebrow>
          <h2 className="title reveal">
            Meet your <em>dermatologist</em>
          </h2>
        </header>
        <Link to="/doctors" className="docfeature reveal">
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

