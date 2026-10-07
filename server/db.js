/*
 * SQLite database (Node's built-in node:sqlite — no native build needed).
 * The database file and uploaded images live in DATA_DIR (default: server/data).
 * Back up that folder to back up the whole site's content.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const here = path.dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(here, 'data'));
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, 'mirrors.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
    active        INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );

  -- Phone and email are private: they are only ever returned to admins.
  CREATE TABLE IF NOT EXISTS reviews (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT NOT NULL,
    rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    text       TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
    ip         TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
  CREATE INDEX IF NOT EXISTS reviews_public ON reviews (status, created_at DESC);



  CREATE TABLE IF NOT EXISTS posts (
    id           INTEGER PRIMARY KEY,
    slug         TEXT NOT NULL UNIQUE,
    title        TEXT NOT NULL,
    excerpt      TEXT NOT NULL,
    category     TEXT NOT NULL,
    author       TEXT NOT NULL,
    cover        TEXT,
    body         TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    published_at TEXT,
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
  CREATE INDEX IF NOT EXISTS posts_public ON posts (status, published_at DESC);
`);

/*
 * Appointment bookings, call-back requests and questions from the website.
 * status: new (waiting for staff) → confirmed (slot booked) → done, or cancelled.
 * A confirmed appointment holds its date + time slot, so no one else can book it.
 */
const REQUESTS_TABLE = `
  CREATE TABLE IF NOT EXISTS requests (
    id           INTEGER PRIMARY KEY,
    ref          TEXT NOT NULL UNIQUE,
    type         TEXT NOT NULL CHECK (type IN ('appointment', 'callback', 'enquiry')),
    name         TEXT NOT NULL,
    phone        TEXT,
    email        TEXT,
    dob          TEXT,
    date         TEXT,
    time         TEXT,
    concern      TEXT,
    message      TEXT,
    note         TEXT,
    status       TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'done', 'cancelled')),
    source       TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'staff')),
    confirmed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    confirmed_at TEXT,
    ip           TEXT,
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`;

// Upgrade databases created before appointments could be confirmed
const existing = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'requests'").get();
if (existing && !existing.sql.includes("'confirmed'")) {
  db.exec('BEGIN');
  db.exec(REQUESTS_TABLE.replace('requests (', 'requests_v2 ('));
  db.exec(`INSERT INTO requests_v2 (id, ref, type, name, phone, email, dob, date, time, concern, message, status, ip, created_at)
           SELECT id, ref, type, name, phone, email, dob, date, time, concern, message, status, ip, created_at FROM requests`);
  db.exec('DROP TABLE requests');
  db.exec('ALTER TABLE requests_v2 RENAME TO requests');
  db.exec('COMMIT');
}
db.exec(REQUESTS_TABLE);
db.exec(`
  CREATE INDEX IF NOT EXISTS requests_recent ON requests (status, created_at DESC);
  -- One confirmed appointment per date + time slot
  CREATE UNIQUE INDEX IF NOT EXISTS requests_slot ON requests (date, time)
    WHERE type = 'appointment' AND status IN ('confirmed', 'done');
`);

// Testimonials: reviews staff choose to feature, and quotes added by staff from other sources
const reviewCols = db.prepare('PRAGMA table_info(reviews)').all().map((c) => c.name);
if (!reviewCols.includes('featured')) db.exec('ALTER TABLE reviews ADD COLUMN featured INTEGER NOT NULL DEFAULT 0');
if (!reviewCols.includes('source')) db.exec("ALTER TABLE reviews ADD COLUMN source TEXT NOT NULL DEFAULT 'website'");
if (!reviewCols.includes('permission')) db.exec('ALTER TABLE reviews ADD COLUMN permission INTEGER NOT NULL DEFAULT 0');

/* Photo gallery — uploaded by staff from /admin/gallery */
db.exec(`
  CREATE TABLE IF NOT EXISTS gallery (
    id         INTEGER PRIMARY KEY,
    image      TEXT NOT NULL,
    caption    TEXT NOT NULL DEFAULT '',
    category   TEXT NOT NULL DEFAULT 'Gallery', -- unused: the gallery has no categories
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
  CREATE INDEX IF NOT EXISTS gallery_recent ON gallery (category, created_at DESC);
`);

/* First run: load the starter blog articles */
if (db.prepare('SELECT COUNT(*) AS n FROM posts').get().n === 0) {
  const seed = JSON.parse(readFileSync(path.join(here, 'seed-posts.json'), 'utf8'));
  const insert = db.prepare(
    `INSERT INTO posts (slug, title, excerpt, category, author, cover, body, status, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)`
  );
  for (const p of seed) insert.run(p.slug, p.title, p.excerpt, p.category, p.author, p.cover, p.body, p.publishedAt);
}

export const now = () => new Date().toISOString();
