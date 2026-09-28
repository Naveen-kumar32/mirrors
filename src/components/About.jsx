import { Link } from 'react-router-dom';
import { IMG, img } from '../data';
import { Eyebrow, Icon } from './ui';

const POINTS = [
  { icon: 'shield', text: 'Board-certified dermatologists only' },
  { icon: 'plan', text: 'A clear, written plan for every patient' },
  { icon: 'check', text: 'Safe for every skin type and tone' },
];

export default function About({ link = false }) {
  return (
    <section className="section about">
      <div className="container about__grid">
        <div className="about__media reveal">
          <img src={img(IMG.aboutHero, 1200)} alt="Inside The Mirrors clinic" loading="lazy" />
          <div className="about__badge">
            <strong>16+</strong>
            <span>years of care</span>
          </div>
        </div>
        <div className="about__text">
          <Eyebrow>About the clinic</Eyebrow>
          <h2 className="title reveal">
            Honest advice.
            <br />
            <em>Visible</em> results.
          </h2>
          <p className="reveal">
            At The Mirrors, every treatment starts with a proper diagnosis — not a product. We take the
            time to understand your skin and explain every option clearly.
          </p>
          <ul className="about__points">
            {POINTS.map((p, i) => (
              <li key={p.text} className="reveal" style={{ '--d': `${i * 100}ms` }}>
                <span>
                  <Icon name={p.icon} size={18} />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
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
