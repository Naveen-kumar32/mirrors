import { Link } from 'react-router-dom';
import Page from '../components/Page';

export default function NotFound() {
  return (
    <Page title="Page not found">
      <section className="notfound">
        <div className="container">
          <p className="eyebrow">Error 404</p>
          <h1 className="title">
            This page could not be <em>found</em>
          </h1>
          <Link to="/" className="btn btn--navy">
            Back to home
          </Link>
        </div>
      </section>
    </Page>
  );
}
