import { useEffect } from 'react';

const ICONS = {
  chat: <path d="M4 5h16v11H9l-5 4V5z" />,
  plan: <path d="M9 3h6v3H9zM6 5H5v16h14V5h-1M9 11h6M9 15h4" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  pin: <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8.2-8 9-4.5-.8-8-4-8-9V6zM9 12l2 2 4-4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12l5 5 9-10" />,
  menu: <path d="M4 8h16M4 16h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  instagram: <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17.5 6.5h.01" />,
};

export function Icon({ name, size = 20, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

export function Stars() {
  return (
    <span className="stars" role="img" aria-label="5 out of 5 stars">
      {'★★★★★'}
    </span>
  );
}

/* Small heading used above every section title */
export function Eyebrow({ children }) {
  return <p className="eyebrow reveal">{children}</p>;
}

/* Fades elements with the "reveal" class in as they scroll into view.
   Re-runs whenever `key` changes (e.g. on a new page) and waits for the opening loader. */
export function useReveal(key) {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px' }
    );
    const start = () => els.forEach((el) => io.observe(el));
    let timer;
    if (document.documentElement.classList.contains('is-ready')) start();
    else
      timer = setInterval(() => {
        if (document.documentElement.classList.contains('is-ready')) {
          clearInterval(timer);
          start();
        }
      }, 100);
    return () => {
      clearInterval(timer);
      io.disconnect();
    };
  }, [key]);
}
