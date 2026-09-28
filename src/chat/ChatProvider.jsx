import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { EMERGENCY, NODES, detectIntent } from './flow';

const ChatContext = createContext(null);
export const useChat = () => useContext(ChatContext);

const SESSION_KEY = 'mirrors:chat';

// Whether the booking form has been shown since this page load (resets on refresh)
let bookingSeen = false;
export const hasSeenBooking = () => bookingSeen;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let uid = 0;
const id = () => `${Date.now()}-${uid++}`;

function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

const resolve = (next, value, data) => (typeof next === 'function' ? next(value, data) : next);

export function getOptions(node, data) {
  if (!node?.options) return null;
  return typeof node.options === 'function' ? node.options(data) : node.options;
}

export function ChatProvider({ children }) {
  const saved = useRef(loadSession()).current;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(saved?.messages || []);
  const [promptId, setPromptId] = useState(saved?.promptId || null);
  const [typing, setTyping] = useState(false);
  const [booking, setBooking] = useState(null); // null = closed, otherwise the form preset
  const data = useRef(saved?.data || {});
  const token = useRef(0);
  const busy = useRef(false);

  // Keep the conversation for this browser session (survives page changes & refresh)
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ messages, promptId, data: data.current }));
    } catch {
      /* ignore */
    }
  }, [messages, promptId]);

  const push = useCallback((m) => setMessages((ms) => [...ms, { id: id(), ...m }]), []);

  const botSay = useCallback(
    async (items, t) => {
      for (const s of items) {
        setTyping(true);
        await wait(typeof s === 'string' ? Math.min(1300, 380 + s.length * 12) : 650);
        if (t !== token.current) return false;
        setTyping(false);
        push(typeof s === 'string' ? { from: 'bot', text: s } : { from: 'bot', ...s, snap: { ...data.current } });
        await wait(160);
        if (t !== token.current) return false;
      }
      return true;
    },
    [push]
  );

  /** Open the booking form, optionally pre-filled ({ concern, doctor }). */
  const openBooking = useCallback((preset = {}) => {
    bookingSeen = true;
    setBooking({ ...preset });
  }, []);

  const goTo = useCallback(
    async (start) => {
      const t = ++token.current;
      const d = data.current;
      setPromptId(null);
      busy.current = true;
      let nodeId = start;

      for (let guard = 0; guard < 30; guard++) {
        if (guard > 0 && t !== token.current) return;
        const node = NODES[nodeId] || NODES.fallback;
        node.enter?.(d);
        if (node.skipIf?.(d)) {
          nodeId = resolve(node.next, undefined, d);
          continue;
        }
        if (node.run) {
          setTyping(true);
          try {
            await node.run(d);
          } catch (err) {
            console.error(err);
            if (t !== token.current) return;
            setTyping(false);
            nodeId = 'error';
            continue;
          }
          if (t !== token.current) return;
        }
        const says = typeof node.say === 'function' ? node.say(d) : node.say || [];
        if (!(await botSay(says, t))) return;
        setTyping(false);
        if (node.openForm) {
          openBooking({ concern: d.concern, doctor: d.doctor });
          delete d.concern;
          delete d.doctor;
        }
        if (node.options || node.input) {
          busy.current = false;
          setPromptId(nodeId);
          return;
        }
        if (!node.next) {
          busy.current = false;
          return;
        }
        nodeId = resolve(node.next, undefined, d);
      }
    },
    [botSay, openBooking]
  );

  /** Answer the current prompt (from a quick-reply chip or validated text). */
  const answer = useCallback(
    (value, label, { silent = false } = {}) => {
      const node = NODES[promptId];
      if (!node) return;
      const d = data.current;
      if (!silent) push({ from: 'user', text: label ?? String(value) });
      if (node.field) {
        d[node.field] = value;
        d[`${node.field}Label`] = label ?? value;
      }
      goTo(resolve(node.next, value, d));
    },
    [promptId, push, goTo]
  );

  /** Free text typed by the user. */
  const sendText = useCallback(
    async (raw) => {
      const text = raw.trim();
      if (!text) return;
      const d = data.current;
      const node = NODES[promptId];
      push({ from: 'user', text });

      if (EMERGENCY.test(text)) {
        push({ from: 'bot', type: 'alert' });
      }

      if (!node) {
        goTo(detectIntent(text, d) || 'fallback');
        return;
      }

      const match = getOptions(node, d)?.find((o) => o.label.toLowerCase() === text.toLowerCase());
      if (match) return answer(match.value, match.label, { silent: true });

      if (node.input) {
        const ok = node.input.validate ? node.input.validate(text) : true;
        if (ok !== true) {
          const t = ++token.current;
          const keep = promptId;
          setPromptId(null);
          if (await botSay([ok], t)) setPromptId(keep);
          setTyping(false);
          return;
        }
        return answer(text, text, { silent: true });
      }

      const intent = detectIntent(text, d);
      if (intent && (node.menu || intent !== 'welcome')) {
        goTo(intent);
        return;
      }
      const t = ++token.current;
      const keep = promptId;
      setPromptId(null);
      if (await botSay(['Please choose one of the options below 👇'], t)) setPromptId(keep);
      setTyping(false);
    },
    [promptId, push, goTo, answer, botSay]
  );

  /** Open the chat, optionally jumping straight into a flow. */
  const open = useCallback(
    (intent, preset = {}) => {
      setIsOpen(true);
      if (intent) {
        const { userText, ...rest } = preset;
        Object.assign(data.current, rest);
        if (userText) push({ from: 'user', text: userText });
        goTo(intent);
      } else if (!messages.length) {
        goTo('welcome');
      } else if (!promptId && !busy.current) {
        // conversation was interrupted (e.g. page refresh mid-reply)
        goTo('menu');
      }
    },
    [goTo, push, messages.length, promptId]
  );

  const closeBooking = useCallback(() => setBooking(null), []);

  const restart = useCallback(() => {
    token.current++;
    data.current = {};
    setMessages([]);
    setTyping(false);
    goTo('welcome');
  }, [goTo]);

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close: () => setIsOpen(false),
      restart,
      messages,
      typing,
      prompt: promptId ? { id: promptId, node: NODES[promptId], options: getOptions(NODES[promptId], data.current) } : null,
      answer,
      sendText,
      booking,
      openBooking,
      closeBooking,
    }),
    [isOpen, open, restart, messages, typing, promptId, answer, sendText, booking, openBooking, closeBooking]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
