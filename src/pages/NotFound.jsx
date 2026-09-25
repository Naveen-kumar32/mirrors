import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Page from '../components/Page';
import { useChat } from '../chat/ChatProvider';
import { SplitWords } from '../components/ui';

export default function NotFound() {
  const chat = useChat();
  return (
    <Page title="Page not found">
      <section className="notfound">
        <div className="aurora" aria-hidden="true">
          <span className="aurora__blob a1" />
          <span className="aurora__blob a2" />
        </div>
        <motion.span
          className="notfound__big"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          aria-hidden="true"
        >
          404
        </motion.span>
        <h1 className="h2">
          <SplitWords text="This page is *off* the map." animateNow delay={0.6} />
        </h1>
        <p className="lead">It may have moved, or never existed. Let’s get you somewhere useful.</p>
        <div className="notfound__btns">
          <Link to="/" className="btn btn--primary">
            Back home
          </Link>
          <button className="btn btn--ghost" onClick={() => chat.open()}>
            Ask Aura
          </button>
        </div>
      </section>
    </Page>
  );
}
