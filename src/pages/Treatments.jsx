import { IMG } from '../data';
import Page from '../components/Page';
import PageHeader from '../components/PageHeader';
import Treatments from '../components/Treatments';
import CTA from '../components/CTA';

export default function TreatmentsPage() {
  return (
    <Page title="Treatments">
      <PageHeader
        eyebrow="Treatments"
        title="Treatments for skin, hair and nails"
        text="Every procedure is planned after an individual skin assessment by our dermatologist."
        image={IMG.nLaser}
        image2={IMG.tChemPeel}
      />
      <Treatments heading={false} />
      <CTA title="Not sure which treatment you need?" />
    </Page>
  );
}
