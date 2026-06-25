import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Zap, Shield, Sparkles, ArrowRight, Brush, Code2, PenTool, Camera, BarChart3, Megaphone, Music2, Boxes } from "lucide-react";
import api from "../lib/api";
import { Reveal } from "../lib/reveal";
import Logo from "../components/Logo";

const HERO_BG = "https://images.pexels.com/photos/5506217/pexels-photo-5506217.jpeg";
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
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => { api.get("/stats").then((r) => setStats(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative">
      {/* HERO */}
      <section className="relative overflow-hidden grain">
        <div className="absolute inset-0" style={{ transform: `translateY(${scrollY * 0.18}px)` }}>
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050614]/40 via-[#050614]/70 to-[#050614]" />
        </div>
        {/* floating neon orbs */}
        <div className="absolute top-20 right-[10%] w-32 h-32 rounded-full float-slow" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.55), transparent 70%)", filter: "blur(20px)", transform: `translateY(${scrollY * -0.08}px)` }} />
        <div className="absolute bottom-32 left-[5%] w-40 h-40 rounded-full float-slow" style={{ background: "radial-gradient(circle, rgba(212,175,55,0.5), transparent 70%)", filter: "blur(24px)", animationDelay: "2s", transform: `translateY(${scrollY * -0.12}px)` }} />

        <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-24 md:pt-32 pb-32">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-8">
              <Reveal><span className="pill" data-testid="hero-pill">Rivalry · Rewarded</span></Reveal>
              <Reveal delay={120}>
                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-[0.95] mt-6 neon-text">
                  Two rivals enter.<br />
                  <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#A855F7] bg-clip-text text-transparent">One walks away gold.</span>
                </h1>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-8 text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed">
                  Rivalo is the competitive marketplace for freelancers. Clients post a brief.
                  Up to ten freelancers pitch. Three are crowned to compete head-to-head — only one takes the bounty.
                </p>
              </Reveal>
              <Reveal delay={360}>
                <div className="mt-10 flex flex-wrap gap-3">
                  <Link to="/register" className="cta-neon px-8 py-4 inline-flex items-center gap-2" data-testid="hero-join-btn">
                    Enter Rivalo <ArrowRight size={18} />
                  </Link>
                  <Link to="/browse" className="border border-white/20 px-8 py-4 hover:bg-white/5 hover:border-[#A855F7]/60 transition-colors" data-testid="hero-browse-btn">Browse open briefs</Link>
                </div>
              </Reveal>
            </div>
            <Reveal delay={480} className="md:col-span-4">
              <div className="bg-[#0A0C22]/80 backdrop-blur-md border border-[#D4AF37]/30 p-6 tracing-beam relative neon-gold-glow">
                <div className="text-xs tracking-[0.2em] text-[#D4AF37] uppercase">Live arena</div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <Stat label="Open" value={stats.open_projects} />
                  <Stat label="Won" value={stats.completed} />
                  <Stat label="Talent" value={stats.users} />
                </div>
                <div className="mt-6 text-sm text-slate-400">A new brief posts every few hours. Freelancers, refresh fast.</div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* marquee strip */}
        <div className="relative border-y border-white/5 bg-[#050614]/40 backdrop-blur py-5 overflow-hidden">
          <div className="marquee text-slate-500 text-sm tracking-[0.3em] uppercase">
            {[...Array(2)].map((_, k) => (
              <div key={k} className="flex gap-12">
                {["Branding", "Web Apps", "Motion", "Mobile", "Copy", "3D", "SEO", "Pitch Decks", "AI/ML", "Music"].map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-3">
                    <Sparkles size={12} className="text-[#D4AF37]" /> {c}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative max-w-7xl mx-auto px-6 md:px-10 py-28">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-4">
            <Reveal><span className="pill">The Ritual</span></Reveal>
            <Reveal delay={120}><h2 className="font-display text-4xl lg:text-5xl mt-6 leading-tight">Four steps. <span className="text-[#A855F7]">One</span> winner.</h2></Reveal>
            <Reveal delay={240}><p className="mt-4 text-slate-400">Clients see proven work before they pay. Freelancers compete on merit, not the lowest bid.</p></Reveal>
          </div>
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { n: "01", t: "Brief", d: "A business owner posts the project, sets a bounty (2 hr – 5 day window), funds it via Stripe escrow." },
              { n: "02", t: "Applications", d: "Up to ten freelancers pitch with their portfolio and angle. Free to apply." },
              { n: "03", t: "Approval", d: "The client picks three. Approved competitors are notified by email instantly." },
              { n: "04", t: "Showdown", d: "Approved talent submits work before the timer ends. Client picks the winner. Bounty released." },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="bg-[#0A0C22] border border-white/10 p-7 hover:-translate-y-1 hover:border-[#D4AF37]/40 hover:neon-gold-glow transition-all" data-testid={`step-${s.n}`}>
                  <div className="font-mono text-[#D4AF37] text-sm">{s.n}</div>
                  <div className="font-display text-2xl mt-3">{s.t}</div>
                  <div className="text-slate-400 mt-2 text-sm leading-relaxed">{s.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="relative bg-[#0A0C22]/60 backdrop-blur border-y border-white/10 py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Reveal><span className="pill">Disciplines</span></Reveal>
              <Reveal delay={120}><h2 className="font-display text-4xl lg:text-5xl mt-6">Every craft has its <span className="text-[#D4AF37] italic">arena</span>.</h2></Reveal>
            </div>
            <Link to="/browse" className="text-[#D4AF37] hover:underline text-sm tracking-wide">Browse all briefs →</Link>
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATS.map(({ name, icon: I }, i) => (
              <Reveal key={name} delay={i * 60}>
                <Link to={`/browse?category=${encodeURIComponent(name)}`} className="group block bg-[#050614]/80 border border-white/10 hover:border-[#A855F7]/60 hover:neon-purple-glow p-6 transition-all" data-testid={`category-${i}`}>
                  <I className="text-[#D4AF37] group-hover:text-[#F3E5AB]" size={26} />
                  <div className="mt-4 text-sm">{name}</div>
                  <div className="text-xs text-slate-500 mt-1 group-hover:text-[#A855F7]">Enter →</div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FOR EACH SIDE */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-28 grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { tag: "For clients", title: "Stop guessing. See three pitches.", points: ["Hand-pick from up to 10 applicants", "Pay only one winner — no retainers", "Tight 2 hr–5 day windows keep momentum", "Bounty held in Stripe escrow until you choose"], cta: { to: "/post", label: "Post a brief" }, color: "#D4AF37" },
          { tag: "For freelancers", title: "Win on craft, not the lowest bid.", points: ["Pitch with your portfolio, not your price", "Approved? Compete head-to-head with two others", "Build wins, ratings, and a public profile", "No hidden fees, no proposal credits"], cta: { to: "/register", label: "Join Rivalo" }, color: "#A855F7" },
        ].map((b, i) => (
          <Reveal key={b.tag} delay={i * 150}>
            <div className="bg-[#0A0C22] border border-white/10 p-10 relative overflow-hidden h-full">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full" style={{ background: `radial-gradient(circle, ${b.color}44, transparent 70%)`, filter: "blur(10px)" }} />
              <div className="relative">
                <span className="pill" style={{ color: b.color, borderColor: `${b.color}55`, background: `${b.color}10` }}>{b.tag}</span>
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
          </Reveal>
        ))}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2.5"><Logo size={20} /> <span className="font-display text-lg text-slate-300">Rivalo</span> <span>· the competitive marketplace</span></div>
          <div className="flex gap-6">
            <span className="inline-flex items-center gap-2"><Shield size={14} className="text-[#D4AF37]" /> Stripe escrow</span>
            <span className="inline-flex items-center gap-2"><Zap size={14} className="text-[#A855F7]" /> Real-time briefs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <div className="font-mono text-3xl text-[#D4AF37] neon-text">{value}</div>
      <div className="text-[10px] tracking-widest text-slate-400 uppercase mt-1">{label}</div>
    </div>
  );
}
