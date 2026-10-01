import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GALLERY, IMG, RESULTS_GALLERY, img } from '../data';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import CTA from '../components/CTA';
import { Icon, useReveal } from '../components/ui';

const PHOTOS = [
  ...GALLERY.map((g) => ({ ...g, group: 'Our clinic' })),
  ...RESULTS_GALLERY.map((g) => ({ ...g, group: 'Skincare & treatments' })),
];
const GROUPS = ['All', 'Our clinic', 'Skincare & treatments'];

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
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={p.caption} onClick={onClose}>
      <button className="lightbox__close" onClick={onClose} aria-label="Close">
        <Icon name="close" size={24} />
      </button>
      <button className="lightbox__nav lightbox__nav--prev" onClick={(e) => (e.stopPropagation(), onMove(-1))} aria-label="Previous photo">
        <Icon name="arrow" size={22} />
      </button>
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={img(p.image, 1600)} alt={p.caption} />
        <figcaption>
          {p.caption} <span>{index + 1} / {photos.length}</span>
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
  const [group, setGroup] = useState('All');
  const [open, setOpen] = useState(null);
  const photos = group === 'All' ? PHOTOS : PHOTOS.filter((p) => p.group === group);
  useReveal(group);

  const close = useCallback(() => setOpen(null), []);
  const move = useCallback((step) => setOpen((i) => (i + step + photos.length) % photos.length), [photos.length]);

  return (
    <Page title="Gallery">
      <PageHeader
        eyebrow="Gallery"
        title="Step inside The Mirrors"
        text="A look around our calm, light-filled clinic and the care that goes into every visit."
        image={IMG.lounge}
        image2={IMG.reception}
      />

      <section className="section section--sand">
        <div className="container">
          <div className="filters reveal" role="tablist" aria-label="Filter photos">
            {GROUPS.map((g) => (
              <button key={g} role="tab" aria-selected={group === g} className={group === g ? 'is-on' : ''} onClick={() => setGroup(g)}>
                {g}
              </button>
            ))}
          </div>

          <div className="gallery" key={group}>
            {photos.map((p, i) => (
              <button
                key={p.image}
                className={`gallery__item reveal ${p.tall ? 'is-tall' : ''}`}
                style={{ '--d': `${(i % 3) * 100}ms` }}
                onClick={() => setOpen(i)}
                aria-label={`Open photo: ${p.caption}`}
              >
                <img src={img(p.image, 960)} alt={p.caption} loading="lazy" />
                <span className="gallery__cap">{p.caption}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {open !== null && <Lightbox photos={photos} index={open} onClose={close} onMove={move} />}

      <CTA title="Come and see us in person" />
    </Page>
  );
}
