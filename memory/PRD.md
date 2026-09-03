# Rivaloz — PRD

## Original problem statement
> Build a SaaS marketplace app for freelancers who compete on client briefs via mini-challenges.
> Clients post projects, multiple freelancers apply, and a select few are approved to complete a
> mini-project within a set timeframe. Includes dynamic UI/UX, AI vetting/mentoring (Rivaloz Coach),
> Stripe subscriptions, real object storage for portfolios, in-app notifications, and comprehensive
> legal/compliance pages.

## Architecture
- Backend: FastAPI + MongoDB (Motor) + JWT auth + bcrypt + Resend (emails) + Stripe Checkout (via emergentintegrations).
- Frontend: React 19 + react-router-dom 7 + Tailwind + shadcn/ui + lucide-react + sonner toasts.
- **Theme: "Night Arena"** — ink shell (`#15171C`), warm off-white canvas (`#F6F4EF`), cobalt CTAs (`#3D4CFF`), volt for wins (`#C8FF4D`), ember for countdown urgency (`#FF6B4A`), graphite text, slate muted. Fonts: **Clash Display** (display), **Satoshi** (body), **IBM Plex Mono** (numbers/stats/countdown).

## User personas
- **Client (business owner)** — posts briefs, funds the bounty in escrow, hand-picks competitors, crowns a winner.
- **Freelancer** — applies with a pitch, competes against up to 2 others in a timed showdown, submits deliverables, builds a reputation.
- **Dual role** — every account can do both.

## Implemented (through 2026-09-03)
- Auth: JWT email/password with httpOnly cookies + Bearer fallback. Seeded demo users. Email OTP verification.
- Profile: skills, portfolio URLs, bio, headline, avatar, CV, social links, former projects, trust ladder.
- Projects: create / list / filter (category, search, status, min budget) / mine.
- Lifecycle: `draft → open (after Stripe payment) → in_progress (after approve) → completed (after pick-winner)`.
- Applications: apply (rate-limited unique per project), client lists, approves up to N (rejects rest).
- Approval notifications: Resend emails to approved + rejected, plus in-app notifications.
- Submissions: approved freelancers submit (description + URL + files); client views all and picks winner.
- Stripe Checkout escrow flow for project bounty (server-side amount, dynamic success/cancel URLs, polling page, webhook).
- Dashboard with dual-role tabs ("As Client" / "As Freelancer") + live scoreboard + flip countdown timers.
- Object storage `/api/upload` (multipart, 10MB cap) → served via `/api/files/{path}` with token auth.
- In-app notifications bell (25s polling + mark-all-read).
- Subscriptions (Basic, Pro, Business) — Stripe Checkout, plan tracked on user.
- Rivaloz Coach V2 (AI chat + fairness engine + vetting task generator, emergentintegrations + Emergent LLM key).
- Legal pages: Privacy, Terms, Refund Policy, Contact (US SaaS lawyer voice).

## Iteration 6 — Rename & Night Arena Redesign (2026-09-03)
- **Brand rename**: Rivalo → Rivaloz across backend, frontend, config, emails, storage prefix, page titles, and metadata. Legacy `rivalo/uploads/*` files remain accessible via full stored URLs (backend comment documents this).
- **Full UI/UX redesign** — "Night Arena" concept:
  - New CSS variable token system (`--ink`, `--canvas`, `--volt`, `--cobalt`, `--ember`, `--graphite`, `--slate`, `--hairline`); Tailwind config exposes them as color utilities.
  - Removed: animated mesh gradient background, cyber grid, marquee ticker, glassmorphism cards, grain/noise overlay, fade-slide-up reveal on every section, gold/luxury accents.
  - Added: warm off-white canvas surface for content cards, dark ink shell for chrome/nav/footer, single volt accent reserved for wins.
  - **BattleView** — new signature component: diagonal split-screen for 2–3 approved competitors with `vs-enter-left`/`vs-enter-right` slide-in + `vs-shake` impact, `winner-reveal` 3D tilt + volt glow + camera-flash light streaks.
  - **Countdown** — 3D split-flap flip-clock with true `rotateX` animation (respects `prefers-reduced-motion`).
  - **Scoreboard bar** — persistent sport-scoreboard-styled strip on Dashboard + ProjectDetail (Stage / Bounty / Seats / Window / Time left).
  - Sharper 8px radii for functional elements; full pills reserved for avatars/badges/status chips.
  - Fonts: Clash Display + Satoshi + IBM Plex Mono via fontshare/Google.
  - Accessibility: visible `:focus-visible` outline, `prefers-reduced-motion` blanket rule.
- **Code refactor**: split `ProjectDetail.jsx` into `components/project/{ApplyCard,ApplicantsPanel,SubmissionsPanel,WinnerPanel,BattleView}.jsx`. Fixed pre-existing `_json.loads` NameError in AI winner endpoint. Fixed stray `}` in `Profile.jsx`. Replaced index keys with stable ids (AiChat messages, former projects, uploaded files).

## Backlog
- **P1** Stripe Connect (Express onboarding + winner payout).
- **P1** Emergent Google Auth ("Continue with Google").
- **P1** Auto-renewing Stripe subscriptions.
- **P1** PayPal + Razorpay payment providers.
- **P2** Rivaloz Coach floating assistant redesign (typing animation ✅, voice-ready arch).
- **P2** Ratings & reviews after completion.
- **P2** Project messaging between client and approved competitors.
- **P3** Public freelancer profile pages.

## Test credentials
See `/app/memory/test_credentials.md`.
