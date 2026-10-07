import { AWARDS, FACILITIES, IMG, PHILOSOPHY_HIGHLIGHT, PHILOSOPHY_INTRO, PROMISE, VALUES } from '../data';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import About from '../components/About';
import Reviews from '../components/Reviews';
import CTA from '../components/CTA';
import { Eyebrow, Icon } from '../components/ui';

const STATS = [
  { value: '10+', label: 'Years of experience' },
  { value: '2026', label: 'Clinic established' },
  { value: '3', label: 'Languages: English, Tamil, Hindi' },
  { value: 'Mon–Sat', label: '3:00 pm – 7:00 pm' },
];

// Puts the clinic's key phrase in bold where it appears
function Highlight({ text }) {
  const i = text.indexOf(PHILOSOPHY_HIGHLIGHT);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <strong>{PHILOSOPHY_HIGHLIGHT}</strong>
      {text.slice(i + PHILOSOPHY_HIGHLIGHT.length)}
    </>
  );
}

export default function AboutPage() {
  return (
    <Page title="About">
      <PageHeader
        eyebrow="About"
        title="Care that begins with understanding you"
        text="Evidence-based, patient-tailored dermatology in Neelambur, Coimbatore."
        image={IMG.aboutHero}
        image2={IMG.dq6}
      />
      <About full />

      <section className="section philo">
        <div className="container philo__grid">
          <div className="philo__head">
            <Eyebrow>Our care philosophy</Eyebrow>
            <h2 className="title reveal">
              Listen. Understand. <em>Treat.</em>
            </h2>
            {PHILOSOPHY_INTRO.map((p) => (
              <p key={p} className="reveal">
                <Highlight text={p} />
              </p>
            ))}
          </div>
          <div>
            <p className="philo__lead reveal">We are committed to</p>
            <ol className="philo__list">
              {VALUES.map((v, i) => (
                <li key={v.title} className="reveal" style={{ '--d': `${i * 80}ms` }}>
                  <span className="philo__no">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{v.title}</h3>
                    <p>{v.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="container">
          <div className="promise reveal">
            <p className="philo__lead">Our promise</p>
            <p className="promise__lines">
              {PROMISE.lines.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </p>
            <p className="promise__note">{PROMISE.note}</p>
            <p className="promise__sign">
              <strong>The Mirrors Dermatology Clinic</strong>
              <em>{PROMISE.sign}</em>
            </p>
          </div>
        </div>
      </section>

      {FACILITIES.length > 0 && (
        <section className="section">
          <div className="container">
            <header className="section__head">
              <Eyebrow>Facilities &amp; equipment</Eyebrow>
              <h2 className="title reveal">
                Treatments done <em>in-house</em>
              </h2>
            </header>
            <div className="facilities">
              {FACILITIES.map((f, i) => (
                <article key={f.title} className="facility reveal" style={{ '--d': `${i * 100}ms` }}>
                  <span className="facility__icon">
                    <Icon name={f.icon} size={24} />
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {AWARDS.length > 0 && (
        <section className="section section--sand">
          <div className="container awards">
            <div className="awards__head">
              <Eyebrow>Awards &amp; accreditations</Eyebrow>
              <h2 className="title reveal">
                Trained, recognised <em>&amp; registered</em>
              </h2>
              <p className="reveal">Dr. Saranya Rajee Saminathan’s academic awards, qualifications and professional memberships.</p>
            </div>
            <ul className="awards__list">
              {AWARDS.map((a, i) => (
                <li key={a.title} className="reveal" style={{ '--d': `${i * 70}ms` }}>
                  <span className="awards__icon">
                    <Icon name={a.icon} size={20} />
                  </span>
                  <span>
                    <strong>{a.title}</strong>
                    {a.detail}
                    {a.link && (
                      <a href={a.link} target="_blank" rel="noreferrer">
                        View certificate
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

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

      <Reviews />
      <CTA title="Come and meet us" />
    </Page>
  );
}
