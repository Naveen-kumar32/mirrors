import { SERVICES } from '../data';
import Page from '../components/Page';
import Hero from '../components/Hero';
import About from '../components/About';
import Treatments from '../components/Treatments';
import Doctors from '../components/Doctors';
import Reviews from '../components/Reviews';
import CTA from '../components/CTA';

export default function Home() {
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
