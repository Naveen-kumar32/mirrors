import { Link } from 'react-router-dom';
import { TEAM, img } from '../data';
import { Eyebrow, Icon } from './ui';

export default function Doctors() {
  return (
    <section className="section">
      <div className="container">
        <header className="section__head">
          <Eyebrow>Our doctors</Eyebrow>
          <h2 className="title reveal">
            Meet your <em>specialists</em>
          </h2>
        </header>
        <div className="doctors">
          {TEAM.map((d, i) => (
            <Link to="/doctors" key={d.name} className="doctor reveal" style={{ '--d': `${i * 120}ms` }}>
              <div className="doctor__photo">
                <img src={img(d.image, 480)} alt={`Portrait of ${d.name}`} loading="lazy" />
              </div>
              <h3>{d.name}</h3>
              <p>{d.role}</p>
            </Link>
          ))}
        </div>
        <p className="section__more reveal">
          <Link to="/doctors" className="text-link">
            View all profiles <Icon name="arrow" size={16} />
          </Link>
        </p>
      </div>
    </section>
  );
}
