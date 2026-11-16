import { useRef, useState } from 'react';
import { useApi } from '../backend';
import { CONTACT } from '../data';
import { Eyebrow, Icon } from './ui';

const MAX_SHORTS = 10;
// A YouTube Short is saved with its youtube.com/shorts/… link (Admin → Social media → YouTube)
const isShort = (item) => item.platform === 'youtube' && /youtube\.com\/shorts\//i.test(item.url || '');

/*
 * Home page: the clinic's YouTube Shorts in a swipeable row of tall cards. Only Shorts are shown,
 * never regular videos. The section is left out when there are no Shorts or YouTube is switched off.
 */
export default function HomeShorts() {
  const { data } = useApi('/social');
  const rowRef = useRef(null);
  const [playing, setPlaying] = useState(null);

  const shorts = data?.platforms?.youtube === false ? [] : (data?.items || []).filter(isShort).slice(0, MAX_SHORTS);
  if (!shorts.length) return null;

  const scroll = (dir) => {
    const row = rowRef.current;
    if (!row) return;
    const card = row.querySelector('.short');
    row.scrollBy({ left: dir * ((card?.offsetWidth || 240) + 18) * 2, behavior: 'smooth' });
  };

  return (
    <section className="section shorts">
      <div className="container">
        <header className="shorts__head">
          <div>
            <Eyebrow>YouTube Shorts</Eyebrow>
            <h2 className="title reveal">
              Skin tips in <em>under a minute</em>
            </h2>
            <p className="shorts__text reveal">Quick answers from our dermatologist to the questions patients ask most.</p>
          </div>
          <div className="shorts__actions">
            {CONTACT.youtube && (
              <a className="soc__follow soc__follow--youtube" href={CONTACT.youtube} target="_blank" rel="noopener noreferrer">
                <Icon name="youtube" size={18} /> Subscribe on YouTube
              </a>
            )}
            {shorts.length > 3 && (
              <div className="shorts__arrows">
                <button type="button" onClick={() => scroll(-1)} aria-label="Previous Shorts">
                  <Icon name="arrow" size={18} />
                </button>
                <button type="button" onClick={() => scroll(1)} aria-label="More Shorts">
                  <Icon name="arrow" size={18} />
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="shorts__row" ref={rowRef}>
          {shorts.map((s) => (
            <div key={s.id} className="short">
              {playing === s.id ? (
                <iframe
                  src={`https://www.youtube.com/embed/${s.embedId}?autoplay=1&playsinline=1&rel=0`}
                  title={s.title || 'YouTube Short'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button className="short__cover" onClick={() => setPlaying(s.id)} aria-label={`Play: ${s.title || 'YouTube Short'}`}>
                  <img src={`https://i.ytimg.com/vi/${s.embedId}/hqdefault.jpg`} alt="" loading="lazy" />
                  <span className="short__badge">
                    <Icon name="youtube" size={14} /> Shorts
                  </span>
                  <span className="short__play" aria-hidden="true">
                    <Icon name="youtube" size={30} />
                  </span>
                  {s.title && <span className="short__title">{s.title}</span>}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
