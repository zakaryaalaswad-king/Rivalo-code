# ArenaBid — PRD

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
