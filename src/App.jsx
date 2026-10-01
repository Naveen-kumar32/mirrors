import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ChatProvider } from './chat/ChatProvider';
import ChatWidget from './chat/ChatWidget';
import BookingModal from './chat/BookingModal';
import Loader from './components/Loader';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Treatments from './pages/Treatments';
import TreatmentDetail from './pages/TreatmentDetail';
import Doctors from './pages/Doctors';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Gallery from './pages/Gallery';
import PatientReviews from './pages/PatientReviews';
import NotFound from './pages/NotFound';

// Staff area is loaded only when someone opens /admin
const AdminApp = lazy(() => import('./admin/AdminApp'));

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

/* The public website: header, pages, footer, chat and booking form */
function PublicSite() {
  const [ready, setReady] = useState(false);
  const done = useCallback(() => setReady(true), []);

  useEffect(() => {
    document.documentElement.classList.toggle('is-ready', ready);
  }, [ready]);

  return (
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
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/reviews" element={<PatientReviews />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <ChatWidget />
      <BookingModal />
    </ChatProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<p className="admin-loading">Loading…</p>}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="*" element={<PublicSite />} />
      </Routes>
    </BrowserRouter>
  );
}
