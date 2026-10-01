# The Mirrors Dermatology Clinic — website

First Floor, 1/95D, Avinashi Rd, Neelambur, Coimbatore 641062 · +91 93612 61413 · Mon–Sat 3–7 pm

React + Vite multi-page site with Framer Motion animation, Lenis smooth scrolling and a
guided booking chat assistant ("Aura").

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Pages

| Route | Content |
| --- | --- |
| `/` | Hero, specialities stack, journey, results, why-us bento, team, stories |
| `/about` | Story, credentials, milestone timeline, values, numbers, the space |
| `/treatments` | Filterable treatment menu, specialities list, conditions A–Z search, pricing, FAQ |
| `/treatments/:slug` | One page per speciality: facts, overview, what to expect, doctor quote, FAQ, related |
| `/journey` | Horizontal journey, first visit minute-by-minute, checklist, technology, tele-derm, payment |
| `/results` | Before/after case studies, outcomes, gallery |
| `/specialists` | Team with profile modals, how we work, careers |
| `/stories` | Rating summary, filterable reviews, featured story |
| `/contact` | Chat / call / email / WhatsApp, booking form, map, hours, FAQ |

## Chat assistant (Aura)

`src/chat/flow.js` defines the conversation: booking an appointment, treatment info, prices,
hours & location, questions, call-back requests and contact options. Any button can open the
chat at a specific step, e.g. `chat.open('book', { concern: 'Laser & Resurfacing' })`.

Requests from the chat and the contact form go through `submitRequest()` in `src/api.js`.
Copy `.env.example` to `.env` and set `VITE_REQUEST_ENDPOINT` to receive them.

## Before going live

- Clinic details (phone, WhatsApp, Instagram, address, map, hours) live in `src/data/site.js`.
- Replace the placeholder doctors, reviews, stats, history and ₹ prices in `src/data/` with real ones.
- Photos are stored locally in `public/images/site/<name>-<480|960|1600>.webp`. To swap one,
  save your photo in those three widths with the same name. Logos are in `public/images/brand/`.
- Brand colours are the CSS variables at the top of `src/styles.css` (navy, teal, aqua…).
- The before/after images are **simulated** — use real, consented patient photos.

## Backend: reviews, blog and staff area

A small Node server in `server/` (Express + SQLite) stores patient reviews and blog posts, and
runs the private staff area at `/admin`.

| What | Where |
| --- | --- |
| Patient reviews | Anyone can post on `/reviews` (name, phone, email, rating, review). Only the name, rating and review are public; phone and email are visible to admins only. 10 per page with pagination. |
| Blog | Posts load from the database. Staff write, edit, publish or unpublish them at `/admin`. |
| Staff area | `/admin` — **Admin** (owner): posts, reviews (hide/delete), staff accounts. **Employee**: write posts and edit their own. Not linked from the public site. |

### First-time setup

```bash
cp .env.example .env         # then set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters)
npm install
npm run dev                  # website http://localhost:5173 + API http://localhost:3001
```

The owner's admin account is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` on the first start.
You can also create accounts from the command line:

```bash
npm run create-admin -- "Owner Name" owner@example.com "strong-password"
npm run create-admin -- "Staff Name" staff@example.com "strong-password" employee
```

After that, the owner adds employees from **Staff accounts** in `/admin`.

### Data & backups

Everything (database `mirrors.db` + uploaded cover images in `uploads/`) is in `server/data/`,
or in `DATA_DIR` if set. **Back up this folder regularly.** It is git-ignored. The six starter
articles are loaded from `server/seed-posts.json` the first time the database is created.

## Deploying

The site now needs a Node server (Node 22.13+), because the database lives on disk:

```bash
npm install
npm run build     # builds the website into dist/
npm start         # serves the website AND the API on $PORT (default 3001)
```

Use a host that runs Node and keeps files between restarts: a VPS, Render or Railway with a
persistent disk, etc. Point `DATA_DIR` at that disk and set `NODE_ENV=production` (secure
cookies need HTTPS). Static-only hosting (Vercel, Netlify) cannot run the database, so
`vercel.json` and `public/_redirects` only apply if you split the site and API later.
