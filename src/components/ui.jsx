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
  facebook: <path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6.5v3.5H9V21h3.5v-7.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15z" />,
  whatsapp: <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7zM9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .8a5 5 0 0 1-2.2-2.2l.8-1-1-2z" />,
  mail: <path d="M3 6h18v12H3zM3 7l9 6 9-6" />,
  star: <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z" />,
  award: <path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13.5L7 21l5-3 5 3-1.5-7.5" />,
  zap: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  drop: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />,
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

/* Text with **bold** parts, e.g. copy supplied by the clinic */
export function Rich({ text }) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
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
