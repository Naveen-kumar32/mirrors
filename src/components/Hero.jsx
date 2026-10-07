import { HOURS, IMG, img } from '../data';
import { useChat } from '../chat/ChatProvider';
import { Icon } from './ui';
import ClinicStatus from './ClinicStatus';

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
          Rooted in science,
          <br />
          <em>reflected</em> in your skin.
        </h1>
        <p className="hero__text">
          A calm, welcoming dermatology clinic in Neelambur, Coimbatore — here to understand your skin,
          hair and nail concerns and help you look after them for the long term.
        </p>
        <div className="hero__actions">
          <button className="btn btn--navy" onClick={() => chat.open()}>
            Talk to us <Icon name="chat" size={18} />
          </button>
          <button className="btn btn--ghost" onClick={() => chat.openBooking()}>
            Book appointment
          </button>
        </div>
        <p className="hero__hours">
          <Icon name="clock" size={16} /> {HOURS[0].day}, {HOURS[0].time}
        </p>
        <ClinicStatus className="hero__status" />
      </div>
      <span className="hero__scroll" aria-hidden="true">
        <span />
      </span>
    </section>
  );
}
