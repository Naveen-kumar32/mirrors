import { CONTACT } from '../data';
import { Icon } from './ui';

/* Floating Call and WhatsApp buttons, shown on phones only */
export default function QuickContact() {
  return (
    <div className="quick" aria-label="Contact the clinic">
      <a className="quick__btn" href={CONTACT.phoneHref} aria-label={`Call ${CONTACT.phone}`}>
        <Icon name="phone" size={20} />
      </a>
      <a className="quick__btn quick__btn--wa" href={CONTACT.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp us">
        <Icon name="whatsapp" size={21} />
      </a>
    </div>
  );
}
