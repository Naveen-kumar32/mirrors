import { useEffect, useRef } from 'react';
import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { EASE } from '../lib';

// `*word*` (optionally followed by punctuation) renders in italic serif
const EMPHASIS = /^\*(.+)\*(\W*)$/;

/* Fade + rise when scrolled into view */
export function Reveal({ children, delay = 0, y = 40, className, as = 'div', ...rest }) {
  const M = motion[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 1, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </M>
  );
}

/* Word-by-word masked reveal. Wrap a word in *asterisks* to italicise it. */
export function SplitWords({ text, className = '', delay = 0, stagger = 0.07, animateNow }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const show = animateNow ?? inView;
  const words = text.split(' ');
  return (
    <span ref={ref} className={`split ${className}`} aria-label={text.replaceAll('*', '')} role="text">
      {words.map((raw, i) => {
        const m = raw.match(EMPHASIS);
        return (
          <span className="split__mask" key={i} aria-hidden="true">
            <motion.span
              className="split__word"
              initial={{ y: '115%', rotate: 5 }}
              animate={show ? { y: '0%', rotate: 0 } : undefined}
              transition={{ duration: 1.1, ease: EASE, delay: delay + i * stagger }}
            >
              {m ? (
                <>
                  <em>{m[1]}</em>
                  {m[2]}
                </>
              ) : (
                raw
              )}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

/* Paragraph whose words light up as you scroll through it */
function ScrollWord({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  const y = useTransform(progress, range, [6, 0]);
  return (
    <span className="sw">
      <motion.span style={{ opacity, y }}>{children}</motion.span>{' '}
    </span>
  );
}

export function ScrollRevealText({ text, className = '' }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.5'] });
  const words = text.split(' ');
  return (
    <p ref={ref} className={`scroll-text ${className}`}>
      {words.map((w, i) => {
        const s = i / words.length;
        const m = w.match(EMPHASIS);
        return (
          <ScrollWord key={i} progress={scrollYProgress} range={[s, s + 1 / words.length]}>
            {m ? (
              <>
                <em>{m[1]}</em>
                {m[2]}
              </>
            ) : (
              w
            )}
          </ScrollWord>
        );
      })}
    </p>
  );
}

/* Element that is pulled toward the pointer */
export function Magnetic({ children, strength = 0.35, className = '' }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 14, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 14, mass: 0.4 });

  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`magnetic ${className}`}
      style={{ x: sx, y: sy }}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  );
}

/* 3D tilt card with moving glare highlight */
export function Tilt({ children, className = '', max = 9, ...rest }) {
  const ref = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const srx = useSpring(rx, { stiffness: 160, damping: 16 });
  const sry = useSpring(ry, { stiffness: 160, damping: 16 });
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.38), transparent 55%)`;

  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * max * 2);
    rx.set(-(py - 0.5) * max * 2);
    gx.set(px * 100);
    gy.set(py * 100);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`tilt ${className}`}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 1000 }}
      onPointerMove={onMove}
      onPointerLeave={reset}
      {...rest}
    >
      {children}
      <motion.div className="tilt__glare" style={{ background: glare }} aria-hidden="true" />
    </motion.div>
  );
}

/* Number that counts up once visible */
export function Counter({ to, suffix = '', decimals = 0, duration = 2.2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) =>
    v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix
  );

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, to, duration, mv]);

  return <motion.span ref={ref}>{text}</motion.span>;
}

/* Image that reveals with a clip-path wipe and drifts on scroll */
export function ParallaxImage({ src, alt, className = '', speed = 0.12, delay = 0 }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${speed * 100}%`, `${speed * 100}%`]);
  return (
    <motion.div
      ref={ref}
      className={`pimg ${className}`}
      initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, margin: '-12%' }}
      transition={{ duration: 1.4, ease: EASE, delay }}
    >
      <motion.img src={src} alt={alt} loading="lazy" style={{ y, scale: 1 + speed * 2.4 }} />
    </motion.div>
  );
}

/* Circular text badge that spins */
export function RotatingBadge({ text, className = '', children }) {
  return (
    <div className={`rbadge ${className}`} aria-hidden="true">
      <svg viewBox="0 0 200 200">
        <defs>
          <path id="rbadge-circle" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0" />
        </defs>
        <text>
          <textPath href="#rbadge-circle">{text}</textPath>
        </text>
      </svg>
      <div className="rbadge__center">{children}</div>
    </div>
  );
}

const ICONS = {
  chat: <path d="M4 5h16v11H9l-5 4V5z" />,
  scan: <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M7 12h10" />,
  plan: <path d="M9 3h6v3H9zM6 5H5v16h14V5h-1M9 11h6M9 15h4" />,
  spark: <path d="M12 3l1.8 5.6L19.5 10l-5.7 1.6L12 17l-1.8-5.4L4.5 10l5.7-1.4z M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />,
  leaf: <path d="M5 20C5 11 11 4 20 4c0 9-6 15-15 16zM5 20l8-8" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8.2-8 9-4.5-.8-8-4-8-9V6zM9 12l2 2 4-4" />,
  pin: <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  mail: <path d="M3 6h18v12H3zM3 6l9 7 9-7" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2" />,
  video: <path d="M3 7h12v10H3zM15 10l6-3v10l-6-3" />,
  plus: <path d="M12 5v14M5 12h14" />,
  instagram: <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17.5 6.5h.01" />,
};

export function Icon({ name, size = 22, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

export function Stars({ n = 5 }) {
  return (
    <span className="stars" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"
          />
        </svg>
      ))}
    </span>
  );
}

/* Coloured monogram used instead of photos for patient reviews */
export function Initials({ name, size = 44 }) {
  const letters = name
    .replace(/[^A-Za-z ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('');
  const tone = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 3;
  return (
    <span className={`initials initials--${tone}`} style={{ width: size, height: size }} aria-hidden="true">
      {letters}
    </span>
  );
}

export function SectionLabel({ children, light }) {
  return (
    <Reveal as="p" y={16} className={`section-label ${light ? 'is-light' : ''}`}>
      <span className="section-label__dot" />
      {children}
    </Reveal>
  );
}
