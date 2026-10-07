import { Link, useParams } from 'react-router-dom';
import { SERVICES, TREATMENT_DISCLAIMER, img } from '../data';
import { useChat } from '../chat/ChatProvider';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import CTA from '../components/CTA';
import { TreatmentCard } from '../components/Treatments';
import { Eyebrow, Icon } from '../components/ui';
import NotFound from './NotFound';

export default function TreatmentDetail() {
  const { slug } = useParams();
  const chat = useChat();
  const s = SERVICES.find((x) => x.slug === slug);
  if (!s) return <NotFound />;

  const preset = { concern: s.title };
  const details = [
    { icon: 'check', title: 'Ideal for', text: s.idealFor },
    { icon: 'plan', title: 'Benefits', text: s.benefits },
    { icon: 'shield', title: 'Limitations', text: s.limitations },
    { icon: 'clock', title: 'Aftercare', text: s.aftercare },
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

      <section className="section">
        <div className="container detail">
          <div className="detail__text">
            <Eyebrow>About this treatment</Eyebrow>
            <h2 className="title reveal">
              What it <em>involves</em>
            </h2>
            <p className="reveal">{s.text}</p>
            <p className="reveal detail__ideal">
              <strong>Ideal for:</strong> {s.idealFor}
            </p>
            <button className="btn btn--navy reveal" onClick={() => chat.openBooking(preset)}>
              Book an appointment <Icon name="arrow" size={18} />
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
            <Eyebrow>Good to know</Eyebrow>
            <h2 className="title reveal">
              Before you <em>decide</em>
            </h2>
          </header>
          <div className="values">
            {details.map((d, i) => (
              <article key={d.title} className="value reveal" style={{ '--d': `${i * 100}ms` }}>
                <span className="value__icon">
                  <Icon name={d.icon} size={22} />
                </span>
                <h3>{d.title}</h3>
                <p>{d.text}</p>
              </article>
            ))}
          </div>
          <p className="disclaimer reveal">{TREATMENT_DISCLAIMER}</p>
        </div>
      </section>

      <section className="section">
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

      <CTA title={`Questions about ${s.title.toLowerCase()}?`} preset={preset} />
    </Page>
  );
}
