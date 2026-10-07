import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { IMG } from '../data';
import { useApi } from '../backend';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import CTA from '../components/CTA';
import { Icon, useReveal } from '../components/ui';

function Lightbox({ photos, index, onClose, onMove }) {
  const p = photos[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onMove(1);
      if (e.key === 'ArrowLeft') onMove(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, onMove]);

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={p.name || 'Photo'} onClick={onClose}>
      <button className="lightbox__close" onClick={onClose} aria-label="Close">
        <Icon name="close" size={24} />
      </button>
      <button className="lightbox__nav lightbox__nav--prev" onClick={(e) => (e.stopPropagation(), onMove(-1))} aria-label="Previous photo">
        <Icon name="arrow" size={22} />
      </button>
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={p.image} alt={p.name} />
        <figcaption>
          {p.name}{' '}
          <span>
            {index + 1} / {photos.length}
          </span>
        </figcaption>
      </figure>
      <button className="lightbox__nav" onClick={(e) => (e.stopPropagation(), onMove(1))} aria-label="Next photo">
        <Icon name="arrow" size={22} />
      </button>
    </div>,
    document.body
  );
}

export default function GalleryPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  const { data, error, loading, reload } = useApi(`/gallery?page=${page}`);
  const [open, setOpen] = useState(null);
  const gridTop = useRef(null);
  useReveal(data ? `gallery-${data.page}-${data.total}` : null);

  const photos = data?.items || [];
  const close = useCallback(() => setOpen(null), []);
  const move = useCallback((step) => setOpen((i) => (i + step + photos.length) % photos.length), [photos.length]);

  const go = (n) => {
    setParams(n > 1 ? { page: String(n) } : {});
    gridTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const empty = (data && !data.total) || error?.offline;

  return (
    <Page title="Gallery">
      <PageHeader
        eyebrow="Gallery"
        title="Step inside The Mirrors"
        text="A look around our clinic, our treatments and our team."
        image={IMG.visit1}
        image2={IMG.dq6}
      />

      <section className="section section--sand" ref={gridTop} style={{ scrollMarginTop: 'var(--header-h)' }}>
        <div className="container">
          {loading && !data && !error && <p className="state">Loading photos…</p>}
          {error && !error.offline && (
            <div className="state">
              <p>{error.message}</p>
              <button className="btn btn--ghost" onClick={reload}>
                Try again
              </button>
            </div>
          )}
          {empty && <p className="state">Photos of our clinic are coming soon.</p>}

          {data?.total > 0 && (
            <>
              <div className={`gallery ${loading ? 'is-loading' : ''}`} key={data.page}>
                {photos.map((p, i) => (
                  // Original template look: staggered columns, every third photo taller, name inside the photo
                  <div key={p.id} className="gallery__tile reveal" style={{ '--d': `${(i % 3) * 100}ms` }}>
                    <button
                      className={`gallery__item ${i % 3 === 0 ? 'is-tall' : ''}`}
                      onClick={() => setOpen(i)}
                      aria-label={`Open photo${p.name ? `: ${p.name}` : ''}`}
                    >
                      <img src={p.image} alt={p.name} loading="lazy" />
                      {p.name && <span className="gallery__cap">{p.name}</span>}
                    </button>
                  </div>
                ))}
              </div>

              <Pagination page={data.page} pages={data.pages} onChange={go} />
              {data.pages > 1 && (
                <p className="pager__info">
                  Showing {(data.page - 1) * data.perPage + 1}–{(data.page - 1) * data.perPage + photos.length} of {data.total}{' '}
                  photos
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {open !== null && photos[open] && <Lightbox photos={photos} index={open} onClose={close} onMove={move} />}

      <CTA title="Come and see us in person" />
    </Page>
  );
}
