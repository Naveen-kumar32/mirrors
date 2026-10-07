import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CONTACT, COORDINATOR, HOURS, HOURS_NOTE, SERVICES, img } from '../data';
import { Icon } from '../components/ui';
import { useChat } from './ChatProvider';
import { useClinicStatus } from '../lib';

/* ---------- Rich message cards ---------- */
function Confirm({ d, kind }) {
  const copy = {
    callback: {
      title: 'Call back booked',
      text: `${COORDINATOR.name} from our team will call you on ${d.phone} (${String(d.callTime).toLowerCase()}).`,
    },
    enquiry: {
      title: 'Question sent',
      text: `${COORDINATOR.name} from our team will reply to ${d.email}, usually within one working day.`,
    },
  }[kind];

  return (
    <div className="cc cc--confirm">
      <span className="cc__check">
        <Icon name="check" size={22} />
      </span>
      <p className="cc__title">{copy.title}</p>
      <p>{copy.text}</p>
      <p className="cc__ref">
        Reference <strong>{d.ref}</strong>
      </p>
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
        <p>
          <strong>Ideal for:</strong> {s.idealFor}
        </p>
        <Link className="cc__link" to={`/treatments/${s.slug}`}>
          Read more <Icon name="arrow" size={14} />
        </Link>
      </div>
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
      <p className="cc__note">{HOURS_NOTE}</p>
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
    case 'confirm': body = <Confirm d={d} kind={m.kind} />; break;
    case 'treatment': body = <TreatmentCard slug={m.slug} />; break;
    case 'hours': body = <Hours />; break;
    case 'contact': body = <ContactCard />; break;
    case 'alert': body = <Alert />; break;
    default: body = <p className="bubble">{m.text}</p>;
  }
  return (
    <div className={`msg msg--${m.from} ${m.type ? 'msg--card' : ''}`}>{body}</div>
  );
}

function Avatar({ size = 36 }) {
  return (
    <span className="aura-avatar" style={{ width: size, height: size }} aria-hidden="true">
      <Icon name="chat" size={Math.round(size * 0.45)} />
    </span>
  );
}

/* ---------- Widget ---------- */
export default function ChatWidget() {
  const chat = useChat();
  const { isOpen, messages, typing, prompt } = chat;
  const [text, setText] = useState('');
  const [nudge, setNudge] = useState(false);
  const clinic = useClinicStatus();
  const scroller = useRef(null);
  const inputRef = useRef(null);

  // Friendly nudge as soon as the opening loader finishes (on every page load)
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
    return () => {
      clearInterval(poll);
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  useEffect(() => {
    if (isOpen) setNudge(false);
  }, [isOpen]);

  // Keep the newest message in view
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [messages, typing, prompt, isOpen]);

  // Focus the input when the bot asks for typed info (desktop only)
  useEffect(() => {
    if (isOpen && prompt?.node?.input && window.matchMedia('(pointer: fine)').matches) {
      inputRef.current?.focus();
    }
  }, [isOpen, prompt]);

  // Lock page scroll behind the full-screen chat on phones
  useEffect(() => {
    if (!window.matchMedia('(max-width: 640px)').matches) return;
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
      {nudge && !isOpen && (
        <div className="chat-nudge">
          <button className="chat-nudge__close" onClick={() => setNudge(false)} aria-label="Dismiss">
            ×
          </button>
          <button className="chat-nudge__body" onClick={() => chat.open()}>
            <strong>May I help you?</strong>
            {clinic.open
              ? 'Talk to us — ask anything about your skin, hair or nails.'
              : `We’re closed right now (${clinic.text.toLowerCase()}), but you can still ask a question or book — we’ll reply once we open.`}
          </button>
        </div>
      )}

      <button
        className={`chat-launcher ${isOpen ? 'is-open' : ''}`}
        onClick={() => (isOpen ? chat.close() : chat.open())}
        aria-label={isOpen ? 'Close chat' : 'Ask us a question'}
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
              <span>
                <span className="dot" /> Online · replies instantly
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

          <div className="chat__body" ref={scroller} aria-live="polite">
            <p className="chat__day">Today</p>
            {messages.map((m) => (
              <Message key={m.id} m={m} />
            ))}
            {typing && (
              <div className="msg msg--bot">
                <p className="bubble typing" aria-label="Aura is typing">
                  <span />
                  <span />
                  <span />
                </p>
              </div>
            )}

            {prompt?.options && !typing && (
              <div className="chips">
                {prompt.options.map((o) => (
                  <button key={o.label} className="chip" onClick={() => chat.answer(o.value, o.label)}>
                    {o.label}
                  </button>
                ))}
              </div>
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
        </section>
      )}
    </>
  );
}
