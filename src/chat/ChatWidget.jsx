import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CONTACT, COORDINATOR, HOURS, HOURS_NOTE, SERVICES, img } from '../data';
import { todayISO } from '../../server/booking-rules.js';
import { Icon } from '../components/ui';
import { useChat } from './ChatProvider';
import { useClinicStatus } from '../lib';

const TODAY = todayISO();

const fmtDob = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/* ---------- Reference code box with copy ---------- */
function RefCodeBox({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="cc__ref-box">
      <p className="cc__ref">
        Reference code: <strong>{code}</strong>
        <button type="button" className="cc__ref-copy" onClick={copy} title="Copy code">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </p>
      <p className="cc__ref-note">
        Keep this code — quote it when you call, WhatsApp us, or book a future visit so all your
        records stay linked under this ID.
      </p>
    </div>
  );
}

/* ---------- Appointment confirmation card ---------- */
function Confirm({ d, kind }) {
  const copy = {
    appointment: {
      title: 'Appointment booked!',
      text: `${COORDINATOR.name} will call you on ${d.phone}${d.email ? ` (or email ${d.email})` : ''} to confirm your visit.`,
    },
    callback: {
      title: 'Call back booked',
      text: `${COORDINATOR.name} will call you on ${d.phone} (${String(d.callTime).toLowerCase()}).`,
    },
    enquiry: {
      title: 'Enquiry sent',
      text: `${COORDINATOR.name} will reach you on ${d.phone || d.email}, usually within one working day.`,
    },
  }[kind] || {
    title: 'Request received',
    text: `${COORDINATOR.name} will be in touch shortly.`,
  };

  return (
    <div className="cc cc--confirm">
      <span className="cc__check">
        <Icon name="check" size={22} />
      </span>
      <p className="cc__title">{copy.title}</p>

      {kind === 'appointment' && (
        <dl className="cc__summary">
          <div>
            <dt>When</dt>
            <dd><strong>{d.dateLabel || d.date} · {d.time}</strong></dd>
          </div>
          {d.concern && (
            <div>
              <dt>Visit for</dt>
              <dd>{d.concern}</dd>
            </div>
          )}
          <div>
            <dt>Patient</dt>
            <dd>{d.name}</dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>{d.phone}{d.email ? ` · ${d.email}` : ''}</dd>
          </div>
        </dl>
      )}

      <p>{copy.text}</p>
      {d.ref && <RefCodeBox code={d.ref} />}
    </div>
  );
}

/* ---------- Booking preview (shown before the patient confirms) ---------- */
const VISIT_LABELS = {
  first: 'First-time visit',
  revisit: 'Revisit / Follow-up',
  rescheduled_first: 'Rescheduled 1st visit',
};

function BookingPreview({ d }) {
  return (
    <div className="cc cc--preview">
      <p className="cc__title">
        <Icon name="clock" size={15} /> Review your details
      </p>
      <dl>
        {d.concern && (
          <div><dt>Treatment</dt><dd>{d.concern}</dd></div>
        )}
        <div>
          <dt>Visit type</dt>
          <dd>
            {VISIT_LABELS[d.visitType] || 'First-time visit'}
            {d.existingRef ? ` · ${d.existingRef}` : ''}
          </dd>
        </div>
        <div>
          <dt>Date &amp; time</dt>
          <dd><strong>{d.dateLabel || d.date} · {d.time}</strong></dd>
        </div>
        <div><dt>Name</dt><dd>{d.name}</dd></div>
        <div><dt>Mobile</dt><dd>{d.phone}</dd></div>
        {d.email && <div><dt>Email</dt><dd>{d.email}</dd></div>}
        {d.dob && <div><dt>Date of birth</dt><dd>{fmtDob(d.dob)}</dd></div>}
      </dl>
    </div>
  );
}

/* ---------- Treatment info card ---------- */
function TreatmentCard({ slug }) {
  const s = SERVICES.find((x) => x.slug === slug);
  if (!s) return null;
  return (
    <div className="cc cc--treatment">
      <img src={img(s.image, 500)} alt="" />
      <div>
        <p className="cc__title">{s.title}</p>
        <p>{s.text}</p>
        <p><strong>Ideal for:</strong> {s.idealFor}</p>
        <Link className="cc__link" to={`/treatments/${s.slug}`}>
          Read more <Icon name="arrow" size={14} />
        </Link>
      </div>
    </div>
  );
}

/* ---------- Clinic hours card ---------- */
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
      <p className="cc__note">{HOURS_NOTE}</p>
      <a className="cc__link" href={CONTACT.mapsHref} target="_blank" rel="noreferrer">
        <Icon name="pin" size={14} /> {CONTACT.address}, {CONTACT.area}
      </a>
    </div>
  );
}

/* ---------- Contact links card ---------- */
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
        <span><Icon name="whatsapp" size={17} /></span>
        WhatsApp
      </a>
      <a href={CONTACT.emailHref}>
        <span><Icon name="mail" size={17} /></span>
        Email
      </a>
    </div>
  );
}

/* ---------- Emergency alert card ---------- */
function Alert() {
  return (
    <div className="cc cc--alert">
      <p className="cc__title">If this is an emergency</p>
      <p>
        Please call your local emergency number or go to your nearest emergency department.
        This chat is not monitored for urgent medical help.
      </p>
    </div>
  );
}

/* ---------- Message renderer ---------- */
function Message({ m }) {
  const d = m.snap || {};
  let body;
  switch (m.type) {
    case 'confirm':        body = <Confirm d={d} kind={m.kind} />; break;
    case 'bookingPreview': body = <BookingPreview d={d} />; break;
    case 'treatment':      body = <TreatmentCard slug={m.slug} />; break;
    case 'hours':          body = <Hours />; break;
    case 'contact':        body = <ContactCard />; break;
    case 'alert':          body = <Alert />; break;
    default:               body = <p className="bubble">{m.text}</p>;
  }
  return (
    <div className={`msg msg--${m.from} ${m.type ? 'msg--card' : ''}`}>{body}</div>
  );
}

/* ---------- Bot avatar ---------- */
function Avatar({ size = 36 }) {
  return (
    <span className="aura-avatar" style={{ width: size, height: size }} aria-hidden="true">
      <Icon name="chat" size={Math.round(size * 0.45)} />
    </span>
  );
}

/* ---------- Main widget ---------- */
export default function ChatWidget() {
  const chat = useChat();
  const { isOpen, messages, typing, prompt } = chat;
  const [text, setText] = useState('');
  const [nudge, setNudge] = useState(false);
  const clinic = useClinicStatus();
  const scroller = useRef(null);
  const inputRef = useRef(null);

  // Text input is only enabled when the current node explicitly requests typed input
  const activeInput = prompt?.node?.input;
  const canType = Boolean(activeInput) && !typing;

  // Wipe stale text whenever the node changes
  useEffect(() => { setText(''); }, [prompt?.id]);

  // Show a friendly nudge bubble shortly after the page loads
  useEffect(() => {
    let show, hide;
    const poll = setInterval(() => {
      if (!document.documentElement.classList.contains('is-ready')) return;
      clearInterval(poll);
      show = setTimeout(() => {
        setNudge(true);
        hide = setTimeout(() => setNudge(false), 12000);
      }, 500);
    }, 100);
    return () => { clearInterval(poll); clearTimeout(show); clearTimeout(hide); };
  }, []);

  useEffect(() => { if (isOpen) setNudge(false); }, [isOpen]);

  // Scroll to the latest message whenever something changes
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [messages, typing, prompt, isOpen]);

  // Auto-focus the text box on desktop when the bot asks for a typed answer
  useEffect(() => {
    if (isOpen && canType && window.matchMedia('(pointer: fine)').matches) {
      inputRef.current?.focus();
    }
  }, [isOpen, canType, prompt?.id]);

  // Lock body scroll on phones when the chat is open
  useEffect(() => {
    if (!window.matchMedia('(max-width: 640px)').matches) return;
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && chat.close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, chat]);

  const submit = (e) => {
    e.preventDefault();
    if (!canType || !text.trim()) return;
    chat.sendText(text);
    setText('');
  };

  const placeholder = typing
    ? 'Aura is typing…'
    : canType
      ? activeInput.placeholder || 'Type your answer…'
      : 'Please choose an option above ↑';

  const inputType = { email: 'email', tel: 'tel', date: 'date' }[activeInput?.type] || 'text';

  return (
    <>
      {nudge && !isOpen && (
        <div className="chat-nudge">
          <button className="chat-nudge__close" onClick={() => setNudge(false)} aria-label="Dismiss">×</button>
          <button className="chat-nudge__body" onClick={() => chat.open()}>
            <strong>May I help you?</strong>
            {clinic.open
              ? 'Ask anything about your skin, hair or nails.'
              : `We're closed right now (${clinic.text.toLowerCase()}), but you can still book or ask — we'll reply once we open.`}
          </button>
        </div>
      )}

      <button
        className={`chat-launcher ${isOpen ? 'is-open' : ''}`}
        onClick={() => (isOpen ? chat.close() : chat.open())}
        aria-label={isOpen ? 'Close chat' : 'Chat with us'}
        aria-expanded={isOpen}
      >
        <Icon name={isOpen ? 'plus' : 'chat'} size={20} className={isOpen ? 'rot45' : ''} />
        <span className="chat-launcher__label">{isOpen ? 'Close' : 'Ask us'}</span>
      </button>

      {isOpen && (
        <section
          className="chat"
          role="dialog"
          aria-label="Chat with Aura, the care assistant at The Mirrors Dermatology Clinic"
        >
          <header className="chat__head">
            <Avatar size={40} />
            <div className="chat__who">
              <strong>Aura · Care assistant</strong>
              <span><span className="dot" /> Online · replies instantly</span>
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

          <div className="chat__body" ref={scroller} aria-live="polite">
            <p className="chat__day">Today</p>
            {messages.map((m) => (
              <Message key={m.id} m={m} />
            ))}
            {typing && (
              <div className="msg msg--bot">
                <p className="bubble typing" aria-label="Aura is typing">
                  <span /><span /><span />
                </p>
              </div>
            )}
            {prompt?.options && !typing && (
              <div className="chips">
                {prompt.options.map((o) => (
                  <button
                    key={o.label}
                    className={`chip ${o.nav ? 'chip--nav' : ''}`}
                    onClick={() => chat.answer(o.value, o.label, { nav: o.nav })}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className={`chat__input ${canType ? 'is-active' : 'is-disabled'}`}
            onSubmit={submit}
            noValidate
          >
            <input
              ref={inputRef}
              value={canType ? text : ''}
              onChange={(e) => {
                if (!canType) return;
                const v = inputType === 'tel' ? e.target.value.replace(/[^+()[\]\d\s.\-]/g, '') : e.target.value;
                setText(v);
              }}
              placeholder={placeholder}
              type={canType ? inputType : 'text'}
              max={inputType === 'date' ? TODAY : undefined}
              min={inputType === 'date' ? '1900-01-01' : undefined}
              autoComplete={activeInput?.autoComplete || 'off'}
              aria-label="Message"
              enterKeyHint="send"
              disabled={!canType}
            />
            <button type="submit" aria-label="Send" disabled={!canType || !text.trim()}>
              <Icon name="arrow" size={18} />
            </button>
          </form>

          <p className="chat__fine">
            Aura cannot give medical advice. Emergency? Call your local emergency number.
          </p>
        </section>
      )}
    </>
  );
}
