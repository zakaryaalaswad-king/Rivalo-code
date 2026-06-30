import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import Countdown from "../components/Countdown";
import { ArrowLeft, DollarSign, Clock, Users, CheckCircle2 } from "lucide-react";
import ApplyCard from "../components/project/ApplyCard";
import ApplicantsPanel from "../components/project/ApplicantsPanel";
import SubmissionsPanel from "../components/project/SubmissionsPanel";
import WinnerPanel from "../components/project/WinnerPanel";

const STATUS_MAP = {
  draft: { color: "#94A3B8", label: "Draft" },
  open: { color: "#3B82F6", label: "Open · accepting" },
  in_progress: { color: "#A855F7", label: "Live competition" },
  completed: { color: "#22C55E", label: "Completed" },
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
          } catch (_) { /* ignore — UI shows the section even if empty */ }
        }
        if (p.client_id === user.id || p.approved_freelancer_ids?.includes(user.id)) {
          try {
            setSubmissions((await api.get(`/projects/${id}/submissions`)).data);
          } catch (_) { /* ignore */ }
        }
      }
    } catch (e) {
      setErr(formatApiError(e));
    }
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  if (err) return <Page><div className="text-red-400">{err}</div></Page>;
  if (!project) return <Page><div className="text-muted">Loading…</div></Page>;

  const isAnon = !user || user === false;
  const isClient = !isAnon && project.client_id === user.id;
  const isCompetitor = !isAnon && project.approved_freelancer_ids?.includes(user.id);
  const myApp = applications.find((a) => a.user_id === user?.id);
  const canApply = !isAnon && !isClient && project.status === "open";
  const showSubmissions = project.status === "in_progress" && (isClient || isCompetitor);

  return (
    <Page>
      <Link to="/browse" className="text-muted hover:text-white text-sm inline-flex items-center gap-1.5 transition-colors" data-testid="back-to-browse">
        <ArrowLeft size={14} /> Back to briefs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <HeaderCard project={project} />
          {showSubmissions && (
            <SubmissionsPanel project={project} submissions={submissions} isClient={isClient} reload={load} />
          )}
          {project.status === "completed" && <WinnerPanel project={project} submissions={submissions} />}
        </div>

        <div className="space-y-6">
          {project.status === "in_progress" && project.competition_deadline && (
            <div className="card p-6 tracing-beam">
              <div className="text-[#3B82F6] uppercase tracking-widest text-xs">Showdown ends in</div>
              <div className="mt-4"><Countdown deadline={project.competition_deadline} size="lg" /></div>
            </div>
          )}

          {canApply && !myApp && <ApplyCard projectId={project.id} onApplied={load} />}

          {myApp && <MyApplicationCard application={myApp} />}

          {isAnon && project.status === "open" && (
            <div className="card p-6">
              <p className="text-slate-300">Want to compete?</p>
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
  return <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">{children}</div>;
}

function HeaderCard({ project }) {
  return (
    <div className="card p-8 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.18), transparent 70%)", filter: "blur(20px)" }} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs tracking-widest text-[#3B82F6] uppercase">{project.category}</div>
          <h1 className="font-display text-4xl mt-2 leading-tight tracking-tight">{project.title}</h1>
          <div className="text-sm text-muted mt-2">Posted by {project.client_name || "Anonymous"}</div>
        </div>
        <StatusPill status={project.status} />
      </div>
      <div className="relative mt-6 grid grid-cols-3 gap-4 text-sm">
        <Meta icon={DollarSign} label="Bounty" value={`$${project.budget.toFixed(0)}`} accent="#22C55E" />
        <Meta icon={Clock} label="Window" value={`${project.duration_hours}h`} accent="#3B82F6" />
        <Meta icon={Users} label="Seats" value={project.max_competitors} accent="#A855F7" />
      </div>
      <div className="relative mt-8 text-slate-300 leading-relaxed whitespace-pre-wrap">{project.description}</div>
      {project.deliverables && (
        <div className="relative mt-6 pt-6 border-t border-white/10">
          <div className="text-xs tracking-widest text-muted uppercase mb-2">Deliverables</div>
          <div className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">{project.deliverables}</div>
        </div>
      )}
    </div>
  );
}

function Meta({ icon: I, label, value, accent }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 backdrop-blur-md transition-colors hover:border-white/20">
      <I size={14} style={{ color: accent }} />
      <div className="font-mono text-xl mt-2">{value}</div>
      <div className="text-[10px] tracking-widest text-muted uppercase mt-1">{label}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <div
      className="px-3 py-1 border rounded-full text-[10px] tracking-widest uppercase whitespace-nowrap"
      style={{ color: s.color, borderColor: s.color }}
      data-testid={`project-status-${status}`}
    >
      {s.label}
    </div>
  );
}

function MyApplicationCard({ application }) {
  return (
    <div className="card p-6">
      <div className="text-xs tracking-widest uppercase text-muted">Your application</div>
      <div className="mt-3 font-display text-xl">{APP_STATUS_LABEL[application.status] || application.status}</div>
      <div className="mt-2 text-sm text-muted leading-relaxed">&ldquo;{application.pitch}&rdquo;</div>
    </div>
  );
}

function ApprovedSeats({ applications }) {
  const approved = applications.filter((a) => a.status === "approved");
  return (
    <div className="card p-6 text-sm text-slate-300">
      <div className="text-xs tracking-widest uppercase text-muted mb-3">Approved seats</div>
      <div className="space-y-2">
        {approved.length === 0 && <div className="text-muted">No approved competitors yet.</div>}
        {approved.map((a) => (
          <div key={a.id} className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[#22C55E]" /> {a.user_name}
          </div>
        ))}
      </div>
    </div>
  );
}
