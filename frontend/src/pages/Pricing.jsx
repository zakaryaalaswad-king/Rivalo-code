import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Check, Crown, Sparkles, Briefcase, Zap } from "lucide-react";

const PLAN_META = {
  basic: {
    badge: "🟢", color: "#22C55E", icon: Sparkles, tagline: "Casual freelancers · build momentum",
    perks: [
      "Apply to up to 10 competitions / month",
      "Polished professional profile page",
      "Trust ladder visible to clients",
      "Standard support (1 business day)",
      "Rivalo Coach (basic)",
    ],
  },
  pro: {
    badge: "🔵", color: "#3B82F6", icon: Zap, tagline: "Professional freelancers · win more", star: true,
    perks: [
      "Unlimited project applications",
      "Higher search ranking — appear above Basic & Free",
      "Verified pro badge on your profile + cards",
      "Profile analytics (views, win rate, click-throughs)",
      "Rivalo Coach Pro (deeper reasoning + 24/7 chat)",
      "Priority support (4-hour response)",
      "Early access to new categories",
    ],
  },
  business: {
    badge: "🟣", color: "#A855F7", icon: Briefcase, tagline: "Companies & teams · scale your hiring",
    perks: [
      "Everything in Pro",
      "Team management (seats, roles, audit log)",
      "Unlimited job postings",
      "Bulk briefs + multi-project workflows",
      "AI winner recommendation with full reasoning",
      "Custom evaluation criteria templates",
      "Premium support (SLA · dedicated success manager)",
      "Business tools (invoices, tax exports, white-label option)",
    ],
  },
};

export default function Pricing() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [plans, setPlans] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/subscriptions/plans").then((r) => setPlans(r.data)).catch((e) => setErr(formatApiError(e)));
  }, []);

  const upgrade = async (key) => {
    if (!user || user === false) { nav("/login", { state: { from: "/pricing" } }); return; }
    setErr(""); setBusy(key);
    try {
      const { data } = await api.post("/subscriptions/checkout", { plan: key, origin_url: window.location.origin });
      window.location.href = data.url;
    } catch (e) { setErr(formatApiError(e)); setBusy(""); }
  };

  if (!plans) return <div className="p-10 text-muted">Loading plans…</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-16">
      <div className="text-center">
        <span className="pill">Subscriptions</span>
        <h1 className="font-display text-4xl lg:text-6xl mt-6">Pick a plan worthy of the arena.</h1>
        <p className="text-muted mt-3 max-w-2xl mx-auto">Stay free, level up to Pro, or scale your team with Business. Cancel any time — your perks last the full paid month.</p>
        {user && user !== false && user.plan && user.plan !== "free" && (
          <div className="mt-5 inline-flex items-center gap-2 chip chip-green" data-testid="pricing-current-plan">
            <Check size={12} /> You're on <strong className="capitalize">{user.plan}</strong>
            {user.plan_expires_at && <span className="text-muted">· renews / expires {new Date(user.plan_expires_at).toLocaleDateString()}</span>}
          </div>
        )}
      </div>

      <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(plans).map(([key, p]) => {
          const meta = PLAN_META[key];
          const Icon = meta.icon;
          const isCurrent = user && user !== false && user.plan === key;
          return (
            <div key={key} className={`card p-8 relative flex flex-col ${meta.star ? "border-[#3B82F6]/50 shadow-2xl scale-[1.02]" : ""}`} data-testid={`plan-${key}`}>
              {meta.star && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs tracking-widest uppercase font-semibold px-3 py-1 rounded-full" style={{ background: meta.color, color: "white" }}>
                  ⭐ Most popular
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-2xl">{meta.badge}</span>
                <h2 className="font-display text-3xl" style={{ color: meta.color }}>{p.name}</h2>
              </div>
              <div className="text-muted text-sm mt-1">{meta.tagline}</div>
              <div className="mt-6">
                <span className="font-display text-5xl">€{p.price.toFixed(2)}</span>
                <span className="text-muted text-sm"> / month</span>
              </div>
              <ul className="mt-6 space-y-2.5 flex-1">
                {meta.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check size={14} className="mt-0.5 shrink-0" style={{ color: meta.color }} /> {perk}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => upgrade(key)}
                disabled={busy === key || isCurrent}
                className={`mt-8 w-full inline-flex items-center justify-center gap-2 py-3 font-semibold rounded-2xl transition-all disabled:opacity-50`}
                style={{
                  background: meta.star ? `linear-gradient(135deg, ${meta.color}, #1D4ED8)` : `${meta.color}1A`,
                  color: meta.star ? "white" : meta.color,
                  border: `1px solid ${meta.color}55`,
                  boxShadow: meta.star ? `0 8px 22px -6px ${meta.color}66` : "none",
                }}
                data-testid={`plan-${key}-upgrade-btn`}
              >
                <Crown size={14}/> {isCurrent ? "Current plan" : busy === key ? "Redirecting to checkout…" : `Choose ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {err && <div className="mt-6 text-red-400 text-sm text-center">{err}</div>}

      <div className="mt-16 card p-8 text-center">
        <h3 className="font-display text-2xl">Need a custom plan?</h3>
        <p className="text-muted text-sm mt-2 max-w-xl mx-auto">Agencies, studios, and enterprises — we can tailor a contract with onboarding, dedicated support, and volume discounts.</p>
        <a href="mailto:sales@rivalo.example" className="btn-ghost mt-5 inline-block">Talk to sales</a>
      </div>

      <p className="mt-10 text-xs text-muted text-center max-w-2xl mx-auto">
        Subscriptions are billed once for 30 days via Stripe (test mode). Recurring auto-renewal will activate in the next platform release.
        See <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
      </p>
    </div>
  );
}
