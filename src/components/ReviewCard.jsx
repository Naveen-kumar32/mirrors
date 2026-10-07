import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './ui';

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

/* Full review in a pop-up — closes with ×, Esc or a click outside */
export function ReviewModal({ review, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="rmodal" role="dialog" aria-modal="true" aria-label={`Review from ${review.name}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <figure className="rmodal__box">
        <button className="rmodal__close" onClick={onClose} aria-label="Close review">
          <Icon name="close" size={20} />
        </button>
        {review.rating > 0 && (
          <span className="rcard__stars" aria-label={`${review.rating} out of 5 stars`}>
            {stars(review.rating)}
          </span>
        )}
        <blockquote>“{review.text}”</blockquote>
        <figcaption>
          <strong>{review.name}</strong>
          {review.meta && <span>{review.meta}</span>}
        </figcaption>
      </figure>
    </div>,
    document.body
  );
}

/*
 * Review card with a fixed text height: long reviews are cut to a few lines and get a
 * “Read more” link that opens the full review, so every card in the grid stays the same size.
 */
export default function ReviewCard({ review, avatar, nameNode, i = 0 }) {
  const textRef = useRef(null);
  const [clamped, setClamped] = useState(false);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const check = () => setClamped(el.scrollHeight > el.clientHeight + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [review.text]);

  return (
    <>
      <figure className="rcard reveal" style={{ '--d': `${(i % 3) * 100}ms` }}>
        <span className="rcard__stars" aria-label={`${review.rating} out of 5 stars`}>
          {stars(review.rating)}
        </span>
        <blockquote ref={textRef} className="rcard__text">
          “{review.text}”
        </blockquote>
        {clamped && (
          <button className="rcard__more" onClick={() => setOpen(true)}>
            Read more
          </button>
        )}
        <figcaption>
          {avatar || (
            <span className="rcard__avatar" aria-hidden="true">
              {review.name.trim()[0]?.toUpperCase()}
            </span>
          )}
          <span>
            <strong>{nameNode || review.name}</strong>
            {review.meta}
          </span>
        </figcaption>
      </figure>
      {open && <ReviewModal review={review} onClose={() => setOpen(false)} />}
    </>
  );
}
