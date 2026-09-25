import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { Cursor, Grain, Nav, Preloader, ScrollProgress } from './components/Chrome';
import { ChatProvider } from './chat/ChatProvider';
import ChatWidget from './chat/ChatWidget';
import { ReadyContext } from './ready';
import { scrollToTop } from './lib';
import Home from './pages/Home';
import About from './pages/About';
import Treatments from './pages/Treatments';
import TreatmentDetail from './pages/TreatmentDetail';
import Journey from './pages/Journey';
import Results from './pages/Results';
import Specialists from './pages/Specialists';
import Stories from './pages/Stories';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" onExitComplete={() => scrollToTop({ immediate: true })}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/treatments" element={<Treatments />} />
        <Route path="/treatments/:slug" element={<TreatmentDetail />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="/results" element={<Results />} />
        <Route path="/specialists" element={<Specialists />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);

  // Buttery smooth scrolling (skipped for reduced-motion users)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    window.__lenis = lenis;
    let raf;
    const loop = (t) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      window.__lenis = undefined;
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = loading ? 'hidden' : '';
    if (window.__lenis) loading ? window.__lenis.stop() : window.__lenis.start();
    if (loading) window.scrollTo(0, 0);
  }, [loading]);

  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <ReadyContext.Provider value={!loading}>
          <ChatProvider>
            <AnimatePresence>{loading && <Preloader onDone={() => setLoading(false)} />}</AnimatePresence>
            <Grain />
            <Cursor />
            <ScrollProgress />
            <Nav />
            <AnimatedRoutes />
            <ChatWidget />
          </ChatProvider>
        </ReadyContext.Provider>
      </MotionConfig>
    </BrowserRouter>
  );
}
