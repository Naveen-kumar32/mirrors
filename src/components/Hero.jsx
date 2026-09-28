import { Link } from 'react-router-dom';
import { HOURS, IMG, img } from '../data';
import { useChat } from '../chat/ChatProvider';
import { Icon } from './ui';

export default function Hero() {
  const chat = useChat();
  return (
    <section className="hero" id="top">
      <div className="hero__bg" aria-hidden="true">
        <img src={img(IMG.resultsHero, 1600)} alt="" fetchPriority="high" />
      </div>
      <div className="container hero__content">
        <p className="hero__kicker">Dermatology Clinic · Coimbatore</p>
        <h1 className="hero__title">
          Healthy skin,
          <br />
          <em>expertly</em> cared for.
        </h1>
        <p className="hero__text">
          Specialist care for skin, hair and nails — from acne and pigmentation to skin checks and
          gentle aesthetic treatments.
        </p>
        <div className="hero__actions">
          <button className="btn btn--navy" onClick={() => chat.openBooking()}>
            Book a consultation <Icon name="arrow" size={18} />
          </button>
          <Link className="btn btn--ghost" to="/treatments">
            Our treatments
          </Link>
        </div>
        <p className="hero__hours">
          <Icon name="clock" size={16} /> {HOURS[0].day}, {HOURS[0].time}
        </p>
      </div>
      <span className="hero__scroll" aria-hidden="true">
        <span />
      </span>
    </section>
  );
}
