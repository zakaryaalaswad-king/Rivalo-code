import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Brush,
  Code2,
  PenTool,
  Camera,
  BarChart3,
  Megaphone,
  Music2,
  Boxes,
  Trophy,
  Zap,
  Timer,
} from "lucide-react";
import api from "../lib/api";

const CATS = [
  { name: "Graphic Design", icon: Brush },
  { name: "Web Development", icon: Code2 },
  { name: "Writing & Translation", icon: PenTool },
  { name: "Video & Animation", icon: Camera },
  { name: "Marketing & SEO", icon: Megaphone },
  { name: "Data & Analytics", icon: BarChart3 },
  { name: "Music & Audio", icon: Music2 },
  { name: "3D & Illustration", icon: Boxes },
];

export default function Landing() {
  const [stats, setStats] = useState({ open_projects: 0, completed: 0, users: 0 });

  useEffect(() => {
    api.get("/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <HeroBattle stats={stats} />
      <HowItWorks />
      <Categories />
      <ForEachSide />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HERO — live battle visual instead of a generic gradient headline    */
/* ------------------------------------------------------------------ */
function HeroBattle({ stats }) {
  return (
    <section className="shell relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left copy */}
        <div className="lg:col-span-6">
          <span className="pill pill-cobalt" data-testid="hero-pill">Live · competitive freelance</span>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 leading-[0.95] text-white">
            Two rivals enter.
            <br />
            One claims the bounty.
          </h1>
          <p className="mt-6 text-lg text-white/70 max-w-xl leading-relaxed">
            Rivaloz is the arena where three freelancers compete head-to-head on a
            client&rsquo;s brief. Timed. Judged. Paid.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary inline-flex items-center gap-2" data-testid="hero-join-btn">
              Enter Rivaloz <ArrowRight size={16} />
            </Link>
            <Link to="/browse" className="btn-ghost text-white inline-flex items-center gap-2" data-testid="hero-browse-btn">
              Browse open briefs
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <HeroStat label="Open briefs" value={stats.open_projects} accent="cobalt" />
            <HeroStat label="Wins paid" value={stats.completed} accent="volt" />
            <HeroStat label="Talent" value={stats.users} accent="ember" />
          </div>
        </div>

        {/* Right: static battle diorama */}
        <div className="lg:col-span-6">
          <BattleDiorama />
        </div>
      </div>
    </section>
  );
}

function HeroStat({ label, value, accent }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`font-mono text-3xl scoreboard-value ${accent}`}>{String(value).padStart(2, "0")}</span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-slate">{label}</span>
    </div>
  );
}

function BattleDiorama() {
  // Deliberate, single "signature" moment: three competitor tiles arranged like
  // an arena bracket. Cobalt for the two contenders, volt for the champion.
  return (
    <div className="relative">
      <div className="shell-card p-5 md:p-6" data-testid="hero-diorama">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--ember)] animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-slate">Live arena · brief #482</span>
          </div>
          <span className="pill pill-ember font-mono">
            <Timer size={11} className="inline mr-1" /> 02:14:33
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Contender name="Maya K." role="Brand · 6y" score={78} color="cobalt" />
          <Contender name="Ari D." role="Motion · 4y" score={81} color="cobalt" />
          <Contender name="Léa T." role="Type · 8y" score={94} color="volt" isWinner />
        </div>

        <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--shell-hairline)" }}>
          <div className="text-xs text-slate">
            Bounty <span className="font-mono text-white text-sm ml-1">$2,400</span>
          </div>
          <div className="text-xs inline-flex items-center gap-1.5 text-[var(--volt)]">
            <Trophy size={12} /> Winner chosen
          </div>
        </div>
      </div>

      <div className="absolute -top-4 -right-4 pill pill-volt font-mono text-xs shadow-lg hidden md:inline-block">
        <Zap size={11} className="inline mr-1" /> Match paid in 3.2s
      </div>
    </div>
  );
}

function Contender({ name, role, score, color, isWinner }) {
  const isVolt = color === "volt";
  return (
    <div
      className={`relative rounded-lg p-4 ${isVolt ? "" : "bg-white/[0.04]"} `}
      style={{
        background: isVolt ? "var(--volt)" : undefined,
        color: isVolt ? "var(--volt-ink)" : "#F0EEE8",
        border: `1px solid ${isVolt ? "var(--volt)" : "var(--shell-hairline)"}`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs ${isVolt ? "" : "bg-[var(--cobalt)] text-white"}`}
             style={isVolt ? { background: "var(--volt-ink)", color: "var(--volt)" } : undefined}>
          {name[0]}
        </div>
        {isWinner && <Trophy size={14} />}
      </div>
      <div className="mt-3 text-sm font-semibold leading-tight">{name}</div>
      <div className="text-[10px] mt-0.5 opacity-70">{role}</div>
      <div className="mt-3 font-mono text-2xl leading-none">{score}</div>
      <div className="text-[10px] uppercase tracking-widest opacity-70 mt-1">score</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HOW IT WORKS — content on the canvas surface                        */
/* ------------------------------------------------------------------ */
function HowItWorks() {
  const steps = [
    { n: "01", t: "Brief", d: "A client posts a project, sets a bounty (2 hr – 5 day window), funds it via Stripe escrow." },
    { n: "02", t: "Applications", d: "Up to ten freelancers pitch with their portfolio and angle. Free to apply." },
    { n: "03", t: "Approval", d: "The client picks three. Approved competitors are notified by email instantly." },
    { n: "04", t: "Showdown", d: "Approved talent submits before the timer ends. Client picks the winner. Bounty released." },
  ];
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-10 py-24">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
        <div className="md:col-span-4">
          <span className="pill pill-cobalt">The Ritual</span>
          <h2 className="font-display text-4xl lg:text-5xl mt-6 leading-tight text-white">
            Four steps.
            <br /> One winner.
          </h2>
          <p className="mt-4 text-white/60 max-w-sm">
            Clients see proven work before they pay. Freelancers compete on craft, not on lowest bid.
          </p>
        </div>
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map((s) => (
            <div key={s.n} className="card p-6" data-testid={`step-${s.n}`}>
              <div className="font-mono text-[var(--cobalt)] text-sm">{s.n}</div>
              <div className="font-display text-2xl mt-2 text-graphite">{s.t}</div>
              <div className="text-slate mt-2 text-sm leading-relaxed">{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* CATEGORIES                                                          */
/* ------------------------------------------------------------------ */
function Categories() {
  return (
    <section className="shell border-y py-20" style={{ borderColor: "var(--shell-hairline)" }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="pill pill-cobalt">Disciplines</span>
            <h2 className="font-display text-4xl lg:text-5xl mt-6 text-white">Every craft has its arena.</h2>
          </div>
          <Link to="/browse" className="text-[var(--volt)] hover:underline text-sm">
            Browse all briefs →
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATS.map(({ name, icon: I }, i) => (
            <Link
              key={name}
              to={`/browse?category=${encodeURIComponent(name)}`}
              className="shell-card p-5 hover:border-[var(--cobalt)] transition-colors group"
              data-testid={`category-${i}`}
              style={{ transitionProperty: "border-color, transform" }}
            >
              <I className="text-white/70 group-hover:text-[var(--volt)] transition-colors" size={22} />
              <div className="mt-3 text-sm text-white">{name}</div>
              <div className="text-xs text-slate mt-1 group-hover:text-[var(--volt)]">Enter →</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FOR EACH SIDE                                                       */
/* ------------------------------------------------------------------ */
function ForEachSide() {
  const blocks = [
    {
      tag: "For clients",
      color: "cobalt",
      title: "Stop guessing. See three pitches.",
      points: [
        "Hand-pick from up to 10 applicants",
        "Pay only one winner — no retainers",
        "Tight 2 hr – 5 day windows keep momentum",
        "Bounty held in Stripe escrow until you choose",
      ],
      cta: { to: "/post", label: "Post a brief" },
    },
    {
      tag: "For freelancers",
      color: "volt",
      title: "Win on craft, not the lowest bid.",
      points: [
        "Pitch with your portfolio, not your price",
        "Approved? Compete head-to-head with two others",
        "Build wins, ratings, and a public profile",
        "No hidden fees, no proposal credits",
      ],
      cta: { to: "/register", label: "Join Rivaloz" },
    },
  ];
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-10 py-24 grid grid-cols-1 md:grid-cols-2 gap-6">
      {blocks.map((b) => (
        <div key={b.tag} className="card p-8">
          <span className={`pill ${b.color === "volt" ? "pill-volt" : "pill-cobalt"}`}>{b.tag}</span>
          <h3 className="font-display text-3xl lg:text-4xl mt-5 text-graphite leading-tight">{b.title}</h3>
          <ul className="mt-6 space-y-2.5">
            {b.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-graphite/85">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                  style={{ background: b.color === "volt" ? "var(--volt)" : "var(--cobalt)" }}
                />
                <span className="text-sm leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
          <Link
            to={b.cta.to}
            className={`mt-8 inline-flex items-center gap-2 text-sm ${b.color === "volt" ? "btn-volt" : "btn-primary"}`}
            data-testid={`cta-${b.tag.replace(/\s+/g, "-").toLowerCase()}`}
          >
            {b.cta.label} <ArrowRight size={14} />
          </Link>
        </div>
      ))}
    </section>
  );
}
