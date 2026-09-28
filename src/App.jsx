import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ChatProvider } from './chat/ChatProvider';
import ChatWidget from './chat/ChatWidget';
import Loader from './components/Loader';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Treatments from './pages/Treatments';
import TreatmentDetail from './pages/TreatmentDetail';
import Doctors from './pages/Doctors';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

/* Jumps to the top and runs a thin progress bar on every page change */
function RouteChange() {
  const { pathname } = useLocation();
  const first = useRef(true);
  const [k, setK] = useState(0);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (first.current) {
      first.current = false;
      return;
    }
    setK((n) => n + 1);
  }, [pathname]);
  return k ? <div className="route-bar" key={k} aria-hidden="true" /> : null;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const done = useCallback(() => setReady(true), []);

  useEffect(() => {
    document.documentElement.classList.toggle('is-ready', ready);
  }, [ready]);

  return (
    <BrowserRouter>
      <ChatProvider>
        {!ready && <Loader onDone={done} />}
        <RouteChange />
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/treatments" element={<Treatments />} />
          <Route path="/treatments/:slug" element={<TreatmentDetail />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/specialists" element={<Doctors />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
        <ChatWidget />
      </ChatProvider>
    </BrowserRouter>
  );
}
