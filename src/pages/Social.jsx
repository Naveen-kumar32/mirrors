import { useRef, useState } from 'react';
import { useApi } from '../backend';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import Reviews from '../components/Reviews';
import CTA from '../components/CTA';
import { Eyebrow, Icon, useReveal } from '../components/ui';
import { CONTACT, IMG } from '../data';

const PER_PAGE = 8;
// Quick links (Videos · Instagram · Facebook · Reviews) under the banner — hidden for now, set to true to show them
const SHOW_JUMP_LINKS = false;

function YouTubeCard({ item }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="scard scard--youtube">
      {playing ? (
        <div className="scard__embed">
          <iframe
            src={`https://www.youtube.com/embed/${item.embedId}?autoplay=1`}
            title={item.title || 'YouTube video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <button className="scard__thumb" onClick={() => setPlaying(true)} aria-label={`Play: ${item.title || 'YouTube video'}`}>
          <img src={`https://img.youtube.com/vi/${item.embedId}/hqdefault.jpg`} alt="" loading="lazy" />
          <span className="scard__play">
            <Icon name="youtube" size={40} />
          </span>
        </button>
      )}
      <div className="scard__body">
        {item.title && <p className="scard__title">{item.title}</p>}
        {item.description && <p className="scard__desc">{item.description}</p>}
      </div>
    </div>
  );
}

/* Instagram: square photo tiles, caption on hover */
function InstagramTile({ item }) {
  return (
    <a
      className="igtile"
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${item.title || 'Instagram post'} (opens Instagram)`}
    >
      {item.image ? (
        <img src={item.image} alt="" loading="lazy" />
      ) : (
        <span className="igtile__blank">
          <Icon name="instagram" size={40} />
        </span>
      )}
      <span className="igtile__over">
        <Icon name="instagram" size={22} />
        {item.title && <span className="igtile__cap">{item.title}</span>}
      </span>
    </a>
  );
}

function FacebookCard({ item }) {
  return (
    <a className="scard scard--facebook" href={item.url} target="_blank" rel="noopener noreferrer">
      {item.image ? (
        <div className="scard__photo">
          <img src={item.image} alt="" loading="lazy" />
        </div>
      ) : (
        <div className="scard__link-thumb">
          <Icon name="facebook" size={44} />
        </div>
      )}
      <div className="scard__body">
        {item.title && <p className="scard__title">{item.title}</p>}
        {item.description && <p className="scard__desc">{item.description}</p>}
        <span className="scard__cta">View on Facebook →</span>
      </div>
    </a>
  );
}

/* One platform: heading, up to 8 posts, Previous / Next */
function SocialSection({ id, platform, eyebrow, title, text, link, linkLabel, items, loading, render, sand, gridClass = '' }) {
  const ref = useRef(null);
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const current = Math.min(page, pages);
  const shown = items.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const go = (n) => {
    setPage(n);
    const top = ref.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id={id} ref={ref} className={`section soc${sand ? ' section--sand' : ''}`}>
      <div className="container">
        <header className="soc__head">
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 className="title reveal">{title}</h2>
            {text && <p className="soc__text">{text}</p>}
          </div>
          {link && (
            <a className={`soc__follow soc__follow--${platform}`} href={link} target="_blank" rel="noopener noreferrer">
              <Icon name={platform} size={18} /> {linkLabel}
            </a>
          )}
        </header>

        {loading && <p className="state">Loading…</p>}
        {!loading && items.length === 0 && (
          <div className="soc__empty">
            <Icon name={platform} size={34} />
            <p>New posts are coming soon.</p>
            {link && (
              <a className="btn btn--ghost" href={link} target="_blank" rel="noopener noreferrer">
                {linkLabel}
              </a>
            )}
          </div>
        )}
        {!loading && items.length > 0 && (
          <div className={`soc__grid ${gridClass}`} key={current}>
            {shown.map(render)}
          </div>
        )}

        {pages > 1 && (
          <nav className="soc__pager" aria-label={`${eyebrow} pages`}>
            <button className="btn btn--ghost" onClick={() => go(current - 1)} disabled={current === 1}>
              ← Previous
            </button>
            <span>
              {current} / {pages}
            </span>
            <button className="btn btn--ghost" onClick={() => go(current + 1)} disabled={current === pages}>
              Next →
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}

export default function Social() {
  const { data, loading } = useApi('/social');
  const all = data?.items || [];
  const of = (p) => all.filter((i) => i.platform === p);
  useReveal(data ? 'social' : null);

  return (
    <Page title="Social Media">
      <PageHeader
        eyebrow="Follow Us"
        title="Our social media"
        text="Watch our educational videos, follow our skin care tips, and stay connected with THE MIRRORS DERMATOLOGY CLINIC."
        image={IMG.dq2}
        image2={IMG.dq5}
      />

      {SHOW_JUMP_LINKS && (
        <nav className="soc-jump container" aria-label="Jump to">
          <a href="#youtube" className="soc-jump__link soc-jump__link--youtube">
            <Icon name="youtube" size={18} /> Videos
          </a>
          <a href="#instagram" className="soc-jump__link soc-jump__link--instagram">
            <Icon name="instagram" size={18} /> Instagram
          </a>
          <a href="#facebook" className="soc-jump__link soc-jump__link--facebook">
            <Icon name="facebook" size={18} /> Facebook
          </a>
          <a href="#reviews" className="soc-jump__link">
            <Icon name="star" size={18} /> Reviews
          </a>
        </nav>
      )}

      <SocialSection
        id="youtube"
        platform="youtube"
        eyebrow="YouTube"
        title={
          <>
            Watch &amp; <em>learn</em>
          </>
        }
        text="Short videos from our dermatologist on common skin, hair and nail concerns."
        items={of('youtube')}
        loading={loading}
        render={(item) => <YouTubeCard key={item.id} item={item} />}
      />

      <SocialSection
        id="instagram"
        platform="instagram"
        eyebrow="Instagram"
        title={
          <>
            From our <em>Instagram</em>
          </>
        }
        text={`Skin care tips and clinic moments — ${CONTACT.instagramHandle}`}
        link={CONTACT.instagram}
        linkLabel="Follow on Instagram"
        items={of('instagram')}
        loading={loading}
        sand
        gridClass="soc__grid--square"
        render={(item) => <InstagramTile key={item.id} item={item} />}
      />

      <SocialSection
        id="facebook"
        platform="facebook"
        eyebrow="Facebook"
        title={
          <>
            On <em>Facebook</em>
          </>
        }
        text="Clinic news, updates and patient education."
        link={CONTACT.facebook}
        linkLabel="Follow on Facebook"
        items={of('facebook')}
        loading={loading}
        render={(item) => <FacebookCard key={item.id} item={item} />}
      />

      <div id="reviews" className="soc-reviews">
        <Reviews />
      </div>

      <CTA />
    </Page>
  );
}
