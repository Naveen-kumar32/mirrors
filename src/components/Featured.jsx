import { Link } from 'react-router-dom';
import { FEATURED_TREATMENTS, WHY_US, img } from '../data';
import { Eyebrow, Icon } from './ui';

/* Home: "Why choose this clinic?" — one statement, not a list */
export function WhyChoose() {
  return (
    <section className="section section--sand">
      <div className="container why">
        <div className="why__head">
          <Eyebrow>Why choose this clinic?</Eyebrow>
          <h2 className="title reveal">
            Honest care, backed by <em>science</em>
          </h2>
        </div>
        <div className="why__body">
          <p className="why__statement reveal">{WHY_US}</p>
          <Link to="/doctors" className="text-link reveal">
            Meet the dermatologist <Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* Home: the clinic's featured treatments */
export function FeaturedTreatments() {
  return (
    <section className="section">
      <div className="container">
        <header className="section__head">
          <Eyebrow>Featured treatments</Eyebrow>
          <h2 className="title reveal">
            Care for <em>skin, hair</em> &amp; nails
          </h2>
        </header>
        <div className="treatments">
          {FEATURED_TREATMENTS.map((t, i) => {
            const body = (
              <>
                <span className="treatment__img">
                  <img src={img(t.image, 960)} alt="" loading="lazy" />
                </span>
                <span className="treatment__body">
                  <span className="treatment__title">{t.name}</span>
                  <span className="treatment__text">{t.text}</span>
                  <span className="treatment__link">
                    Learn more <Icon name="arrow" size={16} />
                  </span>
                </span>
              </>
            );
            const props = { className: 'treatment reveal', style: { '--d': `${(i % 3) * 120}ms` } };
            // Treatments without their own page link to the full treatments list
            return (
              <Link key={t.name} to={t.slug ? `/treatments/${t.slug}` : '/treatments'} {...props}>
                {body}
              </Link>
            );
          })}
        </div>
        <p className="section__more reveal">
          <Link to="/treatments" className="text-link">
            All treatments <Icon name="arrow" size={16} />
          </Link>
        </p>
      </div>
    </section>
  );
}
