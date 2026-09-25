export const EASE = [0.22, 1, 0.36, 1];
export const EASE_IN_OUT = [0.76, 0, 0.24, 1];

export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { duration: 1.6 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

export function scrollToTop({ immediate = false } = {}) {
  if (window.__lenis) window.__lenis.scrollTo(0, immediate ? { immediate: true, force: true } : { duration: 1.6 });
  else window.scrollTo({ top: 0, behavior: immediate ? 'instant' : 'smooth' });
}

export const wrap = (min, max, v) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};
