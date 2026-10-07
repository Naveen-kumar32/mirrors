import { Link } from 'react-router-dom';
import { ABOUT_FULL, ABOUT_INTRO, ABOUT_LINE, IMG, img } from '../data';
import { Eyebrow, Icon, Rich } from './ui';

/* Clinic introduction: short on the home page, the clinic's full text with `full` (About page) */
export default function About({ link = false, full = false }) {
  return (
    <section className="section about">
      <div className="container about__grid">
        <div className="about__media reveal">
          <img src={img(IMG.aboutHero, 1200)} alt="" loading="lazy" />
          <div className="about__badge">
            <strong>10+</strong>
            <span>years of experience</span>
          </div>
        </div>
        <div className="about__text">
          <Eyebrow>About the clinic</Eyebrow>
          <h2 className="title reveal">
            Honest, scientific
            <br />
            <em>dermatological</em> care.
          </h2>
          {full ? (
            ABOUT_FULL.map((p) => (
              <p key={p} className="reveal">
                <Rich text={p} />
              </p>
            ))
          ) : (
            <p className="reveal">{ABOUT_INTRO}</p>
          )}
          <p className="about__line reveal">{ABOUT_LINE}</p>
          {link && (
            <Link to="/about" className="text-link reveal">
              More about us <Icon name="arrow" size={16} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
