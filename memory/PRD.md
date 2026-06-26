# Rivalo — PRD

## Original problem statement
> Build an app for freelancers where they can make competitions with each other to get the client's project.
> A business owner posts the project; up to 10 freelancers apply; the client approves 3; approved freelancers are
> emailed and have a 2hr–5day window to finish; built for all freelancing categories.
> Theme: purple, dark blue, gold. Dynamic frontend and backend.

## Architecture
- Backend: FastAPI + MongoDB (Motor) + JWT auth + bcrypt + Resend (emails) + Stripe Checkout (via emergentintegrations).
- Frontend: React 19 + react-router-dom 7 + Tailwind + shadcn/ui + lucide-react + sonner toasts.
- Theme: Dark Luxury — palette `#050614` / `#0A0C22` / `#D4AF37` (gold) / `#6B21A8` (purple). Fonts: Cormorant Garamond (display) + Outfit (body) + JetBrains Mono.

## User personas
- **Client (business owner)** — posts briefs, funds the bounty in escrow, hand-picks competitors, crowns a winner.
- **Freelancer** — applies with a pitch, competes against 2 others in a timed showdown, submits deliverables, builds a reputation.
- **Dual role** — every account can do both.

## Implemented (2026-02-25)
- Auth: JWT email/password with httpOnly cookies + Bearer fallback. Seeded demo users.
- Profile: skills, portfolio URLs, bio, headline, avatar.
- Projects: create / list / filter (category, search) / mine.
- Lifecycle: `draft → open (after Stripe payment) → in_progress (after approve) → completed (after pick-winner)`.
- Applications: apply (rate-limited unique per project), client lists, approves up to N (rejects rest).
- Approval notifications: Resend emails to approved + rejected. Falls back to log on sandbox failure.
- Submissions: approved freelancers submit (description + URL); client views all and picks winner.
- Stripe Checkout escrow flow for project bounty (server-side amount, dynamic success/cancel URLs, polling page, webhook).
- Dashboard with dual-role tabs ("As Client" / "As Freelancer") + live countdown timers.
- Landing page: hero with stats, How it works, categories grid, dual CTA panels.

## Iteration 4 — Theme, verification, profile, trust points, AI (2026-02-26)
- **Theme**: full swap to `#0F172A` bg / `#3B82F6` primary blue / `#22C55E` green accent / `#94A3B8` muted text + **Manrope** font. Soft 10–12px button radii, smooth click-shrink animation (`transform scale(0.985)` on `:active`), gradient primary CTAs with hover lift + tinted shadow. Logo wedges recoloured blue + green.
- **Email verification**: 6-digit OTP via Resend (`db.email_codes`, 15-min expiry, 5-attempt lockout). `POST /api/auth/send-verification`, `POST /api/auth/verify-email`. New `require_verified` dependency gates `POST /api/projects` and `POST /api/projects/{id}/apply` (403 until verified). Code also logged at INFO for sandbox.
- **Profile management page** (`/profile`): avatar upload, age, phone, location, languages, hourly rate, bio, skills, CV upload (PDF), 6 social links (LinkedIn/Twitter/Instagram/Behance/GitHub/Website), repeatable Former Projects, live Trust Ladder checklist. Avatar dropdown in header (initial-gradient avatar → dropdown with name/email/trust-chip/profile-management/dashboard/post/logout).
- **Trust points (max 100)**: avatar 5 · email 10 · phone 5 · phone_verified 5 · CV 10 · bio≥120 5 · skills≥5 5 · portfolio≥3 5 · socials≥2 5 · socials≥4 5 · former_projects≥3 10 · wins 1/3/5 → 15/15/10. Visible TrustRing on profile + chip in avatar menu.
- **AI Coach** (`POST /api/ai/chat`): `emergentintegrations.llm.chat.LlmChat` + `gpt-4o-mini` + Emergent LLM key. Hard-prompted not to write deliverables / disclose competitors / facilitate cheating. Floating chat widget mounted globally.
- **AI Vetting Task generator** (`POST /api/ai/vetting-task`): given a project + chosen freelancers, returns JSON-structured short vetting challenge (≤25% of window, single deliverable, eval criteria).


- **Branded emails**: `email_shell()` wrapper with inline SVG Rivalo logo, gold heading, dark-luxury layout. Used in approve, rejection, and winner emails.
- **Object storage**: `POST /api/upload` (multipart, 10MB cap, MIME whitelist: images / PDF / mp4 / mov / txt / csv / zip). Returns `/api/files/{path}` URL stored on documents. `GET /api/files/{path}` serves files with Bearer or `?auth=token` (for `<img>` src). Reusable `<FileUploader />` integrated into Post Project (reference attachments) and submission form (deliverable files). File metadata persisted in `db.files` with `is_deleted` soft-delete.
- **In-app notifications**: `db.notifications` collection. Created on `new_applicant`, `approved`, `rejected`, `submission`, `won`. Header bell with unread badge, dropdown with last 50, polling every 25s, mark-all-read.


## Rebrand v2 (2026-02-25)
- Renamed `ArenaBid → Rivalo`. Updated backend `APP_NAME`, FastAPI title, logger, page title, all UI copy.
- New logo: gold + purple opposing chevrons inside a sharp square (rivalry mark), wordmark "Rival**o**" with italic gold "o". Reusable `<Logo />` component with subtle pulse animation.
- Neon/cyber + animated gradient mesh: fixed background with three drifting radial blobs (purple, dark-blue, gold) blurred 110px on slow 22-32s loops + faint cyber grid masked from the edges.
- Reveal-on-scroll: `useReveal` hook (IntersectionObserver) and `<Reveal>` wrapper used across landing sections with staggered delays.
- Subtle hero parallax (background image and floating neon orbs translate on scroll).
- Marquee strip of disciplines below hero. Gradient CTA buttons (`.cta-neon`) with hover lift + dual-color shadow.

## Backlog (not yet built)
- **P1** True object storage for portfolio images and deliverable file uploads (currently URL-only).
- **P1** Payout to winner (currently bounty just marks the project completed; release is implied).
- **P1** Profile page (public) with portfolio + wins count.
- **P2** Project messaging between client and approved competitors.
- **P2** Ratings & reviews after completion.
- **P2** Email verification on signup, password reset.
- **P2** Notifications center (in-app bell).
- **P2** Admin moderation / category management.
- **P3** Stripe Connect for direct payouts to winner's bank account.

## Test credentials (auto-seeded)
- `client@demo.com` / `demo1234`
- `freelancer@demo.com` / `demo1234`
