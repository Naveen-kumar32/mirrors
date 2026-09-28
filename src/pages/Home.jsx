import { useEffect } from 'react';
import { SERVICES } from '../data';
import { hasSeenBooking, useChat } from '../chat/ChatProvider';
import Page from '../components/Page';
import Hero from '../components/Hero';
import About from '../components/About';
import Treatments from '../components/Treatments';
import Doctors from '../components/Doctors';
import Reviews from '../components/Reviews';
import CTA from '../components/CTA';

/* Opens the booking form once per page load when the visitor scrolls halfway down the page */
function useAutoBooking() {
  const { openBooking, booking } = useChat();
  useEffect(() => {
    if (booking || hasSeenBooking()) return;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0 || window.scrollY < max * 0.5) return;
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
      <About link />
      <Treatments items={SERVICES} />
      <Doctors />
      <Reviews />
      <CTA />
    </Page>
  );
}
