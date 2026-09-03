import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { ProjectCard } from "./Browse";
import Countdown from "../components/Countdown";
import { Trophy, PlusCircle, Briefcase, Compass, Sparkles, Timer } from "lucide-react";

const STATUS_STYLE = {
  approved: { color: "var(--volt-ink)", bg: "var(--volt)" },
  rejected: { color: "#fff", bg: "var(--ember)" },
  pending: { color: "var(--graphite)", bg: "var(--canvas-2)" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [myProjects, setMyProjects] = useState([]);
  const [comps, setComps] = useState([]);
  const [tab, setTab] = useState("client");

  useEffect(() => {
    api.get("/projects", { params: { mine: true } })
      .then((r) => setMyProjects(r.data)).catch(() => setMyProjects([]));
    api.get("/dashboard/freelancer")
      .then((r) => setComps(r.data.competitions || [])).catch(() => setComps([]));
  }, []);

  if (!user || user === false) return null;

  const openCount = myProjects.filter((p) => p.status === "open").length;
  const liveCount = myProjects.filter((p) => p.status === "in_progress").length;
  const wonCount = comps.filter(({ application, project }) =>
    project.status === "completed" && project.winner_user_id === application.user_id
  ).length;

  return (
    <div className="shell">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        {/* Scoreboard header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="pill pill-cobalt font-mono">Console</span>
            <h1 className="font-display text-4xl lg:text-5xl mt-3 text-white">
              {user.name}
            </h1>
            <p className="text-slate mt-1 text-sm">{user.email}</p>
          </div>
          <Link to="/post" className="btn-primary inline-flex items-center gap-2" data-testid="dashboard-post-btn">
            <PlusCircle size={16} /> Post a brief
          </Link>
        </div>

        {/* Persistent scoreboard bar */}
        <div className="scoreboard mt-6" data-testid="scoreboard">
          <ScoreCell label="Trust" value={user.trust_points || 0} tone="cobalt" icon={Sparkles} />
          <div className="scoreboard-divider" />
          <ScoreCell label="Wins" value={user.wins || 0} tone="volt" icon={Trophy} />
          <div className="scoreboard-divider" />
          <ScoreCell label="Open briefs" value={openCount} icon={Briefcase} />
          <div className="scoreboard-divider" />
          <ScoreCell label="Live now" value={liveCount} tone="ember" icon={Timer} />
          <div className="scoreboard-divider" />
          <ScoreCell label="Competitions" value={comps.length} icon={Compass} />
        </div>

        {/* Tabs */}
        <div className="mt-10 flex gap-2" style={{ borderBottom: "1px solid var(--shell-hairline)" }} data-testid="dashboard-tabs">
          {[
            { id: "client", label: "As Client", count: myProjects.length },
            { id: "freelancer", label: "As Freelancer", count: comps.length },
          ].map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="pb-3 px-4 text-sm inline-flex items-center gap-2 transition-colors"
                style={{
                  color: on ? "#fff" : "var(--slate)",
                  borderBottom: on ? "2px solid var(--cobalt)" : "2px solid transparent",
                }}
                data-testid={`dashboard-tab-${t.id}`}
              >
                {t.label}
                <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{
                  background: on ? "rgba(61,76,255,0.18)" : "rgba(255,255,255,0.06)",
                  color: on ? "#B8C0FF" : "var(--slate)",
                }}>{t.count}</span>
              </button>
            );
          })}
        </div>

        {tab === "client" && (
          <div className="mt-8">
            {myProjects.length === 0 ? (
              <EmptyShellState
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
              <EmptyShellState
                icon={Trophy}
                title="No competitions yet"
                copy="Browse open briefs and pitch your first competition."
                cta={{ to: "/browse", label: "Browse open briefs" }}
                testid="freelancer-empty"
              />
            ) : (
              <>
                {wonCount > 0 && (
                  <div className="chip chip-volt inline-flex items-center gap-1.5">
                    <Trophy size={12} /> {wonCount} win{wonCount === 1 ? "" : "s"} to your name
                  </div>
                )}
                {comps.map(({ application, project }) => (
                  <CompetitionRow key={application.id} application={application} project={project} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreCell({ label, value, tone, icon: I }) {
  return (
    <div className="scoreboard-cell">
      <div className="flex items-center gap-1.5">
        {I && <I size={11} className="text-slate" />}
        <span className="scoreboard-label">{label}</span>
      </div>
      <span className={`scoreboard-value ${tone || ""}`}>{String(value).padStart(2, "0")}</span>
    </div>
  );
}

function EmptyShellState({ icon: I, title, copy, cta, testid }) {
  return (
    <div className="shell-card text-center py-16 px-6" data-testid={testid}>
      <I className="text-white/70 mx-auto" size={30} />
      <div className="font-display text-2xl mt-4 text-white">{title}</div>
      <p className="text-slate mt-2 text-sm max-w-md mx-auto">{copy}</p>
      <Link to={cta.to} className="btn-primary inline-block mt-6">{cta.label}</Link>
    </div>
  );
}

function CompetitionRow({ application, project }) {
  const isWinner = project.status === "completed" && project.winner_user_id === application.user_id;
  const showCountdown = application.status === "approved" && project.competition_deadline && project.status === "in_progress";
  const s = STATUS_STYLE[application.status] || {};
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block card p-6"
      data-testid={`comp-${application.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs tracking-widest uppercase text-[var(--cobalt)] font-mono">{project.category}</div>
          <div className="font-display text-2xl mt-2 leading-tight text-graphite">{project.title}</div>
          <div className="text-sm text-slate mt-1 flex items-center gap-3 flex-wrap">
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{ background: s.bg, color: s.color }}
            >
              {application.status}
            </span>
            <span>Bounty <span className="font-mono text-graphite">${project.budget}</span></span>
          </div>
        </div>
        {showCountdown && <Countdown deadline={project.competition_deadline} variant="canvas" />}
        {isWinner && (
          <div className="chip chip-volt inline-flex items-center gap-2">
            <Trophy size={14} /> You won this
          </div>
        )}
      </div>
    </Link>
  );
}
