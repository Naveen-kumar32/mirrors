import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { IMG, img } from '../data';
import { EASE, scrollToId } from '../lib';
import { useReady } from '../ready';
import { useChat } from '../chat/ChatProvider';
import { Icon, Magnetic, RotatingBadge, SplitWords, Stars } from './ui';

/* Mouse-driven depth layer */
function useDepth(mx, my, depth) {
  return {
    x: useTransform(mx, (v) => v * depth),
    y: useTransform(my, (v) => v * depth),
  };
}

export default function Hero() {
  const ready = useReady();
  const chat = useChat();
  const ref = useRef(null);
  const heroImg = useRef(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (heroImg.current?.complete && heroImg.current.naturalWidth) setLoaded(true);
  }, []);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  // Scroll parallax — each layer travels at its own speed
  const yText = useTransform(scrollYProgress, [0, 1], ['0%', '45%']);
  const yVisual = useTransform(scrollYProgress, [0, 1], ['0%', '-12%']);
  const yAurora = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.3]);

  // Pointer parallax
  const mx = useSpring(useMotionValue(0), { stiffness: 50, damping: 18 });
  const my = useSpring(useMotionValue(0), { stiffness: 50, damping: 18 });
  const d1 = useDepth(mx, my, 18);
  const d2 = useDepth(mx, my, -30);
  const d3 = useDepth(mx, my, 48);
  const d4 = useDepth(mx, my, -60);

  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    mx.set(e.clientX / window.innerWidth - 0.5);
    my.set(e.clientY / window.innerHeight - 0.5);
  };

  const pop = (delay) => ({
    initial: { opacity: 0, y: 40, scale: 0.9 },
    animate: ready ? { opacity: 1, y: 0, scale: 1 } : undefined,
    transition: { duration: 1.1, ease: EASE, delay },
  });

  return (
    <section className="hero" id="top" ref={ref} onPointerMove={onMove}>
      <motion.div className="aurora" style={{ y: yAurora }} aria-hidden="true">
        <span className="aurora__blob a1" />
        <span className="aurora__blob a2" />
        <span className="aurora__blob a3" />
      </motion.div>
      <div className="hero__lines" aria-hidden="true" />

      <motion.div className="hero__content" style={{ y: yText, opacity: fade }}>
        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <span className="pulse" /> Now welcoming new patients
        </motion.p>

        <h1 className="hero__title">
          <SplitWords text="Skin science," animateNow={ready} delay={0.1} />
          <SplitWords text="*beautifully*" animateNow={ready} delay={0.25} className="hero__title-em" />
          <SplitWords text="personal." animateNow={ready} delay={0.4} />
        </h1>

        <motion.p
          className="hero__lead"
          initial={{ opacity: 0, y: 24 }}
          animate={ready ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 1, ease: EASE, delay: 0.7 }}
        >
          Board-certified dermatologists treating everything from stubborn acne to skin cancer —
          with calm clinics, honest advice and plans built around <em>your</em> skin.
        </motion.p>

        <motion.div
          className="hero__ctas"
          initial={{ opacity: 0, y: 24 }}
          animate={ready ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 1, ease: EASE, delay: 0.85 }}
        >
          <Magnetic>
            <button className="btn btn--primary" onClick={() => chat.open('book')}>
              Book a consultation
              <span className="btn__icon">
                <Icon name="arrow" size={18} />
              </span>
            </button>
          </Magnetic>
          <Link className="btn btn--ghost" to="/treatments">
            Explore treatments
          </Link>
        </motion.div>

        <motion.div
          className="hero__trust"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : undefined}
          transition={{ duration: 1, delay: 1.1 }}
        >
          <div className="avatars">
            {[IMG.trust1, IMG.trust2, IMG.trust3].map((id) => (
              <img key={id} src={img(id, 120)} alt="" />
            ))}
            <span>18k+</span>
          </div>
          <p>
            <strong>18,000+ patients</strong>
            <br />
            trust their skin to us
          </p>
        </motion.div>
      </motion.div>

      <motion.div className="hero__visual" style={{ y: yVisual, scale }}>
        <motion.div className="hero__ring" style={d2} aria-hidden="true" />
        <motion.div className="hero__blob-wrap" style={d1}>
          <motion.div
            className="hero__blob"
            data-cursor="view"
            data-cursor-label="Hello"
            initial={{ clipPath: 'circle(0% at 50% 60%)' }}
            animate={ready && loaded ? { clipPath: 'circle(80% at 50% 50%)' } : undefined}
            transition={{ duration: 1.8, ease: EASE, delay: 0.15 }}
          >
            <motion.img
              ref={heroImg}
              onLoad={() => setLoaded(true)}
              src={img(IMG.hero, 1100)}
              alt="Woman with clear, healthy skin"
              style={{ scale: imgScale }}
              fetchPriority="high"
            />
          </motion.div>
        </motion.div>

        <motion.div className="hero__float hero__float--rating" style={d3}>
          <motion.div className="glass" {...pop(1.0)}>
            <Stars />
            <p>
              <strong>4.9</strong> from 2,300+ reviews
            </p>
          </motion.div>
        </motion.div>

        <motion.div className="hero__float hero__float--slot" style={d4}>
          <motion.div className="glass" {...pop(1.2)}>
            <span className="glass__icon">
              <Icon name="clock" size={18} />
            </span>
            <p>
              Evening clinic
              <strong>Mon – Sat · 3 – 7 pm</strong>
            </p>
          </motion.div>
        </motion.div>

        <motion.div className="hero__float hero__float--pill" style={d2}>
          <motion.div className="clay-pill" {...pop(1.35)}>
            <Icon name="shield" size={16} /> SPF 50 · every day
          </motion.div>
        </motion.div>

        <motion.div className="hero__float hero__float--badge" style={d3}>
          <motion.div {...pop(1.5)}>
            <RotatingBadge text="BOARD CERTIFIED • MEDICAL • SURGICAL • AESTHETIC • ">
              <Icon name="spark" size={26} />
            </RotatingBadge>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.button
        className="hero__scroll"
        onClick={() => scrollToId('about')}
        style={{ opacity: fade }}
        aria-label="Scroll to content"
      >
        <span className="hero__scroll-line" />
        Scroll
      </motion.button>
    </section>
  );
}
