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
      `SELECT id, name, rating, text, created_at AS createdAt FROM reviews
       WHERE status = 'published' ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(REVIEWS_PER_PAGE, (page - 1) * REVIEWS_PER_PAGE);
  res.json({ items, page, pages, perPage: REVIEWS_PER_PAGE, ...summary });
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
   Admin only: reviews (with private contact details) and staff accounts
   ========================================================================== */
app.get('/api/admin/reviews', requireStaff, requireAdmin, (req, res) => {
  const perPage = 20;
  const total = db.prepare('SELECT COUNT(*) AS n FROM reviews').get().n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(pages, Math.max(1, parseInt(req.query.page, 10) || 1));
  const items = db
    .prepare(
      `SELECT id, name, email, phone, rating, text, status, created_at AS createdAt
       FROM reviews ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(perPage, (page - 1) * perPage);
  res.json({ items, page, pages, total });
});

app.patch('/api/admin/reviews/:id', requireStaff, requireAdmin, (req, res) => {
  const status = req.body?.status;
  if (!['published', 'hidden'].includes(status)) return bad(res, 'Invalid status.');
  const info = db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, req.params.id);
  if (!info.changes) return bad(res, 'Review not found.', 404);
  res.json({ ok: true });
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
  if (err.code === 'LIMIT_FILE_SIZE') return bad(res, 'Cover image must be smaller than 5 MB.');
  if (err.status === 400 || err.type === 'entity.parse.failed') return bad(res, err.message || 'Bad request.');
  console.error(err);
  bad(res, 'Something went wrong on the server.', 500);
});

app.listen(PORT, () => console.log(`API ready on http://localhost:${PORT}`));
