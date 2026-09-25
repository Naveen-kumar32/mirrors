import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { EASE_IN_OUT } from '../lib';
import Footer from './Footer';

const BASE_TITLE = 'Mirrors Dema Dermatology Clinic';

/* Wraps every route: sets the document title and plays the curtain transition */
export default function Page({ title, children }) {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE_TITLE}` : `${BASE_TITLE} — Skin science, beautifully personal`;
  }, [title]);

  return (
    <>
      <main className="page">{children}</main>
      <Footer />

      {/* rises to cover the old page */}
      <motion.div
        className="curtain curtain--in"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 1 }}
        transition={{ duration: 0.65, ease: EASE_IN_OUT }}
        aria-hidden="true"
      />
      {/* lifts away to reveal the new page */}
      <motion.div
        className="curtain curtain--out"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 0 }}
        transition={{ duration: 0.8, ease: EASE_IN_OUT, delay: 0.1 }}
        aria-hidden="true"
      >
        <motion.span
          className="curtain__word"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4 }}
        >
          {title || 'Mirrors Dema'}
        </motion.span>
      </motion.div>
    </>
  );
}
