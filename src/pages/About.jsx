import { IMG, VALUES } from '../data';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import About from '../components/About';
import Reviews from '../components/Reviews';
import CTA from '../components/CTA';
import { Eyebrow, Icon } from '../components/ui';

const STATS = [
  { value: '16+', label: 'Years of practice' },
  { value: '18,000+', label: 'Patients cared for' },
  { value: '4', label: 'Specialist doctors' },
  { value: '4.9', label: 'Average rating' },
];

export default function AboutPage() {
  return (
    <Page title="About">
      <PageHeader
        eyebrow="About"
        title="A calm clinic, built on honest care"
        text="Independent, doctor-led dermatology in Neelambur, Coimbatore."
        image={IMG.aboutHero}
        image2={IMG.reception}
      />
      <About />

      <section className="stats">
        <div className="container stats__grid">
          {STATS.map((s, i) => (
            <div key={s.label} className="stat reveal" style={{ '--d': `${i * 100}ms` }}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section section--sand">
        <div className="container">
          <header className="section__head">
            <Eyebrow>What we believe</Eyebrow>
            <h2 className="title reveal">
              Our <em>promise</em> to you
            </h2>
          </header>
          <div className="values">
            {VALUES.map((v, i) => (
              <article key={v.title} className="value reveal" style={{ '--d': `${i * 100}ms` }}>
                <span className="value__icon">
                  <Icon name={v.icon === 'leaf' ? 'check' : v.icon === 'chat' ? 'plan' : v.icon} size={22} />
                </span>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Reviews />
      <CTA title="Come and meet us" />
    </Page>
  );
}
