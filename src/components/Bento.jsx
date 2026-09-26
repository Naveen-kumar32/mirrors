import { motion } from 'framer-motion';
import { IMG, img } from '../data';
import { Counter, Icon, Reveal, SectionLabel, SplitWords, Stars, Tilt } from './ui';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S'];
const OPEN = [false, true, true, false, true, true];

export default function Bento() {
  return (
    <section className="bento-section section" id="why">
      <SectionLabel>Why The Mirrors</SectionLabel>
      <h2 className="h2 bento-title">
        <SplitWords text="Small details. *Big* difference." />
      </h2>

      <div className="bento">
        {/* Glass over photo */}
        <Reveal className="bento__cell bento__cell--photo" delay={0}>
          <img src={img(IMG.bentoRoom, 1100)} alt="" loading="lazy" />
          <div className="bento__glass glass">
            <Icon name="shield" size={26} />
            <h3>Only board-certified dermatologists</h3>
            <p>Every consult, every procedure. No exceptions, no substitutions.</p>
          </div>
        </Reveal>

        {/* AI scan */}
        <Reveal className="bento__cell bento__cell--scan" delay={0.08}>
          <div className="scan">
            <img src={img(IMG.mask, 800)} alt="" loading="lazy" />
            <span className="scan__line" />
            <span className="scan__corner tl" />
            <span className="scan__corner tr" />
            <span className="scan__corner bl" />
            <span className="scan__corner br" />
            <span className="scan__tag t1">Hydration 78%</span>
            <span className="scan__tag t2">Texture ↑ 12%</span>
          </div>
          <div className="bento__caption">
            <h3>3D skin imaging</h3>
            <p>See beneath the surface.</p>
          </div>
        </Reveal>

        {/* Clay rating */}
        <Reveal className="bento__cell bento__cell--teal" delay={0.16}>
          <Tilt className="clay">
            <Stars />
            <span className="clay__big">
              <Counter to={4.9} decimals={1} />
            </span>
            <p>2,300+ verified reviews</p>
          </Tilt>
        </Reveal>

        {/* Brutalist */}
        <Reveal className="bento__cell bento__cell--brutal" delay={0.1}>
          <motion.span
            className="brutal__star"
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            aria-hidden="true"
          >
            ✺
          </motion.span>
          <h3>
            Medical
            <br />
            grade.
            <br />
            <span>Only.</span>
          </h3>
          <p>No influencer serums. Every product we stock is clinically proven.</p>
        </Reveal>

        {/* Neumorphic availability */}
        <Reveal className="bento__cell bento__cell--neu" delay={0.18}>
          <h3>Same-week appointments</h3>
          <div className="neu-days">
            {DAYS.map((d, i) => (
              <span key={i} className={`neu-day ${OPEN[i] ? 'is-open' : ''}`}>
                {d}
              </span>
            ))}
          </div>
          <p>Monday to Saturday, 3 – 7 pm.</p>
        </Reveal>

        {/* Tele */}
        <Reveal className="bento__cell bento__cell--tele" delay={0.24}>
          <div className="tele__head">
            <span className="tele__icon">
              <Icon name="video" size={22} />
            </span>
            <span className="live">
              <span className="pulse" /> Online now
            </span>
          </div>
          <h3>Tele-dermatology follow-ups</h3>
          <p>Check in from your sofa — photos reviewed by your own doctor within 24 hours.</p>
        </Reveal>
      </div>
    </section>
  );
}
