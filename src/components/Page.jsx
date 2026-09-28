import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useReveal } from './ui';

const BASE_TITLE = 'The Mirrors Dermatology Clinic';

/* Wraps each route: sets the tab title and starts the scroll fade-ins */
export default function Page({ title, children }) {
  const { pathname } = useLocation();
  useReveal(pathname);

  useEffect(() => {
    document.title = title ? `${title} — ${BASE_TITLE}` : `${BASE_TITLE} — Coimbatore`;
  }, [title]);

  return <main className="page">{children}</main>;
}
