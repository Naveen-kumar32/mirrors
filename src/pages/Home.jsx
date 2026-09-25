import Page from '../components/Page';
import Hero from '../components/Hero';
import Marquee from '../components/Marquee';
import About from '../components/About';
import Services from '../components/Services';
import Journey from '../components/Journey';
import BeforeAfter from '../components/BeforeAfter';
import Bento from '../components/Bento';
import Team from '../components/Team';
import Testimonials from '../components/Testimonials';
import ChatCTA from '../components/ChatCTA';

export default function Home() {
  return (
    <Page>
      <Hero />
      <Marquee />
      <About />
      <Services />
      <Journey />
      <BeforeAfter />
      <Bento />
      <Team />
      <Testimonials />
      <ChatCTA />
    </Page>
  );
}
