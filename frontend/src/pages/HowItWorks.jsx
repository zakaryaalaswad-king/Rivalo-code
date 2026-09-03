import { Link } from "react-router-dom";
import { ArrowRight, FileText, Users, Trophy, CreditCard } from "lucide-react";

const STEPS = [
  {
    icon: FileText,
    t: "Clients post a brief",
    d: "Title, brief, category, bounty (USD), and a window (2 hours to 5 days). The bounty is captured upfront in Stripe escrow so freelancers know the gig is real.",
  },
  {
    icon: Users,
    t: "Up to 10 freelancers apply",
    d: "Each applicant sends a short pitch and (optionally) a portfolio link. Applying is free. No bidding wars on price.",
  },
  {
    icon: Trophy,
    t: "Client approves up to 3",
    d: "Approved competitors are notified instantly by email. The countdown starts. Everyone else gets a polite rejection.",
  },
  {
    icon: CreditCard,
    t: "Winner takes the bounty",
    d: "Approved freelancers submit work before the timer ends. The client crowns one winner. Funds release. Reputation builds.",
  },
];

export default function HowItWorks() {
  return (
    <div className="shell">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-16">
        <span className="pill pill-cobalt">The Ritual</span>
        <h1 className="font-display text-5xl lg:text-6xl mt-6 text-white">How the arena works.</h1>
        <p className="text-slate mt-4 max-w-2xl text-lg">
          A focused, time-boxed competitive marketplace — designed to reward craft and respect
          everyone's time.
        </p>

        <div className="mt-14 space-y-6">
          {STEPS.map(({ icon: I, t, d }, i) => (
            <div key={t} className="card p-6 md:p-8 grid grid-cols-12 gap-4 md:gap-6 items-start">
              <div className="col-span-12 md:col-span-2 font-mono text-[var(--cobalt)] text-3xl">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="col-span-12 md:col-span-10">
                <div className="flex items-center gap-3">
                  <I className="text-[var(--cobalt)]" size={20} />
                  <h2 className="font-display text-2xl md:text-3xl text-graphite">{t}</h2>
                </div>
                <p className="mt-3 text-graphite/80 leading-relaxed">{d}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap gap-3">
          <Link to="/post" className="btn-primary inline-flex items-center gap-2">
            Post your first brief <ArrowRight size={16} />
          </Link>
          <Link to="/browse" className="btn-ghost text-white">
            Browse open briefs
          </Link>
        </div>
      </div>
    </div>
  );
}
