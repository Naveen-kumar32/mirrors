import { useEffect } from 'react';
import { hasSeenBooking, useChat } from '../chat/ChatProvider';
import Page from '../components/Page';
import Hero from '../components/Hero';
import About from '../components/About';
import ClinicStats from '../components/ClinicStats';
import EveningClinic from '../components/EveningClinic';
import { FeaturedTreatments, WhyChoose } from '../components/Featured';
import Doctors from '../components/Doctors';
import HomeShorts from '../components/HomeShorts';
import Reviews from '../components/Reviews';
import CTA from '../components/CTA';
import BlogPreview from '../components/Blog';

/* Opens the booking form once per page load when the visitor has scrolled halfway through the
   "Meet your dermatologist" section (its middle reaches the middle of the screen) */
function useAutoBooking() {
  const { openBooking, booking } = useChat();
  useEffect(() => {
    if (booking || hasSeenBooking()) return;
    const onScroll = () => {
      const doctor = document.querySelector('.docsec');
      if (!doctor) return;
      const r = doctor.getBoundingClientRect();
      if (r.top + r.height / 2 > window.innerHeight / 2) return;
      window.removeEventListener('scroll', onScroll);
      if (!hasSeenBooking()) openBooking();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [openBooking, booking]);
}

export default function Home() {
  useAutoBooking();
  return (
    <Page>
      <Hero />
      <ClinicStats />
      <About link />
      <EveningClinic />
      <WhyChoose />
      <FeaturedTreatments />
      <Doctors />
      <HomeShorts />
      <Reviews />
      <BlogPreview />
      <CTA />
    </Page>
  );
}
