import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { POLICIES, POLICIES_UPDATED } from '../data';
import Page from '../components/Page';
import { Eyebrow } from '../components/ui';

/* Privacy policy, website terms and medical disclaimer on one page (/policies#privacy etc.) */
export default function PoliciesPage() {
  const { hash } = useLocation();

  // Footer links point at a section, e.g. /policies#terms
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 80);
    return () => clearTimeout(t);
  }, [hash]);

  return (
    <Page title="Privacy & website policies">
      <section className="policies-head">
        <div className="container">
          <Eyebrow>Policies</Eyebrow>
          <h1 className="title">Privacy &amp; website policies</h1>
          <p>Last updated {POLICIES_UPDATED}</p>
          <nav aria-label="On this page">
            {POLICIES.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.title}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="section">
        <div className="container narrow policies">
          {POLICIES.map((s) => (
            <article key={s.id} id={s.id} className="policy">
              <h2>{s.title}</h2>
              {s.intro && <p className="policy__intro">{s.intro}</p>}
              {s.blocks.map((b, i) => (
                <div key={i}>
                  {b.h && <h3>{b.h}</h3>}
                  {b.p?.map((t) => (
                    <p key={t}>{t}</p>
                  ))}
                  {b.list && (
                    <ul>
                      {b.list.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>
    </Page>
  );
}
