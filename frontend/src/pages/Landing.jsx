import { Link } from "react-router-dom";
import { Trophy, Zap, Shield, Sparkles, ArrowRight, Brush, Code2, PenTool, Camera, BarChart3, Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../lib/api";

const HERO_BG = "https://images.pexels.com/photos/5506217/pexels-photo-5506217.jpeg";
const CATS = [
  { name: "Graphic Design", icon: Brush },
  { name: "Web Development", icon: Code2 },
  { name: "Writing & Translation", icon: PenTool },
  { name: "Video & Animation", icon: Camera },
  { name: "Marketing & SEO", icon: Megaphone },
  { name: "Data & Analytics", icon: BarChart3 },
];

export default function Landing() {
  const [stats, setStats] = useState({ open_projects: 0, completed: 0, users: 0 });
  useEffect(() => { api.get("/stats").then((r) => setStats(r.data)).catch(() => {}); }, []);

  return (
    <div className="relative">
      {/* HERO */}
      <section className="relative overflow-hidden grain">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050614]/40 via-[#050614]/70 to-[#050614]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-24 md:pt-32 pb-32">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-8 reveal">
              <span className="pill" data-testid="hero-pill">A competitive marketplace</span>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-[0.95] mt-6">
                Don't just bid.<br />
                <span className="text-[#D4AF37]">Out-design</span> them all.
              </h1>
              <p className="mt-8 text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed">
                Clients post a brief. Up to ten freelancers throw their hat in the ring.
                Three get the gold ticket — and only one walks away with the bounty. Welcome to the arena.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link to="/register" className="bg-[#D4AF37] text-black px-8 py-4 font-semibold hover:bg-[#F3E5AB] transition-colors inline-flex items-center gap-2" data-testid="hero-join-btn">
                  Enter the arena <ArrowRight size={18} />
                </Link>
                <Link to="/browse" className="border border-white/20 px-8 py-4 hover:bg-white/5 transition-colors" data-testid="hero-browse-btn">Browse open briefs</Link>
              </div>
            </div>
            <div className="md:col-span-4 reveal" style={{ animationDelay: "0.15s" }}>
              <div className="bg-[#0A0C22] border border-[#D4AF37]/30 p-6 tracing-beam relative">
                <div className="text-xs tracking-[0.2em] text-[#D4AF37] uppercase">Live arena</div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <Stat label="Open" value={stats.open_projects} />
                  <Stat label="Won" value={stats.completed} />
                  <Stat label="Talent" value={stats.users} />
                </div>
                <div className="mt-6 text-sm text-slate-400">A new brief posts every few hours. Freelancers, refresh fast.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative max-w-7xl mx-auto px-6 md:px-10 py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-4">
            <span className="pill">The Ritual</span>
            <h2 className="font-display text-4xl lg:text-5xl mt-6 leading-tight">Four steps. One winner.</h2>
            <p className="mt-4 text-slate-400">Built so clients see proven work before they pay — and freelancers compete on merit, not the lowest bid.</p>
          </div>
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { n: "01", t: "Brief", d: "A business owner posts the project, sets a bounty (2 hr – 5 day window), and funds it." },
              { n: "02", t: "Applications", d: "Up to ten freelancers pitch with their portfolio and angle. Free to apply." },
              { n: "03", t: "Approval", d: "The client picks three. Approved competitors are notified by email instantly." },
              { n: "04", t: "Showdown", d: "Approved talent submits work before the timer ends. Client picks the winner. Bounty released." },
            ].map((s, i) => (
              <div key={s.n} className="bg-[#0A0C22] border border-white/10 p-7 hover:-translate-y-1 hover:border-[#D4AF37]/40 transition-all" style={{ animationDelay: `${i * 0.1}s` }} data-testid={`step-${s.n}`}>
                <div className="font-mono text-[#D4AF37] text-sm">{s.n}</div>
                <div className="font-display text-2xl mt-3">{s.t}</div>
                <div className="text-slate-400 mt-2 text-sm leading-relaxed">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="relative bg-[#0A0C22] border-y border-white/10 py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="pill">Disciplines</span>
              <h2 className="font-display text-4xl lg:text-5xl mt-6">Every craft has its arena.</h2>
            </div>
            <Link to="/browse" className="text-[#D4AF37] hover:underline text-sm tracking-wide">Browse all briefs →</Link>
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATS.map(({ name, icon: I }, i) => (
              <Link key={name} to={`/browse?category=${encodeURIComponent(name)}`} className="group bg-[#050614] border border-white/10 hover:border-[#D4AF37]/40 p-6 transition-all" data-testid={`category-${i}`}>
                <I className="text-[#D4AF37]" size={26} />
                <div className="mt-4 text-sm">{name}</div>
                <div className="text-xs text-slate-500 mt-1 group-hover:text-slate-300">Enter →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FOR EACH SIDE */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-24 grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { tag: "For clients", title: "Stop guessing. See three pitches.", points: ["Hand-pick from up to 10 applicants", "Pay only one winner — no retainers", "Tight 2 hr–5 day windows keep momentum", "Bounty held in Stripe escrow until you choose"], cta: { to: "/post", label: "Post a brief" }, color: "#D4AF37" },
          { tag: "For freelancers", title: "Win on craft, not the lowest bid.", points: ["Pitch with your portfolio, not your price", "Approved? Compete head-to-head with two others", "Build wins, ratings, and a public profile", "No hidden fees, no proposal credits"], cta: { to: "/register", label: "Join the arena" }, color: "#8B5CF6" },
        ].map((b) => (
          <div key={b.tag} className="bg-[#0A0C22] border border-white/10 p-10 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full" style={{ background: `radial-gradient(circle, ${b.color}33, transparent 70%)` }} />
            <div className="relative">
              <span className="pill" style={{ color: b.color }}>{b.tag}</span>
              <h3 className="font-display text-3xl lg:text-4xl mt-6">{b.title}</h3>
              <ul className="mt-6 space-y-3">
                {b.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-slate-300">
                    <Sparkles size={16} className="text-[#D4AF37] mt-1 shrink-0" /><span>{p}</span>
                  </li>
                ))}
              </ul>
              <Link to={b.cta.to} className="mt-8 inline-flex items-center gap-2 border border-white/20 hover:border-[#D4AF37] hover:text-[#D4AF37] px-6 py-3 text-sm transition-colors" data-testid={`cta-${b.tag.replace(/\s+/g, '-').toLowerCase()}`}>
                {b.cta.label} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2"><Trophy size={16} className="text-[#D4AF37]" /> <span>ArenaBid · the competitive marketplace</span></div>
          <div className="flex gap-6">
            <span className="inline-flex items-center gap-2"><Shield size={14} /> Stripe escrow</span>
            <span className="inline-flex items-center gap-2"><Zap size={14} /> Real-time briefs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <div className="font-mono text-3xl text-[#D4AF37]">{value}</div>
      <div className="text-[10px] tracking-widest text-slate-400 uppercase mt-1">{label}</div>
    </div>
  );
}
