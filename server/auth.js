/*
 * Staff logins: scrypt password hashes + random session tokens kept in an
 * httpOnly cookie (never readable by page scripts).
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db, now } from './db.js';

const COOKIE = 'mirrors_session';
const SESSION_DAYS = 7;
const secure = process.env.NODE_ENV === 'production';

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [, saltHex, hashHex] = String(stored).split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(expected, actual);
}

export const passwordProblem = (p) =>
  typeof p !== 'string' || p.length < 8 ? 'Password must be at least 8 characters.' : null;

export function createUser({ name, email, password, role }) {
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name.trim(), email.trim().toLowerCase(), hashPassword(password), role);
  return Number(info.lastInsertRowid);
}

export const publicUser = (u) => u && { id: u.id, name: u.name, email: u.email, role: u.role, active: !!u.active };

function readCookie(req) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function startSession(res, userId) {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now());
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expires.toISOString());
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure, expires, path: '/' });
}

export function endSession(req, res) {
  const token = readCookie(req);
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.clearCookie(COOKIE, { path: '/' });
}

/** Attaches req.user when a valid session cookie is present. */
export function loadUser(req, _res, next) {
  const token = readCookie(req);
  if (token) {
    req.user = db
      .prepare(
        `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = ? AND s.expires_at > ? AND u.active = 1`
      )
      .get(token, now());
  }
  next();
}

export const requireStaff = (req, res, next) =>
  req.user ? next() : res.status(401).json({ error: 'Please log in.' });

export const requireAdmin = (req, res, next) =>
  req.user?.role === 'admin' ? next() : res.status(403).json({ error: 'Admins only.' });

/*
 * Simple in-memory limiter per IP. `counts(status)` decides which responses use
 * up an attempt — e.g. only failed logins, or only successfully posted reviews.
 */
export function rateLimit({ max, windowMs, message, counts = () => true }) {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip;
    const recent = (hits.get(key) || []).filter((x) => Date.now() - x < windowMs);
    hits.set(key, recent);
    if (recent.length >= max) return res.status(429).json({ error: message });
    res.on('finish', () => {
      if (!counts(res.statusCode)) return;
      if (hits.size > 5000) hits.clear();
      hits.set(key, [...(hits.get(key) || []), Date.now()]);
    });
    next();
  };
}
