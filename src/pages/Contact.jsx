import { FAQS, IMG } from '../data';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import Contact from '../components/Contact';
import { Link } from 'react-router-dom';
import Faqs from '../components/Faqs';
import { Eyebrow, Icon } from '../components/ui';

export default function ContactPage() {
  return (
    <Page title="Contact">
      <PageHeader
        eyebrow="Contact"
        title="We’d love to see you"
        text="Call, WhatsApp or book online — consultations are by appointment."
        image={IMG.bentoRoom}
        image2={IMG.aboutHero}
      />
      <Contact />
      <section className="section">
        <div className="container narrow">
          <header className="section__head">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="title reveal">
              Before you <em>visit</em>
            </h2>
          </header>
          <Faqs items={FAQS} />
          <p className="section__more reveal">
            <Link to="/faqs" className="text-link">
              All FAQs <Icon name="arrow" size={16} />
            </Link>
          </p>
        </div>
      </section>
    </Page>
  );
}
