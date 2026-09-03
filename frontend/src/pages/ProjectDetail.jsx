import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import Countdown from "../components/Countdown";
import { ArrowLeft, DollarSign, Clock, Users, CheckCircle2, Timer } from "lucide-react";
import ApplyCard from "../components/project/ApplyCard";
import ApplicantsPanel from "../components/project/ApplicantsPanel";
import SubmissionsPanel from "../components/project/SubmissionsPanel";
import WinnerPanel from "../components/project/WinnerPanel";
import BattleView from "../components/project/BattleView";

const STATUS_MAP = {
  draft: { color: "var(--slate)", label: "Draft", pill: "" },
  open: { color: "var(--cobalt)", label: "Open · accepting", pill: "pill-cobalt" },
  in_progress: { color: "var(--ember)", label: "Live competition", pill: "pill-ember" },
  completed: { color: "var(--volt-ink)", label: "Completed", pill: "pill-volt" },
};

const APP_STATUS_LABEL = {
  pending: "Pending review",
  approved: "Approved — you're in!",
  rejected: "Not selected",
};

export default function ProjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [applications, setApplications] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const { data: p } = await api.get(`/projects/${id}`);
      setProject(p);
      if (user && user !== false) {
        if (p.client_id === user.id) {
          try {
            setApplications((await api.get(`/projects/${id}/applications`)).data);
          } catch (_) { /* empty section rendered */ }
        }
        if (p.client_id === user.id || p.approved_freelancer_ids?.includes(user.id)) {
          try {
            setSubmissions((await api.get(`/projects/${id}/submissions`)).data);
          } catch (_) { /* empty */ }
        }
      }
    } catch (e) {
      setErr(formatApiError(e));
    }
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  if (err) return <Page><div className="text-ember">{err}</div></Page>;
  if (!project) return <Page><div className="text-slate">Loading…</div></Page>;

  const isAnon = !user || user === false;
  const isClient = !isAnon && project.client_id === user.id;
  const isCompetitor = !isAnon && project.approved_freelancer_ids?.includes(user.id);
  const myApp = applications.find((a) => a.user_id === user?.id);
  const canApply = !isAnon && !isClient && project.status === "open";
  const showSubmissions = project.status === "in_progress" && (isClient || isCompetitor);

  return (
    <Page>
      <Link
        to="/browse"
        className="text-slate hover:text-white text-sm inline-flex items-center gap-1.5"
        data-testid="back-to-browse"
      >
        <ArrowLeft size={14} /> Back to briefs
      </Link>

      {/* Live scoreboard bar — makes this feel like an arena, not a settings page */}
      <div className="scoreboard mt-6" data-testid="detail-scoreboard">
        <ScoreCell label="Stage" value={STATUS_MAP[project.status]?.label || project.status} tone={statusTone(project.status)} isText />
        <div className="scoreboard-divider" />
        <ScoreCell label="Bounty" value={`$${project.budget}`} />
        <div className="scoreboard-divider" />
        <ScoreCell label="Seats" value={project.max_competitors} />
        <div className="scoreboard-divider" />
        <ScoreCell label="Window" value={`${project.duration_hours}h`} />
        {project.status === "in_progress" && project.competition_deadline && (
          <>
            <div className="scoreboard-divider" />
            <div className="scoreboard-cell">
              <span className="scoreboard-label inline-flex items-center gap-1">
                <Timer size={11} /> Time left
              </span>
              <Countdown deadline={project.competition_deadline} />
            </div>
          </>
        )}
      </div>

      {/* Battle View for live/completed competitions */}
      {(project.status === "in_progress" || project.status === "completed") && (
        <BattleView
          project={project}
          applications={applications}
          submissions={submissions}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <HeaderCard project={project} />
          {showSubmissions && (
            <SubmissionsPanel project={project} submissions={submissions} isClient={isClient} reload={load} />
          )}
          {project.status === "completed" && (
            <WinnerPanel project={project} submissions={submissions} />
          )}
        </div>

        <div className="space-y-6">
          {canApply && !myApp && <ApplyCard projectId={project.id} onApplied={load} />}

          {myApp && <MyApplicationCard application={myApp} />}

          {isAnon && project.status === "open" && (
            <div className="card p-6">
              <p className="text-graphite">Want to compete?</p>
              <button
                onClick={() => nav("/login", { state: { from: `/projects/${project.id}` } })}
                className="btn-primary w-full mt-4"
                data-testid="detail-login-cta"
              >
                Log in to apply
              </button>
            </div>
          )}

          {isClient && project.status === "open" && (
            <ApplicantsPanel
              projectId={project.id}
              applications={applications}
              maxApprove={project.max_competitors}
              reload={load}
            />
          )}

          {isClient && project.status === "in_progress" && (
            <ApprovedSeats applications={applications} />
          )}
        </div>
      </div>
    </Page>
  );
}

function Page({ children }) {
  return (
    <div className="shell">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">{children}</div>
    </div>
  );
}

function statusTone(s) {
  return { open: "cobalt", in_progress: "ember", completed: "volt" }[s] || "";
}

function ScoreCell({ label, value, tone, isText }) {
  return (
    <div className="scoreboard-cell">
      <span className="scoreboard-label">{label}</span>
      <span className={`scoreboard-value ${tone || ""}`} style={isText ? { fontSize: 14 } : undefined}>
        {value}
      </span>
    </div>
  );
}

function HeaderCard({ project }) {
  return (
    <div className="card p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs tracking-widest text-[var(--cobalt)] uppercase font-mono">{project.category}</div>
          <h1 className="font-display text-4xl mt-2 leading-tight text-graphite">{project.title}</h1>
          <div className="text-sm text-slate mt-2">Posted by {project.client_name || "Anonymous"}</div>
        </div>
        <span className={`pill ${STATUS_MAP[project.status]?.pill || ""}`} data-testid={`project-status-${project.status}`}>
          {STATUS_MAP[project.status]?.label || project.status}
        </span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
        <Meta icon={DollarSign} label="Bounty" value={`$${project.budget.toFixed(0)}`} />
        <Meta icon={Clock} label="Window" value={`${project.duration_hours}h`} />
        <Meta icon={Users} label="Seats" value={project.max_competitors} />
      </div>
      <div className="mt-8 text-graphite/85 leading-relaxed whitespace-pre-wrap">{project.description}</div>
      {project.deliverables && (
        <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--hairline)" }}>
          <div className="text-xs tracking-widest text-slate uppercase font-mono mb-2">Deliverables</div>
          <div className="text-graphite/85 whitespace-pre-wrap text-sm leading-relaxed">{project.deliverables}</div>
        </div>
      )}
    </div>
  );
}

function Meta({ icon: I, label, value }) {
  return (
    <div className="rounded-lg p-3 canvas-2">
      <I size={14} className="text-slate" />
      <div className="font-mono text-xl mt-1 text-graphite">{value}</div>
      <div className="text-[10px] tracking-widest text-slate uppercase mt-1">{label}</div>
    </div>
  );
}

function MyApplicationCard({ application }) {
  return (
    <div className="card p-6">
      <div className="text-xs tracking-widest uppercase text-slate font-mono">Your application</div>
      <div className="mt-3 font-display text-xl text-graphite">{APP_STATUS_LABEL[application.status] || application.status}</div>
      <div className="mt-2 text-sm text-slate leading-relaxed">&ldquo;{application.pitch}&rdquo;</div>
    </div>
  );
}

function ApprovedSeats({ applications }) {
  const approved = applications.filter((a) => a.status === "approved");
  return (
    <div className="card p-6 text-sm text-graphite">
      <div className="text-xs tracking-widest uppercase text-slate font-mono mb-3">Approved seats</div>
      <div className="space-y-2">
        {approved.length === 0 && <div className="text-slate">No approved competitors yet.</div>}
        {approved.map((a) => (
          <div key={a.id} className="flex items-center gap-2">
            <CheckCircle2 size={14} style={{ color: "var(--cobalt)" }} /> {a.user_name}
          </div>
        ))}
      </div>
    </div>
  );
}
