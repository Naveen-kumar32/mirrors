import { IMG, TEAM } from '../data';
import { useChat } from '../chat/ChatProvider';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import CTA from '../components/CTA';
import { DoctorPhoto } from '../components/Doctors';
import { Icon, Rich } from '../components/ui';

function Profile({ d, flip }) {
  const chat = useChat();
  const facts = [
    ['Qualifications', d.qualifications],
    ['Registration', d.registration],
    ['Awards', d.awards],
    ['Memberships', d.memberships],
    ['Languages', d.languages],
    ['Consultations', d.schedule],
  ].filter(([, v]) => v && v.length);

  return (
    <article id={d.initials.toLowerCase()} className={`profile reveal ${flip ? 'profile--flip' : ''}`}>
      <div className="profile__photo">
        <DoctorPhoto doctor={d} />
      </div>
      <div className="profile__body">
        {d.draft && <p className="profile__draft">Placeholder — only visible while developing, hidden on the live site</p>}
        <p className="eyebrow">{d.role}</p>
        <h2 className="title">{d.name}</h2>
        <p className="profile__quals">{d.qualifications.join(' · ')}</p>
        {d.bio.map((p) => (
          <p key={p}>
            <Rich text={p} />
          </p>
        ))}
        <ul className="profile__tags">
          {d.specialties.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <dl className="profile__facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{Array.isArray(value) ? value.map((v) => <span key={v}>{v}</span>) : value}</dd>
            </div>
          ))}
        </dl>
        <div className="profile__actions">
          <button className="btn btn--navy" onClick={() => chat.openBooking()}>
            Book an appointment <Icon name="arrow" size={18} />
          </button>
          {d.instagram && (
            <a className="btn btn--ghost" href={d.instagram} target="_blank" rel="noreferrer">
              <Icon name="instagram" size={18} /> {d.instagramHandle}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default function DoctorsPage() {
  const one = TEAM.length === 1;
  const lead = TEAM[0];
  return (
    <Page title={one ? lead.name : 'Our doctors'}>
      <PageHeader
        eyebrow={one ? 'Our doctor' : 'Our doctors'}
        title={one ? lead.name : 'Meet our dermatologists'}
        text={one ? `${lead.role} · ${lead.years} years of experience` : 'Qualified dermatologists caring for your skin, hair and nails.'}
        image={IMG.dq2}
        image2={IMG.dq5}
      />
      <section className="section">
        <div className="container profiles">
          {TEAM.map((d, i) => (
            <Profile key={`${d.name}-${i}`} d={d} flip={i % 2 === 1} />
          ))}
        </div>
      </section>
      <CTA title="Have a question for the doctor? Talk to us." />
    </Page>
  );
}
