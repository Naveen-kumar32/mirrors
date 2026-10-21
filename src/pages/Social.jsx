import { useState } from 'react';
import { useApi } from '../backend';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import CTA from '../components/CTA';
import { Icon, useReveal } from '../components/ui';
import { IMG } from '../data';

const PLATFORMS = [
  { key: 'youtube', label: 'YouTube' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
];
const PER_PAGE = 12;

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
          <img
            src={`https://img.youtube.com/vi/${item.embedId}/hqdefault.jpg`}
            alt={item.title || 'YouTube video thumbnail'}
            loading="lazy"
          />
          <span className="scard__play">
            <Icon name="youtube" size={40} />
          </span>
        </button>
      )}
      <div className="scard__body">
        <span className="scard__platform scard__platform--youtube">
          <Icon name="youtube" size={14} /> YouTube
        </span>
        {item.title && <p className="scard__title">{item.title}</p>}
        {item.description && <p className="scard__desc">{item.description}</p>}
      </div>
    </div>
  );
}

function LinkCard({ item }) {
  const isInsta = item.platform === 'instagram';
  return (
    <a
      className={`scard scard--${item.platform}`}
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {item.image ? (
        <div className="scard__photo">
          <img src={item.image} alt={item.title || `${isInsta ? 'Instagram' : 'Facebook'} post`} loading="lazy" />
        </div>
      ) : (
        <div className="scard__link-thumb">
          <Icon name={item.platform} size={48} />
        </div>
      )}
      <div className="scard__body">
        <span className={`scard__platform scard__platform--${item.platform}`}>
          <Icon name={item.platform} size={14} /> {isInsta ? 'Instagram' : 'Facebook'}
        </span>
        {item.title && <p className="scard__title">{item.title}</p>}
        {item.description && <p className="scard__desc">{item.description}</p>}
        <span className="scard__cta">View on {isInsta ? 'Instagram' : 'Facebook'} →</span>
      </div>
    </a>
  );
}

export default function Social() {
  const { data, loading } = useApi('/social');
  const [filter, setFilter] = useState('youtube');
  const [page, setPage] = useState(1);

  const all = data?.items || [];
  const allFiltered = all.filter((i) => i.platform === filter);
  const totalPages = Math.max(1, Math.ceil(allFiltered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const items = allFiltered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const switchFilter = (f) => { setFilter(f); setPage(1); };

  useReveal(data ? `social-${filter}-${safePage}` : null);

  return (
    <Page title="Social Media">
      <PageHeader
        eyebrow="Follow Us"
        title="Our social media"
        text="Watch our educational videos, follow our skin care tips, and stay connected with THE MIRRORS DERMATOLOGY CLINIC."
        image={IMG.dq2}
        image2={IMG.dq5}
      />

      <section className="section section--sand">
        <div className="container">
          <div className="stabs" role="tablist" aria-label="Social media platform">
            {PLATFORMS.map((p) => (
              <button
                key={p.key}
                role="tab"
                aria-selected={filter === p.key}
                className={`stabs__btn stabs__btn--${p.key}${filter === p.key ? ' is-active' : ''}`}
                onClick={() => switchFilter(p.key)}
              >
                <Icon name={p.key} size={18} />
                {p.label}
                <span className="stabs__count">{all.filter((i) => i.platform === p.key).length}</span>
              </button>
            ))}
          </div>

          {loading && <p className="slist__empty">Loading…</p>}
          {!loading && allFiltered.length === 0 && (
            <p className="slist__empty">No posts yet on this platform.</p>
          )}
          {!loading && items.length > 0 && (
            <div className="slist reveal">
              {items.map((item) =>
                item.platform === 'youtube' ? (
                  <YouTubeCard key={item.id} item={item} />
                ) : (
                  <LinkCard key={item.id} item={item} />
                )
              )}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="spager">
              <button
                className="btn btn--outline"
                onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={safePage === 1}
              >
                ← Previous
              </button>
              <span className="spager__info">Page {safePage} of {totalPages}</span>
              <button
                className="btn btn--outline"
                onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={safePage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </section>

      <CTA />
    </Page>
  );
}
