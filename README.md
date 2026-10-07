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

### Appointments & time slots

1. A patient books on the website (name, contact number, date of birth, preferred date & time).
   They see an instant confirmation; the request appears under **Appointments → New requests**
   in `/admin`, and (if SMTP is set in `.env`) the clinic gets an email.
2. Staff call the patient, then press **Confirm booking** — adjusting the date/time and adding a
   note if needed. The slot is now taken: on the website it shows as **Booked** and can't be chosen.
3. **Reschedule**, **Visited** or **Cancel** (cancelling frees the slot). Staff can also
   **Book appointment** directly for patients who phone in.

Opening days, hours, slot length (30 min), notice (from tomorrow) and how far ahead patients can
book (2 weeks) are set in `server/booking-rules.js` — the website and server both read it.

### Data & backups

Everything (database `mirrors.db` + uploaded cover images in `uploads/`) is in `server/data/`,
or in `DATA_DIR` if set. **Back up this folder regularly.** It is git-ignored. The six starter
articles are loaded from `server/seed-posts.json` the first time the database is created.

## Images & permissions

- Every photo the website uses comes from **Unsplash** (free for commercial use, no credit
  required — https://unsplash.com/license). Each photo's Unsplash ID is recorded in
  `public/images/site/SOURCES.json` (view one at `https://images.unsplash.com/photo-<ID>`).
  Only use photos listed there, or the clinic's own.
- Stock photos are illustrations only — the Medical disclaimer on `/policies` says so. Replace
  them with the clinic's own photos as they arrive.
- **Patient photos (including before/after) must be the clinic's own, with the patient's written
  consent.** The gallery upload in `/admin` requires staff to confirm ownership and consent.

## Deploying

### Option A — Vercel only (what is live now): website without the server

Vercel serves the pages but cannot run the Node server or keep a database. The site handles this:

- Blog shows the six built-in articles (posts written in `/admin` will not appear).
- The booking form sends the patient to WhatsApp with their details pre-filled.
- Reviews page shows a “Review us on Google” button instead of the form.
- `/admin` shows a notice that the staff area needs the server.

### Option B — full site with the server (recommended)

Host on a service that runs Node **and** keeps files between restarts. Easiest: **Render**
(`render.yaml` is included — New → Blueprint → choose this repo, enter `ADMIN_EMAIL` and
`ADMIN_PASSWORD`). Railway with a volume, or any VPS, also works:

```bash
npm ci
npm run build     # builds the website into dist/
npm start         # serves the website AND the API on $PORT
```

Set `DATA_DIR` to the persistent disk and `NODE_ENV=production` (needs HTTPS for secure
cookies). Then point the domain (themirrorsdermclinic.com) at the new host instead of Vercel.

Bookings, call-back requests and questions appear for staff under **Appointments** in `/admin`.
