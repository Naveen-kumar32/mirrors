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
