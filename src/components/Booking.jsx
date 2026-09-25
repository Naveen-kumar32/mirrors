import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CONTACT, SERVICES, TEAM } from '../data';
import { downloadIcs, isoDate, submitRequest, TIME_SLOTS } from '../api';
import { useChat } from '../chat/ChatProvider';
import { EASE } from '../lib';
import { Icon, Magnetic, Reveal, SectionLabel, SplitWords } from './ui';

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoDate(d);
};

export default function Booking() {
  const chat = useChat();
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    setStatus('sending');
    try {
      const ref = await submitRequest('appointment', { ...fields, source: 'contact-form' });
      setResult({ ...fields, ref });
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="book" id="book">
      <div className="aurora aurora--book" aria-hidden="true">
        <span className="aurora__blob a1" />
        <span className="aurora__blob a2" />
        <span className="aurora__blob a3" />
      </div>

      <div className="book__inner">
        <div className="book__text">
          <SectionLabel light>Request an appointment</SectionLabel>
          <h2 className="h2">
            <SplitWords text="Your skin, *our* science. Let’s begin." />
          </h2>
          <Reveal as="p" className="lead" delay={0.15}>
            Tell us a little about what’s going on. A patient coordinator will call within one
            business day to confirm a time that suits you.
          </Reveal>
          <Reveal className="book__contacts" delay={0.25}>
            <a href={CONTACT.phoneHref}>
              <Icon name="phone" size={18} /> {CONTACT.phone}
            </a>
            <a href={CONTACT.instagram} target="_blank" rel="noreferrer">
              <Icon name="instagram" size={18} /> {CONTACT.instagramHandle}
            </a>
            <a href={CONTACT.mapsHref} target="_blank" rel="noreferrer">
              <Icon name="pin" size={18} /> {CONTACT.address}, Neelambur
            </a>
          </Reveal>
          <Reveal className="book__chat" delay={0.35}>
            <span className="aura-avatar" style={{ width: 44, height: 44 }}>
              <span>a</span>
            </span>
            <p>
              <strong>Prefer to chat?</strong>
              Aura can book you in step by step.
            </p>
            <button className="btn btn--light btn--sm" onClick={() => chat.open('book')}>
              Open chat
            </button>
          </Reveal>
        </div>

        <Reveal className="book__panel" y={60} delay={0.1}>
          <AnimatePresence mode="wait">
            {status !== 'sent' ? (
              <motion.form
                key="form"
                className="form"
                onSubmit={submit}
                exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
                transition={{ duration: 0.4 }}
              >
                <div className="form__row">
                  <label className="field">
                    <span>Full name</span>
                    <input name="name" required autoComplete="name" placeholder="Jane Doe" />
                  </label>
                  <label className="field">
                    <span>Phone</span>
                    <input name="phone" type="tel" required autoComplete="tel" placeholder="98765 43210" />
                  </label>
                </div>
                <label className="field">
                  <span>Email</span>
                  <input name="email" type="email" required autoComplete="email" placeholder="you@email.com" />
                </label>
                <div className="form__row">
                  <label className="field">
                    <span>I’m interested in</span>
                    <select name="concern" defaultValue="" required>
                      <option value="" disabled>
                        Choose a treatment
                      </option>
                      {SERVICES.map((s) => (
                        <option key={s.slug}>{s.title}</option>
                      ))}
                      <option>General consultation</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Dermatologist</span>
                    <select name="doctor" defaultValue="No preference">
                      <option>No preference</option>
                      {TEAM.map((t) => (
                        <option key={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="form__row">
                  <label className="field">
                    <span>Preferred date</span>
                    <input name="date" type="date" min={tomorrow()} required />
                  </label>
                  <label className="field">
                    <span>Preferred time</span>
                    <select name="time" defaultValue={TIME_SLOTS[1]}>
                      {TIME_SLOTS.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="field">
                  <span id="visit-type">Visit type</span>
                  <div className="seg" role="radiogroup" aria-labelledby="visit-type">
                    <label>
                      <input type="radio" name="visitType" value="In clinic" defaultChecked />
                      <span>In clinic</span>
                    </label>
                    <label>
                      <input type="radio" name="visitType" value="Video consult" />
                      <span>Video consult</span>
                    </label>
                  </div>
                </div>
                <label className="field">
                  <span>Anything we should know?</span>
                  <textarea name="notes" rows="3" placeholder="Briefly describe your concern" />
                </label>
                {status === 'error' && (
                  <p className="form__error" role="alert">
                    Sorry, that didn’t go through. Please try again or call {CONTACT.phone}.
                  </p>
                )}
                <Magnetic strength={0.2} className="form__submit">
                  <button className="btn btn--primary btn--block" type="submit" disabled={status === 'sending'}>
                    {status === 'sending' ? 'Sending…' : 'Request appointment'}
                    <span className="btn__icon">
                      <Icon name="arrow" size={18} />
                    </span>
                  </button>
                </Magnetic>
                <p className="form__fine">No referral needed · We reply within 1 business day</p>
              </motion.form>
            ) : (
              <motion.div
                key="done"
                className="form-done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <svg viewBox="0 0 80 80" width="96" height="96" aria-hidden="true">
                  <motion.circle
                    cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="3"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: EASE }}
                  />
                  <motion.path
                    d="M25 41l10 10 20-22" fill="none" stroke="currentColor" strokeWidth="4"
                    strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: EASE, delay: 0.6 }}
                  />
                </svg>
                <h3>Thank you, {result.name.split(' ')[0]}!</h3>
                <p>
                  We’ve received your request and will call {result.phone} within one business day to
                  confirm.
                </p>
                <p className="form-done__ref">
                  Reference <strong>{result.ref}</strong>
                </p>
                <div className="form-done__btns">
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() =>
                      downloadIcs({ date: result.date, time: result.time, title: `Mirrors Dema — ${result.concern}`, ref: result.ref })
                    }
                  >
                    Add to calendar
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => setStatus('idle')}>
                    New request
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  );
}
