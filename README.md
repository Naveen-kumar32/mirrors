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

## Deploying

Routes are client-side, so the host must serve `index.html` for every path.
`public/_redirects` (Netlify) and `vercel.json` (Vercel) are included.
# mirrors
