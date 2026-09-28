import { FAQS, IMG } from '../data';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import Contact from '../components/Contact';
import { Eyebrow, Icon } from '../components/ui';
import { useState } from 'react';

export default function ContactPage() {
  const [open, setOpen] = useState(0);
  return (
    <Page title="Contact">
      <PageHeader
        eyebrow="Contact"
        title="We’d love to see you"
        text="Book online, call, or drop in during clinic hours."
        image={IMG.contactHero}
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
          <div className="faqs">
            {FAQS.slice(0, 5).map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className={`faq reveal ${isOpen ? 'is-open' : ''}`}>
                  <button className="faq__q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                    {f.q}
                    <Icon name="plus" size={18} />
                  </button>
                  <div className="faq__a" inert={!isOpen}>
                    <div>
                      <p>{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </Page>
  );
}
