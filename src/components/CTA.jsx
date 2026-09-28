import { CONTACT } from '../data';
import { useChat } from '../chat/ChatProvider';
import { Icon } from './ui';

/* Navy booking band shown near the end of every page */
export default function CTA({ title = 'Ready to care for your skin?', preset }) {
  const chat = useChat();
  return (
    <section className="cta">
      <div className="container cta__inner reveal">
        <h2 className="cta__title">{title}</h2>
        <div className="cta__actions">
          <button className="btn btn--white" onClick={() => chat.openBooking(preset)}>
            Book appointment <Icon name="arrow" size={18} />
          </button>
          <a className="btn btn--line-white" href={CONTACT.phoneHref}>
            <Icon name="phone" size={17} /> {CONTACT.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
