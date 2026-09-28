import { useEffect, useState } from 'react';
import { BRAND } from '../data';

/* Opening screen: the logo fades in while a thin line fills beneath it */
export default function Loader({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 1700);
    const t2 = setTimeout(onDone, 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div className={`loader ${leaving ? 'is-leaving' : ''}`} aria-hidden="true">
      <img className="loader__logo" src={BRAND.logo} alt="" />
      <p className="loader__name">The Mirrors</p>
      <span className="loader__line" />
    </div>
  );
}
