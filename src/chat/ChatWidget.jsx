import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { CONTACT, HOURS, PRICING, SERVICES, img } from '../data';
import { downloadIcs } from '../api';
import { EASE } from '../lib';
import { Icon } from '../components/ui';
import { useChat } from './ChatProvider';
import { first } from './flow';

/* ---------- Rich message cards ---------- */
function Summary({ d }) {
  const rows = [
    ['Treatment', d.concern],
    ['Patient', d.patientType],
    ['Visit', d.visitType],
    ['Dermatologist', d.doctor],
    ['When', d.dateLabel && `${d.dateLabel} · ${d.time}`],
    ['Name', d.name],
    ['Phone', d.phone],
    ['Email', d.email],
    ['Notes', d.notes],
  ].filter(([, v]) => v);
  return (
    <div className="cc cc--summary">
      <p className="cc__title">
        <Icon name="plan" size={16} /> Appointment request
      </p>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Confirm({ d, kind }) {
  const copy = {
    booking: {
      title: 'Request sent!',
      text: `Thanks ${first(d.name)} — our care team will call ${d.phone} within one business day to confirm your appointment.`,
    },
    callback: {
      title: 'Call back booked',
      text: `We’ll call you on ${d.phone} (${String(d.callTime).toLowerCase()}).`,
    },
    enquiry: {
      title: 'Question sent',
      text: `We’ll reply to ${d.email}, usually within one business day.`,
    },
  }[kind];

  return (
    <div className="cc cc--confirm">
      <svg viewBox="0 0 52 52" width="44" height="44" aria-hidden="true">
        <motion.circle cx="26" cy="26" r="23" fill="none" stroke="currentColor" strokeWidth="2.5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: EASE }} />
        <motion.path d="M16 27l7 7 13-15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: EASE, delay: 0.5 }} />
      </svg>
      <p className="cc__title">{copy.title}</p>
      <p>{copy.text}</p>
      {kind === 'booking' && (
        <p className="cc__when">
          Requested: <strong>{d.dateLabel} · {d.time}</strong>
        </p>
      )}
      <p className="cc__ref">
        Reference <strong>{d.ref}</strong>
      </p>
      {kind === 'booking' && d.date && (
        <button
          className="cc__btn"
          onClick={() => downloadIcs({ date: d.date, time: d.time, title: `The Mirrors — ${d.concern}`, ref: d.ref })}
        >
          <Icon name="clock" size={15} /> Add to calendar
        </button>
      )}
    </div>
  );
}

function TreatmentCard({ slug }) {
  const s = SERVICES.find((x) => x.slug === slug);
  if (!s) return null;
  return (
    <div className="cc cc--treatment">
      <img src={img(s.image, 500)} alt="" />
      <div>
        <p className="cc__title">{s.title}</p>
        <p>{s.text}</p>
        <ul className="cc__facts">
          <li>From {s.facts.from}</li>
          <li>{s.facts.duration}</li>
          <li>Downtime: {s.facts.downtime}</li>
        </ul>
        <Link className="cc__link" to={`/treatments/${s.slug}`}>
          Read more <Icon name="arrow" size={14} />
        </Link>
      </div>
    </div>
  );
}

function Prices() {
  return (
    <div className="cc">
      <p className="cc__title">Consultation fees</p>
      <ul className="cc__list">
        {PRICING.map((p) => (
          <li key={p.name}>
            <span>{p.name}</span>
            <strong>{p.price}</strong>
          </li>
        ))}
        {SERVICES.map((s) => (
          <li key={s.slug}>
            <span>{s.title}</span>
            <strong>from {s.facts.from}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Hours() {
  return (
    <div className="cc">
      <p className="cc__title">
        <Icon name="clock" size={16} /> Opening hours
      </p>
      <ul className="cc__list">
        {HOURS.map((h) => (
          <li key={h.day}>
            <span>{h.day}</span>
            <strong>{h.time}</strong>
          </li>
        ))}
      </ul>
      <a className="cc__link" href={CONTACT.mapsHref} target="_blank" rel="noreferrer">
        <Icon name="pin" size={14} /> {CONTACT.address}, {CONTACT.area}
      </a>
    </div>
  );
}

function ContactCard() {
  return (
    <div className="cc cc--contact">
      <a href={CONTACT.phoneHref}>
        <span><Icon name="phone" size={17} /></span>
        Call us
      </a>
      <a href={CONTACT.instagram} target="_blank" rel="noreferrer">
        <span><Icon name="instagram" size={17} /></span>
        Instagram
      </a>
      <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer">
        <span><Icon name="chat" size={17} /></span>
        WhatsApp
      </a>
    </div>
  );
}

function Alert() {
  return (
    <div className="cc cc--alert">
      <p className="cc__title">If this is an emergency</p>
      <p>
        Please call your local emergency number now or go to your nearest emergency department. This
        chat isn’t monitored for urgent medical help.
      </p>
    </div>
  );
}

function Message({ m }) {
  const d = m.snap || {};
  let body;
  switch (m.type) {
    case 'summary': body = <Summary d={d} />; break;
    case 'confirm': body = <Confirm d={d} kind={m.kind} />; break;
    case 'treatment': body = <TreatmentCard slug={m.slug} />; break;
    case 'prices': body = <Prices />; break;
    case 'hours': body = <Hours />; break;
    case 'contact': body = <ContactCard />; break;
    case 'alert': body = <Alert />; break;
    default: body = <p className="bubble">{m.text}</p>;
  }
  return (
    <motion.div
      className={`msg msg--${m.from} ${m.type ? 'msg--card' : ''}`}
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
      layout="position"
    >
      {body}
    </motion.div>
  );
}

function Avatar({ size = 36 }) {
  return (
    <span className="aura-avatar" style={{ width: size, height: size }} aria-hidden="true">
      <span>a</span>
    </span>
  );
}

/* ---------- Widget ---------- */
export default function ChatWidget() {
  const chat = useChat();
  const { isOpen, messages, typing, prompt } = chat;
  const [text, setText] = useState('');
  const [nudge, setNudge] = useState(false);
  const scroller = useRef(null);
  const inputRef = useRef(null);
  const { pathname } = useLocation();

  // Friendly nudge after a few seconds on the first visit
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem('mirrors:nudged');
    } catch { /* ignore */ }
    if (seen) return;
    let hide;
    const t = setTimeout(() => {
      setNudge(true);
      hide = setTimeout(() => setNudge(false), 12000);
      try {
        sessionStorage.setItem('mirrors:nudged', '1');
      } catch { /* ignore */ }
    }, 8000);
    return () => {
      clearTimeout(t);
      clearTimeout(hide);
    };
  }, []);

  useEffect(() => {
    if (isOpen) setNudge(false);
  }, [isOpen]);

  // Keep the newest message in view
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, typing, prompt, isOpen]);

  // Focus the input when the bot asks for typed info (desktop only)
  useEffect(() => {
    if (isOpen && prompt?.node?.input && window.matchMedia('(pointer: fine)').matches) {
      inputRef.current?.focus();
    }
  }, [isOpen, prompt]);

  // Lock page scroll behind the full-screen chat on phones
  useEffect(() => {
    const small = window.matchMedia('(max-width: 640px)').matches;
    if (!small) return;
    if (isOpen) window.__lenis?.stop();
    else window.__lenis?.start();
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && chat.close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, chat]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    chat.sendText(text);
    setText('');
  };

  const input = prompt?.node?.input;
  const placeholder = input?.placeholder || (prompt ? 'Type a message…' : 'Aura is typing…');

  return (
    <>
      <AnimatePresence>
        {nudge && !isOpen && (
          <motion.div
            className="chat-nudge glass"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <button className="chat-nudge__close" onClick={() => setNudge(false)} aria-label="Dismiss">
              ×
            </button>
            <Avatar size={34} />
            <button className="chat-nudge__body" onClick={() => chat.open()}>
              <strong>Need help booking?</strong>
              Chat with Aura — it takes a minute.
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className={`chat-launcher ${isOpen ? 'is-open' : ''}`}
        onClick={() => (isOpen ? chat.close() : chat.open())}
        aria-label={isOpen ? 'Close chat' : 'Chat with us'}
        aria-expanded={isOpen}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: pathname ? 1.2 : 0, type: 'spring', stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
      >
        <span className="chat-launcher__blob" />
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <Icon name="plus" size={26} className="rot45" />
            </motion.span>
          ) : (
            <motion.span key="c" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Icon name="chat" size={26} />
            </motion.span>
          )}
        </AnimatePresence>
        {!isOpen && <span className="chat-launcher__ping" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.section
            className="chat"
            role="dialog"
            aria-label="Chat with Aura, the care assistant at The Mirrors Dermatology Clinic"
            initial={{ opacity: 0, scale: 0.6, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 40 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <header className="chat__head">
              <Avatar size={44} />
              <div className="chat__who">
                <strong>Aura · Care assistant</strong>
                <span>
                  <span className="pulse" /> Online · replies instantly
                </span>
              </div>
              <button className="chat__icon-btn" onClick={chat.restart} aria-label="Start over" title="Start over">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
                </svg>
              </button>
              <button className="chat__icon-btn" onClick={chat.close} aria-label="Close chat">
                <Icon name="plus" size={20} className="rot45" />
              </button>
            </header>

            <div className="chat__body" ref={scroller} data-lenis-prevent aria-live="polite">
              <p className="chat__day">Today</p>
              {messages.map((m) => (
                <Message key={m.id} m={m} />
              ))}
              <AnimatePresence>
                {typing && (
                  <motion.div
                    className="msg msg--bot"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="bubble typing" aria-label="Aura is typing">
                      <span />
                      <span />
                      <span />
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {prompt?.options && !typing && (
                <motion.div
                  className="chips"
                  key={prompt.id + messages.length}
                  initial="hidden"
                  animate="show"
                  variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                >
                  {prompt.options.map((o) => (
                    <motion.button
                      key={o.label}
                      className="chip"
                      variants={{ hidden: { opacity: 0, y: 10, scale: 0.9 }, show: { opacity: 1, y: 0, scale: 1 } }}
                      onClick={() => chat.answer(o.value, o.label)}
                    >
                      {o.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>

            <form className="chat__input" onSubmit={submit} noValidate>
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                type={input?.type === 'email' ? 'email' : input?.type === 'tel' ? 'tel' : 'text'}
                autoComplete={input?.autoComplete || 'off'}
                aria-label="Message"
                enterKeyHint="send"
              />
              <button type="submit" aria-label="Send" disabled={!text.trim()}>
                <Icon name="arrow" size={18} />
              </button>
            </form>
            <p className="chat__fine">
              Aura can’t give medical advice. Emergency? Call your local emergency number.
            </p>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
