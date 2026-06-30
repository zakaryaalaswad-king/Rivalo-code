import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { ProjectCard } from "./Browse";
import Countdown from "../components/Countdown";
import { Trophy, PlusCircle, Briefcase, Compass, Sparkles } from "lucide-react";

const STATUS_COLORS = {
  approved: "text-[#22C55E]",
  rejected: "text-red-400",
  pending: "text-amber-300",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [myProjects, setMyProjects] = useState([]);
  const [comps, setComps] = useState([]);
  const [tab, setTab] = useState("client");

  useEffect(() => {
    api.get("/projects", { params: { mine: true } })
      .then((r) => setMyProjects(r.data))
      .catch(() => setMyProjects([]));
    api.get("/dashboard/freelancer")
      .then((r) => setComps(r.data.competitions || []))
      .catch(() => setComps([]));
  }, []);

  if (!user || user === false) return null;

  const openCount = myProjects.filter((p) => p.status === "open").length;
  const liveCount = myProjects.filter((p) => p.status === "in_progress").length;
  const wonCount = comps.filter(({ application, project }) =>
    project.status === "completed" && project.winner_user_id === application.user_id
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <span className="pill">Your console</span>
          <h1 className="font-display text-4xl lg:text-5xl mt-4 tracking-tight">
            Welcome, <span className="bg-gradient-to-r from-[#3B82F6] to-[#22C55E] bg-clip-text text-transparent">{user.name}</span>
          </h1>
          <p className="text-muted mt-2 text-sm">{user.email}</p>
        </div>
        <Link to="/post" className="btn-primary inline-flex items-center gap-2" data-testid="dashboard-post-btn">
          <PlusCircle size={16} /> Post a brief
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Trust points" value={user.trust_points || 0} accent="#3B82F6" icon={Sparkles} />
        <StatCard label="Wins" value={user.wins || 0} accent="#22C55E" icon={Trophy} />
        <StatCard label="Open briefs" value={openCount} accent="#A855F7" icon={Briefcase} />
        <StatCard label="Live now" value={liveCount} accent="#F59E0B" icon={Compass} />
      </div>

      {/* Tabs */}
      <div className="mt-10 border-b border-white/10 flex gap-2" data-testid="dashboard-tabs">
        {[
          { id: "client", label: `As Client`, count: myProjects.length },
          { id: "freelancer", label: `As Freelancer`, count: comps.length },
        ].map((t) => {
          const isOn = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-3 px-4 text-sm tracking-wide inline-flex items-center gap-2 transition-colors ${
                isOn ? "text-[#3B82F6] border-b-2 border-[#3B82F6]" : "text-muted hover:text-white border-b-2 border-transparent"
              }`}
              data-testid={`dashboard-tab-${t.id}`}
            >
              {t.label}
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${isOn ? "bg-[#3B82F6]/15 text-[#93C5FD]" : "bg-white/5 text-muted"}`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {tab === "client" && (
        <div className="mt-8">
          {myProjects.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No briefs yet"
              copy="Post your first brief and watch talent line up."
              cta={{ to: "/post", label: "Post a brief" }}
              testid="client-empty"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProjects.map((p) => <ProjectCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      )}

      {tab === "freelancer" && (
        <div className="mt-8 space-y-4">
          {comps.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No competitions yet"
              copy="Browse open briefs and pitch your first competition."
              cta={{ to: "/browse", label: "Browse open briefs" }}
              testid="freelancer-empty"
            />
          ) : (
            <>
              {wonCount > 0 && (
                <div className="text-xs text-muted">You've won {wonCount} competition{wonCount === 1 ? "" : "s"}. Keep going.</div>
              )}
              {comps.map(({ application, project }) => (
                <CompetitionRow key={application.id} application={application} project={project} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent, icon: I }) {
  return (
    <div className="card p-5 relative overflow-hidden">
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${accent}22, transparent 70%)`, filter: "blur(10px)" }} />
      <I size={16} style={{ color: accent }} />
      <div className="font-mono text-3xl mt-3" style={{ color: accent }}>{value}</div>
      <div className="text-[10px] tracking-widest uppercase text-muted mt-1">{label}</div>
    </div>
  );
}

function EmptyState({ icon: I, title, copy, cta, testid }) {
  return (
    <div className="card text-center py-16 px-6" data-testid={testid}>
      <I className="text-[#3B82F6] mx-auto" size={32} />
      <div className="font-display text-2xl mt-4">{title}</div>
      <p className="text-muted mt-2 text-sm max-w-md mx-auto">{copy}</p>
      <Link to={cta.to} className="btn-primary inline-block mt-6">{cta.label}</Link>
    </div>
  );
}

function CompetitionRow({ application, project }) {
  const isWinner = project.status === "completed" && project.winner_user_id === application.user_id;
  const showCountdown = application.status === "approved" && project.competition_deadline && project.status === "in_progress";
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block card p-6 transition-all hover:-translate-y-0.5"
      data-testid={`comp-${application.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs tracking-widest text-[#3B82F6] uppercase">{project.category}</div>
          <div className="font-display text-2xl mt-2 leading-tight">{project.title}</div>
          <div className="text-sm text-muted mt-1">
            Status: <span className={STATUS_COLORS[application.status] || "text-slate-300"}>{application.status}</span>
            <span className="mx-2 opacity-40">·</span>
            Bounty <span className="font-mono text-slate-200">${project.budget}</span>
          </div>
        </div>
        {showCountdown && <Countdown deadline={project.competition_deadline} />}
        {isWinner && (
          <div className="inline-flex items-center gap-2 text-[#22C55E] font-medium">
            <Trophy size={16} /> You won this
          </div>
        )}
      </div>
    </Link>
  );
}
