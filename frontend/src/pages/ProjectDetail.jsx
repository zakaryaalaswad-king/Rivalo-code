import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import Countdown from "../components/Countdown";
import { Trophy, DollarSign, Clock, Users, CheckCircle2, XCircle, Send, Crown, ExternalLink } from "lucide-react";
import FileUploader from "../components/FileUploader";

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
          try { setApplications((await api.get(`/projects/${id}/applications`)).data); } catch {}
        }
        if (p.client_id === user.id || p.approved_freelancer_ids?.includes(user.id)) {
          try { setSubmissions((await api.get(`/projects/${id}/submissions`)).data); } catch {}
        }
      }
    } catch (e) { setErr(formatApiError(e)); }
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  if (err) return <Page><div className="text-red-400">{err}</div></Page>;
  if (!project) return <Page><div className="text-slate-500">Loading…</div></Page>;

  const isAnon = !user || user === false;
  const isClient = user && user !== false && project.client_id === user.id;
  const isCompetitor = user && user !== false && project.approved_freelancer_ids?.includes(user.id);
  const myApp = applications.find((a) => a.user_id === user?.id);
  const canApply = !isAnon && !isClient && project.status === "open";

  return (
    <Page>
      <Link to="/browse" className="text-slate-400 hover:text-white text-sm">← Back to briefs</Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0A0C22] border border-white/10 p-8 relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs tracking-widest text-[#8B5CF6] uppercase">{project.category}</div>
                <h1 className="font-display text-4xl mt-2 leading-tight">{project.title}</h1>
                <div className="text-sm text-slate-500 mt-2">Posted by {project.client_name || "Anonymous"}</div>
              </div>
              <StatusPill status={project.status} />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
              <Meta icon={DollarSign} label="Bounty" value={`$${project.budget.toFixed(0)}`} />
              <Meta icon={Clock} label="Window" value={`${project.duration_hours}h`} />
              <Meta icon={Users} label="Seats" value={project.max_competitors} />
            </div>
            <div className="mt-8 text-slate-300 leading-relaxed whitespace-pre-wrap">{project.description}</div>
            {project.deliverables && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="text-xs tracking-widest text-slate-400 uppercase mb-2">Deliverables</div>
                <div className="text-slate-300 whitespace-pre-wrap text-sm">{project.deliverables}</div>
              </div>
            )}
          </div>

          {project.status === "in_progress" && (isClient || isCompetitor) && (
            <SubmissionsPanel project={project} submissions={submissions} isClient={isClient} reload={load} />
          )}
          {project.status === "completed" && (
            <WinnerPanel project={project} submissions={submissions} />
          )}
        </div>

        <div className="space-y-6">
          {project.status === "in_progress" && project.competition_deadline && (
            <div className="bg-[#0A0C22] border border-[#D4AF37]/40 p-6 tracing-beam">
              <div className="text-[#D4AF37] uppercase tracking-widest text-xs">Showdown ends in</div>
              <div className="mt-4"><Countdown deadline={project.competition_deadline} size="lg" /></div>
            </div>
          )}

          {canApply && !myApp && <ApplyCard projectId={project.id} onApplied={load} />}
          {myApp && (
            <div className="bg-[#0A0C22] border border-white/10 p-6">
              <div className="text-xs tracking-widest uppercase text-slate-400">Your application</div>
              <div className="mt-3 font-display text-xl">{statusLabel(myApp.status)}</div>
              <div className="mt-2 text-sm text-slate-400">"{myApp.pitch}"</div>
            </div>
          )}
          {isAnon && project.status === "open" && (
            <div className="bg-[#0A0C22] border border-white/10 p-6">
              <p className="text-slate-300">Want to compete?</p>
              <button onClick={() => nav("/login", { state: { from: `/projects/${project.id}` } })} className="mt-4 w-full bg-[#D4AF37] text-black py-3 font-semibold hover:bg-[#F3E5AB]" data-testid="detail-login-cta">Log in to apply</button>
            </div>
          )}

          {isClient && project.status === "open" && (
            <ApplicantsPanel projectId={project.id} applications={applications} maxApprove={project.max_competitors} reload={load} />
          )}
          {isClient && project.status === "in_progress" && (
            <div className="bg-[#0A0C22] border border-white/10 p-6 text-sm text-slate-300">
              <div className="text-xs tracking-widest uppercase text-slate-400 mb-2">Approved seats</div>
              <div className="space-y-2">
                {applications.filter((a) => a.status === "approved").map((a) => (
                  <div key={a.id} className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#D4AF37]" /> {a.user_name}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}

function Page({ children }) {
  return <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">{children}</div>;
}

function Meta({ icon: I, label, value }) {
  return (
    <div className="bg-[#101230] border border-white/5 p-4">
      <I size={14} className="text-[#D4AF37]" />
      <div className="font-mono text-xl mt-2">{value}</div>
      <div className="text-[10px] tracking-widest text-slate-500 uppercase mt-1">{label}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    draft: { c: "text-slate-400 border-slate-500", t: "Draft" },
    open: { c: "text-[#D4AF37] border-[#D4AF37]", t: "Open · accepting" },
    in_progress: { c: "text-[#8B5CF6] border-[#8B5CF6]", t: "Live competition" },
    completed: { c: "text-green-400 border-green-400", t: "Completed" },
  };
  const s = map[status] || map.draft;
  return <div className={`px-3 py-1 border ${s.c} text-[10px] tracking-widest uppercase whitespace-nowrap`} data-testid={`project-status-${status}`}>{s.t}</div>;
}

function statusLabel(s) {
  return { pending: "Pending review", approved: "Approved — you're in!", rejected: "Not selected" }[s] || s;
}

function ApplyCard({ projectId, onApplied }) {
  const [pitch, setPitch] = useState("");
  const [sample_url, setSample] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try { await api.post(`/projects/${projectId}/apply`, { pitch, sample_url }); onApplied(); }
    catch (e2) { setErr(formatApiError(e2)); }
    finally { setLoading(false); }
  };
  return (
    <form onSubmit={submit} className="bg-[#0A0C22] border border-[#D4AF37]/40 p-6" data-testid="apply-form">
      <div className="text-[#D4AF37] uppercase tracking-widest text-xs">Apply to compete</div>
      <textarea value={pitch} onChange={(e) => setPitch(e.target.value)} required minLength={10} rows={4} placeholder="Why are you the right talent? Show your angle." className="w-full px-4 py-3 mt-4" data-testid="apply-pitch-input" />
      <input value={sample_url} onChange={(e) => setSample(e.target.value)} placeholder="Portfolio / sample URL (optional)" className="w-full px-4 py-3 mt-3" data-testid="apply-sample-input" />
      {err && <div className="text-red-400 text-sm mt-3">{err}</div>}
      <button disabled={loading} className="mt-4 w-full bg-[#D4AF37] text-black py-3 font-semibold hover:bg-[#F3E5AB] disabled:opacity-50" data-testid="apply-submit-btn">{loading ? "Sending…" : "Send application"}</button>
    </form>
  );
}

function ApplicantsPanel({ projectId, applications, maxApprove, reload }) {
  const [selected, setSelected] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : (s.length >= maxApprove ? s : [...s, id]));
  const approve = async () => {
    setErr(""); setLoading(true);
    try { await api.post(`/projects/${projectId}/approve`, { application_ids: selected }); reload(); }
    catch (e2) { setErr(formatApiError(e2)); }
    finally { setLoading(false); }
  };
  return (
    <div className="bg-[#0A0C22] border border-white/10 p-6" data-testid="applicants-panel">
      <div className="text-xs tracking-widest uppercase text-slate-400">Applicants ({applications.length})</div>
      <div className="mt-4 space-y-3 max-h-96 overflow-auto pr-2">
        {applications.length === 0 && <div className="text-slate-500 text-sm">No applicants yet. Hold tight.</div>}
        {applications.map((a) => (
          <label key={a.id} className={`block border p-4 cursor-pointer transition-colors ${selected.includes(a.id) ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-white/10 hover:border-white/30"}`} data-testid={`applicant-${a.id}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{a.user_name}</div>
                <div className="text-xs text-slate-500">{a.user_headline || "Freelancer"}</div>
              </div>
              <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggle(a.id)} data-testid={`applicant-check-${a.id}`} />
            </div>
            <div className="mt-3 text-sm text-slate-300">"{a.pitch}"</div>
            {a.sample_url && <a href={a.sample_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-[#D4AF37]">Sample <ExternalLink size={10} /></a>}
          </label>
        ))}
      </div>
      <div className="mt-4 text-xs text-slate-400">Pick up to {maxApprove}. Approved freelancers get an email and the timer starts.</div>
      {err && <div className="text-red-400 text-sm mt-2">{err}</div>}
      <button disabled={selected.length === 0 || loading} onClick={approve} className="mt-4 w-full bg-[#D4AF37] text-black py-3 font-semibold hover:bg-[#F3E5AB] disabled:opacity-30" data-testid="approve-btn">
        {loading ? "Opening arena…" : `Approve ${selected.length} & start competition`}
      </button>
    </div>
  );
}

function SubmissionsPanel({ project, submissions, isClient, reload }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ description: "", url: "", files: [] });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const mine = submissions.find((s) => s.user_id === user?.id);
  useEffect(() => { if (mine) setForm({ description: mine.description, url: mine.url || "", files: (mine.files || []).map((u) => ({ url: u, filename: u.split("/").pop(), content_type: "" })) }); }, [mine?.id]);
  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try { await api.post(`/projects/${project.id}/submit`, { description: form.description, url: form.url, files: form.files.map((f) => f.url) }); reload(); }
    catch (e2) { setErr(formatApiError(e2)); }
    finally { setLoading(false); }
  };
  const pickWinner = async (sid) => {
    if (!window.confirm("Crown this submission as the winner? The bounty will be released.")) return;
    try { await api.post(`/projects/${project.id}/pick-winner`, { submission_id: sid }); reload(); }
    catch (e2) { alert(formatApiError(e2)); }
  };

  return (
    <div className="bg-[#0A0C22] border border-white/10 p-8" data-testid="submissions-panel">
      <div className="text-xs tracking-widest uppercase text-slate-400">{isClient ? "Submissions" : "Your submission"}</div>
      {!isClient && (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <textarea required minLength={5} rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Walk the client through your work…" className="w-full px-4 py-3" data-testid="submit-desc-input" />
          <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="Link to deliverable (Figma, Drive, GitHub, etc.)" className="w-full px-4 py-3" data-testid="submit-url-input" />
          <FileUploader value={form.files} onChange={(arr) => setForm((f) => ({ ...f, files: arr }))} max={8} />
          {err && <div className="text-red-400 text-sm">{err}</div>}
          <button disabled={loading} className="bg-[#D4AF37] text-black px-6 py-3 font-semibold inline-flex items-center gap-2 hover:bg-[#F3E5AB] disabled:opacity-50" data-testid="submit-work-btn">
            <Send size={14} /> {loading ? "Sending…" : mine ? "Update submission" : "Submit work"}
          </button>
        </form>
      )}
      {isClient && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {submissions.length === 0 && <div className="text-slate-500 text-sm col-span-full">No submissions yet.</div>}
          {submissions.map((s) => (
            <div key={s.id} className="border border-white/10 p-5 bg-[#101230]" data-testid={`submission-${s.id}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{s.user_name}</div>
                  <div className="text-xs text-slate-500">{new Date(s.submitted_at).toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-300 whitespace-pre-wrap">{s.description}</div>
              {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-[#D4AF37]">View deliverable <ExternalLink size={12} /></a>}
              {s.files && s.files.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2" data-testid={`submission-files-${s.id}`}>
                  {s.files.map((u, i) => {
                    const token = localStorage.getItem("ab_token") || "";
                    const full = u.startsWith("http") ? u : `${process.env.REACT_APP_BACKEND_URL}${u}${u.includes("?") ? "&" : "?"}auth=${token}`;
                    return <a key={i} href={full} target="_blank" rel="noreferrer" className="block border border-white/10 bg-[#050614] aspect-square overflow-hidden hover:border-[#D4AF37]"><img src={full} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} /></a>;
                  })}
                </div>
              )}
              <button onClick={() => pickWinner(s.id)} className="mt-4 w-full bg-[#D4AF37] text-black py-2 font-semibold hover:bg-[#F3E5AB] inline-flex items-center justify-center gap-2" data-testid={`pick-winner-${s.id}`}>
                <Crown size={14} /> Crown this winner
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WinnerPanel({ project, submissions }) {
  const winner = submissions.find((s) => s.id === project.winner_submission_id);
  return (
    <div className="bg-[#0A0C22] border border-[#D4AF37]/40 p-8" data-testid="winner-panel">
      <div className="flex items-center gap-3"><Trophy className="text-[#D4AF37]" /> <div className="font-display text-3xl">Winner crowned</div></div>
      {winner ? (
        <div className="mt-6">
          <div className="text-xs tracking-widest uppercase text-slate-400">Champion</div>
          <div className="mt-2 text-2xl font-medium">{winner.user_name}</div>
          <div className="mt-4 text-slate-300 whitespace-pre-wrap">{winner.description}</div>
          {winner.url && <a href={winner.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-[#D4AF37]">View deliverable <ExternalLink size={12} /></a>}
        </div>
      ) : (
        <div className="mt-4 text-slate-400">Winner has been chosen.</div>
      )}
    </div>
  );
}
