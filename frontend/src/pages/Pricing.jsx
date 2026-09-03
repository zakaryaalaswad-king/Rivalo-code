import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Check, Crown, Sparkles, Briefcase, Zap } from "lucide-react";

const PLAN_META = {
  basic: {
    color: "var(--slate)",
    icon: Sparkles,
    tagline: "Casual freelancers · build momentum",
    perks: [
      "Apply to up to 10 competitions / month",
      "Polished professional profile page",
      "Trust ladder visible to clients",
      "Standard support (1 business day)",
      "Rivaloz Coach (basic)",
    ],
  },
  pro: {
    color: "var(--cobalt)",
    icon: Zap,
    tagline: "Professional freelancers · win more",
    star: true,
    perks: [
      "Unlimited project applications",
      "Higher search ranking — appear above Basic & Free",
      "Verified pro badge on your profile + cards",
      "Profile analytics (views, win rate, click-throughs)",
      "Rivaloz Coach Pro (deeper reasoning + 24/7 chat)",
      "Priority support (4-hour response)",
      "Early access to new categories",
    ],
  },
  business: {
    color: "var(--volt-ink)",
    accent: "var(--volt)",
    icon: Briefcase,
    tagline: "Companies & teams · scale your hiring",
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
    api.get("/subscriptions/plans")
      .then((r) => setPlans(r.data))
      .catch((e) => setErr(formatApiError(e)));
  }, []);

  const upgrade = async (key) => {
    if (!user || user === false) {
      nav("/login", { state: { from: "/pricing" } });
      return;
    }
    setErr("");
    setBusy(key);
    try {
      const { data } = await api.post("/subscriptions/checkout", { plan: key, origin_url: window.location.origin });
      window.location.href = data.url;
    } catch (e) {
      setErr(formatApiError(e));
      setBusy("");
    }
  };

  if (!plans) return <div className="p-10 text-slate">Loading plans…</div>;

  return (
    <div className="shell">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-16">
        <div className="text-center">
          <span className="pill pill-cobalt">Subscriptions</span>
          <h1 className="font-display text-4xl lg:text-6xl mt-6 text-white">
            Pick a plan worthy of the arena.
          </h1>
          <p className="text-slate mt-3 max-w-2xl mx-auto">
            Stay free, level up to Pro, or scale your team with Business. Cancel any time — your
            perks last the full paid month.
          </p>
          {user && user !== false && user.plan && user.plan !== "free" && (
            <div className="mt-5 inline-flex items-center gap-2 chip chip-volt" data-testid="pricing-current-plan">
              <Check size={12} /> You're on <strong className="capitalize">{user.plan}</strong>
              {user.plan_expires_at && (
                <span className="opacity-70">
                  · renews / expires {new Date(user.plan_expires_at).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(plans).map(([key, p]) => {
            const meta = PLAN_META[key];
            const Icon = meta.icon;
            const isCurrent = user && user !== false && user.plan === key;
            const isFeatured = meta.star;
            return (
              <div
                key={key}
                className="card p-8 relative flex flex-col"
                style={
                  isFeatured
                    ? { borderColor: "var(--cobalt)", boxShadow: "0 8px 24px -8px rgba(61,76,255,0.35)" }
                    : undefined
                }
                data-testid={`plan-${key}`}
              >
                {isFeatured && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs tracking-widest uppercase font-semibold px-3 py-1 rounded-full font-mono"
                    style={{ background: "var(--cobalt)", color: "#fff" }}
                  >
                    Most popular
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Icon size={20} style={{ color: meta.accent || meta.color }} />
                  <h2 className="font-display text-3xl text-graphite">{p.name}</h2>
                </div>
                <div className="text-slate text-sm mt-1">{meta.tagline}</div>
                <div className="mt-6">
                  <span className="font-display text-5xl text-graphite">€{p.price.toFixed(2)}</span>
                  <span className="text-slate text-sm"> / month</span>
                </div>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {meta.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-graphite/85">
                      <Check size={14} className="mt-0.5 shrink-0" style={{ color: meta.accent || meta.color }} />
                      {perk}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => upgrade(key)}
                  disabled={busy === key || isCurrent}
                  className={`mt-8 w-full inline-flex items-center justify-center gap-2 py-3 font-semibold rounded-lg transition-all disabled:opacity-50 ${
                    key === "business" ? "btn-volt" : "btn-primary"
                  }`}
                  data-testid={`plan-${key}-upgrade-btn`}
                >
                  <Crown size={14} />
                  {isCurrent ? "Current plan" : busy === key ? "Redirecting to checkout…" : `Choose ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {err && <div className="mt-6 text-ember text-sm text-center">{err}</div>}

        <div className="mt-16 card p-8 text-center">
          <h3 className="font-display text-2xl text-graphite">Need a custom plan?</h3>
          <p className="text-slate text-sm mt-2 max-w-xl mx-auto">
            Agencies, studios, and enterprises — we can tailor a contract with onboarding,
            dedicated support, and volume discounts.
          </p>
          <a href="mailto:sales@rivaloz.app" className="btn-ghost mt-5 inline-block">
            Talk to sales
          </a>
        </div>

        <p className="mt-10 text-xs text-slate text-center max-w-2xl mx-auto">
          Subscriptions are billed once for 30 days via Stripe (test mode). Recurring auto-renewal
          will activate in the next platform release. See{" "}
          <a href="/terms" className="underline">Terms</a> and{" "}
          <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
