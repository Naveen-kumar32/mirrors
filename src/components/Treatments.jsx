import { Link } from 'react-router-dom';
import { SERVICES, img } from '../data';
import { Eyebrow, Icon } from './ui';

export function TreatmentCard({ s, i = 0 }) {
  return (
    <Link to={`/treatments/${s.slug}`} className="treatment reveal" style={{ '--d': `${(i % 3) * 120}ms` }}>
      <span className="treatment__img">
        <img src={img(s.image, 960)} alt="" loading="lazy" />
      </span>
      <span className="treatment__body">
        <span className="treatment__title">{s.title}</span>
        <span className="treatment__text">{s.short}</span>
        <span className="treatment__link">
          Learn more <Icon name="arrow" size={16} />
        </span>
      </span>
    </Link>
  );
}

export default function Treatments({ items = SERVICES, heading = true }) {
  return (
    <section className="section section--sand">
      <div className="container">
        {heading && (
          <header className="section__head">
            <Eyebrow>Treatments</Eyebrow>
            <h2 className="title reveal">
              Care for <em>skin, hair</em> &amp; nails
            </h2>
          </header>
        )}
        <div className="treatments">
          {items.map((s, i) => (
            <TreatmentCard key={s.slug} s={s} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
