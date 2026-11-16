import { useLayoutEffect, useRef } from 'react';
import { HOURS, IMG, img } from '../data';
import { useChat } from '../chat/ChatProvider';
import { Icon } from './ui';

// The photo is 3120 × 2667; the top of the woman's head is 15% down from its top edge
const PHOTO_RATIO = 3120 / 2667;
const HEAD_TOP = 0.15;

/* On wide screens the photo is taller than the banner and gets cropped. Pick the crop so the
   top of the head sits level with the small "Dermatology Clinic · Coimbatore" line:
   never behind the navbar, never pushed too low. Phones use their own layout (styles.css). */
function useHeadAlign(heroRef, kickerRef) {
  useLayoutEffect(() => {
    const align = () => {
      const hero = heroRef.current;
      const kicker = kickerRef.current;
      if (!hero || !kicker) return;
      if (window.matchMedia('(max-width: 760px)').matches) return hero.style.removeProperty('--hero-y');
      const photoH = Math.max(hero.clientHeight, hero.clientWidth / PHOTO_RATIO); // photo height once it covers the banner
      const spare = photoH - hero.clientHeight; // how much has to be cropped
      // distance from the banner's top to the line (offsetTop ignores the fade-in animation)
      let lineTop = 0;
      for (let el = kicker; el && el !== hero; el = el.offsetParent) lineTop += el.offsetTop;
      const top = lineTop - HEAD_TOP * photoH;
      hero.style.setProperty('--hero-y', `${Math.round(Math.min(0, Math.max(-spare, top)))}px`);
    };
    align();
    document.fonts?.ready.then(align);
    window.addEventListener('resize', align);
    return () => window.removeEventListener('resize', align);
  }, [heroRef, kickerRef]);
}

export default function Hero() {
  const chat = useChat();
  const heroRef = useRef(null);
  const kickerRef = useRef(null);
  useHeadAlign(heroRef, kickerRef);
  return (
    <section className="hero" id="top" ref={heroRef}>
      <div className="hero__bg" aria-hidden="true">
        {/* full-width photo: the browser picks the size that stays sharp on this screen (incl. retina and TVs) */}
        <img
          src={img(IMG.resultsHero, 1600)}
          srcSet={[960, 1600, 2400, 3200].map((w) => `/images/site/${IMG.resultsHero}-${w}.webp ${w}w`).join(', ')}
          sizes="100vw"
          alt=""
          fetchPriority="high"
        />
      </div>
      <div className="container hero__content">
        <p className="hero__kicker" ref={kickerRef}>Dermatology Clinic · Coimbatore</p>
        <h1 className="hero__title">
          Rooted in science,
          <br />
          <em>reflected</em> in your skin.
        </h1>
        <p className="hero__text">
          A calm, welcoming dermatology clinic in Neelambur, Coimbatore — here to understand your skin,
          hair and nail concerns and help you look after them for the long term.
        </p>
        <div className="hero__actions">
          <button className="btn btn--navy" onClick={() => chat.open()}>
            Talk to us <Icon name="chat" size={18} />
          </button>
          <button className="btn btn--ghost" onClick={() => chat.openBooking()}>
            Book appointment
          </button>
        </div>
        <p className="hero__hours">
          <Icon name="clock" size={16} /> {HOURS[0].day}, {HOURS[0].time}
        </p>
      </div>
    </section>
  );
}
