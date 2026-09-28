import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SERVICES, img } from '../data';
import { useChat } from '../chat/ChatProvider';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import CTA from '../components/CTA';
import { TreatmentCard } from '../components/Treatments';
import { Eyebrow, Icon } from '../components/ui';
import NotFound from './NotFound';

function Faqs({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="faqs">
      {items.map((f, i) => {
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
  );
}

export default function TreatmentDetail() {
  const { slug } = useParams();
  const chat = useChat();
  const s = SERVICES.find((x) => x.slug === slug);
  if (!s) return <NotFound />;

  const preset = { concern: s.title };
  const facts = [
    { label: 'Duration', value: s.facts.duration },
    { label: 'Downtime', value: s.facts.downtime },
    { label: 'Sessions', value: s.facts.sessions },
    { label: 'From', value: s.facts.from },
  ];
  const others = SERVICES.filter((x) => x.slug !== s.slug).slice(0, 3);

  return (
    <Page title={s.title}>
      <PageHeader
        eyebrow={s.title}
        title={s.title}
        text={s.text}
        image={s.image}
        image2={s.image2}
        preset={preset}
        crumbs={[{ to: '/treatments', label: 'Treatments' }]}
      />

      <section className="facts">
        <div className="container facts__grid">
          {facts.map((f, i) => (
            <div key={f.label} className="fact reveal" style={{ '--d': `${i * 100}ms` }}>
              <span>{f.label}</span>
              <strong>{f.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container detail">
          <div className="detail__text">
            <Eyebrow>Overview</Eyebrow>
            <h2 className="title reveal">
              How we <em>help</em>
            </h2>
            <p className="reveal">{s.overview}</p>
            <ul className="detail__list reveal">
              {s.conditions.map((c) => (
                <li key={c}>
                  <Icon name="check" size={16} /> {c}
                </li>
              ))}
            </ul>
            <button className="btn btn--navy reveal" onClick={() => chat.openBooking(preset)}>
              Book this treatment <Icon name="arrow" size={18} />
            </button>
          </div>
          <div className="detail__media reveal">
            <img src={img(s.image2, 1200)} alt="" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="section section--sand">
        <div className="container">
          <header className="section__head">
            <Eyebrow>Your visit</Eyebrow>
            <h2 className="title reveal">
              What to <em>expect</em>
            </h2>
          </header>
          <ol className="steps">
            {s.expect.map((e, i) => (
              <li key={e.title} className="step reveal" style={{ '--d': `${i * 110}ms` }}>
                <span className="step__no">{i + 1}</span>
                <h3>{e.title}</h3>
                <p>{e.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container narrow">
          <header className="section__head">
            <Eyebrow>Questions</Eyebrow>
            <h2 className="title reveal">
              Good to <em>know</em>
            </h2>
          </header>
          <Faqs items={s.faqs} />
        </div>
      </section>

      <section className="section section--sand">
        <div className="container">
          <header className="section__head">
            <Eyebrow>Explore</Eyebrow>
            <h2 className="title reveal">
              Other <em>treatments</em>
            </h2>
          </header>
          <div className="treatments">
            {others.map((o, i) => (
              <TreatmentCard key={o.slug} s={o} i={i} />
            ))}
          </div>
          <p className="section__more reveal">
            <Link to="/treatments" className="text-link">
              All treatments <Icon name="arrow" size={16} />
            </Link>
          </p>
        </div>
      </section>

      <CTA title={`Book ${s.title.toLowerCase()}`} preset={preset} />
    </Page>
  );
}
