import { IMG, TEAM, img } from '../data';
import { useChat } from '../chat/ChatProvider';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import CTA from '../components/CTA';
import { Icon } from '../components/ui';

export default function DoctorsPage() {
  const chat = useChat();
  return (
    <Page title="Doctors">
      <PageHeader
        eyebrow="Doctors"
        title="Meet our dermatologists"
        text="Four board-certified specialists, each with a special interest."
        image={IMG.specHero}
        image2={IMG.jConsult}
      />
      <section className="section">
        <div className="container profiles">
          {TEAM.map((d, i) => (
            <article key={d.name} className={`profile reveal ${i % 2 ? 'profile--flip' : ''}`}>
              <div className="profile__photo">
                <img src={img(d.image, 960)} alt={`Portrait of ${d.name}`} loading="lazy" />
              </div>
              <div className="profile__body">
                <p className="eyebrow">{d.role}</p>
                <h2 className="title">{d.name}</h2>
                <p className="profile__quote">“{d.quote}”</p>
                <p>{d.bio}</p>
                <ul className="profile__tags">
                  {d.specialties.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <p className="profile__meta">
                  {d.years} years’ experience · {d.languages}
                </p>
                <button
                  className="btn btn--navy"
                  onClick={() => chat.open('book', { doctor: d.name, userText: `I’d like to book with ${d.name}` })}
                >
                  Book with Dr. {d.first} <Icon name="arrow" size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <CTA title="Not sure who to see? We’ll match you." />
    </Page>
  );
}
