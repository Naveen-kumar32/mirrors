/*
 * The Mirrors — API server.
 *
 *   npm run dev    → this API on :3001 + the Vite site on :5173 (Vite proxies /api and /uploads here)
 *   npm start      → after `npm run build`, serves the built site AND the API from one port
 *
 * Environment (see .env.example): PORT, DATA_DIR, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
 */
import { existsSync, unlink } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';
import multer from 'multer';
import { db, now, UPLOAD_DIR } from './db.js';
import { bookableDays, dayLabel, isBookable, isISODate, timeSlots, todayISO } from './booking-rules.js';
import { emailEnabled, notifyClinic } from './notify.js';
import { googleSummary } from './google.js';
import { GALLERY_PER_PAGE } from './gallery-settings.js';
import {
  createUser,
  endSession,
  loadUser,
  passwordProblem,
  publicUser,
  rateLimit,
  requireAdmin,
  requireStaff,
  startSession,
  verifyPassword,
  hashPassword,
} from './auth.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(here, '..', 'dist');
const PORT = Number(process.env.PORT) || 3001;
const REVIEWS_PER_PAGE = 10;

/* First start: create the owner's admin account from the environment */
if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n === 0) {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Clinic Owner' } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD && !passwordProblem(ADMIN_PASSWORD)) {
    createUser({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });
    console.log(`Created admin account for ${ADMIN_EMAIL}`);
  } else {
    console.warn('No staff accounts yet. Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ chars) or run `npm run create-admin`.');
  }
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '200kb' }));
app.use(loadUser);

/* ---------- helpers ---------- */
const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const isPhone = (v) => v.replace(/\D/g, '').length >= 7 && /^[+()\d\s.-]+$/.test(v);
const bad = (res, error, status = 400) => res.status(status).json({ error });

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .slice(0, 80) || 'post';

function uniqueSlug(title, exceptId = 0) {
  const base = slugify(title);
  let slug = base;
  for (let n = 2; db.prepare('SELECT 1 FROM posts WHERE slug = ? AND id != ?').get(slug, exceptId); n++) slug = `${base}-${n}`;
  return slug;
}

const readTime = (body) => `${Math.max(1, Math.round(body.split(/\s+/).length / 200))} min read`;

const postOut = (p, full = false) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  category: p.category,
  author: p.author,
  cover: p.cover,
  status: p.status,
  publishedAt: p.published_at,
  updatedAt: p.updated_at,
  createdBy: p.created_by,
  readTime: readTime(p.body),
  ...(full && { body: p.body }),
});

function removeUpload(url) {
  if (url?.startsWith('/uploads/')) unlink(path.join(UPLOAD_DIR, path.basename(url)), () => {});
}

/* Cover image uploads: JPG / PNG / WebP up to 5 MB */
const TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}${TYPES[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    TYPES[file.mimetype] ? cb(null, true) : cb(Object.assign(new Error('Cover must be a JPG, PNG or WebP image.'), { status: 400 })),
});

/* Gallery photos: up to 10 at once, 8 MB each (the admin page shrinks them before upload) */
const uploadPhotos = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `g-${Date.now()}-${randomBytes(6).toString('hex')}${TYPES[file.mimetype]}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) =>
    TYPES[file.mimetype] ? cb(null, true) : cb(Object.assign(new Error('Photos must be JPG, PNG or WebP images.'), { status: 400 })),
});

/* ==========================================================================
   Public API
   ========================================================================== */
app.get('/api/posts', (_req, res) => {
  const rows = db.prepare("SELECT * FROM posts WHERE status = 'published' ORDER BY published_at DESC").all();
  res.json(rows.map((p) => postOut(p)));
});

app.get('/api/posts/:slug', (req, res) => {
  const p = db.prepare("SELECT * FROM posts WHERE slug = ? AND status = 'published'").get(req.params.slug);
  if (!p) return bad(res, 'Article not found.', 404);
  res.json(postOut(p, true));
});

function reviewSummary() {
  const rows = db.prepare("SELECT rating, COUNT(*) AS n FROM reviews WHERE status = 'published' GROUP BY rating").all();
  const total = rows.reduce((s, r) => s + r.n, 0);
  const sum = rows.reduce((s, r) => s + r.rating * r.n, 0);
  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const n = rows.find((r) => r.rating === stars)?.n || 0;
    return { stars, count: n, pct: total ? Math.round((n / total) * 100) : 0 };
  });
  return { total, average: total ? Math.round((sum / total) * 10) / 10 : 0, breakdown };
}

app.get('/api/reviews/summary', (_req, res) => res.json(reviewSummary()));

// Only name, rating, text and date are public — never email or phone.
app.get('/api/reviews', (req, res) => {
  const summary = reviewSummary();
  const pages = Math.max(1, Math.ceil(summary.total / REVIEWS_PER_PAGE));
  const page = Math.min(pages, Math.max(1, parseInt(req.query.page, 10) || 1));
  const items = db
    .prepare(
      `SELECT id, name, rating, text, source, created_at AS createdAt FROM reviews
       WHERE status = 'published' ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(REVIEWS_PER_PAGE, (page - 1) * REVIEWS_PER_PAGE);
  res.json({ items, page, pages, perPage: REVIEWS_PER_PAGE, ...summary });
});

// Gallery: newest first, 10 photos per page
app.get('/api/gallery', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS n FROM gallery').get().n;
  const pages = Math.max(1, Math.ceil(total / GALLERY_PER_PAGE));
  const page = Math.min(pages, Math.max(1, parseInt(req.query.page, 10) || 1));
  const items = db
    .prepare('SELECT id, image, caption AS name FROM gallery ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?')
    .all(GALLERY_PER_PAGE, (page - 1) * GALLERY_PER_PAGE);
  res.json({ items, page, pages, total, perPage: GALLERY_PER_PAGE });
});

// Testimonials chosen by staff for the home page (only name, rating, text and source are public)
app.get('/api/reviews/featured', (_req, res) => {
  res.json(
    db
      .prepare(
        `SELECT id, name, rating, text, source, created_at AS createdAt FROM reviews
         WHERE status = 'published' AND featured = 1 ORDER BY created_at DESC LIMIT 8`
      )
      .all()
  );
});

// The clinic's Google rating, review count and latest Google reviews (needs GOOGLE_PLACES_API_KEY)
app.get('/api/google', async (_req, res) => {
  const summary = await googleSummary();
  if (!summary) return res.status(404).json({ error: 'Google reviews are not connected.' });
  res.json(summary);
});

app.post(
  '/api/reviews',
  rateLimit({
    max: 3,
    windowMs: 60 * 60 * 1000,
    message: 'Thanks! You have already sent a few reviews — please try again later.',
    counts: (status) => status === 201,
  }),
  (req, res) => {
    const b = req.body || {};
    if (b.website) return res.status(201).json({ ok: true }); // honeypot filled in → quietly ignore bots
    const r = {
      name: clean(b.name, 60),
      email: clean(b.email, 120).toLowerCase(),
      phone: clean(b.phone, 25),
      rating: Number(b.rating),
      text: clean(b.text, 1500),
    };
    if (r.name.length < 2) return bad(res, 'Please enter your name.');
    if (!isPhone(r.phone)) return bad(res, 'Please enter a valid phone number.');
    if (!isEmail(r.email)) return bad(res, 'Please enter a valid email address.');
    if (!Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5) return bad(res, 'Please choose a star rating.');
    if (r.text.length < 10) return bad(res, 'Please write a little more about your experience (10+ characters).');
    db.prepare('INSERT INTO reviews (name, email, phone, rating, text, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      r.name, r.email, r.phone, r.rating, r.text, req.ip
    );
    res.status(201).json({ ok: true });
  }
);

/* Appointment bookings, call-back requests and questions */
const makeRef = () => `MD-${(Date.now().toString(36).slice(-3) + randomBytes(2).toString('hex')).toUpperCase()}`;

/** { 'YYYY-MM-DD': [{ time, id, name }] } for confirmed appointments on the given days */
function bookedSlots(dates, exceptId = 0) {
  if (!dates.length) return {};
  const rows = db
    .prepare(
      `SELECT id, name, date, time FROM requests
       WHERE type = 'appointment' AND status IN ('confirmed', 'done') AND id != ?
         AND date IN (${dates.map(() => '?').join(',')})`
    )
    .all(exceptId, ...dates);
  const out = {};
  for (const r of rows) (out[r.date] ||= []).push({ time: r.time, id: r.id, name: r.name });
  return out;
}

const slotTaken = (date, time, exceptId = 0) =>
  !!db
    .prepare(
      `SELECT 1 FROM requests WHERE type = 'appointment' AND status IN ('confirmed', 'done')
       AND date = ? AND time = ? AND id != ?`
    )
    .get(date, time, exceptId);

// Public: which days/times can be booked, and which are already booked (no patient details)
app.get('/api/slots', (_req, res) => {
  const days = bookableDays();
  const booked = bookedSlots(days);
  res.json({
    times: timeSlots(),
    days: days.map((date) => ({ date, label: dayLabel(date), booked: (booked[date] || []).map((b) => b.time) })),
  });
});

app.post(
  '/api/requests',
  rateLimit({
    max: 10,
    windowMs: 60 * 60 * 1000,
    message: 'You have sent several requests already — please call or WhatsApp us instead.',
    counts: (status) => status === 201,
  }),
  (req, res) => {
    const b = req.body || {};
    const type = ['appointment', 'callback', 'enquiry'].includes(b.type) ? b.type : null;
    const r = {
      type,
      name: clean(b.name, 80),
      phone: clean(b.phone, 25),
      email: clean(b.email, 120).toLowerCase(),
      dob: clean(b.dob, 10),
      date: clean(b.date, 10),
      time: clean(b.time, 20),
      concern: clean(b.concern, 120),
      message: clean(b.message, 2000),
    };
    if (!type) return bad(res, 'Unknown request type.');
    if (r.name.length < 2) return bad(res, 'Please enter your name.');
    if (type !== 'enquiry' && !isPhone(r.phone)) return bad(res, 'Please enter a valid phone number.');
    if (type === 'enquiry' && !isEmail(r.email)) return bad(res, 'Please enter a valid email address.');
    if (type === 'appointment') {
      if (!isISODate(r.dob) || r.dob > todayISO()) return bad(res, 'Please enter your date of birth.');
      if (!isBookable(r.date, r.time)) return bad(res, 'Please choose an available date and time.');
      if (slotTaken(r.date, r.time))
        return res.status(409).json({ error: 'Sorry, that time has just been booked. Please choose another slot.', code: 'slot_taken' });
    }
    if (type === 'enquiry' && r.message.length < 5) return bad(res, 'Please type your question.');
    r.ref = makeRef();
    db.prepare(
      `INSERT INTO requests (ref, type, name, phone, email, dob, date, time, concern, message, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(r.ref, type, r.name, r.phone || null, r.email || null, r.dob || null, r.date || null, r.time || null, r.concern || null, r.message || null, req.ip);
    notifyClinic(r);
    res.status(201).json({ ref: r.ref });
  }
);

/* ==========================================================================
   Staff auth
   ========================================================================== */
app.post(
  '/api/auth/login',
  rateLimit({
    max: 10,
    windowMs: 15 * 60 * 1000,
    message: 'Too many failed login attempts. Please wait 15 minutes and try again.',
    counts: (status) => status === 401,
  }),
  (req, res) => {
    const email = clean(req.body?.email, 120).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !verifyPassword(password, user.password_hash)) return bad(res, 'Incorrect email or password.', 401);
    if (!user.active) return bad(res, 'This account has been disabled. Please contact the clinic owner.', 403);
    startSession(res, user.id);
    res.json(publicUser(user));
  }
);

app.post('/api/auth/logout', (req, res) => {
  endSession(req, res);
  res.json({ ok: true });
});

// Always 200 so a logged-out check doesn't show up as an error in the browser console
app.get('/api/auth/me', (req, res) => res.json(req.user ? publicUser(req.user) : null));

app.post('/api/auth/password', requireStaff, (req, res) => {
  const { current, next } = req.body || {};
  if (!verifyPassword(String(current || ''), req.user.password_hash)) return bad(res, 'Your current password is incorrect.');
  const problem = passwordProblem(next);
  if (problem) return bad(res, problem);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(next), req.user.id);
  res.json({ ok: true });
});

/* ==========================================================================
   Staff: blog posts (admins manage all posts, employees their own)
   ========================================================================== */
const canEdit = (user, post) => user.role === 'admin' || post.created_by === user.id;

app.get('/api/admin/posts', requireStaff, (_req, res) => {
  const rows = db.prepare('SELECT * FROM posts ORDER BY COALESCE(published_at, created_at) DESC').all();
  res.json(rows.map((p) => postOut(p)));
});

app.get('/api/admin/posts/:id', requireStaff, (req, res) => {
  const p = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!p) return bad(res, 'Post not found.', 404);
  res.json(postOut(p, true));
});

function readPost(req) {
  const b = req.body || {};
  const p = {
    title: clean(b.title, 160),
    excerpt: clean(b.excerpt, 300),
    category: clean(b.category, 40),
    author: clean(b.author, 80),
    body: clean(b.body, 50000),
    status: b.status === 'draft' ? 'draft' : 'published',
  };
  if (p.title.length < 5) return { error: 'Please add a title (5+ characters).' };
  if (p.excerpt.length < 10) return { error: 'Please add a short summary (10+ characters).' };
  if (!p.category) return { error: 'Please choose a category.' };
  if (!p.author) return { error: 'Please add the author name.' };
  if (p.body.length < 50) return { error: 'The article is too short (50+ characters).' };
  return { post: p };
}

// Deletes a just-uploaded file when the request fails validation
const discardUpload = (req) => req.file && unlink(req.file.path, () => {});

app.post('/api/admin/posts', requireStaff, upload.single('cover'), (req, res) => {
  const { post, error } = readPost(req);
  if (error) return discardUpload(req), bad(res, error);
  if (!req.file) return bad(res, 'Please add a cover image.');
  const t = now();
  const info = db
    .prepare(
      `INSERT INTO posts (slug, title, excerpt, category, author, cover, body, status, created_by, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      uniqueSlug(post.title), post.title, post.excerpt, post.category, post.author, `/uploads/${req.file.filename}`,
      post.body, post.status, req.user.id, post.status === 'published' ? t : null, t, t
    );
  res.status(201).json(postOut(db.prepare('SELECT * FROM posts WHERE id = ?').get(info.lastInsertRowid), true));
});

app.put('/api/admin/posts/:id', requireStaff, upload.single('cover'), (req, res) => {
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!existing) return discardUpload(req), bad(res, 'Post not found.', 404);
  if (!canEdit(req.user, existing)) return discardUpload(req), bad(res, 'You can only edit your own posts.', 403);
  const { post, error } = readPost(req);
  if (error) return discardUpload(req), bad(res, error);

  const cover = req.file ? `/uploads/${req.file.filename}` : existing.cover;
  const publishedAt = post.status === 'published' ? existing.published_at || now() : existing.published_at;
  db.prepare(
    `UPDATE posts SET title = ?, excerpt = ?, category = ?, author = ?, cover = ?, body = ?, status = ?,
       published_at = ?, updated_at = ? WHERE id = ?`
  ).run(post.title, post.excerpt, post.category, post.author, cover, post.body, post.status, publishedAt, now(), existing.id);
  if (req.file) removeUpload(existing.cover);
  res.json(postOut(db.prepare('SELECT * FROM posts WHERE id = ?').get(existing.id), true));
});

app.delete('/api/admin/posts/:id', requireStaff, (req, res) => {
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!existing) return bad(res, 'Post not found.', 404);
  if (!canEdit(req.user, existing)) return bad(res, 'You can only delete your own posts.', 403);
  db.prepare('DELETE FROM posts WHERE id = ?').run(existing.id);
  removeUpload(existing.cover);
  res.json({ ok: true });
});

/* ==========================================================================
   Staff: appointments & requests (admins and employees)
   ========================================================================== */
const REQUEST_FIELDS = `id, ref, type, name, phone, email, dob, date, time, concern, message, note, status, source,
  confirmed_at AS confirmedAt, created_at AS createdAt`;

// Tabs: new = waiting for staff, confirmed = upcoming booked appointments, closed = done/cancelled
const VIEWS = {
  new: { where: "status = 'new'", order: 'created_at DESC' },
  confirmed: { where: "status = 'confirmed'", order: 'date ASC, time ASC' },
  closed: { where: "status IN ('done', 'cancelled')", order: 'created_at DESC' },
  all: { where: '1 = 1', order: 'created_at DESC' },
};

app.get('/api/admin/requests', requireStaff, (req, res) => {
  const perPage = 20;
  const view = VIEWS[req.query.view] || VIEWS.new;
  const total = db.prepare(`SELECT COUNT(*) AS n FROM requests WHERE ${view.where}`).get().n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(pages, Math.max(1, parseInt(req.query.page, 10) || 1));
  const items = db
    .prepare(`SELECT ${REQUEST_FIELDS} FROM requests WHERE ${view.where} ORDER BY ${view.order} LIMIT ? OFFSET ?`)
    .all(perPage, (page - 1) * perPage);
  const counts = {
    new: db.prepare("SELECT COUNT(*) AS n FROM requests WHERE status = 'new'").get().n,
    confirmed: db.prepare("SELECT COUNT(*) AS n FROM requests WHERE status = 'confirmed'").get().n,
  };
  res.json({ items, page, pages, total, counts });
});

// Slots for the staff "confirm booking" picker: today onwards, showing who holds each booked slot
app.get('/api/admin/slots', requireStaff, (req, res) => {
  const days = bookableDays({ staff: true });
  const booked = bookedSlots(days, Number(req.query.except) || 0);
  res.json({
    times: timeSlots(),
    days: days.map((date) => ({ date, label: dayLabel(date), booked: booked[date] || [] })),
  });
});

function readBooking(b) {
  return { date: clean(b.date, 10), time: clean(b.time, 20), note: clean(b.note, 1000) };
}

// Two staff confirming the same slot at once: the database's unique slot index rejects the second
const isSlotClash = (err) => String(err.message).includes('UNIQUE');

// Confirm (or reschedule) an appointment: books the slot so no one else can take it
app.post('/api/admin/requests/:id/confirm', requireStaff, (req, res) => {
  const r = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
  if (!r) return bad(res, 'Request not found.', 404);
  if (r.type !== 'appointment') return bad(res, 'Only appointments can be confirmed.');
  const { date, time, note } = readBooking(req.body || {});
  if (!isBookable(date, time, { staff: true })) return bad(res, 'Please choose an open day (today or later) and a time slot.');
  if (slotTaken(date, time, r.id)) return bad(res, 'That slot is already booked for another patient.', 409);
  try {
    db.prepare(
      `UPDATE requests SET status = 'confirmed', date = ?, time = ?, note = ?, confirmed_by = ?, confirmed_at = ? WHERE id = ?`
    ).run(date, time, note || null, req.user.id, now(), r.id);
  } catch (err) {
    if (isSlotClash(err)) return bad(res, 'That slot has just been booked for someone else.', 409);
    throw err;
  }
  res.json(db.prepare(`SELECT ${REQUEST_FIELDS} FROM requests WHERE id = ?`).get(r.id));
});

// Staff book an appointment directly, e.g. for a patient who phoned in
app.post('/api/admin/appointments', requireStaff, (req, res) => {
  const b = req.body || {};
  const name = clean(b.name, 80);
  const phone = clean(b.phone, 25);
  const dob = clean(b.dob, 10);
  const { date, time, note } = readBooking(b);
  if (name.length < 2) return bad(res, 'Please enter the patient’s name.');
  if (!isPhone(phone)) return bad(res, 'Please enter a valid phone number.');
  if (dob && (!isISODate(dob) || dob > todayISO())) return bad(res, 'Please check the date of birth.');
  if (!isBookable(date, time, { staff: true })) return bad(res, 'Please choose an open day (today or later) and a time slot.');
  if (slotTaken(date, time)) return bad(res, 'That slot is already booked for another patient.', 409);
  let info;
  try {
    info = db
      .prepare(
        `INSERT INTO requests (ref, type, name, phone, dob, date, time, note, status, source, confirmed_by, confirmed_at)
         VALUES (?, 'appointment', ?, ?, ?, ?, ?, ?, 'confirmed', 'staff', ?, ?)`
      )
      .run(makeRef(), name, phone, dob || null, date, time, note || null, req.user.id, now());
  } catch (err) {
    if (isSlotClash(err)) return bad(res, 'That slot has just been booked for someone else.', 409);
    throw err;
  }
  res.status(201).json(db.prepare(`SELECT ${REQUEST_FIELDS} FROM requests WHERE id = ?`).get(info.lastInsertRowid));
});

// Status changes: mark done, cancel (frees the slot), reopen; and edit the staff note
app.patch('/api/admin/requests/:id', requireStaff, (req, res) => {
  const r = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
  if (!r) return bad(res, 'Request not found.', 404);
  const b = req.body || {};
  if (b.note !== undefined) db.prepare('UPDATE requests SET note = ? WHERE id = ?').run(clean(b.note, 1000) || null, r.id);
  if (b.status !== undefined) {
    if (!['new', 'done', 'cancelled'].includes(b.status)) return bad(res, 'Invalid status.');
    if (b.status === 'done' && r.status === 'cancelled') return bad(res, 'Reopen the appointment first.');
    // Reopening a cancelled appointment goes back to "new" so its slot is checked again on confirm
    db.prepare('UPDATE requests SET status = ? WHERE id = ?').run(b.status, r.id);
  }
  res.json(db.prepare(`SELECT ${REQUEST_FIELDS} FROM requests WHERE id = ?`).get(r.id));
});

app.delete('/api/admin/requests/:id', requireStaff, requireAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM requests WHERE id = ?').run(req.params.id);
  if (!info.changes) return bad(res, 'Request not found.', 404);
  res.json({ ok: true });
});

/* ==========================================================================
   Staff: gallery (admins and employees)
   ========================================================================== */
app.post('/api/admin/gallery', requireStaff, uploadPhotos.array('photos', 10), (req, res) => {
  const files = req.files || [];
  if (!files.length) return bad(res, 'Please choose at least one photo.');
  const names = [].concat(req.body?.names || []);
  // category is unused, but databases created before it was dropped still require a value
  const insert = db.prepare("INSERT INTO gallery (image, caption, category, created_by) VALUES (?, ?, 'Gallery', ?)");
  files.forEach((f, i) => insert.run(`/uploads/${f.filename}`, clean(names[i], 120), req.user.id));
  res.status(201).json({ added: files.length });
});

// Rename a photo
app.patch('/api/admin/gallery/:id', requireStaff, (req, res) => {
  const info = db.prepare('UPDATE gallery SET caption = ? WHERE id = ?').run(clean(req.body?.name, 120), req.params.id);
  if (!info.changes) return bad(res, 'Photo not found.', 404);
  res.json({ ok: true });
});

app.delete('/api/admin/gallery/:id', requireStaff, (req, res) => {
  const photo = db.prepare('SELECT * FROM gallery WHERE id = ?').get(req.params.id);
  if (!photo) return bad(res, 'Photo not found.', 404);
  db.prepare('DELETE FROM gallery WHERE id = ?').run(photo.id);
  removeUpload(photo.image);
  res.json({ ok: true });
});

/* ==========================================================================
   Admin only: reviews (with private contact details) and staff accounts
   ========================================================================== */
app.get('/api/admin/reviews', requireStaff, requireAdmin, (req, res) => {
  const perPage = 20;
  const total = db.prepare('SELECT COUNT(*) AS n FROM reviews').get().n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(pages, Math.max(1, parseInt(req.query.page, 10) || 1));
  const items = db
    .prepare(
      `SELECT id, name, email, phone, rating, text, status, featured, source, permission, created_at AS createdAt
       FROM reviews ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(perPage, (page - 1) * perPage);
  res.json({ items, page, pages, total });
});

app.patch('/api/admin/reviews/:id', requireStaff, requireAdmin, (req, res) => {
  const r = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  if (!r) return bad(res, 'Review not found.', 404);
  const { status, featured } = req.body || {};
  if (status !== undefined) {
    if (!['published', 'hidden'].includes(status)) return bad(res, 'Invalid status.');
    db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, r.id);
  }
  if (featured !== undefined) db.prepare('UPDATE reviews SET featured = ? WHERE id = ?').run(featured ? 1 : 0, r.id);
  res.json({ ok: true });
});

// Add an approved testimonial from another source (e.g. a Google review or a WhatsApp message)
const SOURCES = ['google', 'whatsapp', 'in-person', 'website'];
app.post('/api/admin/reviews', requireStaff, requireAdmin, (req, res) => {
  const b = req.body || {};
  const name = clean(b.name, 60);
  const text = clean(b.text, 1500);
  const rating = Number(b.rating);
  const source = SOURCES.includes(b.source) ? b.source : null;
  if (name.length < 2) return bad(res, 'Please enter the name to display, e.g. “Priya S.”.');
  if (text.length < 10) return bad(res, 'Please paste the testimonial text.');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return bad(res, 'Please choose a star rating.');
  if (!source) return bad(res, 'Please choose where the testimonial came from.');
  if (b.permission !== true) return bad(res, 'Please confirm the patient has given permission to show it.');
  const info = db
    .prepare(
      `INSERT INTO reviews (name, email, phone, rating, text, source, permission, featured)
       VALUES (?, '', '', ?, ?, ?, 1, ?)`
    )
    .run(name, rating, text, source, b.featured === false ? 0 : 1);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

app.delete('/api/admin/reviews/:id', requireStaff, requireAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  if (!info.changes) return bad(res, 'Review not found.', 404);
  res.json({ ok: true });
});

app.get('/api/admin/users', requireStaff, requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM users ORDER BY role, name').all().map(publicUser));
});

app.post('/api/admin/users', requireStaff, requireAdmin, (req, res) => {
  const name = clean(req.body?.name, 80);
  const email = clean(req.body?.email, 120).toLowerCase();
  const role = req.body?.role === 'admin' ? 'admin' : 'employee';
  const password = req.body?.password;
  if (name.length < 2) return bad(res, 'Please enter a name.');
  if (!isEmail(email)) return bad(res, 'Please enter a valid email address.');
  const problem = passwordProblem(password);
  if (problem) return bad(res, problem);
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) return bad(res, 'An account with this email already exists.');
  const id = createUser({ name, email, password, role });
  res.status(201).json(publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id)));
});

app.patch('/api/admin/users/:id', requireStaff, requireAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return bad(res, 'User not found.', 404);
  const b = req.body || {};
  const self = user.id === req.user.id;
  if (self && (b.active === false || b.role === 'employee')) return bad(res, 'You cannot disable or demote your own account.');

  if (b.password !== undefined) {
    const problem = passwordProblem(b.password);
    if (problem) return bad(res, problem);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(b.password), user.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
  }
  if (b.role === 'admin' || b.role === 'employee') db.prepare('UPDATE users SET role = ? WHERE id = ?').run(b.role, user.id);
  if (typeof b.active === 'boolean') {
    db.prepare('UPDATE users SET active = ? WHERE id = ?').run(b.active ? 1 : 0, user.id);
    if (!b.active) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
  }
  res.json(publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(user.id)));
});

app.use('/api', (_req, res) => bad(res, 'Not found.', 404));

/* ---------- uploaded images + the built website ---------- */
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }));

if (existsSync(DIST)) {
  app.use(express.static(DIST, { index: false }));
  app.get(/.*/, (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return bad(res, 'That image is too large — please choose a smaller one.');
  if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') return bad(res, 'You can upload up to 10 photos at a time.');
  if (err.status === 400 || err.type === 'entity.parse.failed') return bad(res, err.message || 'Bad request.');
  console.error(err);
  bad(res, 'Something went wrong on the server.', 500);
});

app.listen(PORT, () => {
  console.log(`API ready on http://localhost:${PORT}`);
  if (!emailEnabled) console.log('Booking emails are off (set SMTP_* in .env to turn them on).');
});
