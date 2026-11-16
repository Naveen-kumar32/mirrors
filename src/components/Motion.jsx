import { useEffect, useRef } from 'react';

/*
 * Site-wide entrance animations — added on top of the existing design without changing it.
 * Elements matching the rules below animate in once as they scroll into view:
 *   up    – rise and fade in          left / right – slide in from that side
 *   zoom  – grow from slightly small  pop          – grow + rise (cards, tiles)
 * Cards in the same row/grid come in one after another (stagger).
 * Works for content that appears later too (reviews, blog posts, Shorts …) via a MutationObserver.
 * Elements that already use the older `.reveal` fade only get a different starting position.
 */
// Each part of the site has its own entrance, so scrolling feels varied:
//   flip  – cards swing up like a page turning      unfold – hinges open from one edge
//   swing – swings in from the side in 3D            deal   – flies up and settles, like dealt cards
//   drop  – drops in from above with a little bounce blur   – sharpens out of a soft blur
//   wipe  – photo uncovered by a curtain             mask   – heading rises from behind a line
//   up / left / right / zoom / pop – simple rise, slide and grow
const RULES = [
  // home
  ['.about__media img', 'wipe'],
  ['.about__text', 'right'],
  ['.about__badge', 'drop'],
  ['.cstat', 'flip', true],
  ['.ahours__tag', 'swing'],
  ['.ahours__body', 'unfold'],
  ['.why__head', 'left'],
  ['.why__body', 'blur'],
  ['.treatment', 'flip', true],
  ['.docfeature', 'unfold'],
  ['.docfeature__photo img', 'wipe'],
  ['.short', 'deal', true],
  ['.gsummary', 'zoom'],
  ['.gcard', 'drop', true],
  ['.post-card', 'flip', true],
  ['.post-feature', 'blur'],
  ['.post-feature__img img', 'wipe'],
  // inner pages
  ['.profile__photo img', 'wipe'],
  ['.profile__body', 'right'],
  ['.philo__head', 'left'],
  ['.philo__list li', 'swing', true],
  ['.promise', 'blur'],
  ['.facility', 'flip', true],
  ['.awards__list li', 'right', true],
  ['.faqs > *', 'up', true],
  ['.rcard', 'deal', true],
  ['.gallery__tile', 'zoom', true],
  ['.scard', 'flip', true],
  ['.igtile', 'deal', true],
  ['.contact-card, .contact__card', 'flip', true],
  // headings rise out from behind a mask
  ['.title', 'mask'],
  ['.phead__title', 'mask'],
  ['.ahours__title', 'mask'],
  // closing call-to-action + footer
  ['.cta__title', 'blur'],
  ['.cta__actions', 'drop'],
  ['.site-footer__grid > *', 'flip', true],
];

// Decorative bits that drift at their own speed while scrolling (depth / parallax)
const PARALLAX = [
  ['.phead__inset', -0.12],
  ['.phead__dots', 0.14],
  ['.phead__shape', 0.07],
  ['.about__badge', -0.16],
  ['.ahours__icon', -0.12],
  ['.cstat--lead', -0.05],
];
// Cards that lean towards the mouse pointer
const TILT = '.gcard, .cstat, .post-card, .facility, .rcard, .docfeature, .short, .scard';

const STAGGER_MS = 90;
const MAX_STAGGER = 6;

export default function Motion() {
  const bar = useRef(null);

  // scroll progress bar + parallax + card tilt
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      const mid = window.innerHeight / 2;
      PARALLAX.forEach(([sel, speed]) =>
        document.querySelectorAll(sel).forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
          el.style.translate = `0 ${((r.top + r.height / 2 - mid) * speed).toFixed(1)}px`;
        })
      );
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // tilt: only for a real mouse, not touch screens
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let tilted = null;
    const reset = (el) => {
      el.style.removeProperty('transform');
      el.classList.remove('is-tilting');
    };
    const onMove = (e) => {
      const el = e.target.closest?.(TILT);
      if (tilted && tilted !== el) {
        reset(tilted);
        tilted = null;
      }
      if (!el || el.classList.contains('mx') || (el.classList.contains('reveal') && !el.classList.contains('is-visible'))) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.classList.add('is-tilting');
      el.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateY(-6px)`;
      tilted = el;
    };
    const onLeaveDoc = () => tilted && (reset(tilted), (tilted = null));
    if (fine) {
      document.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerleave', onLeaveDoc);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeaveDoc);
    };
  }, []);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          // cards in a sideways-scrolling row: the ones off to the side never count as "on screen",
          // so when one card shows, its row-mates come in with it (still one after another)
          const row = [...e.target.parentElement.children].filter((c) => c !== e.target && c.classList.contains('mx'));
          [e.target, ...row].forEach((el) => {
          io.unobserve(el);
          // an older `.reveal` element that loaded too late for its own observer
          if (el.classList.contains('reveal')) {
            el.classList.add('is-visible');
            return;
          }
          el.classList.add('mx-in');
          // once it has arrived, drop the helper classes so hover effects work as before
          const done = () => {
            el.removeEventListener('transitionend', onEnd);
            el.removeEventListener('animationend', onEnd);
            el.classList.remove('mx', 'mx-in');
            el.removeAttribute('data-mx');
            el.style.removeProperty('--mxd');
            el.style.removeProperty('--mxr');
          };
          // only the element's own transform transition / animation counts (children animate too)
          const onEnd = (ev) => ev.target === el && (ev.type === 'animationend' || ev.propertyName === 'transform') && done();
          el.addEventListener('transitionend', onEnd);
          el.addEventListener('animationend', onEnd);
          setTimeout(done, 2000 + MAX_STAGGER * STAGGER_MS);
          });
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );

    const scan = () => {
      RULES.forEach(([selector, variant, stagger]) => {
        document.querySelectorAll(selector).forEach((el) => {
          if (el.dataset.mxDone) return;
          el.dataset.mxDone = '1';
          if (el.classList.contains('reveal')) {
            // already fades in via `.reveal` — just give it this rule's starting position
            if (!el.classList.contains('is-visible')) el.setAttribute('data-mx', variant);
            return;
          }
          el.classList.add('mx');
          el.setAttribute('data-mx', variant);
          if (stagger) {
            const siblings = [...el.parentElement.children].filter((c) => c.matches(selector));
            const i = siblings.indexOf(el);
            el.style.setProperty('--mxd', `${Math.min(i, MAX_STAGGER) * STAGGER_MS}ms`);
            el.style.setProperty('--mxr', `${i % 2 ? -7 : 7}deg`); // 'deal': alternate left/right tilt
          }
          io.observe(el);
        });
      });
      // safety net: any `.reveal` content added after its page's own fade-in observer ran
      // (e.g. sections filled from the server a moment later) still fades in, never stays hidden
      document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
        if (el.dataset.mxWatch) return;
        el.dataset.mxWatch = '1';
        io.observe(el);
      });
    };

    // wait for the opening loader to finish, like the existing fade-ins
    let frame;
    const queueScan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    };
    const mo = new MutationObserver(queueScan);
    const begin = () => {
      scan();
      mo.observe(document.body, { childList: true, subtree: true });
    };
    let timer;
    if (document.documentElement.classList.contains('is-ready')) begin();
    else
      timer = setInterval(() => {
        if (document.documentElement.classList.contains('is-ready')) {
          clearInterval(timer);
          begin();
        }
      }, 100);

    return () => {
      clearInterval(timer);
      cancelAnimationFrame(frame);
      mo.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div className="scrollbar" aria-hidden="true">
      <span ref={bar} />
    </div>
  );
}
