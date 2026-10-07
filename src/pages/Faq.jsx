import { CONTACT, FAQ_LIST, IMG } from '../data';
import { useChat } from '../chat/ChatProvider';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import Faqs from '../components/Faqs';
import { Icon } from '../components/ui';

export default function FaqPage() {
  const chat = useChat();
  return (
    <Page title="FAQs">
      <PageHeader
        eyebrow="FAQs"
        title="Questions, answered"
        text="Everything you may want to know before your visit — appointments, treatments, fees and more."
        image={IMG.dq4}
        image2={IMG.dq3}
      />

      <section className="section">
        <div className="container narrow">
          <Faqs items={FAQ_LIST} />

          <div className="faqpage__ask reveal">
            <div>
              <strong>Still have a question?</strong>
              <span>Ask us — we’re happy to help.</span>
            </div>
            <div className="faqpage__ask-actions">
              <button className="btn btn--navy" onClick={() => chat.open()}>
                Talk to us <Icon name="chat" size={17} />
              </button>
              <a className="btn btn--ghost" href={CONTACT.whatsapp} target="_blank" rel="noreferrer">
                <Icon name="whatsapp" size={17} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container cta__inner reveal">
          <h2 className="cta__title">Ready to book your visit?</h2>
          <div className="cta__actions">
            <button className="btn btn--white" onClick={() => chat.openBooking()}>
              Book appointment <Icon name="arrow" size={18} />
            </button>
            <a className="btn btn--line-white" href={CONTACT.phoneHref}>
              <Icon name="phone" size={17} /> {CONTACT.phone}
            </a>
          </div>
        </div>
      </section>
    </Page>
  );
}
